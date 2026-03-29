begin;

-- -----------------------------------------------------------------------------
-- Worker orchestration helpers
-- -----------------------------------------------------------------------------
--
-- The base schema already models campaigns, dispatches, recipients, attempts,
-- and receipt RPCs. What it does not do by itself is:
--   1. atomically turn a scheduled campaign into exactly one active dispatch
--   2. atomically lease recipient rows for multiple worker instances
--
-- These helpers fill that gap while keeping the DB as the single contract.

create or replace function public.marketing_begin_campaign_dispatch(
  p_campaign_id uuid,
  p_now timestamptz default now()
)
returns public.marketing_campaign_dispatches
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_campaign public.marketing_campaigns;
  v_dispatch public.marketing_campaign_dispatches;
  v_sender_mailbox_id uuid;
begin
  -- Lock the campaign row so two workers cannot race to create parallel active
  -- dispatches for the same scheduled campaign.
  select *
  into v_campaign
  from public.marketing_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    raise exception 'marketing_campaign % not found', p_campaign_id;
  end if;

  if v_campaign.status <> 'scheduled' then
    return null;
  end if;

  -- Dispatch rows express orchestration state, not recipient claims. The worker
  -- should never create a second active run while one is already queued/sending.
  if exists (
    select 1
    from public.marketing_campaign_dispatches
    where campaign_id = p_campaign_id
      and status in ('queued', 'sending')
  ) then
    return null;
  end if;

  select sm.id
  into v_sender_mailbox_id
  from public.sender_mailboxes sm
  where sm.academy_id = v_campaign.academy_id
    and sm.status = 'active'
  order by
    (sm.normalized_email = public.normalize_email(v_campaign.from_email)) desc,
    sm.is_default desc,
    sm.inserted_at asc
  limit 1;

  -- Flip the campaign to "sending" before inserting the dispatch so all higher-
  -- level reads see that execution has begun.
  update public.marketing_campaigns
  set
    status = 'sending',
    updated_at = now()
  where id = p_campaign_id;

  insert into public.marketing_campaign_dispatches (
    academy_id,
    campaign_id,
    sender_mailbox_id,
    status,
    scheduled_at
  )
  values (
    v_campaign.academy_id,
    v_campaign.id,
    v_sender_mailbox_id,
    'queued',
    coalesce(v_campaign.scheduled_at, p_now)
  )
  returning *
  into v_dispatch;

  return v_dispatch;
end;
$$;

comment on function public.marketing_begin_campaign_dispatch(uuid, timestamptz) is
  'Worker orchestration RPC that transitions one scheduled campaign into an initial queued dispatch row exactly once, while preventing duplicate active dispatches for the same campaign.';

create or replace function public.marketing_lease_sendable_recipients(
  p_limit integer default 10,
  p_lease_seconds integer default 120,
  p_now timestamptz default now()
)
returns table (dispatch_recipient_id uuid)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate_rows as (
    -- `v_marketing_sendable_recipients` tells us which rows are eligible right
    -- now, but the actual lease must happen against the base recipient table.
    select
      rdr.id as dispatch_recipient_id,
      vmsr.effective_sender_mailbox_id
    from public.v_marketing_sendable_recipients vmsr
    join public.marketing_dispatch_recipients rdr
      on rdr.id = vmsr.dispatch_recipient_id
    where vmsr.is_sendable = true
    order by vmsr.eligible_at asc, rdr.inserted_at asc
    for update of rdr skip locked
    limit greatest(coalesce(p_limit, 0), 0)
  ),
  leased_rows as (
    -- Leases are recipient-level only. Campaigns and dispatches remain pure
    -- lifecycle state objects without lease metadata.
    update public.marketing_dispatch_recipients rdr
    set
      status = 'leased',
      leased_at = p_now,
      lease_expires_at = p_now + make_interval(secs => greatest(coalesce(p_lease_seconds, 1), 1)),
      sender_mailbox_id = coalesce(rdr.sender_mailbox_id, cr.effective_sender_mailbox_id),
      updated_at = now()
    from candidate_rows cr
    where rdr.id = cr.dispatch_recipient_id
    returning rdr.id
  )
  select id as dispatch_recipient_id
  from leased_rows;
end;
$$;

comment on function public.marketing_lease_sendable_recipients(integer, integer, timestamptz) is
  'Worker leasing RPC for recipient-level queue claims. It atomically locks sendable recipient rows, marks them leased with an expiry, and returns the claimed recipient ids for subsequent delivery work.';

commit;

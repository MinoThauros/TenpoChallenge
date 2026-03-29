begin;

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table public.credentials enable row level security;
alter table public.sender_mailboxes enable row level security;
alter table public.marketing_campaign_dispatches enable row level security;
alter table public.marketing_dispatch_recipients enable row level security;
alter table public.marketing_email_send_attempts enable row level security;

drop policy if exists credentials_user_access
  on public.credentials;

create policy credentials_user_access
on public.credentials
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists sender_mailboxes_academy_access
  on public.sender_mailboxes;

create policy sender_mailboxes_academy_access
on public.sender_mailboxes
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

drop policy if exists marketing_campaign_dispatches_academy_access
  on public.marketing_campaign_dispatches;

create policy marketing_campaign_dispatches_academy_access
on public.marketing_campaign_dispatches
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

drop policy if exists marketing_dispatch_recipients_academy_access
  on public.marketing_dispatch_recipients;

create policy marketing_dispatch_recipients_academy_access
on public.marketing_dispatch_recipients
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

drop policy if exists marketing_email_send_attempts_academy_access
  on public.marketing_email_send_attempts;

create policy marketing_email_send_attempts_academy_access
on public.marketing_email_send_attempts
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

alter view public.v_marketing_campaign_dispatch_state
set (security_invoker = true);

alter view public.v_marketing_sendable_recipients
set (security_invoker = true);

-- -----------------------------------------------------------------------------
-- Delivery receipt RPCs
-- -----------------------------------------------------------------------------

-- Marks one recipient as successfully sent, records an immutable attempt row,
-- and advances the mailbox pacing timestamp. The worker should call this after
-- the provider confirms the message was accepted for delivery.
create or replace function public.marketing_receipt_email_sent(
  p_dispatch_recipient_id uuid,
  p_provider_message_id text default null,
  p_completed_at timestamptz default now()
)
returns public.marketing_dispatch_recipients
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_recipient public.marketing_dispatch_recipients;
  v_attempt_no integer;
  v_requested_at timestamptz;
  v_effective_sender_mailbox_id uuid;
begin
  select *
  into v_recipient
  from public.marketing_dispatch_recipients
  where id = p_dispatch_recipient_id
  for update;

  if not found then
    raise exception 'marketing_dispatch_recipient % not found', p_dispatch_recipient_id;
  end if;

  v_attempt_no := v_recipient.attempt_count + 1;
  v_requested_at := coalesce(v_recipient.leased_at, now());

  select coalesce(v_recipient.sender_mailbox_id, mcd.sender_mailbox_id)
  into v_effective_sender_mailbox_id
  from public.marketing_campaign_dispatches mcd
  where mcd.id = v_recipient.dispatch_id;

  update public.marketing_dispatch_recipients
  set
    status = 'sent',
    sent_at = coalesce(p_completed_at, now()),
    leased_at = null,
    lease_expires_at = null,
    attempt_count = v_attempt_no,
    next_retry_at = null,
    last_error_message = null,
    provider_message_id = coalesce(p_provider_message_id, provider_message_id),
    updated_at = now()
  where id = p_dispatch_recipient_id
  returning *
  into v_recipient;

  insert into public.marketing_email_send_attempts (
    academy_id,
    dispatch_id,
    dispatch_recipient_id,
    sender_mailbox_id,
    attempt_no,
    status,
    requested_at,
    completed_at,
    provider_message_id,
    error_message
  )
  values (
    v_recipient.academy_id,
    v_recipient.dispatch_id,
    v_recipient.id,
    v_effective_sender_mailbox_id,
    v_attempt_no,
    'sent',
    v_requested_at,
    coalesce(p_completed_at, now()),
    coalesce(p_provider_message_id, v_recipient.provider_message_id),
    null
  );

  if v_effective_sender_mailbox_id is not null then
    update public.sender_mailboxes
    set
      last_sent_at = coalesce(p_completed_at, now()),
      updated_at = now()
    where id = v_effective_sender_mailbox_id;
  end if;

  return v_recipient;
end;
$$;

comment on function public.marketing_receipt_email_sent(uuid, text, timestamptz) is
  'Worker receipt RPC for successful delivery. It updates the recipient row, appends a send-attempt record, and advances mailbox pacing so future eligibility queries stay below the mailbox quota.';

-- Marks one recipient as failed, optionally schedules a retry, and records the
-- failure in the append-only attempts table. Passing a null retry_after marks
-- the recipient as terminally failed instead of retryable.
create or replace function public.marketing_receipt_email_failed(
  p_dispatch_recipient_id uuid,
  p_error_message text,
  p_retry_after timestamptz default null,
  p_completed_at timestamptz default now()
)
returns public.marketing_dispatch_recipients
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_recipient public.marketing_dispatch_recipients;
  v_attempt_no integer;
  v_requested_at timestamptz;
  v_effective_sender_mailbox_id uuid;
  v_next_status text;
begin
  select *
  into v_recipient
  from public.marketing_dispatch_recipients
  where id = p_dispatch_recipient_id
  for update;

  if not found then
    raise exception 'marketing_dispatch_recipient % not found', p_dispatch_recipient_id;
  end if;

  v_attempt_no := v_recipient.attempt_count + 1;
  v_requested_at := coalesce(v_recipient.leased_at, now());
  v_next_status := case
    when p_retry_after is null then 'failed'
    else 'retry_scheduled'
  end;

  select coalesce(v_recipient.sender_mailbox_id, mcd.sender_mailbox_id)
  into v_effective_sender_mailbox_id
  from public.marketing_campaign_dispatches mcd
  where mcd.id = v_recipient.dispatch_id;

  update public.marketing_dispatch_recipients
  set
    status = v_next_status,
    leased_at = null,
    lease_expires_at = null,
    attempt_count = v_attempt_no,
    next_retry_at = p_retry_after,
    last_error_message = p_error_message,
    updated_at = now()
  where id = p_dispatch_recipient_id
  returning *
  into v_recipient;

  insert into public.marketing_email_send_attempts (
    academy_id,
    dispatch_id,
    dispatch_recipient_id,
    sender_mailbox_id,
    attempt_no,
    status,
    requested_at,
    completed_at,
    retry_after,
    provider_message_id,
    error_message
  )
  values (
    v_recipient.academy_id,
    v_recipient.dispatch_id,
    v_recipient.id,
    v_effective_sender_mailbox_id,
    v_attempt_no,
    v_next_status,
    v_requested_at,
    coalesce(p_completed_at, now()),
    p_retry_after,
    v_recipient.provider_message_id,
    p_error_message
  );

  return v_recipient;
end;
$$;

comment on function public.marketing_receipt_email_failed(uuid, text, timestamptz, timestamptz) is
  'Worker receipt RPC for failed delivery. It preserves the failure reason on the recipient row, appends a detailed attempt record, and optionally schedules the next retry timestamp.';

-- Marks a dispatch run as finished once the worker has no more actionable
-- recipients. The completion guard prevents a dispatch from being marked
-- complete while pending or retryable recipients still exist.
create or replace function public.marketing_receipt_campaign_done(
  p_dispatch_id uuid,
  p_status text default 'completed',
  p_finished_at timestamptz default now()
)
returns public.marketing_campaign_dispatches
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_dispatch public.marketing_campaign_dispatches;
  v_has_open_recipients boolean;
begin
  if p_status not in ('completed', 'failed', 'canceled') then
    raise exception 'invalid final dispatch status: %', p_status;
  end if;

  if p_status = 'completed' then
    select exists (
      select 1
      from public.marketing_dispatch_recipients
      where dispatch_id = p_dispatch_id
        and status in ('pending', 'leased', 'retry_scheduled')
    )
    into v_has_open_recipients;

    if v_has_open_recipients then
      raise exception 'dispatch % still has open recipients', p_dispatch_id;
    end if;
  end if;

  update public.marketing_campaign_dispatches
  set
    status = p_status,
    finished_at = coalesce(p_finished_at, now()),
    updated_at = now()
  where id = p_dispatch_id
  returning *
  into v_dispatch;

  if not found then
    raise exception 'marketing_campaign_dispatch % not found', p_dispatch_id;
  end if;

  return v_dispatch;
end;
$$;

comment on function public.marketing_receipt_campaign_done(uuid, text, timestamptz) is
  'Worker receipt RPC for dispatch completion. It transitions the dispatch to a terminal state once no actionable recipients remain, giving the UI a clear run-level completion signal.';

commit;

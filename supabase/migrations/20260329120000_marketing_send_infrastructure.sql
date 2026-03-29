begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Send infrastructure tables
-- -----------------------------------------------------------------------------
--
-- This migration adds the smallest durable email-delivery substrate that still
-- lets the product answer the questions a marketing UI eventually cares about:
--   - Which mailbox can this academy send from?
--   - Which dispatch run is currently in progress for a campaign?
--   - For each recipient, was the message sent, skipped, retried, or failed?
--   - What happened on each attempt when something went wrong?
--
-- The worker itself will live outside this app, but keeping the data model in
-- the same schema lets the current dashboard read campaign delivery state
-- without introducing a second source of truth.

-- -----------------------------------------------------------------------------
-- Credentials
-- -----------------------------------------------------------------------------

create table if not exists public.credentials (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  access_token text null,
  refresh_token text null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  provider text null,
  provider_access_token text null,
  provider_refresh_token text null,
  constraint credentials_pkey primary key (id),
  constraint credentials_user_id_key unique (user_id),
  constraint credentials_user_id_fkey
    foreign key (user_id)
    references auth.users (id)
    on delete cascade
);

comment on table public.credentials is
  'OAuth credential store for the sending infrastructure. Each row represents the authenticated provider tokens for one user account that can authorize outbound marketing mail.';

comment on column public.credentials.user_id is
  'Owner of the provider credentials. The MVP assumes one credential record per user, which keeps the browser-side auth story simple.';

comment on column public.credentials.provider is
  'Human-readable provider identifier such as Google or Microsoft. The schema intentionally keeps this flexible during the MVP phase.';

comment on column public.credentials.provider_access_token is
  'Provider-native access token when the upstream provider distinguishes between our session token and the delegated provider token.';

create index if not exists credentials_provider_idx
  on public.credentials (provider, inserted_at desc);

drop trigger if exists set_updated_at_on_credentials
  on public.credentials;

create trigger set_updated_at_on_credentials
before update on public.credentials
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sender mailboxes
-- -----------------------------------------------------------------------------

create table if not exists public.sender_mailboxes (
  id uuid not null default gen_random_uuid(),
  academy_id uuid not null,
  credential_id uuid not null,
  email text not null check (length(trim(email)) > 0),
  normalized_email text generated always as (public.normalize_email(email)) stored,
  display_name text null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'error')),
  is_default boolean not null default false,
  min_interval_seconds integer not null default 5 check (min_interval_seconds > 0),
  last_sent_at timestamptz null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sender_mailboxes_pkey primary key (id),
  constraint sender_mailboxes_academy_email_key unique (academy_id, normalized_email),
  constraint sender_mailboxes_credential_id_fkey
    foreign key (credential_id)
    references public.credentials (id)
    on delete cascade
);

comment on table public.sender_mailboxes is
  'Mailbox catalog for outbound sending. A mailbox belongs to one academy, points at one OAuth credential record, and carries the lightweight pacing metadata the worker needs.';

comment on column public.sender_mailboxes.min_interval_seconds is
  'Per-mailbox throttle floor. The worker should not deliver more frequently than this interval for the same mailbox.';

comment on column public.sender_mailboxes.last_sent_at is
  'Most recent successful send timestamp for this mailbox. The worker can consult this to stay below provider quotas without maintaining a second runtime state table.';

create unique index if not exists sender_mailboxes_default_uidx
  on public.sender_mailboxes (academy_id)
  where is_default = true;

create index if not exists sender_mailboxes_academy_status_idx
  on public.sender_mailboxes (academy_id, status, inserted_at desc);

drop trigger if exists set_updated_at_on_sender_mailboxes
  on public.sender_mailboxes;

create trigger set_updated_at_on_sender_mailboxes
before update on public.sender_mailboxes
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Campaign dispatches
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_campaign_dispatches (
  id uuid not null default gen_random_uuid(),
  academy_id uuid not null,
  campaign_id uuid not null,
  sender_mailbox_id uuid null,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'completed', 'failed', 'canceled')),
  scheduled_at timestamptz null,
  started_at timestamptz null,
  finished_at timestamptz null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_campaign_dispatches_pkey primary key (id),
  constraint marketing_campaign_dispatches_campaign_id_fkey
    foreign key (campaign_id)
    references public.marketing_campaigns (id)
    on delete cascade,
  constraint marketing_campaign_dispatches_sender_mailbox_id_fkey
    foreign key (sender_mailbox_id)
    references public.sender_mailboxes (id)
    on delete set null
);

comment on table public.marketing_campaign_dispatches is
  'One row per delivery run for a campaign. This is the coarse-grained lifecycle record the dashboard can poll while the external sending worker processes recipients.';

comment on column public.marketing_campaign_dispatches.status is
  'High-level dispatch lifecycle. Recipient-level truth lives in marketing_dispatch_recipients, while this status reflects the run as a whole.';

create index if not exists marketing_campaign_dispatches_academy_status_idx
  on public.marketing_campaign_dispatches (academy_id, status, scheduled_at, inserted_at desc);

create index if not exists marketing_campaign_dispatches_campaign_idx
  on public.marketing_campaign_dispatches (campaign_id, inserted_at desc);

drop trigger if exists set_updated_at_on_marketing_campaign_dispatches
  on public.marketing_campaign_dispatches;

create trigger set_updated_at_on_marketing_campaign_dispatches
before update on public.marketing_campaign_dispatches
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Dispatch recipients
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_dispatch_recipients (
  id uuid not null default gen_random_uuid(),
  academy_id uuid not null,
  campaign_id uuid not null,
  dispatch_id uuid not null,
  marketing_contact_id uuid not null,
  sender_mailbox_id uuid null,
  to_email text not null check (length(trim(to_email)) > 0),
  normalized_email text generated always as (public.normalize_email(to_email)) stored,
  status text not null default 'pending'
    check (status in ('pending', 'leased', 'sent', 'retry_scheduled', 'failed', 'suppressed', 'canceled')),
  send_after timestamptz not null default now(),
  leased_at timestamptz null,
  lease_expires_at timestamptz null,
  sent_at timestamptz null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_retry_at timestamptz null,
  last_error_message text null,
  provider_message_id text null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_dispatch_recipients_pkey primary key (id),
  constraint marketing_dispatch_recipients_dispatch_contact_key unique (dispatch_id, marketing_contact_id),
  constraint marketing_dispatch_recipients_campaign_id_fkey
    foreign key (campaign_id)
    references public.marketing_campaigns (id)
    on delete cascade,
  constraint marketing_dispatch_recipients_dispatch_id_fkey
    foreign key (dispatch_id)
    references public.marketing_campaign_dispatches (id)
    on delete cascade,
  constraint marketing_dispatch_recipients_marketing_contact_id_fkey
    foreign key (marketing_contact_id)
    references public.marketing_contacts (id)
    on delete cascade,
  constraint marketing_dispatch_recipients_sender_mailbox_id_fkey
    foreign key (sender_mailbox_id)
    references public.sender_mailboxes (id)
    on delete set null
);

comment on table public.marketing_dispatch_recipients is
  'Recipient ledger for each dispatch run. This is the durable per-contact state table that answers whether a message is pending, leased by a worker, sent, suppressed, or failed.';

comment on column public.marketing_dispatch_recipients.lease_expires_at is
  'Crash-recovery boundary for a leased recipient. If a worker dies mid-send, another worker can treat an expired lease as available again.';

comment on column public.marketing_dispatch_recipients.last_error_message is
  'Human-readable reason the most recent attempt failed. This gives the UI enough context to explain why a recipient needs manual retry.';

create index if not exists marketing_dispatch_recipients_status_send_after_idx
  on public.marketing_dispatch_recipients (status, send_after);

create index if not exists marketing_dispatch_recipients_status_retry_idx
  on public.marketing_dispatch_recipients (status, next_retry_at);

create index if not exists marketing_dispatch_recipients_academy_status_idx
  on public.marketing_dispatch_recipients (academy_id, status, send_after);

create index if not exists marketing_dispatch_recipients_dispatch_status_idx
  on public.marketing_dispatch_recipients (dispatch_id, status, inserted_at);

drop trigger if exists set_updated_at_on_marketing_dispatch_recipients
  on public.marketing_dispatch_recipients;

create trigger set_updated_at_on_marketing_dispatch_recipients
before update on public.marketing_dispatch_recipients
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Send attempts
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_email_send_attempts (
  id uuid not null default gen_random_uuid(),
  academy_id uuid not null,
  dispatch_id uuid not null,
  dispatch_recipient_id uuid not null,
  sender_mailbox_id uuid null,
  attempt_no integer not null check (attempt_no > 0),
  status text not null
    check (status in ('started', 'sent', 'failed', 'retry_scheduled', 'canceled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz null,
  retry_after timestamptz null,
  provider_message_id text null,
  error_message text null,
  inserted_at timestamptz not null default now(),
  constraint marketing_email_send_attempts_pkey primary key (id),
  constraint marketing_email_send_attempts_recipient_attempt_key unique (dispatch_recipient_id, attempt_no),
  constraint marketing_email_send_attempts_dispatch_id_fkey
    foreign key (dispatch_id)
    references public.marketing_campaign_dispatches (id)
    on delete cascade,
  constraint marketing_email_send_attempts_dispatch_recipient_id_fkey
    foreign key (dispatch_recipient_id)
    references public.marketing_dispatch_recipients (id)
    on delete cascade,
  constraint marketing_email_send_attempts_sender_mailbox_id_fkey
    foreign key (sender_mailbox_id)
    references public.sender_mailboxes (id)
    on delete set null
);

comment on table public.marketing_email_send_attempts is
  'Append-only attempt history for recipient delivery. The recipient row stores the latest state, while this table preserves the chronological audit trail for debugging and manual support.';

comment on column public.marketing_email_send_attempts.retry_after is
  'Next requested retry time chosen by the worker after a transient failure. Null means the failure is terminal.';

create index if not exists marketing_email_send_attempts_dispatch_idx
  on public.marketing_email_send_attempts (dispatch_id, requested_at desc);

create index if not exists marketing_email_send_attempts_recipient_idx
  on public.marketing_email_send_attempts (dispatch_recipient_id, requested_at desc);

create index if not exists marketing_email_send_attempts_academy_status_idx
  on public.marketing_email_send_attempts (academy_id, status, requested_at desc);

-- -----------------------------------------------------------------------------
-- Read views
-- -----------------------------------------------------------------------------

create or replace view public.v_marketing_campaign_dispatch_state as
with recipient_stats as (
  select
    dispatch_id,
    count(*) as total_recipients,
    count(*) filter (where status = 'pending') as pending_recipients,
    count(*) filter (where status = 'leased') as leased_recipients,
    count(*) filter (where status = 'sent') as sent_recipients,
    count(*) filter (where status = 'retry_scheduled') as retry_scheduled_recipients,
    count(*) filter (where status = 'failed') as failed_recipients,
    count(*) filter (where status = 'suppressed') as suppressed_recipients,
    count(*) filter (where status = 'canceled') as canceled_recipients,
    max(sent_at) as last_sent_at
  from public.marketing_dispatch_recipients
  group by dispatch_id
),
attempt_stats as (
  select
    dispatch_id,
    count(*) as total_attempts,
    max(requested_at) as last_attempted_at
  from public.marketing_email_send_attempts
  group by dispatch_id
)
select
  d.id as dispatch_id,
  d.academy_id,
  d.campaign_id,
  d.sender_mailbox_id,
  d.status as dispatch_status,
  d.scheduled_at,
  d.started_at,
  d.finished_at,
  d.inserted_at,
  d.updated_at,
  coalesce(r.total_recipients, 0) as total_recipients,
  coalesce(r.pending_recipients, 0) as pending_recipients,
  coalesce(r.leased_recipients, 0) as leased_recipients,
  coalesce(r.sent_recipients, 0) as sent_recipients,
  coalesce(r.retry_scheduled_recipients, 0) as retry_scheduled_recipients,
  coalesce(r.failed_recipients, 0) as failed_recipients,
  coalesce(r.suppressed_recipients, 0) as suppressed_recipients,
  coalesce(r.canceled_recipients, 0) as canceled_recipients,
  coalesce(a.total_attempts, 0) as total_attempts,
  a.last_attempted_at,
  r.last_sent_at,
  case
    when coalesce(r.total_recipients, 0) = 0 then 0::numeric
    else round((coalesce(r.sent_recipients, 0)::numeric / r.total_recipients::numeric) * 100, 2)
  end as sent_percent
from public.marketing_campaign_dispatches d
left join recipient_stats r
  on r.dispatch_id = d.id
left join attempt_stats a
  on a.dispatch_id = d.id;

comment on view public.v_marketing_campaign_dispatch_state is
  'Dashboard-friendly rollup of dispatch progress. This view exposes one row per dispatch with aggregate recipient counts, last-attempt timestamps, and overall completion percentage.';

create or replace view public.v_marketing_sendable_recipients as
with effective_rows as (
  select
    rdr.id as dispatch_recipient_id,
    rdr.academy_id,
    rdr.campaign_id,
    rdr.dispatch_id,
    rdr.marketing_contact_id,
    rdr.to_email,
    rdr.normalized_email,
    rdr.status as recipient_status,
    rdr.send_after,
    rdr.next_retry_at,
    rdr.leased_at,
    rdr.lease_expires_at,
    rdr.attempt_count,
    rdr.last_error_message,
    rdr.provider_message_id,
    coalesce(rdr.sender_mailbox_id, mcd.sender_mailbox_id) as effective_sender_mailbox_id,
    mcd.status as dispatch_status,
    mc.subject,
    mc.preview_text,
    mc.body_html,
    mc.body_text,
    mc.from_name,
    mc.from_email,
    mc.reply_to_email
  from public.marketing_dispatch_recipients rdr
  join public.marketing_campaign_dispatches mcd
    on mcd.id = rdr.dispatch_id
  join public.marketing_campaigns mc
    on mc.id = rdr.campaign_id
  where (
      rdr.status in ('pending', 'retry_scheduled')
      or (
        rdr.status = 'leased'
        and rdr.lease_expires_at is not null
        and rdr.lease_expires_at <= now()
      )
    )
    and mcd.status in ('queued', 'sending')
)
select
  er.*,
  sm.email as sender_mailbox_email,
  sm.status as sender_mailbox_status,
  sm.last_sent_at as mailbox_last_sent_at,
  greatest(
    coalesce(er.next_retry_at, er.send_after),
    coalesce(sm.last_sent_at + make_interval(secs => sm.min_interval_seconds), '-infinity'::timestamptz)
  ) as eligible_at,
  (
    er.effective_sender_mailbox_id is not null
    and sm.status = 'active'
    and coalesce(er.next_retry_at, er.send_after) <= now()
    and (
      sm.last_sent_at is null
      or sm.last_sent_at <= now() - make_interval(secs => sm.min_interval_seconds)
    )
  ) as is_sendable
from effective_rows er
left join public.sender_mailboxes sm
  on sm.id = er.effective_sender_mailbox_id;

comment on view public.v_marketing_sendable_recipients is
  'Read-only candidate list for the external worker. It exposes which recipients are currently eligible to send based on recipient timing plus mailbox pacing, without performing any locking or leasing itself.';

commit;

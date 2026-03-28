begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.normalize_email(input text)
returns text
language sql
immutable
strict
as $$
  select lower(trim(input));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Import batches
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_import_batches (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  uploaded_by_user_id uuid null,
  source_provider text not null default 'csv'
    check (source_provider in ('csv', 'mailchimp', 'mailerlite', 'constant_contact', 'other')),
  file_name text not null,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  merged_rows integer not null default 0 check (merged_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  error_message text null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_import_batches_academy_created_idx
  on public.marketing_import_batches (academy_id, created_at desc);

drop trigger if exists set_updated_at_on_marketing_import_batches
  on public.marketing_import_batches;

create trigger set_updated_at_on_marketing_import_batches
before update on public.marketing_import_batches
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contacts
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  email text not null check (length(trim(email)) > 0),
  normalized_email text generated always as (public.normalize_email(email)) stored,
  first_name text null,
  last_name text null,
  created_via text not null default 'tenpo'
    check (created_via in ('tenpo', 'import', 'manual')),
  import_batch_id uuid null references public.marketing_import_batches (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint marketing_contacts_academy_email_key unique (academy_id, normalized_email),
  constraint marketing_contacts_id_academy_key unique (id, academy_id)
);

create index if not exists marketing_contacts_academy_idx
  on public.marketing_contacts (academy_id);

create index if not exists marketing_contacts_academy_created_via_idx
  on public.marketing_contacts (academy_id, created_via);

drop trigger if exists set_updated_at_on_marketing_contacts
  on public.marketing_contacts;

create trigger set_updated_at_on_marketing_contacts
before update on public.marketing_contacts
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contact athletes
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_contact_athletes (
  academy_id uuid not null,
  marketing_contact_id uuid not null,
  athlete_id uuid not null,
  relationship_type text null
    check (relationship_type in ('parent', 'guardian', 'other')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (academy_id, marketing_contact_id, athlete_id),
  constraint marketing_contact_athletes_contact_fk
    foreign key (marketing_contact_id, academy_id)
    references public.marketing_contacts (id, academy_id)
    on delete cascade
);

create index if not exists marketing_contact_athletes_academy_athlete_idx
  on public.marketing_contact_athletes (academy_id, athlete_id);

-- -----------------------------------------------------------------------------
-- Event snapshots
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_events (
  academy_id uuid not null,
  event_id uuid not null,
  season_id uuid null,
  name text not null,
  event_type text null,
  starts_at timestamptz null,
  ends_at timestamptz null,
  status text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (academy_id, event_id)
);

create index if not exists marketing_events_academy_season_idx
  on public.marketing_events (academy_id, season_id);

create index if not exists marketing_events_academy_starts_at_idx
  on public.marketing_events (academy_id, starts_at desc);

drop trigger if exists set_updated_at_on_marketing_events
  on public.marketing_events;

create trigger set_updated_at_on_marketing_events
before update on public.marketing_events
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Registration facts
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_registrations (
  academy_id uuid not null,
  registration_id uuid not null,
  event_id uuid not null,
  athlete_id uuid not null,
  registration_status text not null
    check (registration_status in ('pending', 'completed', 'waitlisted', 'canceled', 'refunded')),
  attendance_status text null
    check (attendance_status in ('unknown', 'attended', 'absent', 'no_show', 'canceled')),
  registered_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (academy_id, registration_id),
  constraint marketing_registrations_event_fk
    foreign key (academy_id, event_id)
    references public.marketing_events (academy_id, event_id)
    on delete cascade
);

create index if not exists marketing_registrations_academy_event_idx
  on public.marketing_registrations (academy_id, event_id);

create index if not exists marketing_registrations_academy_athlete_idx
  on public.marketing_registrations (academy_id, athlete_id);

create index if not exists marketing_registrations_academy_status_idx
  on public.marketing_registrations (academy_id, registration_status);

drop trigger if exists set_updated_at_on_marketing_registrations
  on public.marketing_registrations;

create trigger set_updated_at_on_marketing_registrations
before update on public.marketing_registrations
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Successful transaction facts
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_successful_transactions (
  academy_id uuid not null,
  payment_id uuid not null,
  registration_id uuid null,
  event_id uuid not null,
  athlete_id uuid not null,
  paid_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (academy_id, payment_id),
  constraint marketing_successful_transactions_event_fk
    foreign key (academy_id, event_id)
    references public.marketing_events (academy_id, event_id)
    on delete cascade,
  constraint marketing_successful_transactions_registration_fk
    foreign key (academy_id, registration_id)
    references public.marketing_registrations (academy_id, registration_id)
    on delete set null
);

create index if not exists marketing_successful_transactions_academy_event_idx
  on public.marketing_successful_transactions (academy_id, event_id);

create index if not exists marketing_successful_transactions_academy_athlete_idx
  on public.marketing_successful_transactions (academy_id, athlete_id);

create index if not exists marketing_successful_transactions_academy_paid_at_idx
  on public.marketing_successful_transactions (academy_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- Suppressions
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_suppressions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  email text not null check (length(trim(email)) > 0),
  normalized_email text generated always as (public.normalize_email(email)) stored,
  reason text not null
    check (reason in ('unsubscribe', 'bounce', 'complaint', 'manual')),
  source text not null default 'system'
    check (source in ('user', 'system', 'provider', 'import')),
  note text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint marketing_suppressions_academy_email_key unique (academy_id, normalized_email)
);

create index if not exists marketing_suppressions_academy_reason_idx
  on public.marketing_suppressions (academy_id, reason);

-- -----------------------------------------------------------------------------
-- Campaigns
-- -----------------------------------------------------------------------------

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  name text not null,
  subject text not null,
  preview_text text null,
  body_html text not null default '',
  body_text text null,
  from_name text null,
  from_email text not null,
  reply_to_email text null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled')),
  audience_definition jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz null,
  sent_at timestamptz null,
  created_by_user_id uuid null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_campaigns_academy_status_idx
  on public.marketing_campaigns (academy_id, status, created_at desc);

drop trigger if exists set_updated_at_on_marketing_campaigns
  on public.marketing_campaigns;

create trigger set_updated_at_on_marketing_campaigns
before update on public.marketing_campaigns
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Segmentation views
-- -----------------------------------------------------------------------------

-- This view is the default audience-building surface for the marketing UI.
-- It stays at one row per contact so the product can answer the most common
-- targeting questions without forcing admins to think in terms of athletes,
-- registrations, or payments:
--   - Is this contact marketable or suppressed?
--   - Was this contact imported or created through Tenpo activity?
--   - Is this a family with one athlete or multiple athletes?
--   - Has this family ever registered, paid, or gone inactive?
--
-- We keep the view stateless and derived from current tables instead of storing
-- segment membership. That keeps audiences fresh as new registrations, payments,
-- and suppressions arrive, which is exactly what we want for reusable filters
-- and saved segments in the dashboard.
create or replace view public.v_marketing_contact_segment_facts as
with athlete_links as (
  select
    mca.academy_id,
    mca.marketing_contact_id,
    count(distinct mca.athlete_id) as athlete_count
  from public.marketing_contact_athletes mca
  group by mca.academy_id, mca.marketing_contact_id
),
registration_stats as (
  select
    mca.academy_id,
    mca.marketing_contact_id,
    count(distinct mr.registration_id) as total_registrations,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'waitlisted') as waitlisted_registrations_count,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'canceled') as canceled_registrations_count,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'refunded') as refunded_registrations_count,
    count(distinct mr.registration_id) filter (where mr.attendance_status = 'attended') as attended_registrations_count,
    min(mr.registered_at) as first_registered_at,
    max(mr.registered_at) as last_registered_at
  from public.marketing_contact_athletes mca
  join public.marketing_registrations mr
    on mr.academy_id = mca.academy_id
   and mr.athlete_id = mca.athlete_id
  group by mca.academy_id, mca.marketing_contact_id
),
payment_stats as (
  select
    mca.academy_id,
    mca.marketing_contact_id,
    count(distinct mst.payment_id) as total_successful_transactions,
    max(mst.paid_at) as last_paid_at
  from public.marketing_contact_athletes mca
  join public.marketing_successful_transactions mst
    on mst.academy_id = mca.academy_id
   and mst.athlete_id = mca.athlete_id
  group by mca.academy_id, mca.marketing_contact_id
)
select
  mc.academy_id,
  mc.id as marketing_contact_id,
  mc.email,
  mc.normalized_email,
  mc.first_name,
  mc.last_name,
  mc.created_via,
  mc.import_batch_id,
  mc.created_at,
  mc.updated_at,
  coalesce(al.athlete_count, 0) as athlete_count,
  (coalesce(al.athlete_count, 0) > 0) as has_linked_athlete,
  (coalesce(al.athlete_count, 0) > 1) as has_multiple_athletes,
  coalesce(rs.total_registrations, 0) as total_registrations,
  coalesce(ps.total_successful_transactions, 0) as total_successful_transactions,
  coalesce(rs.waitlisted_registrations_count, 0) as waitlisted_registrations_count,
  coalesce(rs.canceled_registrations_count, 0) as canceled_registrations_count,
  coalesce(rs.refunded_registrations_count, 0) as refunded_registrations_count,
  coalesce(rs.attended_registrations_count, 0) as attended_registrations_count,
  (coalesce(rs.total_registrations, 0) > 0) as registered_ever,
  (coalesce(ps.total_successful_transactions, 0) > 0) as paid_ever,
  (coalesce(rs.total_registrations, 0) > 0 and coalesce(ps.total_successful_transactions, 0) = 0) as registered_but_never_paid,
  rs.first_registered_at,
  rs.last_registered_at,
  ps.last_paid_at,
  coalesce(rs.last_registered_at >= now() - interval '30 days', false) as registered_in_last_30d,
  coalesce(rs.last_registered_at >= now() - interval '60 days', false) as registered_in_last_60d,
  coalesce(rs.last_registered_at >= now() - interval '90 days', false) as registered_in_last_90d,
  coalesce(coalesce(rs.total_registrations, 0) > 0 and rs.last_registered_at < now() - interval '90 days', false) as inactive_90d,
  coalesce(coalesce(rs.total_registrations, 0) > 0 and rs.last_registered_at < now() - interval '180 days', false) as inactive_180d,
  (ms.id is not null) as is_suppressed,
  ms.reason as suppression_reason
from public.marketing_contacts mc
left join athlete_links al
  on al.academy_id = mc.academy_id
 and al.marketing_contact_id = mc.id
left join registration_stats rs
  on rs.academy_id = mc.academy_id
 and rs.marketing_contact_id = mc.id
left join payment_stats ps
  on ps.academy_id = mc.academy_id
 and ps.marketing_contact_id = mc.id
left join public.marketing_suppressions ms
  on ms.academy_id = mc.academy_id
 and ms.normalized_email = mc.normalized_email;

-- This companion view exists for event-specific targeting. The contact-level
-- view above is great for broad segments, but it cannot cleanly answer
-- questions like:
--   - Who attended last summer camp?
--   - Who registered for Event X but never paid?
--   - Which contacts are tied to a specific event or season?
--
-- We keep the grain at one row per contact per event so the UI can layer
-- precise event filters on top of the broader contact audience model without
-- collapsing everything into one oversized rollup. Like the contact view, this
-- is derived from current state rather than storing static membership.
create or replace view public.v_marketing_contact_event_segment_facts as
with registration_event_stats as (
  select
    mca.academy_id,
    mca.marketing_contact_id,
    mr.event_id,
    count(distinct mr.registration_id) as total_registrations,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'waitlisted') as waitlisted_registrations_count,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'canceled') as canceled_registrations_count,
    count(distinct mr.registration_id) filter (where mr.registration_status = 'refunded') as refunded_registrations_count,
    count(distinct mr.registration_id) filter (where mr.attendance_status = 'attended') as attended_registrations_count,
    min(mr.registered_at) as first_registered_at,
    max(mr.registered_at) as last_registered_at
  from public.marketing_contact_athletes mca
  join public.marketing_registrations mr
    on mr.academy_id = mca.academy_id
   and mr.athlete_id = mca.athlete_id
  group by mca.academy_id, mca.marketing_contact_id, mr.event_id
),
payment_event_stats as (
  select
    mca.academy_id,
    mca.marketing_contact_id,
    mst.event_id,
    count(distinct mst.payment_id) as total_successful_transactions,
    max(mst.paid_at) as last_paid_at
  from public.marketing_contact_athletes mca
  join public.marketing_successful_transactions mst
    on mst.academy_id = mca.academy_id
   and mst.athlete_id = mca.athlete_id
  group by mca.academy_id, mca.marketing_contact_id, mst.event_id
),
contact_events as (
  select
    res.academy_id,
    res.marketing_contact_id,
    res.event_id
  from registration_event_stats res
  union
  select
    pes.academy_id,
    pes.marketing_contact_id,
    pes.event_id
  from payment_event_stats pes
)
select
  ce.academy_id,
  ce.marketing_contact_id,
  mc.email,
  mc.normalized_email,
  mc.first_name,
  mc.last_name,
  me.event_id,
  me.season_id,
  me.name as event_name,
  me.event_type,
  me.starts_at,
  me.ends_at,
  coalesce(res.total_registrations, 0) as total_registrations,
  coalesce(pes.total_successful_transactions, 0) as total_successful_transactions,
  coalesce(res.waitlisted_registrations_count, 0) as waitlisted_registrations_count,
  coalesce(res.canceled_registrations_count, 0) as canceled_registrations_count,
  coalesce(res.refunded_registrations_count, 0) as refunded_registrations_count,
  coalesce(res.attended_registrations_count, 0) as attended_registrations_count,
  (coalesce(res.total_registrations, 0) > 0) as has_registration,
  (coalesce(pes.total_successful_transactions, 0) > 0) as has_successful_transaction,
  (coalesce(res.total_registrations, 0) > 0 and coalesce(pes.total_successful_transactions, 0) = 0) as registered_but_unpaid,
  res.first_registered_at,
  res.last_registered_at,
  pes.last_paid_at,
  (ms.id is not null) as is_suppressed,
  ms.reason as suppression_reason
from contact_events ce
join public.marketing_contacts mc
  on mc.academy_id = ce.academy_id
 and mc.id = ce.marketing_contact_id
join public.marketing_events me
  on me.academy_id = ce.academy_id
 and me.event_id = ce.event_id
left join registration_event_stats res
  on res.academy_id = ce.academy_id
 and res.marketing_contact_id = ce.marketing_contact_id
 and res.event_id = ce.event_id
left join payment_event_stats pes
  on pes.academy_id = ce.academy_id
 and pes.marketing_contact_id = ce.marketing_contact_id
 and pes.event_id = ce.event_id
left join public.marketing_suppressions ms
  on ms.academy_id = mc.academy_id
 and ms.normalized_email = mc.normalized_email;

commit;

begin;

-- -----------------------------------------------------------------------------
-- Academy scoping helpers
-- -----------------------------------------------------------------------------

-- RLS for this challenge assumes each authenticated academy admin carries a
-- single `academy_id` claim in their JWT app metadata. That keeps policies easy
-- to read and reason about for a v1. If the product later supports users who
-- belong to multiple academies, we can swap this helper to consult a membership
-- table without rewriting every policy below.
create or replace function public.current_marketing_academy_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'academy_id', '')::uuid;
$$;

-- This helper is the single academy access check used by every policy below.
-- Keeping the logic in one place makes the policies short and gives us one
-- function to change later if the membership model becomes more complex.
create or replace function public.can_access_marketing_academy(target_academy_id uuid)
returns boolean
language sql
stable
as $$
  select
    auth.role() = 'authenticated'
    and public.current_marketing_academy_id() is not null
    and public.current_marketing_academy_id() = target_academy_id;
$$;

-- -----------------------------------------------------------------------------
-- Table RLS enablement
-- -----------------------------------------------------------------------------

-- We explicitly enable RLS on every marketing-owned table. From this point on,
-- access to the data is controlled by the policies below rather than by table
-- grants alone.
alter table public.marketing_import_batches enable row level security;
alter table public.marketing_contacts enable row level security;
alter table public.marketing_contact_athletes enable row level security;
alter table public.marketing_events enable row level security;
alter table public.marketing_registrations enable row level security;
alter table public.marketing_successful_transactions enable row level security;
alter table public.marketing_suppressions enable row level security;
alter table public.marketing_campaigns enable row level security;

-- -----------------------------------------------------------------------------
-- Import batches policies
-- -----------------------------------------------------------------------------

-- Import batches are academy-scoped operational records. Authenticated admins
-- should only be able to create, read, or update batches for their own academy.
drop policy if exists marketing_import_batches_academy_access
  on public.marketing_import_batches;

create policy marketing_import_batches_academy_access
on public.marketing_import_batches
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Contacts policies
-- -----------------------------------------------------------------------------

-- Contacts are the core audience records in the marketing domain, so the rule
-- is simple: academy admins can only interact with contacts for their academy.
drop policy if exists marketing_contacts_academy_access
  on public.marketing_contacts;

create policy marketing_contacts_academy_access
on public.marketing_contacts
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Contact-athlete link policies
-- -----------------------------------------------------------------------------

-- These link rows connect marketable contacts to athletes. They inherit the
-- same academy boundary as contacts and must never be visible cross-tenant.
drop policy if exists marketing_contact_athletes_academy_access
  on public.marketing_contact_athletes;

create policy marketing_contact_athletes_academy_access
on public.marketing_contact_athletes
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Event snapshot policies
-- -----------------------------------------------------------------------------

-- Marketing keeps lightweight event snapshots for segmentation. Admins should
-- only see and maintain snapshots belonging to their own academy.
drop policy if exists marketing_events_academy_access
  on public.marketing_events;

create policy marketing_events_academy_access
on public.marketing_events
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Registration fact policies
-- -----------------------------------------------------------------------------

-- Registration facts power segments like "registered but never paid" and
-- "waitlisted families", so they follow the same academy-level tenant boundary.
drop policy if exists marketing_registrations_academy_access
  on public.marketing_registrations;

create policy marketing_registrations_academy_access
on public.marketing_registrations
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Successful transaction fact policies
-- -----------------------------------------------------------------------------

-- Successful transaction facts back paid-family segmentation and payment-based
-- outreach, and they should remain visible only within the owning academy.
drop policy if exists marketing_successful_transactions_academy_access
  on public.marketing_successful_transactions;

create policy marketing_successful_transactions_academy_access
on public.marketing_successful_transactions
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Suppression policies
-- -----------------------------------------------------------------------------

-- Suppressions are marketing compliance records. Restricting them by academy
-- ensures one academy cannot read or modify another academy's unsubscribes,
-- bounces, or complaints.
drop policy if exists marketing_suppressions_academy_access
  on public.marketing_suppressions;

create policy marketing_suppressions_academy_access
on public.marketing_suppressions
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Campaign policies
-- -----------------------------------------------------------------------------

-- Campaigns are academy-owned content and send metadata, so they use the same
-- straightforward academy-scoped access pattern as the rest of the domain.
drop policy if exists marketing_campaigns_academy_access
  on public.marketing_campaigns;

create policy marketing_campaigns_academy_access
on public.marketing_campaigns
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

-- -----------------------------------------------------------------------------
-- Segmentation view security
-- -----------------------------------------------------------------------------

-- These views are queried directly by the audience-building UI. Marking them as
-- `security_invoker` ensures they evaluate access using the querying user's
-- permissions instead of accidentally bypassing the table RLS underneath.
alter view public.v_marketing_contact_segment_facts
set (security_invoker = true);

alter view public.v_marketing_contact_event_segment_facts
set (security_invoker = true);

commit;

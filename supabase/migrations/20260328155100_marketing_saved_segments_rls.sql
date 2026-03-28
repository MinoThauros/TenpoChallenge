begin;

-- -----------------------------------------------------------------------------
-- Saved segment RLS
-- -----------------------------------------------------------------------------

-- Saved segments follow the same academy-scoped access rule as the rest of the
-- marketing domain: authenticated admins should only be able to work with the
-- reusable segment definitions owned by their academy.
alter table public.marketing_saved_segments enable row level security;

drop policy if exists marketing_saved_segments_academy_access
  on public.marketing_saved_segments;

create policy marketing_saved_segments_academy_access
on public.marketing_saved_segments
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

commit;

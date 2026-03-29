-- Marketing athletes RLS
--
-- Athlete rows follow the same single-academy tenant boundary as the rest of
-- the marketing model. The policy stays intentionally simple: authenticated
-- users can only manage athlete rows for the academy in their JWT metadata.

alter table public.marketing_athletes enable row level security;

drop policy if exists marketing_athletes_academy_access
  on public.marketing_athletes;

create policy marketing_athletes_academy_access
on public.marketing_athletes
for all
to authenticated
using (public.can_access_marketing_academy(academy_id))
with check (public.can_access_marketing_academy(academy_id));

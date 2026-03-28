begin;

-- -----------------------------------------------------------------------------
-- Saved segments
-- -----------------------------------------------------------------------------

-- Saved segments persist audience definitions, not static membership. The UI can
-- store a reusable filter JSON blob here, and every reuse still re-queries the
-- segmentation views so the audience stays fresh as registrations, payments,
-- imports, and suppressions change over time.
create table if not exists public.marketing_saved_segments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  name text not null,
  description text null,
  segment_scope text not null
    check (segment_scope in ('contact', 'event')),
  filter_definition jsonb not null default '{}'::jsonb,
  created_by_user_id uuid null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_saved_segments_academy_updated_idx
  on public.marketing_saved_segments (academy_id, updated_at desc);

drop trigger if exists set_updated_at_on_marketing_saved_segments
  on public.marketing_saved_segments;

create trigger set_updated_at_on_marketing_saved_segments
before update on public.marketing_saved_segments
for each row execute function public.set_updated_at();

commit;

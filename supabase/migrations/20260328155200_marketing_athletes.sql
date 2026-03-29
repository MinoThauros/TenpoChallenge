-- Marketing athletes
--
-- The rest of the marketing model reasons about athlete ids, but until now
-- there was no lightweight athlete directory the UI could create from. This
-- table gives the marketing experience a minimal place to create an athlete
-- record and then immediately link it to a marketable contact.

create table if not exists public.marketing_athletes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  first_name text not null,
  last_name text not null,
  birth_date date null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_athletes_academy_created_idx
  on public.marketing_athletes (academy_id, created_at desc);

drop trigger if exists set_marketing_athletes_updated_at
  on public.marketing_athletes;

create trigger set_marketing_athletes_updated_at
before update on public.marketing_athletes
for each row
execute function public.set_updated_at();

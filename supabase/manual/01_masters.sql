-- Part 01 of 6. Run the parts in order in the Lovable Cloud SQL editor.
create extension if not exists pg_trgm;

-- 1. Masters: villages, farmers upgrade, crops, bag types
-- ---------------------------------------------------------------------------
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

alter table public.farmers
  add column if not exists code text,
  add column if not exists village_id uuid references public.villages(id),
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true;

create sequence if not exists public.farmer_code_seq start 1;

create or replace function public.assign_farmer_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'F-' || lpad(nextval('public.farmer_code_seq')::text, 4, '0');
  end if;
  return new;
end $$;

update public.farmers set code = 'F-' || lpad(nextval('public.farmer_code_seq')::text, 4, '0')
  where code is null or code = '';

drop trigger if exists assign_farmer_code on public.farmers;
create trigger assign_farmer_code before insert on public.farmers
  for each row execute function public.assign_farmer_code();

create unique index if not exists farmers_org_code_uidx on public.farmers (org_id, code);
create index if not exists farmers_name_trgm_idx on public.farmers using gin (name gin_trgm_ops);
create index if not exists farmers_phone_trgm_idx on public.farmers using gin (phone gin_trgm_ops);
create index if not exists farmers_village_idx on public.farmers (village_id);

-- balances are computed from bills minus payments, never stored
alter table public.farmers drop column if exists balance;

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null, name_local text, default_unit text not null default 'quintal',
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

create table if not exists public.bag_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.default_org_id() references public.organizations(id),
  name text not null, tare_kg numeric(6,3) not null default 0,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (org_id, name)
);

insert into public.crops (name, name_local) values
  ('Soybean','सोयाबीन'),('Tur','तूर'),('Gram','हरभरा'),('Wheat','गहू'),
  ('Maize','मका'),('Cotton','कापूस'),('Onion','कांदा')
on conflict (org_id, name) do nothing;
insert into public.bag_types (name) values ('Jute'),('Plastic'),('Other')
on conflict (org_id, name) do nothing;


-- Part 07a (run in order)
-- Farmer ledger, bag/cash advances, one-step billing, role helpers.
-- Additive and safe to re-run. Works in "open mode" until app_flags.roles_enforced = 'on'
-- (see 20261018000100_roles_and_rls.sql).

-- ---------------------------------------------------------------------------
-- 1. Flags and role helpers
-- ---------------------------------------------------------------------------
create table if not exists public.app_flags (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;
drop policy if exists flags_read on public.app_flags;
create policy flags_read on public.app_flags for select to anon, authenticated using (true);
grant select on public.app_flags to anon, authenticated;
grant all on public.app_flags to service_role;

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then 'anon'
         else coalesce((select p.role from public.profiles p where p.user_id = auth.uid()), 'pending') end
$$;

create or replace function public.roles_enforced() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'on' from public.app_flags where key = 'roles_enforced'), false)
$$;

create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select (not public.roles_enforced()) or public.app_role() in ('admin', 'staff')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select (not public.roles_enforced()) or public.app_role() = 'admin'
$$;

grant execute on function public.app_role(), public.roles_enforced(), public.can_write(), public.is_admin()
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bag prices (editable in Settings) and more crops
-- ---------------------------------------------------------------------------
alter table public.bag_types add column if not exists price numeric(10,2) not null default 0;
update public.bag_types set price = 25 where name = 'Jute' and price = 0;
update public.bag_types set price = 15 where name = 'Plastic' and price = 0;

insert into public.crops (name, name_local) values
  ('Rice', 'तांदूळ'), ('Chana', 'चणा'), ('Daal', 'डाळ')
on conflict (org_id, name) do nothing;


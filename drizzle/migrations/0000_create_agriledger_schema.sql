-- ============================================================================
-- AgriLedger core schema (single-user mode)
--
-- Design notes:
-- * One default organization; every business table carries org_id so
--   multi-org support can be switched on later without touching the tables.
-- * RLS is open to everyone but scoped to the single default org through
--   public.current_org_id(). When authentication is enabled later, replace the
--   body of current_org_id() with:
--     select org_id from public.profiles where user_id = auth.uid();
--   and change the policy targets from (anon, authenticated) to
--   (authenticated).
-- * Soft delete: retire rows by setting deleted_at; rows are never removed.
-- * Money is numeric(12,2).
-- ============================================================================

-- 1) Tables -----------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'employee')),
  org_id uuid not null references public.organizations (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id),
  name text not null,
  phone text not null,
  address text,
  crop_type text,
  balance numeric(12,2) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, phone)
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id),
  farmer_id uuid not null references public.farmers (id),
  trans_date timestamptz not null default now(),
  type text not null check (type in ('Given', 'Received')),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id),
  farmer_id uuid not null references public.farmers (id),
  product text not null,
  bags_given integer not null check (bags_given >= 0),
  bags_returned integer not null default 0
    check (bags_returned >= 0 and bags_returned <= bags_given),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.bills (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id),
  farmer_id uuid references public.farmers (id),
  content text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Default organization used while the app runs in single-user mode.
insert into public.organizations (id, name, settings)
values ('00000000-0000-0000-0000-000000000001', 'My AgriBusiness', '{}'::jsonb)
on conflict (id) do nothing;

-- 2) Helper: which organization does this app serve --------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  -- Single-user mode: always the default org.
  -- With auth: select org_id from public.profiles where user_id = auth.uid();
  select '00000000-0000-0000-0000-000000000001'::uuid;
$$;

-- 3) Grants (the Data API needs explicit GRANTs on public tables) -----------

grant select, insert, update, delete on public.organizations to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.farmers to anon, authenticated;
grant select, insert, update, delete on public.transactions to anon, authenticated;
grant select, insert, update, delete on public.inventory to anon, authenticated;
grant select, insert, update, delete on public.bills to anon, authenticated;
grant all on public.organizations to service_role;
grant all on public.profiles to service_role;
grant all on public.farmers to service_role;
grant all on public.transactions to service_role;
grant all on public.inventory to service_role;
grant all on public.bills to service_role;

-- 4) Row Level Security: open, but scoped to the default org ----------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.farmers enable row level security;
alter table public.transactions enable row level security;
alter table public.inventory enable row level security;
alter table public.bills enable row level security;

create policy "organizations_readable" on public.organizations
  for select to anon, authenticated
  using (id = public.current_org_id());
create policy "organizations_writable" on public.organizations
  for insert to anon, authenticated
  with check (id = public.current_org_id());
create policy "organizations_updatable" on public.organizations
  for update to anon, authenticated
  using (id = public.current_org_id())
  with check (id = public.current_org_id());

create policy "profiles_readable" on public.profiles
  for select to anon, authenticated
  using (org_id = public.current_org_id());
create policy "profiles_writable" on public.profiles
  for insert to anon, authenticated
  with check (org_id = public.current_org_id());
create policy "profiles_updatable" on public.profiles
  for update to anon, authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "farmers_readable" on public.farmers
  for select to anon, authenticated
  using (org_id = public.current_org_id() and deleted_at is null);
create policy "farmers_creatable" on public.farmers
  for insert to anon, authenticated
  with check (org_id = public.current_org_id());
create policy "farmers_updatable" on public.farmers
  for update to anon, authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "farmers_deletable" on public.farmers
  for delete to anon, authenticated
  using (org_id = public.current_org_id());

create policy "transactions_readable" on public.transactions
  for select to anon, authenticated
  using (org_id = public.current_org_id() and deleted_at is null);
create policy "transactions_creatable" on public.transactions
  for insert to anon, authenticated
  with check (org_id = public.current_org_id());
create policy "transactions_updatable" on public.transactions
  for update to anon, authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "transactions_deletable" on public.transactions
  for delete to anon, authenticated
  using (org_id = public.current_org_id());

create policy "inventory_readable" on public.inventory
  for select to anon, authenticated
  using (org_id = public.current_org_id() and deleted_at is null);
create policy "inventory_creatable" on public.inventory
  for insert to anon, authenticated
  with check (org_id = public.current_org_id());
create policy "inventory_updatable" on public.inventory
  for update to anon, authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "inventory_deletable" on public.inventory
  for delete to anon, authenticated
  using (org_id = public.current_org_id());

create policy "bills_readable" on public.bills
  for select to anon, authenticated
  using (org_id = public.current_org_id() and deleted_at is null);
create policy "bills_creatable" on public.bills
  for insert to anon, authenticated
  with check (org_id = public.current_org_id());
create policy "bills_updatable" on public.bills
  for update to anon, authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "bills_deletable" on public.bills
  for delete to anon, authenticated
  using (org_id = public.current_org_id());

-- 5) Keep updated_at fresh ----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.farmers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bills
  for each row execute function public.set_updated_at();

-- 6) Realtime for the live dashboard and lists --------------------------------

do $$ begin
  execute 'alter publication supabase_realtime add table public.farmers';
exception when duplicate_object then null;
end $$;

do $$ begin
  execute 'alter publication supabase_realtime add table public.transactions';
exception when duplicate_object then null;
end $$;

do $$ begin
  execute 'alter publication supabase_realtime add table public.inventory';
exception when duplicate_object then null;
end $$;
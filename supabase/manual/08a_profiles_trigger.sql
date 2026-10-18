-- Part 08a (run in order)
-- Roles: admin (full), staff (view + add), viewer (view only), pending (no access).
-- First person to sign up becomes admin; everyone after waits for admin approval.
-- Access rules switch on only when app_flags.roles_enforced = 'on' (last statement).

-- ---------------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------------
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'c' loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
end $$;

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'staff', 'viewer', 'pending', 'employee'));
alter table public.profiles alter column org_id set default public.default_org_id();
alter table public.profiles alter column role set default 'pending';
update public.profiles set role = 'staff' where role = 'employee';

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, role, org_id, email, full_name)
  values (
    new.id,
    case when exists (select 1 from public.profiles where role = 'admin') then 'pending' else 'admin' end,
    public.default_org_id(),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();


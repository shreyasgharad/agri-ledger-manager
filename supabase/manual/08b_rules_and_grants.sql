-- Part 08b (run in order)
-- 2. Access rules
-- ---------------------------------------------------------------------------
do $$
declare
  t text; r record;
  read_tbls text[] := array['villages','crops','bag_types','farmers','buyers','lots','lot_bags','bids','sales',
                            'advances','bills','bill_items','payments','settings','organizations',
                            'transactions','inventory'];
  staff_update text[] := array['farmers','buyers','lots','lot_bags','bids','villages'];
  admin_insert_only text[] := array['bag_types','crops','settings','organizations'];
begin
  foreach t in array array['villages','crops','bag_types','farmers','buyers','lots','lot_bags','bids','sales',
                           'advances','bills','bill_items','payments','settings','organizations',
                           'transactions','inventory','audit_log','bill_counters','profiles'] loop
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
  end loop;

  foreach t in array read_tbls loop
    execute format($f$create policy r_select on public.%I for select to authenticated
      using (public.app_role() in ('admin','staff','viewer'))$f$, t);
    if t = 'organizations' then
      execute format($f$create policy r_admin_write on public.%I for update to authenticated
        using (public.app_role() = 'admin') with check (public.app_role() = 'admin')$f$, t);
      continue;
    end if;
    if t = any(admin_insert_only) then
      execute format($f$create policy r_insert on public.%I for insert to authenticated
        with check (public.app_role() = 'admin')$f$, t);
    else
      execute format($f$create policy r_insert on public.%I for insert to authenticated
        with check (public.app_role() in ('admin','staff'))$f$, t);
    end if;
    if t = any(staff_update) then
      execute format($f$create policy r_update on public.%I for update to authenticated
        using (public.app_role() in ('admin','staff')) with check (public.app_role() in ('admin','staff'))$f$, t);
    else
      execute format($f$create policy r_update on public.%I for update to authenticated
        using (public.app_role() = 'admin') with check (public.app_role() = 'admin')$f$, t);
    end if;
  end loop;

  -- weighed bags and bids can be removed while a lot is still being worked on
  foreach t in array array['lot_bags','bids'] loop
    execute format($f$create policy r_delete on public.%I for delete to authenticated
      using (public.app_role() in ('admin','staff'))$f$, t);
  end loop;

  -- audit log and counters: admin reads; nobody writes directly (triggers/functions do)
  create policy r_select on public.audit_log for select to authenticated using (public.app_role() = 'admin');
  create policy r_select on public.bill_counters for select to authenticated using (public.app_role() = 'admin');

  -- profiles: everyone sees their own; admin sees and manages all
  create policy p_self on public.profiles for select to authenticated using (user_id = auth.uid());
  create policy p_admin_select on public.profiles for select to authenticated using (public.app_role() = 'admin');
  create policy p_admin_update on public.profiles for update to authenticated
    using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
end $$;

revoke all on all tables in schema public from anon;
grant select on public.app_flags to anon;

do $$
declare t text;
begin
  foreach t in array array['villages','crops','bag_types','farmers','buyers','lots','lot_bags','bids','sales',
                           'advances','bills','bill_items','payments','settings','organizations',
                           'transactions','inventory'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
  grant delete on public.lot_bags, public.bids to authenticated;
  grant select on public.audit_log, public.bill_counters, public.app_flags to authenticated;
  grant select, update on public.profiles to authenticated;
  grant usage, select on all sequences in schema public to authenticated;
end $$;

-- audit trigger rows are written by a security-definer function, so keep it that way
alter function public.audit_row() security definer;


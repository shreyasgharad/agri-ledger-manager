-- Part 08c (run in order)
-- 3. Switch the rules on (run ONLY after the first admin has signed up)
-- ---------------------------------------------------------------------------
insert into public.app_flags (key, value) values ('roles_enforced', 'on')
on conflict (key) do update set value = 'on', updated_at = now();

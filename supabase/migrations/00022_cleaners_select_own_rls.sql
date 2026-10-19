-- Cleaners must read their own row even when not yet active/approved.
drop policy if exists cleaners_select_own on public.cleaners;
create policy cleaners_select_own on public.cleaners
  for select
  using (user_id = auth.uid() or is_admin());

-- Allow a cleaner to insert their own row if trigger did not (no service role).
drop policy if exists cleaners_insert_own on public.cleaners;
create policy cleaners_insert_own on public.cleaners
  for insert
  with check (user_id = auth.uid() or is_admin());

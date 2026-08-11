-- Cleaner portal RLS: available jobs, self-accept, assigned job updates

create policy bookings_select_available_cleaner on public.bookings
  for select using (
    status = 'awaiting_cleaner'
    and professional_profile_id is null
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('cleaner', 'professional', 'admin')
    )
  );

create policy bookings_update_accept_cleaner on public.bookings
  for update using (
    status = 'awaiting_cleaner'
    and professional_profile_id is null
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('cleaner', 'professional', 'admin')
    )
  )
  with check (
    professional_profile_id = auth.uid()
    and status = 'assigned'
  );

create policy bookings_update_assigned_cleaner on public.bookings
  for update using (
    professional_profile_id = auth.uid()
    and status in ('assigned', 'cleaner_on_way', 'cleaner_arrived', 'in_progress')
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('cleaner', 'professional', 'admin')
    )
  )
  with check (professional_profile_id = auth.uid());

create policy cleaner_assignments_insert_self on public.cleaner_assignments
  for insert with check (
    exists (
      select 1 from public.cleaners c
      where c.id = cleaner_assignments.cleaner_id
        and c.user_id = auth.uid()
    )
    and source = 'self_accept'
  );

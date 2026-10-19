-- Auth role bootstrap + RLS-respecting compat views

-- 1) profiles / professionals must honor underlying RLS
alter view public.profiles set (security_invoker = true);
alter view public.professionals set (security_invoker = true);

-- 2) Signup trigger: customer by default; cleaner from metadata;
--    admin ONLY via bootstrap email setting (never from user_metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text := current_setting('app.admin_bootstrap_email', true);
  meta_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', ''));
  assigned_role public.user_role := 'customer';
begin
  if bootstrap_email is not null
     and new.email is not null
     and lower(new.email) = lower(bootstrap_email) then
    assigned_role := 'admin';
  elsif meta_role in ('cleaner', 'professional') then
    assigned_role := 'cleaner';
  else
    assigned_role := 'customer';
  end if;

  insert into public.users (
    id, clerk_user_id, email, role, first_name, last_name, onboarding_complete
  ) values (
    new.id,
    new.id::text,
    new.email,
    assigned_role,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(public.users.first_name, excluded.first_name),
        last_name = coalesce(public.users.last_name, excluded.last_name),
        role = case
          when public.users.role = 'admin' then public.users.role
          when assigned_role = 'admin' then 'admin'::public.user_role
          when assigned_role = 'cleaner' and public.users.role = 'customer' then 'cleaner'::public.user_role
          else public.users.role
        end,
        updated_at = now();

  if assigned_role = 'customer' or assigned_role = 'admin' then
    insert into public.customers (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  if assigned_role = 'cleaner' then
    insert into public.cleaners (user_id, is_active, is_verified)
    values (new.id, false, false)
    on conflict (user_id) do nothing;
  end if;

  insert into public.notification_preferences (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.users (+ customers/cleaners). Admin role only via app.admin_bootstrap_email; cleaner via signup metadata.';

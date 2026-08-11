-- Saved places: structured Google address fields + delete RLS
-- Extends public.addresses for Uber-style saved Homes / Work / Other.

alter table public.addresses
  add column if not exists formatted_address text,
  add column if not exists google_place_id text;

create index if not exists addresses_google_place_id_idx
  on public.addresses (google_place_id)
  where google_place_id is not null;

create index if not exists addresses_user_default_idx
  on public.addresses (user_id, is_default)
  where is_default = true;

-- Ensure only one default address per user
create or replace function public.addresses_enforce_single_default()
returns trigger
language plpgsql
as $$
begin
  if new.is_default is true and new.user_id is not null then
    update public.addresses
    set is_default = false
    where user_id = new.user_id
      and id is distinct from new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists addresses_enforce_single_default on public.addresses;
create trigger addresses_enforce_single_default
before insert or update of is_default, user_id on public.addresses
for each row execute function public.addresses_enforce_single_default();

-- Delete policy (select/insert/update already exist)
drop policy if exists addresses_delete_own on public.addresses;
create policy addresses_delete_own on public.addresses
  for delete using (
    user_id = auth.uid() or profile_id = auth.uid() or public.is_admin()
  );

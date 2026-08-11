-- Cleaner dashboard: job photos, checklist, availability, timing

alter table public.bookings
  add column if not exists job_checklist jsonb not null default '[]'::jsonb,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create table if not exists public.booking_job_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  professional_profile_id uuid not null references public.profiles(id) on delete cascade,
  photo_type text not null check (photo_type in ('before', 'after')),
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.professional_availability (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  arrival_window text not null check (arrival_window in ('morning', 'afternoon', 'evening')),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_profile_id, day_of_week, arrival_window)
);

create index if not exists bookings_available_jobs_idx
  on public.bookings (status, scheduled_at)
  where professional_profile_id is null;

create index if not exists bookings_pro_schedule_idx
  on public.bookings (professional_profile_id, scheduled_at);

create index if not exists booking_job_photos_booking_idx
  on public.booking_job_photos (booking_id);

create index if not exists professional_availability_pro_idx
  on public.professional_availability (professional_profile_id);

create trigger professional_availability_set_updated_at
before update on public.professional_availability
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

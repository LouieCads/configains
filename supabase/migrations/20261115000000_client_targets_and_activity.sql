-- Client targets and daily activity: the coach's step, cardio and nutrition targets for each client,
-- and the step counts and cardio sessions clients log against them.
-- Like workout logs and measurements, client entries are append-only so offline sync cannot clobber data.

-- One row per client. Every target is optional: a null means the coach has not set it.
-- Only the coach writes targets; the client reads their own.
create table public.client_targets (
  client_id uuid primary key references public.client_profiles(id) on delete cascade,
  daily_steps_target integer check (daily_steps_target between 1000 and 50000),
  cardio_minutes integer check (cardio_minutes between 5 and 300),
  cardio_sessions_per_week integer check (cardio_sessions_per_week between 1 and 14),
  cardio_hr_min integer check (cardio_hr_min between 60 and 220),
  cardio_hr_max integer check (cardio_hr_max between 60 and 220),
  cardio_notes text check (char_length(cardio_notes) <= 1000),
  calories_kcal integer check (calories_kcal between 800 and 8000),
  protein_g integer check (protein_g between 0 and 1000),
  fat_g integer check (fat_g between 0 and 1000),
  carbs_g integer check (carbs_g between 0 and 1500),
  -- Short coach reminders, shown to the client as a list.
  nutrition_notes text[] not null default '{}'
    check (cardinality(nutrition_notes) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardio_hr_min is null or cardio_hr_max is null or cardio_hr_min <= cardio_hr_max)
);
create trigger client_targets_updated before update on public.client_targets
  for each row execute function public.set_updated_at();

-- Daily step counts. A second entry for the same day is a correction: the newest entry wins when
-- the app reads them, so no row is ever updated or removed.
create table public.step_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  steps integer not null check (steps between 0 and 200000),
  created_at timestamptz not null default now()
);
create index step_logs_client_idx on public.step_logs (client_id, logged_on);

-- One row per cardio session. Any cardio mode counts, so the activity is free text and optional.
create table public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  logged_on date not null default current_date,
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  avg_heart_rate integer check (avg_heart_rate between 30 and 250),
  activity text check (char_length(activity) <= 60),
  created_at timestamptz not null default now()
);
create index cardio_logs_client_idx on public.cardio_logs (client_id, logged_on);

alter table public.client_targets enable row level security;
alter table public.step_logs enable row level security;
alter table public.cardio_logs enable row level security;
revoke all on public.client_targets, public.step_logs, public.cardio_logs from anon;

create policy "clients read own targets" on public.client_targets for select to authenticated
  using (client_id = auth.uid());
create policy "admins manage client targets" on public.client_targets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "clients read own step logs" on public.step_logs for select to authenticated
  using (client_id = auth.uid());
create policy "clients record own step logs" on public.step_logs for insert to authenticated
  with check (client_id = auth.uid());
create policy "admins read step logs" on public.step_logs for select to authenticated
  using (public.is_admin());

create policy "clients read own cardio logs" on public.cardio_logs for select to authenticated
  using (client_id = auth.uid());
create policy "clients record own cardio logs" on public.cardio_logs for insert to authenticated
  with check (client_id = auth.uid());
create policy "admins read cardio logs" on public.cardio_logs for select to authenticated
  using (public.is_admin());

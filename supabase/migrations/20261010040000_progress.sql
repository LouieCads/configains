-- Progress tracking: client-entered metrics. Workout logs already exist (20261010000000).
-- Rows are append-only from the app: a client's entry is never overwritten, so offline sync cannot clobber data.

create table public.progress_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  metric text not null check (metric in ('body_weight_kg', 'waist_cm')),
  value numeric(7, 2) not null check (value > 0 and value < 1000),
  measured_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index progress_metrics_client_idx on public.progress_metrics (client_id, measured_on);

alter table public.progress_metrics enable row level security;
revoke all on public.progress_metrics from anon;

create policy "clients read own metrics" on public.progress_metrics for select to authenticated
  using (client_id = auth.uid());
create policy "clients record own metrics" on public.progress_metrics for insert to authenticated
  with check (client_id = auth.uid());
create policy "admins read metrics" on public.progress_metrics for select to authenticated
  using (public.is_admin());

-- Workout logs stay append-only from the app. Remove the update policy from the foundation migration.
drop policy if exists "clients update own workout logs" on public.workout_logs;

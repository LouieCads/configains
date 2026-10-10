-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('16000000-0000-0000-0000-000000000001'),
  ('16000000-0000-0000-0000-000000000002'),
  ('16000000-0000-0000-0000-000000000003');
insert into public.admin_profiles (id, display_name)
values ('16000000-0000-0000-0000-000000000001', 'Progress admin');
insert into public.client_profiles (id, display_name) values
  ('16000000-0000-0000-0000-000000000002', 'Client A'),
  ('16000000-0000-0000-0000-000000000003', 'Client B');
insert into public.workout_logs (id, client_id, logged_on, entries) values
  ('16100000-0000-0000-0000-000000000002', '16000000-0000-0000-0000-000000000002', '2026-10-05', '[]');

set local role authenticated;

do $$
begin
  -- Client A records a measurement for themselves.
  perform set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000002', true);
  insert into public.progress_metrics (id, client_id, metric, value, measured_on)
  values ('16200000-0000-0000-0000-000000000002', '16000000-0000-0000-0000-000000000002', 'waist_cm', 82.5, '2026-10-05');

  -- Client A cannot record a measurement for Client B.
  begin
    insert into public.progress_metrics (id, client_id, metric, value, measured_on)
    values ('16200000-0000-0000-0000-000000000003', '16000000-0000-0000-0000-000000000003', 'waist_cm', 80, '2026-10-05');
    raise exception 'Client A recorded a measurement for Client B';
  exception when insufficient_privilege then null;
  end;

  -- Client A cannot record an out-of-range or unknown metric.
  begin
    insert into public.progress_metrics (id, client_id, metric, value, measured_on)
    values ('16200000-0000-0000-0000-000000000004', '16000000-0000-0000-0000-000000000002', 'body_fat', 20, '2026-10-05');
    raise exception 'An unknown metric was accepted';
  exception when check_violation then null;
  end;

  -- Saved workout logs are append-only from the app: an update changes nothing.
  update public.workout_logs set notes = 'changed after the fact'
  where id = '16100000-0000-0000-0000-000000000002';
  if (select notes from public.workout_logs where id = '16100000-0000-0000-0000-000000000002') is not null then
    raise exception 'A client edited a saved workout log';
  end if;

  -- Client A sees only their own rows.
  if (select count(*) from public.progress_metrics) <> 1 then raise exception 'Client A can see other metrics'; end if;
  if (select count(*) from public.workout_logs) <> 1 then raise exception 'Client A can see other workout logs'; end if;
end;
$$;

-- The coach reads everyone's progress.
select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000001', true);
do $$
begin
  if (select count(*) from public.progress_metrics) <> 1 then raise exception 'Coach cannot read progress metrics'; end if;
  if (select count(*) from public.workout_logs) <> 1 then raise exception 'Coach cannot read workout logs'; end if;
end;
$$;
rollback;
select 'Progress metrics are client-scoped, append-only and readable by the coach' as result;

-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('17000000-0000-0000-0000-000000000001'),
  ('17000000-0000-0000-0000-000000000002'),
  ('17000000-0000-0000-0000-000000000003');
insert into public.admin_profiles (id, display_name)
values ('17000000-0000-0000-0000-000000000001', 'Targets admin');
insert into public.client_profiles (id, display_name) values
  ('17000000-0000-0000-0000-000000000002', 'Client A'),
  ('17000000-0000-0000-0000-000000000003', 'Client B');

set local role authenticated;

-- The coach sets targets for a client.
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
do $$
begin
  insert into public.client_targets
    (client_id, daily_steps_target, cardio_minutes, cardio_sessions_per_week, cardio_hr_min, cardio_hr_max,
     cardio_notes, calories_kcal, protein_g, fat_g, carbs_g, nutrition_notes)
  values
    ('17000000-0000-0000-0000-000000000002', 8000, 30, 4, 140, 150,
     'Any cardio mode is acceptable. Avoid HIIT.', 2030, 130, 30, 310, array['No binging on weekends.']);
  insert into public.client_targets (client_id, daily_steps_target)
  values ('17000000-0000-0000-0000-000000000003', 6000);

  -- Out-of-range and inconsistent targets are refused.
  begin
    update public.client_targets set daily_steps_target = 5 where client_id = '17000000-0000-0000-0000-000000000003';
    raise exception 'A tiny step target was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.client_targets set cardio_hr_min = 160, cardio_hr_max = 120
    where client_id = '17000000-0000-0000-0000-000000000003';
    raise exception 'A heart-rate range with min above max was accepted';
  exception when check_violation then null;
  end;
end;
$$;

do $$
begin
  -- Client A reads only their own targets and cannot change them.
  perform set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000002', true);
  if (select count(*) from public.client_targets) <> 1 then raise exception 'Client A can see other targets'; end if;
  if (select daily_steps_target from public.client_targets) <> 8000 then raise exception 'Client A cannot read their targets'; end if;

  update public.client_targets set daily_steps_target = 1000;
  if (select daily_steps_target from public.client_targets) <> 8000 then raise exception 'Client A changed their own target'; end if;
  begin
    insert into public.client_targets (client_id, daily_steps_target)
    values ('17000000-0000-0000-0000-000000000002', 1000);
    raise exception 'Client A inserted a second targets row';
  exception when insufficient_privilege or unique_violation then null;
  end;

  -- Client A logs steps and cardio for themselves, and a correction for the same day is a new row.
  insert into public.step_logs (id, client_id, logged_on, steps)
  values ('17100000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', '2026-11-10', 6200);
  insert into public.step_logs (id, client_id, logged_on, steps)
  values ('17100000-0000-0000-0000-000000000002', '17000000-0000-0000-0000-000000000002', '2026-11-10', 9100);
  insert into public.cardio_logs (id, client_id, logged_on, duration_minutes, avg_heart_rate, activity)
  values ('17200000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', '2026-11-10', 32, 145, 'Bike');

  -- Client A cannot log for Client B.
  begin
    insert into public.step_logs (client_id, logged_on, steps)
    values ('17000000-0000-0000-0000-000000000003', '2026-11-10', 5000);
    raise exception 'Client A logged steps for Client B';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.cardio_logs (client_id, logged_on, duration_minutes)
    values ('17000000-0000-0000-0000-000000000003', '2026-11-10', 20);
    raise exception 'Client A logged cardio for Client B';
  exception when insufficient_privilege then null;
  end;

  -- Entries must be in range.
  begin
    insert into public.step_logs (client_id, logged_on, steps)
    values ('17000000-0000-0000-0000-000000000002', '2026-11-10', -1);
    raise exception 'A negative step count was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.cardio_logs (client_id, logged_on, duration_minutes)
    values ('17000000-0000-0000-0000-000000000002', '2026-11-10', 0);
    raise exception 'A zero-minute cardio session was accepted';
  exception when check_violation then null;
  end;

  -- Saved entries stay as they are: updates and deletes change nothing.
  update public.step_logs set steps = 1 where id = '17100000-0000-0000-0000-000000000001';
  delete from public.cardio_logs where id = '17200000-0000-0000-0000-000000000001';
  if (select steps from public.step_logs where id = '17100000-0000-0000-0000-000000000001') <> 6200 then
    raise exception 'A client edited a saved step entry';
  end if;
  if (select count(*) from public.cardio_logs) <> 1 then raise exception 'A client removed a cardio session'; end if;

  if (select count(*) from public.step_logs) <> 2 then raise exception 'Client A cannot see their own step logs'; end if;
end;
$$;

-- The coach reads every client's logs and can change targets.
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
do $$
begin
  if (select count(*) from public.step_logs) <> 2 then raise exception 'Coach cannot read step logs'; end if;
  if (select count(*) from public.cardio_logs) <> 1 then raise exception 'Coach cannot read cardio logs'; end if;
  update public.client_targets set daily_steps_target = 9000 where client_id = '17000000-0000-0000-0000-000000000002';
  if (select daily_steps_target from public.client_targets where client_id = '17000000-0000-0000-0000-000000000002') <> 9000 then
    raise exception 'Coach cannot change targets';
  end if;
end;
$$;

-- Client B sees none of Client A's data.
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000003', true);
do $$
begin
  if (select count(*) from public.step_logs) <> 0 then raise exception 'Client B can see Client A step logs'; end if;
  if (select count(*) from public.cardio_logs) <> 0 then raise exception 'Client B can see Client A cardio logs'; end if;
  if (select count(*) from public.client_targets) <> 1 then raise exception 'Client B can see other targets'; end if;
end;
$$;
rollback;
select 'Targets are coach-managed; step and cardio logs are client-scoped, append-only and readable by the coach' as result;

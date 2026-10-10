-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('13000000-0000-0000-0000-000000000001'),
  ('13000000-0000-0000-0000-000000000002');
insert into public.admin_profiles (id, display_name)
values ('13000000-0000-0000-0000-000000000001', 'Template test admin');
insert into public.client_profiles (id, display_name)
values ('13000000-0000-0000-0000-000000000002', 'Template test client');

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);

do $$
declare
  workout_id uuid; nutrition_id uuid; week_one_id uuid; program_id uuid; second_program_id uuid;
  first_program_status text;
begin
  -- A new template is saved with its phases in order and exercises in order.
  workout_id := public.save_program_template('{"kind":"workout","goal":"fat_loss","name":"Test plan","phases":[{"name":"Week 1","exercises":[{"name":"Squat","sets":3,"reps":"8-10","rest_seconds":90},{"name":"Row","sets":3,"reps":"10"}]},{"name":"Week 2","exercises":[]}]}'::jsonb);
  if (select count(*) from public.template_phases where template_id = workout_id) <> 2 then
    raise exception 'Saved template has the wrong number of phases';
  end if;
  if (select count(*) from public.template_exercises e join public.template_phases p on p.id = e.phase_id where p.template_id = workout_id) <> 2 then
    raise exception 'Saved template has the wrong number of exercises';
  end if;

  -- Re-saving keeps existing ids and removes rows left out of the payload.
  select id into week_one_id from public.template_phases where template_id = workout_id and position = 1;
  perform public.save_program_template(jsonb_build_object(
    'id', workout_id, 'kind', 'workout', 'goal', 'fat_loss', 'name', 'Test plan renamed',
    'rules', jsonb_build_object('experience', 'beginner', 'training_location', 'home'),
    'phases', jsonb_build_array(jsonb_build_object(
      'id', week_one_id, 'name', 'Week 1', 'instructions', 'Go slow',
      'exercises', jsonb_build_array(jsonb_build_object('name', 'Lunge', 'sets', 4, 'reps', '6', 'notes', 'Slow')))
    )
  ));
  if (select count(*) from public.template_phases where template_id = workout_id) <> 1 then
    raise exception 'Removed phase was not deleted';
  end if;
  if not exists (select 1 from public.template_phases where id = week_one_id) then
    raise exception 'Kept phase changed id';
  end if;
  if (select name from public.template_exercises where phase_id = week_one_id) <> 'Lunge' then
    raise exception 'Exercise list was not replaced';
  end if;

  if (select rules->>'training_location' from public.program_templates where id = workout_id) <> 'home' then
    raise exception 'Template rules were not saved';
  end if;

  -- A nutrition template saves on its own.
  nutrition_id := public.save_program_template('{"kind":"nutrition","goal":"maintenance","name":"Test meals","phases":[{"name":"Guidance","instructions":"Eat protein at each meal."}]}'::jsonb);

  -- Assigning starts the program on the first phase.
  program_id := public.assign_client_program('13000000-0000-0000-0000-000000000002', workout_id, nutrition_id);
  if (select current_phase_id from public.client_programs where id = program_id) is distinct from week_one_id then
    raise exception 'New program did not start on the first phase';
  end if;

  -- A second assignment ends the first and leaves one active program.
  second_program_id := public.assign_client_program('13000000-0000-0000-0000-000000000002', workout_id, null);
  select status into first_program_status from public.client_programs where id = program_id;
  if first_program_status <> 'ended' then raise exception 'Previous program was not ended'; end if;
  if (select count(*) from public.client_programs where client_id = '13000000-0000-0000-0000-000000000002' and status = 'active') <> 1 then
    raise exception 'Client has more than one active program';
  end if;

  -- Archived templates cannot be assigned.
  perform public.save_program_template(jsonb_build_object(
    'id', workout_id, 'kind', 'workout', 'goal', 'fat_loss', 'name', 'Archived', 'is_archived', true,
    'phases', jsonb_build_array(jsonb_build_object('id', week_one_id, 'name', 'Week 1', 'exercises', '[]'::jsonb))
  ));
  begin
    perform public.assign_client_program('13000000-0000-0000-0000-000000000002', workout_id, null);
    raise exception 'An archived template was assigned';
  exception when invalid_parameter_value then null;
  end;
end;
$$;

-- The client sees only the template assigned to them, and cannot edit templates.
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000002', true);
do $$
begin
  if (select count(*) from public.program_templates) <> 1 then
    raise exception 'Client can see templates that are not assigned';
  end if;
  begin
    perform public.save_program_template('{"kind":"workout","goal":"fat_loss","name":"Client edit"}'::jsonb);
    raise exception 'Client saved a template';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.assign_client_program('13000000-0000-0000-0000-000000000002', (select id from public.program_templates limit 1), null);
    raise exception 'Client assigned a program';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'Template save, phase ordering, assignment, archive guard and client restrictions passed' as result;

-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('14000000-0000-0000-0000-000000000001'),
  ('14000000-0000-0000-0000-000000000002');
insert into public.admin_profiles (id, display_name)
values ('14000000-0000-0000-0000-000000000001', 'Coaching admin');
insert into public.client_profiles (id, display_name, coaching_mode)
values ('14000000-0000-0000-0000-000000000002', 'Human client', 'human');

-- Library template with two phases, one exercise in each.
insert into public.program_templates (id, kind, goal, name) values
  ('14100000-0000-0000-0000-000000000001', 'workout', 'fat_loss', 'Library plan'),
  ('14100000-0000-0000-0000-000000000002', 'workout', 'fat_loss', 'Other plan');
insert into public.template_phases (id, template_id, position, name) values
  ('14200000-0000-0000-0000-000000000001', '14100000-0000-0000-0000-000000000001', 1, 'Week 1'),
  ('14200000-0000-0000-0000-000000000002', '14100000-0000-0000-0000-000000000001', 2, 'Week 2'),
  ('14200000-0000-0000-0000-000000000003', '14100000-0000-0000-0000-000000000002', 1, 'Other week 1');
insert into public.template_exercises (phase_id, position, name, sets, reps) values
  ('14200000-0000-0000-0000-000000000001', 1, 'Squat', 3, '8'),
  ('14200000-0000-0000-0000-000000000002', 1, 'Press', 3, '6');

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);

do $$
declare
  program_id uuid; copy_id uuid; again_id uuid; week_two_copy uuid;
begin
  program_id := public.assign_client_program('14000000-0000-0000-0000-000000000002', '14100000-0000-0000-0000-000000000001', null);
  perform public.set_client_phase(program_id, '14200000-0000-0000-0000-000000000002');

  -- Customising copies the template and points the program at the copy.
  copy_id := public.customise_client_program(program_id);
  if (select workout_template_id from public.client_programs where id = program_id) <> copy_id then
    raise exception 'Program was not moved to the customised copy';
  end if;
  if (select owner_client_id from public.program_templates where id = copy_id) <> '14000000-0000-0000-0000-000000000002' then
    raise exception 'Copy is not owned by the client';
  end if;
  if (select count(*) from public.template_phases where template_id = copy_id) <> 2 then
    raise exception 'Copy has the wrong number of phases';
  end if;
  if (select count(*) from public.template_exercises e join public.template_phases p on p.id = e.phase_id where p.template_id = copy_id) <> 2 then
    raise exception 'Copy lost exercises';
  end if;

  -- The current phase follows the copy: week 2 of the original is week 2 of the copy.
  select id into week_two_copy from public.template_phases where template_id = copy_id and position = 2;
  if (select current_phase_id from public.client_programs where id = program_id) is distinct from week_two_copy then
    raise exception 'Current phase did not map to the copy';
  end if;

  -- Customising again returns the same copy, not another one.
  again_id := public.customise_client_program(program_id);
  if again_id <> copy_id then raise exception 'Customising again made a second copy'; end if;

  -- A phase from a different template cannot become the client's current phase.
  begin
    perform public.set_client_phase(program_id, '14200000-0000-0000-0000-000000000003');
    raise exception 'A phase from another template was accepted';
  exception when invalid_parameter_value then null;
  end;

  -- The library template is untouched.
  if (select count(*) from public.template_phases where template_id = '14100000-0000-0000-0000-000000000001') <> 2 then
    raise exception 'Library template was changed';
  end if;
end;
$$;

-- The client sees their own copy, not other templates.
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000002', true);
do $$
begin
  if (select count(*) from public.program_templates) <> 1 then
    raise exception 'Client can see templates other than their own copy';
  end if;
end;
$$;
rollback;
select 'Client customisation, phase mapping, phase guard and client visibility passed' as result;

-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
-- Covers client management (20261112000000) and program detail (20261112010000).
begin;
insert into auth.users (id) values
  ('15000000-0000-0000-0000-000000000001'),
  ('15000000-0000-0000-0000-000000000002'),
  ('15000000-0000-0000-0000-000000000003');
insert into public.admin_profiles (id, display_name)
values ('15000000-0000-0000-0000-000000000001', 'Coach');
insert into public.client_profiles (id, display_name, coaching_mode) values
  ('15000000-0000-0000-0000-000000000002', 'Client A', 'human'),
  ('15000000-0000-0000-0000-000000000003', 'Client B', 'human');

set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);

do $$
declare
  library_id uuid; program_id uuid; copy_id uuid; phase_one uuid; phase_two uuid;
  demo_id uuid; started timestamptz;
begin
  insert into public.exercise_library (name, youtube_id) values ('Goblet squat', 'dQw4w9WgXcQ')
  returning id into demo_id;

  -- Save: RIR, per-set plan, phase length, and the library link by name (any capitals).
  library_id := public.save_program_template(jsonb_build_object(
    'kind', 'workout', 'goal', 'fat_loss', 'name', 'Library plan', 'rules', '{}'::jsonb,
    'phases', jsonb_build_array(
      jsonb_build_object('name', 'Week 1-4', 'duration_weeks', 4, 'exercises', jsonb_build_array(
        jsonb_build_object('name', 'goblet squat', 'sets', 3, 'reps', '6-10, 8-12 x2',
          'set_plan', jsonb_build_array(
            jsonb_build_object('reps', '6-10', 'rir', '2'),
            jsonb_build_object('reps', '8-12', 'rir', '1'),
            jsonb_build_object('reps', '8-12', 'rir', '1'))),
        jsonb_build_object('name', 'Press', 'sets', 3, 'reps', '8', 'rir', '2'))),
      jsonb_build_object('name', 'Week 5-8', 'exercises', '[]'::jsonb))));

  if (select duration_weeks from public.template_phases where template_id = library_id and position = 1) <> 4 then
    raise exception 'Phase length was not saved';
  end if;
  if (select jsonb_array_length(e.set_plan) from public.template_exercises e
      join public.template_phases p on p.id = e.phase_id
      where p.template_id = library_id and e.position = 1) <> 3 then
    raise exception 'Set plan was not saved';
  end if;
  if (select e.library_exercise_id from public.template_exercises e
      join public.template_phases p on p.id = e.phase_id
      where p.template_id = library_id and e.position = 1) is distinct from demo_id then
    raise exception 'Exercise was not linked to the library by name';
  end if;
  if (select e.rir from public.template_exercises e
      join public.template_phases p on p.id = e.phase_id
      where p.template_id = library_id and e.position = 2) <> '2' then
    raise exception 'RIR was not saved';
  end if;

  -- A library entry added later links to existing exercises with the same name.
  insert into public.exercise_library (name) values ('PRESS');
  if (select e.library_exercise_id from public.template_exercises e
      join public.template_phases p on p.id = e.phase_id
      where p.template_id = library_id and e.position = 2) is null then
    raise exception 'New library entry did not link to the existing exercise';
  end if;

  select id into phase_one from public.template_phases where template_id = library_id and position = 1;
  select id into phase_two from public.template_phases where template_id = library_id and position = 2;

  program_id := public.assign_client_program('15000000-0000-0000-0000-000000000002', library_id, null);

  -- Customising keeps RIR, set plans, phase lengths and links, and the phase clock.
  update public.client_programs set phase_started_at = now() - interval '30 days' where id = program_id;
  copy_id := public.customise_client_program(program_id);
  if (select count(*) from public.template_exercises e join public.template_phases p on p.id = e.phase_id
      where p.template_id = copy_id and jsonb_array_length(e.set_plan) = 3 and e.library_exercise_id = demo_id) <> 1 then
    raise exception 'Customised copy lost the set plan or library link';
  end if;
  if (select duration_weeks from public.template_phases where template_id = copy_id and position = 1) <> 4 then
    raise exception 'Customised copy lost the phase length';
  end if;
  select phase_started_at into started from public.client_programs where id = program_id;
  if started > now() - interval '29 days' then
    raise exception 'Customising reset the phase clock';
  end if;

  -- A client's copy cannot be assigned to another client.
  begin
    perform public.assign_client_program('15000000-0000-0000-0000-000000000003', copy_id, null);
    raise exception 'Another client was given a customised copy';
  exception when sqlstate '22023' then null;
  end;

  -- Moving phase restarts the clock; choosing the current phase again does not.
  perform public.set_client_phase(program_id,
    (select id from public.template_phases where template_id = copy_id and position = 2));
  if (select phase_started_at from public.client_programs where id = program_id) < now() - interval '1 minute' then
    raise exception 'Phase change did not restart the phase clock';
  end if;

  -- Coach marks messages read.
  insert into public.messages (client_id, sender_role, body)
  values ('15000000-0000-0000-0000-000000000002', 'coach', 'Hello');
  update public.messages set read_at = now() where client_id = '15000000-0000-0000-0000-000000000002';
  if exists (select 1 from public.messages where client_id = '15000000-0000-0000-0000-000000000002' and read_at is null) then
    raise exception 'Coach could not mark messages read';
  end if;

  -- Delete removes the client, their programs and their customised copy, but not the library.
  perform public.delete_client('15000000-0000-0000-0000-000000000002');
  if exists (select 1 from public.client_profiles where id = '15000000-0000-0000-0000-000000000002')
    or exists (select 1 from public.client_programs where client_id = '15000000-0000-0000-0000-000000000002')
    or exists (select 1 from public.program_templates where id = copy_id) then
    raise exception 'Client data was not deleted';
  end if;
  if not exists (select 1 from public.program_templates where id = library_id) then
    raise exception 'Deleting a client removed a library template';
  end if;

  -- The coach cannot delete their own account this way.
  begin
    perform public.delete_client('15000000-0000-0000-0000-000000000001');
    raise exception 'Coach deleted their own account';
  exception when sqlstate '22023' then null;
  end;
end $$;

-- Clients: read the library, cannot change it, cannot delete clients.
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000003', true);
do $$
begin
  if not exists (select 1 from public.exercise_library) then
    raise exception 'Clients cannot read the exercise library';
  end if;
  begin
    insert into public.exercise_library (name) values ('Client entry');
    raise exception 'A client added to the exercise library';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_client('15000000-0000-0000-0000-000000000003');
    raise exception 'A client called delete_client';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;

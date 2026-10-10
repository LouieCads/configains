-- Template library and program assignment. Each function runs in one transaction, so phase
-- positions and the client's active program stay consistent. Both are administrator-only.

-- Saves a template with its phases and exercises from the editor. Rows keep their ids, so a
-- client's current-phase pointer survives edits. Rows removed in the editor are deleted.
create or replace function public.save_program_template(payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_template_id uuid := coalesce(nullif(payload->>'id', '')::uuid, gen_random_uuid());
  phase jsonb;
  exercise jsonb;
  v_phase_id uuid;
  phase_position integer := 0;
  exercise_position integer;
begin
  if not public.is_admin() then raise insufficient_privilege using message = 'Administrator access is required.'; end if;

  insert into public.program_templates (id, kind, goal, name, description, rules, is_archived)
  values (
    v_template_id,
    payload->>'kind',
    payload->>'goal',
    payload->>'name',
    nullif(payload->>'description', ''),
    '{}'::jsonb,
    coalesce((payload->>'is_archived')::boolean, false)
  )
  on conflict (id) do update set
    kind = excluded.kind,
    goal = excluded.goal,
    name = excluded.name,
    description = excluded.description,
    is_archived = excluded.is_archived;

  delete from public.template_phases
  where template_phases.template_id = v_template_id
    and template_phases.id not in (
      select (p->>'id')::uuid from jsonb_array_elements(coalesce(payload->'phases', '[]'::jsonb)) p
      where p->>'id' is not null
    );

  for phase in select * from jsonb_array_elements(coalesce(payload->'phases', '[]'::jsonb)) loop
    phase_position := phase_position + 1;
    v_phase_id := coalesce(nullif(phase->>'id', '')::uuid, gen_random_uuid());

    insert into public.template_phases (id, template_id, position, name, instructions)
    values (v_phase_id, v_template_id, phase_position, phase->>'name', nullif(phase->>'instructions', ''))
    on conflict (id) do update set
      template_id = excluded.template_id,
      position = excluded.position,
      name = excluded.name,
      instructions = excluded.instructions;

    delete from public.template_exercises
    where template_exercises.phase_id = v_phase_id
      and template_exercises.id not in (
        select (e->>'id')::uuid from jsonb_array_elements(coalesce(phase->'exercises', '[]'::jsonb)) e
        where e->>'id' is not null
      );

    exercise_position := 0;
    for exercise in select * from jsonb_array_elements(coalesce(phase->'exercises', '[]'::jsonb)) loop
      exercise_position := exercise_position + 1;
      insert into public.template_exercises (id, phase_id, position, name, sets, reps, rest_seconds, notes)
      values (
        coalesce(nullif(exercise->>'id', '')::uuid, gen_random_uuid()),
        v_phase_id,
        exercise_position,
        exercise->>'name',
        nullif(exercise->>'sets', '')::integer,
        nullif(exercise->>'reps', ''),
        nullif(exercise->>'rest_seconds', '')::integer,
        nullif(exercise->>'notes', '')
      )
      on conflict (id) do update set
        phase_id = excluded.phase_id,
        position = excluded.position,
        name = excluded.name,
        sets = excluded.sets,
        reps = excluded.reps,
        rest_seconds = excluded.rest_seconds,
        notes = excluded.notes;
    end loop;
  end loop;

  return v_template_id;
end;
$$;

-- Ends the client's active program and starts a new one on the first phase of the workout template.
create or replace function public.assign_client_program(
  p_client_id uuid,
  p_workout_template_id uuid,
  p_nutrition_template_id uuid
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare new_program_id uuid; first_phase_id uuid;
begin
  if not public.is_admin() then raise insufficient_privilege using message = 'Administrator access is required.'; end if;
  if not exists (
    select 1 from public.program_templates
    where id = p_workout_template_id and kind = 'workout' and not is_archived
  ) then
    raise exception 'Choose an active workout template.' using errcode = '22023';
  end if;
  if p_nutrition_template_id is not null and not exists (
    select 1 from public.program_templates
    where id = p_nutrition_template_id and kind = 'nutrition' and not is_archived
  ) then
    raise exception 'Choose an active nutrition template.' using errcode = '22023';
  end if;

  select id into first_phase_id from public.template_phases
  where template_id = p_workout_template_id order by position limit 1;

  update public.client_programs set status = 'ended'
  where client_id = p_client_id and status = 'active';

  insert into public.client_programs (client_id, workout_template_id, nutrition_template_id, current_phase_id, source, status)
  values (p_client_id, p_workout_template_id, p_nutrition_template_id, first_phase_id, 'coach', 'active')
  returning id into new_program_id;

  return new_program_id;
end;
$$;

revoke all on function public.save_program_template(jsonb) from public, anon;
revoke all on function public.assign_client_program(uuid, uuid, uuid) from public, anon;
grant execute on function public.save_program_template(jsonb) to authenticated;
grant execute on function public.assign_client_program(uuid, uuid, uuid) to authenticated;

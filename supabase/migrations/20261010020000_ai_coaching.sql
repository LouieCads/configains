-- AI Coaching: templates now store matching rules, so the matcher can pick among approved templates.
-- save_program_template is replaced in full; the body is otherwise unchanged except for rules.

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
    coalesce(payload->'rules', '{}'::jsonb),
    coalesce((payload->>'is_archived')::boolean, false)
  )
  on conflict (id) do update set
    kind = excluded.kind,
    goal = excluded.goal,
    name = excluded.name,
    description = excluded.description,
    rules = excluded.rules,
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

revoke all on function public.save_program_template(jsonb) from public, anon;
grant execute on function public.save_program_template(jsonb) to authenticated;

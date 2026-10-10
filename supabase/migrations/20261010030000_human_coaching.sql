-- Human Coaching: per-client customisation and phase changes. Both run in one transaction and are administrator-only.

-- Points the client's active program at a copy of its workout template that only this client owns.
-- Edits to the copy never reach the library or other clients. Returns the copy's id.
create or replace function public.customise_client_program(p_program_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_program public.client_programs;
  v_source public.program_templates;
  v_copy_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then raise insufficient_privilege using message = 'Administrator access is required.'; end if;

  select * into v_program from public.client_programs where id = p_program_id and status = 'active';
  if v_program.id is null then raise exception 'That program is not active.' using errcode = '22023'; end if;

  select * into v_source from public.program_templates where id = v_program.workout_template_id;
  -- Already customised: keep the existing copy rather than making another.
  if v_source.owner_client_id is not null then return v_source.id; end if;

  insert into public.program_templates (id, kind, goal, name, description, rules, owner_client_id)
  values (v_copy_id, v_source.kind, v_source.goal, v_source.name, v_source.description, v_source.rules, v_program.client_id);

  -- Copy phases, then exercises. Phases are matched by position, so the copy keeps the same order.
  with new_phases as (
    insert into public.template_phases (template_id, position, name, instructions)
    select v_copy_id, position, name, instructions
    from public.template_phases where template_id = v_source.id
    returning id, position
  )
  insert into public.template_exercises (phase_id, position, name, sets, reps, rest_seconds, notes)
  select np.id, e.position, e.name, e.sets, e.reps, e.rest_seconds, e.notes
  from public.template_exercises e
  join public.template_phases op on op.id = e.phase_id and op.template_id = v_source.id
  join new_phases np on np.position = op.position;

  update public.client_programs cp
  set workout_template_id = v_copy_id,
      current_phase_id = (
        select np.id
        from public.template_phases np
        join public.template_phases op on op.id = cp.current_phase_id
        where np.template_id = v_copy_id and np.position = op.position
      )
  where cp.id = p_program_id;

  return v_copy_id;
end;
$$;

-- Moves the client to a phase of their current workout. Rejects phases from other templates.
create or replace function public.set_client_phase(p_program_id uuid, p_phase_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise insufficient_privilege using message = 'Administrator access is required.'; end if;
  if not exists (
    select 1
    from public.client_programs cp
    join public.template_phases tp on tp.template_id = cp.workout_template_id
    where cp.id = p_program_id and cp.status = 'active' and tp.id = p_phase_id
  ) then
    raise exception 'That phase is not part of this client''s workout.' using errcode = '22023';
  end if;
  update public.client_programs set current_phase_id = p_phase_id where id = p_program_id;
end;
$$;

revoke all on function public.customise_client_program(uuid) from public, anon;
revoke all on function public.set_client_phase(uuid, uuid) from public, anon;
grant execute on function public.customise_client_program(uuid) to authenticated;
grant execute on function public.set_client_phase(uuid, uuid) to authenticated;

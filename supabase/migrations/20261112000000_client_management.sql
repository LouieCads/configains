-- Client management: archive, delete, and stricter program assignment.

-- Archived clients keep their login and history but leave the coach's working lists.
alter table public.client_profiles add column archived_at timestamptz;

-- A client's customised copy may only ever be assigned to that same client. Library templates
-- (owner_client_id is null) can go to anyone. Replaced in full; otherwise unchanged.
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
      and (owner_client_id is null or owner_client_id = p_client_id)
  ) then
    raise exception 'Choose an active workout template.' using errcode = '22023';
  end if;
  if p_nutrition_template_id is not null and not exists (
    select 1 from public.program_templates
    where id = p_nutrition_template_id and kind = 'nutrition' and not is_archived
      and (owner_client_id is null or owner_client_id = p_client_id)
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

-- Removes a client's coaching data. Programs go first: they point at the client's customised
-- copies with ON DELETE RESTRICT, so the profile cascade alone could fail. Everything else
-- (assessments, logs, check-ins, messages, metrics, customised copies) cascades from the profile.
-- The server deletes the auth user afterwards with the service-role key.
create or replace function public.delete_client(p_client_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise insufficient_privilege using message = 'Administrator access is required.'; end if;
  if p_client_id = auth.uid() then
    raise exception 'You cannot delete your own account here.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.client_profiles where id = p_client_id) then
    raise exception 'Client not found.' using errcode = '22023';
  end if;
  delete from public.client_programs where client_id = p_client_id;
  delete from public.client_profiles where id = p_client_id;
end;
$$;

revoke all on function public.assign_client_program(uuid, uuid, uuid) from public, anon;
revoke all on function public.delete_client(uuid) from public, anon;
grant execute on function public.assign_client_program(uuid, uuid, uuid) to authenticated;
grant execute on function public.delete_client(uuid) to authenticated;

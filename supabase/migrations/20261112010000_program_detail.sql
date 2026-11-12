-- Program detail: RIR and per-set targets, phase lengths, unread messages, and an exercise
-- library with optional demonstrations.

-- Exercises: one RIR target for every set, or a per-set plan. An empty set_plan means every set
-- uses the exercise's own reps and rir. When set_plan has rows, sets equals its length.
alter table public.template_exercises
  add column rir text check (char_length(rir) <= 10),
  add column set_plan jsonb not null default '[]'::jsonb
    check (jsonb_typeof(set_plan) = 'array' and jsonb_array_length(set_plan) <= 20);

-- Phases: optional planned length, so the coach is reminded when a client is due to move on.
alter table public.template_phases
  add column duration_weeks integer check (duration_weeks between 1 and 52);

-- When the client started their current phase. Assignment starts it; phase changes reset it.
alter table public.client_programs
  add column phase_started_at timestamptz not null default now();

-- Messages: the coach's read marker for client messages.
alter table public.messages add column read_at timestamptz;
create index messages_unread_idx on public.messages (client_id) where read_at is null and sender_role = 'client';
create policy "admins mark messages read" on public.messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Exercise library: one entry per movement with an optional demonstration, reused by every program.
-- A YouTube video is stored as its 11-character id and shown through the privacy-enhanced player.
-- media_path is a file in the exercise-media bucket (short looping GIF, WebP or video clip).
create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  media_path text check (char_length(media_path) <= 200),
  media_kind text check (media_kind in ('image', 'video')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((media_path is null) = (media_kind is null))
);
create unique index exercise_library_name_idx on public.exercise_library (lower(name));
create trigger exercise_library_updated before update on public.exercise_library
  for each row execute function public.set_updated_at();

alter table public.exercise_library enable row level security;
revoke all on public.exercise_library from anon;
-- Demonstrations are not personal data: any signed-in client may read them.
create policy "signed-in users read exercise library" on public.exercise_library for select to authenticated
  using (true);
create policy "admins manage exercise library" on public.exercise_library for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Template exercises link to the library by name when saved. Links survive library renames.
alter table public.template_exercises
  add column library_exercise_id uuid references public.exercise_library(id) on delete set null;
create index template_exercises_library_idx on public.template_exercises (library_exercise_id);

-- A new or renamed library entry links to existing exercises with the same name that have no link.
create or replace function public.link_library_exercise()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  update public.template_exercises
  set library_exercise_id = new.id
  where library_exercise_id is null and lower(btrim(name)) = lower(btrim(new.name));
  return new;
end;
$$;
create trigger exercise_library_link after insert or update of name on public.exercise_library
  for each row execute function public.link_library_exercise();

-- Public bucket for demonstration clips. Uploads go straight from the coach's browser through a
-- signed upload URL, so files can be larger than the 4 MB CMS image limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-media', 'exercise-media', true, 26214400,
  array['image/gif', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

create policy "public reads exercise media" on storage.objects for select to anon, authenticated
using (bucket_id = 'exercise-media');
create policy "admins upload exercise media" on storage.objects for insert to authenticated
with check (bucket_id = 'exercise-media' and public.is_admin());
create policy "admins delete exercise media" on storage.objects for delete to authenticated
using (bucket_id = 'exercise-media' and public.is_admin());

-- Saves a template from the editor. Replaced in full: adds rir, set_plan, duration_weeks and the
-- library link. Rows keep their ids, so a client's current-phase pointer survives edits.
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

    insert into public.template_phases (id, template_id, position, name, instructions, duration_weeks)
    values (
      v_phase_id, v_template_id, phase_position, phase->>'name', nullif(phase->>'instructions', ''),
      nullif(phase->>'duration_weeks', '')::integer
    )
    on conflict (id) do update set
      template_id = excluded.template_id,
      position = excluded.position,
      name = excluded.name,
      instructions = excluded.instructions,
      duration_weeks = excluded.duration_weeks;

    delete from public.template_exercises
    where template_exercises.phase_id = v_phase_id
      and template_exercises.id not in (
        select (e->>'id')::uuid from jsonb_array_elements(coalesce(phase->'exercises', '[]'::jsonb)) e
        where e->>'id' is not null
      );

    exercise_position := 0;
    for exercise in select * from jsonb_array_elements(coalesce(phase->'exercises', '[]'::jsonb)) loop
      exercise_position := exercise_position + 1;
      insert into public.template_exercises
        (id, phase_id, position, name, sets, reps, rir, set_plan, rest_seconds, notes, library_exercise_id)
      values (
        coalesce(nullif(exercise->>'id', '')::uuid, gen_random_uuid()),
        v_phase_id,
        exercise_position,
        exercise->>'name',
        nullif(exercise->>'sets', '')::integer,
        nullif(exercise->>'reps', ''),
        nullif(exercise->>'rir', ''),
        case when jsonb_typeof(exercise->'set_plan') = 'array' then exercise->'set_plan' else '[]'::jsonb end,
        nullif(exercise->>'rest_seconds', '')::integer,
        nullif(exercise->>'notes', ''),
        (select l.id from public.exercise_library l
         where lower(l.name) = lower(btrim(exercise->>'name')) limit 1)
      )
      on conflict (id) do update set
        phase_id = excluded.phase_id,
        position = excluded.position,
        name = excluded.name,
        sets = excluded.sets,
        reps = excluded.reps,
        rir = excluded.rir,
        set_plan = excluded.set_plan,
        rest_seconds = excluded.rest_seconds,
        notes = excluded.notes,
        library_exercise_id = excluded.library_exercise_id;
    end loop;
  end loop;

  return v_template_id;
end;
$$;

-- Customise: replaced in full so the copy keeps RIR, set plans, phase lengths and library links.
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

  with new_phases as (
    insert into public.template_phases (template_id, position, name, instructions, duration_weeks)
    select v_copy_id, position, name, instructions, duration_weeks
    from public.template_phases where template_id = v_source.id
    returning id, position
  )
  insert into public.template_exercises
    (phase_id, position, name, sets, reps, rir, set_plan, rest_seconds, notes, library_exercise_id)
  select np.id, e.position, e.name, e.sets, e.reps, e.rir, e.set_plan, e.rest_seconds, e.notes, e.library_exercise_id
  from public.template_exercises e
  join public.template_phases op on op.id = e.phase_id and op.template_id = v_source.id
  join new_phases np on np.position = op.position;

  -- The client stays in the same phase, so phase_started_at is left as it is.
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

-- Phase changes restart the phase clock. Replaced in full.
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
  update public.client_programs
  set current_phase_id = p_phase_id, phase_started_at = now()
  where id = p_program_id and current_phase_id is distinct from p_phase_id;
end;
$$;

revoke all on function public.save_program_template(jsonb) from public, anon;
revoke all on function public.customise_client_program(uuid) from public, anon;
revoke all on function public.set_client_phase(uuid, uuid) from public, anon;
revoke all on function public.link_library_exercise() from public, anon;
grant execute on function public.save_program_template(jsonb) to authenticated;
grant execute on function public.customise_client_program(uuid) to authenticated;
grant execute on function public.set_client_phase(uuid, uuid) to authenticated;

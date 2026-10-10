-- Phase 2 coaching foundation: client accounts, assessments, program templates,
-- client programs, workout logs, check-ins and messages.
-- Clients only see their own rows. Administrators (the coach) see and manage everything.

create table public.client_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  coaching_mode text not null default 'ai' check (coaching_mode in ('ai', 'human')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  red_flags text[] not null default '{}',
  status text not null default 'submitted'
    check (status in ('submitted', 'ai_matched', 'needs_human_review', 'human_assigned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessments_client_idx on public.assessments (client_id);

-- owner_client_id is null for library templates. A coach's customised copy for one client sets it.
create table public.program_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('workout', 'nutrition')),
  goal text not null,
  name text not null,
  description text,
  rules jsonb not null default '{}'::jsonb,
  owner_client_id uuid references public.client_profiles(id) on delete cascade,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index program_templates_owner_idx on public.program_templates (owner_client_id);

create table public.template_phases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.program_templates(id) on delete cascade,
  position integer not null,
  name text not null,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, position) deferrable initially deferred
);

create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.template_phases(id) on delete cascade,
  position integer not null,
  name text not null,
  sets integer check (sets > 0),
  reps text,
  rest_seconds integer check (rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, position) deferrable initially deferred
);

create table public.client_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  workout_template_id uuid references public.program_templates(id) on delete restrict,
  nutrition_template_id uuid references public.program_templates(id) on delete restrict,
  current_phase_id uuid references public.template_phases(id) on delete set null,
  source text not null check (source in ('ai', 'coach')),
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One active program per client keeps "what is my plan" unambiguous.
create unique index client_programs_one_active_idx on public.client_programs (client_id) where status = 'active';

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  workout_template_id uuid references public.program_templates(id) on delete set null,
  nutrition_template_id uuid references public.program_templates(id) on delete set null,
  explanation text not null,
  model text not null,
  disclosure_version text not null,
  created_at timestamptz not null default now()
);

-- Entries hold per-exercise sets, reps and load. Client-generated ids let offline logs sync safely.
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  client_program_id uuid references public.client_programs(id) on delete set null,
  phase_id uuid references public.template_phases(id) on delete set null,
  logged_on date not null default current_date,
  completed boolean not null default true,
  duration_minutes integer check (duration_minutes >= 0),
  entries jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_logs_client_idx on public.workout_logs (client_id, logged_on);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  client_program_id uuid references public.client_programs(id) on delete set null,
  submitted_on date not null default current_date,
  body text not null check (char_length(body) between 1 and 4000),
  coach_feedback text,
  feedback_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index check_ins_client_idx on public.check_ins (client_id, submitted_on);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'coach')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_client_idx on public.messages (client_id, created_at);

create trigger client_profiles_updated before update on public.client_profiles for each row execute function public.set_updated_at();
create trigger assessments_updated before update on public.assessments for each row execute function public.set_updated_at();
create trigger program_templates_updated before update on public.program_templates for each row execute function public.set_updated_at();
create trigger template_phases_updated before update on public.template_phases for each row execute function public.set_updated_at();
create trigger template_exercises_updated before update on public.template_exercises for each row execute function public.set_updated_at();
create trigger client_programs_updated before update on public.client_programs for each row execute function public.set_updated_at();
create trigger workout_logs_updated before update on public.workout_logs for each row execute function public.set_updated_at();
create trigger check_ins_updated before update on public.check_ins for each row execute function public.set_updated_at();

alter table public.client_profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.program_templates enable row level security;
alter table public.template_phases enable row level security;
alter table public.template_exercises enable row level security;
alter table public.client_programs enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.workout_logs enable row level security;
alter table public.check_ins enable row level security;
alter table public.messages enable row level security;

-- Anonymous visitors get nothing from coaching tables.
revoke all on public.client_profiles, public.assessments, public.program_templates, public.template_phases,
  public.template_exercises, public.client_programs, public.ai_recommendations, public.workout_logs,
  public.check_ins, public.messages from anon;

-- Client profiles. Clients start on AI coaching; only the coach can move them to human coaching.
create policy "clients read own profile" on public.client_profiles for select to authenticated
  using (id = auth.uid());
create policy "clients create own profile" on public.client_profiles for insert to authenticated
  with check (id = auth.uid() and coaching_mode = 'ai');
create policy "admins manage client profiles" on public.client_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Assessments: clients submit and read their own. The coach reviews all.
create policy "clients read own assessments" on public.assessments for select to authenticated
  using (client_id = auth.uid());
create policy "clients submit own assessments" on public.assessments for insert to authenticated
  with check (client_id = auth.uid() and status = 'submitted');
create policy "admins manage assessments" on public.assessments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Templates: the coach manages the library. Clients see only templates assigned to them, or their own custom copy.
create policy "clients read assigned templates" on public.program_templates for select to authenticated
  using (
    owner_client_id = auth.uid()
    or exists (
      select 1 from public.client_programs cp
      where cp.client_id = auth.uid()
        and cp.status = 'active'
        and (cp.workout_template_id = program_templates.id or cp.nutrition_template_id = program_templates.id)
    )
  );
create policy "admins manage templates" on public.program_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Phases and exercises follow their parent template's visibility, enforced through the template policies above.
create policy "readers see phases of visible templates" on public.template_phases for select to authenticated
  using (exists (select 1 from public.program_templates t where t.id = template_phases.template_id));
create policy "admins manage phases" on public.template_phases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "readers see exercises of visible phases" on public.template_exercises for select to authenticated
  using (exists (select 1 from public.template_phases p where p.id = template_exercises.phase_id));
create policy "admins manage exercises" on public.template_exercises for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Client programs: each client reads their own assignment. The coach assigns and changes phases.
create policy "clients read own programs" on public.client_programs for select to authenticated
  using (client_id = auth.uid());
create policy "admins manage client programs" on public.client_programs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- AI recommendations: created through the client's own session, read by the client and the coach.
create policy "clients read own recommendations" on public.ai_recommendations for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = ai_recommendations.assessment_id and a.client_id = auth.uid()));
create policy "clients create own recommendations" on public.ai_recommendations for insert to authenticated
  with check (exists (select 1 from public.assessments a where a.id = ai_recommendations.assessment_id and a.client_id = auth.uid()));
create policy "admins manage recommendations" on public.ai_recommendations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Workout logs: clients log and review their own sessions. The coach reads them.
create policy "clients read own workout logs" on public.workout_logs for select to authenticated
  using (client_id = auth.uid());
create policy "clients write own workout logs" on public.workout_logs for insert to authenticated
  with check (client_id = auth.uid());
create policy "clients update own workout logs" on public.workout_logs for update to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "admins read workout logs" on public.workout_logs for select to authenticated
  using (public.is_admin());

-- Check-ins: clients submit and read their own. Only the coach writes feedback.
create policy "clients read own check-ins" on public.check_ins for select to authenticated
  using (client_id = auth.uid());
create policy "clients submit check-ins" on public.check_ins for insert to authenticated
  with check (client_id = auth.uid());
create policy "admins manage check-ins" on public.check_ins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Messages: direct coaching chat exists only for human-coached clients.
create policy "clients read own messages" on public.messages for select to authenticated
  using (client_id = auth.uid());
create policy "human-coached clients send messages" on public.messages for insert to authenticated
  with check (
    client_id = auth.uid()
    and sender_role = 'client'
    and exists (select 1 from public.client_profiles p where p.id = auth.uid() and p.coaching_mode = 'human')
  );
create policy "admins read messages" on public.messages for select to authenticated
  using (public.is_admin());
create policy "admins send messages" on public.messages for insert to authenticated
  with check (public.is_admin() and sender_role = 'coach');

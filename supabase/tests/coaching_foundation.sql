-- Run after all migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002'),
  ('12000000-0000-0000-0000-000000000003');
insert into public.admin_profiles (id, display_name)
values ('12000000-0000-0000-0000-000000000001', 'Coaching test admin');
insert into public.client_profiles (id, display_name, coaching_mode) values
  ('12000000-0000-0000-0000-000000000002', 'Client A', 'ai'),
  ('12000000-0000-0000-0000-000000000003', 'Client B', 'human');
insert into public.assessments (id, client_id, answers) values
  ('12100000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', '{"goal":"fat_loss"}'),
  ('12100000-0000-0000-0000-000000000003', '12000000-0000-0000-0000-000000000003', '{"goal":"muscle_gain"}');

set local role authenticated;

do $$
begin
  -- Client A sees only their own profile and assessment.
  perform set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000002', true);
  if (select count(*) from public.client_profiles) <> 1 then raise exception 'Client A can read other client profiles'; end if;
  if (select count(*) from public.assessments) <> 1 then raise exception 'Client A can read other assessments'; end if;

  -- Clients cannot write templates; the coach owns the library.
  begin
    insert into public.program_templates (kind, goal, name) values ('workout', 'fat_loss', 'Client A forged template');
    raise exception 'Client inserted a library template';
  exception when insufficient_privilege then null;
  end;

  -- Clients cannot self-assign human coaching.
  begin
    update public.client_profiles set coaching_mode = 'human' where id = '12000000-0000-0000-0000-000000000002';
    if (select coaching_mode from public.client_profiles where id = '12000000-0000-0000-0000-000000000002') <> 'ai' then
      raise exception 'Client self-assigned human coaching';
    end if;
  end;

  -- AI-coached clients cannot send coach messages.
  begin
    insert into public.messages (client_id, sender_role, body)
    values ('12000000-0000-0000-0000-000000000002', 'client', 'Hello coach');
    raise exception 'AI-coached client sent a message';
  exception when insufficient_privilege then null;
  end;

  -- Clients cannot forge coach feedback on their own check-in.
  insert into public.check_ins (id, client_id, body) values
    ('12200000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'Week one done');
  if (select count(*) from public.check_ins where feedback_at is not null) <> 0 then
    raise exception 'Check-in has coach feedback before the coach wrote it';
  end if;
  update public.check_ins set coach_feedback = 'Looks great', feedback_at = now()
  where id = '12200000-0000-0000-0000-000000000002';
  if (select coach_feedback from public.check_ins where id = '12200000-0000-0000-0000-000000000002') is not null then
    raise exception 'Client wrote coach feedback';
  end if;

  -- Client B sees only their own data, and can message the coach because they are human-coached.
  perform set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000003', true);
  if (select count(*) from public.assessments) <> 1 then raise exception 'Client B can read other assessments'; end if;
  if (select count(*) from public.assessments where client_id = '12000000-0000-0000-0000-000000000002') <> 0 then
    raise exception 'Client B can read Client A assessments';
  end if;
  insert into public.messages (client_id, sender_role, body)
  values ('12000000-0000-0000-0000-000000000003', 'client', 'Hello coach');
  if (select count(*) from public.messages) <> 1 then raise exception 'Human-coached client cannot see own message'; end if;

  -- Client B cannot read Client A's check-ins.
  if (select count(*) from public.check_ins) <> 0 then raise exception 'Client B can read Client A check-ins'; end if;

  -- The coach sees every client and writes feedback and messages.
  perform set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
  if (select count(*) from public.client_profiles) <> 2 then raise exception 'Coach cannot see all clients'; end if;
  if (select count(*) from public.assessments) <> 2 then raise exception 'Coach cannot see all assessments'; end if;
  insert into public.program_templates (kind, goal, name) values ('workout', 'fat_loss', 'Library template');
  update public.check_ins set coach_feedback = 'Keep going', feedback_at = now()
  where id = '12200000-0000-0000-0000-000000000002';
  if (select coach_feedback from public.check_ins where id = '12200000-0000-0000-0000-000000000002') <> 'Keep going' then
    raise exception 'Coach could not write check-in feedback';
  end if;
  insert into public.messages (client_id, sender_role, body)
  values ('12000000-0000-0000-0000-000000000003', 'coach', 'Hi Client B');
  if (select count(*) from public.messages where client_id = '12000000-0000-0000-0000-000000000003') <> 2 then
    raise exception 'Coach cannot see the client thread';
  end if;

  -- Clients only see templates assigned to them.
  perform set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000002', true);
  if (select count(*) from public.program_templates) <> 0 then raise exception 'Client sees unassigned templates'; end if;
end;
$$;

-- Anonymous visitors cannot read coaching data at all.
set local role anon;
do $$
begin
  begin
    perform 1 from public.client_profiles;
    raise exception 'Anonymous visitor can read client profiles';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.assessments;
    raise exception 'Anonymous visitor can read assessments';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'Coaching client isolation, coach-only writes and message gating passed' as result;

-- Run after both migrations in an isolated local Supabase/database. Rolls back fixtures.
begin;
insert into auth.users (id) values
  ('11000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000002');
insert into public.admin_profiles (id, display_name)
values ('11000000-0000-0000-0000-000000000001', 'CMS test admin');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
do $$
declare revision timestamptz; second_revision timestamptz; published_revision timestamptz;
begin
  revision := public.save_website_draft('{"test":"first"}', null);
  if (select count(*) from public.site_content where key = 'website') <> 0 then
    raise exception 'Saving a draft published it';
  end if;
  published_revision := public.publish_website_content(revision);
  second_revision := public.save_website_draft('{"test":"second"}', revision);
  if second_revision = revision then raise exception 'Draft revision did not change'; end if;
  if (select metadata->>'test' from public.site_content where key = 'website') <> 'first' then
    raise exception 'An unpublished draft leaked into public content';
  end if;
  begin
    perform public.save_website_draft('{"test":"stale"}', revision);
    raise exception 'A stale save was accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.publish_website_content(revision);
    raise exception 'A stale publish was accepted';
  exception when serialization_failure then null;
  end;
  perform public.publish_website_content(second_revision);
  if (select metadata->>'test' from public.site_content where key = 'website') <> 'second' then
    raise exception 'Publishing did not copy the reviewed draft';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
do $$
begin
  if exists (select 1 from public.site_content where key = 'website.draft') then
    raise exception 'A nonadmin read the draft';
  end if;
  begin
    perform public.save_website_draft('{}', null);
    raise exception 'A nonadmin saved a draft';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.admin_profiles (id) values ('11000000-0000-0000-0000-000000000002');
    raise exception 'An account assigned itself admin access';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local role anon;
do $$
begin
  if exists (select 1 from public.site_content where key = 'website.draft') then
    raise exception 'Anonymous visitors read a draft';
  end if;
  if not exists (select 1 from public.site_content where key = 'website') then
    raise exception 'Anonymous visitors cannot read published content';
  end if;
  begin
    perform public.publish_website_content(null);
    raise exception 'Anonymous visitors published a draft';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'CMS permissions, publication isolation, and stale revision checks passed' as result;

-- PERMANENT cleanup for ejngtvybgykkequkgnqu (Academy) ONLY.
-- This deletes the four Configains tables, INCLUDING THEIR ROWS, four CMS
-- functions, and four CMS Storage policies. Run the complete file in SQL Editor.
-- Have a current database backup before running this on the existing app.
-- Reviewed against D:/louig/Desktop/academy source and migrations.
-- The corresponding rehearsal succeeded on the affected project.
-- These checks do not authenticate the project ID; confirm the dashboard URL.
-- Academy tables, Auth users, extensions, buckets and migration history remain.
-- Delete the three confirmed-new, empty buckets in Storage afterward, then
-- repair only the three Configains migration-history entries using the CLI.
-- If any statement fails, run ROLLBACK; and investigate. Never add CASCADE.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regclass('public.academy_user') is null
    or to_regclass('public.student_profile') is null
    or to_regclass('public.sponsor_profile') is null then
    raise exception 'Expected Academy tables were not found. Stop and check the selected project and Academy source.';
  end if;

  if (
    select count(*)
    from supabase_migrations.schema_migrations
    where (version, name) in (
      ('20260928000000', 'initial_schema'),
      ('20261003000000', 'website_cms'),
      ('20261004000000', 'upload_limits')
    )
  ) <> 3 then
    raise exception 'Expected Configains migration history was not found. Stop and check the selected project.';
  end if;
end;
$$;

drop policy "public reads cms images" on storage.objects;
drop policy "admins upload cms images" on storage.objects;
drop policy "admins update cms images" on storage.objects;
drop policy "admins delete cms images" on storage.objects;

drop function public.save_website_draft(jsonb, timestamptz) restrict;
drop function public.publish_website_content(timestamptz) restrict;

drop table
  public.site_content,
  public.testimonials,
  public.transformations,
  public.admin_profiles
restrict;

drop function public.is_admin() restrict;
drop function public.set_updated_at() restrict;

commit;

select 'Configains database objects removed. Next: remove the three empty CMS buckets and repair only the Configains migration history.' as result;

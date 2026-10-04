-- Cleanup rehearsal ONLY for project ejngtvybgykkequkgnqu (Academy).
-- Run the entire file in that project's SQL Editor, with no text selected.
-- This is intentionally outside migrations and ends with ROLLBACK.
-- It briefly takes database locks, but does not commit the removals.
-- Do not replace ROLLBACK with COMMIT until the other application's source
-- or a pre-migration schema backup has been checked for overwritten functions.
-- PostgreSQL dependency tracking does not detect every application/RPC call
-- or reference inside a function body.
-- Storage buckets, Auth users, extensions, and migration history are untouched.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
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

rollback;

select 'Cleanup rehearsal passed. All removals were rolled back; nothing was deleted permanently.' as result;

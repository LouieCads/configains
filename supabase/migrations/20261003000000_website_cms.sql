-- Public copy and administrator-only drafts. Existing content is preserved.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;

drop policy if exists "public reads site content" on public.site_content;
create policy "public reads site content" on public.site_content
for select to anon, authenticated using (key <> 'website.draft');
create policy "admins read website drafts" on public.site_content
for select to authenticated using (public.is_admin());

drop policy "public reads published testimonials" on public.testimonials;
create policy "public reads published testimonials" on public.testimonials
for select to anon, authenticated using (is_published);
drop policy "public reads published transformations" on public.transformations;
create policy "public reads published transformations" on public.transformations
for select to anon, authenticated using (is_published);

create or replace function public.save_website_draft(content jsonb, expected_revision timestamptz)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare current_revision timestamptz; new_revision timestamptz;
begin
  if not public.is_admin() then raise insufficient_privilege; end if;
  select updated_at into current_revision from public.site_content where key = 'website.draft' for update;
  if current_revision is distinct from expected_revision then
    raise exception 'Draft has changed' using errcode = '40001';
  end if;
  if current_revision is null then
    begin
      insert into public.site_content (key, title, metadata) values ('website.draft', 'Website draft', content)
      returning updated_at into new_revision;
    exception when unique_violation then
      raise exception 'Draft has changed' using errcode = '40001';
    end;
  else
    update public.site_content set metadata = content where key = 'website.draft' returning updated_at into new_revision;
  end if;
  return new_revision;
end;
$$;

create or replace function public.publish_website_content(expected_revision timestamptz)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare draft public.site_content; published_revision timestamptz;
begin
  if not public.is_admin() then raise insufficient_privilege; end if;
  select * into draft from public.site_content where key = 'website.draft' for update;
  if draft.id is null or draft.updated_at is distinct from expected_revision then
    raise exception 'Draft has changed' using errcode = '40001';
  end if;
  insert into public.site_content (key, title, metadata) values ('website', 'Published website', draft.metadata)
  on conflict (key) do update set metadata = excluded.metadata
  returning updated_at into published_revision;
  return published_revision;
end;
$$;

revoke all on function public.save_website_draft(jsonb, timestamptz) from public, anon;
revoke all on function public.publish_website_content(timestamptz) from public, anon;
grant execute on function public.save_website_draft(jsonb, timestamptz) to authenticated;
grant execute on function public.publish_website_content(timestamptz) to authenticated;

alter table public.testimonials add column image_alt text;
alter table public.transformations add column before_image_alt text;
alter table public.transformations add column after_image_alt text;
-- A seed example is never an approved client endorsement.
update public.testimonials set is_published = false where name = 'Sample client' and quote = 'I finally found a routine I can stick with.';

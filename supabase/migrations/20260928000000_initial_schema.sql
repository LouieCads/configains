create extension if not exists pgcrypto;

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  image_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transformations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  story text,
  before_image_url text,
  after_image_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger site_content_updated before update on public.site_content for each row execute function public.set_updated_at();
create trigger testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();
create trigger transformations_updated before update on public.transformations for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles where id = auth.uid());
$$;

alter table public.admin_profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.testimonials enable row level security;
alter table public.transformations enable row level security;

create policy "admins read own profile" on public.admin_profiles for select to authenticated using (id = auth.uid());
create policy "public reads site content" on public.site_content for select to anon, authenticated using (true);
create policy "public reads published testimonials" on public.testimonials for select to anon using (is_published);
create policy "authenticated reads testimonials" on public.testimonials for select to authenticated using (public.is_admin());
create policy "public reads published transformations" on public.transformations for select to anon using (is_published);
create policy "authenticated reads transformations" on public.transformations for select to authenticated using (public.is_admin());

create policy "admins create site content" on public.site_content for insert to authenticated with check (public.is_admin());
create policy "admins update site content" on public.site_content for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete site content" on public.site_content for delete to authenticated using (public.is_admin());
create policy "admins create testimonials" on public.testimonials for insert to authenticated with check (public.is_admin());
create policy "admins update testimonials" on public.testimonials for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete testimonials" on public.testimonials for delete to authenticated using (public.is_admin());
create policy "admins create transformations" on public.transformations for insert to authenticated with check (public.is_admin());
create policy "admins update transformations" on public.transformations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete transformations" on public.transformations for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site', 'site', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('testimonials', 'testimonials', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('transformations', 'transformations', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "public reads cms images" on storage.objects for select to anon, authenticated
using (bucket_id in ('site', 'testimonials', 'transformations'));
create policy "admins upload cms images" on storage.objects for insert to authenticated
with check (bucket_id in ('site', 'testimonials', 'transformations') and public.is_admin());
create policy "admins update cms images" on storage.objects for update to authenticated
using (bucket_id in ('site', 'testimonials', 'transformations') and public.is_admin());
create policy "admins delete cms images" on storage.objects for delete to authenticated
using (bucket_id in ('site', 'testimonials', 'transformations') and public.is_admin());


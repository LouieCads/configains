insert into public.site_content (key, title, body)
values
  ('home.hero', 'Build strength that fits your life.', 'Practical online fitness coaching for sustainable progress.'),
  ('contact.email', 'Start a conversation', 'hello@configains.com')
on conflict (key) do update set title = excluded.title, body = excluded.body;

insert into public.testimonials (name, role, quote, is_published, sort_order)
values ('Sample client', 'Configains member', 'I finally found a routine I can stick with.', false, 1);


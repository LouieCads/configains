-- Match the CMS upload limit while preserving existing images.
update storage.buckets
set file_size_limit = 4194304
where id in ('site', 'testimonials', 'transformations');

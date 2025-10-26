-- Storage bucket: product-images (public read, admin-only write)
insert into storage.buckets (id, name, public) values ('product-images','product-images', true) on conflict do nothing;

-- Allow public read
create policy if not exists "Public read product images" on storage.objects for select using ( bucket_id = 'product-images');

-- Only admins can upload/delete
create policy if not exists "Admins write product images" on storage.objects for all using (
  bucket_id = 'product-images' and (select is_admin from public.profiles where id = auth.uid()) = true
);

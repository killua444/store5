-- Basic categories
insert into public.categories (name, slug) values
  ('T-Shirts','t-shirts'),
  ('Hoodies','hoodies')
  on conflict do nothing;

-- Example products
-- For brevity, add a couple; use app admin UI to add more and upload images
insert into public.products (title, slug, description, base_price, currency, rating)
values
  ('Shonen Hero Tee','shonen-hero-tee','Premium cotton tee with iconic shonen pose print.',199,'MAD',4.9),
  ('Mecha Hoodie','mecha-hoodie','Cozy fleece hoodie with retro mecha print.',349,'MAD',4.8)
  on conflict do nothing;

-- Link some variants
insert into public.variants (product_id, size, color, sku, price, stock)
select p.id, v.size, v.color, concat(p.slug,'-',v.size,'-',v.color), v.price, v.stock
from (
  values ('shonen-hero-tee','S','Black',199,10),
         ('shonen-hero-tee','M','Black',199,20),
         ('shonen-hero-tee','L','Black',199,15),
         ('mecha-hoodie','M','Black',349,8),
         ('mecha-hoodie','L','Black',349,6)
) as v(slug,size,color,price,stock)
join public.products p on p.slug = v.slug;

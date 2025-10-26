-- Enable extensions
create extension if not exists "pgcrypto" with schema public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  default_address text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  base_price numeric not null,
  currency text not null default 'MAD',
  rating numeric default 4.8,
  active boolean default true,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt text
);

create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  size text,
  color text,
  sku text unique,
  price numeric,
  stock int default 0
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  order_code text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  address text,
  notes text,
  subtotal numeric not null,
  shipping numeric not null default 0,
  total numeric not null,
  currency text not null default 'MAD',
  to_whatsapp text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  title text,
  size text,
  color text,
  qty int not null,
  unit_price numeric not null,
  line_total numeric not null
);

-- RLS
alter table public.profiles enable row level security;
create policy if not exists "profile is self" on public.profiles for select using (auth.uid() = id);

alter table public.products enable row level security;
create policy if not exists "products readable by all" on public.products for select using (true);
create policy if not exists "admins manage products" on public.products for all using ((select is_admin from public.profiles where id = auth.uid()) = true);

alter table public.orders enable row level security;
create policy if not exists "user reads own orders" on public.orders for select using (user_id = auth.uid() or (select is_admin from public.profiles where id = auth.uid()) = true);
create policy if not exists "user inserts own order" on public.orders for insert with check (user_id = auth.uid() or auth.uid() is null);
create policy if not exists "admins manage orders" on public.orders for all using ((select is_admin from public.profiles where id = auth.uid()) = true);

alter table public.order_items enable row level security;
create policy if not exists "order_items readable" on public.order_items for select using (true);
create policy if not exists "admins manage order_items" on public.order_items for all using ((select is_admin from public.profiles where id = auth.uid()) = true);

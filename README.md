# Haruki — Anime Print Store (React + Vite + Supabase)

Modern, responsive store for anime-print t-shirts & hoodies. Built with React 18 (Vite), JavaScript, CSS Modules, Zustand, React Router, react-hook-form + Yup, Framer Motion, lucide-react. Supports WhatsApp checkout and Supabase (Auth, DB, Storage, RLS). No Tailwind.

## Features
- Catalog with filters, search, sort, pagination
- Product detail with gallery zoom, variant picker, related
- Cart & Wishlist with localStorage persistence
- Checkout via WhatsApp (opens wa.me with encoded message)
- Supabase Auth (email/password, magic link)
- Admin: dashboard, CRUD (products/categories/variants), orders, settings
- Supabase Storage for product images (public), admin-only write
- Code-splitting routes, lazy-loaded product detail
- Light/Dark themes via class on <html>

## Tech Stack
- React 18 + Vite (JavaScript)
- CSS Modules with CSS variables
- Zustand for state
- React Router v6
- react-hook-form + Yup
- Supabase JS client
- Framer Motion, lucide-react

## Quick Start
1. Clone and install
```
npm i
```
2. Create .env (copy .env.example)
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_WHATSAPP_NUMBER=2126XXXXXXXX
VITE_STORE_CURRENCY=MAD
```
3. Supabase setup
- Create project in Supabase
- Enable Email Auth and Magic Link
- Run SQL from supabase/schema.sql (Tables + RLS policies)
- Create Storage bucket `product-images` (public). Policies: Public read; only admins can upload. See supabase/storage-policies.sql.
- After first sign-up, set your user as admin:
```
update public.profiles set is_admin = true where id = 'your-auth-user-uuid';
```
4. Seed data
- Run SQL in supabase/seed.sql to add categories/products/variants/images

5. Run
```
npm run dev
```
Open http://localhost:5173

## WhatsApp Checkout
- Cart page has "Send Order via WhatsApp" button. It composes the message:
```
Order ID: {{orderCode}}
Name: {{name}} | Phone: {{phone}} | Email: {{email}}
Address: {{address}}
Items:
- {{title}} ({{size}} / {{color}}) x{{qty}} @ {{unitPrice}} {{currency}} = {{lineTotal}}
Subtotal: {{subtotal}} {{currency}}
Shipping: {{shipping}} {{currency}}
TOTAL: {{total}} {{currency}}
Notes: {{notes}}
```
- Opens `https://wa.me/${VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
- After opening, inserts order with status `pending` into Supabase; items recorded in `order_items`.

## Scripts
- dev: Vite dev server
- build: build for production
- preview: preview build
- test: run Jest unit tests

## Project Structure
- index.html
- src/
  - main.jsx, App.jsx
  - routes/ (route components)
  - components/ (UI + shared)
  - stores/ (Zustand stores)
  - lib/ (supabase client, utils)
  - styles/ (global variables)
- supabase/
  - schema.sql, storage-policies.sql, seed.sql
- tests/
  - cart.test.js

## Notes
- Images use Supabase Storage public URLs with responsive srcSet
- Admin routes protected via profiles.is_admin
- LocalStorage persistence for cart/wishlist
- Accessibility: focus-visible styles, reduced motion, semantic HTML

## Build
```
npm run build && npm run preview
```

## License
MIT
-- Thrift shop (Pre-loved Corner) stock table, for thrift-admin.html.
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again; it never overwrites items you have added or edited.
--
-- Who can see what:
--   * The public shop (thrift.html) reads items ONLY through the function thrift_catalogue() below. It returns the
--     public fields of the items that are switched on. What you paid, where you bought it, your notes and who
--     bought it are never sent to shoppers.
--   * Only the shop owner (a row in the "admins" table, the same login as products.html) can read or change the table itself.
--
-- Run it again after updating the site: it adds anything new (such as the 3D model column) and never removes your data.
-- Photos and 3D files are stored in the same "product-files" storage bucket as the snack photos, under thrift/<item id>/.

create table if not exists public.thrift_items (
  id             text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  name           text not null check (char_length(name) between 1 and 160),
  category       text not null default 'Other' check (char_length(category) <= 60),
  price_sgd      numeric(8,2) not null check (price_sgd >= 0),
  was_sgd        numeric(8,2) check (was_sgd is null or was_sgd >= 0),            -- the original price, shown crossed out
  condition      text not null default 'Good' check (condition in ('Like new', 'Good', 'Fair')),
  size           text not null default '' check (char_length(size) <= 40),
  brand          text not null default '' check (char_length(brand) <= 60),
  description    text not null default '' check (char_length(description) <= 2000),
  photos         text[] not null default '{}' check (cardinality(photos) <= 8),     -- public picture addresses, first is the cover
  status         text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  active         boolean not null default true,                                      -- off = hidden from the shop
  listed_on      date not null default current_date,
  sort           integer not null default 0,
  -- private, for you only
  cost_sgd       numeric(8,2) check (cost_sgd is null or cost_sgd >= 0),            -- what you paid
  source         text not null default '' check (char_length(source) <= 120),       -- where you got it
  notes          text not null default '' check (char_length(notes) <= 1000),
  sold_price_sgd numeric(8,2) check (sold_price_sgd is null or sold_price_sgd >= 0),
  sold_on        date,
  buyer          text not null default '' check (char_length(buyer) <= 120),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 3D model settings for each item (shape, size, material, photo mapping). Added in a later version, so this is safe on an existing table.
alter table public.thrift_items add column if not exists model jsonb not null default '{}'::jsonb;

alter table public.thrift_items enable row level security;

drop policy if exists "owner manages thrift items" on public.thrift_items;
create policy "owner manages thrift items" on public.thrift_items
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

revoke all on public.thrift_items from anon;
grant select, insert, update, delete on public.thrift_items to authenticated;

-- What the public shop sees: only public fields, only items that are switched on.
-- "total" counts every row (even hidden ones), so the shop can tell "set up but empty" from "not set up yet".
create or replace function public.thrift_catalogue()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.thrift_items),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'category', category, 'price', price_sgd, 'was', was_sgd,
        'condition', condition, 'size', size, 'brand', brand, 'description', description,
        'photos', to_jsonb(photos), 'status', status, 'added', listed_on, 'model', model
      ) order by sort, listed_on desc, name)
      from public.thrift_items where active
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.thrift_catalogue() from public;
grant execute on function public.thrift_catalogue() to anon, authenticated;

-- Let the owner upload and remove thrift photos in the shared bucket (the snack photos already work the same way).
drop policy if exists "owner writes thrift photos" on storage.objects;
create policy "owner writes thrift photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-files' and exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (bucket_id = 'product-files' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

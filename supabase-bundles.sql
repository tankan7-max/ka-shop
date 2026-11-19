-- Bundles table for the Virtual Snack Shop.
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- (It is safe to run again; it will not overwrite bundles you have edited.)
--
-- Anyone can read the bundles that are switched on (the shop does this);
-- only the shop owner (a row in the "admins" table) can add, change or remove them.

create table if not exists public.bundles (
  id         text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  name       text not null check (char_length(name) between 1 and 120),
  blurb      text not null default '' check (char_length(blurb) <= 300),
  price_sgd  numeric(8,2) not null check (price_sgd >= 0),
  items      text[] not null check (cardinality(items) between 1 and 12),   -- product ids, in display order
  active     boolean not null default true,
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bundles enable row level security;

drop policy if exists "bundles are public to read" on public.bundles;
create policy "bundles are public to read" on public.bundles
  for select to anon, authenticated using (active);

drop policy if exists "owner manages bundles" on public.bundles;
create policy "owner manages bundles" on public.bundles
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

grant select on public.bundles to anon, authenticated;
grant insert, update, delete on public.bundles to authenticated;

-- The two starter bundles that were in products.json.
insert into public.bundles (id, name, blurb, price_sgd, items, sort) values
  ('bundle-movie-night', 'Movie Night Box', 'Five favourites for a movie night at home.', 15.90,
   array['twisties-bbq','lays-bbq','pringles-sco','kitkat-2f-6pack','kinder-bueno-milk'], 0),
  ('bundle-local-favourites', 'Local Favourites Box', 'The local classics, in one box.', 13.90,
   array['mamee-chicken','mamee-bbq','hello-panda','korean-seaweed','julies-peanut-butter'], 1)
on conflict (id) do nothing;

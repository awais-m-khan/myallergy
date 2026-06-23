-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  dob           date,
  avatar_emoji  text default '🙂',
  is_default    boolean default false,
  share_token   uuid unique default gen_random_uuid(),
  share_enabled boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── allergens ───────────────────────────────────────────────────────────────
create type severity_level as enum ('mild', 'moderate', 'severe', 'anaphylactic');

create table allergens (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id) on delete cascade not null,
  name            text not null,
  category        text,
  severity        severity_level not null,
  diagnosed_date  date,
  notes           text,
  off_tag         text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── dietary_flags ───────────────────────────────────────────────────────────
create table dietary_flags (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id) on delete cascade not null,
  flag        text not null,
  notes       text,
  created_at  timestamptz default now()
);

-- ─── scan_history ─────────────────────────────────────────────────────────────
create type scan_result as enum ('safe', 'unsafe', 'warning', 'unknown');

create table scan_history (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid references profiles(id) on delete cascade not null,
  barcode           text,
  product_name      text,
  brand             text,
  image_url         text,
  result            scan_result not null,
  flagged_allergens jsonb default '[]',
  scanned_at        timestamptz default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table allergens     enable row level security;
alter table dietary_flags enable row level security;
alter table scan_history  enable row level security;

-- Owner policies
create policy "owner_all" on profiles
  for all using (auth.uid() = user_id);

create policy "owner_all" on allergens
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "owner_all" on dietary_flags
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "owner_all" on scan_history
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Public share policies (anon read when share_enabled)
create policy "public_share_select" on profiles
  for select using (share_enabled = true);

create policy "public_share_allergens" on allergens
  for select using (
    profile_id in (select id from profiles where share_enabled = true)
  );

create policy "public_share_dietary" on dietary_flags
  for select using (
    profile_id in (select id from profiles where share_enabled = true)
  );

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute procedure set_updated_at();

create trigger set_updated_at before update on allergens
  for each row execute procedure set_updated_at();

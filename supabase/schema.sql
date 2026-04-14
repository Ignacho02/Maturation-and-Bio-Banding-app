create extension if not exists "pgcrypto";

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  age_group text not null,
  created_at timestamptz not null default now()
);

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age_group text not null,
  dob date not null,
  created_at timestamptz not null default now()
);

create table if not exists anthropometric_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  collected_at date not null,
  stature_cm numeric not null,
  body_mass_kg numeric not null,
  sitting_height_cm numeric not null,
  mother_height_cm numeric,
  father_height_cm numeric,
  created_at timestamptz not null default now(),
  unique (athlete_id, collected_at)
);

create table if not exists maturation_assessments (
  id uuid primary key default gen_random_uuid(),
  anthropometric_record_id uuid not null references anthropometric_records(id) on delete cascade,
  algorithm_version text not null,
  maturity_band text not null,
  primary_offset numeric not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists user_preferences (
  user_id uuid primary key,
  locale text not null default 'es'
);

-- Daily snapshot table — records end-of-day progress across all systems
create table if not exists daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  -- Water
  water_ml integer not null default 0,
  water_glasses integer not null default 0,
  water_goal_met boolean not null default false,
  -- Nutrition
  meals_logged integer not null default 0,
  total_calories integer not null default 0,
  -- Exercise
  exercise_done boolean not null default false,
  exercise_type text,
  exercise_duration_min integer,
  exercise_calories integer,
  -- Weight
  weight_kg decimal,
  bmi decimal,
  -- Fasting
  fasting_completed boolean not null default false,
  fasting_hours decimal,
  -- Checklist
  checklist_completed integer not null default 0,
  checklist_total integer not null default 7,
  checklist_pct integer not null default 0,
  no_alcohol boolean not null default false,
  no_fried_food boolean not null default false,
  -- Overall
  health_score integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table daily_snapshots enable row level security;

create policy "Allow all access to daily_snapshots"
  on daily_snapshots for all
  using (true)
  with check (true);

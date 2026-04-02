
-- User profile
CREATE TABLE IF NOT EXISTS public.user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT 'Saleh Seddik',
  full_name text DEFAULT 'Saleh Said Mohammed Seddik Ali',
  date_of_birth date DEFAULT '1992-10-20',
  height_cm int DEFAULT 171,
  starting_weight_kg decimal DEFAULT 88,
  target_weight_m1_kg decimal DEFAULT 84,
  target_weight_final_kg decimal DEFAULT 78,
  openai_api_key text,
  fasting_52_enabled boolean DEFAULT false,
  fasting_52_start_date date,
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

-- Weight logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_kg decimal NOT NULL,
  bmi decimal,
  body_fat_pct decimal,
  waist_cm decimal,
  notes text,
  logged_at timestamptz DEFAULT now()
);

-- Water logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  glasses int NOT NULL,
  ml_total int,
  logged_date date DEFAULT current_date UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Exercise logs
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_type text NOT NULL,
  duration_min int,
  speed_kmh decimal,
  distance_km decimal,
  calories int,
  heart_rate_avg int,
  is_training_day boolean DEFAULT false,
  notes text,
  logged_at timestamptz DEFAULT now()
);

-- Meal logs
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories int,
  protein_g decimal,
  carbs_g decimal,
  fat_g decimal,
  quality text DEFAULT 'ok',
  is_healthy boolean DEFAULT true,
  liver_score int DEFAULT 7,
  is_fast_day_meal boolean DEFAULT false,
  fast_day_running_calories int,
  logged_at timestamptz DEFAULT now()
);

-- Fasting logs
CREATE TABLE IF NOT EXISTS public.fasting_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_type text DEFAULT '16:8',
  fast_start timestamptz,
  fast_end timestamptz,
  target_hours int DEFAULT 16,
  actual_hours decimal,
  calories_on_fast_day int,
  completed boolean DEFAULT false,
  notes text,
  logged_date date DEFAULT current_date
);

-- 5:2 weekly schedule
CREATE TABLE IF NOT EXISTS public.fasting_52_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL,
  fast_day_1 date,
  fast_day_2 date,
  fast_day_1_completed boolean DEFAULT false,
  fast_day_2_completed boolean DEFAULT false,
  fast_day_1_calories int DEFAULT 0,
  fast_day_2_calories int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Daily checklist
CREATE TABLE IF NOT EXISTS public.daily_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_date date DEFAULT current_date UNIQUE,
  water_goal_met boolean DEFAULT false,
  exercise_done boolean DEFAULT false,
  no_alcohol boolean DEFAULT false,
  no_fried_food boolean DEFAULT false,
  sunlight_done boolean DEFAULT false,
  bedtime_ok boolean DEFAULT false,
  healthy_breakfast boolean DEFAULT false,
  if_16_8_completed boolean DEFAULT false,
  is_52_fast_day boolean DEFAULT false,
  fast_day_calories_ok boolean DEFAULT false,
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- AI chat history
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  module_context text,
  created_at timestamptz DEFAULT now()
);

-- Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_type text NOT NULL,
  target_value decimal,
  current_value decimal,
  unit text,
  target_date date,
  achieved boolean DEFAULT false,
  achieved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Open access policies for all tables (single-user app, no auth)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'user_profile','weight_logs','water_logs','exercise_logs','meal_logs',
    'fasting_logs','fasting_52_schedule','daily_checklist','ai_chat_history','goals'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "Allow all select on %1$s" ON public.%1$s FOR SELECT USING (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all insert on %1$s" ON public.%1$s FOR INSERT WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all update on %1$s" ON public.%1$s FOR UPDATE USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "Allow all delete on %1$s" ON public.%1$s FOR DELETE USING (true)', tbl);
  END LOOP;
END $$;

-- Seed user profile
INSERT INTO public.user_profile (name, full_name, date_of_birth, height_cm, starting_weight_kg, target_weight_m1_kg, target_weight_final_kg)
VALUES ('Saleh Seddik', 'Saleh Said Mohammed Seddik Ali', '1992-10-20', 171, 88, 84, 78);

-- Seed weight logs (known data points)
INSERT INTO public.weight_logs (weight_kg, bmi, notes, logged_at) VALUES
  (84, 28.7, 'Blood test 1 - Feb 4', '2026-02-04T10:00:00Z'),
  (88, 30.1, 'Blood test 2 - Mar 27', '2026-03-27T10:00:00Z');

-- Seed initial goals
INSERT INTO public.goals (goal_type, target_value, current_value, unit, target_date, notes) VALUES
  ('weight_loss_m1', 84, 88, 'kg', '2026-05-01', 'Month 1 target: reach 84kg'),
  ('weight_loss_final', 78, 88, 'kg', '2026-12-31', 'Final target: reach 78kg'),
  ('exercise_monthly', 20, 0, 'sessions', NULL, '20 sessions per month'),
  ('water_daily', 12, 0, 'glasses', NULL, '12 glasses (3L) per day'),
  ('if_compliance', 100, 0, '%', NULL, '16:8 IF compliance'),
  ('alcohol_free_streak', 30, 0, 'days', NULL, '30 day alcohol-free streak');

-- Create storage bucket for health records
INSERT INTO storage.buckets (id, name, public) VALUES ('health-records', 'health-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for health records bucket
CREATE POLICY "Allow all access to health-records" ON storage.objects FOR ALL USING (bucket_id = 'health-records') WITH CHECK (bucket_id = 'health-records');

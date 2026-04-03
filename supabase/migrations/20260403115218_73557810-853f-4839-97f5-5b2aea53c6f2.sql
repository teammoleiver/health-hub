
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  full_name TEXT,
  date_of_birth DATE,
  height_cm INTEGER,
  starting_weight_kg NUMERIC,
  target_weight_m1_kg NUMERIC,
  target_weight_final_kg NUMERIC,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add user_id to all existing tables
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.water_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.weight_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.exercise_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.daily_checklist ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.daily_snapshots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.fasting_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.fasting_52_schedule ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_chat_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.blood_test_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sleep_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Drop all old permissive RLS policies and create user-scoped ones

-- user_profile
DROP POLICY IF EXISTS "Allow all delete on user_profile" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all insert on user_profile" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all select on user_profile" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all update on user_profile" ON public.user_profile;
CREATE POLICY "Users manage own profile" ON public.user_profile FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- water_logs
DROP POLICY IF EXISTS "Allow all delete on water_logs" ON public.water_logs;
DROP POLICY IF EXISTS "Allow all insert on water_logs" ON public.water_logs;
DROP POLICY IF EXISTS "Allow all select on water_logs" ON public.water_logs;
DROP POLICY IF EXISTS "Allow all update on water_logs" ON public.water_logs;
CREATE POLICY "Users manage own water_logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- weight_logs
DROP POLICY IF EXISTS "Allow all delete on weight_logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Allow all insert on weight_logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Allow all select on weight_logs" ON public.weight_logs;
DROP POLICY IF EXISTS "Allow all update on weight_logs" ON public.weight_logs;
CREATE POLICY "Users manage own weight_logs" ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- exercise_logs
DROP POLICY IF EXISTS "Allow all delete on exercise_logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Allow all insert on exercise_logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Allow all select on exercise_logs" ON public.exercise_logs;
DROP POLICY IF EXISTS "Allow all update on exercise_logs" ON public.exercise_logs;
CREATE POLICY "Users manage own exercise_logs" ON public.exercise_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- meal_logs
DROP POLICY IF EXISTS "Allow all delete on meal_logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Allow all insert on meal_logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Allow all select on meal_logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Allow all update on meal_logs" ON public.meal_logs;
CREATE POLICY "Users manage own meal_logs" ON public.meal_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_checklist
DROP POLICY IF EXISTS "Allow all delete on daily_checklist" ON public.daily_checklist;
DROP POLICY IF EXISTS "Allow all insert on daily_checklist" ON public.daily_checklist;
DROP POLICY IF EXISTS "Allow all select on daily_checklist" ON public.daily_checklist;
DROP POLICY IF EXISTS "Allow all update on daily_checklist" ON public.daily_checklist;
CREATE POLICY "Users manage own daily_checklist" ON public.daily_checklist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_snapshots
DROP POLICY IF EXISTS "Allow all access to daily_snapshots" ON public.daily_snapshots;
CREATE POLICY "Users manage own daily_snapshots" ON public.daily_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fasting_logs
DROP POLICY IF EXISTS "Allow all delete on fasting_logs" ON public.fasting_logs;
DROP POLICY IF EXISTS "Allow all insert on fasting_logs" ON public.fasting_logs;
DROP POLICY IF EXISTS "Allow all select on fasting_logs" ON public.fasting_logs;
DROP POLICY IF EXISTS "Allow all update on fasting_logs" ON public.fasting_logs;
CREATE POLICY "Users manage own fasting_logs" ON public.fasting_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- fasting_52_schedule
DROP POLICY IF EXISTS "Allow all delete on fasting_52_schedule" ON public.fasting_52_schedule;
DROP POLICY IF EXISTS "Allow all insert on fasting_52_schedule" ON public.fasting_52_schedule;
DROP POLICY IF EXISTS "Allow all select on fasting_52_schedule" ON public.fasting_52_schedule;
DROP POLICY IF EXISTS "Allow all update on fasting_52_schedule" ON public.fasting_52_schedule;
CREATE POLICY "Users manage own fasting_52_schedule" ON public.fasting_52_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_chat_history
DROP POLICY IF EXISTS "Allow all delete on ai_chat_history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Allow all insert on ai_chat_history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Allow all select on ai_chat_history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Allow all update on ai_chat_history" ON public.ai_chat_history;
CREATE POLICY "Users manage own ai_chat_history" ON public.ai_chat_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goals
DROP POLICY IF EXISTS "Allow all delete on goals" ON public.goals;
DROP POLICY IF EXISTS "Allow all insert on goals" ON public.goals;
DROP POLICY IF EXISTS "Allow all select on goals" ON public.goals;
DROP POLICY IF EXISTS "Allow all update on goals" ON public.goals;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blood_test_records
DROP POLICY IF EXISTS "Allow all access to blood_test_records" ON public.blood_test_records;
CREATE POLICY "Users manage own blood_test_records" ON public.blood_test_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sleep_logs
DROP POLICY IF EXISTS "Allow all access to sleep_logs" ON public.sleep_logs;
CREATE POLICY "Users manage own sleep_logs" ON public.sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

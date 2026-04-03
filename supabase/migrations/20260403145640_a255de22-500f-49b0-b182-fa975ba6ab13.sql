
-- Food database table (shared, public read)
CREATE TABLE public.food_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name text NOT NULL,
  category text NOT NULL,
  kcal_per_100g numeric,
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  serving_g numeric,
  serving_description text,
  kcal_per_serving numeric,
  protein_per_serving numeric,
  fat_per_serving numeric,
  carbs_per_serving numeric,
  pcs_per_kg text,
  source_menu text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read food database"
ON public.food_database FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert food items"
ON public.food_database FOR INSERT
TO authenticated
WITH CHECK (true);

-- Weekly menu plans table
CREATE TABLE public.weekly_menu_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_label text,
  plan_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.weekly_menu_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly_menu_plans"
ON public.weekly_menu_plans FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for food search
CREATE INDEX idx_food_database_name ON public.food_database USING gin(to_tsvector('english', food_name));
CREATE INDEX idx_food_database_category ON public.food_database(category);

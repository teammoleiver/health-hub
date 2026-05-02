
CREATE TABLE IF NOT EXISTS public.user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  full_name text,
  date_of_birth date,
  height_cm numeric,
  starting_weight_kg numeric,
  target_weight_m1_kg numeric,
  target_weight_final_kg numeric,
  fasting_52_enabled boolean DEFAULT false,
  fasting_52_start_date date,
  preferred_language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own user_profile"
ON public.user_profile FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

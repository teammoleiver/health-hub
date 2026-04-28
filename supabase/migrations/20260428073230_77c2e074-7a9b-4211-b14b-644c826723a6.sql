ALTER TABLE public.social_writer_settings
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS career_summary text,
  ADD COLUMN IF NOT EXISTS expertise text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS writing_samples text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS profile_actor_id text,
  ADD COLUMN IF NOT EXISTS last_self_analyzed_at timestamptz;

ALTER TABLE public.social_profiles
  ADD COLUMN IF NOT EXISTS is_self boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS social_profiles_user_self_idx
  ON public.social_profiles(user_id) WHERE is_self = true;
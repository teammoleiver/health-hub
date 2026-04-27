ALTER TABLE public.social_scrape_runs
  ADD COLUMN IF NOT EXISTS actor_id text,
  ADD COLUMN IF NOT EXISTS actor_input jsonb,
  ADD COLUMN IF NOT EXISTS polling_steps jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS response_excerpt text,
  ADD COLUMN IF NOT EXISTS run_url text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS zero_post_reason text,
  ADD COLUMN IF NOT EXISTS forced_rotation boolean NOT NULL DEFAULT false;

ALTER TABLE public.social_apify_accounts
  ADD COLUMN IF NOT EXISTS actor_input_defaults jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_social_scrape_runs_user_ran_at
  ON public.social_scrape_runs (user_id, ran_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_scrape_runs_account
  ON public.social_scrape_runs (apify_account_id, ran_at DESC);
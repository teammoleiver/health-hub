CREATE TABLE public.social_apify_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  api_token text NOT NULL,
  actor_id text,
  monthly_budget_usd numeric NOT NULL DEFAULT 5.00,
  cost_per_10_posts_usd numeric NOT NULL DEFAULT 0.50,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  posts_used_this_period integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  last_test_status text,
  last_test_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_apify_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social_apify_accounts"
ON public.social_apify_accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_social_apify_accounts_user ON public.social_apify_accounts(user_id, active);

-- Track which Apify account scraped each post (for accounting + dedupe)
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS apify_account_id uuid;

-- Track which account & ISO week was used per profile to enforce "never twice/week"
CREATE TABLE public.social_scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  apify_account_id uuid NOT NULL,
  iso_year int NOT NULL,
  iso_week int NOT NULL,
  posts_fetched int NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error text,
  ran_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social_scrape_runs"
ON public.social_scrape_runs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scrape_runs_user_week ON public.social_scrape_runs(user_id, iso_year, iso_week);
CREATE INDEX idx_scrape_runs_profile_week ON public.social_scrape_runs(profile_id, iso_year, iso_week);
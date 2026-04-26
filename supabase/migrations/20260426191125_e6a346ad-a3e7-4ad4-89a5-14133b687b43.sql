
-- Enable required extensions for scheduled scraping
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── social_profiles ──
CREATE TABLE public.social_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_url text NOT NULL,
  username text,
  display_name text,
  company text,
  location text,
  title text,
  info_summary text,
  followers integer DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  scrape_cadence text NOT NULL DEFAULT 'daily',
  apify_actor_id text,
  last_scraped_at timestamptz,
  last_scrape_status text,
  last_scrape_error text,
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_profiles" ON public.social_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_profiles_user ON public.social_profiles(user_id);
CREATE UNIQUE INDEX uniq_social_profiles_user_url ON public.social_profiles(user_id, profile_url);

-- ── social_posts ──
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid REFERENCES public.social_profiles(id) ON DELETE CASCADE,
  external_id text,
  author text,
  company text,
  post_text text,
  post_type text DEFAULT 'post',
  post_url text,
  posted_at timestamptz,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  views integer DEFAULT 0,
  raw_payload jsonb,
  scraped_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_posts" ON public.social_posts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_posts_user ON public.social_posts(user_id);
CREATE INDEX idx_social_posts_profile ON public.social_posts(profile_id);
CREATE INDEX idx_social_posts_posted_at ON public.social_posts(posted_at DESC);
CREATE UNIQUE INDEX uniq_social_posts_external ON public.social_posts(user_id, profile_id, external_id) WHERE external_id IS NOT NULL;

-- ── social_hot_topics ──
CREATE TABLE public.social_hot_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  score integer DEFAULT 0,
  post_count integer DEFAULT 0,
  profile_count integer DEFAULT 0,
  timeframe text,
  related_post_ids uuid[] DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_hot_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_hot_topics" ON public.social_hot_topics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_hot_topics_user ON public.social_hot_topics(user_id);

-- ── social_content_plan ──
CREATE TABLE public.social_content_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hook text NOT NULL,
  body text,
  format text DEFAULT 'insight',
  pillar text DEFAULT 'general',
  framework text,
  status text NOT NULL DEFAULT 'planned',
  image_status text DEFAULT 'not started',
  image_url text,
  scheduled_date date,
  scheduled_day text,
  week_number integer,
  source_post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  source_topic_id uuid REFERENCES public.social_hot_topics(id) ON DELETE SET NULL,
  posted_at timestamptz,
  position integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_content_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_content_plan" ON public.social_content_plan
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_content_plan_user ON public.social_content_plan(user_id);
CREATE INDEX idx_social_content_plan_status ON public.social_content_plan(status);

-- ── social_generated_drafts ──
CREATE TABLE public.social_generated_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  source_topic_id uuid REFERENCES public.social_hot_topics(id) ON DELETE CASCADE,
  framework text NOT NULL,
  body text NOT NULL,
  word_count integer,
  promoted boolean DEFAULT false,
  plan_id uuid REFERENCES public.social_content_plan(id) ON DELETE SET NULL,
  rating integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_generated_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_generated_drafts" ON public.social_generated_drafts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_drafts_user ON public.social_generated_drafts(user_id);
CREATE INDEX idx_social_drafts_source ON public.social_generated_drafts(source_post_id);

-- ── social_writer_settings ──
CREATE TABLE public.social_writer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  custom_system_prompt text,
  banned_words text[] DEFAULT '{}',
  preferred_provider text NOT NULL DEFAULT 'lovable',
  anthropic_model text DEFAULT 'claude-sonnet-4-20250514',
  openai_model text DEFAULT 'gpt-5-mini',
  lovable_model text DEFAULT 'google/gemini-3-flash-preview',
  default_word_limit integer DEFAULT 150,
  voice_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_writer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_writer_settings" ON public.social_writer_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── updated_at triggers ──
CREATE TRIGGER trg_social_profiles_updated BEFORE UPDATE ON public.social_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();
CREATE TRIGGER trg_social_content_plan_updated BEFORE UPDATE ON public.social_content_plan
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();
CREATE TRIGGER trg_social_writer_settings_updated BEFORE UPDATE ON public.social_writer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();

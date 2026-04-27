
-- 1) Editable framework prompts on writer settings
ALTER TABLE public.social_writer_settings
  ADD COLUMN IF NOT EXISTS framework_prompts jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Dedupe scraped posts: unique by (user_id, post_url) when post_url is present
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_user_url_uniq
  ON public.social_posts (user_id, post_url)
  WHERE post_url IS NOT NULL;

-- Helpful indexes for history queries
CREATE INDEX IF NOT EXISTS social_posts_profile_idx ON public.social_posts (profile_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS social_posts_user_scraped_idx ON public.social_posts (user_id, scraped_at DESC);

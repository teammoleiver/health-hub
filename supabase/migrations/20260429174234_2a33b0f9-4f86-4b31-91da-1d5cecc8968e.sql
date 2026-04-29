
CREATE TABLE public.social_rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feed_url text NOT NULL,
  label text,
  cadence text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_fetch_status text,
  last_fetch_error text,
  articles_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feed_url)
);
ALTER TABLE public.social_rss_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_rss_feeds" ON public.social_rss_feeds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.social_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feed_id uuid REFERENCES public.social_rss_feeds(id) ON DELETE CASCADE,
  title text NOT NULL,
  snippet text,
  article_url text NOT NULL,
  author text,
  source_label text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  UNIQUE (user_id, article_url)
);
ALTER TABLE public.social_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_articles" ON public.social_articles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_social_articles_user_published ON public.social_articles (user_id, published_at DESC NULLS LAST);
CREATE INDEX idx_social_articles_feed ON public.social_articles (feed_id);

CREATE TABLE public.social_hot_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  score integer DEFAULT 0,
  timeframe text,
  article_count integer DEFAULT 0,
  related_article_ids uuid[] DEFAULT '{}'::uuid[],
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_hot_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social_hot_news" ON public.social_hot_news
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.social_content_plan
  ADD COLUMN IF NOT EXISTS source_article_id uuid,
  ADD COLUMN IF NOT EXISTS source_hotnews_id uuid,
  ADD COLUMN IF NOT EXISTS source_kind text DEFAULT 'manual';

CREATE OR REPLACE FUNCTION public.touch_social_rss_feeds_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_social_rss_feeds_updated_at
BEFORE UPDATE ON public.social_rss_feeds
FOR EACH ROW EXECUTE FUNCTION public.touch_social_rss_feeds_updated_at();

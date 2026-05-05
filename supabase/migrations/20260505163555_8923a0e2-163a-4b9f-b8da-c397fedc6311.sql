CREATE TABLE public.social_website_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  websites TEXT[] NOT NULL DEFAULT '{}',
  sites_processed INT NOT NULL DEFAULT 0,
  sites_used INT NOT NULL DEFAULT 0,
  per_site JSONB NOT NULL DEFAULT '[]'::jsonb,
  reference_web_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_website_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner select" ON public.social_website_enrichments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner insert" ON public.social_website_enrichments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner delete" ON public.social_website_enrichments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_swe_user_created ON public.social_website_enrichments(user_id, created_at DESC);
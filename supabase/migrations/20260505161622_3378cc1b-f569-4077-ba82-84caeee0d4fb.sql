ALTER TABLE public.social_writer_settings
  ADD COLUMN IF NOT EXISTS reference_websites text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reference_web_context text,
  ADD COLUMN IF NOT EXISTS last_websites_enriched_at timestamptz;
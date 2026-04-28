ALTER TABLE public.social_writer_settings
ADD COLUMN IF NOT EXISTS last_voice_enriched_at TIMESTAMPTZ;
ALTER TABLE public.canva_oauth_tokens
  ADD COLUMN IF NOT EXISTS refresh_lock_owner text,
  ADD COLUMN IF NOT EXISTS refresh_lock_until timestamptz;
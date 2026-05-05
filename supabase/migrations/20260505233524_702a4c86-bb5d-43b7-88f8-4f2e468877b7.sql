ALTER TABLE public.canva_oauth_tokens
  ADD COLUMN IF NOT EXISTS access_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS access_token_iv text,
  ADD COLUMN IF NOT EXISTS refresh_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS refresh_token_iv text;

ALTER TABLE public.canva_oauth_tokens
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

ALTER TABLE public.canva_oauth_tokens
  ALTER COLUMN refresh_token_ciphertext SET NOT NULL,
  ALTER COLUMN refresh_token_iv SET NOT NULL;
CREATE TABLE IF NOT EXISTS public.canva_oauth_tokens (
  id text PRIMARY KEY DEFAULT 'default',
  access_token text,
  refresh_token text NOT NULL,
  expires_at timestamptz,
  refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canva_oauth_tokens_singleton CHECK (id = 'default')
);

ALTER TABLE public.canva_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct Canva token access" ON public.canva_oauth_tokens;
CREATE POLICY "No direct Canva token access"
ON public.canva_oauth_tokens
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP TRIGGER IF EXISTS trg_canva_oauth_tokens_updated_at ON public.canva_oauth_tokens;
CREATE TRIGGER trg_canva_oauth_tokens_updated_at
BEFORE UPDATE ON public.canva_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();
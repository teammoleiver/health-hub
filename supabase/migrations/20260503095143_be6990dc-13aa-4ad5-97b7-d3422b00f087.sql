
-- Webhook settings per user/platform
CREATE TABLE public.social_webhook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('linkedin','facebook','instagram','twitter','youtube')),
  webhook_url text,
  json_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);
ALTER TABLE public.social_webhook_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_settings_owner" ON public.social_webhook_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_webhook_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_touch_webhook_settings BEFORE UPDATE ON public.social_webhook_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_webhook_settings_updated_at();

-- Planner additions
ALTER TABLE public.social_content_plan
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS scheduled_time time,
  ADD COLUMN IF NOT EXISTS webhook_status text,
  ADD COLUMN IF NOT EXISTS webhook_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_response jsonb,
  ADD COLUMN IF NOT EXISTS webhook_error text,
  ADD COLUMN IF NOT EXISTS source_content_item_id uuid;

CREATE INDEX IF NOT EXISTS idx_plan_due
  ON public.social_content_plan (status, scheduled_date, scheduled_time)
  WHERE status = 'scheduled';

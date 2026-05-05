
-- Carousel Generator: carousels table + storage bucket

CREATE TABLE IF NOT EXISTS public.carousels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  posts jsonb NOT NULL,
  copy jsonb,
  canva_design_id text,
  canva_view_url text,
  canva_edit_url text,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own carousels" ON public.carousels
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own carousels" ON public.carousels
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own carousels" ON public.carousels
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own carousels" ON public.carousels
  FOR DELETE USING (auth.uid() = user_id);

-- Public storage bucket for exported carousel PNGs
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousel-exports', 'carousel-exports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "carousel-exports public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'carousel-exports');
CREATE POLICY "carousel-exports authed write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'carousel-exports');
CREATE POLICY "carousel-exports authed update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'carousel-exports');

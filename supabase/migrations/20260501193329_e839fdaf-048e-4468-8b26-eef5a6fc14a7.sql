-- Categories
CREATE TABLE public.content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  color text DEFAULT '#1D9E75',
  icon text DEFAULT 'Folder',
  position integer DEFAULT 0,
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_categories owner all" ON public.content_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_content_categories_updated BEFORE UPDATE ON public.content_categories FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();

-- Items (unified)
CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.content_categories(id) ON DELETE SET NULL,
  category_name text,
  -- shared
  title text NOT NULL,
  level text,
  duration text,
  source_url text,
  key_topics text,
  -- lessons
  course_name text,
  course_description text,
  lesson_number numeric,
  -- reference videos
  creator text,
  published_label text,
  -- planning
  target_platforms text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'idea',
  item_type text NOT NULL DEFAULT 'lesson', -- lesson | reference | idea
  origin text NOT NULL DEFAULT 'manual',    -- excel | manual | ai | web_search
  notes text,
  raw_payload jsonb,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_items owner all" ON public.content_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_content_items_user_cat ON public.content_items(user_id, category_id);
CREATE INDEX idx_content_items_user_status ON public.content_items(user_id, status);
CREATE TRIGGER trg_content_items_updated BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();

-- Chat history for Content Studio AI
CREATE TABLE public.content_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL, -- user | assistant | system
  content text NOT NULL,
  action_kind text,   -- nl_filter | brainstorm | combine | web_search | add_to_planner
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_chat_messages owner all" ON public.content_chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_content_chat_user_time ON public.content_chat_messages(user_id, created_at DESC);
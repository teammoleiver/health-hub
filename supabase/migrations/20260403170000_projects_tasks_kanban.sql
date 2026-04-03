-- ============================================================
-- Projects, Tasks & Kanban Columns
-- ============================================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  outcome_statement TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  area TEXT NOT NULL DEFAULT 'personal',
  horizon TEXT NOT NULL DEFAULT 'horizon_1',
  color TEXT DEFAULT '#1D9E75',
  icon TEXT DEFAULT 'Folder',
  due_date DATE,
  start_date DATE,
  completed_at TIMESTAMPTZ,
  milestones JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  task_ids TEXT[] DEFAULT '{}',
  next_action_id UUID,
  is_stuck BOOLEAN DEFAULT true,
  health_module_link TEXT,
  brainstorm_notes TEXT DEFAULT '',
  success_criteria TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();


-- 2. Kanban columns table
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#1D9E75',
  wip_limit INT,
  col_order INT DEFAULT 0,
  icon TEXT DEFAULT 'Circle',
  is_default BOOLEAN DEFAULT false,
  status_mapping TEXT DEFAULT 'inbox',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own kanban_columns" ON public.kanban_columns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inbox',
  column_id TEXT NOT NULL DEFAULT 'col_inbox',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'none',
  contexts TEXT[] DEFAULT '{}',
  due_date DATE,
  estimated_minutes INT,
  is_two_minute_task BOOLEAN DEFAULT false,
  waiting_for TEXT,
  energy_required TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  health_module_link TEXT,
  subtasks JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  task_order INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index for fast project-task lookups
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_column ON public.tasks(user_id, column_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);


-- 4. Seed default kanban columns for existing users
-- This inserts default columns for every user who already has a profile.
-- New users get columns seeded via the app on first visit.
INSERT INTO public.kanban_columns (user_id, title, color, wip_limit, col_order, icon, is_default, status_mapping)
SELECT
  p.user_id, v.title, v.color, v.wip_limit, v.col_order, v.icon, v.is_default, v.status_mapping
FROM public.profiles p
CROSS JOIN (VALUES
  ('Inbox',           '#6366f1', NULL, 0, 'Inbox',        true,  'inbox'),
  ('Next Actions',    '#f59e0b', NULL, 1, 'Zap',          true,  'next_action'),
  ('In Progress',     '#1D9E75', 3,    2, 'Play',         true,  'in_progress'),
  ('Waiting For',     '#ef4444', NULL, 3, 'Clock',        true,  'waiting_for'),
  ('Someday / Maybe', '#8b5cf6', NULL, 4, 'Moon',         false, 'someday_maybe'),
  ('Done',            '#10b981', NULL, 5, 'CheckCircle2', true,  'done')
) AS v(title, color, wip_limit, col_order, icon, is_default, status_mapping)
ON CONFLICT DO NOTHING;

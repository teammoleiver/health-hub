
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing schedule if re-running
DO $$ BEGIN
  PERFORM cron.unschedule('dispatch-due-posts-every-minute');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'dispatch-due-posts-every-minute',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://vpsaonpsidmuzufhlbis.supabase.co/functions/v1/dispatch-due-posts',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwc2FvbnBzaWRtdXp1ZmhsYmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM3ODMsImV4cCI6MjA5MDY5OTc4M30.S284eEnxfRguVlEhTjBLuVM-MG2miQcskOUhv51Y07Y'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

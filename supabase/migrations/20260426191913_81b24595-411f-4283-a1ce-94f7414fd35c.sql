SELECT cron.schedule(
  'scrape-linkedin-daily-job',
  '0 6 * * *',
  $$SELECT net.http_post(
    url:='https://vpsaonpsidmuzufhlbis.supabase.co/functions/v1/scrape-linkedin-daily',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwc2FvbnBzaWRtdXp1ZmhsYmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM3ODMsImV4cCI6MjA5MDY5OTc4M30.S284eEnxfRguVlEhTjBLuVM-MG2miQcskOUhv51Y07Y"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);
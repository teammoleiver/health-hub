SELECT cron.schedule(
  'social-rss-hourly-fetch',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://vpsaonpsidmuzufhlbis.supabase.co/functions/v1/fetch-rss-articles',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwc2FvbnBzaWRtdXp1ZmhsYmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM3ODMsImV4cCI6MjA5MDY5OTc4M30.S284eEnxfRguVlEhTjBLuVM-MG2miQcskOUhv51Y07Y"}'::jsonb,
    body:='{"scheduled":true,"all_due":true}'::jsonb
  ) as request_id;
  $$
);
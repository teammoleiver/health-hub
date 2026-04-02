-- Blood test records table for AI-analyzed PDF reports
create table if not exists blood_test_records (
  id uuid primary key default gen_random_uuid(),
  test_date date not null,
  source text not null default 'Uploaded Report',
  file_name text,
  weight_kg decimal,
  bmi decimal,
  markers jsonb not null default '[]'::jsonb,
  summary text,
  recommendations jsonb default '[]'::jsonb,
  risk_factors jsonb default '[]'::jsonb,
  pdf_storage_path text,
  applied boolean not null default false,
  uploaded_at timestamptz not null default now(),
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

-- Open access for single-user app
alter table blood_test_records enable row level security;

create policy "Allow all access to blood_test_records"
  on blood_test_records for all
  using (true)
  with check (true);

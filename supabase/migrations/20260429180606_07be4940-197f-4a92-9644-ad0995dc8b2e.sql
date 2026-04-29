-- Search providers (flexible — Linkup today, others later)
create table if not exists public.social_search_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  provider_kind text not null default 'linkup', -- 'linkup' | 'custom_http' | 'apify'
  endpoint_url text not null default 'https://api.linkup.so/v1/search',
  http_method text not null default 'POST',
  auth_header_name text not null default 'Authorization',
  auth_header_prefix text not null default 'Bearer ',
  api_key_secret_name text not null default 'LINKUP_API_KEY', -- name of the env secret to use
  default_body jsonb not null default '{"depth":"standard","outputType":"sourcedAnswer","includeImages":false}'::jsonb,
  default_headers jsonb not null default '{"Content-Type":"application/json"}'::jsonb,
  query_field text not null default 'q', -- which body field carries the user query
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_search_providers enable row level security;
create policy "search_providers_owner" on public.social_search_providers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_search_providers_user on public.social_search_providers(user_id);

-- Search history (chat-like)
create table if not exists public.social_search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid references public.social_search_providers(id) on delete set null,
  query text not null,
  optimized_query text,
  output_type text,
  depth text,
  status text not null default 'success', -- 'success' | 'error'
  answer text,
  results jsonb,
  raw_response jsonb,
  error text,
  duration_ms int,
  created_at timestamptz not null default now()
);

alter table public.social_search_queries enable row level security;
create policy "search_queries_owner" on public.social_search_queries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_search_queries_user_created on public.social_search_queries(user_id, created_at desc);

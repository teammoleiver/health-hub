
-- 1) Drop the unused legacy user_profile table that contained openai_api_key
DROP TABLE IF EXISTS public.user_profile CASCADE;

-- 2) Replace the permissive health-records storage policy with user-scoped ones
DROP POLICY IF EXISTS "Allow all access to health-records" ON storage.objects;

CREATE POLICY "health_records_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "health_records_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'health-records'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "health_records_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'health-records'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "health_records_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'health-records'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3) Tighten food_database inserts: require created_by = auth.uid()
ALTER TABLE public.food_database
  ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS "Authenticated users can insert food items" ON public.food_database;

CREATE POLICY "Authenticated users can insert own food items"
ON public.food_database FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

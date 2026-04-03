
-- Assign all NULL user_id rows to Saleh's auth user (saleh.moh.seddik@gmail.com)
DO $$
DECLARE
  saleh_uid uuid := '1eee9ca6-6fb8-421c-989e-8a38285167e5';
BEGIN
  UPDATE water_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE weight_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE exercise_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE meal_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE daily_checklist SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE daily_snapshots SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE fasting_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE fasting_52_schedule SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE ai_chat_history SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE goals SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE blood_test_records SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE sleep_logs SET user_id = saleh_uid WHERE user_id IS NULL;
  UPDATE user_profile SET user_id = saleh_uid WHERE user_id IS NULL;
END $$;

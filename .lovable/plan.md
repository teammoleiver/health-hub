## Multi-User Authentication & Data Isolation Plan

### Phase 1: Database Migration
- Add `user_id` column (UUID, references auth.users) to ALL data tables: water_logs, weight_logs, exercise_logs, meal_logs, daily_checklist, daily_snapshots, fasting_logs, fasting_52_schedule, ai_chat_history, goals, blood_test_records, sleep_logs, user_profile
- Update RLS policies on all tables to scope data by `auth.uid() = user_id`
- Create a `profiles` table with trigger to auto-create on signup
- Remove hardcoded Saleh defaults from user_profile table defaults

### Phase 2: Auth UI
- Create Login/Signup page with email/password + Google OAuth button
- Create a protected route wrapper
- Add password reset flow (`/reset-password` page)
- Update App.tsx with auth routing

### Phase 3: Code Updates
- Update all Supabase queries to work with authenticated user (user_id auto-populated via RLS)
- Remove hardcoded USER_PROFILE references where they conflict with dynamic data
- Update Settings page with account management (change password, sign out)
- Update AppLayout to show user info and sign-out button
- New users start fresh with empty data

### Phase 4: Google OAuth
- Add Google sign-in button to auth page
- User needs to configure Google OAuth in Supabase dashboard

### Key Decisions
- Existing Saleh data will need a manual user_id assignment after he creates an account
- New users get a blank profile they fill in themselves
- All hardcoded profile data (name, DOB, etc.) becomes editable per-user

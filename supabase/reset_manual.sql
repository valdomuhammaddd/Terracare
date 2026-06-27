-- =============================================================================
-- TerraCare — Manual Clean Reset (SQL Editor ONLY — do NOT use in production)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor BEFORE re-applying migrations:
--   1. This file
--   2. migrations/00001_initial_schema.sql
--   3. migrations/00002_rbac_policies.sql
--   4. migrations/00003_settings_schema.sql
-- =============================================================================

DROP TABLE IF EXISTS public.emergency_events CASCADE;
DROP TABLE IF EXISTS public.vital_logs CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.user_owns_device(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_standard_user();
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

DROP TYPE IF EXISTS public.handled_status CASCADE;
DROP TYPE IF EXISTS public.event_classification CASCADE;
DROP TYPE IF EXISTS public.fall_type CASCADE;
DROP TYPE IF EXISTS public.device_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

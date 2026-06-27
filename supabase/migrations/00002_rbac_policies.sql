-- =============================================================================
-- TerraCare — RBAC Policy Update
-- Migration: 00002_rbac_policies.sql
-- Adds admin-wide access; standard users remain scoped to own user_id.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend role enum with 'user' (standard app role)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'user';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Admin helper — SECURITY DEFINER for performant RLS checks
-- Reads profiles.role for the current JWT subject (auth.uid()).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Standard (non-admin) user — caregiver, elder, or explicit 'user' role
CREATE OR REPLACE FUNCTION public.is_standard_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role <> 'admin'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_standard_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_standard_user() TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles — admin: ALL rows SELECT / UPDATE / DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete_all" ON public.profiles;
CREATE POLICY "profiles_admin_delete_all"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Standard users: own profile only (existing policies retained)
-- profiles_select_own, profiles_update_own, profiles_insert_own unchanged

-- ---------------------------------------------------------------------------
-- devices — admin: ALL rows SELECT / UPDATE / DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "devices_admin_select_all" ON public.devices;
CREATE POLICY "devices_admin_select_all"
  ON public.devices
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "devices_admin_update_all" ON public.devices;
CREATE POLICY "devices_admin_update_all"
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "devices_admin_delete_all" ON public.devices;
CREATE POLICY "devices_admin_delete_all"
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Standard users: own devices only (existing policies retained)

-- ---------------------------------------------------------------------------
-- vital_logs — admin: ALL rows SELECT / UPDATE / DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "vital_logs_admin_select_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_select_all"
  ON public.vital_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "vital_logs_admin_update_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_update_all"
  ON public.vital_logs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "vital_logs_admin_delete_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_delete_all"
  ON public.vital_logs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Standard users: own device vitals (existing vital_logs_select_own_devices retained)

-- ---------------------------------------------------------------------------
-- emergency_events — admin: ALL rows SELECT / UPDATE / DELETE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "emergency_events_admin_select_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_select_all"
  ON public.emergency_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "emergency_events_admin_update_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_update_all"
  ON public.emergency_events
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "emergency_events_admin_delete_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_delete_all"
  ON public.emergency_events
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Standard users: own emergencies (existing policies retained)

-- ---------------------------------------------------------------------------
-- Realtime — ensure admin clients receive global postgres_changes
-- (Publication already includes tables from 00001; no change required.)
-- ---------------------------------------------------------------------------

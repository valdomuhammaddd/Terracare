-- =============================================================================
-- TerraCare — RBAC Policy Update
-- Migration: 00002_rbac_policies.sql
-- Prerequisite: 00001_initial_schema.sql must be applied successfully first.
-- =============================================================================

-- Fail fast with a clear message if 00001 was not applied
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.profiles tidak ada.';
  END IF;
  IF to_regclass('public.devices') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.devices tidak ada.';
  END IF;
  IF to_regclass('public.vital_logs') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.vital_logs tidak ada.';
  END IF;
  IF to_regclass('public.emergency_events') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.emergency_events tidak ada.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Extend role enum with 'user' (safe if already added in 00001)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'user'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'user';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Admin helper — SECURITY DEFINER for performant RLS checks
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
-- profiles — admin policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete_all" ON public.profiles;
CREATE POLICY "profiles_admin_delete_all"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- devices — admin policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "devices_admin_select_all" ON public.devices;
CREATE POLICY "devices_admin_select_all"
  ON public.devices FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "devices_admin_update_all" ON public.devices;
CREATE POLICY "devices_admin_update_all"
  ON public.devices FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "devices_admin_delete_all" ON public.devices;
CREATE POLICY "devices_admin_delete_all"
  ON public.devices FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- vital_logs — admin policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "vital_logs_admin_select_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_select_all"
  ON public.vital_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "vital_logs_admin_update_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_update_all"
  ON public.vital_logs FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "vital_logs_admin_delete_all" ON public.vital_logs;
CREATE POLICY "vital_logs_admin_delete_all"
  ON public.vital_logs FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- emergency_events — admin policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "emergency_events_admin_select_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_select_all"
  ON public.emergency_events FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "emergency_events_admin_update_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_update_all"
  ON public.emergency_events FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "emergency_events_admin_delete_all" ON public.emergency_events;
CREATE POLICY "emergency_events_admin_delete_all"
  ON public.emergency_events FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- TerraCare — Initial PostgreSQL Schema
-- Migration: 00001_initial_schema.sql
-- Aligns with mobile-app/src/types/supabase.ts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Custom ENUM types (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('caregiver', 'elder', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'low_battery', 'error');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.fall_type AS ENUM ('hard', 'soft');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.event_classification AS ENUM (
    'confirmed_fall',
    'suspected_fall',
    'false_positive',
    'manual_trigger'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.handled_status AS ENUM (
    'pending',
    'acknowledged',
    'resolved',
    'escalated'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Utility: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  email       text NOT NULL,
  phone       text,
  avatar_url  text,
  emergency_contact_1 text,
  emergency_contact_2 text,
  role        public.user_role NOT NULL DEFAULT 'caregiver',
  created_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT profiles_email_lowercase CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    lower(NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'caregiver')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- devices  (user_id = owner_id in domain language)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  mac_address       text NOT NULL,
  name              text NOT NULL,
  battery_level     smallint NOT NULL DEFAULT 100
                    CHECK (battery_level >= 0 AND battery_level <= 100),
  status            public.device_status NOT NULL DEFAULT 'offline',
  firmware_version  text,
  last_seen_at      timestamptz,
  fall_threshold_g     numeric(4, 2) NOT NULL DEFAULT 2.5
                       CHECK (fall_threshold_g >= 0.5 AND fall_threshold_g <= 10.0),
  angle_threshold_deg  numeric(5, 2) NOT NULL DEFAULT 60.0
                       CHECK (angle_threshold_deg >= 0 AND angle_threshold_deg <= 90),
  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT devices_mac_address_unique UNIQUE (mac_address)
);

CREATE INDEX IF NOT EXISTS devices_user_id_idx ON public.devices (user_id);
CREATE INDEX IF NOT EXISTS devices_status_idx ON public.devices (status);

DROP TRIGGER IF EXISTS devices_set_updated_at ON public.devices;
CREATE TRIGGER devices_set_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Helper: true when the row's device belongs to the current auth user
-- (Must be created AFTER public.devices exists — otherwise error 42P01)
CREATE OR REPLACE FUNCTION public.user_owns_device(p_device_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.devices d
    WHERE d.id = p_device_id
      AND d.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- vital_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vital_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES public.devices (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  heart_rate_bpm  smallint NOT NULL CHECK (heart_rate_bpm > 0 AND heart_rate_bpm <= 300),
  spo2_percent    smallint NOT NULL CHECK (spo2_percent >= 0 AND spo2_percent <= 100),
  recorded_at     timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS vital_logs_device_id_recorded_at_idx
  ON public.vital_logs (device_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS vital_logs_user_id_recorded_at_idx
  ON public.vital_logs (user_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- emergency_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES public.devices (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  fall_type       public.fall_type NOT NULL,
  classification  public.event_classification NOT NULL,
  handled_status  public.handled_status NOT NULL DEFAULT 'pending',
  latitude        double precision,
  longitude       double precision,
  notes           text,
  triggered_at    timestamptz NOT NULL,
  handled_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS emergency_events_device_id_created_at_idx
  ON public.emergency_events (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS emergency_events_user_id_handled_status_idx
  ON public.emergency_events (user_id, handled_status);

CREATE INDEX IF NOT EXISTS emergency_events_pending_idx
  ON public.emergency_events (handled_status)
  WHERE handled_status IN ('pending', 'acknowledged');

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

-- profiles -------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- devices --------------------------------------------------------------------
DROP POLICY IF EXISTS "devices_select_own" ON public.devices;
CREATE POLICY "devices_select_own"
  ON public.devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_insert_own" ON public.devices;
CREATE POLICY "devices_insert_own"
  ON public.devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_update_own" ON public.devices;
CREATE POLICY "devices_update_own"
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_delete_own" ON public.devices;
CREATE POLICY "devices_delete_own"
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- vital_logs -----------------------------------------------------------------
DROP POLICY IF EXISTS "vital_logs_select_own_devices" ON public.vital_logs;
CREATE POLICY "vital_logs_select_own_devices"
  ON public.vital_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.user_owns_device(device_id)
  );

-- ESP32 / Edge Function ingest via service_role API key
DROP POLICY IF EXISTS "vital_logs_insert_service_role" ON public.vital_logs;
CREATE POLICY "vital_logs_insert_service_role"
  ON public.vital_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- emergency_events -----------------------------------------------------------
DROP POLICY IF EXISTS "emergency_events_select_own_devices" ON public.emergency_events;
CREATE POLICY "emergency_events_select_own_devices"
  ON public.emergency_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.user_owns_device(device_id)
  );

DROP POLICY IF EXISTS "emergency_events_update_own_devices" ON public.emergency_events;
CREATE POLICY "emergency_events_update_own_devices"
  ON public.emergency_events
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_device(device_id))
  WITH CHECK (public.user_owns_device(device_id));

-- ESP32 / Edge Function ingest via service_role API key
DROP POLICY IF EXISTS "emergency_events_insert_service_role" ON public.emergency_events;
CREATE POLICY "emergency_events_insert_service_role"
  ON public.emergency_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Hardware heartbeat: allow service_role to update device telemetry
DROP POLICY IF EXISTS "devices_update_service_role" ON public.devices;
CREATE POLICY "devices_update_service_role"
  ON public.devices
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Realtime (optional publication for live vitals / alerts)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_logs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

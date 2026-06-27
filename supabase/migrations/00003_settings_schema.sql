-- =============================================================================
-- TerraCare — Settings & Hardware Threshold Schema
-- Migration: 00003_settings_schema.sql
-- Idempotent: safe to re-run. Adds columns if missing (also included in 00001).
-- Prerequisite: 00001_initial_schema.sql
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.profiles tidak ada.';
  END IF;
  IF to_regclass('public.devices') IS NULL THEN
    RAISE EXCEPTION '00001 belum dijalankan: tabel public.devices tidak ada.';
  END IF;
END $$;

-- Emergency contacts on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contact_1 text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2 text;

COMMENT ON COLUMN public.profiles.emergency_contact_1 IS 'Primary emergency phone (e.g. +628...)';
COMMENT ON COLUMN public.profiles.emergency_contact_2 IS 'Secondary emergency phone';

-- Sensor tuning columns on devices (one column per statement for safer re-runs)
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS fall_threshold_g numeric(4, 2);

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS angle_threshold_deg numeric(5, 2);

-- Backfill defaults for existing rows
UPDATE public.devices
SET fall_threshold_g = 2.5
WHERE fall_threshold_g IS NULL;

UPDATE public.devices
SET angle_threshold_deg = 60.0
WHERE angle_threshold_deg IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE public.devices
  ALTER COLUMN fall_threshold_g SET DEFAULT 2.5,
  ALTER COLUMN fall_threshold_g SET NOT NULL;

ALTER TABLE public.devices
  ALTER COLUMN angle_threshold_deg SET DEFAULT 60.0,
  ALTER COLUMN angle_threshold_deg SET NOT NULL;

COMMENT ON COLUMN public.devices.fall_threshold_g IS 'Sum-vector impact threshold in g (default 2.5)';
COMMENT ON COLUMN public.devices.angle_threshold_deg IS 'Post-impact tilt angle threshold in degrees (default 60)';

-- Sanity constraints (idempotent)
DO $$
BEGIN
  ALTER TABLE public.devices
    ADD CONSTRAINT devices_fall_threshold_g_range
    CHECK (fall_threshold_g >= 0.5 AND fall_threshold_g <= 10.0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.devices
    ADD CONSTRAINT devices_angle_threshold_deg_range
    CHECK (angle_threshold_deg >= 0 AND angle_threshold_deg <= 90);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

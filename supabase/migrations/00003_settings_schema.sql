-- =============================================================================
-- TerraCare — Settings & Hardware Threshold Schema
-- Migration: 00003_settings_schema.sql
-- =============================================================================

-- Emergency contacts on caregiver/elder profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contact_1 text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2 text;

COMMENT ON COLUMN public.profiles.emergency_contact_1 IS 'Primary emergency phone (e.g. +628...)';
COMMENT ON COLUMN public.profiles.emergency_contact_2 IS 'Secondary emergency phone';

-- Per-device fall-detection tuning (ESP32 / dev mode sync)
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS fall_threshold_g numeric(4, 2) NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS angle_threshold_deg numeric(5, 2) NOT NULL DEFAULT 60.0;

COMMENT ON COLUMN public.devices.fall_threshold_g IS 'Sum-vector impact threshold in g (default 2.5)';
COMMENT ON COLUMN public.devices.angle_threshold_deg IS 'Post-impact tilt angle threshold in degrees (default 60)';

-- Sanity constraints
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

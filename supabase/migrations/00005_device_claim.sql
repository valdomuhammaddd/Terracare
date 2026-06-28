-- =============================================================================
-- TerraCare — Pre-provisioned device claiming (no BLE)
-- Migration: 00005_device_claim.sql
-- Allows authenticated users to claim admin-provisioned devices by serial/mac.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.claim_device_by_serial(p_mac_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device public.devices;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT *
  INTO v_device
  FROM public.devices
  WHERE upper(trim(mac_address)) = upper(trim(p_mac_address))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DEVICE_NOT_FOUND';
  END IF;

  IF v_device.user_id IS DISTINCT FROM v_uid THEN
    IF EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = v_device.user_id
        AND p.role <> 'admin'::public.user_role
    ) THEN
      RAISE EXCEPTION 'DEVICE_ALREADY_CLAIMED';
    END IF;
  END IF;

  UPDATE public.devices
  SET
    user_id = v_uid,
    status = 'online',
    last_seen_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  WHERE id = v_device.id
  RETURNING * INTO v_device;

  RETURN to_jsonb(v_device);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_device_by_serial(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_device_by_serial(text) TO authenticated;

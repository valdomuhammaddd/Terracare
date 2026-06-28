-- Allow authenticated users to insert manual SOS events for devices they own
DROP POLICY IF EXISTS "emergency_events_insert_own_manual" ON public.emergency_events;

CREATE POLICY "emergency_events_insert_own_manual"
  ON public.emergency_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND classification = 'manual_trigger'::public.event_classification
    AND public.user_owns_device(device_id)
  );

-- Add RLS policies for the activity_log table.
-- The table exists with RLS enabled but had no INSERT policy, so the
-- fire-and-forget activity log write in addTicket/addTicketBatch was
-- rejected with "new row violates row-level security policy".
--
-- Additive only: grants authenticated users the ability to log and read
-- their own activity. Service-role writes (edge functions) bypass RLS and
-- are unaffected.

-- Ensure RLS is on (no-op if already enabled).
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.activity_log TO authenticated;

-- Users can insert activity rows for themselves.
DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
CREATE POLICY "Users can insert own activity"
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own activity rows.
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity"
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

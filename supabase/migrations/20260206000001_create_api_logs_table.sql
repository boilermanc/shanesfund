-- Create api_logs table for storing API test results
-- Referenced by: AdminDashboard.tsx (read), test-api edge function (write)

CREATE TABLE IF NOT EXISTS public.api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_connection_id uuid REFERENCES public.api_connections(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  request_body jsonb,
  response_status integer,
  response_body jsonb,
  response_time_ms integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  triggered_by text DEFAULT 'admin_test',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for recent logs queries (AdminDashboard orders by created_at desc)
CREATE INDEX idx_api_logs_created_at ON public.api_logs (created_at DESC);

-- Index for joining to api_connections
CREATE INDEX idx_api_logs_api_connection_id ON public.api_logs (api_connection_id);

-- Enable RLS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Admin read policy: only active admin users can read logs
CREATE POLICY "Admin users can read api_logs"
  ON public.api_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

-- Note: The test-api edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so no INSERT policy is needed for it.

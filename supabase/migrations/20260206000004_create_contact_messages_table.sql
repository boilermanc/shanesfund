-- Create contact_messages table for the public contact form
-- Public visitors can submit messages; admins can read/update status
-- User plans to connect n8n for processing later

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT 'General Question',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for admin queries (list by newest first)
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages (created_at DESC);

-- Index for status filtering
CREATE INDEX idx_contact_messages_status ON public.contact_messages (status);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public insert policy: anyone can submit (no auth required)
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Admin read policy
CREATE POLICY "Admin users can read contact messages"
  ON public.contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

-- Admin update policy (for changing status)
CREATE POLICY "Admin users can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

-- Grant insert to anon (for public form submission without auth)
GRANT INSERT ON public.contact_messages TO anon;
-- Grant select/update to authenticated (for admin panel)
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;

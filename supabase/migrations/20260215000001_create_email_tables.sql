-- Email Templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_body text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_templates_name ON public.email_templates (name);
CREATE INDEX idx_email_templates_is_active ON public.email_templates (is_active);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read email_templates"
  ON public.email_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert email_templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can update email_templates"
  ON public.email_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can delete email_templates"
  ON public.email_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;

-- Email Logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_name text,
  to_email text NOT NULL,
  from_email text NOT NULL DEFAULT 'team@sproutify.app',
  subject text NOT NULL,
  html_body text NOT NULL,
  variables jsonb DEFAULT '{}',
  resend_message_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  triggered_by text NOT NULL DEFAULT 'admin_test',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs (status);
CREATE INDEX idx_email_logs_template_id ON public.email_logs (template_id);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read email_logs"
  ON public.email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.is_active = true
    )
  );

GRANT SELECT ON public.email_logs TO authenticated;

-- Seed default email templates
INSERT INTO public.email_templates (name, subject, html_body, variables, description) VALUES
(
  'contact_auto_reply',
  'Thanks for reaching out, {{name}}!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EDF6F9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#006D77;padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">Shane''s Fund</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#006D77;font-size:18px;">Thanks for reaching out, {{name}}!</h2>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6;">
          We''ve received your message and will get back to you within 24 hours.
        </p>
        <div style="background:#EDF6F9;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;color:#006D77;font-size:13px;font-weight:600;">Your message:</p>
          <p style="margin:0 0 4px;color:#666;font-size:13px;"><strong>Subject:</strong> {{subject}}</p>
          <p style="margin:0;color:#666;font-size:13px;">{{message}}</p>
        </div>
        <p style="margin:16px 0 0;color:#999;font-size:13px;">
          — The Shane''s Fund Team
        </p>
      </div>
      <div style="background:#F2E9D4;padding:16px 32px;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">Shane''s Fund &bull; Pool your luck together</p>
      </div>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'subject', 'message'],
  'Auto-reply sent to users who submit the contact form'
),
(
  'contact_admin_notification',
  'New contact: {{subject}} from {{name}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e4e4e7;">
      <h2 style="margin:0 0 16px;color:#18181b;font-size:16px;">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#71717a;font-size:13px;width:80px;">Name</td><td style="padding:8px 0;color:#18181b;font-size:13px;">{{name}}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Email</td><td style="padding:8px 0;color:#18181b;font-size:13px;">{{email}}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Subject</td><td style="padding:8px 0;color:#18181b;font-size:13px;">{{subject}}</td></tr>
      </table>
      <div style="background:#f4f4f5;border-radius:6px;padding:12px;margin-top:12px;">
        <p style="margin:0 0 4px;color:#71717a;font-size:12px;font-weight:600;">Message</p>
        <p style="margin:0;color:#18181b;font-size:13px;line-height:1.5;white-space:pre-wrap;">{{message}}</p>
      </div>
    </div>
  </div>
</body>
</html>',
  ARRAY['name', 'email', 'subject', 'message'],
  'Notification sent to admin when a contact form is submitted'
);

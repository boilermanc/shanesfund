-- ============================================================
-- Migration: Create config_settings table
--
-- Generic key-value configuration store for integrations
-- and system settings. First use: Slack webhook integration.
--
-- Uses plain text values (not JSONB) to avoid double-encoding
-- issues. The data_type column hints how the service layer
-- should parse the value.
-- ============================================================

-- ============================================================
-- Step 1: Create the table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text,
  data_type text NOT NULL DEFAULT 'string',
  description text,
  is_sensitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (category, key)
);

-- Fast lookups by category
CREATE INDEX IF NOT EXISTS idx_config_settings_category
  ON public.config_settings (category);

-- ============================================================
-- Step 2: Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_config_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_settings_updated_at
  BEFORE UPDATE ON public.config_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_config_settings_updated_at();

-- ============================================================
-- Step 3: RLS — admin-only via existing is_admin()
-- ============================================================
ALTER TABLE public.config_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read config_settings"
  ON public.config_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert config_settings"
  ON public.config_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update config_settings"
  ON public.config_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete config_settings"
  ON public.config_settings FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON public.config_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_settings TO authenticated;

-- ============================================================
-- Step 4: Seed Slack integration settings
-- ============================================================
INSERT INTO public.config_settings (category, key, value, data_type, description, is_sensitive)
VALUES
  ('slack', 'slack_enabled', 'false', 'boolean', 'Enable Slack notifications', false),
  ('slack', 'slack_webhook_url', NULL, 'string', 'Slack Incoming Webhook URL', true),
  ('slack', 'slack_channel_name', '#general', 'string', 'Display name of the target Slack channel', false)
ON CONFLICT (category, key) DO NOTHING;

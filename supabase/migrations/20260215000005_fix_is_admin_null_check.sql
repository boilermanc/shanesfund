-- ============================================================
-- Migration: Fix is_admin() NULL auth.uid() check
--
-- The original is_admin() function didn't guard against NULL
-- auth.uid(), which could theoretically return true if no
-- auth context is present. This adds an explicit NULL check.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth.uid() IS NOT NULL
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  );
$$;

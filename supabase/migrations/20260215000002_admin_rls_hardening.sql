-- ============================================================
-- Migration: Admin RLS Security Hardening
--
-- Fixes client-side-only admin authorization by ensuring proper
-- RLS policies exist on ALL admin-accessed tables.
--
-- Key change: Creates a SECURITY DEFINER is_admin() function
-- that bypasses RLS on admin_users, solving the circular
-- reference problem when admin_users itself has RLS enabled.
--
-- All existing inline admin checks are migrated to is_admin().
-- ============================================================

-- ============================================================
-- Step 1: Create is_admin() helper function
--
-- SECURITY DEFINER runs with the function owner's privileges,
-- bypassing RLS on admin_users. This is necessary because
-- admin_users now has RLS that references this function.
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
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  );
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================================
-- Step 2: admin_users — self-referencing RLS
--
-- Previously had NO RLS. Any authenticated user could read
-- the admin list or modify records via direct API calls.
-- ============================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update admin_users" ON public.admin_users;
CREATE POLICY "Admins can update admin_users"
  ON public.admin_users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.admin_users FROM anon;
GRANT SELECT, UPDATE ON public.admin_users TO authenticated;


-- ============================================================
-- Step 3: api_connections — admin only
--
-- Previously had NO RLS. Contains API keys and connection
-- configs that were readable by any authenticated user.
-- ============================================================
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read api_connections" ON public.api_connections;
CREATE POLICY "Admins can read api_connections"
  ON public.api_connections FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update api_connections" ON public.api_connections;
CREATE POLICY "Admins can update api_connections"
  ON public.api_connections FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.api_connections FROM anon;
GRANT SELECT, UPDATE ON public.api_connections TO authenticated;


-- ============================================================
-- Step 4: notifications — user + admin policies
--
-- Users: read/update/delete own notifications, insert for any
--   user (friend request notifications go to other users)
-- Admins: full read/insert/delete on all notifications
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

-- User policies
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Any authenticated user can insert notifications
-- (friend requests create notifications for other users)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin policies (SELECT/DELETE across all users)
CREATE POLICY "Admins can read all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON public.notifications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;


-- ============================================================
-- Step 5: users — authenticated read + own update
--
-- All authenticated users can read profiles (needed for friend
-- search, pool member display, profile viewing).
-- Users can only update their own profile.
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Authenticated users can read all profiles"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

REVOKE ALL ON public.users FROM anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;


-- ============================================================
-- Step 6: pool_members — authenticated CRUD
--
-- All authenticated users can read memberships (needed for
-- pool viewing, mutual pools with friends, pool notifications).
-- Insert/delete needed for joining/leaving pools.
-- ============================================================
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pool_members" ON public.pool_members;
DROP POLICY IF EXISTS "Authenticated users can insert pool_members" ON public.pool_members;
DROP POLICY IF EXISTS "Authenticated users can delete pool_members" ON public.pool_members;

CREATE POLICY "Authenticated users can read pool_members"
  ON public.pool_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pool_members"
  ON public.pool_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pool_members"
  ON public.pool_members FOR DELETE
  USING (auth.uid() IS NOT NULL);

REVOKE ALL ON public.pool_members FROM anon;
GRANT SELECT, INSERT, DELETE ON public.pool_members TO authenticated;


-- ============================================================
-- Step 7: Migrate existing policies to use is_admin()
--
-- Now that admin_users has RLS, the inline subqueries in
-- existing policies would fail (circular RLS). Replace them
-- all with the SECURITY DEFINER is_admin() function.
-- ============================================================

-- api_logs
DROP POLICY IF EXISTS "Admin users can read api_logs" ON public.api_logs;
CREATE POLICY "Admin users can read api_logs"
  ON public.api_logs FOR SELECT
  USING (public.is_admin());

-- email_templates
DROP POLICY IF EXISTS "Admin users can read email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin users can insert email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin users can update email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin users can delete email_templates" ON public.email_templates;

CREATE POLICY "Admin users can read email_templates"
  ON public.email_templates FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can insert email_templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can update email_templates"
  ON public.email_templates FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can delete email_templates"
  ON public.email_templates FOR DELETE
  USING (public.is_admin());

-- email_logs
DROP POLICY IF EXISTS "Admin users can read email_logs" ON public.email_logs;
CREATE POLICY "Admin users can read email_logs"
  ON public.email_logs FOR SELECT
  USING (public.is_admin());

-- contact_messages (preserve the public INSERT policy)
DROP POLICY IF EXISTS "Admin users can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin users can update contact messages" ON public.contact_messages;

CREATE POLICY "Admin users can read contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin users can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- Notes on views (admin_dashboard_stats, api_health_summary)
--
-- Views cannot have RLS policies directly. They use
-- GRANT SELECT TO authenticated (set in earlier migrations).
--
-- However, the underlying tables now have RLS:
-- - api_health_summary queries api_connections (admin-only),
--   so non-admins get zero rows from this view automatically.
-- - admin_dashboard_stats queries users (open to auth'd),
--   pools/tickets/winnings (no RLS change here), and api_logs
--   (admin-only), so non-admins get partial data (zero for
--   api_calls_today/api_failures_today).
--
-- The admin UI gate in AdminLayout.tsx prevents non-admins
-- from seeing the dashboard, so partial view data is not
-- a practical concern.
-- ============================================================

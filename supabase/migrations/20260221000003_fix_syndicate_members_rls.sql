-- ============================================================
-- Fix: infinite recursion in syndicate_members SELECT policy
--
-- The original policy queries syndicate_members from within its
-- own RLS check, causing Postgres to recurse infinitely.
-- Fix: use a SECURITY DEFINER helper that bypasses RLS.
-- ============================================================

-- Helper function: check if a user belongs to a syndicate (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_syndicate_member(p_syndicate_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.syndicate_members
    WHERE syndicate_id = p_syndicate_id AND user_id = p_user_id
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view syndicate members" ON public.syndicate_members;

-- Recreate using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Members can view syndicate members"
  ON public.syndicate_members FOR SELECT
  USING (public.is_syndicate_member(syndicate_id, auth.uid()));

-- ============================================================
-- Ensure lottery_draws is readable by all users
-- (table was created via Dashboard; may lack SELECT policy)
-- ============================================================

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

-- Grant read access
GRANT SELECT ON public.lottery_draws TO authenticated, anon;

-- Add permissive SELECT policy (lottery results are public data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lottery_draws'
      AND policyname = 'Anyone can read lottery draws'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read lottery draws" ON public.lottery_draws FOR SELECT USING (true)';
  END IF;
END $$;

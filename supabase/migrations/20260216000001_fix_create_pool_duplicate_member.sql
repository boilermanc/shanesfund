-- Fix: "duplicate key value violates unique constraint pool_members_pool_id_user_id_key"
--
-- A trigger on the pools table already inserts the captain into pool_members
-- when a pool is created. The create_pool_with_captain function then tries to
-- insert the same row, causing a unique constraint violation.
--
-- Fix: Add ON CONFLICT DO NOTHING so the explicit insert is a no-op if the
-- trigger already handled it. Also schema-qualify all references so the
-- SECURITY DEFINER function resolves types correctly.

CREATE OR REPLACE FUNCTION create_pool_with_captain(
  p_name text,
  p_game_type text,
  p_captain_id uuid,
  p_is_private boolean DEFAULT false,
  p_contribution_amount numeric DEFAULT 10,
  p_description text DEFAULT NULL,
  p_settings jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF public.pools
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pool public.pools;
BEGIN
  INSERT INTO public.pools (name, game_type, captain_id, is_private, contribution_amount, description, settings)
  VALUES (p_name, p_game_type, p_captain_id, p_is_private, p_contribution_amount, p_description, p_settings)
  RETURNING * INTO new_pool;

  INSERT INTO public.pool_members (pool_id, user_id, role)
  VALUES (new_pool.id, p_captain_id, 'captain')
  ON CONFLICT (pool_id, user_id) DO NOTHING;

  RETURN NEXT new_pool;
END;
$$;

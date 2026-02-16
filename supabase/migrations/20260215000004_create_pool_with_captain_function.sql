-- Atomically creates a pool AND adds the captain as a member in a single transaction.
-- If either insert fails, both are rolled back — no orphaned pools with 0 members.
-- SECURITY DEFINER so it runs with the function owner's privileges.

CREATE OR REPLACE FUNCTION create_pool_with_captain(
  p_name text,
  p_game_type text,
  p_captain_id uuid,
  p_is_private boolean DEFAULT false,
  p_contribution_amount numeric DEFAULT 10,
  p_description text DEFAULT NULL,
  p_settings jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF pools
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pool pools;
BEGIN
  INSERT INTO pools (name, game_type, captain_id, is_private, contribution_amount, description, settings)
  VALUES (p_name, p_game_type, p_captain_id, p_is_private, p_contribution_amount, p_description, p_settings)
  RETURNING * INTO new_pool;

  INSERT INTO pool_members (pool_id, user_id, role)
  VALUES (new_pool.id, p_captain_id, 'captain');

  RETURN NEXT new_pool;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION create_pool_with_captain(text, text, uuid, boolean, numeric, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION create_pool_with_captain(text, text, uuid, boolean, numeric, text, jsonb) TO authenticated;

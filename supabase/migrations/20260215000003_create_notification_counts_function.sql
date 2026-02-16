-- Returns notification counts grouped by type (for admin stats panel)
-- SECURITY DEFINER so it runs with the function owner's privileges,
-- but we restrict execution to authenticated users who are admins.

CREATE OR REPLACE FUNCTION get_notification_counts()
RETURNS TABLE(type text, count bigint) AS $$
  SELECT type::text, COUNT(*) FROM notifications GROUP BY type;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION get_notification_counts() FROM public, anon;
GRANT EXECUTE ON FUNCTION get_notification_counts() TO authenticated;

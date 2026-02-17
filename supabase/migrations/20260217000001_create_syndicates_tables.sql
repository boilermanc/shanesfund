-- ============================================================
-- Syndicates: social groups built from friends
-- ============================================================

-- Table: syndicates
CREATE TABLE IF NOT EXISTS public.syndicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  color text NOT NULL DEFAULT '#83C5BE',
  emoji text DEFAULT NULL,
  member_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_syndicates_creator_id ON public.syndicates (creator_id);

ALTER TABLE public.syndicates ENABLE ROW LEVEL SECURITY;

-- Table: syndicate_members
CREATE TABLE IF NOT EXISTS public.syndicate_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  syndicate_id uuid NOT NULL REFERENCES public.syndicates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(syndicate_id, user_id)
);

CREATE INDEX idx_syndicate_members_syndicate_id ON public.syndicate_members (syndicate_id);
CREATE INDEX idx_syndicate_members_user_id ON public.syndicate_members (user_id);

ALTER TABLE public.syndicate_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: syndicates
-- ============================================================

-- Members can view syndicates they belong to
CREATE POLICY "Members can view their syndicates"
  ON public.syndicates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.syndicate_members sm
      WHERE sm.syndicate_id = id AND sm.user_id = auth.uid()
    )
  );

-- Authenticated users can create syndicates (creator_id must match)
CREATE POLICY "Authenticated users can create syndicates"
  ON public.syndicates FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Creator can update their syndicates
CREATE POLICY "Creator can update their syndicates"
  ON public.syndicates FOR UPDATE
  USING (creator_id = auth.uid());

-- Creator can delete their syndicates
CREATE POLICY "Creator can delete their syndicates"
  ON public.syndicates FOR DELETE
  USING (creator_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.syndicates TO authenticated;

-- ============================================================
-- RLS Policies: syndicate_members
-- ============================================================

-- Members can view other members in their syndicates
CREATE POLICY "Members can view syndicate members"
  ON public.syndicate_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.syndicate_members sm2
      WHERE sm2.syndicate_id = syndicate_id AND sm2.user_id = auth.uid()
    )
  );

-- Syndicate owner can add members
CREATE POLICY "Syndicate owner can add members"
  ON public.syndicate_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.syndicates s
      WHERE s.id = syndicate_id AND s.creator_id = auth.uid()
    )
  );

-- Owner can remove anyone; members can remove themselves (leave)
CREATE POLICY "Owner or self can remove members"
  ON public.syndicate_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.syndicates s
      WHERE s.id = syndicate_id AND s.creator_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

GRANT SELECT, INSERT, DELETE ON public.syndicate_members TO authenticated;

-- ============================================================
-- RPC: Atomic syndicate creation with owner
-- ============================================================

CREATE OR REPLACE FUNCTION create_syndicate_with_owner(
  p_name text,
  p_creator_id uuid,
  p_description text DEFAULT NULL,
  p_color text DEFAULT '#83C5BE',
  p_emoji text DEFAULT NULL
)
RETURNS SETOF syndicates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_syndicate syndicates;
BEGIN
  INSERT INTO syndicates (name, creator_id, description, color, emoji)
  VALUES (p_name, p_creator_id, p_description, p_color, p_emoji)
  RETURNING * INTO new_syndicate;

  INSERT INTO syndicate_members (syndicate_id, user_id, role)
  VALUES (new_syndicate.id, p_creator_id, 'owner');

  RETURN NEXT new_syndicate;
END;
$$;

REVOKE ALL ON FUNCTION create_syndicate_with_owner(text, uuid, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION create_syndicate_with_owner(text, uuid, text, text, text) TO authenticated;

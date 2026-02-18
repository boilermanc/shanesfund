-- Add RLS policies for the contributions table.
-- The table exists with RLS enabled but had no policies, causing all inserts to fail.

-- Users can read their own contributions
CREATE POLICY "Users can view own contributions"
  ON public.contributions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert contributions for themselves if they are a member of the pool
CREATE POLICY "Users can insert own contributions"
  ON public.contributions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.pool_members
      WHERE pool_members.pool_id = contributions.pool_id
        AND pool_members.user_id = auth.uid()
    )
  );

-- Users can update their own contributions (e.g. marking as paid)
CREATE POLICY "Users can update own contributions"
  ON public.contributions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

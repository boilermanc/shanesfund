-- Add captain confirmation workflow to contributions.
-- Members submit contributions as 'pending'; captains confirm or reject them.

-- 1. Add status column with CHECK constraint
ALTER TABLE public.contributions
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- 2. Add captain audit columns
ALTER TABLE public.contributions
  ADD COLUMN confirmed_by uuid REFERENCES public.users(id),
  ADD COLUMN confirmed_at timestamptz;

-- 3. Backfill: existing paid=true contributions should be 'confirmed'
UPDATE public.contributions SET status = 'confirmed' WHERE paid = true;

-- 4. Index for efficient captain queries (contributions by pool + status)
CREATE INDEX idx_contributions_pool_status ON public.contributions(pool_id, status);

-- 5. RLS: Captains can read all contributions for pools they captain
CREATE POLICY "Captains can view pool contributions"
  ON public.contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = contributions.pool_id
        AND pools.captain_id = auth.uid()
    )
  );

-- 6. RLS: Captains can update contributions for pools they captain (confirm/reject)
CREATE POLICY "Captains can update pool contributions"
  ON public.contributions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = contributions.pool_id
        AND pools.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools
      WHERE pools.id = contributions.pool_id
        AND pools.captain_id = auth.uid()
    )
  );

-- 7. RLS: Pool members can view all contributions in their pool (for ledger)
CREATE POLICY "Pool members can view pool contributions"
  ON public.contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pool_members
      WHERE pool_members.pool_id = contributions.pool_id
        AND pool_members.user_id = auth.uid()
    )
  );

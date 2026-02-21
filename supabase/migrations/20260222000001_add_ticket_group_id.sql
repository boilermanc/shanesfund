-- Add ticket_group_id to link multiple plays from the same physical slip.
-- Nullable: single-play tickets don't need a group.
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ticket_group_id uuid DEFAULT NULL;

-- Partial index for efficient grouping queries (only non-null values)
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_group_id
  ON tickets (ticket_group_id)
  WHERE ticket_group_id IS NOT NULL;

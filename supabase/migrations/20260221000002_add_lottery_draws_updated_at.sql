-- Add updated_at column to lottery_draws so the UI can show
-- when jackpot amounts were last refreshed.
ALTER TABLE lottery_draws
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update on any row change
CREATE OR REPLACE FUNCTION update_lottery_draws_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lottery_draws_updated_at
  BEFORE UPDATE ON lottery_draws
  FOR EACH ROW
  EXECUTE FUNCTION update_lottery_draws_updated_at();

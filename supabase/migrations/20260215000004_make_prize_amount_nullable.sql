-- Make prize_amount nullable so jackpot wins can store NULL
-- when the actual jackpot amount is unknown (NY Open Data API
-- does not provide jackpot amounts). NULL signals "needs manual review"
-- instead of silently storing $0.

ALTER TABLE public.winnings
  ALTER COLUMN prize_amount DROP NOT NULL;

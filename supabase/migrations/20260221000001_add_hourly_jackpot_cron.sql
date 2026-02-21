-- ============================================================
-- Migration: Add hourly jackpot update cron job
--
-- The fetch-lottery-results function only runs after draws
-- (a few times per week), so jackpot estimates can go stale.
-- This lightweight function runs every hour to keep jackpot
-- amounts current by fetching from:
--   - Mega Millions: official JSON API (megamillions.com)
--   - Powerball: parsed from powerball.com homepage
--
-- Prerequisite: deploy update-jackpots edge function first:
--   supabase functions deploy update-jackpots
-- ============================================================

-- Replace <CRON_SECRET> with your actual secret before running.

SELECT cron.schedule(
  'update-jackpots',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fhinyhfvezctknrsmzgp.supabase.co/functions/v1/update-jackpots',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- Migration: Set up pg_cron + pg_net for automated lottery
-- result fetching and win checking.
--
-- Scheduling (all times UTC):
--   Fetch lottery results:
--     Powerball:      06:00 UTC on Sun, Tue, Thu  (after Mon/Wed/Sat draws)
--     Mega Millions:  06:00 UTC on Wed, Sat       (after Tue/Fri draws)
--   Check wins:
--     All games:      06:15 UTC on Sun, Tue, Wed, Thu, Sat
--
-- DST note: pg_cron uses UTC. These times are ~2h after draws
-- close (10:59-11:00 PM ET). In EST (UTC-5) that's 1:00 AM,
-- in EDT (UTC-4) that's 2:00 AM. Both are well after the
-- NY Open Data API typically updates (~1h post-draw).
--
-- Prerequisites:
--   1. CRON_SECRET must be set in Supabase Edge Function secrets
--   2. fetch-lottery-results and check-wins edge functions deployed
--   3. Supabase Pro plan (pg_cron requires Pro+)
--
-- After running, verify with:
--   SELECT * FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- ============================================================

-- pg_cron and pg_net must already be enabled via
-- Supabase Dashboard > Database > Extensions.

-- ============================================================
-- IMPORTANT: Replace <CRON_SECRET> below with your actual secret.
-- This is the same value set in Supabase Dashboard > Edge Functions > Secrets.
-- ============================================================

-- Fetch Powerball results (after Mon/Wed/Sat draws)
-- Runs at 06:00 UTC on Sun(0), Tue(2), Thu(4)
SELECT cron.schedule(
  'fetch-powerball-results',
  '0 6 * * 0,2,4',
  $$
  SELECT net.http_post(
    url := 'https://fhinyhfvezctknrsmzgp.supabase.co/functions/v1/fetch-lottery-results',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "<CRON_SECRET>"}'::jsonb,
    body := '{"game_type": "powerball"}'::jsonb
  );
  $$
);

-- Fetch Mega Millions results (after Tue/Fri draws)
-- Runs at 06:00 UTC on Wed(3), Sat(6)
SELECT cron.schedule(
  'fetch-mega-millions-results',
  '0 6 * * 3,6',
  $$
  SELECT net.http_post(
    url := 'https://fhinyhfvezctknrsmzgp.supabase.co/functions/v1/fetch-lottery-results',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "<CRON_SECRET>"}'::jsonb,
    body := '{"game_type": "mega_millions"}'::jsonb
  );
  $$
);

-- Check wins for all games (15 min after fetch completes)
-- Runs at 06:15 UTC on all draw-result days
SELECT cron.schedule(
  'check-lottery-wins',
  '15 6 * * 0,2,3,4,6',
  $$
  SELECT net.http_post(
    url := 'https://fhinyhfvezctknrsmzgp.supabase.co/functions/v1/check-wins',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

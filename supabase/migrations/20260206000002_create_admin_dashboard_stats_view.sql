-- Create admin_dashboard_stats view
-- Computes dashboard metrics from real tables
-- Referenced by: AdminDashboard.tsx (.from('admin_dashboard_stats').select('*').single())

DROP VIEW IF EXISTS public.admin_dashboard_stats;
CREATE VIEW public.admin_dashboard_stats AS
SELECT
  -- User counts
  (SELECT count(*) FROM public.users)::integer AS total_users,
  (SELECT count(*) FROM public.users
   WHERE created_at >= (CURRENT_DATE)::timestamptz)::integer AS new_users_today,
  (SELECT count(*) FROM public.users
   WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days')::timestamptz)::integer AS new_users_week,

  -- Pool counts
  (SELECT count(*) FROM public.pools
   WHERE status = 'active')::integer AS active_pools,

  -- Ticket counts (today)
  (SELECT count(*) FROM public.tickets
   WHERE created_at >= (CURRENT_DATE)::timestamptz)::integer AS tickets_today,

  -- Winning stats
  (SELECT count(*) FROM public.winnings)::integer AS total_winning_tickets,
  (SELECT COALESCE(sum(prize_amount), 0) FROM public.winnings)::numeric AS total_winnings_amount,

  -- Waitlist
  (SELECT count(*) FROM public.waitlist)::integer AS waitlist_signups,

  -- API activity (today)
  (SELECT count(*) FROM public.api_logs
   WHERE created_at >= (CURRENT_DATE)::timestamptz)::integer AS api_calls_today,
  (SELECT count(*) FROM public.api_logs
   WHERE created_at >= (CURRENT_DATE)::timestamptz
   AND success = false)::integer AS api_failures_today;

-- Restrict access: revoke from anon, grant to authenticated
-- Admin check is enforced at the application layer (AdminLayout.tsx)
REVOKE ALL ON public.admin_dashboard_stats FROM anon, authenticated;
GRANT SELECT ON public.admin_dashboard_stats TO authenticated;

-- Create api_health_summary view
-- Computes API health metrics from api_connections + api_logs
-- Referenced by: AdminDashboard.tsx (.from('api_health_summary').select('*'))

DROP VIEW IF EXISTS public.api_health_summary;
CREATE VIEW public.api_health_summary AS
SELECT
  ac.id,
  ac.name,
  ac.provider,
  ac.is_active,
  ac.last_tested_at,
  ac.last_test_success,
  COALESCE(stats.calls_24h, 0)::integer AS calls_24h,
  COALESCE(stats.success_24h, 0)::integer AS success_24h,
  stats.avg_response_ms_24h::integer AS avg_response_ms_24h
FROM public.api_connections ac
LEFT JOIN LATERAL (
  SELECT
    count(*) AS calls_24h,
    count(*) FILTER (WHERE al.success = true) AS success_24h,
    avg(al.response_time_ms) AS avg_response_ms_24h
  FROM public.api_logs al
  WHERE al.api_connection_id = ac.id
    AND al.created_at >= now() - INTERVAL '24 hours'
) stats ON true;

-- Restrict access: revoke from anon, grant to authenticated
REVOKE ALL ON public.api_health_summary FROM anon, authenticated;
GRANT SELECT ON public.api_health_summary TO authenticated;

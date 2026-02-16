import React, { useState, useEffect } from 'react';
import {
  Users,
  Ticket,
  Trophy,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme, getAdminTheme, type AdminTheme } from '../../hooks/useAdminTheme';

interface DashboardStats {
  total_users: number;
  new_users_today: number;
  new_users_week: number;
  active_pools: number;
  tickets_today: number;
  total_winning_tickets: number;
  total_winnings_amount: number;
  waitlist_signups: number;
  api_calls_today: number;
  api_failures_today: number;
}

interface ApiHealth {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_success: boolean | null;
  calls_24h: number;
  success_24h: number;
  avg_response_ms_24h: number | null;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  theme: AdminTheme;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  theme: t
}) => (
  <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-4`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`${t.textMuted} text-xs font-medium`}>{label}</p>
        <p className={`text-2xl font-semibold ${t.textPrimary} mt-1`}>{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            changeType === 'positive' ? 'text-emerald-500' :
            changeType === 'negative' ? 'text-red-500' :
            t.textMuted
          }`}>
            {changeType === 'positive' && <ArrowUpRight size={12} />}
            {changeType === 'negative' && <ArrowDownRight size={12} />}
            {change}
          </div>
        )}
      </div>
      <div className={`p-2 ${t.iconBg} rounded-md`}>
        <Icon size={16} className={t.iconColor} strokeWidth={1.5} />
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const t = getAdminTheme(isDark);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Track seconds since last update
  useEffect(() => {
    if (!lastUpdated) return;
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      // Load all dashboard data in parallel
      const [statsResult, healthResult, logsResult] = await Promise.allSettled([
        supabase
          .from('admin_dashboard_stats')
          .select('*')
          .single(),
        supabase
          .from('api_health_summary')
          .select('*'),
        supabase
          .from('api_logs')
          .select('*, api_connections(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value.data && !statsResult.value.error) {
        setStats(statsResult.value.data);
        setStatsError(null);
      } else {
        const msg = statsResult.status === 'fulfilled' ? statsResult.value.error?.message : undefined;
        setStatsError(msg || 'Failed to load stats');
      }

      if (healthResult.status === 'fulfilled' && healthResult.value.data && !healthResult.value.error) {
        setApiHealth(healthResult.value.data);
        setHealthError(null);
      } else {
        const msg = healthResult.status === 'fulfilled' ? healthResult.value.error?.message : undefined;
        setHealthError(msg || 'Failed to load API health');
      }

      if (logsResult.status === 'fulfilled' && logsResult.value.data && !logsResult.value.error) {
        setRecentLogs(logsResult.value.data);
        setLogsError(null);
      } else {
        const msg = logsResult.status === 'fulfilled' ? logsResult.value.error?.message : undefined;
        setLogsError(msg || 'Failed to load recent logs');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setLastUpdated(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Dashboard</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>Overview of Shane's Retirement Fund</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className={`text-xs ${t.textMuted} hidden sm:inline`}>
              Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
            </span>
          )}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className={`p-2 rounded-md ${t.buttonBg} ${t.buttonText} transition-colors disabled:opacity-50`}
            title="Refresh dashboard"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Error */}
      {statsError && (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-red-500 text-sm">{statsError}</p>
          </div>
          <button onClick={loadDashboardData} className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs font-medium shrink-0">
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users || 0}
          change={`+${stats?.new_users_week || 0} this week`}
          changeType="positive"
          icon={Users}
          theme={t}
        />
        <StatCard
          label="Active Pools"
          value={stats?.active_pools || 0}
          icon={Ticket}
          theme={t}
        />
        <StatCard
          label="Winning Tickets"
          value={stats?.total_winning_tickets || 0}
          icon={Trophy}
          theme={t}
        />
        <StatCard
          label="Waitlist"
          value={stats?.waitlist_signups || 0}
          change="Pre-launch signups"
          icon={TrendingUp}
          theme={t}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* API Health */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
          <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
            <h2 className={`text-sm font-medium ${t.textPrimary}`}>API Health</h2>
          </div>
          <div className="p-4 space-y-3">
            {healthError && (
              <div className={`flex items-center justify-between p-3 rounded-md border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-red-500 text-sm">{healthError}</p>
                </div>
                <button onClick={loadDashboardData} className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs font-medium shrink-0">
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}
            {!healthError && apiHealth.length === 0 ? (
              <p className={`${t.textMuted} text-sm text-center py-4`}>No APIs configured</p>
            ) : (
              apiHealth.map((api) => (
                <div
                  key={api.id}
                  className={`flex items-center justify-between p-3 ${t.rowBg} rounded-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      api.is_active && api.last_test_success !== false
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${t.textPrimary}`}>{api.name}</p>
                      <p className={`text-xs ${t.textMuted}`}>{api.provider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${t.textPrimary}`}>
                      {api.avg_response_ms_24h ? `${api.avg_response_ms_24h}ms` : '—'}
                    </p>
                    <p className={`text-xs ${t.textMuted}`}>
                      {api.calls_24h} calls today
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
          <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
            <h2 className={`text-sm font-medium ${t.textPrimary}`}>Recent API Calls</h2>
          </div>
          <div className="p-4">
            {logsError && (
              <div className={`flex items-center justify-between p-3 rounded-md border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-red-500 text-sm">{logsError}</p>
                </div>
                <button onClick={loadDashboardData} className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs font-medium shrink-0">
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}
            {!logsError && recentLogs.length === 0 ? (
              <p className={`${t.textMuted} text-sm text-center py-4`}>No recent API calls</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center gap-3 p-2 rounded-md ${t.rowHover} transition-colors`}
                  >
                    {log.success ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.textPrimary} truncate`}>
                        {log.endpoint}
                      </p>
                      <p className={`text-xs ${t.textMuted}`}>
                        {log.response_time_ms}ms • {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      log.response_status >= 200 && log.response_status < 300
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {log.response_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-4`}>
        <h2 className={`text-sm font-medium ${t.textPrimary} mb-3`}>Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-sm rounded-md transition-colors`}>
            Fetch Lottery Results
          </button>
          <button className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-sm rounded-md transition-colors`}>
            Check Winners
          </button>
          <button className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-sm rounded-md transition-colors`}>
            Generate Metrics
          </button>
          <button className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-sm rounded-md transition-colors`}>
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

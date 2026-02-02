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
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme } from '../../hooks/useAdminTheme';

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

const AdminDashboard: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme classes
  const t = {
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    iconBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    iconColor: isDark ? 'text-zinc-400' : 'text-zinc-500',
    rowBg: isDark ? 'bg-zinc-800/50' : 'bg-zinc-50',
    rowHover: isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50',
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-100' : 'text-zinc-900',
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load dashboard stats
      const { data: statsData } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (statsData) {
        setStats(statsData);
      }

      // Load API health
      const { data: healthData } = await supabase
        .from('api_health_summary')
        .select('*');

      if (healthData) {
        setApiHealth(healthData);
      }

      // Load recent API logs
      const { data: logsData } = await supabase
        .from('api_logs')
        .select('*, api_connections(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsData) {
        setRecentLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setIsLoading(false);
  };

  const StatCard = ({
    label,
    value,
    change,
    changeType = 'neutral',
    icon: Icon
  }: {
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ElementType;
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
      <div>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Dashboard</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>Overview of Shane's Retirement Fund</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users || 0}
          change={`+${stats?.new_users_week || 0} this week`}
          changeType="positive"
          icon={Users}
        />
        <StatCard
          label="Active Pools"
          value={stats?.active_pools || 0}
          icon={Ticket}
        />
        <StatCard
          label="Winning Tickets"
          value={stats?.total_winning_tickets || 0}
          icon={Trophy}
        />
        <StatCard
          label="Waitlist"
          value={stats?.waitlist_signups || 0}
          change="Pre-launch signups"
          icon={TrendingUp}
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
            {apiHealth.length === 0 ? (
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
            {recentLogs.length === 0 ? (
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

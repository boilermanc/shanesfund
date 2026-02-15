import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  BarChart3,
  Loader2,
  ChevronDown,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  UserPlus,
  CreditCard,
  Users as UsersIcon,
  AlertCircle,
} from 'lucide-react';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { supabase } from '../../lib/supabase';
import { sendNotification, sendPoolNotification } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';

type NotifTab = 'send' | 'recent' | 'stats';

const tabs: { id: NotifTab; label: string }[] = [
  { id: 'send', label: 'Send Notification' },
  { id: 'recent', label: 'Recent' },
  { id: 'stats', label: 'Stats' },
];

const NOTIF_TYPES: Notification['type'][] = [
  'win', 'invite', 'payment', 'reminder', 'friend_request', 'pool_update', 'system',
];

const TYPE_COLORS: Record<string, string> = {
  win: 'bg-amber-500/10 text-amber-500',
  invite: 'bg-blue-500/10 text-blue-500',
  payment: 'bg-emerald-500/10 text-emerald-500',
  reminder: 'bg-orange-500/10 text-orange-500',
  friend_request: 'bg-purple-500/10 text-purple-500',
  pool_update: 'bg-cyan-500/10 text-cyan-500',
  system: 'bg-zinc-500/10 text-zinc-400',
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Send Tab ──────────────────────────────────────────

type RecipientType = 'all' | 'user' | 'pool';

const SendTab: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [recipientType, setRecipientType] = useState<RecipientType>('user');
  const [email, setEmail] = useState('');
  const [poolId, setPoolId] = useState('');
  const [type, setType] = useState<Notification['type']>('system');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [dataJson, setDataJson] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const t = {
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    inputBg: isDark ? 'bg-zinc-800' : 'bg-zinc-50',
    inputBorder: isDark ? 'border-zinc-700' : 'border-zinc-300',
    inputText: isDark ? 'text-zinc-100' : 'text-zinc-900',
    placeholder: isDark ? 'placeholder-zinc-600' : 'placeholder-zinc-400',
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-300' : 'text-zinc-700',
  };

  const handleSend = async () => {
    if (!title || !message) return;
    setIsSending(true);
    setResult(null);

    let extra: Record<string, any> = {};
    if (dataJson.trim()) {
      try {
        extra = JSON.parse(dataJson);
      } catch {
        setResult({ success: false, message: 'Invalid JSON in data field' });
        setIsSending(false);
        return;
      }
    }

    try {
      if (recipientType === 'pool') {
        if (!poolId) {
          setResult({ success: false, message: 'Pool ID is required' });
          setIsSending(false);
          return;
        }
        await sendPoolNotification({ poolId, type, title, message, data: extra });
        setResult({ success: true, message: 'Notifications sent to all pool members' });
      } else if (recipientType === 'user') {
        if (!email) {
          setResult({ success: false, message: 'Email is required' });
          setIsSending(false);
          return;
        }
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (userErr || !userData) {
          setResult({ success: false, message: `User not found: ${email}` });
          setIsSending(false);
          return;
        }
        const notif = await sendNotification({ userId: userData.id, type, title, message, data: extra });
        setResult(notif
          ? { success: true, message: `Notification sent to ${email}` }
          : { success: false, message: 'Failed to send notification' }
        );
      } else {
        // All users
        const { data: allUsers, error: allErr } = await supabase
          .from('users')
          .select('id');
        if (allErr || !allUsers?.length) {
          setResult({ success: false, message: 'Failed to fetch users' });
          setIsSending(false);
          return;
        }
        const notifications = allUsers.map((u) => ({
          user_id: u.id,
          type,
          title,
          message,
          data: extra,
        }));
        const { error } = await supabase.from('notifications').insert(notifications);
        setResult(error
          ? { success: false, message: error.message }
          : { success: true, message: `Notification sent to ${allUsers.length} users` }
        );
      }
    } catch (err) {
      setResult({ success: false, message: 'An unexpected error occurred' });
    }

    setIsSending(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Compose Notification</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Recipient type */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>Recipient</label>
            <div className="flex gap-2">
              {([
                { id: 'user', label: 'Specific User' },
                { id: 'pool', label: 'Pool Members' },
                { id: 'all', label: 'All Users' },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setRecipientType(opt.id)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    recipientType === opt.id
                      ? 'bg-emerald-600 text-white'
                      : `${t.buttonBg} ${t.buttonText}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional recipient input */}
          {recipientType === 'user' && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${t.textSecondary}`}>User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
              />
            </div>
          )}
          {recipientType === 'pool' && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${t.textSecondary}`}>Pool ID</label>
              <input
                type="text"
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="Pool UUID"
                className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
              />
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Notification['type'])}
                className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600`}
              >
                {NOTIF_TYPES.map((nt) => (
                  <option key={nt} value={nt}>{nt.replace('_', ' ')}</option>
                ))}
              </select>
              <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Notification message..."
              className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y`}
            />
          </div>

          {/* Data JSON */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>
              Data <span className={t.textMuted}>(optional JSON)</span>
            </label>
            <textarea
              value={dataJson}
              onChange={(e) => setDataJson(e.target.value)}
              rows={2}
              placeholder='{"key": "value"}'
              className={`w-full px-3 py-2 ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'} border ${t.inputBorder} rounded-md text-xs font-mono ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y`}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isSending || !title || !message}
            className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 ${
              isDark ? 'disabled:bg-zinc-700 disabled:text-zinc-500' : 'disabled:bg-zinc-300 disabled:text-zinc-500'
            } text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2`}
          >
            {isSending ? (
              <><Loader2 size={16} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={16} /> Send Notification</>
            )}
          </button>
        </div>
      </div>

      {/* Result panel */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Result</h2>
        </div>
        <div className="p-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Bell size={24} className={t.textMuted} />
              <p className={`${t.textMuted} text-sm mt-2`}>Send a notification to see the result</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-md border ${t.cardBorder}">
              {result.success ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result.success ? 'Sent successfully' : 'Send failed'}
                </p>
                <p className={`text-xs ${t.textSecondary} mt-1`}>{result.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Recent Tab ────────────────────────────────────────

interface RecentNotif extends Notification {
  user_email?: string;
}

const RecentTab: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [notifications, setNotifications] = useState<RecentNotif[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = {
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    rowHover: isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50',
    codeBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    codeText: isDark ? 'text-zinc-300' : 'text-zinc-700',
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    // Fetch user emails for all unique user_ids
    const userIds = [...new Set(data.map((n) => n.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const emailMap = new Map((users || []).map((u) => [u.id, u.email]));

    setNotifications(
      data.map((n) => ({
        ...n,
        user_email: emailMap.get(n.user_id) || n.user_id,
      })) as RecentNotif[]
    );
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-8 text-center`}>
        <Bell size={24} className={`${t.textMuted} mx-auto mb-2`} />
        <p className={t.textMuted}>No notifications found</p>
      </div>
    );
  }

  return (
    <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg overflow-hidden`}>
      {/* Table header */}
      <div className={`grid grid-cols-[100px_1fr_90px_1fr_1fr_60px_40px] gap-2 px-4 py-2.5 border-b ${t.cardBorder} text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>
        <span>Time</span>
        <span>User</span>
        <span>Type</span>
        <span>Title</span>
        <span>Message</span>
        <span>Read</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-800/50">
        {notifications.map((notif) => (
          <div key={notif.id}>
            <div
              onClick={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
              className={`grid grid-cols-[100px_1fr_90px_1fr_1fr_60px_40px] gap-2 px-4 py-2.5 items-center text-sm cursor-pointer ${t.rowHover} transition-colors`}
            >
              <span className={`text-xs ${t.textMuted}`}>{timeAgo(notif.created_at)}</span>
              <span className={`text-xs ${t.textSecondary} truncate`}>{notif.user_email}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium inline-block w-fit ${TYPE_COLORS[notif.type] || TYPE_COLORS.system}`}>
                {notif.type.replace('_', ' ')}
              </span>
              <span className={`text-xs ${t.textPrimary} truncate`}>{notif.title}</span>
              <span className={`text-xs ${t.textSecondary} truncate`}>{notif.message}</span>
              <span className={`text-xs ${notif.read ? 'text-emerald-500' : 'text-amber-500'}`}>
                {notif.read ? 'Yes' : 'No'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                className={`p-1 rounded ${t.textMuted} hover:text-red-500 transition-colors`}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded detail */}
            {expandedId === notif.id && (
              <div className={`px-4 py-3 border-t ${t.cardBorder} ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className={`font-medium ${t.textSecondary} mb-1`}>Full Message</p>
                    <p className={t.textPrimary}>{notif.message}</p>
                  </div>
                  <div>
                    <p className={`font-medium ${t.textSecondary} mb-1`}>Data</p>
                    <pre className={`${t.codeBg} ${t.codeText} p-2 rounded text-[11px] font-mono overflow-x-auto`}>
                      {JSON.stringify(notif.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Stats Tab ─────────────────────────────────────────

interface NotifStats {
  total: number;
  totalUnread: number;
  last24h: number;
  last7d: number;
  last30d: number;
  byType: Record<string, number>;
}

const StatsTab: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    iconBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);

    const now = new Date();
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, unreadRes, h24Res, d7Res, d30Res] = await Promise.all([
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', d24h),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', d7d),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).gte('created_at', d30d),
    ]);

    // Type breakdown — fetch a sample of recent notifications and count by type
    const { data: recentAll } = await supabase
      .from('notifications')
      .select('type')
      .limit(10000);

    const byType: Record<string, number> = {};
    for (const row of recentAll || []) {
      byType[row.type] = (byType[row.type] || 0) + 1;
    }

    setStats({
      total: totalRes.count || 0,
      totalUnread: unreadRes.count || 0,
      last24h: h24Res.count || 0,
      last7d: d7Res.count || 0,
      last30d: d30Res.count || 0,
      byType,
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Sent', value: stats.total, icon: Bell },
    { label: 'Unread', value: stats.totalUnread, icon: AlertCircle },
    { label: 'Last 24h', value: stats.last24h, icon: BarChart3 },
    { label: 'Last 7 days', value: stats.last7d, icon: BarChart3 },
    { label: 'Last 30 days', value: stats.last30d, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 ${t.iconBg} rounded-md flex items-center justify-center`}>
                <card.icon size={14} className={t.textSecondary} />
              </div>
            </div>
            <p className={`text-xl font-semibold ${t.textPrimary}`}>{card.value.toLocaleString()}</p>
            <p className={`text-xs ${t.textMuted} mt-0.5`}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Breakdown by Type</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {NOTIF_TYPES.map((nt) => (
              <div
                key={nt}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}
              >
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[nt]}`}>
                  {nt.replace('_', ' ')}
                </span>
                <span className={`text-sm font-semibold ${t.textPrimary}`}>
                  {(stats.byType[nt] || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────

const AdminNotifications: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [activeTab, setActiveTab] = useState<NotifTab>('send');

  const t = {
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    tabActive: isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900',
    tabInactive: isDark
      ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'send': return <SendTab />;
      case 'recent': return <RecentTab />;
      case 'stats': return <StatsTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Notifications</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>
          Send, view, and manage push notifications
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? t.tabActive : t.tabInactive
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
};

export default AdminNotifications;

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Copy,
  Mail,
} from 'lucide-react';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';
import { getEmailLogs } from '../../services/email';
import type { EmailLog } from '../../types/database';

const EmailLogs: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = getAdminTheme(isDark);

  useEffect(() => {
    loadLogs();
  }, [statusFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    const { data } = await getEmailLogs({
      limit: 50,
      status: statusFilter || undefined,
    });
    if (data) setLogs(data);
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-yellow-500/10 text-yellow-500';
    }
  };

  const triggerBadge = (triggered_by: string) => {
    switch (triggered_by) {
      case 'admin_test':
        return isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700';
      case 'contact_form':
        return isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700';
      default:
        return isDark ? 'bg-zinc-500/10 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      setCopiedId('error');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
      <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
        <h2 className={`text-sm font-medium ${t.textPrimary}`}>Email Logs</h2>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-xs appearance-none pr-7 focus:outline-none focus:ring-1 focus:ring-emerald-600`}
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown
              size={12}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`}
            />
          </div>
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className={`p-1.5 ${t.buttonBg} ${t.buttonText} rounded-md transition-colors`}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Mail size={24} className={`${t.textMuted} mb-2`} />
          <p className={`${t.textMuted} text-sm`}>No emails sent yet</p>
        </div>
      ) : (
        <div className={`divide-y ${t.divider}`}>
          {logs.map((log) => (
            <div key={log.id}>
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className={`w-full text-left px-4 py-3 ${t.rowHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor(log.status)}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-3 items-center">
                    <span className={`text-sm ${t.textPrimary} truncate`}>{log.to_email}</span>
                    <span className={`text-xs ${t.textMuted} truncate`}>
                      {log.template_name || 'Custom'}
                    </span>
                    <span className={`text-xs ${t.textSecondary} truncate hidden sm:block`}>
                      {log.subject}
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${triggerBadge(log.triggered_by)}`}>
                        {log.triggered_by}
                      </span>
                      <span className={`text-xs ${t.textMuted} shrink-0 hidden sm:block`}>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Expand icon */}
                  {expandedId === log.id ? (
                    <ChevronUp size={14} className={t.textMuted} />
                  ) : (
                    <ChevronDown size={14} className={t.textMuted} />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === log.id && (
                <div className={`px-4 py-3 ${t.rowBg} border-t ${t.cardBorder} space-y-3`}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${t.textMuted} mb-1`}>Status</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs ${t.textMuted} mb-1`}>From</p>
                      <p className={`text-xs ${t.textSecondary}`}>{log.from_email}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${t.textMuted} mb-1`}>Subject</p>
                      <p className={`text-xs ${t.textPrimary}`}>{log.subject}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${t.textMuted} mb-1`}>Sent at</p>
                      <p className={`text-xs ${t.textSecondary}`}>{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    {log.resend_message_id && (
                      <div>
                        <p className={`text-xs ${t.textMuted} mb-1`}>Resend ID</p>
                        <div className="flex items-center gap-1.5">
                          <code className={`text-xs font-mono ${t.codeText}`}>
                            {log.resend_message_id}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(log.resend_message_id!, log.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              copiedId === log.id ? 'text-emerald-500' : copiedId === 'error' ? 'text-red-500' : t.copyButton
                            }`}
                          >
                            {copiedId === log.id ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                    )}
                    {log.error_message && (
                      <div className="sm:col-span-2">
                        <p className={`text-xs ${t.textMuted} mb-1`}>Error</p>
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                          <p className="text-red-500 text-xs">{log.error_message}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variables */}
                  {log.variables && Object.keys(log.variables as Record<string, unknown>).length > 0 && (
                    <div>
                      <p className={`text-xs ${t.textMuted} mb-1`}>Variables</p>
                      <pre className={`p-2 ${t.codeBg} rounded-md text-xs ${t.codeText} font-mono overflow-auto`}>
                        {JSON.stringify(log.variables, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* HTML Preview */}
                  <div>
                    <p className={`text-xs ${t.textMuted} mb-1`}>Email Preview</p>
                    <div className={`border ${t.cardBorder} rounded-md overflow-hidden`}>
                      <iframe
                        srcDoc={log.html_body}
                        sandbox=""
                        className="w-full bg-white"
                        style={{ height: '300px' }}
                        title="Email log preview"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailLogs;

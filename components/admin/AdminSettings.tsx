import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';
import {
  getSettingsMap,
  updateSettings,
  testSlackConnection,
} from '../../services/settings';

const AdminSettings: React.FC = () => {
  const { isDark } = useAdminTheme();
  const t = getAdminTheme(isDark);

  // Form state
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('#general');
  const [showWebhook, setShowWebhook] = useState(false);

  // Loading / feedback
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await getSettingsMap('slack');
    if (error) {
      setLoadError(error);
      setLoading(false);
      return;
    }
    if (data) {
      setSlackEnabled(data.slack_enabled === true);
      setWebhookUrl(data.slack_webhook_url || '');
      setChannelName(data.slack_channel_name || '#general');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);

    const { error } = await updateSettings([
      { category: 'slack', key: 'slack_enabled', value: slackEnabled ? 'true' : 'false' },
      { category: 'slack', key: 'slack_webhook_url', value: webhookUrl || null },
      { category: 'slack', key: 'slack_channel_name', value: channelName },
    ]);

    if (error) {
      setSaveResult({ success: false, message: error });
    } else {
      setSaveResult({ success: true, message: 'Settings saved' });
    }
    setIsSaving(false);
    setTimeout(() => setSaveResult(null), 4000);
  };

  // Test connection
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save first so the edge function reads fresh values
    const { error: saveError } = await updateSettings([
      { category: 'slack', key: 'slack_enabled', value: slackEnabled ? 'true' : 'false' },
      { category: 'slack', key: 'slack_webhook_url', value: webhookUrl || null },
      { category: 'slack', key: 'slack_channel_name', value: channelName },
    ]);

    if (saveError) {
      setTestResult({ success: false, message: `Save failed: ${saveError}` });
      setIsTesting(false);
      return;
    }

    const { data, error } = await testSlackConnection();

    if (error) {
      setTestResult({ success: false, message: error });
    } else if (data) {
      setTestResult({ success: data.success, message: data.message });
    }
    setIsTesting(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Settings</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>Configure integrations and system settings</p>
        </div>
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-12 flex items-center justify-center`}>
          <Loader2 className={`animate-spin ${t.textMuted}`} size={24} />
          <span className={`ml-3 ${t.textMuted}`}>Loading settings...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Settings</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>Configure integrations and system settings</p>
        </div>
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-8 text-center space-y-3`}>
          <AlertCircle className="mx-auto text-red-500" size={24} />
          <p className="text-red-500 text-sm">{loadError}</p>
          <button
            onClick={loadSettings}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Settings</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>Configure integrations and system settings</p>
      </div>

      {/* Slack Integration Card */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg overflow-hidden`}>
        {/* Card header */}
        <div className={`px-6 py-4 border-b ${t.cardBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <MessageSquare size={18} className="text-purple-500" />
            </div>
            <div>
              <h2 className={`font-semibold ${t.textPrimary}`}>Slack</h2>
              <p className={`text-xs ${t.textMuted}`}>Send notifications to a Slack channel</p>
            </div>
          </div>

          {/* Enable toggle */}
          <button
            onClick={() => setSlackEnabled(!slackEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              slackEnabled ? 'bg-emerald-500' : isDark ? 'bg-zinc-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                slackEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Card body */}
        <div className="px-6 py-5 space-y-5">
          {/* Webhook URL */}
          <div className="space-y-1.5">
            <label className={`block text-sm font-medium ${t.textSecondary}`}>
              Webhook URL
            </label>
            <div className="relative">
              <input
                type={showWebhook ? 'text' : 'password'}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className={`w-full px-3 py-2 pr-10 text-sm rounded-lg border ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowWebhook(!showWebhook)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t.textMuted} hover:${t.textSecondary} transition-colors`}
              >
                {showWebhook ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className={`text-xs ${t.textMuted}`}>
              Create one at Slack &rarr; Apps &rarr; Incoming Webhooks
            </p>
          </div>

          {/* Channel name */}
          <div className="space-y-1.5">
            <label className={`block text-sm font-medium ${t.textSecondary}`}>
              Channel Name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="#general"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors`}
            />
            <p className={`text-xs ${t.textMuted}`}>
              Display label only — the actual channel is set by the webhook
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleTest}
              disabled={isTesting || !slackEnabled || !webhookUrl}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                isDark
                  ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Save result */}
          {saveResult && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              saveResult.success
                ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              {saveResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {saveResult.message}
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
              testResult.success
                ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

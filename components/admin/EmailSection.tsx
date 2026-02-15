import React, { useState } from 'react';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import EmailTemplates from './EmailTemplates';
import EmailTestSend from './EmailTestSend';
import EmailLogs from './EmailLogs';

type EmailTab = 'templates' | 'test' | 'logs';

const tabs: { id: EmailTab; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'test', label: 'Test Send' },
  { id: 'logs', label: 'Logs' },
];

const EmailSection: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [activeTab, setActiveTab] = useState<EmailTab>('templates');

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
      case 'templates':
        return <EmailTemplates />;
      case 'test':
        return <EmailTestSend />;
      case 'logs':
        return <EmailLogs />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Email</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>
            Manage email templates, send tests, and view logs
          </p>
        </div>
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

      {/* Tab content */}
      {renderTab()}
    </div>
  );
};

export default EmailSection;

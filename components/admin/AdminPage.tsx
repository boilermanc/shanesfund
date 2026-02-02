import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import ApiTester from './ApiTester';
import { useAdminTheme } from '../../hooks/useAdminTheme';

// Placeholder section component with theme support
const PlaceholderSection = ({ title, description, message }: { title: string; description: string; message: string }) => {
  const { isDark } = useAdminTheme();
  const t = {
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>{title}</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>{description}</p>
      </div>
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-8 text-center`}>
        <p className={t.textMuted}>{message}</p>
      </div>
    </div>
  );
};

const ApiHealthSection = () => (
  <PlaceholderSection
    title="API Health"
    description="Monitor API connections and performance"
    message="API Health monitoring coming soon..."
  />
);

const UsersSection = () => (
  <PlaceholderSection
    title="Users"
    description="Manage user accounts and permissions"
    message="User management coming soon..."
  />
);

const ApiTesterSection = () => <ApiTester />;

const LogsSection = () => (
  <PlaceholderSection
    title="Logs"
    description="View system and API logs"
    message="Logs viewer coming soon..."
  />
);

const SettingsSection = () => (
  <PlaceholderSection
    title="Settings"
    description="Configure system settings and feature flags"
    message="Settings panel coming soon..."
  />
);

const AdminPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'api-health':
        return <ApiHealthSection />;
      case 'users':
        return <UsersSection />;
      case 'api-tester':
        return <ApiTesterSection />;
      case 'logs':
        return <LogsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
};

export default AdminPage;

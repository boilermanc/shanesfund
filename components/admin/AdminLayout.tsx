import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLogin from './AdminLogin';
import {
  LayoutDashboard,
  Activity,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Zap,
  Mail,
  Database,
  Bell,
  ChevronRight,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';
import { supabase } from '../../lib/supabase';
import type { AdminUser } from '../../types/database';

export type AdminSection = 'dashboard' | 'api-health' | 'users' | 'api-tester' | 'email' | 'notifications' | 'logs' | 'settings';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, onSectionChange }) => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useAdminTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user?.email) {
      setIsLoading(false);
      setIsAuthorized(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (data && !error) {
        setAdminUser(data);
        setIsAuthorized(true);
        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.id);
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error('Admin access check failed:', err);
      setIsAuthorized(false);
    }
    setIsLoading(false);
  };

  const navItems: { id: AdminSection; label: string; icon: React.FC<any> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'api-health', label: 'API Health', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'api-tester', label: 'API Tester', icon: Zap },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logs', label: 'Logs', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const t = getAdminTheme(isDark);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${t.pageBg} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-8 h-8 border-2 ${t.spinnerBorder} rounded-full animate-spin mx-auto mb-4`} />
          <p className={`${t.textMuted} text-sm`}>Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Not logged in at all - show login form
    if (!user) {
      return <AdminLogin onLoginSuccess={() => checkAdminAccess()} />;
    }

    // Logged in but not an admin - show access denied
    return (
      <div className={`min-h-screen ${t.pageBg} flex items-center justify-center p-4`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-8 max-w-sm w-full text-center`}
        >
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <h1 className={`text-lg font-semibold ${t.textPrimary} mb-2`}>Access Denied</h1>
          <p className={`${t.textSecondary} text-sm mb-6 leading-relaxed`}>
            Your account ({user.email}) does not have admin privileges.
          </p>
          <div className="space-y-2">
            <a
              href="/"
              className={`block w-full px-4 py-2 ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'} rounded-md text-sm font-medium transition-colors text-center`}
            >
              Return to App
            </a>
            <button
              onClick={() => signOut()}
              className={`block w-full px-4 py-2 ${t.textSecondary} ${t.hoverText} rounded-md text-sm transition-colors`}
            >
              Sign in with different account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      {sidebarOpen && (
        <div
          className={`fixed inset-0 ${t.overlay} backdrop-blur-sm z-40 lg:hidden`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 ${t.sidebarBg} border-r ${t.sidebarBorder}
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className={`h-14 flex items-center justify-between px-4 border-b ${t.sidebarBorder}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">SF</span>
            </div>
            <span className={`font-semibold ${t.textPrimary} text-sm`}>Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-1 ${t.textSecondary} ${t.hoverText} rounded`}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className={`px-3 py-2 text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>
            Overview
          </p>
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${activeSection === item.id ? t.navActive : t.navInactive}
              `}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}

          <p className={`px-3 py-2 mt-4 text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>
            Management
          </p>
          {navItems.slice(2, 6).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${activeSection === item.id ? t.navActive : t.navInactive}
              `}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}

          <p className={`px-3 py-2 mt-4 text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>
            System
          </p>
          {navItems.slice(6).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${activeSection === item.id ? t.navActive : t.navInactive}
              `}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className={`p-3 border-t ${t.sidebarBorder}`}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-md ${t.hoverBg} transition-colors cursor-pointer group`}>
            <div className={`w-8 h-8 ${t.avatarBg} rounded-full flex items-center justify-center ring-1 ${t.avatarRing}`}>
              <span className={`${t.avatarText} text-xs font-medium`}>
                {adminUser?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${t.textPrimary} text-sm font-medium truncate`}>{adminUser?.email}</p>
              <p className={`${t.textMuted} text-xs capitalize`}>{adminUser?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2 mt-1 ${t.textSecondary} ${t.hoverText} ${t.hoverBg} rounded-md transition-colors text-sm`}
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className={`sticky top-0 z-30 h-14 ${t.headerBg} backdrop-blur-sm border-b ${t.sidebarBorder} px-4 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 -ml-2 ${t.textSecondary} ${t.hoverText} rounded-md ${t.hoverBgSolid}`}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className={t.textMuted}>Admin</span>
              <ChevronRight size={14} className={t.textMuted} />
              <span className={`${t.textPrimary} capitalize`}>{activeSection.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 ${t.textSecondary} ${t.hoverText} rounded-md ${t.hoverBgSolid} transition-colors`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            </button>

            <button className={`relative p-2 ${t.textSecondary} ${t.hoverText} rounded-md ${t.hoverBgSolid} transition-colors`}>
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </button>

            <a
              href="/"
              className={`hidden sm:inline-flex items-center gap-1.5 text-sm ${t.textSecondary} ${t.hoverText} px-3 py-1.5 rounded-md ${t.hoverBgSolid} transition-colors`}
            >
              View site
              <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

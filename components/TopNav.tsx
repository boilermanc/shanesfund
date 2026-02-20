import React from 'react';
import { motion } from 'framer-motion';
import { Home, Heart, ClipboardList, BarChart3, Plus, ScanLine, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onScanTicket: () => void;
  onCreatePool: () => void;
  onOpenNotifications: () => void;
  onOpenDrawer: () => void;
  user: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'friends', icon: Heart, label: 'Friends' },
  { id: 'results', icon: ClipboardList, label: 'Results' },
  { id: 'insights', icon: BarChart3, label: 'Insights' },
];

const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onScanTicket,
  onCreatePool,
  onOpenNotifications,
  onOpenDrawer,
  user,
}: TopNavProps) => {
  const { unreadCount } = useStore();
  const firstName = user?.display_name?.split(' ')[0] || 'U';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg shadow-lg shadow-[#006D77]/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo.png" alt="Shane's Retirement Fund" className="h-10 w-auto" />
            <span className="shane-serif text-lg font-black text-[#006D77] hidden lg:block">
              Shane's Fund
            </span>
          </button>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1 lg:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#006D77]/10 text-[#006D77]'
                      : 'text-[#006D77]/60 hover:text-[#006D77] hover:bg-[#006D77]/5'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side: actions + notifications + avatar */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <button
              onClick={onCreatePool}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-bold bg-[#006D77] text-white hover:bg-[#006D77]/90 transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden lg:inline">Create Pool</span>
            </button>
            <button
              onClick={onScanTicket}
              className="p-2 rounded-xl text-[#006D77]/60 hover:text-[#006D77] hover:bg-[#006D77]/5 transition-colors"
              title="Scan Ticket"
            >
              <ScanLine size={20} strokeWidth={2} />
            </button>
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-[#006D77]/60 hover:text-[#006D77] hover:bg-[#006D77]/5 transition-colors"
              title="Notifications"
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E29578] rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-black text-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>
            <button
              onClick={onOpenDrawer}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#83C5BE] shadow-sm bg-white flex-shrink-0"
              aria-label="Open menu"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#83C5BE] to-[#006D77] flex items-center justify-center text-white font-bold text-sm">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default TopNav;

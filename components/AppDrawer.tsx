import React from 'react';
import { motion } from 'framer-motion';
import { X, User, FileText, Shield, MessageSquare, LogOut, ChevronRight } from 'lucide-react';

interface AppDrawerProps {
  onClose: () => void;
  onNavigate: (page: 'profile' | 'terms' | 'privacy' | 'contact') => void;
  onLogout: () => void;
  user: { display_name?: string | null; avatar_url?: string | null } | null;
}

const menuItems = [
  { id: 'profile' as const, icon: User, label: 'Profile', subtitle: 'View your account' },
  { id: 'terms' as const, icon: FileText, label: 'Terms of Service' },
  { id: 'privacy' as const, icon: Shield, label: 'Privacy Policy' },
  { id: 'contact' as const, icon: MessageSquare, label: 'Support' },
];

const AppDrawer: React.FC<AppDrawerProps> = ({ onClose, onNavigate, onLogout, user }) => {
  const firstName = user?.display_name?.split(' ')[0] || 'User';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-[85%] max-w-[360px] bg-white h-full rounded-l-[2rem] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-12 pb-4 flex items-center justify-between border-b border-[#FFDDD2]/50">
          <h2 className="text-lg font-black text-[#006D77]">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#006D77]/60 hover:bg-[#EDF6F9] transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-5 border-b border-[#FFDDD2]/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#83C5BE] shadow-sm bg-white flex-shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#83C5BE] to-[#006D77] flex items-center justify-center text-white font-bold text-lg">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-black text-[#006D77]">{user?.display_name || 'User'}</p>
              <p className="text-[10px] font-bold text-[#83C5BE] uppercase tracking-wider">Member</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#EDF6F9] transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#EDF6F9] group-hover:bg-white flex items-center justify-center text-[#006D77] transition-colors">
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-[#006D77]">{item.label}</p>
                  {item.subtitle && (
                    <p className="text-[10px] font-bold text-[#83C5BE]">{item.subtitle}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#83C5BE]/60" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-3 pb-8 pt-2 border-t border-[#FFDDD2]/30">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-[#FFDDD2]/20 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFDDD2]/30 flex items-center justify-center text-[#E29578] transition-colors">
              <LogOut size={18} />
            </div>
            <p className="text-sm font-bold text-[#E29578]">Log Out</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AppDrawer;

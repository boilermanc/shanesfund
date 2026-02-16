import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Trophy, UserPlus, CreditCard, Users, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Notification } from '../types/database';
import FocusTrap from './FocusTrap';

interface NotificationsCenterProps {
  onClose: () => void;
}

// Relative time helper
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Notification type → icon and color mapping
const NOTIFICATION_CONFIG: Record<Notification['type'], { icon: React.ReactNode; color: string }> = {
  win:            { icon: <Trophy size={16} />,     color: 'bg-[#E29578]' },
  invite:         { icon: <UserPlus size={16} />,   color: 'bg-[#006D77]' },
  friend_request: { icon: <UserPlus size={16} />,   color: 'bg-[#006D77]' },
  payment:        { icon: <CreditCard size={16} />, color: 'bg-[#83C5BE]' },
  reminder:       { icon: <Bell size={16} />,       color: 'bg-[#E29578]' },
  pool_update:    { icon: <Users size={16} />,      color: 'bg-[#006D77]' },
  system:         { icon: <Bell size={16} />,       color: 'bg-[#83C5BE]' },
};

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ onClose }) => {
  const { notifications, notificationsLoading, unreadCount, markNotificationRead, markAllNotificationsRead, removeNotification, user } = useStore();

  const handleMarkAllRead = () => {
    if (user?.id && unreadCount > 0) {
      markAllNotificationsRead(user.id);
    }
  };

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[570] bg-[#EDF6F9] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
      {/* Header */}
      <header className="px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-[#FFDDD2]">
        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl glass border border-white text-[#006D77] hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5">Updates</p>
          <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">Alerts</h2>
        </div>
        {unreadCount > 0 ? (
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] sm:text-[11px] font-black text-[#E29578] uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            Mark all read
          </button>
        ) : (
          <div className="w-9 sm:w-10" />
        )}
      </header>

      {/* Notification List */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 space-y-3 sm:space-y-4">
        {notificationsLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2]/50 animate-pulse">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#EDF6F9] rounded w-1/3" />
                    <div className="h-2.5 bg-[#EDF6F9] rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((notif, i) => {
              const config = NOTIFICATION_CONFIG[notif.type] || NOTIFICATION_CONFIG.system;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (!notif.read) markNotificationRead(notif.id);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!notif.read) markNotificationRead(notif.id); } }}
                  role="button"
                  tabIndex={0}
                  className={`bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border warm-shadow flex items-center justify-between group cursor-pointer transition-all ${
                    notif.read
                      ? 'border-[#FFDDD2]/50 opacity-70'
                      : 'border-l-4 border-l-[#E29578] border-[#FFDDD2] shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${config.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-[#006D77]">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#E29578] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-bold leading-tight mt-0.5 truncate">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">
                      {timeAgo(notif.created_at)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      aria-label="Dismiss notification"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#83C5BE]/50 hover:text-[#E29578] hover:bg-[#FFDDD2]/30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* End of list */}
            <div className="bg-[#EDF6F9] p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-[#83C5BE]/30 text-center mt-4">
              <Bell size={32} className="text-[#83C5BE]/40 mx-auto mb-3 sm:mb-4" />
              <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                No more recent updates
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center pt-20">
            <div className="bg-[#EDF6F9] p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-[#83C5BE]/30 text-center">
              <Bell size={40} className="text-[#83C5BE]/40 mx-auto mb-4" />
              <h3 className="text-sm sm:text-base font-black text-[#006D77] mb-1">All quiet</h3>
              <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-bold uppercase tracking-[0.2em]">
                No notifications yet
              </p>
            </div>
          </div>
        )}
      </main>
      </motion.div>
    </FocusTrap>
  );
};

export default NotificationsCenter;

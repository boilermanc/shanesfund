import React from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, UserPlus, DollarSign, Clock, Heart, Info, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Notification } from '../types/database';

interface NotificationPanelProps {
  onClose: () => void;
  onOpenPool?: (poolId: string) => void;
}

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
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const NOTIFICATION_CONFIG: Record<string, {
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
}> = {
  win: {
    icon: <Trophy size={16} />,
    iconBg: 'bg-[#10B981]',
    borderColor: 'border-l-[#10B981]',
  },
  invite: {
    icon: <UserPlus size={16} />,
    iconBg: 'bg-[#83C5BE]',
    borderColor: 'border-l-[#83C5BE]',
  },
  payment: {
    icon: <DollarSign size={16} />,
    iconBg: 'bg-[#E29578]',
    borderColor: 'border-l-[#E29578]',
  },
  reminder: {
    icon: <Clock size={16} />,
    iconBg: 'bg-[#E29578]',
    borderColor: 'border-l-[#E29578]',
  },
  friend_request: {
    icon: <Heart size={16} />,
    iconBg: 'bg-[#FFDDD2] text-[#E29578]',
    borderColor: 'border-l-[#FFDDD2]',
  },
  system: {
    icon: <Info size={16} />,
    iconBg: 'bg-gray-400',
    borderColor: 'border-l-gray-300',
  },
  pool_update: {
    icon: <Info size={16} />,
    iconBg: 'bg-gray-400',
    borderColor: 'border-l-gray-300',
  },
};

const NotificationCard: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
  onOpenPool?: (poolId: string) => void;
}> = ({ notification, onMarkRead, onOpenPool }) => {
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const data = (notification.data || {}) as Record<string, any>;

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 sm:p-4 rounded-xl border border-[#FFDDD2] mb-2 cursor-pointer transition-all border-l-4 ${config.borderColor} ${
        notification.read ? 'bg-white font-normal' : 'bg-[#EDF6F9] font-bold'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full ${config.iconBg} text-white flex items-center justify-center shrink-0 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-xs sm:text-sm text-[#006D77] truncate ${notification.read ? 'font-semibold' : 'font-bold'}`}>
              {notification.title}
            </h4>
            <span className="text-[9px] text-[#83C5BE] font-bold uppercase tracking-wider shrink-0">
              {timeAgo(notification.created_at)}
            </span>
          </div>
          <p className={`text-[10px] sm:text-[11px] text-[#83C5BE] leading-tight mt-0.5 ${notification.read ? 'font-normal' : 'font-bold'}`}>
            {notification.message}
          </p>

          {/* Win-specific: prize amount */}
          {notification.type === 'win' && data.prize_amount && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-[#10B981]">
                ${Number(data.prize_amount).toFixed(2)}
              </span>
              {data.per_member_share && (
                <span className="text-[10px] text-[#83C5BE] font-bold">
                  Your share: ${Number(data.per_member_share).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Win-specific: view pool button */}
          {notification.type === 'win' && data.pool_id && onOpenPool && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPool(data.pool_id);
              }}
              className="mt-2 text-[10px] font-black text-[#006D77] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#D1FAE5] border border-[#10B981]/30 hover:bg-[#10B981] hover:text-white transition-colors"
            >
              View Pool
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onOpenPool }) => {
  const {
    notifications,
    notificationsLoading,
    unreadCount,
    user,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();

  const handleMarkAllRead = () => {
    if (user?.id && unreadCount > 0) {
      markAllNotificationsRead(user.id);
    }
  };

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
          <h2 className="text-lg font-black text-[#006D77]">Notifications</h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-black text-[#E29578] uppercase tracking-wider hover:opacity-70 transition-opacity"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#006D77]/60 hover:bg-[#EDF6F9] transition-colors"
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {notificationsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-[#EDF6F9] p-4 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#83C5BE]/20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#83C5BE]/20 rounded w-1/3" />
                      <div className="h-2.5 bg-[#83C5BE]/20 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkRead={markNotificationRead}
                onOpenPool={onOpenPool}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <Bell size={40} className="text-[#83C5BE]/40 mb-4" />
              <h3 className="text-sm font-black text-[#006D77] mb-1">All caught up!</h3>
              <p className="text-[10px] text-[#83C5BE] font-bold">
                We'll notify you when something happens
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotificationPanel;

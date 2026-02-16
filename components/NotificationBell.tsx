import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useStore } from '../store/useStore';

interface NotificationBellProps {
  onClick: () => void;
  onWinDetected?: (notification: any) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, onWinDetected }) => {
  const { unreadCount, notifications } = useStore();
  const [shake, setShake] = useState(false);
  const initializedRef = useRef(false);
  const prevLengthRef = useRef(notifications.length);

  // Detect new realtime notifications (skip initial load)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevLengthRef.current = notifications.length;
      return;
    }

    const delta = notifications.length - prevLengthRef.current;
    prevLengthRef.current = notifications.length;

    // delta === 1 means a single realtime insert (initial load jumps by many)
    if (delta === 1 && notifications.length > 0) {
      const newest = notifications[0];

      // Shake the bell for any new notification
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);

      // Only trigger win alert for recent notifications (< 10s old)
      if (newest.type === 'win' && onWinDetected) {
        const age = Date.now() - new Date(newest.created_at).getTime();
        if (age < 10000) {
          onWinDetected(newest);
        }
      }

      return () => clearTimeout(timer);
    }
  }, [notifications.length, onWinDetected]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-xl text-[#006D77] hover:bg-[#EDF6F9] transition-all"
      aria-label="Notifications"
    >
      <motion.div
        animate={shake ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Bell size={22} />
      </motion.div>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#E29578] text-white text-[9px] font-black flex items-center justify-center px-1">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

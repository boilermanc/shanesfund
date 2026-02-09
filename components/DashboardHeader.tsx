import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import ShaneMascot from './ShaneMascot';
interface DashboardHeaderProps {
  user: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  totalPoolValue: number;
  onOpenNotifications?: () => void;
}
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, totalPoolValue, onOpenNotifications }) => {
  const { unreadCount } = useStore();
  const springValue = useSpring(0, { stiffness: 45, damping: 20 });
  const displayValue = useTransform(springValue, (latest) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(latest)
  );
  useEffect(() => {
    springValue.set(totalPoolValue);
  }, [totalPoolValue, springValue]);
  // Get first name safely
  const firstName = user?.display_name?.split(' ')[0] || 'Friend';
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pt-4 sm:pt-6 md:pt-8">
      {/* Greeting Header */}
      <div className="flex justify-between items-center px-2 md:hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="scale-75 sm:scale-100">
            <ShaneMascot size="sm" expression="normal" animate />
          </div>
          <div>
            <h2 className="shane-serif text-base sm:text-lg font-black text-[#4A5D4E] leading-none mb-0.5">
              Shane's Fund
            </h2>
            <h1 className="text-[10px] sm:text-xs font-black text-[#006D77] tracking-tight opacity-60">
              Good Morning, {firstName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenNotifications}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#FFDDD2] warm-shadow flex items-center justify-center text-[#006D77] hover:bg-[#EDF6F9] transition-colors"
          >
            <Bell size={18} strokeWidth={2.5} className="sm:hidden" />
            <Bell size={20} strokeWidth={2.5} className="hidden sm:block" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-[#E29578] rounded-full flex items-center justify-center">
                <span className="text-[8px] sm:text-[9px] font-black text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 border-2 border-[#83C5BE] shadow-lg warm-shadow bg-white overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-full h-full rounded-full object-cover"
                alt="Profile"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#83C5BE] to-[#006D77] flex items-center justify-center text-white font-bold text-sm">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Total Fund Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-pearl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 warm-shadow border border-white/40 overflow-hidden relative"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-20 sm:w-24 h-20 sm:h-24 bg-[#006D77]/5 rounded-full blur-xl" />
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#006D77]/60 mb-2 sm:mb-3">
            Current Pool Value
          </p>
          <motion.div className="text-4xl sm:text-5xl md:text-6xl font-black text-[#006D77] tracking-tighter">
            {displayValue}
          </motion.div>
          <div className="mt-4 sm:mt-6 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white/40 border border-white/60">
            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#E29578] animate-pulse" />
            <p className="text-[9px] sm:text-[10px] text-[#006D77] font-black uppercase tracking-widest">
              Live Network Equity
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default DashboardHeader;

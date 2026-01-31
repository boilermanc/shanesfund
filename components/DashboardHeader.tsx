
import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { User } from '../types';
import ShaneMascot from './ShaneMascot';

interface DashboardHeaderProps {
  user: User | null;
  totalPoolValue: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, totalPoolValue }) => {
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

  return (
    <div className="space-y-6 pt-6">
      {/* Greeting Header */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <ShaneMascot size="sm" animate />
          <div>
            <h2 className="shane-serif text-lg font-black text-[#4A5D4E] leading-none mb-0.5">
              Shane’s Fund
            </h2>
            <h1 className="text-xs font-black text-[#006D77] tracking-tight opacity-60">
              Good Morning, {user?.full_name.split(' ')[0]}
            </h1>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full p-0.5 border-2 border-[#83C5BE] shadow-lg warm-shadow bg-white">
          <img 
            src={user?.avatar_url} 
            className="w-full h-full rounded-full object-cover" 
            alt="Profile" 
          />
        </div>
      </div>

      {/* Total Fund Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-pearl rounded-[2.5rem] p-8 warm-shadow border border-white/40 overflow-hidden relative"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#006D77]/5 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col items-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#006D77]/60 mb-3">
            Current Pool Value
          </p>
          <motion.div className="text-5xl font-black text-[#006D77] tracking-tighter">
            {displayValue}
          </motion.div>
          
          <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 border border-white/60">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#E29578] animate-pulse" />
            <p className="text-[10px] text-[#006D77] font-black uppercase tracking-widest">
              Live Network Equity
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHeader;

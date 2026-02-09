import React from 'react';
import { motion } from 'framer-motion';
import { Pool } from '../types';
import { Users, Calendar, ArrowRight } from 'lucide-react';

interface PoolListProps {
  pools: Pool[];
  onJoin?: (pool: Pool) => void;
}

const PoolCard: React.FC<{ pool: Pool; onJoin?: (pool: Pool) => void }> = ({ pool, onJoin }) => {
  const paidCount = Math.floor(pool.participants_count * 0.8);
  const totalCount = pool.participants_count;
  const progress = (paidCount / totalCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 mb-3 sm:mb-4 md:mb-0 border border-[#FFDDD2] warm-shadow flex flex-col gap-3 sm:gap-4 relative group"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight group-hover:text-[#E29578] transition-colors truncate">
            {pool.name}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-widest">Jackpot</p>
            <p className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">${(pool.total_jackpot / 1000000).toFixed(0)}M</p>
          </div>
        </div>
        <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#E29578] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#FFDDD2] shrink-0">
          Draw {new Date(pool.draw_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between items-end">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">Funding Progress</p>
          <p className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-widest">
            {paidCount}/{totalCount} Members Paid
          </p>
        </div>
        <div className="h-2.5 sm:h-3 w-full bg-[#EDF6F9] rounded-full overflow-hidden border border-[#FFDDD2]/30">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-[#83C5BE] rounded-full"
          />
        </div>
      </div>

      <button 
        onClick={() => onJoin?.(pool)}
        className="w-full mt-1 sm:mt-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#83C5BE]/20 transition-all border border-[#83C5BE]/10"
      >
        Manage Pool <ArrowRight size={12} />
      </button>
    </motion.div>
  );
};

const PoolList: React.FC<PoolListProps> = ({ pools, onJoin }) => {
  return (
    <div className="pb-6 sm:pb-8 md:grid md:grid-cols-2 md:gap-4 lg:gap-6">
      {pools.map((pool) => (
        <PoolCard key={pool.id} pool={pool} onJoin={onJoin} />
      ))}
    </div>
  );
};

export default PoolList;
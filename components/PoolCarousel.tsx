import React from 'react';
import { motion } from 'framer-motion';
import { Pool } from '../types';
import { Users, Calendar, ArrowUpRight } from 'lucide-react';

interface PoolCarouselProps {
  pools: Pool[];
  onJoin?: () => void;
  onPoolClick?: (poolId: string) => void;
}

const PoolCard: React.FC<{ pool: Pool; onJoin?: () => void; onPoolClick?: (poolId: string) => void }> = ({ pool, onJoin, onPoolClick }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPoolClick?.(pool.id)}
      className="min-w-[260px] sm:min-w-[300px] h-[320px] sm:h-[380px] relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white p-5 sm:p-7 flex flex-col justify-between group cursor-pointer border border-[#FFDDD2] warm-shadow transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-[#FFDDD2] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-[#83C5BE] rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#EDF6F9] flex items-center justify-center border border-[#FFDDD2] shadow-sm">
            <img src={`https://picsum.photos/seed/${pool.id}/64`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl opacity-90" alt="pool" />
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass border border-white group-hover:bg-[#E29578] group-hover:text-white transition-all text-[#006D77]">
            <ArrowUpRight size={18} />
          </div>
        </div>
        
        <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1 text-[#006D77] leading-tight">
          {pool.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-extrabold uppercase tracking-widest">Est. Jackpot</p>
          <div className="h-1 w-1 rounded-full bg-[#FFDDD2]" />
          <p className="text-[10px] sm:text-xs font-bold text-[#E29578]">Trending</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter mt-2">
          ${(pool.total_jackpot / 1000000).toFixed(0)}M
        </p>
      </div>

      <div className="relative z-10 space-y-4 sm:space-y-5">
        <div className="h-[3px] w-full bg-[#EDF6F9] overflow-hidden rounded-full">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-full w-[65%] bg-gradient-to-r from-[#E29578] to-[#FFDDD2]" 
          />
        </div>
        
        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users size={14} />
            <span>{pool.participants_count} Players</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar size={14} />
            <span>{new Date(pool.draw_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onJoin?.(); }}
          className="w-full py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-[#E29578] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#FFDDD2] hover:bg-[#006D77] transition-all"
        >
          Join Pool ${(pool as any).contribution_amount || 5}
        </button>
      </div>
    </motion.div>
  );
};

const PoolCarousel: React.FC<PoolCarouselProps> = ({ pools, onJoin, onPoolClick }) => {
  return (
    <div className="relative w-full overflow-x-auto pb-4 sm:pb-6 pt-2 -mx-2">
      <div className="flex gap-4 sm:gap-6 px-2 min-w-full">
        {pools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} onJoin={onJoin} onPoolClick={onPoolClick} />
        ))}
        <div className="min-w-[16px] sm:min-w-[24px]" />
      </div>
    </div>
  );
};

export default PoolCarousel;
import React from 'react';
import { motion } from 'framer-motion';
import type { DisplayPool } from '../types/database';
import { Users, Calendar, ArrowUpRight, Lock, Plus } from 'lucide-react';

interface PoolCarouselProps {
  pools: DisplayPool[];
  onJoin?: () => void;
  onPoolClick?: (poolId: string) => void;
}

const PoolCard: React.FC<{ pool: DisplayPool; onJoin?: () => void; onPoolClick?: (poolId: string) => void }> = ({ pool, onJoin, onPoolClick }) => {
  const expectedTotal = pool.members_count * pool.contribution_amount;
  const progressPercent = expectedTotal > 0
    ? Math.min(100, Math.max(0, (pool.current_pool_value / expectedTotal) * 100))
    : 0;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPoolClick?.(pool.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPoolClick?.(pool.id); } }}
      role="button"
      tabIndex={0}
      className="min-w-[260px] sm:min-w-[300px] md:min-w-0 h-[320px] sm:h-[380px] md:h-auto md:min-h-[380px] relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-white p-5 sm:p-7 flex flex-col justify-between group cursor-pointer border border-[#FFDDD2] warm-shadow transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-[#FFDDD2] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-[#83C5BE] rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-[#EDF6F9] flex items-center justify-center border border-[#FFDDD2] shadow-sm">
            <img src={`https://picsum.photos/seed/${pool.id}/64`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl opacity-90" alt="pool" loading="lazy" />
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl glass border border-white group-hover:bg-[#E29578] group-hover:text-white transition-all text-[#006D77]">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="flex items-center mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white ${
              pool.game_type === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'
            }`}
          >
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/20 flex items-center justify-center text-[6px] sm:text-[7px] font-black leading-none">
              {pool.game_type === 'powerball' ? 'PB' : 'MM'}
            </span>
            {pool.game_type === 'powerball' ? 'Powerball' : 'Mega Millions'}
            <Lock size={8} className="opacity-60" />
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1 text-[#006D77] leading-tight">
          {pool.name}
        </h3>
        {pool.total_jackpot > 0 ? (
          <>
            <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-extrabold uppercase tracking-widest mt-1">Est. Jackpot</p>
            <p className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter mt-2">
              ${(pool.total_jackpot / 1000000).toFixed(0)}M
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-extrabold uppercase tracking-widest mt-1">Next Draw</p>
            <p className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight mt-2">
              {new Date(pool.draw_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </>
        )}
      </div>

      <div className="relative z-10 space-y-4 sm:space-y-5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Pool contribution progress"
          className="h-[3px] w-full bg-[#EDF6F9] overflow-hidden rounded-full"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.5, delay: 0.5 }}
            style={{ width: `${Math.max(progressPercent, 2)}%` }}
            className="h-full bg-gradient-to-r from-[#E29578] to-[#FFDDD2]"
          />
        </div>
        
        <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users size={14} />
            <span>{pool.members_count} Players</span>
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
          {pool.contribution_amount > 0 ? `Join Pool $${pool.contribution_amount}` : 'View Pool'}
        </button>
      </div>
    </motion.div>
  );
};

const PoolCarousel: React.FC<PoolCarouselProps> = ({ pools, onJoin, onPoolClick }) => {
  const activePools = pools.filter((p) => p.status !== 'archived');

  if (activePools.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-[#FFDDD2] text-center space-y-3 mx-2">
        <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#83C5BE] mx-auto">
          <Plus size={24} />
        </div>
        <p className="text-sm font-black text-[#006D77]">No active pools</p>
        <p className="text-[10px] font-bold text-[#83C5BE]">Create or join a pool to start playing together.</p>
        <button
          onClick={() => onJoin?.()}
          className="mt-2 px-6 py-3 rounded-2xl bg-[#E29578] text-white font-black text-xs shadow-lg shadow-[#FFDDD2] hover:bg-[#006D77] transition-all"
        >
          Join a Pool
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal scroll carousel */}
      <div className="md:hidden relative w-full overflow-x-auto pb-4 sm:pb-6 pt-2 -mx-2">
        <div className="flex gap-4 sm:gap-6 px-2 min-w-full">
          {activePools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} onJoin={onJoin} onPoolClick={onPoolClick} />
          ))}
          <div className="min-w-[16px] sm:min-w-[24px]" />
        </div>
      </div>
      {/* Desktop: grid layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {activePools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} onJoin={onJoin} onPoolClick={onPoolClick} />
        ))}
      </div>
    </>
  );
};

export default PoolCarousel;
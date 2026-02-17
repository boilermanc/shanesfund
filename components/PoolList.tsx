import React from 'react';
import { motion } from 'framer-motion';
import type { DisplayPool } from '../types/database';
import { Users, Calendar, ArrowRight, Lock, Archive } from 'lucide-react';

interface PoolListProps {
  pools: DisplayPool[];
  onJoin?: (pool: DisplayPool) => void;
  onSelectPool?: (pool: DisplayPool) => void;
}

const PoolCard: React.FC<{ pool: DisplayPool; isArchived?: boolean; onJoin?: (pool: DisplayPool) => void; onSelectPool?: (pool: DisplayPool) => void }> = ({ pool, isArchived, onJoin, onSelectPool }) => {
  const expectedTotal = pool.members_count * pool.contribution_amount;
  const progress = expectedTotal > 0
    ? Math.min(100, Math.max(0, (pool.current_pool_value / expectedTotal) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 mb-3 sm:mb-4 md:mb-0 border border-[#FFDDD2] warm-shadow flex flex-col gap-3 sm:gap-4 relative group ${isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight group-hover:text-[#E29578] transition-colors truncate">
              {pool.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white shrink-0 ${
                pool.game_type === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'
              }`}
            >
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/20 flex items-center justify-center text-[6px] sm:text-[7px] font-black leading-none">
                {pool.game_type === 'powerball' ? 'PB' : 'MM'}
              </span>
              {pool.game_type === 'powerball' ? 'Powerball' : 'Mega Millions'}
              <Lock size={8} className="opacity-60" />
            </span>
            {isArchived && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pool.total_jackpot > 0 ? (
              <>
                <p className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-widest">Jackpot</p>
                <p className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">${(pool.total_jackpot / 1000000).toFixed(0)}M</p>
              </>
            ) : (
              <>
                <Users size={12} className="text-[#83C5BE]" />
                <p className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-widest">{pool.members_count} Members</p>
                <span className="text-[#FFDDD2]">&middot;</span>
                <p className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-widest">${pool.contribution_amount}/draw</p>
              </>
            )}
          </div>
        </div>
        <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#E29578] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#FFDDD2] shrink-0">
          Draw {new Date(pool.draw_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex justify-between items-end">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">Pool Collected</p>
          <p className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-widest">
            ${pool.current_pool_value} / ${expectedTotal}
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
        onClick={() => (onSelectPool || onJoin)?.(pool)}
        className="w-full mt-1 sm:mt-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#83C5BE]/20 transition-all border border-[#83C5BE]/10"
      >
        {isArchived ? 'View History' : 'Manage Pool'} <ArrowRight size={12} />
      </button>
    </motion.div>
  );
};

const PoolList: React.FC<PoolListProps> = ({ pools, onJoin, onSelectPool }) => {
  const activePools = pools.filter((p) => p.status !== 'archived');
  const archivedPools = pools.filter((p) => p.status === 'archived');

  return (
    <div className="pb-6 sm:pb-8 space-y-6">
      {/* Active pools */}
      {activePools.length === 0 ? (
        <div className="bg-white p-8 rounded-[2rem] border border-[#FFDDD2] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#83C5BE] mx-auto">
            <Users size={24} />
          </div>
          <p className="text-sm font-black text-[#006D77]">No pools yet</p>
          <p className="text-[10px] font-bold text-[#83C5BE]">Create or join a pool to start playing together.</p>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-4 lg:gap-6">
          {activePools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} onJoin={onJoin} onSelectPool={onSelectPool} />
          ))}
        </div>
      )}

      {/* Archived pools section */}
      {archivedPools.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Archive size={16} className="text-gray-400" />
            <h4 className="text-sm sm:text-base font-black text-gray-400">Archived</h4>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-4 lg:gap-6">
            {archivedPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} isArchived onJoin={onJoin} onSelectPool={onSelectPool} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolList;

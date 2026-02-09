import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Info, TrendingUp, DollarSign, Target, X, Calendar, Ticket, Star, Edit3, Check, BarChart3 } from 'lucide-react';
import { useInsights } from '../hooks/useInsights';
import { updateSavingsGoal } from '../services/insights';
import type { MonthlyWinning, WinningTicketDetail, PoolStat } from '../services/insights';
import { useStore } from '../store/useStore';

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ProgressGauge: React.FC<{ percentage: number; goal: string; label: string; onEdit: () => void }> = ({ percentage, goal, label, onEdit }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-4 sm:py-6">
      <svg className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#83C5BE"
          strokeWidth="10"
          fill="transparent"
          className="opacity-20"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#E29578"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">{Math.round(clamped)}%</span>
        <span className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mt-1">to Goal</span>
      </div>
      <div className="mt-4 sm:mt-6 flex items-center gap-2 group cursor-pointer relative" onClick={onEdit}>
        <p className="text-xs sm:text-sm font-bold text-[#006D77]">{label}: <span className="font-black">{goal}</span></p>
        <div className="p-1 rounded-full bg-[#EDF6F9] text-[#83C5BE] group-hover:text-[#E29578] transition-colors">
          <Edit3 size={12} />
        </div>
      </div>
    </div>
  );
};

const SetGoalPrompt: React.FC<{ onSave: (amount: number) => void }> = ({ onSave }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const amount = parseFloat(value);
    if (amount > 0) {
      onSave(amount);
    }
  };

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-4">
      <Target size={32} className="text-[#83C5BE] mb-3" />
      <h3 className="text-sm sm:text-base font-black text-[#006D77] tracking-tight mb-1">Set a Savings Goal</h3>
      <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] uppercase tracking-widest mb-6">Track your progress toward a target</p>
      <div className="flex items-center gap-2 w-full max-w-[200px]">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#83C5BE]">$</span>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="2,000"
            className="w-full pl-7 pr-3 py-3 text-sm font-black text-[#006D77] bg-white border border-[#FFDDD2] rounded-xl sm:rounded-2xl focus:outline-none focus:border-[#83C5BE] placeholder:text-[#83C5BE]/40"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value || parseFloat(value) <= 0}
          className="p-3 bg-[#006D77] text-white rounded-xl sm:rounded-2xl shadow-sm disabled:opacity-40"
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};

const EditGoalModal: React.FC<{ currentGoal: number; onSave: (amount: number) => void; onClose: () => void }> = ({ currentGoal, onSave, onClose }) => {
  const [value, setValue] = useState(currentGoal.toString());

  const handleSave = () => {
    const amount = parseFloat(value);
    if (amount > 0) {
      onSave(amount);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xs bg-[#EDF6F9] rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 border border-[#FFDDD2] warm-shadow"
      >
        <h2 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tighter mb-4">Edit Goal</h2>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#83C5BE]">$</span>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full pl-8 pr-4 py-3 text-sm font-black text-[#006D77] bg-white border border-[#FFDDD2] rounded-xl sm:rounded-2xl focus:outline-none focus:border-[#83C5BE]"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] sm:text-xs font-black text-[#006D77] uppercase tracking-widest bg-white rounded-xl sm:rounded-2xl border border-[#FFDDD2]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!value || parseFloat(value) <= 0}
            className="flex-1 py-3 text-[10px] sm:text-xs font-black text-white uppercase tracking-widest bg-[#006D77] rounded-xl sm:rounded-2xl shadow-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BarChart: React.FC<{ data: MonthlyWinning[]; onBarClick: (month: string) => void }> = ({ data, onBarClick }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight flex items-center gap-2">
          <TrendingUp size={18} className="text-[#83C5BE]" />
          Winning Trends
        </h3>
        {data.some(d => d.value > 0) && (
          <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Tap bars for details</p>
        )}
      </div>
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-[#FFDDD2] warm-shadow flex flex-col gap-4 sm:gap-6">
        {data.some(d => d.value > 0) ? (
          <div className="flex items-end justify-between h-32 sm:h-40 md:h-56 px-2">
            {data.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 flex-1 group cursor-pointer" onClick={() => item.value > 0 && onBarClick(item.label)}>
                <div className="relative w-full flex justify-center items-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: item.value > 0 ? `${(item.value / maxValue) * 100}%` : '2px' }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className={`w-8 sm:w-10 md:w-14 rounded-t-xl sm:rounded-t-2xl shadow-sm group-hover:brightness-110 transition-all ${
                      item.value === maxValue && item.value > 0 ? 'bg-[#E29578]' : item.value > 0 ? 'bg-[#83C5BE]' : 'bg-[#83C5BE]/20'
                    }`}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-[#006D77] uppercase tracking-wider group-hover:text-[#E29578] transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10 opacity-50">
            <BarChart3 size={28} className="mx-auto text-[#83C5BE] mb-2" />
            <p className="text-[10px] sm:text-xs font-black text-[#83C5BE] uppercase tracking-widest">No winning data yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface WinningTicket {
  game: string;
  date: string;
  prize: string;
  numbers: number[];
  bonus: number;
}

const WinningTicketsModal: React.FC<{ month: string; tickets: WinningTicket[]; onClose: () => void }> = ({ month, tickets, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-[#EDF6F9] rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 border border-[#FFDDD2] warm-shadow max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#006D77] tracking-tighter">{month} Winnings</h2>
            <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1">Syndicate Results</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl sm:rounded-2xl bg-white text-[#006D77] shadow-sm">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket, i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578]">
                      <Trophy size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-black text-[#006D77] leading-none">{ticket.game}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] uppercase mt-1">{ticket.date}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-[#E29578]">{ticket.prize}</p>
                </div>
                <div className="flex gap-1 sm:gap-1.5 justify-center">
                  {ticket.numbers.map((n, idx) => (
                    <div key={idx} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#006D77]/5 border border-[#006D77]/10 flex items-center justify-center text-[8px] sm:text-[9px] font-black text-[#006D77]">
                      {n}
                    </div>
                  ))}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E29578] flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white">
                    {ticket.bonus}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 sm:py-12 opacity-50">
              <Ticket size={36} className="mx-auto text-[#83C5BE] mb-2" />
              <p className="text-[10px] sm:text-xs font-black text-[#83C5BE] uppercase tracking-widest">No major wins recorded</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 sm:mt-8 py-3 sm:py-4 bg-[#006D77] text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] rounded-[1.5rem] sm:rounded-[1.8rem] shadow-lg shadow-[#006D77]/20"
        >
          Close Report
        </button>
      </motion.div>
    </motion.div>
  );
};

const PoolTypeIcon: React.FC<{ type: 'power' | 'mega' }> = ({ type }) => {
  if (type === 'power') {
    return (
      <div className="w-4 h-4 rounded-full bg-[#E29578] flex items-center justify-center border border-white shadow-sm shrink-0">
        <span className="text-white text-[7px] font-black italic -ml-0.5">P</span>
      </div>
    );
  }
  return (
    <Star size={14} className="text-[#83C5BE] fill-[#83C5BE] shrink-0" />
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8 sm:space-y-12 pt-8 sm:pt-12 pb-32 md:pb-12 animate-pulse">
    <div className="text-center px-4">
      <div className="h-3 w-24 bg-[#83C5BE]/20 rounded-full mx-auto mb-4" />
      <div className="h-10 w-40 bg-[#006D77]/10 rounded-2xl mx-auto mb-2" />
      <div className="h-4 w-48 bg-[#83C5BE]/15 rounded-full mx-auto" />
    </div>
    <div className="flex justify-center">
      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[10px] border-[#83C5BE]/10" />
    </div>
    <div className="px-2">
      <div className="h-48 bg-white rounded-[2rem] border border-[#FFDDD2]" />
    </div>
    <div className="px-2">
      <div className="h-24 bg-white rounded-[2rem] border border-[#FFDDD2]" />
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 sm:py-28 px-6 text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-[#EDF6F9] flex items-center justify-center mb-4 sm:mb-6 border border-[#FFDDD2]">
      <TrendingUp size={28} className="text-[#83C5BE]" />
    </div>
    <h2 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight mb-2">No Insights Yet</h2>
    <p className="text-xs sm:text-sm font-bold text-[#83C5BE] max-w-[260px]">
      Join a pool and start playing to see your wealth insights, winning trends, and more.
    </p>
  </div>
);

const WealthInsights: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);

  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const { insights, loading } = useInsights(user?.id);

  const savingsGoal = (user as any)?.savings_goal as number | null;

  const handleSaveGoal = async (amount: number) => {
    if (!user) return;
    setEditingGoal(false);

    // Optimistic update
    setUser({ ...user, savings_goal: amount } as any);

    const { error } = await updateSavingsGoal(user.id, amount);
    if (error) {
      console.error('Failed to save goal:', error);
      // Revert on error
      setUser(user);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!insights || (insights.totalWinnings === 0 && insights.totalContributed === 0 && insights.poolStats.length === 0)) {
    // Still show goal setting even with no data, but only if user has pools
    if (insights && insights.monthlyWinnings.length > 0) {
      // User has pools but no winnings — fall through to main view
    } else {
      return <EmptyState />;
    }
  }

  const { totalWinnings, personalShare, totalContributed, monthlyWinnings, winningTickets, poolStats } = insights!;

  const profit = personalShare - totalContributed;
  const profitPct = totalContributed > 0 ? Math.round((profit / totalContributed) * 100) : 0;
  const goalPercentage = savingsGoal && savingsGoal > 0 ? (totalWinnings / savingsGoal) * 100 : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-8 sm:space-y-12 pt-8 sm:pt-12 pb-32 md:pb-12"
    >
      <AnimatePresence>
        {selectedMonth && (
          <WinningTicketsModal
            month={selectedMonth}
            tickets={winningTickets[selectedMonth] || []}
            onClose={() => setSelectedMonth(null)}
          />
        )}
        {editingGoal && savingsGoal != null && (
          <EditGoalModal
            currentGoal={savingsGoal}
            onSave={handleSaveGoal}
            onClose={() => setEditingGoal(false)}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-center px-4 md:max-w-2xl md:mx-auto">
        <h2 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-3 sm:mb-4">Wealth Insights</h2>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#006D77] tracking-tighter">{formatCurrency(totalWinnings)}</h1>
        <p className="text-xs sm:text-sm font-bold text-[#83C5BE] mt-2">Your Personal Share: <span className="text-[#006D77]">{formatCurrency(personalShare)}</span></p>
      </motion.section>

      {/* Goal Section */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        {savingsGoal != null ? (
          <ProgressGauge
            percentage={Math.round(goalPercentage)}
            goal={formatCurrency(savingsGoal)}
            label="Savings Goal"
            onEdit={() => setEditingGoal(true)}
          />
        ) : (
          <SetGoalPrompt onSave={handleSaveGoal} />
        )}
      </motion.section>

      {/* Performance Chart */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        <BarChart data={monthlyWinnings} onBarClick={(month) => setSelectedMonth(month)} />
      </motion.section>

      {/* ROI Section */}
      <motion.section
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        className="px-2"
      >
        <div className="rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden warm-shadow border border-[#FFDDD2] bg-white">
          <div className="flex divide-x divide-[#FFDDD2]">
            <div className="flex-1 p-5 sm:p-8 bg-[#EDF6F9]/50">
              <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-1">Total Contributed</p>
              <p className="text-lg sm:text-xl font-black text-[#006D77]">{formatCurrency(totalContributed)}</p>
            </div>
            <div className="flex-1 p-5 sm:p-8 bg-[#EDF6F9]/50">
              <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-1">Total Returns</p>
              <p className="text-lg sm:text-xl font-black text-[#006D77]">{formatCurrency(personalShare)}</p>
            </div>
          </div>
          <div className={`py-2.5 sm:py-3 text-center ${profit >= 0 ? 'bg-[#E29578]' : 'bg-[#006D77]'}`}>
            <p className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              {profit >= 0 ? 'Profit' : 'Loss'}: {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({profitPct}%)
            </p>
          </div>
        </div>
      </motion.section>

      {/* Luckiest Pools */}
      {poolStats.length > 0 && (
        <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight px-2 flex items-center gap-2">
            <Target size={18} className="text-[#83C5BE]" />
            Luckiest Pools
          </h3>
          <div className="space-y-3 sm:space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {poolStats.map((pool, idx) => {
              const winRate = pool.ticketCount > 0 ? Math.round((pool.winCount / pool.ticketCount) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between warm-shadow group hover:border-[#83C5BE] transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578] border border-[#FFDDD2]">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-[#006D77] group-hover:translate-x-1 transition-transform">{pool.name}</h4>
                        <PoolTypeIcon type={pool.gameType === 'powerball' ? 'power' : 'mega'} />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">{winRate}% Success Rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-black text-[#83C5BE]">{formatCurrency(pool.totalWins)} won</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default WealthInsights;

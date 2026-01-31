
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Info, TrendingUp, DollarSign, Target, X, Calendar, Ticket, Star } from 'lucide-react';

const ProgressGauge: React.FC<{ percentage: number; goal: string; label: string }> = ({ percentage, goal, label }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <svg className="w-48 h-48 transform -rotate-90">
        {/* Background Ring */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#83C5BE"
          strokeWidth="12"
          fill="transparent"
          className="opacity-20"
        />
        {/* Indicator Ring */}
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#E29578"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-3xl font-black text-[#006D77] tracking-tighter">{percentage}%</span>
        <span className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mt-1">to Goal</span>
      </div>
      <div className="mt-6 flex items-center gap-2 group cursor-help relative">
        <p className="text-sm font-bold text-[#006D77]">{label}: <span className="font-black">{goal}</span></p>
        <div className="p-1 rounded-full bg-[#EDF6F9] text-[#83C5BE]">
          <Info size={14} />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#006D77] text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-bold uppercase tracking-wider shadow-lg">
          Based on current winning trends
        </div>
      </div>
    </div>
  );
};

const BarChart: React.FC<{ onBarClick: (month: string) => void }> = ({ onBarClick }) => {
  const data = [
    { label: 'Oct', value: 120 },
    { label: 'Nov', value: 250 },
    { label: 'Dec', value: 180 },
    { label: 'Jan', value: 420 }, // Tallest - Tangerine
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-black text-[#006D77] tracking-tight flex items-center gap-2">
          <TrendingUp size={20} className="text-[#83C5BE]" />
          Winning Trends
        </h3>
        <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Tap bars for details</p>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 border border-[#FFDDD2] warm-shadow flex flex-col gap-6">
        <div className="flex items-end justify-between h-40 px-2">
          {data.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3 flex-1 group cursor-pointer" onClick={() => onBarClick(item.label)}>
              <div className="relative w-full flex justify-center items-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                  className={`w-10 rounded-t-2xl shadow-sm group-hover:brightness-110 transition-all ${
                    item.value === maxValue ? 'bg-[#E29578]' : 'bg-[#83C5BE]'
                  }`}
                />
              </div>
              <span className="text-xs font-black text-[#006D77] uppercase tracking-wider group-hover:text-[#E29578] transition-colors">{item.label}</span>
            </div>
          ))}
        </div>
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
      className="fixed inset-0 z-[600] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-[#EDF6F9] rounded-[3rem] p-8 border border-[#FFDDD2] warm-shadow max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-[#006D77] tracking-tighter">{month} Winnings</h2>
            <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em] mt-1">Syndicate Results</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl bg-white text-[#006D77] shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket, i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border border-[#FFDDD2] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578]">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#006D77] leading-none">{ticket.game}</p>
                      <p className="text-[9px] font-bold text-[#83C5BE] uppercase mt-1">{ticket.date}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#E29578]">{ticket.prize}</p>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {ticket.numbers.map((n, idx) => (
                    <div key={idx} className="w-7 h-7 rounded-full bg-[#006D77]/5 border border-[#006D77]/10 flex items-center justify-center text-[9px] font-black text-[#006D77]">
                      {n}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-[#E29578] flex items-center justify-center text-[9px] font-black text-white">
                    {ticket.bonus}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 opacity-50">
              <Ticket size={40} className="mx-auto text-[#83C5BE] mb-2" />
              <p className="text-xs font-black text-[#83C5BE] uppercase tracking-widest">No major wins recorded</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-[#006D77] text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.8rem] shadow-lg shadow-[#006D77]/20"
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

const WealthInsights: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const mockWinnings: Record<string, WinningTicket[]> = {
    'Oct': [
      { game: 'Mega Millions', date: 'Oct 12', prize: '$120.00', numbers: [4, 15, 22, 31, 40], bonus: 12 },
    ],
    'Nov': [
      { game: 'Powerball', date: 'Nov 04', prize: '$150.00', numbers: [1, 10, 24, 38, 55], bonus: 7 },
      { game: 'Mega Millions', date: 'Nov 19', prize: '$100.00', numbers: [9, 11, 28, 41, 52], bonus: 18 },
    ],
    'Dec': [
      { game: 'Powerball', date: 'Dec 24', prize: '$180.00', numbers: [5, 18, 33, 42, 60], bonus: 14 },
    ],
    'Jan': [
      { game: 'Powerball', date: 'Jan 15', prize: '$240.00', numbers: [12, 24, 31, 48, 59], bonus: 15 },
      { game: 'Mega Millions', date: 'Jan 27', prize: '$180.00', numbers: [5, 18, 29, 34, 62], bonus: 7 },
    ],
  };

  const luckyPools = [
    { name: 'The Office Syndicate', wins: '$850.00', rate: '15%', type: 'mega' as const },
    { name: 'Powerball High Rollers', wins: '$340.50', rate: '8%', type: 'power' as const },
    { name: 'Weekly Retirement Goal', wins: '$50.00', rate: '22%', type: 'mega' as const },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-12 pt-12 pb-32"
    >
      <AnimatePresence>
        {selectedMonth && (
          <WinningTicketsModal
            month={selectedMonth}
            tickets={mockWinnings[selectedMonth] || []}
            onClose={() => setSelectedMonth(null)}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.section variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-center px-4">
        <h2 className="text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.4em] mb-4">Wealth Insights</h2>
        <h1 className="text-5xl font-black text-[#006D77] tracking-tighter">$1,240.50</h1>
        <p className="text-sm font-bold text-[#83C5BE] mt-2">Your Personal Share: <span className="text-[#006D77]">$248.10</span></p>
      </motion.section>

      {/* Progress Section */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        <ProgressGauge percentage={12} goal="$2,000" label="Group Vacation Goal" />
      </motion.section>

      {/* Performance Chart */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        <BarChart onBarClick={(month) => setSelectedMonth(month)} />
      </motion.section>

      {/* ROI ROI ROI */}
      <motion.section 
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        className="px-2"
      >
        <div className="rounded-[2.5rem] overflow-hidden warm-shadow border border-[#FFDDD2] bg-white">
          <div className="flex divide-x divide-[#FFDDD2]">
            <div className="flex-1 p-8 bg-[#EDF6F9]/50">
              <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-1">Total Contributed</p>
              <p className="text-xl font-black text-[#006D77]">$40.00</p>
            </div>
            <div className="flex-1 p-8 bg-[#EDF6F9]/50">
              <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-1">Total Returns</p>
              <p className="text-xl font-black text-[#006D77]">$248.10</p>
            </div>
          </div>
          <div className="bg-[#E29578] py-3 text-center">
            <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
              Profit: +$208.10 (520%)
            </p>
          </div>
        </div>
      </motion.section>

      {/* Luckiest Pools */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="space-y-6">
        <h3 className="text-lg font-black text-[#006D77] tracking-tight px-2 flex items-center gap-2">
          <Target size={20} className="text-[#83C5BE]" />
          Luckiest Pools
        </h3>
        <div className="space-y-4">
          {luckyPools.map((pool, idx) => (
            <div 
              key={idx} 
              className="bg-white p-5 rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between warm-shadow group hover:border-[#83C5BE] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578] border border-[#FFDDD2]">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[#006D77] group-hover:translate-x-1 transition-transform">{pool.name}</h4>
                    <PoolTypeIcon type={pool.type} />
                  </div>
                  <p className="text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">{pool.rate} Success Rate</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#83C5BE]">{pool.wins} won</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default WealthInsights;

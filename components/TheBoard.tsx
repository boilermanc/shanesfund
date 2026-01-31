import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Calendar, ChevronRight, Zap, Star, ArrowRight } from 'lucide-react';

interface TheBoardProps {
  onOpenPool?: (poolId: string) => void;
}

const Ball: React.FC<{ number: number; isBonus?: boolean; isMatched?: boolean }> = ({ number, isBonus, isMatched }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: 1, 
      opacity: 1,
      backgroundColor: isMatched ? '#E29578' : (isBonus ? '#E29578' : '#006D77')
    }}
    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
    className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg border border-white/20 overflow-hidden`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none" />
    <div className="absolute top-1 left-1.5 sm:left-2 w-2 h-2 sm:w-3 sm:h-3 bg-white/40 rounded-full blur-[2px] pointer-events-none" />
    <span className="relative z-10">{number}</span>
  </motion.div>
);

const GameLogo: React.FC<{ game: string }> = ({ game }) => {
  if (game.toLowerCase().includes('powerball')) {
    return (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#E29578] flex items-center justify-center border-2 border-white shadow-md relative overflow-hidden group-hover:scale-110 transition-transform">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/20" />
        <span className="text-white font-black text-lg sm:text-xl italic tracking-tighter relative z-10">P</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#83C5BE] flex items-center justify-center border-2 border-white shadow-md relative overflow-hidden group-hover:scale-110 transition-transform">
      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/20" />
      <Star size={20} className="text-white fill-white relative z-10 sm:hidden" />
      <Star size={24} className="text-white fill-white relative z-10 hidden sm:block" />
    </div>
  );
};

const GameCard: React.FC<{ 
  game: string; 
  date: string; 
  jackpot: string; 
  numbers: number[]; 
  bonus: number;
  isScanning?: boolean;
  showMatch?: boolean;
  onClick?: () => void;
}> = ({ game, date, jackpot, numbers, bonus, isScanning, showMatch, onClick }) => (
  <motion.div
    variants={{
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }}
    onClick={onClick}
    className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border border-[#83C5BE]/30 warm-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
  >
    <div className="flex justify-between items-start mb-4 sm:mb-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <GameLogo game={game} />
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">{game}</h3>
          <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest leading-none mt-0.5">Official Result</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">{date}</p>
        <div className="flex items-center gap-1 text-[#E29578] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter">Manage Pool</span>
          <ArrowRight size={10} />
        </div>
      </div>
    </div>

    <div className="text-center mb-6 sm:mb-8">
      <motion.p 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-3xl sm:text-4xl font-black text-[#E29578] tracking-tighter"
      >
        {jackpot}
      </motion.p>
      <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">Estimated Jackpot</p>
    </div>

    <div className="relative">
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-2">
        {numbers.map((n, i) => (
          <div key={i} className="relative">
            <Ball number={n} isMatched={showMatch && i === 2} />
            <AnimatePresence>
              {showMatch && i === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: -25, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"
                >
                  <div className="bg-[#E29578] px-2 sm:px-3 py-1 rounded-full shadow-lg border-2 border-white">
                    <span className="text-[7px] sm:text-[8px] font-black text-white uppercase tracking-tighter">MATCH!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        <Ball number={bonus} isBonus />
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ left: '-10%' }}
            animate={{ left: '110%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] bottom-[-10%] w-1 bg-[#83C5BE] shadow-[0_0_15px_#83C5BE] z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

const TheBoard: React.FC<TheBoardProps> = ({ onOpenPool }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const handleCheckTickets = () => {
    setIsChecking(true);
    setShowMatch(false);
    
    setTimeout(() => {
      setShowMatch(true);
    }, 1200);

    setTimeout(() => {
      setIsChecking(false);
    }, 3000);
  };

  const history = [
    { id: '1', date: 'Jan 27', numbers: [4, 12, 28, 31, 56], bonus: 12, prize: '$1,250' },
    { id: '2', date: 'Jan 24', numbers: [9, 15, 22, 40, 61], bonus: 5, prize: '$50' },
    { id: '3', date: 'Jan 20', numbers: [2, 18, 33, 45, 50], bonus: 18, prize: '$0' },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.15 } }
      }}
      className="space-y-8 sm:space-y-10 pt-8 sm:pt-12 pb-32"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="px-2">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#006D77]">The Board</h2>
        <p className="text-xs sm:text-sm font-bold text-[#83C5BE] mt-1">Draws updated in real-time</p>
      </motion.div>

      {/* Featured Cards */}
      <div className="space-y-4 sm:space-y-6">
        <GameCard 
          game="Powerball"
          date="Friday, Jan 30"
          jackpot="$450 MILLION"
          numbers={[12, 24, 31, 48, 59]}
          bonus={15}
          isScanning={isChecking}
          showMatch={showMatch}
          onClick={() => onOpenPool?.('2')}
        />

        {/* Check My Tickets Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckTickets}
          className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-[#83C5BE]/20 flex items-center justify-center gap-2 sm:gap-3"
        >
          <Search size={18} strokeWidth={3} />
          {isChecking ? 'Checking Syndicate Tickets...' : "Check My Pool's Tickets"}
        </motion.button>

        <GameCard 
          game="Mega Millions"
          date="Tuesday, Jan 27"
          jackpot="$182 MILLION"
          numbers={[5, 18, 29, 34, 62]}
          bonus={7}
          isScanning={isChecking}
          showMatch={showMatch}
          onClick={() => onOpenPool?.('1')}
        />
      </div>

      {/* History Section */}
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight ml-2">Recent History</h3>
        <div className="space-y-3 sm:space-y-4">
          {history.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => onOpenPool?.(item.id)}
              className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">{item.date}</span>
                <div className="flex gap-1 sm:gap-1.5 mt-1">
                  {item.numbers.map((n, i) => (
                    <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EDF6F9] border border-[#FFDDD2] flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-[#006D77]">
                      {n}
                    </div>
                  ))}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FFDDD2] flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-[#E29578]">
                    {item.bonus}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-black text-[#83C5BE]">
                  Won: <span className="text-[#006D77]">{item.prize}</span>
                </p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-[7px] sm:text-[8px] font-black text-[#83C5BE] uppercase tracking-widest">Office Pool</span>
                  <ChevronRight size={12} className="text-[#83C5BE]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default TheBoard;
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, DollarSign, ArrowRight } from 'lucide-react';
import FocusTrap from './FocusTrap';

interface WinningMomentProps {
  onClose: () => void;
}

const WinningMoment: React.FC<WinningMomentProps> = ({ onClose }) => {
  useEffect(() => {
    if (typeof window.confetti === 'function') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 300 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: ReturnType<typeof setInterval> = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        window.confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#E29578', '#006D77', '#83C5BE', '#FFDDD2']
        }));
        window.confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#E29578', '#006D77', '#83C5BE', '#FFDDD2']
        }));
      }, 300);
      
      return () => clearInterval(interval);
    }
  }, []);

  const winners = [
    { name: 'Shane M.', share: 12450.50, avatar: 'https://picsum.photos/seed/shane/80' },
    { name: 'Sarah L.', share: 8200.00, avatar: 'https://picsum.photos/seed/sarah/80' },
    { name: 'Mike R.', share: 4500.25, avatar: 'https://picsum.photos/seed/mike/80' },
    { name: 'Alice W.', share: 3100.10, avatar: 'https://picsum.photos/seed/alice/80' },
  ];

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-[#EDF6F9]/95 backdrop-blur-lg flex flex-col overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Jackpot win"
      >
      <div className="flex-1 flex flex-col items-center pt-12 sm:pt-20 px-5 sm:px-7 pb-16 sm:pb-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] flex items-center justify-center shadow-2xl shadow-[#FFDDD2] mb-6 sm:mb-10"
        >
          <Trophy size={56} className="text-white sm:hidden" />
          <Trophy size={72} className="text-white hidden sm:block" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl sm:text-5xl font-black text-center text-[#006D77] tracking-tighter mb-3 sm:mb-4"
        >
          JACKPOT HIT!
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#83C5BE] font-bold text-center mb-8 sm:mb-12 max-w-xs uppercase tracking-widest text-xs sm:text-sm"
        >
          Total Pool Prize Claimed: <span className="text-[#E29578] block text-xl sm:text-2xl mt-2">$28,250.85</span>
        </motion.p>

        <div className="w-full space-y-3 sm:space-y-5">
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[10px] sm:text-[11px] text-[#006D77] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center mb-5 sm:mb-8"
          >
            Wealth Distribution
          </motion.h3>
          
          <AnimatePresence>
            {winners.map((winner, i) => (
              <motion.div
                key={winner.name}
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (i * 0.12), type: 'spring', bounce: 0.4 }}
                className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] flex justify-between items-center warm-shadow border border-[#FFDDD2]"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] p-0.5">
                    <img src={winner.avatar} className="w-full h-full rounded-xl sm:rounded-2xl object-cover border-2 border-white shadow-sm" alt="" loading="lazy" />
                  </div>
                  <p className="font-black text-[#006D77] text-xs sm:text-sm">{winner.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base text-[#E29578] font-black tracking-tight">+${winner.share.toLocaleString()}</p>
                  <p className="text-[8px] sm:text-[9px] text-[#83C5BE] font-black uppercase tracking-widest">Available Now</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          onClick={onClose}
          className="mt-8 sm:mt-12 w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg shadow-xl shadow-[#83C5BE] group flex items-center justify-center gap-2 sm:gap-3"
        >
          COLLECT EQUITY
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
      </motion.div>
    </FocusTrap>
  );
};

export default WinningMoment;
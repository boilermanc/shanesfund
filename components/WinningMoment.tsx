
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, DollarSign, ArrowRight } from 'lucide-react';

interface WinningMomentProps {
  onClose: () => void;
}

const WinningMoment: React.FC<WinningMomentProps> = ({ onClose }) => {
  useEffect(() => {
    if (typeof (window as any).confetti === 'function') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 300 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        (window as any).confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#E29578', '#006D77', '#83C5BE', '#FFDDD2']
        }));
        (window as any).confetti(Object.assign({}, defaults, { 
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[#EDF6F9]/95 backdrop-blur-lg flex flex-col overflow-y-auto"
    >
      <div className="flex-1 flex flex-col items-center pt-20 px-7 pb-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}
          className="w-36 h-36 rounded-[2.5rem] bg-[#E29578] flex items-center justify-center shadow-2xl shadow-[#FFDDD2] mb-10"
        >
          <Trophy size={72} className="text-white" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-black text-center text-[#006D77] tracking-tighter mb-4"
        >
          JACKPOT HIT!
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#83C5BE] font-bold text-center mb-12 max-w-xs uppercase tracking-widest text-sm"
        >
          Total Pool Prize Claimed: <span className="text-[#E29578] block text-2xl mt-2">$28,250.85</span>
        </motion.p>

        <div className="w-full space-y-5">
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[11px] text-[#006D77] font-black uppercase tracking-[0.4em] text-center mb-8"
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
                className="bg-white p-5 rounded-[2rem] flex justify-between items-center warm-shadow border border-[#FFDDD2]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] p-0.5">
                    <img src={winner.avatar} className="w-full h-full rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                  </div>
                  <p className="font-black text-[#006D77] text-sm">{winner.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-base text-[#E29578] font-black tracking-tight">+${winner.share.toLocaleString()}</p>
                  <p className="text-[9px] text-[#83C5BE] font-black uppercase tracking-widest">Available Now</p>
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
          className="mt-12 w-full py-5 rounded-[2.5rem] bg-[#006D77] text-white font-black text-lg shadow-xl shadow-[#83C5BE] group flex items-center justify-center gap-3"
        >
          COLLECT EQUITY
          <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default WinningMoment;

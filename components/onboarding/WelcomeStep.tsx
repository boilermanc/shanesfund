import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import ShaneMascot from '../ShaneMascot';

interface WelcomeStepProps {
  onNext: () => void;
}

const valueProps = [
  { icon: Users, text: 'Pool money with friends to buy more tickets' },
  { icon: Sparkles, text: 'Smart OCR scanning reads your tickets instantly' },
  { icon: Trophy, text: 'Real-time results and automatic win detection' },
];

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
      <div className="scale-75 sm:scale-100">
        <ShaneMascot size="xl" expression="excited" animate />
      </div>

      <h1 className="shane-serif text-3xl sm:text-4xl font-black text-[#4A5D4E] tracking-tighter mt-6 sm:mt-8 leading-tight">
        Welcome to<br />Shane's Fund!
      </h1>

      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 w-full max-w-[320px]">
        {valueProps.map((prop, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-start gap-3 text-left"
          >
            <div className="p-2.5 rounded-xl bg-[#EDF6F9] text-[#006D77] shrink-0">
              <prop.icon size={18} strokeWidth={2.5} />
            </div>
            <p className="text-sm sm:text-base font-bold text-[#006D77] leading-snug pt-0.5">
              {prop.text}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-auto pt-8 w-full"
      >
        <button
          onClick={onNext}
          className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 warm-shadow btn-shimmer active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(226,149,120,0.5)]"
        >
          Let's Get Started
          <ArrowRight size={22} strokeWidth={3} />
        </button>
      </motion.div>
    </div>
  );
};

export default WelcomeStep;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Coins, Users, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import ShaneMascot from './ShaneMascot';

const Onboarding: React.FC = () => {
  const { setOnboarded } = useStore();
  const [step, setStep] = useState(0);

  const hints = [
    "Welcome to my fund! We're going to retire early, together.",
    "Pool your money with friends to buy more tickets and boost your odds!",
    "I'll even scan your tickets for you using my smart OCR lens."
  ];

  const expressions: Array<'excited' | 'confident' | 'thoughtful'> = ['excited', 'confident', 'thoughtful'];

  const handleNext = () => {
    if (step < hints.length - 1) {
      setStep(step + 1);
    } else {
      setOnboarded(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-gradient-to-b from-[#F2E9D4] to-[#83C5BE]/30 flex flex-col px-6 py-8 overflow-y-auto"
    >
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-[#FFDDD2]/40 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 min-h-0">
        <motion.div
          key={step}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6 flex flex-col items-center"
        >
          <div className="scale-75 sm:scale-100">
            <ShaneMascot size="xl" expression={expressions[step]} animate />
          </div>
          
          {/* Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-8 bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-[#FFDDD2] shadow-xl max-w-[260px] sm:max-w-[280px] relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-white border-t border-l border-[#FFDDD2] rotate-45" />
            <p className="text-[#006D77] font-bold text-sm leading-relaxed">
              {hints[step]}
            </p>
          </motion.div>
        </motion.div>

        {/* Branding Info */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h1 className="shane-serif text-3xl sm:text-5xl font-black text-[#4A5D4E] tracking-tighter leading-[0.9]">
              Secure the Future.
            </h1>
          </motion.div>
        )}
      </div>

      <motion.div className="relative z-10 mt-auto pt-4">
        <button
          onClick={handleNext}
          className="w-full py-4 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 sm:gap-4 warm-shadow btn-shimmer active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(226,149,120,0.5)]"
        >
          {step === hints.length - 1 ? 'Start Winning' : 'Next Lesson'}
          <ArrowRight size={22} strokeWidth={3} />
        </button>
        
        <div className="flex justify-center gap-2 mt-6 pb-4">
          {hints.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-[#4A5D4E]' : 'w-2 bg-[#4A5D4E]/20'}`} 
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Onboarding;
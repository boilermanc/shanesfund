import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Camera, Trophy, ArrowRight } from 'lucide-react';
import ShaneMascot from '../ShaneMascot';

interface FeaturesStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Plus,
    title: 'Create a Pool',
    desc: 'Start a group, invite friends, and set contribution amounts',
  },
  {
    icon: Camera,
    title: 'Scan Tickets',
    desc: 'Point your camera at any ticket and we read the numbers',
  },
  {
    icon: Trophy,
    title: 'Check Results',
    desc: 'We automatically check your tickets when draws happen',
  },
];

const FeaturesStep: React.FC<FeaturesStepProps> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col items-center text-center px-2">
      <div className="scale-75 sm:scale-100">
        <ShaneMascot size="sm" expression="happy" animate />
      </div>

      <h2 className="shane-serif text-2xl sm:text-3xl font-black text-[#4A5D4E] tracking-tighter mt-4 sm:mt-6">
        Here's how it works
      </h2>
      <p className="text-sm sm:text-base font-bold text-[#83C5BE] mt-1">
        Three simple steps to get started
      </p>

      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 w-full max-w-[360px]">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-start gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] text-left"
          >
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] shrink-0">
              <feature.icon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#006D77]">{feature.title}</h4>
              <p className="text-xs sm:text-sm font-bold text-[#83C5BE] leading-snug mt-0.5">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-auto pt-8 w-full"
      >
        <button
          onClick={onNext}
          className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 warm-shadow btn-shimmer active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(226,149,120,0.5)]"
        >
          Almost There!
          <ArrowRight size={22} strokeWidth={3} />
        </button>
      </motion.div>
    </div>
  );
};

export default FeaturesStep;

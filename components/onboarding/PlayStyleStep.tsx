import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Sparkles, Check } from 'lucide-react';
import ShaneMascot from '../ShaneMascot';

type PlayStyle = 'solo' | 'friends' | 'new';

interface PlayStyleStepProps {
  selected: PlayStyle | null;
  onSelect: (style: PlayStyle) => void;
  onNext: () => void;
}

const options = [
  { id: 'solo' as const, label: 'Solo Player', desc: 'I buy my own tickets', icon: User },
  { id: 'friends' as const, label: 'With Friends', desc: 'We pool money together', icon: Users },
  { id: 'new' as const, label: "I'm New", desc: 'Never played before', icon: Sparkles },
];

const PlayStyleStep: React.FC<PlayStyleStepProps> = ({ selected, onSelect, onNext }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (style: PlayStyle) => {
    onSelect(style);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onNext();
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center text-center px-2">
      <div className="scale-75 sm:scale-100">
        <ShaneMascot size="md" expression="thoughtful" animate />
      </div>

      <h2 className="shane-serif text-2xl sm:text-3xl font-black text-[#4A5D4E] tracking-tighter mt-4 sm:mt-6">
        How do you play?
      </h2>
      <p className="text-sm sm:text-base font-bold text-[#83C5BE] mt-1">
        Pick the one that sounds like you
      </p>

      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 w-full max-w-[360px]">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => handleSelect(opt.id)}
              className={`w-full p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left transition-all min-h-[44px] ${
                isSelected
                  ? 'border-[#006D77] bg-[#EDF6F9]'
                  : 'border-[#FFDDD2] bg-white hover:border-[#83C5BE]'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'bg-[#006D77] text-white' : 'bg-[#EDF6F9] text-[#006D77]'
                }`}>
                  {isSelected ? <Check size={18} strokeWidth={4} /> : <opt.icon size={20} />}
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-[#006D77]">{opt.label}</h4>
                  <p className="text-xs sm:text-sm font-bold text-[#83C5BE]">{opt.desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PlayStyleStep;

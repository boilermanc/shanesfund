import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Sparkles } from 'lucide-react';
import ShaneMascot from '../ShaneMascot';

type GameChoice = 'powerball' | 'megamillions' | 'both';

interface GamePickerStepProps {
  selected: GameChoice | null;
  onSelect: (game: GameChoice) => void;
  onNext: () => void;
}

const games = [
  {
    id: 'powerball' as const,
    name: 'Powerball',
    desc: 'Wed & Sat draws',
    icon: Trophy,
    base: 'bg-[#FFF8F6] border-[#FFDDD2]',
    selectedStyle: 'bg-[#FFF8F6] border-[#E29578]',
    iconBg: 'bg-[#E29578]',
  },
  {
    id: 'megamillions' as const,
    name: 'Mega Millions',
    desc: 'Tue & Fri draws',
    icon: Trophy,
    base: 'bg-[#F0FAFB] border-[#83C5BE]/30',
    selectedStyle: 'bg-[#F0FAFB] border-[#006D77]',
    iconBg: 'bg-[#006D77]',
  },
  {
    id: 'both' as const,
    name: 'Both!',
    desc: 'Double the chances',
    icon: Sparkles,
    base: 'bg-white border-[#FFDDD2]',
    selectedStyle: 'bg-[#EDF6F9] border-[#83C5BE]',
    iconBg: 'bg-[#83C5BE]',
  },
];

const GamePickerStep: React.FC<GamePickerStepProps> = ({ selected, onSelect, onNext }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (game: GameChoice) => {
    onSelect(game);
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
        <ShaneMascot size="md" expression="confident" animate />
      </div>

      <h2 className="shane-serif text-2xl sm:text-3xl font-black text-[#4A5D4E] tracking-tighter mt-4 sm:mt-6">
        Pick your game
      </h2>
      <p className="text-sm sm:text-base font-bold text-[#83C5BE] mt-1">
        Which lottery interests you most?
      </p>

      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 w-full max-w-[360px]">
        {games.map((game, i) => {
          const isSelected = selected === game.id;
          return (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => handleSelect(game.id)}
              className={`w-full p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left transition-all min-h-[44px] ${
                isSelected ? game.selectedStyle : game.base
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 text-white transition-colors ${
                  isSelected ? game.iconBg : 'bg-[#EDF6F9] !text-[#006D77]'
                }`}>
                  {isSelected ? <Check size={18} strokeWidth={4} /> : <game.icon size={20} />}
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-[#006D77]">{game.name}</h4>
                  <p className="text-xs sm:text-sm font-bold text-[#83C5BE]">{game.desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GamePickerStep;

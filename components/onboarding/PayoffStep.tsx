import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import ShaneMascot from '../ShaneMascot';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

interface WizardData {
  playStyle: 'solo' | 'friends' | 'new' | null;
  preferredGame: 'powerball' | 'megamillions' | 'both' | null;
}

interface PayoffStepProps {
  wizardData: WizardData;
}

const mockNumbers = [7, 14, 21, 35, 42];
const mockBonus = 19;

const PayoffStep: React.FC<PayoffStepProps> = ({ wizardData }) => {
  const { user, setOnboarded } = useStore();
  const [saving, setSaving] = useState(false);

  const isMega = wizardData.preferredGame === 'megamillions';
  const gameName = isMega ? 'Mega Millions' : 'Powerball';
  const gameBadgeBg = isMega ? 'bg-[#006D77]' : 'bg-[#E29578]';

  useEffect(() => {
    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE'],
      });
    }
  }, []);

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      setOnboarded(true);
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      setOnboarded(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center text-center px-2">
      <div className="scale-75 sm:scale-100">
        <ShaneMascot size="lg" expression="excited" animate />
      </div>

      <h2 className="shane-serif text-2xl sm:text-3xl font-black text-[#4A5D4E] tracking-tighter mt-4 sm:mt-6">
        Here's what winning<br />looks like
      </h2>

      {/* Mock Win Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 20, stiffness: 200 }}
        className="mt-6 sm:mt-8 bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] p-5 sm:p-6 warm-shadow w-full max-w-[340px] relative overflow-hidden"
      >
        {/* Sparkle decorations */}
        <div className="absolute top-3 right-4 text-[#E29578]/25">
          <Sparkles size={16} />
        </div>
        <div className="absolute bottom-4 left-4 text-[#83C5BE]/25">
          <Sparkles size={12} />
        </div>

        {/* Pool name + game badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-wider ${gameBadgeBg}`}>
            {gameName}
          </span>
          <span className="text-xs sm:text-sm font-black text-[#006D77]">Shane's Lucky Pool</span>
        </div>

        {/* Matched numbers */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-center mb-4">
          {mockNumbers.map((n, i) => (
            <motion.div
              key={n}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, type: 'spring', damping: 12 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#006D77] text-white flex items-center justify-center text-xs sm:text-sm font-black"
            >
              {n}
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: 'spring', damping: 12 }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E29578] text-white flex items-center justify-center text-xs sm:text-sm font-black"
          >
            {mockBonus}
          </motion.div>
        </div>

        {/* Prize amount */}
        <div className="text-center">
          <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">Total Prize</p>
          <p className="text-3xl sm:text-4xl font-black text-[#006D77] tracking-tighter shane-serif">$50,000</p>
        </div>

        {/* Your share */}
        <div className="mt-3 bg-[#EDF6F9] rounded-xl p-3 text-center">
          <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">Your Share (4-way split)</p>
          <p className="text-xl sm:text-2xl font-black text-[#E29578] tracking-tight">$12,500</p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-auto pt-8 w-full"
      >
        <button
          onClick={handleComplete}
          disabled={saving}
          className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 warm-shadow btn-shimmer active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(226,149,120,0.5)] disabled:opacity-70 disabled:active:scale-100"
        >
          {saving ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Start Winning!
              <ArrowRight size={22} strokeWidth={3} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default PayoffStep;

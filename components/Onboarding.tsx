import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeStep from './onboarding/WelcomeStep';
import PlayStyleStep from './onboarding/PlayStyleStep';
import GamePickerStep from './onboarding/GamePickerStep';
import FeaturesStep from './onboarding/FeaturesStep';
import PayoffStep from './onboarding/PayoffStep';

interface WizardData {
  playStyle: 'solo' | 'friends' | 'new' | null;
  preferredGame: 'powerball' | 'megamillions' | 'both' | null;
}

const TOTAL_STEPS = 5;

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    playStyle: null,
    preferredGame: null,
  });

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-gradient-to-b from-[#F2E9D4] to-[#83C5BE]/30 flex flex-col px-6 overflow-y-auto full-screen-safe"
    >
      {/* Background blur blob */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-[#FFDDD2]/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(((step + 1) / TOTAL_STEPS) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
        className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-[#EDF6F9] z-20"
      >
        <motion.div
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="h-full bg-[#E29578]"
        />
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col relative z-10 pt-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {step === 0 && (
              <WelcomeStep onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <PlayStyleStep
                selected={wizardData.playStyle}
                onSelect={(style) => updateWizardData({ playStyle: style })}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <GamePickerStep
                selected={wizardData.preferredGame}
                onSelect={(game) => updateWizardData({ preferredGame: game })}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <FeaturesStep onNext={() => setStep(4)} />
            )}
            {step === 4 && (
              <PayoffStep wizardData={wizardData} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Onboarding;

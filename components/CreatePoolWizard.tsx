import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Copy, Share2, Sparkles, Shield, Users, DollarSign, Lock, Globe } from 'lucide-react';
import ShaneMascot from './ShaneMascot';

interface CreatePoolWizardProps {
  onClose: () => void;
  onComplete: (poolName: string, game: string) => void;
}

const CreatePoolWizard: React.FC<CreatePoolWizardProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [poolName, setPoolName] = useState('');
  const [selectedGame, setSelectedGame] = useState<'powerball' | 'mega-millions' | null>(null);
  const [contribution, setContribution] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const friends = [
    { id: '1', name: 'John D.', avatar: 'https://picsum.photos/seed/john/80' },
    { id: '2', name: 'Sarah M.', avatar: 'https://picsum.photos/seed/sarah/80' },
    { id: '3', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/mike/80' },
    { id: '4', name: 'Harvey S.', avatar: 'https://picsum.photos/seed/harvey/80' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4); // Success step
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
      });
    }
  };

  const stepsData = [
    { speech: "What are we calling this goldmine?", label: "Name", expression: 'thoughtful' as const },
    { speech: "Pick your path to retirement.", label: "Game", expression: 'confident' as const },
    { speech: "How much per ticket, partner?", label: "Rules", expression: 'thoughtful' as const },
    { speech: "Who's coming with us?", label: "Invite", expression: 'excited' as const }
  ];

  const progress = ((step + 1) / 4) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" 
        onClick={step !== 4 ? onClose : undefined}
      />
      
      <motion.div
        initial={{ y: 100, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 100, scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] sm:rounded-[3.5rem] p-5 sm:p-8 border border-[#FFDDD2] warm-shadow overflow-hidden flex flex-col modal-max-height"
      >
        {/* Progress Bar */}
        {step < 4 && (
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-[#EDF6F9]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#83C5BE]"
            />
          </div>
        )}

        {step !== 4 && (
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-8 sm:right-8 p-2 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] hover:bg-[#83C5BE]/20 transition-colors z-50"
          >
            <X size={18} />
          </button>
        )}

        {/* Mascot & Speech Header */}
        {step < 4 && (
          <div className="flex flex-col items-center mb-4 sm:mb-6 mt-2 shrink-0">
            <div className="scale-75 sm:scale-100">
              <ShaneMascot size="sm" expression={stepsData[step].expression} animate />
            </div>
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 sm:mt-3 bg-[#EDF6F9] p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] border border-[#83C5BE]/30 relative max-w-[180px] sm:max-w-[200px]"
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#EDF6F9] rotate-45 border-t border-l border-[#83C5BE]/30" />
              <p className="text-[#006D77] font-black text-center text-[11px] sm:text-xs leading-tight">
                {stepsData[step].speech}
              </p>
            </motion.div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="space-y-4 sm:space-y-6 py-2 sm:py-4 flex flex-col justify-center min-h-[200px] sm:min-h-[260px]"
              >
                <div className="space-y-3 sm:space-y-4">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter Pool Name..."
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    className="w-full bg-[#EDF6F9] border-none rounded-[1.2rem] sm:rounded-[1.5rem] py-4 sm:py-5 px-5 sm:px-6 text-lg sm:text-xl font-black text-[#006D77] outline-none ring-2 ring-transparent focus:ring-[#83C5BE]/30 transition-all placeholder:text-[#83C5BE]/40 text-center"
                  />
                  <p className="text-center text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em] sm:tracking-[0.3em]">Pick something lucky!</p>
                </div>
                <button
                  disabled={!poolName.trim()}
                  onClick={handleNext}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  Next <ArrowRight size={20} strokeWidth={3} />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="grid grid-cols-1 gap-2 sm:gap-3 py-2 sm:py-4"
              >
                {[
                  { id: 'powerball', name: 'Powerball', jackpot: '$450M', color: 'bg-[#E29578]' },
                  { id: 'mega-millions', name: 'Mega Millions', jackpot: '$182M', color: 'bg-[#83C5BE]' }
                ].map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id as any)}
                    className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${
                      selectedGame === game.id
                        ? 'bg-white border-[#006D77] shadow-xl'
                        : 'bg-[#EDF6F9] border-transparent grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-[#006D77]">{game.name}</h4>
                        <p className={`text-lg sm:text-xl font-black ${game.color.replace('bg-', 'text-')} tracking-tighter`}>{game.jackpot}</p>
                      </div>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${game.color} flex items-center justify-center text-white shadow-lg`}>
                        {selectedGame === game.id ? <Check size={18} strokeWidth={4} /> : <Sparkles size={14} />}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  disabled={!selectedGame}
                  onClick={handleNext}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all disabled:opacity-50 mt-2"
                >
                  Next <ArrowRight size={20} strokeWidth={3} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="space-y-4 sm:space-y-6 py-2 sm:py-4"
              >
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-2">Ticket Contribution</label>
                  <div className="flex justify-between gap-2">
                    {[2, 5, 10].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setContribution(amt)}
                        className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl font-black text-base sm:text-lg border-2 transition-all ${
                          contribution === amt
                            ? 'bg-[#006D77] border-[#006D77] text-white shadow-lg'
                            : 'bg-white border-[#FFDDD2] text-[#006D77]'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#EDF6F9] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] space-y-3 sm:space-y-4 border border-[#FFDDD2]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${isPrivate ? 'bg-[#E29578]' : 'bg-[#83C5BE]'} text-white`}>
                        {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-[#006D77]">{isPrivate ? 'Private Pool' : 'Open Pool'}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] leading-none">{isPrivate ? 'Invite only' : 'Visible to Circle'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-11 h-6 sm:w-12 sm:h-7 rounded-full p-1 transition-all relative ${isPrivate ? 'bg-[#E29578]' : 'bg-[#83C5BE]'}`}
                    >
                      <motion.div 
                        animate={{ x: isPrivate ? 18 : 0 }}
                        className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all"
                >
                  Next <ArrowRight size={20} strokeWidth={3} />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="space-y-3 sm:space-y-4 py-2 sm:py-4"
              >
                <div className="max-h-[140px] sm:max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => {
                        setSelectedFriends(prev => 
                          prev.includes(friend.id) 
                            ? prev.filter(id => id !== friend.id)
                            : [...prev, friend.id]
                        );
                      }}
                      className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-between border-2 transition-all ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-[#EDF6F9] border-[#006D77]'
                          : 'bg-white border-[#FFDDD2]'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img src={friend.avatar} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                        <span className="font-black text-[#006D77] text-[11px] sm:text-xs">{friend.name}</span>
                      </div>
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedFriends.includes(friend.id) ? 'bg-[#006D77] border-[#006D77] text-white' : 'border-[#FFDDD2]'
                      }`}>
                        {selectedFriends.includes(friend.id) && <Check size={10} strokeWidth={4} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <button className="w-full py-3 sm:py-3.5 rounded-lg sm:rounded-xl bg-white border-2 border-dashed border-[#83C5BE] text-[#83C5BE] font-black text-[8px] sm:text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Share2 size={12} /> Generate Invite Link
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg shadow-xl shadow-[#006D77]/20 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all"
                  >
                    Finish Setup <Sparkles size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4 sm:space-y-6 flex flex-col items-center justify-center h-full py-6 sm:py-8"
              >
                <div className="scale-75 sm:scale-100">
                  <ShaneMascot size="lg" expression="excited" animate />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">Pool Created!</h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em]">Retirement starts today.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#E29578]/20 active:scale-95 transition-all"
                >
                  Go to Pool
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreatePoolWizard;
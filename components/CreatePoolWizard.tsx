import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Sparkles, Lock, Globe, Loader2, Copy, Share2, Info } from 'lucide-react';
import ShaneMascot from './ShaneMascot';
import { useStore } from '../store/useStore';
import { createPool } from '../services/pools';
import type { PoolWithMembers } from '../services/pools';
import FocusTrap from './FocusTrap';

interface CreatePoolWizardProps {
  onClose: () => void;
  onComplete: (poolName: string, game: string) => void;
}

const CreatePoolWizard: React.FC<CreatePoolWizardProps> = ({ onClose, onComplete }) => {
  const { user, addPool } = useStore();
  const [step, setStep] = useState(0);
  const [poolName, setPoolName] = useState('');
  const [selectedGame, setSelectedGame] = useState<'powerball' | 'mega_millions' | null>(null);
  const [contribution, setContribution] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPool, setCreatedPool] = useState<PoolWithMembers | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleCreatePool();
    }
  };

  const handleCreatePool = async () => {
    if (!user?.id || !selectedGame) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await createPool({
        name: poolName,
        game_type: selectedGame,
        captain_id: user.id,
        is_private: isPrivate,
        contribution_amount: contribution,
      });
      if (error) {
        setError(error);
        setIsLoading(false);
        return;
      }
      if (data) {
        setCreatedPool(data);
        addPool(data);
        setStep(3);
        triggerConfetti();
      }
    } catch (err) {
      setError('Failed to create pool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfetti = () => {
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
      });
    }
  };

  const copyInviteCode = () => {
    if (createdPool?.invite_code) {
      navigator.clipboard.writeText(createdPool.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function' && navigator.canShare?.({ text: 'test' });

  const shareInviteCode = async () => {
    if (!createdPool?.invite_code) return;

    const shareData = {
      title: `Join ${poolName} on Shane's Fund!`,
      text: `Join my lottery pool "${poolName}"! Use invite code: ${createdPool.invite_code}`,
      url: window.location.origin,
    };

    if (canShare) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share - that's fine, don't fallback
        if (err instanceof Error && err.name !== 'AbortError') {
          copyInviteCode();
        }
      }
    } else {
      // No native share, copy the full message instead
      const message = `${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stepsData = [
    { speech: "What are we calling this goldmine?", label: "Name", expression: 'thoughtful' as const },
    { speech: "Pick your path to retirement.", label: "Game", expression: 'confident' as const },
    { speech: "Set the rules, captain!", label: "Rules", expression: 'thoughtful' as const }
  ];

  const progress = ((step + 1) / 3) * 100;

  return (
    <FocusTrap onClose={onClose} autoFocusFirst={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Create pool"
      >
      <div
        className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl"
        onClick={step !== 3 ? onClose : undefined}
      />
      <motion.div
        initial={{ y: 100, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 100, scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] sm:rounded-[3.5rem] p-5 sm:p-8 border border-[#FFDDD2] warm-shadow overflow-hidden flex flex-col modal-max-height"
      >
        {step < 3 && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pool creation wizard progress"
            className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-[#EDF6F9]"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#83C5BE]"
            />
          </div>
        )}
        {step !== 3 && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-8 sm:right-8 p-2 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] hover:bg-[#83C5BE]/20 transition-colors z-50"
          >
            <X size={18} />
          </button>
        )}
        {step < 3 && (
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
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-red-600 text-sm font-bold text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
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
                  { id: 'powerball', name: 'Powerball', jackpot: 'Est. $500M+', color: 'bg-[#E29578]' },
                  { id: 'mega_millions', name: 'Mega Millions', jackpot: 'Est. $400M+', color: 'bg-[#83C5BE]' }
                ].map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id as 'powerball' | 'mega_millions')}
                    className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${selectedGame === game.id ? 'border-[#006D77] bg-[#EDF6F9]' : 'border-[#FFDDD2] bg-white hover:border-[#83C5BE]'}`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-[#006D77]">{game.name}</h4>
                        <p className={`text-lg sm:text-xl font-black ${selectedGame === game.id ? 'text-[#006D77]' : 'text-[#83C5BE]'} tracking-tighter`}>{game.jackpot}</p>
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
                        className={`flex-1 py-3 sm:py-4 rounded-lg sm:rounded-xl font-black text-base sm:text-lg border-2 transition-all ${contribution === amt ? 'border-[#006D77] bg-[#006D77] text-white' : 'border-[#FFDDD2] bg-white text-[#006D77] hover:border-[#83C5BE]'}`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#EDF6F9] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] space-y-3 sm:space-y-4 border border-[#FFDDD2]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${isPrivate ? 'bg-[#006D77]' : 'bg-[#83C5BE]'} text-white`}>
                        {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-black text-[#006D77]">{isPrivate ? 'Private Pool' : 'Open Pool'}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] leading-none">{isPrivate ? 'Invite only' : 'Visible to Circle'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-11 h-6 sm:w-12 sm:h-7 rounded-full p-1 transition-all relative ${isPrivate ? 'bg-[#006D77]' : 'bg-[#FFDDD2]'}`}
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
                  disabled={isLoading}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg shadow-xl shadow-[#006D77]/20 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating Pool...
                    </>
                  ) : (
                    <>
                      Create Pool <Sparkles size={20} />
                    </>
                  )}
                </button>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4 sm:space-y-5 flex flex-col items-center justify-center h-full py-4 sm:py-6"
              >
                <div className="scale-65 sm:scale-75">
                  <ShaneMascot size="lg" expression="excited" animate />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">Pool Created!</h2>
                  <p className="text-[10px] sm:text-xs text-[#006D77]/70 font-bold max-w-[260px] mx-auto leading-relaxed">
                    Friends can join by tapping <span className="text-[#E29578] font-black">Join Pool</span> and entering this code
                  </p>
                </div>
                {createdPool?.invite_code && (
                  <div className="w-full space-y-3">
                    <div className="bg-[#EDF6F9] p-4 rounded-2xl border-2 border-dashed border-[#83C5BE]">
                      <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2">Invite Code</p>
                      <p className="text-3xl font-black text-[#006D77] tracking-[0.2em]">{createdPool.invite_code}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyInviteCode}
                        className="flex-1 py-3 rounded-xl bg-white border-2 border-[#83C5BE] text-[#006D77] font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={shareInviteCode}
                        className="flex-1 py-3 rounded-xl bg-[#006D77] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        {copied && !canShare ? <Check size={16} /> : <Share2 size={16} />}
                        {copied && !canShare ? 'Copied!' : 'Share'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[9px] text-[#83C5BE] font-bold">
                  <Info size={12} />
                  <span>You can find this code anytime in pool settings</span>
                </div>
                <button
                  onClick={() => {
                    onComplete(poolName, selectedGame || '');
                    onClose();
                  }}
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
    </FocusTrap>
  );
};

export default CreatePoolWizard;

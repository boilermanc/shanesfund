import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Keyboard, ArrowRight, Check, Users, Loader2, DollarSign, CreditCard } from 'lucide-react';
import ShaneMascot from './ShaneMascot';
import { useStore } from '../store/useStore';
import { getPoolByInviteCode, joinPoolByCode, createContribution } from '../services/pools';
import type { PoolWithMembers } from '../services/pools';
import FocusTrap from './FocusTrap';

interface JoinPoolScreenProps {
  onClose: () => void;
  onJoinSuccess: (poolName: string) => void;
}

const JoinPoolScreen: React.FC<JoinPoolScreenProps> = ({ onClose, onJoinSuccess }) => {
  const { user, addPool } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'payment' | 'success'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolData, setPoolData] = useState<PoolWithMembers | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (mode === 'scan' && step === 'input') {
      async function setupCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access failed", err);
          setMode('manual');
        }
      }
      setupCamera();
    }

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [mode, step]);

  const lookupPool = async (code: string) => {
    if (!code || code.length < 4) return;

    setIsLoading(true);
    setError(null);

    const { data, error: lookupError } = await getPoolByInviteCode(code);

    if (lookupError || !data) {
      setError(lookupError || 'Pool not found');
      setIsLoading(false);
      return;
    }

    setPoolData(data);
    setStep('preview');
    setIsLoading(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupPool(manualCode);
  };

  const handleJoinPool = async () => {
    if (!user?.id || !poolData) return;

    setIsLoading(true);
    setError(null);

    const { data, error: joinError } = await joinPoolByCode(
      poolData.invite_code,
      user.id
    );

    if (joinError) {
      setError(joinError);
      setIsLoading(false);
      return;
    }

    if (data) {
      addPool(data);
      setStep('payment');
    }

    setIsLoading(false);
  };

  const handleMarkAsPaid = async () => {
    if (!user?.id || !poolData) return;

    setIsPaying(true);
    setError(null);

    // Get next draw date (next Wednesday or Saturday for most lotteries)
    const today = new Date();
    const nextDraw = new Date(today);
    const dayOfWeek = today.getDay();
    // Find next Wednesday (3) or Saturday (6)
    const daysUntilWed = (3 - dayOfWeek + 7) % 7 || 7;
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
    const daysUntilNext = Math.min(daysUntilWed, daysUntilSat);
    nextDraw.setDate(today.getDate() + daysUntilNext);
    const drawDate = nextDraw.toISOString().split('T')[0];

    const { error: contribError } = await createContribution(
      poolData.id,
      user.id,
      poolData.contribution_amount,
      drawDate
    );

    if (contribError) {
      setError(contribError);
      setIsPaying(false);
      return;
    }

    // Trigger confetti
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
      });
    }

    setStep('success');
    setIsPaying(false);
  };

  const handleSkipPayment = () => {
    setStep('success');
  };

  const getCaptainName = () => {
    if (!poolData?.pool_members) return 'Captain';
    const captain = poolData.pool_members.find((m: any) => m.role === 'captain');
    return captain?.users?.display_name || captain?.users?.email?.split('@')[0] || 'Captain';
  };

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[750] bg-black flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Join pool"
      >
      {step === 'input' && mode === 'scan' ? (
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
          />

          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
            <div className="flex h-[220px] sm:h-[280px]">
              <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
              <div className="w-[220px] sm:w-[280px] relative">
                {/* Scanner Frame */}
                <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] sm:rounded-[3rem]" />
                <div className="absolute top-0 left-0 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-[#006D77] rounded-tl-[1.5rem] sm:rounded-tl-[2rem]" />
                <div className="absolute top-0 right-0 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-[#006D77] rounded-tr-[1.5rem] sm:rounded-tr-[2rem]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-[#006D77] rounded-bl-[1.5rem] sm:rounded-bl-[2rem]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-[#006D77] rounded-br-[1.5rem] sm:rounded-br-[2rem]" />

                {/* Laser */}
                <motion.div
                  initial={{ top: '5%' }}
                  animate={{ top: ['5%', '95%', '5%'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute left-4 right-4 h-1 bg-[#E29578] shadow-[0_0_15px_#E29578]"
                />
              </div>
              <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm" />
            </div>
            <div className="flex-1 bg-[#EDF6F9]/40 backdrop-blur-sm flex flex-col items-center pt-6 sm:pt-10">
              <p className="text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] animate-pulse">Scanning Pool QR...</p>

              <button
                onClick={() => setMode('manual')}
                className="mt-6 sm:mt-8 bg-white/20 backdrop-blur-md px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-white/30 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Keyboard size={14} /> Enter Code Manually
              </button>
            </div>
          </div>
        </div>
      ) : step === 'input' ? (
        <div className="absolute inset-0 bg-[#EDF6F9] flex flex-col items-center justify-center p-6 sm:p-8">
           <div className="w-full max-w-sm space-y-6 sm:space-y-8">
             <div className="text-center">
               <h3 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">Enter Pool Code</h3>
               <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mt-2">Check your invite message</p>
             </div>

             <AnimatePresence>
               {error && (
                 <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="p-3 bg-red-50 border border-red-200 rounded-xl"
                 >
                   <p className="text-red-600 text-sm font-bold text-center">{error}</p>
                 </motion.div>
               )}
             </AnimatePresence>

             <form onSubmit={handleManualSubmit} className="space-y-4 sm:space-y-6">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="SHANE-X"
                  className="w-full bg-white border-none rounded-[1.5rem] sm:rounded-[2rem] py-4 sm:py-6 px-6 sm:px-8 text-xl sm:text-2xl font-black text-[#006D77] outline-none warm-shadow text-center uppercase font-mono tracking-widest"
                />

                <button
                  type="submit"
                  disabled={manualCode.length < 4 || isLoading}
                  className="w-full py-4 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Looking up pool...
                    </>
                  ) : (
                    <>
                      Find Pool <ArrowRight size={20} />
                    </>
                  )}
                </button>
             </form>

             <button
                onClick={() => setMode('scan')}
                className="w-full text-[#83C5BE] font-black text-[9px] sm:text-[10px] uppercase tracking-widest"
              >
                Switch to QR Scan
              </button>
           </div>
        </div>
      ) : null}

      {/* Header UI - only show on input step */}
      {step === 'input' && (
        <div className="absolute left-0 right-0 px-6 sm:px-8 flex justify-between items-center z-[760] safe-area-top" style={{ top: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>
          <button
            onClick={onClose}
            className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white text-[#006D77] shadow-xl border border-[#FFDDD2]"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Pool Preview Modal */}
      <AnimatePresence>
        {step === 'preview' && poolData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/50 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] shadow-2xl text-center"
            >
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="scale-75 sm:scale-100">
                  <ShaneMascot size="lg" expression="confident" animate />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 sm:mt-6 space-y-2"
                >
                  <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight leading-tight">
                    You've been invited to<br/>
                    <span className="text-[#E29578] leading-normal">{poolData.name}</span>
                  </h3>

                  <div className="flex items-center justify-center gap-3 sm:gap-4 py-3 sm:py-4 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-[#EDF6F9] border border-[#FFDDD2]">
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-wider">{getCaptainName()}</p>
                    </div>
                    <div className="h-4 w-[1px] bg-[#83C5BE]/30" />
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[#83C5BE]">
                      <Users size={12} />
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">{poolData.members_count || 1} Members</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-wider">Contribution per draw</p>
                    <p className="text-2xl sm:text-3xl font-black text-[#006D77]">${poolData.contribution_amount}</p>
                  </div>
                </motion.div>
              </div>

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

              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#EDF6F9] text-[#006D77] font-black text-[10px] sm:text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinPool}
                  disabled={isLoading}
                  className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#E29578] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 btn-shimmer disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Join Pool <Check size={16} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Step Modal */}
      <AnimatePresence>
        {step === 'payment' && poolData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/50 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] shadow-2xl text-center"
            >
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#EDF6F9] flex items-center justify-center mb-4">
                  <DollarSign size={40} className="text-[#006D77]" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <h3 className="text-xl sm:text-2xl font-black text-[#006D77] tracking-tight">
                    Contribute to the Pool
                  </h3>
                  <p className="text-xs sm:text-sm text-[#83C5BE] font-bold max-w-[260px]">
                    Pay the captain <span className="text-[#006D77] font-black">${poolData.contribution_amount}</span> for the next draw
                  </p>

                  <div className="bg-[#EDF6F9] p-4 sm:p-5 rounded-2xl border border-[#FFDDD2] mt-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-wider mb-2">Amount Due</p>
                    <p className="text-4xl sm:text-5xl font-black text-[#006D77] tracking-tighter">${poolData.contribution_amount}</p>
                    <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold mt-2">
                      Pay via Venmo, Zelle, or Cash
                    </p>
                  </div>
                </motion.div>
              </div>

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

              <div className="space-y-3">
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isPaying}
                  className="w-full py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#006D77] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#006D77]/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isPaying ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      I've Paid ${poolData.contribution_amount}
                    </>
                  )}
                </button>
                <button
                  onClick={handleSkipPayment}
                  className="w-full py-3 text-[#83C5BE] font-black text-[10px] sm:text-xs uppercase tracking-widest"
                >
                  I'll pay later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {step === 'success' && poolData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/50 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] shadow-2xl text-center"
            >
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="scale-75 sm:scale-100">
                  <ShaneMascot size="lg" expression="excited" animate />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 sm:mt-6 space-y-2"
                >
                  <h3 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tight">
                    You're In!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#83C5BE] font-bold">
                    Welcome to <span className="text-[#E29578] font-black">{poolData.name}</span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold mt-1">
                    Your contribution is pending captain confirmation
                  </p>
                </motion.div>
              </div>

              <button
                onClick={() => onJoinSuccess(poolData.name)}
                className="w-full py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#E29578] text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2"
              >
                Go to Pool <ArrowRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </FocusTrap>
  );
};

export default JoinPoolScreen;

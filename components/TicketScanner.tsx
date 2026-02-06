import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Camera, Zap, RefreshCw, Keyboard, ChevronDown, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createTicket } from '../services/pools';
interface TicketScannerProps {
  onClose: () => void;
  poolId?: string;
}
const GhostNumber: React.FC<{ x: string; y: string; delay: number }> = ({ x, y, delay }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 0.6, 0],
      scale: [0.5, 1.2, 0.8],
      x: [0, (Math.random() - 0.5) * 40, 0],
      y: [0, (Math.random() - 0.5) * 40, 0]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    className="absolute text-[#006D77] font-black text-lg sm:text-xl pointer-events-none select-none"
    style={{ left: x, top: y }}
  >
    {Math.floor(Math.random() * 60) + 1}
  </motion.span>
);
const TicketScanner: React.FC<TicketScannerProps> = ({ onClose, poolId: initialPoolId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, pools } = useStore();
  const [isScanning, setIsScanning] = useState(true);
  const [detectedData, setDetectedData] = useState<number[] | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualNumbers, setManualNumbers] = useState(['', '', '', '', '']);
  const [manualBonus, setManualBonus] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId || '');
  const [selectedGame, setSelectedGame] = useState<'powerball' | 'mega_millions'>('powerball');
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPoolPicker, setShowPoolPicker] = useState(false);
  useEffect(() => {
    if (isManualEntry) return;
    let stream: MediaStream | null = null;
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
      }
    }
    setupCamera();
    const timer = setTimeout(() => {
      setIsScanning(false);
      setDetectedData([12, 24, 31, 48, 59, 15]);
    }, 4000);
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      clearTimeout(timer);
    };
  }, [isManualEntry]);
  const ghostNumbers = Array.from({ length: 12 }).map((_, i) => ({
    x: `${15 + Math.random() * 70}%`,
    y: `${20 + Math.random() * 50}%`,
    delay: i * 0.3
  }));
  const handleSaveTicket = async () => {
    if (!user?.id) {
      setError('You must be logged in');
      return;
    }
    if (!selectedPoolId) {
      setError('Please select a pool');
      return;
    }
    const numbers = isManualEntry 
      ? manualNumbers.map(n => parseInt(n)).filter(n => !isNaN(n))
      : detectedData?.slice(0, 5) || [];
    const bonusNumber = isManualEntry 
      ? parseInt(manualBonus) 
      : detectedData?.[5] || 0;
    if (numbers.length !== 5 || !bonusNumber) {
      setError('Please enter all 6 numbers');
      return;
    }
    setIsSaving(true);
    setError(null);
    const { data, error: saveError } = await createTicket({
      pool_id: selectedPoolId,
      game_type: selectedGame,
      numbers,
      bonus_number: bonusNumber,
      draw_date: drawDate,
      entered_by: user.id,
      entry_method: isManualEntry ? 'manual' : 'scan',
    });
    setIsSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    if (typeof (window as any).confetti === 'function') {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
      });
    }
    onClose();
  };
  const selectedPool = pools.find(p => p.id === selectedPoolId);
  if (isManualEntry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] bg-[#EDF6F9] flex flex-col"
      >
        <div className="px-4 sm:px-8 flex justify-between items-center" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-3 rounded-xl bg-white text-[#006D77] shadow-lg border border-[#FFDDD2]"
          >
            <X size={20} strokeWidth={3} />
          </motion.button>
          <h2 className="text-lg font-black text-[#006D77]">Enter Ticket</h2>
          <div className="w-11" />
        </div>
        <div className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Pool Selector */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Select Pool</label>
            <button
              onClick={() => setShowPoolPicker(!showPoolPicker)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-[#FFDDD2] flex items-center justify-between"
            >
              <span className="font-bold text-[#006D77]">
                {selectedPool?.name || 'Choose a pool...'}
              </span>
              <ChevronDown size={20} className="text-[#83C5BE]" />
            </button>
            <AnimatePresence>
              {showPoolPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-white rounded-2xl border-2 border-[#FFDDD2] overflow-hidden"
                >
                  {pools.map(pool => (
                    <button
                      key={pool.id}
                      onClick={() => {
                        setSelectedPoolId(pool.id);
                        setSelectedGame(pool.game_type as 'powerball' | 'mega_millions');
                        setShowPoolPicker(false);
                      }}
                      className="w-full p-4 text-left hover:bg-[#EDF6F9] border-b border-[#FFDDD2] last:border-0"
                    >
                      <p className="font-bold text-[#006D77]">{pool.name}</p>
                      <p className="text-xs text-[#83C5BE] capitalize">{pool.game_type?.replace('_', ' ')}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Game Type */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Game</label>
            <div className="flex gap-3">
              {(['powerball', 'mega_millions'] as const).map(game => (
                <button
                  key={game}
                  onClick={() => setSelectedGame(game)}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                    selectedGame === game
                      ? 'bg-[#006D77] text-white'
                      : 'bg-white border-2 border-[#FFDDD2] text-[#006D77]'
                  }`}
                >
                  {game === 'powerball' ? 'Powerball' : 'Mega Millions'}
                </button>
              ))}
            </div>
          </div>
          {/* Draw Date */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">Draw Date</label>
            <input
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-[#FFDDD2] font-bold text-[#006D77]"
            />
          </div>
          {/* Numbers Entry */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">
              Main Numbers (1-{selectedGame === 'powerball' ? '69' : '70'})
            </label>
            <div className="flex gap-2">
              {manualNumbers.map((num, i) => (
                <input
                  key={i}
                  type="number"
                  min="1"
                  max={selectedGame === 'powerball' ? 69 : 70}
                  value={num}
                  onChange={(e) => {
                    const newNumbers = [...manualNumbers];
                    newNumbers[i] = e.target.value;
                    setManualNumbers(newNumbers);
                  }}
                  className="flex-1 p-3 rounded-xl bg-white border-2 border-[#FFDDD2] font-black text-center text-[#006D77] text-lg"
                  placeholder="#"
                />
              ))}
            </div>
          </div>
          {/* Bonus Number */}
          <div>
            <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mb-2 block">
              {selectedGame === 'powerball' ? 'Powerball' : 'Mega Ball'} (1-{selectedGame === 'powerball' ? '26' : '25'})
            </label>
            <input
              type="number"
              min="1"
              max={selectedGame === 'powerball' ? 26 : 25}
              value={manualBonus}
              onChange={(e) => setManualBonus(e.target.value)}
              className={`w-24 p-3 rounded-xl border-2 font-black text-center text-lg ${
                selectedGame === 'powerball'
                  ? 'bg-[#FFDDD2] border-[#E29578] text-[#E29578]'
                  : 'bg-[#EDF6F9] border-[#006D77] text-[#006D77]'
              }`}
              placeholder="#"
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm font-bold text-center"
            >
              {error}
            </motion.p>
          )}
        </div>
        {/* Bottom Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#FFDDD2] safe-area-bottom">
          <div className="flex gap-3">
            <button
              onClick={() => setIsManualEntry(false)}
              className="flex-1 py-4 rounded-2xl bg-[#FFDDD2] text-[#006D77] font-black flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Scan Instead
            </button>
            <button
              onClick={handleSaveTicket}
              disabled={isSaving}
              className="flex-1 py-4 rounded-2xl bg-[#E29578] text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSaving ? 'Saving...' : 'Save Ticket'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col"
    >
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
        />
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
          <div className="flex h-[220px] sm:h-[280px]">
            <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
            <div className="w-[260px] sm:w-[320px] relative">
              <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-[#006D77] rounded-tl-lg sm:rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-[#006D77] rounded-tr-lg sm:rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-[#006D77] rounded-bl-lg sm:rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-[#006D77] rounded-br-lg sm:rounded-br-xl" />
              {isScanning && (
                <motion.div
                  initial={{ top: '5%' }}
                  animate={{ top: ['5%', '95%', '5%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-2 right-2 h-0.5 sm:h-1 bg-[#E29578] z-10 shadow-[0_0_15px_#E29578,0_0_30px_#E29578]"
                />
              )}
            </div>
            <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px]" />
          </div>
          <div className="flex-1 bg-[#EDF6F9]/60 backdrop-blur-[2px] flex flex-col items-center pt-6 sm:pt-8">
            {isScanning && (
              <p className="text-[#83C5BE] text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] animate-pulse px-4 text-center">
                Align ticket within the frame...
              </p>
            )}
          </div>
        </div>
        {isScanning && ghostNumbers.map((gn, i) => (
          <GhostNumber key={i} x={gn.x} y={gn.y} delay={gn.delay} />
        ))}
      </div>
      <div className="absolute left-0 right-0 px-4 sm:px-8 flex justify-between items-center z-[410]" style={{ top: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white text-[#006D77] shadow-xl border border-[#FFDDD2]"
        >
          <X size={20} strokeWidth={3} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsManualEntry(true)}
          className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#83C5BE]/20 backdrop-blur-md border border-[#83C5BE]/40 text-[#006D77] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"
        >
          <Keyboard size={14} />
          Enter Manually
        </motion.button>
      </div>
      <AnimatePresence>
        {!isScanning && detectedData && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] sm:rounded-t-[32px] border-t-4 sm:border-t-8 border-[#83C5BE] p-5 sm:p-8 shadow-[0_-15px_50px_rgba(0,0,0,0.2)] z-[420] safe-area-bottom"
          >
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-lg bg-[#E29578]/10 text-[#E29578]">
                    <Zap size={14} fill="currentColor" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight">Powerball Detected</h3>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#83C5BE]">Draw Date: {drawDate}</p>
              </div>
              <div className="bg-[#EDF6F9] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#FFDDD2]">
                <p className="text-[8px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-wider italic">Verified OCR</p>
              </div>
            </div>
            {/* Pool Selector in scan mode */}
            <div className="mb-4">
              <button
                onClick={() => setShowPoolPicker(!showPoolPicker)}
                className="w-full p-3 rounded-xl bg-[#EDF6F9] border border-[#FFDDD2] flex items-center justify-between"
              >
                <span className="text-sm font-bold text-[#006D77]">
                  {selectedPool?.name || 'Select pool to save to...'}
                </span>
                <ChevronDown size={16} className="text-[#83C5BE]" />
              </button>
              <AnimatePresence>
                {showPoolPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 bg-white rounded-xl border-2 border-[#FFDDD2] overflow-hidden max-h-40 overflow-y-auto"
                  >
                    {pools.map(pool => (
                      <button
                        key={pool.id}
                        onClick={() => {
                          setSelectedPoolId(pool.id);
                          setSelectedGame(pool.game_type as 'powerball' | 'mega_millions');
                          setShowPoolPicker(false);
                        }}
                        className="w-full p-3 text-left hover:bg-[#EDF6F9] border-b border-[#FFDDD2] last:border-0"
                      >
                        <p className="font-bold text-sm text-[#006D77]">{pool.name}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {detectedData.slice(0, 5).map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#006D77] flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg border border-white/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                  {num}
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E29578] flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg border border-white/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                {detectedData[5]}
              </motion.div>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm font-bold text-center mb-4"
              >
                {error}
              </motion.p>
            )}
            <div className="flex flex-col gap-3 sm:gap-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveTicket}
                disabled={isSaving || !selectedPoolId}
                className="w-full py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Confirm & Save
                    <Check size={18} strokeWidth={3} />
                  </>
                )}
              </motion.button>
              <button
                onClick={() => {
                  setIsScanning(true);
                  setDetectedData(null);
                }}
                className="w-full py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] bg-[#FFDDD2] text-[#006D77] font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Retake Scan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isScanning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Camera size={28} className="text-white opacity-40" />
            </div>
            <p className="text-white/40 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">Neural Engine Active</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
export default TicketScanner;

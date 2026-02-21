import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, Users, Sparkles, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addTicket } from '../services/tickets';
import { validateTicketNumbers, validateTicketForPool, validateDrawDate } from '../utils/ticketValidation';
import { formatDrawDate, isDrawClosed } from '../utils/drawSchedule';
import { supabase } from '../lib/supabase';

interface ManualTicketEntryProps {
  onClose: () => void;
  onCreatePool?: (gameType?: 'powerball' | 'mega_millions') => void;
  preselectedGameType?: 'powerball' | 'mega_millions';
}

interface PoolOption {
  id: string;
  name: string;
  game_type: 'powerball' | 'mega_millions';
  members_count: number;
}

type GameType = 'powerball' | 'mega_millions';

const GAME_RULES: Record<GameType, { mainMax: number; bonusMax: number; bonusName: string }> = {
  powerball: { mainMax: 69, bonusMax: 26, bonusName: 'Powerball' },
  mega_millions: { mainMax: 70, bonusMax: 25, bonusName: 'Mega Ball' },
};

const MULTIPLIER_OPTIONS: Record<GameType, { label: string; values: number[] }> = {
  powerball: { label: 'Power Play', values: [0, 2, 3, 4, 5, 10] },
  mega_millions: { label: 'Megaplier', values: [0, 2, 3, 4, 5] },
};

/**
 * Get the next N upcoming draw dates for a game type that haven't passed cutoff.
 */
function getUpcomingDrawDates(gameType: GameType, count: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();

  // Scan ahead up to 21 days to find enough draw dates
  for (let offset = 0; offset <= 21 && dates.length < count; offset++) {
    const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const dateStr = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`;

    // Check if this date is a draw day and hasn't closed
    // Use getNextDrawDate logic: check day of week against draw days
    const drawDays: Record<GameType, number[]> = {
      powerball: [1, 3, 6],
      mega_millions: [2, 5],
    };

    const dayOfWeek = candidate.getDay();
    if (!drawDays[gameType].includes(dayOfWeek)) continue;

    // Check if cutoff has passed for this date
    if (isDrawClosed(gameType, dateStr)) continue;

    dates.push(new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate()));
  }

  return dates;
}

const ManualTicketEntry: React.FC<ManualTicketEntryProps> = ({ onClose, onCreatePool, preselectedGameType }) => {
  const { user, pools } = useStore();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Game type
  const [selectedGame, setSelectedGame] = useState<GameType | null>(preselectedGameType || null);

  // Number entry
  const [numbers, setNumbers] = useState(['', '', '', '', '']);
  const [bonusNumber, setBonusNumber] = useState('');
  const numberInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bonusInputRef = useRef<HTMLInputElement | null>(null);

  // Multiplier
  const [multiplier, setMultiplier] = useState<number>(0);

  // Draw date
  const [selectedDrawDate, setSelectedDrawDate] = useState<string>('');
  const [upcomingDates, setUpcomingDates] = useState<Date[]>([]);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());

  // Pool picker (Step 2)
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [matchingPools, setMatchingPools] = useState<PoolOption[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, []);

  // Update upcoming dates when game type changes
  useEffect(() => {
    if (selectedGame) {
      const dates = getUpcomingDrawDates(selectedGame, 4);
      setUpcomingDates(dates);
      // Always reset and auto-select first valid date when game changes
      if (dates.length > 0) {
        const d = dates[0];
        setSelectedDrawDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      } else {
        setSelectedDrawDate('');
      }
    } else {
      setUpcomingDates([]);
      setSelectedDrawDate('');
    }
  }, [selectedGame]);

  // Validate on every change
  useEffect(() => {
    if (!selectedGame) return;

    const rules = GAME_RULES[selectedGame];
    if (!rules) return;
    const newErrors: Record<string, string> = {};
    const newDupes = new Set<number>();

    // Validate each main number
    const parsed: number[] = [];
    numbers.forEach((val, i) => {
      if (val === '') return;
      const n = parseInt(val);
      if (isNaN(n) || n < 1 || n > rules.mainMax) {
        newErrors[`num-${i}`] = `1-${rules.mainMax}`;
      }
      parsed.push(n);
    });

    // Check for duplicates among filled-in numbers
    const seen = new Map<number, number>();
    numbers.forEach((val, i) => {
      if (val === '') return;
      const n = parseInt(val);
      if (isNaN(n)) return;
      if (seen.has(n)) {
        newDupes.add(i);
        newDupes.add(seen.get(n)!);
      } else {
        seen.set(n, i);
      }
    });

    // Validate bonus
    if (bonusNumber !== '') {
      const b = parseInt(bonusNumber);
      if (isNaN(b) || b < 1 || b > rules.bonusMax) {
        newErrors['bonus'] = `1-${rules.bonusMax}`;
      }
    }

    setFieldErrors(newErrors);
    setDuplicateIndices(newDupes);
  }, [numbers, bonusNumber, selectedGame]);

  const showValidationBanner = useCallback((message: string) => {
    setValidationError(message);
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    validationTimerRef.current = setTimeout(() => setValidationError(null), 5000);
  }, []);

  // Auto-advance to next field when 2 digits entered
  const handleNumberChange = (index: number, value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '').slice(0, 2);
    const newNumbers = [...numbers];
    newNumbers[index] = cleaned;
    setNumbers(newNumbers);

    // Auto-advance on 2-digit entry
    if (cleaned.length === 2) {
      if (index < 4) {
        numberInputRefs.current[index + 1]?.focus();
      } else {
        bonusInputRef.current?.focus();
      }
    }
  };

  const handleBonusChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 2);
    setBonusNumber(cleaned);
  };

  // Check if Step 1 form is valid and ready to proceed
  const isStep1Valid = () => {
    if (!selectedGame) return false;
    if (!selectedDrawDate) return false;

    const allFilled = numbers.every(n => n !== '') && bonusNumber !== '';
    if (!allFilled) return false;

    const hasErrors = Object.keys(fieldErrors).length > 0;
    if (hasErrors) return false;

    if (duplicateIndices.size > 0) return false;

    return true;
  };

  // Fetch matching pools for Step 2
  const fetchMatchingPools = useCallback(async (gameType: GameType) => {
    setPoolsLoading(true);
    try {
      const { data } = await supabase
        .from('pools')
        .select('id, name, game_type, members_count')
        .eq('game_type', gameType)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setMatchingPools((data as PoolOption[]) || []);
    } catch {
      setMatchingPools([]);
    } finally {
      setPoolsLoading(false);
    }
  }, []);

  // Transition to Step 2
  const handleGoToStep2 = () => {
    if (!selectedGame) return;

    const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
    const bonus = parseInt(bonusNumber);

    if (nums.length !== 5 || isNaN(bonus)) {
      showValidationBanner('Please enter all 6 numbers');
      return;
    }

    const numbersCheck = validateTicketNumbers(selectedGame, nums, bonus);
    if (!numbersCheck.valid) {
      showValidationBanner(numbersCheck.errors[0]);
      return;
    }

    const drawCheck = validateDrawDate(selectedGame, selectedDrawDate);
    if (!drawCheck.valid) {
      showValidationBanner(drawCheck.error!);
      return;
    }

    setStep(2);
    fetchMatchingPools(selectedGame);
  };

  // Save ticket
  const handleSaveTicket = async () => {
    if (!user?.id || !selectedGame) {
      showValidationBanner('You must be logged in');
      return;
    }
    if (!selectedPoolId) {
      showValidationBanner('Please select a pool');
      return;
    }

    const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
    const bonus = parseInt(bonusNumber);

    if (nums.length !== 5 || isNaN(bonus)) {
      showValidationBanner('Please enter all 6 numbers');
      return;
    }

    // Validate game type matches pool
    const poolGameType = matchingPools.find(p => p.id === selectedPoolId)?.game_type
      || pools.find(p => p.id === selectedPoolId)?.game_type as GameType | undefined;

    if (poolGameType) {
      const poolCheck = validateTicketForPool(poolGameType, selectedGame);
      if (!poolCheck.valid) {
        showValidationBanner(poolCheck.error!);
        return;
      }
    }

    const numbersCheck = validateTicketNumbers(selectedGame, nums, bonus);
    if (!numbersCheck.valid) {
      showValidationBanner(numbersCheck.errors[0]);
      return;
    }

    const drawCheck = validateDrawDate(selectedGame, selectedDrawDate);
    if (!drawCheck.valid) {
      showValidationBanner(drawCheck.error!);
      return;
    }

    setIsSaving(true);
    setValidationError(null);

    const { data: ticket, error: saveError } = await addTicket({
      pool_id: selectedPoolId,
      game_type: selectedGame,
      numbers: nums,
      bonus_number: bonus,
      multiplier: multiplier > 0 ? multiplier : null,
      draw_date: selectedDrawDate,
      entered_by: user.id,
      entry_method: 'manual',
    }, poolGameType);

    if (saveError || !ticket) {
      showValidationBanner(saveError || 'Failed to create ticket');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setSaveSuccess(true);

    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE'],
      });
    }

    setTimeout(() => onClose(), 1200);
  };

  const gameColor = selectedGame === 'powerball' ? '#E29578' : '#006D77';

  // ──────────────────────────────────────────────
  // STEP 2 — Pool Picker
  // ──────────────────────────────────────────────
  if (step === 2 && selectedGame) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        className="fixed inset-0 z-[200] bg-white flex flex-col"
      >
      <div className="w-full max-w-xl mx-auto flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="px-4 sm:px-6 flex items-center gap-3 border-b border-[#FFDDD2]" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))', paddingBottom: '1rem' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setStep(1)}
            className="p-2.5 rounded-xl bg-[#EDF6F9] text-[#006D77] border border-[#FFDDD2]"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </motion.button>
          <h2 className="text-lg font-black text-[#006D77]">Choose Pool</h2>
        </div>

        {/* Game type filter badge */}
        <div className="px-4 sm:px-6 pt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white ${
              selectedGame === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'
            }`}
          >
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/20 flex items-center justify-center text-[6px] sm:text-[7px] font-black leading-none">
              {selectedGame === 'powerball' ? 'PB' : 'MM'}
            </span>
            {selectedGame === 'powerball' ? 'Powerball' : 'Mega Millions'}
          </span>
          <span className="text-[10px] sm:text-xs text-[#83C5BE] font-bold">
            Showing {selectedGame === 'powerball' ? 'Powerball' : 'Mega Millions'} pools
          </span>
        </div>

        {/* Validation error banner */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={() => setValidationError(null)}
              className="mx-4 sm:mx-6 mt-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-start gap-2 cursor-pointer"
            >
              <AlertTriangle size={16} className="text-[#991B1B] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-bold text-[#991B1B]">{validationError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pool list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
          {poolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#83C5BE] animate-spin" />
            </div>
          ) : matchingPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EDF6F9] flex items-center justify-center mb-4 border border-[#FFDDD2]">
                <Sparkles size={24} className="text-[#83C5BE]" />
              </div>
              <p className="text-base font-black text-[#006D77] mb-1">
                No {selectedGame === 'powerball' ? 'Powerball' : 'Mega Millions'} pools yet
              </p>
              <p className="text-xs text-[#83C5BE] font-bold">Create one to get started</p>
            </div>
          ) : (
            matchingPools.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPoolId(p.id)}
                className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 text-left transition-all ${
                  selectedPoolId === p.id
                    ? 'border-2 border-[#006D77] bg-white shadow-lg'
                    : 'bg-[#EDF6F9] border border-[#FFDDD2]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm sm:text-base text-[#006D77] truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-white ${
                        p.game_type === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'
                      }`}
                    >
                      {p.game_type === 'powerball' ? 'PB' : 'MM'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs text-[#83C5BE] font-bold">
                      <Users size={10} />
                      {p.members_count || 0}
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedPoolId === p.id
                    ? 'border-[#006D77] bg-[#006D77]'
                    : 'border-[#FFDDD2]'
                }`}>
                  {selectedPoolId === p.id && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 sm:p-6 border-t border-[#FFDDD2] space-y-2 sm:space-y-3 safe-area-bottom">
          {saveSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-green-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2"
            >
              <Check size={20} strokeWidth={3} />
              Saved!
            </motion.div>
          ) : (
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
                  Save to Pool
                  <Check size={18} strokeWidth={3} />
                </>
              )}
            </motion.button>
          )}
          {onCreatePool && !saveSuccess && (
            <button
              onClick={() => { onClose(); onCreatePool(selectedGame || undefined); }}
              className="w-full py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] bg-white border-2 border-[#006D77] text-[#006D77] font-black text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              Create New Pool
            </button>
          )}
        </div>
      </div>
      </motion.div>
    );
  }

  // ──────────────────────────────────────────────
  // STEP 1 — Number Entry
  // ──────────────────────────────────────────────
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 150 }}
      className="fixed inset-0 z-[200] bg-white flex flex-col"
    >
      <div className="w-full max-w-xl mx-auto flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 sm:px-6 flex items-center gap-3 border-b border-[#FFDDD2]" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))', paddingBottom: '1rem' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2.5 rounded-xl bg-[#EDF6F9] text-[#006D77] border border-[#FFDDD2]"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </motion.button>
        <h2 className="text-lg font-black text-[#006D77]">Enter Ticket</h2>
      </div>

      {/* Validation error banner */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={() => setValidationError(null)}
            className="mx-4 sm:mx-6 mt-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-start gap-2 cursor-pointer"
          >
            <AlertTriangle size={16} className="text-[#991B1B] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-bold text-[#991B1B]">{validationError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Game Type Selector */}
        <div>
          <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-2 block">
            Game Type
          </label>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => { setSelectedGame('powerball'); setMultiplier(0); }}
              className={`flex-1 py-3 sm:py-3.5 rounded-[1.5rem] sm:rounded-[2rem] font-black text-xs sm:text-sm transition-all ${
                selectedGame === 'powerball'
                  ? 'bg-[#E29578] text-white shadow-lg shadow-[#FFDDD2]'
                  : 'bg-[#EDF6F9] border border-[#FFDDD2] text-[#006D77]'
              }`}
            >
              Powerball
            </button>
            <button
              onClick={() => { setSelectedGame('mega_millions'); setMultiplier(0); }}
              className={`flex-1 py-3 sm:py-3.5 rounded-[1.5rem] sm:rounded-[2rem] font-black text-xs sm:text-sm transition-all ${
                selectedGame === 'mega_millions'
                  ? 'bg-[#006D77] text-white shadow-lg shadow-[#83C5BE]/30'
                  : 'bg-[#EDF6F9] border border-[#FFDDD2] text-[#006D77]'
              }`}
            >
              Mega Millions
            </button>
          </div>
        </div>

        {selectedGame && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Numbers */}
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-3 block">
                Pick 5 Numbers
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {numbers.map((num, i) => (
                  <motion.div key={i} className="flex flex-col items-center">
                    <motion.input
                      whileFocus={{ scale: 1.08 }}
                      ref={(el) => { numberInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={num}
                      onChange={(e) => handleNumberChange(i, e.target.value)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 bg-[#EDF6F9] text-center text-lg sm:text-xl font-black text-[#006D77] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        fieldErrors[`num-${i}`] || duplicateIndices.has(i)
                          ? 'border-red-400 bg-red-50'
                          : 'border-[#FFDDD2] focus:border-[#006D77] focus:shadow-lg'
                      }`}
                      placeholder="#"
                      maxLength={2}
                    />
                    {fieldErrors[`num-${i}`] ? (
                      <span className="text-[8px] text-red-600 font-bold mt-1">{fieldErrors[`num-${i}`]}</span>
                    ) : duplicateIndices.has(i) ? (
                      <span className="text-[8px] text-red-600 font-bold mt-1">Duplicate</span>
                    ) : (
                      <span className="text-[8px] text-[#83C5BE] font-bold mt-1">1-{GAME_RULES[selectedGame]?.mainMax ?? 69}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bonus Number */}
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-3 block">
                {GAME_RULES[selectedGame]?.bonusName ?? 'Bonus'}
              </label>
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <motion.input
                    whileFocus={{ scale: 1.08 }}
                    ref={bonusInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={bonusNumber}
                    onChange={(e) => handleBonusChange(e.target.value)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 text-center text-lg sm:text-xl font-black outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      fieldErrors['bonus']
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : selectedGame === 'powerball'
                          ? 'border-[#E29578] bg-[#EDF6F9] text-[#E29578] focus:bg-[#FFDDD2]/20 focus:shadow-lg'
                          : 'border-[#006D77] bg-[#EDF6F9] text-[#006D77] focus:bg-[#83C5BE]/20 focus:shadow-lg'
                    }`}
                    placeholder="#"
                    maxLength={2}
                  />
                  {fieldErrors['bonus'] ? (
                    <span className="text-[8px] text-red-600 font-bold mt-1">{fieldErrors['bonus']}</span>
                  ) : (
                    <span className="text-[8px] text-[#83C5BE] font-bold mt-1">1-{GAME_RULES[selectedGame]?.bonusMax ?? 26}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Multiplier Toggle */}
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-3 block">
                {MULTIPLIER_OPTIONS[selectedGame]?.label ?? 'Multiplier'}
              </label>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {(MULTIPLIER_OPTIONS[selectedGame]?.values ?? []).map((val) => (
                  <button
                    key={val}
                    onClick={() => setMultiplier(val)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                      multiplier === val
                        ? `text-white shadow-md ${selectedGame === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'}`
                        : 'bg-[#EDF6F9] border border-[#FFDDD2] text-[#006D77]'
                    }`}
                  >
                    {val === 0 ? 'Off' : `x${val}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Date Picker */}
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-3 block">
                Draw Date
              </label>
              {upcomingDates.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {upcomingDates.map((date) => {
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    const isSelected = selectedDrawDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDrawDate(dateStr)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${
                          isSelected
                            ? `text-white shadow-md ${selectedGame === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'}`
                            : 'bg-[#EDF6F9] border border-[#FFDDD2] text-[#006D77]'
                        }`}
                      >
                        {formatDrawDate(date)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#83C5BE] font-bold text-center">No upcoming draws available</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="p-4 sm:p-6 border-t border-[#FFDDD2] safe-area-bottom">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleGoToStep2}
          disabled={!isStep1Valid()}
          className="w-full py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:shadow-none"
        >
          Next: Choose Pool
          <ArrowRight size={18} strokeWidth={3} />
        </motion.button>
      </div>
      </div>
    </motion.div>
  );
};

export default ManualTicketEntry;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ArrowRight, Loader2, Trophy, X } from 'lucide-react';
import { getLatestDraws, getDrawHistory, formatJackpot, formatDrawDate, LotteryDraw } from '../services/lottery';
import { checkTicketsForDraw, WinResult } from '../services/pools';
interface TheBoardProps {
  onOpenPool?: (poolId: string) => void;
}
const GameLogo: React.FC<{ game: string }> = ({ game }) => (
  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-white text-[10px] sm:text-xs ${game === 'Powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'}`}>
    {game === 'Powerball' ? 'PB' : 'MM'}
  </div>
);
const GameCard: React.FC<{
  game: string;
  date: string;
  jackpot: string;
  numbers: number[];
  bonus: number;
  isScanning?: boolean;
  showMatch?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}> = ({ game, date, jackpot, numbers, bonus, isScanning, showMatch, onClick, isLoading }) => (
  <motion.div
    variants={{
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }}
    onClick={onClick}
    className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border border-[#83C5BE]/30 warm-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
  >
    <div className="flex justify-between items-start mb-4 sm:mb-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <GameLogo game={game} />
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">{game}</h3>
          <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest leading-none mt-0.5">Official Result</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">{date}</p>
        <div className="flex items-center gap-1 text-[#E29578] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter">Manage Pool</span>
          <ArrowRight size={10} />
        </div>
      </div>
    </div>
    <div className="text-center mb-6 sm:mb-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-10">
          <Loader2 size={24} className="animate-spin text-[#83C5BE]" />
        </div>
      ) : (
        <motion.p 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl sm:text-4xl font-black text-[#E29578] tracking-tighter"
        >
          {jackpot}
        </motion.p>
      )}
      <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em] mt-1">Est. Jackpot</p>
    </div>
    <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <div key={i} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EDF6F9] animate-pulse" />
        ))
      ) : (
        numbers.map((num, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm sm:text-base border-2 relative overflow-hidden
              ${isScanning ? 'animate-pulse bg-[#FFDDD2] border-[#E29578] text-[#E29578]' :
                showMatch && i === 2 ? 'bg-[#006D77] border-[#006D77] text-white' :
                'bg-white border-[#FFDDD2] text-[#006D77]'}`}
          >
            {num.toString().padStart(2, '0')}
          </motion.div>
        ))
      )}
      {isLoading ? (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FFDDD2] animate-pulse" />
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm sm:text-base border-2
            ${game === 'Powerball' ? 'bg-[#E29578] border-[#E29578] text-white' : 'bg-[#006D77] border-[#006D77] text-white'}`}
        >
          {bonus.toString().padStart(2, '0')}
        </motion.div>
      )}
    </div>
    {showMatch && !isLoading && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-xs sm:text-sm font-black text-[#006D77]">1 Number Matched!</p>
      </motion.div>
    )}
  </motion.div>
);
const TheBoard: React.FC<TheBoardProps> = ({ onOpenPool }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [powerball, setPowerball] = useState<LotteryDraw | null>(null);
  const [megaMillions, setMegaMillions] = useState<LotteryDraw | null>(null);
  const [history, setHistory] = useState<LotteryDraw[]>([]);
  const [checkResults, setCheckResults] = useState<{ wins: WinResult[]; checkedCount: number } | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const latest = await getLatestDraws();
        setPowerball(latest.powerball);
        setMegaMillions(latest.megaMillions);
        const pbHistory = await getDrawHistory('powerball', 5);
        const mmHistory = await getDrawHistory('mega_millions', 5);
        const combined = [...pbHistory, ...mmHistory]
          .sort((a, b) => new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime())
          .slice(0, 5);
        setHistory(combined);
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  const handleCheckTickets = async () => {
    setIsChecking(true);
    setShowMatch(false);
    setCheckResults(null);
    try {
      // Check both Powerball and Mega Millions
      const pbResults = await checkTicketsForDraw('powerball');
      const mmResults = await checkTicketsForDraw('mega_millions');
      const totalWins = [...pbResults.wins, ...mmResults.wins];
      const totalChecked = pbResults.checkedCount + mmResults.checkedCount;
      setCheckResults({ wins: totalWins, checkedCount: totalChecked });
      if (totalWins.length > 0) {
        // Trigger confetti for wins!
        if (typeof (window as any).confetti === 'function') {
          (window as any).confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#E29578', '#FFDDD2', '#006D77', '#83C5BE']
          });
        }
      }
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error checking tickets:', error);
    } finally {
      setIsChecking(false);
    }
  };
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.15 } }
      }}
      className="space-y-8 sm:space-y-10 pt-8 sm:pt-12 pb-32 md:pb-12"
    >
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="px-2">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-[#006D77]">The Board</h2>
        <p className="text-xs sm:text-sm font-bold text-[#83C5BE] mt-1">Draws updated in real-time</p>
      </motion.div>
      <div className="space-y-4 sm:space-y-6">
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 sm:space-y-6 md:space-y-0">
          <GameCard
            game="Powerball"
            date={powerball ? formatDrawDate(powerball.draw_date) : 'Loading...'}
            jackpot={powerball ? formatJackpot(powerball.jackpot_amount) : 'Loading...'}
            numbers={powerball?.winning_numbers || [0, 0, 0, 0, 0]}
            bonus={powerball?.bonus_number || 0}
            isScanning={isChecking}
            showMatch={showMatch}
            isLoading={isLoading}
            onClick={() => onOpenPool?.('2')}
          />
          <GameCard
            game="Mega Millions"
            date={megaMillions ? formatDrawDate(megaMillions.draw_date) : 'Loading...'}
            jackpot={megaMillions ? formatJackpot(megaMillions.jackpot_amount) : 'Loading...'}
            numbers={megaMillions?.winning_numbers || [0, 0, 0, 0, 0]}
            bonus={megaMillions?.bonus_number || 0}
            isScanning={isChecking}
            showMatch={showMatch}
            isLoading={isLoading}
            onClick={() => onOpenPool?.('1')}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckTickets}
          disabled={isLoading || isChecking}
          className="w-full md:max-w-md md:mx-auto py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-[#83C5BE]/20 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
        >
          {isChecking ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Checking Syndicate Tickets...
            </>
          ) : (
            <>
              <Search size={18} strokeWidth={3} />
              Check My Pool's Tickets
            </>
          )}
        </motion.button>
      </div>
      <motion.section variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight ml-2">Recent Draws</h3>
        <div className="space-y-3 sm:space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {isLoading ? (
            Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] animate-pulse">
                <div className="h-4 bg-[#EDF6F9] rounded w-1/4 mb-2" />
                <div className="flex gap-1.5">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-[#EDF6F9]" />
                  ))}
                </div>
              </div>
            ))
          ) : history.length === 0 ? (
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#FFDDD2] text-center">
              <p className="text-sm text-[#83C5BE] font-medium">No draw history yet</p>
            </div>
          ) : (
            history.map((draw) => (
              <div 
                key={draw.id} 
                onClick={() => onOpenPool?.(draw.id)}
                className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${draw.game_type === 'powerball' ? 'bg-[#FFDDD2] text-[#E29578]' : 'bg-[#EDF6F9] text-[#006D77]'}`}>
                      {draw.game_type === 'powerball' ? 'PB' : 'MM'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-widest">
                      {formatDrawDate(draw.draw_date)}
                    </span>
                  </div>
                  <div className="flex gap-1 sm:gap-1.5 mt-1">
                    {draw.winning_numbers.map((n, i) => (
                      <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#EDF6F9] border border-[#FFDDD2] flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-[#006D77]">
                        {n}
                      </div>
                    ))}
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white ${draw.game_type === 'powerball' ? 'bg-[#E29578]' : 'bg-[#006D77]'}`}>
                      {draw.bonus_number}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-black text-[#83C5BE]">
                    {formatJackpot(draw.jackpot_amount)}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <span className="text-[7px] sm:text-[8px] font-black text-[#83C5BE] uppercase tracking-widest">View Details</span>
                    <ChevronRight size={12} className="text-[#83C5BE]" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>
      {/* Results Modal */}
      <AnimatePresence>
        {showResultsModal && checkResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowResultsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${checkResults.wins.length > 0 ? 'bg-[#E29578]' : 'bg-[#83C5BE]'}`}>
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#006D77]">
                      {checkResults.wins.length > 0 ? 'Winner!' : 'Results'}
                    </h3>
                    <p className="text-xs text-[#83C5BE] font-bold">
                      {checkResults.checkedCount} ticket{checkResults.checkedCount !== 1 ? 's' : ''} checked
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 rounded-xl hover:bg-[#EDF6F9]"
                >
                  <X size={20} className="text-[#83C5BE]" />
                </button>
              </div>
              {checkResults.checkedCount === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[#83C5BE] font-medium">No unchecked tickets found for the latest draws.</p>
                  <p className="text-sm text-[#83C5BE]/70 mt-2">Add tickets to your pools to check them!</p>
                </div>
              ) : checkResults.wins.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[#006D77] font-bold text-lg">No wins this time</p>
                  <p className="text-sm text-[#83C5BE] mt-2">Keep playing - your lucky numbers are coming!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkResults.wins.map((win, idx) => (
                    <div key={idx} className="bg-[#EDF6F9] p-4 rounded-xl border border-[#FFDDD2]">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-black text-[#006D77] capitalize">
                            {win.prizeTier?.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-[#83C5BE]">
                            {win.numbersMatched} numbers{win.bonusMatched ? ' + bonus' : ''}
                          </p>
                        </div>
                        <p className="text-xl font-black text-[#E29578]">
                          ${win.prizeAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowResultsModal(false)}
                className="w-full mt-6 py-4 rounded-2xl bg-[#006D77] text-white font-black"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default TheBoard;

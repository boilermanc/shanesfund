import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Frown, ChevronRight } from 'lucide-react';
import { getLatestDraws, formatDrawDate, LotteryDraw } from '../services/lottery';
import { getTicketsByDrawDate } from '../services/tickets';
import { checkTicketsForDraw, WinResult } from '../services/pools';
import { supabase } from '../lib/supabase';
import type { PoolWithMembers } from '../services/pools';
import type { Winning, Ticket } from '../types/database';
import ShaneMascot from './ShaneMascot';

interface DrawResultsBannerProps {
  pools: PoolWithMembers[];
  onPoolClick: (poolId: string) => void;
}

interface DrawResult {
  draw: LotteryDraw;
  pool: PoolWithMembers;
  tickets: Ticket[];
  wins: Winning[];
  clientWins: WinResult[];
}

const GAME_NAMES: Record<string, string> = {
  powerball: 'Powerball',
  mega_millions: 'Mega Millions',
};

function isDismissed(drawDate: string, gameType: string): boolean {
  try {
    return localStorage.getItem(`dismissed-draw-${gameType}-${drawDate}`) === '1';
  } catch {
    return false;
  }
}

function dismiss(drawDate: string, gameType: string) {
  try {
    localStorage.setItem(`dismissed-draw-${gameType}-${drawDate}`, '1');
  } catch {
    // localStorage unavailable
  }
}

function isRecent(drawDate: string): boolean {
  const drawTime = new Date(drawDate + 'T23:59:00').getTime();
  const now = Date.now();
  const hoursAgo = (now - drawTime) / (1000 * 60 * 60);
  // Show banner if draw was within last 36 hours
  return hoursAgo >= 0 && hoursAgo <= 36;
}

const DrawResultsBanner: React.FC<DrawResultsBannerProps> = ({ pools, onPoolClick }) => {
  const [results, setResults] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      setLoading(true);
      try {
        const { powerball, megaMillions } = await getLatestDraws();
        const draws: LotteryDraw[] = [];
        if (powerball) draws.push(powerball);
        if (megaMillions) draws.push(megaMillions);

        const drawResults: DrawResult[] = [];

        for (const draw of draws) {
          if (!isRecent(draw.draw_date)) continue;
          if (isDismissed(draw.draw_date, draw.game_type)) continue;

          // Find user pools matching this game type
          const matchingPools = pools.filter(
            (p) => p.game_type === draw.game_type && p.status === 'active'
          );
          if (matchingPools.length === 0) continue;

          for (const pool of matchingPools) {
            // Get tickets for this pool + draw date
            const { data: tickets } = await getTicketsByDrawDate(pool.id, draw.draw_date);
            if (!tickets || tickets.length === 0) continue;

            const allChecked = tickets.every((t) => t.checked);
            let wins: Winning[] = [];
            let clientWins: WinResult[] = [];

            if (allChecked) {
              // Tickets already checked by cron — query winnings table
              const { data: winData } = await supabase
                .from('winnings')
                .select('*')
                .eq('pool_id', pool.id)
                .eq('draw_date', draw.draw_date);
              wins = (winData as Winning[]) || [];
            } else {
              // Cron hasn't run yet — check client-side as fallback
              const result = await checkTicketsForDraw(draw.game_type, draw, [pool]);
              clientWins = result.wins;
            }

            if (cancelled) return;

            drawResults.push({ draw, pool, tickets, wins, clientWins });
          }
        }

        if (!cancelled) {
          setResults(drawResults);
        }
      } catch (err) {
        console.error('[DrawResultsBanner] Error fetching results:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (pools.length > 0) {
      fetchResults();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [pools]);

  const handleDismiss = (drawDate: string, gameType: string) => {
    dismiss(drawDate, gameType);
    setDismissedKeys((prev) => new Set([...prev, `${gameType}-${drawDate}`]));
  };

  // Filter out dismissed results
  const visibleResults = results.filter(
    (r) => !dismissedKeys.has(`${r.draw.game_type}-${r.draw.draw_date}`)
  );

  if (loading) {
    // Brief skeleton — only show if pools exist
    if (pools.length === 0) return null;
    return (
      <div className="px-2">
        <div className="rounded-[2rem] p-6 bg-white/60 border border-[#83C5BE]/20 animate-pulse">
          <div className="h-4 bg-[#EDF6F9] rounded w-1/3 mb-3" />
          <div className="h-8 bg-[#EDF6F9] rounded w-2/3 mb-4" />
          <div className="flex gap-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#EDF6F9]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visibleResults.length === 0) return null;

  return (
    <div className="space-y-4 px-2">
      <AnimatePresence mode="popLayout">
        {visibleResults.map((result) => {
          const { draw, pool, wins, clientWins } = result;
          const isPB = draw.game_type === 'powerball';
          const gameName = GAME_NAMES[draw.game_type] || draw.game_type;
          const allWins = [...wins, ...clientWins.map((cw) => ({
            prize_amount: cw.prizeAmount,
            prize_tier: cw.prizeTier,
            numbers_matched: cw.numbersMatched,
            bonus_matched: cw.bonusMatched,
          }))];
          const hasWin = allWins.length > 0;
          const totalPrize = allWins.reduce(
            (sum, w) => sum + (('prize_amount' in w ? w.prize_amount : 0) || 0),
            0
          );

          return (
            <motion.div
              key={`${draw.game_type}-${draw.draw_date}-${pool.id}`}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => onPoolClick(pool.id)}
              className={`relative rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border-2 warm-shadow cursor-pointer active:scale-[0.98] transition-transform overflow-hidden ${
                hasWin
                  ? 'bg-gradient-to-br from-[#FFF8F0] via-[#FFDDD2]/60 to-[#E29578]/20 border-[#E29578]/60'
                  : isPB
                    ? 'bg-gradient-to-br from-[#FFF8F6] to-[#FFDDD2]/30 border-[#E29578]/30'
                    : 'bg-gradient-to-br from-[#F0FAFB] to-[#83C5BE]/15 border-[#006D77]/25'
              }`}
            >
              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(draw.draw_date, draw.game_type);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 transition-colors z-10"
                aria-label="Dismiss"
              >
                <X size={16} className="text-[#83C5BE]" />
              </button>

              {/* Header row */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5 pr-8">
                <div className="flex-shrink-0 mt-0.5">
                  <ShaneMascot size="xs" expression={hasWin ? 'excited' : 'sad'} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isPB ? 'bg-[#FFDDD2] text-[#E29578]' : 'bg-[#EDF6F9] text-[#006D77]'
                    }`}>
                      {gameName}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] uppercase tracking-wider">
                      {formatDrawDate(draw.draw_date)}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-[#006D77]/60 mt-1 truncate">
                    {pool.name}
                  </p>
                </div>
              </div>

              {/* Result message */}
              <div className="text-center mb-4 sm:mb-5">
                {hasWin ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Trophy size={20} className="text-[#E29578]" />
                      <p className="text-lg sm:text-xl font-black text-[#006D77]">Winner!</p>
                    </div>
                    {totalPrize > 0 && (
                      <p className="text-2xl sm:text-3xl font-black text-[#E29578] tracking-tight">
                        ${totalPrize.toLocaleString()}
                      </p>
                    )}
                    <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] mt-1">
                      {allWins.length} winning ticket{allWins.length !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base sm:text-lg font-black text-[#006D77]/80">No matches this draw</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] mt-1">
                      Better luck next time — keep playing!
                    </p>
                  </>
                )}
              </div>

              {/* Winning numbers */}
              <div className="mb-4">
                <p className={`text-center text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-2 ${
                  isPB ? 'text-[#E29578]/50' : 'text-[#006D77]/40'
                }`}>
                  Winning Numbers
                </p>
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {draw.winning_numbers.map((num, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 ${
                        isPB
                          ? 'bg-white border-[#E29578]/30 text-[#E29578]'
                          : 'bg-white border-[#006D77]/30 text-[#006D77]'
                      }`}
                    >
                      {num.toString().padStart(2, '0')}
                    </div>
                  ))}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 text-white ${
                      isPB ? 'bg-[#E29578] border-[#E29578]' : 'bg-[#006D77] border-[#006D77]'
                    }`}
                  >
                    {draw.bonus_number.toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Footer — tap to view */}
              <div className={`flex items-center justify-center gap-1 ${
                isPB ? 'text-[#E29578]/60' : 'text-[#006D77]/50'
              }`}>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                  View Pool Details
                </span>
                <ChevronRight size={12} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default DrawResultsBanner;

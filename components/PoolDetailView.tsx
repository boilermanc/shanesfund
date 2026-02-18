import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Crown,
  Share2,
  Check,
  Plus,
  Loader2,
  Camera,
  Keyboard,
  Trophy,
  Copy,
  ChevronDown,
  ChevronUp,
  Archive,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPool, unarchivePool } from '../services/pools';
import type { PoolWithMembers } from '../services/pools';
import type { TicketWithUser, Winning } from '../types/database';
import ArchivePoolModal from './ArchivePoolModal';
import { useStore } from '../store/useStore';
import { getNextDrawDate, getDrawSchedule, isDrawClosed, formatDrawDate } from '../utils/drawSchedule';
import FocusTrap from './FocusTrap';

interface PoolMemberDisplay {
  id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  users?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
}

interface PoolDetailViewProps {
  poolId: string;
  onClose: () => void;
  onScanTicket?: (poolContext: { id: string; name: string; game_type: 'powerball' | 'mega_millions' }) => void;
  onManualEntry?: () => void;
  onOpenLedger?: () => void;
}

const PRIZE_TIER_LABELS: Record<string, string> = {
  jackpot: 'Jackpot!',
  match_5: 'Match 5',
  match_4_bonus: 'Match 4 + Bonus',
  match_4: 'Match 4',
  match_3_bonus: 'Match 3 + Bonus',
  match_3: 'Match 3',
  match_2_bonus: 'Match 2 + Bonus',
  match_1_bonus: 'Match 1 + Bonus',
  match_bonus: 'Bonus Only',
};

function getCountdown(gameType: 'powerball' | 'mega_millions') {
  const nextDraw = getNextDrawDate(gameType);
  const drawHour = gameType === 'powerball' ? 22 : 23;
  const drawMinute = gameType === 'powerball' ? 59 : 0;
  const drawTime = new Date(nextDraw);
  drawTime.setHours(drawHour, drawMinute, 0, 0);

  const now = new Date();
  const diff = Math.max(0, drawTime.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDrawStatus(
  drawDate: string,
  drawTickets: TicketWithUser[],
  gameType: 'powerball' | 'mega_millions'
): { color: string; label: string; icon?: 'clock' | 'check' | 'winner' | 'miss' } {
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  if (drawDate > todayET) {
    return { color: '#3B82F6', label: 'Upcoming' };
  }

  if (drawDate === todayET && !isDrawClosed(gameType, drawDate)) {
    return { color: '#F59E0B', label: 'Tonight' };
  }

  // Past or closed draw
  const allChecked = drawTickets.every((t) => t.checked);
  if (!allChecked) {
    return { color: '#E29578', label: 'Awaiting Results', icon: 'clock' };
  }

  if (drawTickets.some((t) => t.is_winner)) {
    return { color: '#10B981', label: 'Winner!', icon: 'winner' };
  }

  return { color: '#9CA3AF', label: 'No Match', icon: 'miss' };
}

function groupTicketsByDraw(tickets: TicketWithUser[]): [string, TicketWithUser[]][] {
  const groups = new Map<string, TicketWithUser[]>();
  for (const ticket of tickets) {
    const key = ticket.draw_date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ticket);
  }
  return Array.from(groups.entries());
}

const PoolDetailView: React.FC<PoolDetailViewProps> = ({ poolId, onClose, onScanTicket, onManualEntry, onOpenLedger }) => {
  const { user } = useStore();
  const [pool, setPool] = useState<PoolWithMembers | null>(null);
  const [members, setMembers] = useState<PoolMemberDisplay[]>([]);
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [winnings, setWinnings] = useState<Winning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [winningsError, setWinningsError] = useState<string | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [winningsLoading, setWinningsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [infoCopied, setInfoCopied] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [fabOpen, setFabOpen] = useState(false);
  const [poolInfoOpen, setPoolInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);

  // Reusable fetch helpers for initial load + retry
  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, users!entered_by(display_name)')
      .eq('pool_id', poolId)
      .order('draw_date', { ascending: false })
      .order('created_at', { ascending: false });
    return { data: (data as TicketWithUser[]) || [], error: error?.message || null };
  }, [poolId]);

  const fetchWinnings = useCallback(async () => {
    const { data, error } = await supabase
      .from('winnings')
      .select('*')
      .eq('pool_id', poolId)
      .order('draw_date', { ascending: false });
    return { data: data || [], error: error?.message || null };
  }, [poolId]);

  // Fetch all data on mount with Promise.all
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [poolResult, ticketsResult, winningsResult] = await Promise.all([
        getPool(poolId),
        fetchTickets(),
        fetchWinnings(),
      ]);

      if (poolResult.error || !poolResult.data) {
        setError(poolResult.error || 'Pool not found');
        setLoading(false);
        return;
      }
      setPool(poolResult.data);
      setMembers(poolResult.data.pool_members || []);

      if (ticketsResult.error) {
        setTicketsError(ticketsResult.error);
      } else {
        setTickets(ticketsResult.data);
      }

      if (winningsResult.error) {
        setWinningsError(winningsResult.error);
      } else {
        setWinnings(winningsResult.data);
      }

      setLoading(false);
    };
    loadData();
  }, [poolId, fetchTickets, fetchWinnings]);

  // Retry handlers
  const retryTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    const { data, error } = await fetchTickets();
    if (error) setTicketsError(error);
    else setTickets(data);
    setTicketsLoading(false);
  };

  const retryWinnings = async () => {
    setWinningsLoading(true);
    setWinningsError(null);
    const { data, error } = await fetchWinnings();
    if (error) setWinningsError(error);
    else setWinnings(data);
    setWinningsLoading(false);
  };

  // Countdown timer — updates every minute
  useEffect(() => {
    if (!pool?.game_type) return;

    const update = () => {
      setCountdown(getCountdown(pool.game_type));
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [pool?.game_type]);

  const refreshPool = useCallback(async () => {
    const result = await getPool(poolId);
    if (result.data) {
      setPool(result.data);
      setMembers(result.data.pool_members || []);
    }
  }, [poolId]);

  const handleUnarchive = useCallback(async () => {
    setUnarchiving(true);
    const { error: err } = await unarchivePool(poolId);
    if (!err) {
      await refreshPool();
    }
    setUnarchiving(false);
    setSettingsOpen(false);
  }, [poolId, refreshPool]);

  const handleShareInvite = useCallback(async () => {
    if (!pool?.invite_code) return;
    try {
      await navigator.clipboard.writeText(pool.invite_code);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pool.invite_code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pool?.invite_code]);

  const handleCopyInviteCode = useCallback(async () => {
    if (!pool?.invite_code) return;
    try {
      await navigator.clipboard.writeText(pool.invite_code);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pool.invite_code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(textArea);
    }
    setInfoCopied(true);
    setTimeout(() => setInfoCopied(false), 2000);
  }, [pool?.invite_code]);

  const isCaptain = user?.id === pool?.captain_id;
  const isArchived = pool?.status === 'archived';
  const isPowerball = pool?.game_type === 'powerball';
  const gameTypeLabel = isPowerball ? 'Powerball' : 'Mega Millions';
  const gameTypeColor = isPowerball ? '#E29578' : '#006D77';

  // Format next draw date like "Wednesday, Feb 19"
  const nextDraw = pool?.game_type ? getNextDrawDate(pool.game_type) : null;
  const schedule = pool?.game_type ? getDrawSchedule(pool.game_type) : null;
  const drawDateFormatted = nextDraw
    ? nextDraw.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : '';

  // Sort members: captain first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'captain') return -1;
    if (b.role === 'captain') return 1;
    return 0;
  });

  // Group tickets by draw date
  const ticketGroups = groupTicketsByDraw(tickets);

  // Total winnings
  const totalWinnings = winnings.reduce((sum, w) => sum + (Number(w.prize_amount) || 0), 0);

  // Captain info for Pool Info section
  const captain = members.find(m => m.role === 'captain');
  const captainName = captain?.users?.display_name || captain?.users?.email || 'Unknown';

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[550] bg-white flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Pool details"
      >
        {/* Fixed Header */}
        <header
          className="px-4 sm:px-6 pb-3 sm:pb-4 flex items-center gap-3 bg-white border-b border-[#EDF6F9] safe-area-top"
          style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))' }}
        >
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#006D77] hover:bg-[#EDF6F9] transition-colors shrink-0"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight truncate">
              {loading ? 'Loading...' : pool?.name || 'Pool'}
            </h2>
            {pool && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shrink-0"
                style={{ backgroundColor: gameTypeColor }}
              >
                {gameTypeLabel}
              </span>
            )}
          </div>

          {isCaptain && (
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-xl text-[#83C5BE] hover:bg-[#EDF6F9] transition-colors shrink-0"
                aria-label="Pool settings"
              >
                <Settings size={20} />
              </button>

              {/* Settings dropdown */}
              <AnimatePresence>
                {settingsOpen && (
                  <>
                    <div className="fixed inset-0 z-[50]" onClick={() => setSettingsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-[#FFDDD2] min-w-[180px] z-[51] overflow-hidden"
                    >
                      <button
                        onClick={() => { handleShareInvite(); setSettingsOpen(false); }}
                        className="w-full flex items-center gap-2.5 p-3 text-xs sm:text-sm font-bold text-[#006D77] hover:bg-[#EDF6F9] transition-colors"
                      >
                        <Share2 size={16} />
                        Share Invite Code
                      </button>
                      {!isArchived && (
                        <button
                          onClick={() => { setSettingsOpen(false); setShowArchiveModal(true); }}
                          className="w-full flex items-center gap-2.5 p-3 text-xs sm:text-sm font-bold text-[#E29578] hover:bg-[#EDF6F9] transition-colors"
                        >
                          <Archive size={16} />
                          Archive Pool
                        </button>
                      )}
                      {isArchived && (
                        <button
                          onClick={handleUnarchive}
                          disabled={unarchiving}
                          className="w-full flex items-center gap-2.5 p-3 text-xs sm:text-sm font-bold text-[#006D77] hover:bg-[#EDF6F9] transition-colors disabled:opacity-50"
                        >
                          {unarchiving ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          Unarchive Pool
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#EDF6F9]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-[#006D77]" size={28} />
            </div>
          ) : error ? (
            <div className="px-4 sm:px-6 pt-6">
              <div className="bg-[#FFDDD2] text-[#E29578] p-4 rounded-2xl text-center font-bold text-sm">
                {error}
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-32 md:pb-12 space-y-6 sm:space-y-8">

              {/* Archived banner */}
              {isArchived && (
                <div className="bg-[#F2E9D4] p-3 sm:p-4 rounded-xl flex items-center gap-3">
                  <Archive size={18} className="text-[#006D77] shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#006D77]">This pool is archived</p>
                    <p className="text-[10px] sm:text-xs text-[#006D77]/60 font-bold">No new tickets can be added</p>
                  </div>
                </div>
              )}

              {/* Section 1 — Next Draw Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 relative overflow-hidden"
                style={{
                  background: isPowerball
                    ? 'linear-gradient(135deg, #E29578 0%, #d4836a 100%)'
                    : 'linear-gradient(135deg, #006D77 0%, #004e56 100%)',
                }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />

                <div className="relative z-10">
                  <p className="text-[9px] sm:text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-2">
                    Next Draw
                  </p>
                  <p className="text-lg sm:text-xl font-black text-white mb-4 sm:mb-5">
                    {drawDateFormatted} {schedule ? `\u2022 ${schedule.cutoffTime}` : ''}
                  </p>

                  {/* Countdown or Archived state */}
                  {isArchived ? (
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-center mb-2">
                      <div className="flex items-center justify-center gap-2">
                        <Archive size={18} className="text-white/80" />
                        <p className="text-lg sm:text-xl font-black text-white">Pool Archived</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 sm:gap-4 mb-5 sm:mb-6">
                        {[
                          { value: countdown.days, label: 'Days' },
                          { value: countdown.hours, label: 'Hours' },
                          { value: countdown.minutes, label: 'Min' },
                        ].map(({ value, label }) => (
                          <div
                            key={label}
                            className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[60px] sm:min-w-[72px]"
                          >
                            <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{value}</p>
                            <p className="text-[8px] sm:text-[9px] font-bold text-white/60 uppercase tracking-widest">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add Ticket Button */}
                      {onScanTicket && pool && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onScanTicket({ id: pool.id, name: pool.name, game_type: pool.game_type })}
                          className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                          style={{ color: gameTypeColor }}
                        >
                          <Plus size={18} strokeWidth={3} />
                          Add Ticket
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Section 2 — Members */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-[#006D77]">Members</h3>
                    <span className="bg-white text-[#006D77] text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
                      {members.length}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShareInvite}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors"
                    style={{
                      backgroundColor: copied ? '#006D77' : 'white',
                      color: copied ? 'white' : '#006D77',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={12} strokeWidth={3} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 size={12} />
                        Share Invite
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Horizontal scrollable member avatars */}
                <div
                  className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {sortedMembers.map((member) => (
                    <div key={member.id} className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden">
                          {member.users?.avatar_url ? (
                            <img
                              src={member.users.avatar_url}
                              className="w-full h-full object-cover"
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#83C5BE]/20">
                              <span className="text-[#006D77] font-black text-base sm:text-lg">
                                {(member.users?.display_name || member.users?.email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Captain crown indicator */}
                        {member.role === 'captain' && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E29578] flex items-center justify-center border-2 border-white">
                            <Crown size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#006D77] text-center max-w-[64px] sm:max-w-[72px] truncate">
                        {member.users?.display_name || member.users?.email?.split('@')[0] || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Section 3 — Tickets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-black text-[#006D77]">Tickets</h3>
                  <span className="bg-[#006D77] text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
                    {tickets.length}
                  </span>
                </div>

                {ticketsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-[#FFDDD2]/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : ticketsError ? (
                  <div className="bg-[#FFDDD2]/50 rounded-xl sm:rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-[#E29578] mb-2">Failed to load tickets</p>
                    <button
                      onClick={retryTickets}
                      className="text-[10px] font-black text-[#006D77] uppercase tracking-wider underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-[#FFDDD2] p-8 text-center">
                    <Camera size={32} className="text-[#83C5BE] mx-auto mb-3" />
                    <p className="font-black text-[#006D77] mb-1">No tickets yet</p>
                    <p className="text-xs text-[#83C5BE] mb-4">Scan or enter your first ticket to get started</p>
                    {onScanTicket && pool && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onScanTicket({ id: pool.id, name: pool.name, game_type: pool.game_type })}
                        className="px-5 py-2.5 rounded-2xl bg-[#E29578] text-white font-black text-sm"
                      >
                        Scan Ticket
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {ticketGroups.map(([drawDate, drawTickets]) => {
                      const dateObj = new Date(drawDate + 'T12:00:00');
                      const dateLabel = formatDrawDate(dateObj) + ' Draw';
                      const status = pool ? getDrawStatus(drawDate, drawTickets, pool.game_type) : null;

                      return (
                        <div key={drawDate}>
                          {/* Draw date header */}
                          <div className="flex items-center gap-2 mb-2.5 ml-1">
                            {status?.icon === 'clock' && <Clock size={14} style={{ color: status.color }} className="shrink-0" />}
                            {status?.icon === 'winner' && <Trophy size={14} style={{ color: status.color }} className="shrink-0" />}
                            {status?.icon === 'miss' && <XCircle size={14} style={{ color: status.color }} className="shrink-0" />}
                            {!status?.icon && status && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: status.color }}
                              />
                            )}
                            <span className="text-xs sm:text-sm font-black text-[#006D77]">{dateLabel}</span>
                            {status && (
                              <span
                                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: status.color }}
                              >
                                {status.label}
                              </span>
                            )}
                          </div>

                          {/* Ticket cards */}
                          <div className="space-y-2.5">
                            {drawTickets.map((ticket, idx) => {
                              const isPast = drawDate <= new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
                              const isUnchecked = isPast && !ticket.checked;
                              const isWinner = ticket.checked && ticket.is_winner;
                              const isCheckedNoWin = ticket.checked && !ticket.is_winner;

                              return (
                              <motion.div
                                key={ticket.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                                  isWinner
                                    ? 'bg-[#10B981]/5 border-[#10B981]/30'
                                    : isUnchecked
                                    ? 'bg-[#F2E9D4]/30 border-dashed border-[#E29578]/40'
                                    : isCheckedNoWin
                                    ? 'bg-white border-[#EDF6F9] opacity-60'
                                    : 'bg-white border-[#FFDDD2]'
                                }`}
                              >
                                {/* Number balls */}
                                <div className="flex items-center gap-1 sm:gap-1.5 mb-2.5">
                                  {(Array.isArray(ticket.numbers) ? ticket.numbers : []).map((num: number, i: number) => (
                                    <div
                                      key={i}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-black flex items-center justify-center ${
                                        isWinner
                                          ? 'bg-[#10B981]/10 border-2 border-[#10B981] text-[#10B981]'
                                          : isUnchecked
                                          ? 'bg-white border-2 border-dashed border-[#E29578]/40 text-[#E29578]'
                                          : 'bg-white border-2 border-[#83C5BE] text-[#006D77]'
                                      }`}
                                    >
                                      {num}
                                    </div>
                                  ))}
                                  <span className="text-[#83C5BE] font-bold text-xs mx-0.5">+</span>
                                  <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-white text-xs sm:text-sm font-black flex items-center justify-center ${
                                      isWinner ? 'bg-[#10B981]' : ''
                                    }`}
                                    style={!isWinner ? { backgroundColor: isPowerball ? '#E29578' : '#006D77', opacity: isUnchecked ? 0.5 : 1 } : undefined}
                                  >
                                    {ticket.bonus_number}
                                  </div>
                                  {ticket.multiplier && ticket.multiplier > 1 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#E29578] text-white text-[9px] sm:text-[10px] font-black">
                                      x{ticket.multiplier}
                                    </span>
                                  )}
                                </div>

                                {/* Metadata row */}
                                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-[#83C5BE]">
                                  {ticket.entry_method === 'scan' ? (
                                    <Camera size={12} />
                                  ) : (
                                    <Keyboard size={12} />
                                  )}
                                  <span className="font-bold">
                                    by {ticket.users?.display_name || 'Unknown'}
                                  </span>
                                  <span className="text-[#83C5BE]/60">&middot;</span>
                                  <span>{getRelativeTime(ticket.created_at)}</span>
                                  {/* Per-ticket status indicator */}
                                  {isPast && (
                                    <>
                                      <span className="text-[#83C5BE]/60">&middot;</span>
                                      {isWinner ? (
                                        <span className="flex items-center gap-0.5 text-[#10B981] font-black">
                                          <Trophy size={10} /> Winner
                                        </span>
                                      ) : isUnchecked ? (
                                        <span className="flex items-center gap-0.5 text-[#E29578] font-bold">
                                          <Clock size={10} /> Pending
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-0.5 text-[#9CA3AF] font-bold">
                                          <CheckCircle2 size={10} /> Checked
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Section 4 — Winnings (only if there are winnings) */}
              {winningsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-[#FFDDD2]/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : winningsError ? (
                <div className="bg-[#FFDDD2]/50 rounded-xl sm:rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-[#E29578] mb-2">Failed to load winnings</p>
                  <button
                    onClick={retryWinnings}
                    className="text-[10px] font-black text-[#006D77] uppercase tracking-wider underline"
                  >
                    Retry
                  </button>
                </div>
              ) : winnings.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-[#10B981]" />
                      <h3 className="text-sm sm:text-base font-black text-[#006D77]">Winnings</h3>
                    </div>
                    <span className="text-sm sm:text-base font-black text-[#065F46]">
                      ${totalWinnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {winnings.map((win, idx) => {
                      const prizeAmt = Number(win.prize_amount) || 0;
                      const perMemberShare = members.length > 0
                        ? prizeAmt / members.length
                        : prizeAmt;
                      const drawDateObj = new Date(win.draw_date + 'T12:00:00');

                      return (
                        <motion.div
                          key={win.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gradient-to-r from-[#D1FAE5] to-[#ECFDF5] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#6EE7B7]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#065F46] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                              {PRIZE_TIER_LABELS[win.prize_tier] || win.prize_tier}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                              win.claimed
                                ? 'bg-[#10B981] text-white'
                                : 'bg-[#F59E0B] text-white'
                            }`}>
                              {win.claimed ? 'Claimed' : 'Unclaimed'}
                            </span>
                          </div>

                          <p className="text-2xl sm:text-3xl font-black text-[#065F46] tracking-tight mb-1">
                            ${prizeAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>

                          <p className="text-xs sm:text-sm font-bold text-[#065F46]/70 mb-2">
                            Your share: ${perMemberShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>

                          <p className="text-[9px] sm:text-[10px] text-[#065F46]/50 font-bold">
                            {formatDrawDate(drawDateObj)} Draw
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}

              {/* Section 5 — Pool Info (collapsible) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <button
                  onClick={() => setPoolInfoOpen(!poolInfoOpen)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <h3 className="text-sm sm:text-base font-black text-[#006D77]">Pool Info</h3>
                  {poolInfoOpen ? (
                    <ChevronUp size={18} className="text-[#83C5BE]" />
                  ) : (
                    <ChevronDown size={18} className="text-[#83C5BE]" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {poolInfoOpen && (
                    <motion.div
                      key="pool-info-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[#FFDDD2] mt-2">
                        {/* Invite Code */}
                        <div className="flex items-center justify-between py-2.5 border-b border-[#FFDDD2]/50">
                          <span className="text-xs sm:text-sm text-[#83C5BE] font-bold">Invite Code</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-black text-[#006D77] tracking-wider">
                              {pool?.invite_code}
                            </span>
                            <button
                              onClick={handleCopyInviteCode}
                              className={`p-1.5 rounded-lg transition-colors ${
                                infoCopied ? 'bg-[#006D77] text-white' : 'text-[#83C5BE] hover:bg-[#EDF6F9]'
                              }`}
                            >
                              {infoCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Created */}
                        <div className="flex items-center justify-between py-2.5 border-b border-[#FFDDD2]/50">
                          <span className="text-xs sm:text-sm text-[#83C5BE] font-bold">Created</span>
                          <span className="text-xs sm:text-sm font-bold text-[#006D77]">
                            {pool?.created_at
                              ? new Date(pool.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between py-2.5 border-b border-[#FFDDD2]/50">
                          <span className="text-xs sm:text-sm text-[#83C5BE] font-bold">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                            pool?.status === 'active'
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {pool?.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </div>

                        {/* Captain */}
                        <div className="flex items-center justify-between py-2.5 border-b border-[#FFDDD2]/50">
                          <span className="text-xs sm:text-sm text-[#83C5BE] font-bold">Captain</span>
                          <span className="text-xs sm:text-sm font-bold text-[#006D77]">{captainName}</span>
                        </div>

                        {/* Contribution */}
                        {pool?.contribution_amount && (
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-xs sm:text-sm text-[#83C5BE] font-bold">Contribution</span>
                            <span className="text-xs sm:text-sm font-bold text-[#006D77]">
                              ${Number(pool.contribution_amount).toFixed(0)} per draw
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </div>
          )}
        </main>

        {/* Floating Action Button — hidden when archived */}
        {!loading && !error && !isArchived && (
          <>
            {/* Backdrop when FAB is open */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/10 z-[10]"
                  onClick={() => setFabOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* FAB button group */}
            <div
              className="absolute z-[11]"
              style={{
                bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))',
                right: '1.5rem',
              }}
            >
              <AnimatePresence>
                {fabOpen && (
                  <div className="absolute bottom-full right-0 mb-3 flex flex-col gap-3 items-end">
                    {/* Scan Ticket option */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-[#006D77] shadow-md whitespace-nowrap">
                        Scan Ticket
                      </span>
                      <button
                        onClick={() => { setFabOpen(false); if (pool) onScanTicket?.({ id: pool.id, name: pool.name, game_type: pool.game_type }); }}
                        className="w-11 h-11 rounded-full bg-[#83C5BE] text-white shadow-lg flex items-center justify-center"
                      >
                        <Camera size={20} />
                      </button>
                    </motion.div>

                    {/* Manual Entry option */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      transition={{ duration: 0.15, delay: 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-[#006D77] shadow-md whitespace-nowrap">
                        Manual Entry
                      </span>
                      <button
                        onClick={() => { setFabOpen(false); onManualEntry?.(); }}
                        className="w-11 h-11 rounded-full bg-[#006D77] text-white shadow-lg flex items-center justify-center"
                      >
                        <Keyboard size={20} />
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Main FAB button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setFabOpen(!fabOpen)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E29578] text-white shadow-lg shadow-[#E29578]/30 flex items-center justify-center"
              >
                <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.15 }}>
                  <Plus size={24} strokeWidth={2.5} />
                </motion.div>
              </motion.button>
            </div>
          </>
        )}
      </motion.div>

      {/* Archive confirmation modal */}
      <AnimatePresence>
        {showArchiveModal && pool && (
          <ArchivePoolModal
            pool={pool}
            onClose={() => setShowArchiveModal(false)}
            onArchived={async () => {
              setShowArchiveModal(false);
              await refreshPool();
            }}
          />
        )}
      </AnimatePresence>
    </FocusTrap>
  );
};

export default PoolDetailView;

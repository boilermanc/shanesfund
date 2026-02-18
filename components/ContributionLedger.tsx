import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, AlertCircle, ArrowLeft, Loader2, Clock } from 'lucide-react';
import type { DisplayPool, ContributionWithUser, PoolMemberWithUser } from '../types/database';
import { getPoolContributions, getPoolMembers, confirmContribution, rejectContribution } from '../services/pools';
import { useStore } from '../store/useStore';
import FocusTrap from './FocusTrap';

interface ContributionLedgerProps {
  pool: DisplayPool;
  onClose: () => void;
}

type MemberStatus = 'confirmed' | 'pending' | 'rejected' | 'unpaid';

interface MemberRow {
  userId: string;
  name: string;
  avatar: string | null;
  status: MemberStatus;
  amount: number;
  contributionId: string | null;
}

const ContributionLedger: React.FC<ContributionLedgerProps> = ({ pool, onClose }) => {
  const user = useStore((s) => s.user);
  const [contributions, setContributions] = useState<ContributionWithUser[]>([]);
  const [members, setMembers] = useState<PoolMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [remindersSent, setRemindersSent] = useState(false);

  const isCaptain = user?.id === pool.captain_id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [contribResult, membersResult] = await Promise.all([
        getPoolContributions(pool.id, pool.draw_date),
        getPoolMembers(pool.id),
      ]);
      if (contribResult.data) setContributions(contribResult.data);
      if (membersResult.data) setMembers(membersResult.data);
      setLoading(false);
    };
    load();
  }, [pool.id, pool.draw_date]);

  // Build member rows: each pool member with their contribution status for this draw
  const memberRows: MemberRow[] = members.map((m) => {
    const contrib = contributions.find(
      (c) => c.user_id === m.user_id
    );
    const memberUser = m.users;
    return {
      userId: m.user_id,
      name: memberUser?.display_name || memberUser?.email?.split('@')[0] || 'Member',
      avatar: memberUser?.avatar_url || null,
      status: contrib ? (contrib.status as MemberStatus) : 'unpaid',
      amount: pool.contribution_amount,
      contributionId: contrib?.id || null,
    };
  });

  const totalConfirmed = memberRows.filter((r) => r.status === 'confirmed').length * pool.contribution_amount;
  const totalNeeded = members.length * pool.contribution_amount;
  const pendingCount = memberRows.filter((r) => r.status === 'pending').length;
  const progressPercent = totalNeeded > 0 ? (totalConfirmed / totalNeeded) * 100 : 0;

  const handleConfirm = async (contributionId: string) => {
    if (!user?.id || actionLoading) return;
    setActionLoading(contributionId);
    const { data } = await confirmContribution(contributionId, user.id);
    if (data) {
      setContributions((prev) =>
        prev.map((c) => (c.id === contributionId ? { ...c, ...data } : c))
      );
    }
    setActionLoading(null);
  };

  const handleReject = async (contributionId: string) => {
    if (!user?.id || actionLoading) return;
    setActionLoading(contributionId);
    const { data } = await rejectContribution(contributionId, user.id);
    if (data) {
      setContributions((prev) =>
        prev.map((c) => (c.id === contributionId ? { ...c, ...data } : c))
      );
    }
    setActionLoading(null);
  };

  const handleRequestReminders = () => {
    if (remindersSent) return;
    setRemindersSent(true);
    setTimeout(() => setRemindersSent(false), 3000);
  };

  const formatDrawDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const statusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <motion.div key="confirmed" initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-[#006D77] text-white p-1 sm:p-1.5 rounded-full">
            <Check size={14} strokeWidth={4} />
          </motion.div>
        );
      case 'pending':
        return (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#FFDDD2] text-[#E29578] px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} /> Pending
          </motion.div>
        );
      case 'rejected':
        return (
          <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-100 text-red-500 px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
            Rejected
          </motion.div>
        );
      case 'unpaid':
        return (
          <motion.div key="unpaid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-100 text-gray-400 px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
            Not Paid
          </motion.div>
        );
    }
  };

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[550] bg-[#EDF6F9] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Contribution ledger"
      >
      {/* Header */}
      <header className="px-4 sm:px-6 pb-4 sm:pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-[#FFDDD2] safe-area-top" style={{ paddingTop: 'max(2.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))' }}>
        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl glass border border-white text-[#006D77] hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em]">{pool.name}</p>
          <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">
            {formatDrawDate(pool.draw_date)}
          </h2>
        </div>
        <div className="w-9 sm:w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#006D77]" />
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-pearl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 warm-shadow border border-white/60 mb-8 sm:mb-10 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-white/20 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Confirmed</p>
                    <h3 className="text-3xl sm:text-4xl font-black text-[#006D77] tracking-tighter">${totalConfirmed.toFixed(2)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Goal</p>
                    <p className="text-lg sm:text-xl font-black text-[#006D77]/40 tracking-tight">${totalNeeded.toFixed(2)}</p>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={Math.round(progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Contribution collection progress"
                  className="h-3 sm:h-4 w-full bg-white/30 rounded-full overflow-hidden border border-white/50"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-[#006D77]"
                  />
                </div>

                {pendingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={12} className="text-[#E29578]" />
                    <p className="text-[9px] sm:text-[10px] font-bold text-[#006D77] uppercase tracking-wider">
                      {pendingCount} {pendingCount === 1 ? 'Contribution' : 'Contributions'} Awaiting Confirmation
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Member List */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-2 mb-2">Member Status</h3>
              {memberRows.map((row, i) => (
                <motion.div
                  key={row.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-[1.5rem] sm:rounded-[1.8rem] p-3 sm:p-4 flex items-center justify-between border border-[#FFDDD2] warm-shadow gap-2"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] p-0.5 border border-[#FFDDD2] shrink-0 flex items-center justify-center overflow-hidden">
                      {row.avatar ? (
                        <img src={row.avatar} className="w-full h-full rounded-xl sm:rounded-2xl object-cover" alt="" loading="lazy" />
                      ) : (
                        <span className="text-[#83C5BE] text-sm font-black">{row.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#006D77] text-xs sm:text-sm truncate">{row.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold uppercase tracking-wider">${row.amount.toFixed(2)} Due</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <AnimatePresence mode="wait">
                      {statusBadge(row.status)}
                    </AnimatePresence>

                    {/* Captain confirm/reject buttons for pending contributions */}
                    {isCaptain && row.status === 'pending' && row.contributionId && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleConfirm(row.contributionId!)}
                          disabled={actionLoading === row.contributionId}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#006D77] text-white shadow-lg shadow-[#006D77]/20 disabled:opacity-50 transition-all"
                        >
                          {actionLoading === row.contributionId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} strokeWidth={3} />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(row.contributionId!)}
                          disabled={actionLoading === row.contributionId}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#FFDDD2] text-[#E29578] disabled:opacity-50 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {memberRows.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-[#83C5BE] font-bold">No members found</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer Action — captain only: send reminders */}
      {isCaptain && !loading && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-[#EDF6F9] to-transparent pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequestReminders}
            className={`w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] ${remindersSent ? 'bg-[#83C5BE]' : 'bg-[#E29578]'} text-white font-black text-base sm:text-lg shadow-xl shadow-[#FFDDD2] flex items-center justify-center gap-2 sm:gap-3 pointer-events-auto btn-shimmer transition-colors duration-500`}
          >
            <AnimatePresence mode="wait">
              {remindersSent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <Check size={20} strokeWidth={4} />
                  Reminders Sent!
                </motion.div>
              ) : (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <Bell size={20} />
                  Send Reminders
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
      </motion.div>
    </FocusTrap>
  );
};

export default ContributionLedger;

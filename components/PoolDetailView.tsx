import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Crown,
  Copy,
  Check,
  DollarSign,
  Calendar,
  Ticket,
  LogOut,
  Share2,
  ChevronRight
} from 'lucide-react';
import { getPool, leavePool } from '../services/pools';
import { useStore } from '../store/useStore';

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
  onOpenLedger?: () => void;
}

const PoolDetailView: React.FC<PoolDetailViewProps> = ({ poolId, onClose, onOpenLedger }) => {
  const { user } = useStore();
  const [pool, setPool] = useState<any>(null);
  const [members, setMembers] = useState<PoolMemberDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const loadPool = async () => {
      setLoading(true);
      const { data, error: fetchError } = await getPool(poolId);
      if (fetchError || !data) {
        setError(fetchError || 'Pool not found');
        setLoading(false);
        return;
      }
      setPool(data);
      setMembers(data.pool_members || []);
      setLoading(false);
    };
    loadPool();
  }, [poolId]);

  const handleCopyInviteCode = async () => {
    if (!pool?.invite_code) return;
    try {
      await navigator.clipboard.writeText(pool.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pool.invite_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeavePool = async () => {
    if (!user?.id || !pool?.id) return;
    if (pool.captain_id === user.id) {
      setError('Captains cannot leave their own pool.');
      return;
    }
    setLeaving(true);
    const { error: leaveError } = await leavePool(pool.id, user.id);
    if (leaveError) {
      setError(leaveError);
      setLeaving(false);
      return;
    }
    onClose();
  };

  const isCaptain = user?.id === pool?.captain_id;
  const gameTypeLabel = pool?.game_type === 'powerball' ? 'Powerball' : 'Mega Millions';
  const gameTypeColor = pool?.game_type === 'powerball' ? '#E29578' : '#006D77';

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[550] bg-[#EDF6F9] flex flex-col"
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
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em]">Pool Details</p>
          <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">
            {loading ? 'Loading...' : pool?.name || 'Pool'}
          </h2>
        </div>
        <div className="w-9 sm:w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-[#006D77] font-medium">Loading pool...</div>
          </div>
        ) : error ? (
          <div className="bg-[#FFDDD2] text-[#E29578] p-4 rounded-2xl text-center font-bold">
            {error}
          </div>
        ) : (
          <>
            {/* Pool Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-pearl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 warm-shadow border border-white/60 mb-6 sm:mb-8 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-24 sm:w-32 h-24 sm:h-32 bg-white/20 rounded-full blur-2xl" />

              <div className="relative z-10">
                {/* Game Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: gameTypeColor }}
                  >
                    {gameTypeLabel}
                  </span>
                  {pool?.status === 'active' && (
                    <span className="px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#83C5BE] text-white">
                      Active
                    </span>
                  )}
                </div>

                {/* Pool Stats */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Contribution</p>
                    <div className="flex items-center gap-1">
                      <DollarSign size={18} className="text-[#006D77]" />
                      <span className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">
                        {Number(pool?.contribution_amount || 5).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Members</p>
                    <div className="flex items-center gap-1">
                      <Users size={18} className="text-[#006D77]" />
                      <span className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">
                        {members.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Collected */}
                <div className="pt-4 border-t border-[#FFDDD2]/30">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em]">Total Collected</p>
                    <p className="text-lg sm:text-xl font-black text-[#006D77]">${Number(pool?.total_collected || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Invite Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 mb-6 sm:mb-8 border border-[#FFDDD2] warm-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em] mb-1">Invite Code</p>
                  <p className="text-xl sm:text-2xl font-black text-[#006D77] tracking-[0.2em]">{pool?.invite_code}</p>
                </div>
                <button
                  onClick={handleCopyInviteCode}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${
                    copied
                      ? 'bg-[#006D77] text-white'
                      : 'bg-[#EDF6F9] text-[#006D77] hover:bg-[#83C5BE]/20'
                  }`}
                >
                  {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} />}
                </button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-3 mb-6 sm:mb-8"
            >
              {onOpenLedger && (
                <button
                  onClick={onOpenLedger}
                  className="w-full bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 border border-[#FFDDD2] warm-shadow flex items-center justify-between group hover:border-[#006D77]/20 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] flex items-center justify-center border border-[#FFDDD2]">
                      <Ticket size={20} className="text-[#006D77]" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[#006D77] text-sm sm:text-base">View Ledger</p>
                      <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold uppercase tracking-wider">See contributions</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#83C5BE] group-hover:text-[#006D77] transition-colors" />
                </button>
              )}
            </motion.div>

            {/* Members List */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-2 mb-2">Members</h3>
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-[1.5rem] sm:rounded-[1.8rem] p-3 sm:p-4 flex items-center justify-between border border-[#FFDDD2] warm-shadow gap-2"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] p-0.5 border border-[#FFDDD2] shrink-0 overflow-hidden">
                      {member.users?.avatar_url ? (
                        <img
                          src={member.users.avatar_url}
                          className="w-full h-full rounded-xl sm:rounded-2xl object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#83C5BE]/20 flex items-center justify-center">
                          <span className="text-[#006D77] font-black text-sm">
                            {(member.users?.display_name || member.users?.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#006D77] text-xs sm:text-sm truncate">
                        {member.users?.display_name || member.users?.email || 'Unknown User'}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold uppercase tracking-wider">
                        Joined {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {member.role === 'captain' && (
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-[#E29578] text-white shrink-0">
                      <Crown size={12} />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">Captain</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer Actions */}
      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-[#EDF6F9] to-transparent pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyInviteCode}
              className="flex-1 py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-sm sm:text-base shadow-xl shadow-[#006D77]/20 flex items-center justify-center gap-2 sm:gap-3"
            >
              <Share2 size={18} />
              Share Pool
            </motion.button>
            {!isCaptain && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLeavePool}
                disabled={leaving}
                className="py-4 sm:py-5 px-5 sm:px-6 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-[#FFDDD2] text-[#E29578] font-black text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogOut size={18} />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PoolDetailView;

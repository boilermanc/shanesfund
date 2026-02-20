import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Star,
  ChevronRight,
  LogOut,
  Loader2,
  Mail
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import PersonalInfoEdit from './PersonalInfoEdit';
import NotificationSettings from './NotificationSettings';
import ShaneMascot from './ShaneMascot';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const StatCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value }) => (
  <motion.div 
    variants={itemVariants}
    className="bg-white p-5 rounded-[2rem] border border-[#FFDDD2] shadow-sm flex flex-col justify-center items-center text-center"
  >
    <span className="text-2xl font-black text-[#006D77] tracking-tight">{value}</span>
    <span className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mt-1">{label}</span>
  </motion.div>
);

const SettingRow: React.FC<{ icon: React.ReactNode; title: string; onClick?: () => void }> = ({ icon, title, onClick }) => (
  <motion.div 
    variants={itemVariants}
    onClick={onClick}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
    role="button"
    tabIndex={0}
    className="flex items-center justify-between py-5 border-b border-[#FFDDD2] last:border-0 group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="text-[#006D77]">
        {icon}
      </div>
      <span className="text-sm font-bold text-[#006D77] group-hover:translate-x-1 transition-transform">{title}</span>
    </div>
    <ChevronRight size={16} className="text-[#83C5BE]" />
  </motion.div>
);

const ProfileView: React.FC = () => {
  const { user, pools, logout } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [totalWon, setTotalWon] = useState<number | null>(null);
  const [ticketsScanned, setTicketsScanned] = useState<number | null>(null);
  const [totalContributed, setTotalContributed] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const activePools = useMemo(() => pools.filter(p => p.status === 'active'), [pools]);

  const isCaptain = useMemo(
    () => pools.some(p => p.captain_id === user?.id),
    [pools, user?.id]
  );

  const badgeLabel = useMemo(() => {
    const tier = user?.subscription_tier;
    if (tier === 'pro') return 'Pro Member';
    if (tier === 'premium') return 'Premium Member';
    if (isCaptain) return 'Pool Captain';
    return 'Member';
  }, [user?.subscription_tier, isCaptain]);

  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    const d = new Date(user.created_at);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [user?.created_at]);

  // Fetch profile stats in parallel
  useEffect(() => {
    const fetchStats = async () => {
      const poolIds = pools.map(p => p.id);

      // Winnings
      const winningsPromise = poolIds.length > 0
        ? supabase.from('winnings').select('per_member_share').in('pool_id', poolIds)
        : Promise.resolve({ data: [] as { per_member_share: number | null }[], error: null });

      // Tickets scanned by this user
      const ticketsPromise = user?.id
        ? supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('entered_by', user.id)
        : Promise.resolve({ count: 0, error: null });

      // Total contributed by this user
      const contributionsPromise = user?.id
        ? supabase.from('contributions').select('amount').eq('user_id', user.id)
        : Promise.resolve({ data: [] as { amount: number }[], error: null });

      const [winningsRes, ticketsRes, contribRes] = await Promise.all([
        winningsPromise,
        ticketsPromise,
        contributionsPromise,
      ]);

      // Process winnings
      if (winningsRes.error) {
        console.error('Failed to fetch winnings:', winningsRes.error.message);
        setTotalWon(0);
      } else {
        const rows = winningsRes.data as { per_member_share: number | null }[] | null;
        setTotalWon(rows?.reduce((acc, w) => acc + (w.per_member_share || 0), 0) ?? 0);
      }

      // Process tickets count
      setTicketsScanned(ticketsRes.error ? 0 : (ticketsRes.count ?? 0));

      // Process contributions sum
      if (contribRes.error) {
        setTotalContributed(0);
      } else {
        const rows = contribRes.data as { amount: number }[] | null;
        setTotalContributed(rows?.reduce((acc, c) => acc + (c.amount || 0), 0) ?? 0);
      }

      setStatsLoading(false);
    };
    fetchStats();
  }, [pools, user?.id]);

  const savingsGoal = user?.savings_goal ?? null;
  const progressPercent = savingsGoal && savingsGoal > 0 && totalWon !== null
    ? Math.min(100, Math.round((totalWon / savingsGoal) * 100))
    : null;
  const remaining = savingsGoal && totalWon !== null
    ? Math.max(0, savingsGoal - totalWon)
    : null;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut failed:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error during signOut:', err);
    } finally {
      logout();
    }
  };

  const wonDisplay = statsLoading
    ? '...'
    : `$${(totalWon ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const contributedDisplay = statsLoading
    ? '...'
    : `$${(totalContributed ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ticketsDisplay = statsLoading ? '...' : String(ticketsScanned ?? 0);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pt-12 pb-24 md:pb-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-[#F2E9D4] min-h-full"
    >
      <AnimatePresence>
        {showEdit && <PersonalInfoEdit key="edit-info" onClose={() => setShowEdit(false)} />}
        {showNotifications && <NotificationSettings key="notif-settings" onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>

      {/* Header Section */}
      <motion.section variants={itemVariants} className="flex flex-col items-center md:flex-row md:gap-8 md:justify-center">
        <div className="relative">
          <ShaneMascot size="lg" expression="normal" animate />
          {/* Tier Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#E29578] px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-[#FFDDD2] z-10">
            <Star size={12} className="text-white fill-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">{badgeLabel}</span>
          </div>
        </div>
        <div className="text-center mt-8">
          <h1 className="shane-serif text-3xl font-black text-[#4A5D4E] tracking-tighter">
            {user?.display_name?.split(' ')[0] || 'Shane'}
          </h1>
          {user?.email && (
            <div className="flex items-center justify-center gap-1.5 mt-2 opacity-50">
              <Mail size={11} className="text-[#006D77]" />
              <p className="text-[10px] font-bold text-[#006D77] tracking-wide">{user.email}</p>
            </div>
          )}
          <p className="text-[10px] font-black text-[#006D77] uppercase tracking-[0.3em] opacity-40 mt-1">
            {memberSince ? `Member since ${memberSince}` : 'Member'}
          </p>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={String(activePools.length)} label="Active Pools" />
        <StatCard value={wonDisplay} label="Total Won" />
        <StatCard value={ticketsDisplay} label="Tickets Entered" />
        <StatCard value={contributedDisplay} label="Contributed" />
      </motion.section>

      {/* Retirement Progress — only show if user has a savings goal */}
      {savingsGoal && savingsGoal > 0 ? (
        <motion.section
          variants={itemVariants}
          className="rounded-[2.5rem] p-8 border border-white warm-shadow relative overflow-hidden bg-white/40 backdrop-blur-md"
        >
          <div className="relative z-10">
            <h3 className="text-sm font-black text-[#006D77] uppercase tracking-[0.2em] mb-4">Retirement Progress</h3>

            {statsLoading ? (
              <div className="flex items-center gap-2 text-[#83C5BE]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[11px] font-bold">Loading...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  role="progressbar"
                  aria-valuenow={progressPercent ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Retirement savings progress"
                  className="h-4 w-full bg-black/5 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent ?? 0}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="h-full bg-[#4A5D4E]"
                  />
                </div>
                <p className="text-[11px] font-bold text-[#006D77] leading-relaxed">
                  {remaining !== null && remaining > 0 ? (
                    <>Shane says: You're <span className="font-black text-[#E29578]">${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> away from your goal!</>
                  ) : (
                    <>Shane says: You've reached your savings goal! <span className="font-black text-[#E29578]">Amazing!</span></>
                  )}
                </p>
              </div>
            )}
          </div>
        </motion.section>
      ) : null}

      {/* Settings Menu */}
      <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-[#FFDDD2] shadow-sm">
        <SettingRow 
          icon={<User size={18} />} 
          title="Personal Information" 
          onClick={() => setShowEdit(true)}
        />
        <SettingRow 
          icon={<Bell size={18} />} 
          title="Notification Settings" 
          onClick={() => setShowNotifications(true)}
        />
        <SettingRow icon={<LogOut size={18} />} title="Log Out" onClick={handleLogout} />
      </motion.section>

      <div className="text-center pb-8">
        <p className="text-[9px] font-black text-[#4A5D4E] uppercase tracking-widest opacity-20">v2.4.0 • Built with trust</p>
      </div>
    </motion.div>
  );
};

export default ProfileView;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, User as UserIcon, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import type { DisplayPool } from '../types/database';
import FocusTrap from './FocusTrap';

interface Member {
  id: string;
  name: string;
  avatar: string;
  paid: boolean;
  amount: number;
}

interface ContributionLedgerProps {
  pool: DisplayPool;
  onClose: () => void;
}

const ContributionLedger: React.FC<ContributionLedgerProps> = ({ pool, onClose }) => {
  const [remindersSent, setRemindersSent] = useState(false);
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Shane Miller', avatar: 'https://picsum.photos/seed/shane/80', paid: true, amount: 5 },
    { id: '2', name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/80', paid: true, amount: 5 },
    { id: '3', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/mike/80', paid: true, amount: 5 },
    { id: '4', name: 'Harvey Specter', avatar: 'https://picsum.photos/seed/harvey/80', paid: false, amount: 5 },
    { id: '5', name: 'Louis Litt', avatar: 'https://picsum.photos/seed/louis/80', paid: false, amount: 5 },
  ]);

  const togglePaid = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, paid: !m.paid } : m));
  };

  const handleRequestReminders = () => {
    if (remindersSent) return;
    setRemindersSent(true);
    const timer = setTimeout(() => {
      setRemindersSent(false);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const totalCollected = members.reduce((acc, m) => m.paid ? acc + m.amount : acc, 0);
  const totalNeeded = members.reduce((acc, m) => acc + m.amount, 0);
  const pendingCount = members.filter(m => !m.paid).length;

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
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em]">Syndicate Ledger</p>
          <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">Draw: Friday, Jan 30</h2>
        </div>
        <div className="w-9 sm:w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32">
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
                <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Collected</p>
                <h3 className="text-3xl sm:text-4xl font-black text-[#006D77] tracking-tighter">${totalCollected.toFixed(2)}</h3>
              </div>
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-[#006D77]/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Goal</p>
                <p className="text-lg sm:text-xl font-black text-[#006D77]/40 tracking-tight">${totalNeeded.toFixed(2)}</p>
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuenow={Math.round((totalCollected / totalNeeded) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Contribution collection progress"
              className="h-3 sm:h-4 w-full bg-white/30 rounded-full overflow-hidden border border-white/50"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalCollected / totalNeeded) * 100}%` }}
                className="h-full bg-[#006D77]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <AlertCircle size={12} className="text-[#E29578]" />
              <p className="text-[9px] sm:text-[10px] font-bold text-[#006D77] uppercase tracking-wider">
                {pendingCount} Members Pending Contribution
              </p>
            </div>
          </div>
        </motion.div>

        {/* Member List */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-2 mb-2">Member Status</h3>
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[1.8rem] p-3 sm:p-4 flex items-center justify-between border border-[#FFDDD2] warm-shadow gap-2"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] p-0.5 border border-[#FFDDD2] shrink-0">
                  <img src={member.avatar} className="w-full h-full rounded-xl sm:rounded-2xl object-cover" alt="" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-[#006D77] text-xs sm:text-sm truncate">{member.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-bold uppercase tracking-wider">${member.amount.toFixed(2)} Due</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <AnimatePresence mode="wait">
                  {member.paid ? (
                    <motion.div
                      key="paid"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-[#006D77] text-white p-1 sm:p-1.5 rounded-full"
                    >
                      <Check size={14} strokeWidth={4} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-[#FFDDD2] text-[#E29578] px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest"
                    >
                      Pending
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  onClick={() => togglePaid(member.id)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all border ${
                    member.paid 
                      ? 'bg-[#EDF6F9] border-[#83C5BE]/20 text-[#83C5BE]' 
                      : 'bg-[#006D77] border-transparent text-white shadow-lg shadow-[#006D77]/20'
                  }`}
                >
                  {member.paid ? <X size={18} /> : <Check size={18} strokeWidth={3} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer Action */}
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
                Request Reminders
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      </motion.div>
    </FocusTrap>
  );
};

export default ContributionLedger;
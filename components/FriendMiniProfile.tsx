import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Users, Trophy, ExternalLink, ShieldCheck } from 'lucide-react';
import { Friend } from '../types';

interface FriendMiniProfileProps {
  friend: Friend | null;
  onClose: () => void;
}

const FriendMiniProfile: React.FC<FriendMiniProfileProps> = ({ friend, onClose }) => {
  return (
    <AnimatePresence>
      {friend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-t-[3.5rem] p-6 sm:p-8 pb-10 sm:pb-12 shadow-2xl overflow-hidden border-t-4 sm:border-t-8 border-[#83C5BE]"
          >
            <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77]">
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2 sm:mt-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 sm:p-1.5 border-[3px] sm:border-4 border-[#83C5BE] shadow-xl mb-4 sm:mb-6">
                <img src={friend.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter">{friend.name}</h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#EDF6F9] border border-[#FFDDD2]">
                <ShieldCheck size={12} className="text-[#006D77]" />
                <span className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-widest">Verified Syndicate Member</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-10">
              <div className="bg-[#EDF6F9]/50 p-4 sm:p-6 rounded-[1.8rem] sm:rounded-[2.2rem] border border-[#FFDDD2] text-center">
                <Trophy size={18} className="text-[#E29578] mx-auto mb-1.5 sm:mb-2" />
                <p className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight">$420.50</p>
                <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Total Won</p>
              </div>
              <div className="bg-[#EDF6F9]/50 p-4 sm:p-6 rounded-[1.8rem] sm:rounded-[2.2rem] border border-[#FFDDD2] text-center">
                <Users size={18} className="text-[#006D77] mx-auto mb-1.5 sm:mb-2" />
                <p className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight">{friend.poolsCount}</p>
                <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Shared Pools</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <button className="w-full py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#006D77] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-[#006D77]/20 active:scale-95 transition-all">
                <MessageCircle size={20} />
                Send Message
              </button>
              <button className="w-full py-3 sm:py-4 text-[#83C5BE] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-2">
                <ExternalLink size={12} /> View Full Stats
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendMiniProfile;

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
            className="relative w-full max-w-md bg-white rounded-t-[3.5rem] p-8 pb-12 shadow-2xl overflow-hidden border-t-8 border-[#83C5BE]"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-2xl bg-[#EDF6F9] text-[#006D77]">
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-28 h-28 rounded-full p-1.5 border-4 border-[#83C5BE] shadow-xl mb-6">
                <img src={friend.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              <h3 className="text-3xl font-black text-[#006D77] tracking-tighter">{friend.name}</h3>
              <div className="flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-[#EDF6F9] border border-[#FFDDD2]">
                <ShieldCheck size={14} className="text-[#006D77]" />
                <span className="text-[10px] font-black text-[#006D77] uppercase tracking-widest">Verified Syndicate Member</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="bg-[#EDF6F9]/50 p-6 rounded-[2.2rem] border border-[#FFDDD2] text-center">
                <Trophy size={20} className="text-[#E29578] mx-auto mb-2" />
                <p className="text-xl font-black text-[#006D77] tracking-tight">$420.50</p>
                <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Total Won</p>
              </div>
              <div className="bg-[#EDF6F9]/50 p-6 rounded-[2.2rem] border border-[#FFDDD2] text-center">
                <Users size={20} className="text-[#006D77] mx-auto mb-2" />
                <p className="text-xl font-black text-[#006D77] tracking-tight">{friend.poolsCount}</p>
                <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-widest">Shared Pools</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button className="w-full py-5 rounded-[2.2rem] bg-[#006D77] text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-[#006D77]/20 active:scale-95 transition-all">
                <MessageCircle size={22} />
                Send Message
              </button>
              <button className="w-full py-4 text-[#83C5BE] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <ExternalLink size={14} /> View Full Stats
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendMiniProfile;

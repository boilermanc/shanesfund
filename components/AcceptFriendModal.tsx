import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import ShaneMascot from './ShaneMascot';

interface AcceptFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAccept: () => void;
  friendName: string;
}

const AcceptFriendModal: React.FC<AcceptFriendModalProps> = ({ isVisible, onClose, onAccept, friendName }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] shadow-2xl text-center"
          >
            <div className="mb-6 sm:mb-8 flex flex-col items-center">
              <div className="scale-75 sm:scale-100">
                <ShaneMascot size="lg" expression="excited" animate />
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 sm:mt-6 bg-[#EDF6F9] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#83C5BE]/30 relative"
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-[#EDF6F9] rotate-45 border-t border-l border-[#83C5BE]/30" />
                <p className="text-[#006D77] font-black text-xs sm:text-sm">
                  The more, the merrier! 
                  <span className="block text-[#83C5BE] font-bold text-[9px] sm:text-[10px] mt-1 uppercase tracking-widest">Wanna add {friendName}?</span>
                </p>
              </motion.div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#EDF6F9] text-[#006D77] font-black text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all"
              >
                Nah
              </button>
              <button 
                onClick={onAccept}
                className="flex-1 py-4 sm:py-5 rounded-[1.8rem] sm:rounded-[2.2rem] bg-[#E29578] text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-[#E29578]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Accept <Check size={16} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AcceptFriendModal;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import ShaneMascot from './ShaneMascot';

interface ShaneWinnerAlertProps {
  isVisible: boolean;
  onClose: () => void;
}

const ShaneWinnerAlert: React.FC<ShaneWinnerAlertProps> = ({ isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 300, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 300, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="fixed bottom-32 right-6 z-[1000] flex items-end gap-3 pointer-events-none"
        >
          {/* Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#006D77] p-4 rounded-[2rem] rounded-br-none shadow-2xl border border-white/20 relative mb-4 pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#E29578] fill-[#E29578]" />
              <p className="text-white text-xs font-black uppercase tracking-widest whitespace-nowrap">
                We got a winner!
              </p>
            </div>
            {/* Pointer */}
            <div className="absolute -bottom-2 right-0 w-4 h-4 bg-[#006D77] rotate-45 border-r border-b border-white/20" />
            
            <button 
              onClick={onClose}
              className="absolute -top-2 -left-2 bg-white text-[#006D77] p-1 rounded-full shadow-md border border-[#FFDDD2] pointer-events-auto"
            >
              <X size={10} strokeWidth={4} />
            </button>
          </motion.div>

          {/* Animated Shane */}
          <div className="pointer-events-auto">
            <ShaneMascot size="sm" animate />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShaneWinnerAlert;

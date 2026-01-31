
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ScanLine, Users, X, MousePointer2, UserPlus } from 'lucide-react';

interface QuickActionsProps {
  onScanTicket?: () => void;
  onCreatePool?: () => void;
  onJoinPool?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onScanTicket, onCreatePool, onJoinPool }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (label: string) => {
    setIsOpen(false);
    if (label === 'Scan Ticket') onScanTicket?.();
    if (label === 'Create Pool') onCreatePool?.();
    if (label === 'Join Pool') onJoinPool?.();
  };

  const actions = [
    { icon: <UserPlus size={22} />, label: 'Join Pool', color: 'bg-[#E29578]', text: 'text-white' },
    { icon: <ScanLine size={22} />, label: 'Scan Ticket', color: 'bg-[#83C5BE]', text: 'text-white' },
    { icon: <Users size={22} />, label: 'Create Pool', color: 'bg-[#006D77]', text: 'text-white' },
    { icon: <MousePointer2 size={22} />, label: 'Manual Entry', color: 'bg-[#FFDDD2]', text: 'text-[#E29578]' },
  ];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 space-y-4 flex flex-col items-center min-w-[200px]"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 group bg-white/90 backdrop-blur-md p-2.5 rounded-full border border-[#FFDDD2] shadow-xl w-full"
                onClick={() => handleAction(action.label)}
              >
                <div className={`w-12 h-12 rounded-full ${action.color} ${action.text} flex items-center justify-center shadow-lg`}>
                  {action.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#006D77] pr-4">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-[#E29578] text-white flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(226,149,120,0.8)] relative z-10 border-4 border-[#EDF6F9]"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X size={28} strokeWidth={4} /> : <Plus size={28} strokeWidth={4} />}
        </motion.div>
        
        {/* Glow effect */}
        {!isOpen && (
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
             transition={{ duration: 3, repeat: Infinity }}
             className="absolute inset-0 rounded-full bg-[#E29578]/40 -z-10"
           />
        )}
      </motion.button>
    </div>
  );
};

export default QuickActions;

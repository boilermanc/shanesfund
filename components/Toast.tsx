import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const iconMap = {
  info: Info,
  success: CheckCircle,
  error: AlertCircle,
};

const bgMap = {
  info: 'bg-[#006D77]',
  success: 'bg-[#10B981]',
  error: 'bg-[#E29578]',
};

const Toast: React.FC = () => {
  const toast = useStore((s) => s.toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div
            className={`${bgMap[toast.type]} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full max-w-[300px] flex items-center gap-2 shadow-lg`}
          >
            {React.createElement(iconMap[toast.type], { size: 16, className: 'shrink-0' })}
            <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

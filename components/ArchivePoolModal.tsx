import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ArchivePoolModalProps {
  pool: { id: string; name: string; game_type: 'powerball' | 'mega_millions' };
  onClose: () => void;
  onArchived: () => void;
}

const ArchivePoolModal: React.FC<ArchivePoolModalProps> = ({ pool, onClose, onArchived }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPowerball = pool.game_type === 'powerball';

  const handleArchive = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from('pools')
      .update({ status: 'archived' })
      .eq('id', pool.id);
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      onArchived();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-[1.5rem] sm:rounded-[2rem] max-w-sm w-full p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Archive icon */}
        <div className="w-16 h-16 rounded-full bg-[#E29578] flex items-center justify-center mx-auto mb-4">
          <Archive size={32} className="text-white" />
        </div>

        <h3 className="text-xl font-black text-[#006D77] mb-2">Archive Pool?</h3>

        {/* Pool name pill */}
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-white mb-4"
          style={{ backgroundColor: isPowerball ? '#E29578' : '#006D77' }}
        >
          {pool.name}
        </span>

        <p className="text-xs sm:text-sm text-[#83C5BE] leading-relaxed mb-6">
          This pool will be moved to your archives. All tickets and history will be preserved, but no new tickets can be added. Members will still be able to view everything.
        </p>

        {error && (
          <p className="text-xs text-red-500 font-bold mb-4">{error}</p>
        )}

        {/* Actions */}
        <button
          onClick={handleArchive}
          disabled={loading}
          className="w-full py-3 sm:py-3.5 rounded-[1.5rem] bg-[#E29578] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 mb-2 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            'Archive Pool'
          )}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full py-3 sm:py-3.5 rounded-[1.5rem] text-[#006D77] font-bold text-sm sm:text-base"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ArchivePoolModal;

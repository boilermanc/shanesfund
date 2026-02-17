import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Share2, QrCode } from 'lucide-react';
import ShaneMascot from './ShaneMascot';
import FocusTrap from './FocusTrap';
import { useStore } from '../store/useStore';

interface InviteShareScreenProps {
  poolName: string;
  inviteCode: string;
  onClose: () => void;
}

const InviteShareScreen: React.FC<InviteShareScreenProps> = ({ poolName, inviteCode, onClose }) => {
  const showToast = useStore((s) => s.showToast);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast('Code copied!', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my pool: ${poolName}`,
          text: `Retire early with me! Join my pool on Shane's Retirement Fund. Use code: ${inviteCode}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share — not an error
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyCode();
    }
  };

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-[700] bg-[#EDF6F9] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Invite to pool"
      >
      <header className="px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 flex items-center justify-between bg-white border-b border-[#FFDDD2]">
        <h2 className="text-lg sm:text-xl font-black text-[#006D77] tracking-tight">Invite to Pool</h2>
        <button 
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77]"
        >
          <X size={20} />
        </button>
      </header>

      <main className="flex-1 px-6 sm:px-8 pt-6 sm:pt-10 pb-20 overflow-y-auto flex flex-col items-center">
        <div className="text-center mb-6 sm:mb-10">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-2">You are the Captain of</p>
          <h3 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter leading-tight px-4">
            {poolName}
          </h3>
        </div>

        {/* QR Code Card */}
        <div className="w-full aspect-square max-w-[260px] sm:max-w-[320px] bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-[#FFDDD2] warm-shadow relative mb-6 sm:mb-10 flex items-center justify-center">
          <div className="w-full h-full border-4 sm:border-8 border-[#EDF6F9] rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center relative p-3 sm:p-4">
            {/* Stylized QR Visual */}
            <div className="w-full h-full opacity-20">
              <QrCode size="100%" strokeWidth={1} className="text-[#006D77]" />
            </div>
            
            {/* Center Mascot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-1.5 sm:p-2 rounded-full shadow-lg scale-75 sm:scale-100">
                <ShaneMascot size="sm" expression="excited" animate />
              </div>
            </div>

            {/* Simulated QR Blocks for "Premium" look */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-[#006D77] rounded-md sm:rounded-lg" />
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-[#006D77] rounded-md sm:rounded-lg" />
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-2 sm:border-4 border-[#006D77] rounded-md sm:rounded-lg" />
          </div>
        </div>

        {/* Code Display */}
        <div className="text-center space-y-2 sm:space-y-3 mb-8 sm:mb-12">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Pool Access Code</p>
          <div className="bg-white border-2 border-dashed border-[#83C5BE] px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl inline-flex items-center gap-3 sm:gap-4">
            <span className="text-xl sm:text-2xl font-black text-[#006D77] tracking-[0.15em] sm:tracking-[0.2em] font-mono">{inviteCode}</span>
            <button onClick={handleCopyCode} className="text-[#83C5BE] hover:text-[#006D77] transition-colors">
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3 sm:space-y-4">
          <button 
            onClick={handleShare}
            className="w-full py-4 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all"
          >
            <Share2 size={20} />
            Share Magic Link
          </button>
          
          <p className="text-[9px] sm:text-[10px] text-center font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em] px-6 sm:px-10">
            Invitees will be prompted to scan or enter code to join your pool.
          </p>
        </div>
      </main>
      </motion.div>
    </FocusTrap>
  );
};

export default InviteShareScreen;
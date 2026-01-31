
import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Share2, Smartphone, QrCode } from 'lucide-react';
import ShaneMascot from './ShaneMascot';

interface InviteShareScreenProps {
  poolName: string;
  inviteCode: string;
  onClose: () => void;
}

const InviteShareScreen: React.FC<InviteShareScreenProps> = ({ poolName, inviteCode, onClose }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my pool: ${poolName}`,
          text: `Retire early with me! Join my syndicate on Shane's Retirement Fund. Use code: ${inviteCode}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[700] bg-[#EDF6F9] flex flex-col"
    >
      <header className="px-6 pt-14 pb-6 flex items-center justify-between bg-white border-b border-[#FFDDD2]">
        <h2 className="text-xl font-black text-[#006D77] tracking-tight">Invite to Pool</h2>
        <button 
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-[#EDF6F9] text-[#006D77]"
        >
          <X size={22} />
        </button>
      </header>

      <main className="flex-1 px-8 pt-10 pb-20 overflow-y-auto flex flex-col items-center">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em] mb-2">You are the Captain of</p>
          <h3 className="text-3xl font-black text-[#006D77] tracking-tighter leading-tight px-4">
            {poolName}
          </h3>
        </div>

        {/* QR Code Card */}
        <div className="w-full aspect-square max-w-[320px] bg-white rounded-[3.5rem] p-10 border border-[#FFDDD2] warm-shadow relative mb-10 flex items-center justify-center">
          <div className="w-full h-full border-8 border-[#EDF6F9] rounded-[2rem] flex items-center justify-center relative p-4">
            {/* Stylized QR Visual */}
            <div className="w-full h-full opacity-20">
              <QrCode size="100%" strokeWidth={1} className="text-[#006D77]" />
            </div>
            
            {/* Center Mascot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <ShaneMascot size="sm" animate />
              </div>
            </div>

            {/* Simulated QR Blocks for "Premium" look */}
            <div className="absolute top-4 left-4 w-12 h-12 border-4 border-[#006D77] rounded-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-4 border-[#006D77] rounded-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-[#006D77] rounded-lg" />
          </div>
        </div>

        {/* Code Display */}
        <div className="text-center space-y-3 mb-12">
          <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.4em]">Pool Access Code</p>
          <div className="bg-white border-2 border-dashed border-[#83C5BE] px-8 py-4 rounded-2xl inline-flex items-center gap-4">
            <span className="text-2xl font-black text-[#006D77] tracking-[0.2em] font-mono">{inviteCode}</span>
            <button className="text-[#83C5BE] hover:text-[#006D77] transition-colors">
              <Copy size={20} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4">
          <button 
            onClick={handleShare}
            className="w-full py-6 rounded-[2.5rem] bg-[#E29578] text-white font-black text-lg shadow-xl shadow-[#FFDDD2] btn-shimmer flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Share2 size={24} />
            Share Magic Link
          </button>
          
          <p className="text-[10px] text-center font-black text-[#83C5BE] uppercase tracking-[0.2em] px-10">
            Invitees will be prompted to scan or enter code to join your syndicate.
          </p>
        </div>
      </main>
    </motion.div>
  );
};

export default InviteShareScreen;

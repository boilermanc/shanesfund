import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Scan, Search, Trophy, Sparkles } from 'lucide-react';

interface ProUpgradeModalProps {
  onClose: () => void;
}

const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ onClose }) => {
  const features = [
    { 
      icon: <Zap size={18} />, 
      title: 'Unlimited Pools', 
      desc: 'Create and lead as many syndicates as you can manage.' 
    },
    { 
      icon: <Scan size={18} />, 
      title: 'Automated OCR Scanning', 
      desc: 'Lightning-fast ticket recognition with neural processing.' 
    },
    { 
      icon: <Search size={18} />, 
      title: 'Automatic Win Checking', 
      desc: 'We check every draw so you never miss a payout.' 
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-end justify-center px-3 sm:px-4 pb-6 sm:pb-10"
    >
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[#006D77]/50 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: '100%', scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%', scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        className="relative w-full max-w-sm bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] border border-[#FFDDD2] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-[#E29578] via-[#83C5BE] to-[#E29578] opacity-80" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#EDF6F9] text-[#006D77] hover:bg-[#83C5BE]/20 transition-colors z-20"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Header Illustration */}
        <div className="relative flex justify-center mb-6 sm:mb-8 pt-2 sm:pt-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-[#E29578] to-[#FFDDD2] flex items-center justify-center relative shadow-xl shadow-[#E29578]/20"
          >
            <Trophy size={44} className="text-white sm:hidden" />
            <Trophy size={52} className="text-white hidden sm:block" />
            
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#83C5BE] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"
            >
              <Sparkles size={16} />
            </motion.div>
          </motion.div>
          
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[#83C5BE]/10 blur-3xl rounded-full -z-10" />
        </div>

        {/* Content */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tighter leading-tight mb-2">
            Supercharge your Syndicate.
          </h2>
          <p className="text-[#83C5BE] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            The Elite Retirement Experience
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10 px-1 sm:px-2">
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="flex items-start gap-3 sm:gap-4"
            >
              <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#006D77] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Check size={12} strokeWidth={4} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#006D77] leading-none mb-1">{f.title}</h4>
                <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-bold leading-tight">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing & CTA */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-black text-[#006D77] tracking-tighter">$4.99</span>
            <span className="text-[#83C5BE] font-black text-xs sm:text-sm uppercase tracking-widest ml-2">/ month</span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#E29578] text-white font-black text-base sm:text-lg btn-shimmer shadow-xl shadow-[#E29578]/30 hover:shadow-[#E29578]/40 transition-all flex items-center justify-center gap-2"
            >
              Start 7-Day Free Trial
            </motion.button>
            <p className="text-[8px] sm:text-[9px] text-[#83C5BE] text-center font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-3 sm:px-4">
              Cancel anytime. Subscription managed via Secure Gateway.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProUpgradeModal;
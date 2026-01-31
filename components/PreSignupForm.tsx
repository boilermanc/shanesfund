import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, ArrowRight, Check, Sparkles } from 'lucide-react';

interface PreSignupFormProps {
  variant?: 'light' | 'dark';
}

const PreSignupForm: React.FC<PreSignupFormProps> = ({ variant = 'light' }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save to localStorage
    const existingWaitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
    const newEntry = {
      firstName,
      email,
      timestamp: new Date().toISOString()
    };
    existingWaitlist.push(newEntry);
    localStorage.setItem('waitlist', JSON.stringify(existingWaitlist));

    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFirstName('');
      setEmail('');

      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 800);
  };

  const isDark = variant === 'dark';

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-center ${
              isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-[#FFDDD2]/50'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDark ? 'bg-[#83C5BE]' : 'bg-[#006D77]'
              }`}
            >
              <Check className="text-white" size={32} strokeWidth={3} />
            </motion.div>
            <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-[#006D77]'}`}>
              You're on the list!
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-[#006D77]/70'}`}>
              We'll notify you at launch. Get ready to win together!
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <User
                  className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-white/50' : 'text-[#83C5BE]'
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className={`w-full py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 rounded-[1.2rem] sm:rounded-[1.5rem] font-semibold outline-none transition-all ${
                    isDark
                      ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:border-white/40'
                      : 'bg-white border border-transparent text-[#006D77] placeholder:text-[#83C5BE]/50 focus:border-[#006D77] warm-shadow'
                  }`}
                />
              </div>
              <div className="relative flex-1">
                <Mail
                  className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-white/50' : 'text-[#83C5BE]'
                  }`}
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className={`w-full py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 rounded-[1.2rem] sm:rounded-[1.5rem] font-semibold outline-none transition-all ${
                    isDark
                      ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:border-white/40'
                      : 'bg-white border border-transparent text-[#006D77] placeholder:text-[#83C5BE]/50 focus:border-[#006D77] warm-shadow'
                  }`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 sm:py-4 rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.98] disabled:opacity-70 ${
                isDark
                  ? 'bg-[#E29578] text-white shadow-xl shadow-[#E29578]/30 btn-shimmer'
                  : 'bg-[#006D77] text-white shadow-xl shadow-[#006D77]/20 btn-shimmer'
              }`}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={20} />
                </motion.div>
              ) : (
                <>
                  Join the Waitlist
                  <ArrowRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreSignupForm;

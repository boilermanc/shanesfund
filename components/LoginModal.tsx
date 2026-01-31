import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, X, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthenticated, setUser } = useStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Dummy auth - accepts any email/password
    setTimeout(() => {
      const mockUser = {
        id: 'user_1',
        email: email,
        full_name: email.split('@')[0],
        balance: 2450.75,
        avatar_url: 'https://picsum.photos/seed/user/200'
      };

      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));

      setUser(mockUser);
      setAuthenticated(true);
      setIsLoading(false);
      onClose();
    }, 800);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[100] bg-[#006D77]/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[101] max-w-lg mx-auto"
          >
            <div className="bg-[#F2E9D4] rounded-b-[2rem] sm:rounded-b-[2.5rem] p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-[#83C5BE] font-semibold mt-1">
                    Sign in to your account
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#006D77]/10 text-[#006D77] hover:bg-[#006D77]/20 transition-colors"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.5rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.5rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-[1.5rem] bg-[#006D77]/10 text-[#006D77] font-bold transition-all hover:bg-[#006D77]/20 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-[1.5rem] bg-[#E29578] text-white font-black shadow-lg shadow-[#E29578]/20 btn-shimmer flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 size={20} />
                      </motion.div>
                    ) : (
                      <>
                        Login
                        <ArrowRight size={18} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;

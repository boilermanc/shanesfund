import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, X, ArrowRight, Loader2, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { signIn, signUp } from '../services/auth';
import FocusTrap from './FocusTrap';
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthenticated, setUser } = useStore();
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        const { user, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }
        if (user) {
          setUser(user);
          setAuthenticated(true);
          onClose();
        }
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        const { user, error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }
        if (user) {
          setUser(user);
          setAuthenticated(true);
          onClose();
        } else {
          setError('Please check your email to confirm your account');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setShowPassword(false);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap onClose={onClose}>
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
            role="dialog"
            aria-modal="true"
            aria-label={isLogin ? 'Sign in' : 'Create account'}
            className="fixed top-0 left-0 right-0 z-[101] max-w-lg mx-auto"
          >
            <div className="bg-[#F2E9D4] rounded-b-[2rem] sm:rounded-b-[2.5rem] p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#006D77] tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Join the Syndicate'}
                  </h2>
                  <p className="text-sm text-[#83C5BE] font-semibold mt-1">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#006D77]/10 text-[#006D77] hover:bg-[#006D77]/20 transition-colors"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <p className="text-red-600 text-sm font-bold text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                {/* Full Name - Only for signup */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label htmlFor="login-display-name" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                        <input
                          id="login-display-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Shane Miller"
                          required={!isLogin}
                          disabled={isLoading}
                          className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.5rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40 disabled:opacity-50"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      disabled={isLoading}
                      className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.5rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40 disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.5rem] py-4 pl-14 pr-14 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#83C5BE] hover:text-[#006D77] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-[10px] text-[#83C5BE] ml-4">Must be at least 6 characters</p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-[1.5rem] bg-[#006D77]/10 text-[#006D77] font-bold transition-all hover:bg-[#006D77]/20 active:scale-[0.98] disabled:opacity-50"
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
                        {isLogin ? 'Login' : 'Sign Up'}
                        <ArrowRight size={18} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              </form>
              {/* Toggle Login/Signup */}
              <div className="mt-4 text-center">
                <p className="text-sm text-[#83C5BE] font-semibold">
                  {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="text-[#006D77] font-black underline decoration-[#006D77]/30 hover:decoration-[#006D77] transition-all disabled:opacity-50"
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};
export default LoginModal;

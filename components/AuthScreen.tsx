import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { signIn, signUp } from '../services/auth';
const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthenticated, setUser } = useStore();
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        // Sign in
        const { user, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }
        if (user) {
          setUser(user);
          setAuthenticated(true);
        }
      } else {
        // Sign up
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
        } else {
          // Email confirmation may be required
          setError('Please check your email to confirm your account');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#F2E9D4] flex flex-col px-6 sm:px-8 overflow-y-auto full-screen-safe"
    >
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full py-6 sm:py-12">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-6 sm:mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <img src="/logo.png" alt="Shane's Retirement Fund" className="h-28 sm:h-40 w-auto" />
          </motion.div>
        </div>
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-[#006D77] tracking-tighter">
            {isLogin ? 'Welcome Back' : 'Join the Pool'}
          </h2>
          <p className="text-[#83C5BE] font-bold text-sm mt-2 leading-relaxed px-4">
            {isLogin ? "Secure your future, one draw at a time." : 'Start managing your collective wealth with Shane.'}
          </p>
        </div>
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl"
            >
              <p className="text-red-600 text-sm font-bold text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label htmlFor="auth-display-name" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
                  <input
                    id="auth-display-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Shane Miller"
                    className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.8rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shane@retirement.fund"
                className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.8rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="auth-password" className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-transparent focus:border-[#006D77] rounded-[1.8rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all placeholder:text-[#83C5BE]/40"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            {!isLogin && (
              <p className="text-[10px] text-[#83C5BE] ml-4 mt-1">Must be at least 6 characters</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 rounded-[2.2rem] bg-[#E29578] text-white font-black text-lg shadow-xl shadow-[#E29578]/20 btn-shimmer flex items-center justify-center gap-3 active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </form>
        <div className="mt-auto pt-10 text-center">
          <p className="text-sm font-bold text-[#83C5BE]">
            {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              disabled={isLoading}
              className="text-[#006D77] underline decoration-[#006D77]/30 font-black hover:decoration-[#006D77] transition-all disabled:opacity-50"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
export default AuthScreen;

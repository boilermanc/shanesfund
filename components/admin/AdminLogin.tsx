import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { isDark, toggleTheme } = useAdminTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', data.user.email)
          .eq('is_active', true)
          .maybeSingle();

        if (!adminData) {
          await supabase.auth.signOut();
          setError('This account does not have admin privileges.');
          setIsLoading(false);
          return;
        }
        onLoginSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const t = getAdminTheme(isDark);

  return (
    <div className={`min-h-screen ${t.pageBg} flex items-center justify-center p-4`}>
      {/* Theme toggle in corner */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 ${t.textSecondary} ${t.iconHover} rounded-md transition-colors`}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Admin Login</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>Shane's Retirement Fund</p>
        </div>

        <form onSubmit={handleLogin} className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-6 space-y-4`}>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className={`block text-sm font-medium ${t.textSecondary}`}>
              Email
            </label>
            <div className="relative">
              <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.iconColor}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bigboss@lottery.money"
                required
                className={`w-full pl-10 pr-4 py-2.5 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} ${t.inputPlaceholder} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={`block text-sm font-medium ${t.textSecondary}`}>
              Password
            </label>
            <div className="relative">
              <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.iconColor}`} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={`w-full pl-10 pr-10 py-2.5 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} ${t.inputPlaceholder} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.iconColor} ${t.iconHover} transition-colors`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className={`text-center ${t.textMuted} text-xs mt-6`}>
          Only authorized administrators can access this area.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

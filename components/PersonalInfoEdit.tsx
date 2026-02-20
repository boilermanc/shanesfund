import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Image, Trash2, User as UserIcon, Mail, Target, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { updateProfile } from '../services/auth';
import { supabase } from '../lib/supabase';
import FocusTrap from './FocusTrap';

interface PersonalInfoEditProps {
  onClose: () => void;
}

const PersonalInfoEdit: React.FC<PersonalInfoEditProps> = ({ onClose }) => {
  const { user, setUser } = useStore();
  const [fullName, setFullName] = useState(user?.display_name || '');
  const [tempAvatar, setTempAvatar] = useState(user?.avatar_url || '');
  const [savingsGoal, setSavingsGoal] = useState(
    user?.savings_goal != null ? String(user.savings_goal) : ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    const goalNum = savingsGoal.trim() === '' ? null : parseFloat(savingsGoal);
    if (savingsGoal.trim() !== '' && (isNaN(goalNum!) || goalNum! < 0)) {
      setError('Please enter a valid savings goal amount.');
      setIsSaving(false);
      return;
    }

    // Password validation (only if user is trying to change it)
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        setIsSaving(false);
        return;
      }
    }

    // Update profile fields
    const { user: updated, error: saveError } = await updateProfile(user.id, {
      display_name: fullName.trim() || null,
      avatar_url: tempAvatar || null,
      savings_goal: goalNum,
    });

    if (saveError) {
      setError(saveError.message);
      setIsSaving(false);
      return;
    }

    // Update password if provided
    if (newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        setError(pwError.message);
        setIsSaving(false);
        return;
      }
    }

    if (updated) {
      setUser(updated);
    }
    setIsSaving(false);
    onClose();
  };

  const avatarOptions = [
    { icon: <Camera size={18} />, label: 'Take Photo', onClick: () => setShowAvatarPopup(false) },
    { icon: <Image size={18} />, label: 'Choose from Gallery', onClick: () => setShowAvatarPopup(false) },
    { icon: <Trash2 size={18} />, label: 'Remove Photo', color: 'text-[#E29578]', onClick: () => { setTempAvatar(''); setShowAvatarPopup(false); } },
  ];

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[570] bg-[#EDF6F9] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
      >
      {/* Header */}
      <header className="px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-[#FFDDD2]">
        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl glass border border-white text-[#006D77] hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">Edit Profile</h2>
        <div className="w-9 sm:w-10" />
      </header>

      <main className="flex-1 px-6 sm:px-8 pt-8 sm:pt-12 space-y-8 sm:space-y-12 overflow-y-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAvatarPopup(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAvatarPopup(true); } }}
              role="button"
              tabIndex={0}
              aria-label="Change avatar"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] border-4 border-white shadow-xl shadow-[#FFDDD2] overflow-hidden cursor-pointer group"
            >
              <img
                src={tempAvatar || 'https://picsum.photos/seed/placeholder/200'}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                alt="Avatar"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={22} />
              </div>
            </motion.div>

            <button
              onClick={() => setShowAvatarPopup(true)}
              className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-[#E29578] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white"
            >
              <Camera size={16} />
            </button>
          </div>
          <p className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em]">Change Profile Picture</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 bg-[#E29578]/10 border border-[#E29578]/30 rounded-2xl px-4 py-3">
            <AlertCircle size={16} className="text-[#E29578] shrink-0" />
            <p className="text-xs font-bold text-[#E29578]">{error}</p>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="profile-fullname" className="text-[10px] sm:text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-3 sm:ml-4">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={16} />
              <input
                id="profile-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] sm:rounded-[1.8rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-5 sm:pr-6 text-sm sm:text-base text-[#006D77] font-bold outline-none warm-shadow transition-all focus:border-[#006D77] placeholder:text-[#83C5BE]/40"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label htmlFor="profile-email" className="text-[10px] sm:text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-3 sm:ml-4">Email</label>
            <div className="relative">
              <Mail className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]/50" size={16} />
              <input
                id="profile-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#EDF6F9] border border-[#FFDDD2]/50 rounded-[1.5rem] sm:rounded-[1.8rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-5 sm:pr-6 text-sm sm:text-base text-[#006D77]/50 font-bold outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-widest ml-3 sm:ml-4">Managed through your account provider</p>
          </div>

          {/* Savings Goal */}
          <div className="space-y-2">
            <label htmlFor="profile-savings-goal" className="text-[10px] sm:text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-3 sm:ml-4">Retirement Goal</label>
            <div className="relative">
              <Target className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={16} />
              <span className="absolute left-11 sm:left-12 top-1/2 -translate-y-1/2 text-sm sm:text-base text-[#006D77] font-bold">$</span>
              <input
                id="profile-savings-goal"
                type="number"
                min="0"
                step="any"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] sm:rounded-[1.8rem] py-4 sm:py-5 pl-16 sm:pl-[4.5rem] pr-5 sm:pr-6 text-sm sm:text-base text-[#006D77] font-bold outline-none warm-shadow transition-all focus:border-[#006D77] placeholder:text-[#83C5BE]/40"
              />
            </div>
            <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-widest ml-3 sm:ml-4">Set a goal to track your retirement progress</p>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] ml-3 sm:ml-4">Change Password</h3>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="profile-new-password" className="text-[10px] sm:text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-3 sm:ml-4">New Password</label>
            <div className="relative">
              <Lock className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={16} />
              <input
                id="profile-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] sm:rounded-[1.8rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-12 sm:pr-14 text-sm sm:text-base text-[#006D77] font-bold outline-none warm-shadow transition-all focus:border-[#006D77] placeholder:text-[#83C5BE]/40"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 text-[#83C5BE] hover:text-[#006D77] transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="profile-confirm-password" className="text-[10px] sm:text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-3 sm:ml-4">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={16} />
              <input
                id="profile-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] sm:rounded-[1.8rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-12 sm:pr-14 text-sm sm:text-base text-[#006D77] font-bold outline-none warm-shadow transition-all focus:border-[#006D77] placeholder:text-[#83C5BE]/40"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 text-[#83C5BE] hover:text-[#006D77] transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-widest ml-3 sm:ml-4">Leave blank to keep current password</p>
          </div>
        </div>
      </main>

      {/* Footer Save Button */}
      <div className="p-6 sm:p-8 pb-8 sm:pb-12">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 sm:py-5 rounded-[2rem] sm:rounded-[2.5rem] bg-[#006D77] text-white font-black text-base sm:text-lg shadow-xl shadow-[#83C5BE]/20 flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-70"
        >
          {isSaving ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <>Save Changes</>
          )}
        </motion.button>
      </div>

      {/* Glassmorphism Avatar Popup */}
      <AnimatePresence>
        {showAvatarPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[580] flex items-center justify-center px-4 sm:px-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/20 backdrop-blur-sm" onClick={() => setShowAvatarPopup(false)} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-white/70 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] border border-white/50 p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-3 sm:space-y-4">
                {avatarOptions.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 5 }}
                    onClick={opt.onClick}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/50 hover:bg-white/80 transition-all border border-white/20 shadow-sm ${opt.color || 'text-[#006D77]'}`}
                  >
                    {opt.icon}
                    <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setShowAvatarPopup(false)}
                className="w-full mt-5 sm:mt-6 py-3 sm:py-4 text-[#83C5BE] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em]"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </FocusTrap>
  );
};

export default PersonalInfoEdit;

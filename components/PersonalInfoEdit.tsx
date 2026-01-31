
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Image, Trash2, Check, User as UserIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

interface PersonalInfoEditProps {
  onClose: () => void;
}

const PersonalInfoEdit: React.FC<PersonalInfoEditProps> = ({ onClose }) => {
  const { user, setUser } = useStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [tempAvatar, setTempAvatar] = useState(user?.avatar_url || '');
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      if (user) {
        setUser({ ...user, full_name: fullName, avatar_url: tempAvatar });
      }
      setIsSaving(false);
      onClose();
    }, 1000);
  };

  const avatarOptions = [
    { icon: <Camera size={20} />, label: 'Take Photo', onClick: () => setShowAvatarPopup(false) },
    { icon: <Image size={20} />, label: 'Choose from Gallery', onClick: () => setShowAvatarPopup(false) },
    { icon: <Trash2 size={20} />, label: 'Remove Photo', color: 'text-[#E29578]', onClick: () => { setTempAvatar(''); setShowAvatarPopup(false); } },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[570] bg-[#EDF6F9] flex flex-col"
    >
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-[#FFDDD2]">
        <button 
          onClick={onClose}
          className="p-2.5 rounded-2xl glass border border-white text-[#006D77] hover:bg-white transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-lg font-black text-[#006D77] tracking-tight">Edit Profile</h2>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-8 pt-12 space-y-12">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAvatarPopup(true)}
              className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl shadow-[#FFDDD2] overflow-hidden cursor-pointer group"
            >
              <img 
                src={tempAvatar || 'https://picsum.photos/seed/placeholder/200'} 
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" 
                alt="Avatar" 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </motion.div>
            
            <button 
              onClick={() => setShowAvatarPopup(true)}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#E29578] rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white"
            >
              <Camera size={18} />
            </button>
          </div>
          <p className="mt-4 text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Change Profile Picture</p>
        </div>

        {/* Input Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#006D77] uppercase tracking-widest ml-4">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#83C5BE]" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white border border-[#FFDDD2] rounded-[1.8rem] py-5 pl-14 pr-6 text-[#006D77] font-bold outline-none warm-shadow transition-all focus:border-[#006D77] placeholder:text-[#83C5BE]/40"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Save Button */}
      <div className="p-8 pb-12">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-5 rounded-[2.5rem] bg-[#006D77] text-white font-black text-lg shadow-xl shadow-[#83C5BE]/20 flex items-center justify-center gap-3 relative overflow-hidden"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Check size={24} />
            </motion.div>
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
            className="fixed inset-0 z-[580] flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-[#006D77]/20 backdrop-blur-sm" onClick={() => setShowAvatarPopup(false)} />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/50 p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-4">
                {avatarOptions.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 5 }}
                    onClick={opt.onClick}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white/50 hover:bg-white/80 transition-all border border-white/20 shadow-sm ${opt.color || 'text-[#006D77]'}`}
                  >
                    {opt.icon}
                    <span className="text-sm font-bold">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
              
              <button 
                onClick={() => setShowAvatarPopup(false)}
                className="w-full mt-6 py-4 text-[#83C5BE] font-black text-[10px] uppercase tracking-[0.3em]"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PersonalInfoEdit;

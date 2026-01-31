import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  LogOut, 
  ChevronRight, 
  Moon,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingItem: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle?: string; 
  rightElement?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}> = ({ icon, title, subtitle, rightElement, danger, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 sm:p-5 flex items-center justify-between bg-white rounded-[1.5rem] sm:rounded-[1.8rem] border border-[#FFDDD2] hover:bg-[#EDF6F9] transition-all group mb-3 sm:mb-4 warm-shadow ${danger ? 'border-[#E29578]/40' : ''}`}
  >
    <div className="flex items-center gap-3 sm:gap-5">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${danger ? 'bg-[#E29578]/10 text-[#E29578]' : 'bg-[#EDF6F9] text-[#83C5BE] group-hover:text-[#006D77]'} transition-colors shadow-sm`}>
        {icon}
      </div>
      <div className="text-left">
        <p className={`text-xs sm:text-sm font-black ${danger ? 'text-[#E29578]' : 'text-[#006D77]'}`}>{title}</p>
        {subtitle && <p className="text-[9px] sm:text-[10px] text-[#83C5BE] uppercase tracking-[0.1em] sm:tracking-[0.15em] font-bold mt-0.5 sm:mt-1">{subtitle}</p>}
      </div>
    </div>
    <div className="text-[#83C5BE] group-hover:text-[#006D77] transition-colors">
      {rightElement || <ChevronRight size={18} />}
    </div>
  </button>
);

const Toggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full p-1 sm:p-1.5 transition-colors cursor-pointer flex items-center ${active ? 'bg-[#E29578]' : 'bg-[#EDF6F9]'}`}
  >
    <motion.div 
      animate={{ x: active ? 20 : 0 }}
      className="w-4 h-4 rounded-full bg-white shadow-md"
    />
  </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-center justify-center"
    >
      <div 
        className="absolute inset-0 bg-[#006D77]/40 backdrop-blur-xl" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full h-full max-w-md bg-[#EDF6F9] overflow-y-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16"
      >
        <div className="flex justify-between items-center mb-8 sm:mb-12 px-2">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#006D77]">Account</h2>
          <button 
            onClick={onClose}
            className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl glass border border-white hover:bg-white transition-colors text-[#006D77]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Profile Section */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-5 p-4 sm:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] border-[#FFDDD2] border warm-shadow">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-[#E29578] p-1 shadow-lg shadow-[#FFDDD2]">
              <img src={user?.avatar_url} className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] object-cover border-2 sm:border-4 border-white" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-[#006D77] truncate">{user?.full_name}</h3>
              <p className="text-xs sm:text-sm font-bold text-[#83C5BE] truncate">{user?.email}</p>
              <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#E29578]/10 border border-[#E29578]/20">
                <span className="text-[9px] sm:text-[10px] font-black text-[#E29578] uppercase tracking-wider">Pro Status</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        <div className="space-y-8 sm:space-y-10">
          <div>
            <h4 className="text-[10px] sm:text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] mb-4 sm:mb-5 ml-3 sm:ml-4">Core Settings</h4>
            <SettingItem icon={<User size={18} />} title="Profile Details" subtitle="Personal Identity" />
            <SettingItem icon={<CreditCard size={18} />} title="Billing & Wallet" subtitle="Visa •••• 4242" />
          </div>

          <div>
            <h4 className="text-[10px] sm:text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] mb-4 sm:mb-5 ml-3 sm:ml-4">Preferences</h4>
            <SettingItem 
              icon={<Bell size={18} />} 
              title="Notifications" 
              subtitle="Alerts & Highlights"
              rightElement={<Toggle active={notifications} onToggle={() => setNotifications(!notifications)} />}
            />
            <SettingItem 
              icon={<Smartphone size={18} />} 
              title="Biometrics" 
              subtitle="Quick Unlock"
              rightElement={<Toggle active={biometrics} onToggle={() => setBiometrics(!biometrics)} />}
            />
            <SettingItem icon={<Moon size={18} />} title="App Theme" subtitle="Lite & Warm" />
          </div>

          <div>
            <h4 className="text-[10px] sm:text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] mb-4 sm:mb-5 ml-3 sm:ml-4">Account Safety</h4>
            <SettingItem icon={<Shield size={18} />} title="Privacy Controls" />
            <SettingItem icon={<LogOut size={18} />} title="Sign Out" danger onClick={onClose} />
          </div>
        </div>

        <div className="mt-12 sm:mt-16 text-center opacity-40">
          <p className="text-[10px] sm:text-[11px] text-[#006D77] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">Shane's Retirement Fund v2.4.0</p>
          <p className="text-[9px] sm:text-[10px] text-[#83C5BE] mt-1 font-bold">Shane Miller Enterprise</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;
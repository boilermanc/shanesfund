
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
    className={`w-full p-5 flex items-center justify-between bg-white rounded-[1.8rem] border border-[#FFDDD2] hover:bg-[#EDF6F9] transition-all group mb-4 warm-shadow ${danger ? 'border-[#E29578]/40' : ''}`}
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? 'bg-[#E29578]/10 text-[#E29578]' : 'bg-[#EDF6F9] text-[#83C5BE] group-hover:text-[#006D77]'} transition-colors shadow-sm`}>
        {icon}
      </div>
      <div className="text-left">
        <p className={`text-sm font-black ${danger ? 'text-[#E29578]' : 'text-[#006D77]'}`}>{title}</p>
        {subtitle && <p className="text-[10px] text-[#83C5BE] uppercase tracking-[0.15em] font-bold mt-1">{subtitle}</p>}
      </div>
    </div>
    <div className="text-[#83C5BE] group-hover:text-[#006D77] transition-colors">
      {rightElement || <ChevronRight size={20} />}
    </div>
  </button>
);

const Toggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-14 h-7 rounded-full p-1.5 transition-colors cursor-pointer flex items-center ${active ? 'bg-[#E29578]' : 'bg-[#EDF6F9]'}`}
  >
    <motion.div 
      animate={{ x: active ? 24 : 0 }}
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
        className="relative w-full h-full max-w-md bg-[#EDF6F9] overflow-y-auto px-6 pt-20 pb-16"
      >
        <div className="flex justify-between items-center mb-12 px-2">
          <h2 className="text-4xl font-black tracking-tighter text-[#006D77]">Account</h2>
          <button 
            onClick={onClose}
            className="p-3.5 rounded-2xl glass border border-white hover:bg-white transition-colors text-[#006D77]"
          >
            <X size={26} />
          </button>
        </div>

        {/* Profile Section */}
        <section className="mb-12">
          <div className="flex items-center gap-5 p-6 bg-white rounded-[2.5rem] border-[#FFDDD2] border warm-shadow">
            <div className="w-20 h-20 rounded-[2rem] bg-[#E29578] p-1 shadow-lg shadow-[#FFDDD2]">
              <img src={user?.avatar_url} className="w-full h-full rounded-[2rem] object-cover border-4 border-white" alt="" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#006D77]">{user?.full_name}</h3>
              <p className="text-sm font-bold text-[#83C5BE]">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E29578]/10 border border-[#E29578]/20">
                <span className="text-[10px] font-black text-[#E29578] uppercase tracking-wider">Pro Status</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        <div className="space-y-10">
          <div>
            <h4 className="text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.35em] mb-5 ml-4">Core Settings</h4>
            <SettingItem icon={<User size={20} />} title="Profile Details" subtitle="Personal Identity" />
            <SettingItem icon={<CreditCard size={20} />} title="Billing & Wallet" subtitle="Visa •••• 4242" />
          </div>

          <div>
            <h4 className="text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.35em] mb-5 ml-4">Preferences</h4>
            <SettingItem 
              icon={<Bell size={20} />} 
              title="Notifications" 
              subtitle="Alerts & Highlights"
              rightElement={<Toggle active={notifications} onToggle={() => setNotifications(!notifications)} />}
            />
            <SettingItem 
              icon={<Smartphone size={20} />} 
              title="Biometrics" 
              subtitle="Quick Unlock"
              rightElement={<Toggle active={biometrics} onToggle={() => setBiometrics(!biometrics)} />}
            />
            <SettingItem icon={<Moon size={20} />} title="App Theme" subtitle="Lite & Warm" />
          </div>

          <div>
            <h4 className="text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.35em] mb-5 ml-4">Account Safety</h4>
            <SettingItem icon={<Shield size={20} />} title="Privacy Controls" />
            <SettingItem icon={<LogOut size={20} />} title="Sign Out" danger onClick={onClose} />
          </div>
        </div>

        <div className="mt-16 text-center opacity-40">
          <p className="text-[11px] text-[#006D77] font-black uppercase tracking-[0.4em]">Shane's Retirement Fund v2.4.0</p>
          <p className="text-[10px] text-[#83C5BE] mt-1 font-bold">Shane Miller Enterprise</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;

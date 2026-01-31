import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Trophy, Users, Shield, Zap, Info } from 'lucide-react';

interface NotificationSettingsProps {
  onClose: () => void;
}

const Toggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-[#E29578]' : 'bg-[#EDF6F9] border border-[#FFDDD2]'}`}
  >
    <motion.div 
      animate={{ x: active ? 18 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-lg ${active ? 'bg-white' : 'bg-[#83C5BE]'}`}
    />
  </button>
);

const SettingItem: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  active: boolean; 
  onToggle: () => void 
}> = ({ icon, title, desc, active, onToggle }) => (
  <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-[#FFDDD2] warm-shadow flex items-center justify-between group transition-all hover:border-[#83C5BE]/40 gap-3">
    <div className="flex items-start gap-3 sm:gap-5 min-w-0 flex-1">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors shrink-0 ${active ? 'bg-[#E29578]/10 text-[#E29578]' : 'bg-[#EDF6F9] text-[#83C5BE]'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-black text-[#006D77] tracking-tight">{title}</h4>
        <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] uppercase tracking-widest mt-1 sm:mt-1.5 leading-tight">{desc}</p>
      </div>
    </div>
    <Toggle active={active} onToggle={onToggle} />
  </div>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState({
    jackpot: true,
    reminders: true,
    friendActivity: false,
    security: true,
    marketing: false
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[570] bg-[#EDF6F9] flex flex-col"
    >
      {/* Header */}
      <header className="px-4 sm:px-6 pt-10 sm:pt-14 pb-4 sm:pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-[#FFDDD2]">
        <button 
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl glass border border-white text-[#006D77] hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5">Alert Preferences</p>
          <h2 className="text-base sm:text-lg font-black text-[#006D77] tracking-tight">Stay in the Loop</h2>
        </div>
        <div className="w-9 sm:w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Info Card */}
        <div className="bg-[#006D77] p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-[#006D77]/20">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 blur-3xl" />
          <div className="relative z-10 flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <Info size={20} className="text-[#83C5BE]" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-none">Smart Alerts</h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-white/60 leading-relaxed uppercase tracking-widest">
                Shane only pings you when the retirement needle moves or your syndicate needs leadership.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-3 sm:ml-4">Syndicate Pulse</h3>
          <div className="space-y-3 sm:space-y-4">
            <SettingItem 
              icon={<Trophy size={18} />}
              title="Jackpot Results"
              desc="Get alerted the second we hit a winner."
              active={settings.jackpot}
              onToggle={() => toggleSetting('jackpot')}
            />
            <SettingItem 
              icon={<Zap size={18} />}
              title="Fund Reminders"
              desc="Nudges for contributions before the draw."
              active={settings.reminders}
              onToggle={() => toggleSetting('reminders')}
            />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-3 sm:ml-4">Social & Security</h3>
          <div className="space-y-3 sm:space-y-4">
            <SettingItem 
              icon={<Users size={18} />}
              title="Friend Activity"
              desc="Know when your circle starts new pools."
              active={settings.friendActivity}
              onToggle={() => toggleSetting('friendActivity')}
            />
            <SettingItem 
              icon={<Shield size={18} />}
              title="Security Alerts"
              desc="Account access and login verification."
              active={settings.security}
              onToggle={() => toggleSetting('security')}
            />
          </div>
        </div>
        
        <div className="pb-8 sm:pb-10 text-center">
          <p className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            Shane says: "No spam, just early retirement news."
          </p>
        </div>
      </main>
    </motion.div>
  );
};

export default NotificationSettings;
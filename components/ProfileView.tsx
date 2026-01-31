import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Star, 
  ChevronRight, 
  LogOut
} from 'lucide-react';
import { useStore } from '../store/useStore';
import PersonalInfoEdit from './PersonalInfoEdit';
import NotificationSettings from './NotificationSettings';
import ShaneMascot from './ShaneMascot';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const StatCard: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value }) => (
  <motion.div 
    variants={itemVariants}
    className="bg-white p-5 rounded-[2rem] border border-[#FFDDD2] shadow-sm flex flex-col justify-center items-center text-center"
  >
    <span className="text-2xl font-black text-[#006D77] tracking-tight">{value}</span>
    <span className="text-[10px] font-black text-[#83C5BE] uppercase tracking-widest mt-1">{label}</span>
  </motion.div>
);

const SettingRow: React.FC<{ icon: React.ReactNode; title: string; onClick?: () => void }> = ({ icon, title, onClick }) => (
  <motion.div 
    variants={itemVariants}
    onClick={onClick}
    className="flex items-center justify-between py-5 border-b border-[#FFDDD2] last:border-0 group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="text-[#006D77]">
        {icon}
      </div>
      <span className="text-sm font-bold text-[#006D77] group-hover:translate-x-1 transition-transform">{title}</span>
    </div>
    <ChevronRight size={16} className="text-[#83C5BE]" />
  </motion.div>
);

const ProfileView: React.FC = () => {
  const { user, setAuthenticated } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 pt-12 pb-24 -mx-6 px-6 bg-[#F2E9D4] min-h-full"
    >
      <AnimatePresence>
        {showEdit && <PersonalInfoEdit key="edit-info" onClose={() => setShowEdit(false)} />}
        {showNotifications && <NotificationSettings key="notif-settings" onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>

      {/* Header Section */}
      <motion.section variants={itemVariants} className="flex flex-col items-center">
        <div className="relative">
          <ShaneMascot size="lg" expression="normal" animate />
          {/* Pro Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#E29578] px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-[#FFDDD2] z-10">
            <Star size={12} className="text-white fill-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Pro Member</span>
          </div>
        </div>
        <div className="text-center mt-8">
          <h1 className="shane-serif text-3xl font-black text-[#4A5D4E] tracking-tighter">
            {user?.full_name?.split(' ')[0] || 'Shane'}
          </h1>
          <p className="text-[10px] font-black text-[#006D77] uppercase tracking-[0.3em] opacity-40 mt-1">Syndicate Leader</p>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
        <StatCard value="5" label="Active Pools" />
        <StatCard value="$142.50" label="Won" />
      </motion.section>

      {/* Subscription & Wealth Card */}
      <motion.section 
        variants={itemVariants}
        className="rounded-[2.5rem] p-8 border border-white warm-shadow relative overflow-hidden bg-white/40 backdrop-blur-md"
      >
        <div className="relative z-10">
          <h3 className="text-sm font-black text-[#006D77] uppercase tracking-[0.2em] mb-4">Retirement Progress</h3>
          
          <div className="space-y-3">
            <div className="h-4 w-full bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '35%' }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="h-full bg-[#4A5D4E]"
              />
            </div>
            <p className="text-[11px] font-bold text-[#006D77] leading-relaxed">
              Shane says: You're <span className="font-black text-[#E29578]">$857.50</span> away from your next milestone!
            </p>
          </div>
        </div>
      </motion.section>

      {/* Settings Menu */}
      <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-6 border border-[#FFDDD2] shadow-sm">
        <SettingRow 
          icon={<User size={18} />} 
          title="Personal Information" 
          onClick={() => setShowEdit(true)}
        />
        <SettingRow 
          icon={<Bell size={18} />} 
          title="Notification Settings" 
          onClick={() => setShowNotifications(true)}
        />
        <SettingRow icon={<LogOut size={18} />} title="Log Out" onClick={() => setAuthenticated(false)} />
      </motion.section>

      <div className="text-center pb-8">
        <p className="text-[9px] font-black text-[#4A5D4E] uppercase tracking-widest opacity-20">v2.4.0 • Built with trust</p>
      </div>
    </motion.div>
  );
};

export default ProfileView;
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Trophy, UserPlus, CreditCard, ChevronRight } from 'lucide-react';

const NotificationsCenter: React.FC = () => {
  const notifications = [
    {
      id: 1,
      type: 'win',
      icon: <Trophy size={16} />,
      title: 'Jackpot hit!',
      desc: 'The Weekly Retirement Goal pool just hit 4 numbers.',
      time: '2m ago',
      color: 'bg-[#E29578]'
    },
    {
      id: 2,
      type: 'invite',
      icon: <UserPlus size={16} />,
      title: 'Invite Received',
      desc: 'Mike Ross invited you to "High Rollers 2024".',
      time: '1h ago',
      color: 'bg-[#006D77]'
    },
    {
      id: 3,
      type: 'payment',
      icon: <CreditCard size={16} />,
      title: 'Payment Successful',
      desc: '$50 contribution confirmed for Mega Millions.',
      time: '5h ago',
      color: 'bg-[#83C5BE]'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 sm:space-y-10 pt-6 sm:pt-8"
    >
      <div className="px-2">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#006D77]">Alerts</h2>
        <p className="text-xs sm:text-sm font-bold text-[#83C5BE] mt-1">Updates from your syndicates</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] warm-shadow flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${notif.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                {notif.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-black text-[#006D77]">{notif.title}</h4>
                <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-bold leading-tight mt-0.5 truncate">{notif.desc}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="text-[9px] sm:text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">{notif.time}</p>
              <ChevronRight size={12} className="text-[#83C5BE] ml-auto mt-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#EDF6F9] p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-[#83C5BE]/30 text-center">
        <Bell size={32} className="text-[#83C5BE]/40 mx-auto mb-3 sm:mb-4" />
        <p className="text-[10px] sm:text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">No more recent updates</p>
      </div>
    </motion.div>
  );
};

export default NotificationsCenter;
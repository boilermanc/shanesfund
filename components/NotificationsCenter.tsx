
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Trophy, UserPlus, CreditCard, ChevronRight } from 'lucide-react';

const NotificationsCenter: React.FC = () => {
  const notifications = [
    {
      id: 1,
      type: 'win',
      icon: <Trophy size={18} />,
      title: 'Jackpot hit!',
      desc: 'The Weekly Retirement Goal pool just hit 4 numbers.',
      time: '2m ago',
      color: 'bg-[#E29578]'
    },
    {
      id: 2,
      type: 'invite',
      icon: <UserPlus size={18} />,
      title: 'Invite Received',
      desc: 'Mike Ross invited you to "High Rollers 2024".',
      time: '1h ago',
      color: 'bg-[#006D77]'
    },
    {
      id: 3,
      type: 'payment',
      icon: <CreditCard size={18} />,
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
      className="space-y-10 pt-8"
    >
      <div className="px-2">
        <h2 className="text-3xl font-black tracking-tighter text-[#006D77]">Alerts</h2>
        <p className="text-sm font-bold text-[#83C5BE] mt-1">Updates from your syndicates</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-[2rem] border border-[#FFDDD2] warm-shadow flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${notif.color} text-white flex items-center justify-center shadow-lg`}>
                {notif.icon}
              </div>
              <div>
                <h4 className="text-sm font-black text-[#006D77]">{notif.title}</h4>
                <p className="text-[11px] text-[#83C5BE] font-bold leading-tight mt-0.5">{notif.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#83C5BE] font-black uppercase tracking-widest">{notif.time}</p>
              <ChevronRight size={14} className="text-[#83C5BE] ml-auto mt-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#EDF6F9] p-8 rounded-[3rem] border-2 border-dashed border-[#83C5BE]/30 text-center">
        <Bell size={40} className="text-[#83C5BE]/40 mx-auto mb-4" />
        <p className="text-[11px] text-[#83C5BE] font-black uppercase tracking-[0.3em]">No more recent updates</p>
      </div>
    </motion.div>
  );
};

export default NotificationsCenter;

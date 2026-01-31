
import React from 'react';
import { Home, ClipboardList, Users, User, BarChart3, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'friends', icon: Heart, label: 'Friends' },
    { id: 'spacer', icon: null, label: '' }, // Placeholder for center floating action
    { id: 'results', icon: ClipboardList, label: 'Results' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[45] px-4 pb-6"
    >
      <div className="relative h-20 bg-[#EDF6F9]/80 backdrop-blur-xl border border-[#83C5BE] rounded-[2.5rem] px-2 flex justify-around items-center warm-shadow pointer-events-auto shadow-[0_15px_40px_-10px_rgba(255,221,210,1)]">
        {tabs.map((tab, index) => {
          if (tab.id === 'spacer') {
            return <div key="spacer" className="w-16" />;
          }

          const Icon = tab.icon!;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all outline-none"
            >
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  color: isActive ? '#006D77' : '#83C5BE'
                }}
                className={isActive ? 'opacity-100' : 'opacity-60'}
              >
                <Icon size={24} strokeWidth={isActive ? 3 : 2} />
              </motion.div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="navIndicator"
                    className="absolute -bottom-1 w-1.5 h-1.5 bg-[#E29578] rounded-full"
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BottomNav;

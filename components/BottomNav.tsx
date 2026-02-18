import React from 'react';
import { Home, ClipboardList, BarChart3, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const unreadCount = useStore((s) => s.unreadCount);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'friends', icon: Heart, label: 'Friends' },
    { id: 'spacer', icon: null, label: '' },
    { id: 'results', icon: ClipboardList, label: 'Results' },
    { id: 'insights', icon: BarChart3, label: 'Insights' },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[45] px-3 sm:px-4 bottom-nav-safe md:hidden"
    >
      <div className="relative h-16 sm:h-20 bg-[#EDF6F9]/80 backdrop-blur-xl border border-[#83C5BE] rounded-[2rem] sm:rounded-[2.5rem] px-1 sm:px-2 flex justify-around items-center warm-shadow pointer-events-auto shadow-[0_15px_40px_-10px_rgba(255,221,210,1)]">
        {tabs.map((tab, index) => {
          if (tab.id === 'spacer') {
            return <div key="spacer" className="w-12 sm:w-16" />;
          }

          const Icon = tab.icon!;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all outline-none"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    color: isActive ? '#006D77' : '#83C5BE'
                  }}
                  className={isActive ? 'opacity-100' : 'opacity-60'}
                >
                  <Icon size={18} strokeWidth={isActive ? 3 : 2} className="sm:hidden" />
                  <Icon size={22} strokeWidth={isActive ? 3 : 2} className="hidden sm:block" />
                </motion.div>
                <AnimatePresence>
                  {tab.id === 'home' && unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                      className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#E29578] text-white text-[9px] font-black flex items-center justify-center px-1"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold mt-0.5 transition-colors ${isActive ? 'text-[#006D77]' : 'text-[#83C5BE]/60'}`}>
                {tab.label}
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-0.5 sm:-bottom-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#E29578] rounded-full"
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
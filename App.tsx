
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { getMockPools } from './lib/supabase';
import { Pool } from './types';

// Components
import DashboardHeader from './components/DashboardHeader';
import PoolCarousel from './components/PoolCarousel';
import QuickActions from './components/QuickActions';
import BottomNav from './components/BottomNav';
import PoolList from './components/PoolList';
import TheBoard from './components/TheBoard';
import WealthInsights from './components/WealthInsights';
import ProfileView from './components/ProfileView';
import FriendsView from './components/FriendsView';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import TicketScanner from './components/TicketScanner';
import WinningMoment from './components/WinningMoment';
import ProUpgradeModal from './components/ProUpgradeModal';
import CreatePoolWizard from './components/CreatePoolWizard';
import JoinPoolScreen from './components/JoinPoolScreen';
import SettingsModal from './components/SettingsModal';
import ShaneWinnerAlert from './components/ShaneWinnerAlert';
import ContributionLedger from './components/ContributionLedger';
import NotificationsCenter from './components/NotificationsCenter';
import SkeletonLoader from './components/SkeletonLoader';

const App: React.FC = () => {
  const { 
    user, 
    pools, 
    isLoading, 
    isOnboarded, 
    isAuthenticated,
    showWinnerAlert,
    setPools, 
    setLoading,
    setWinnerAlert
  } = useStore();

  const [activeTab, setActiveTab] = useState('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPoolForLedger, setSelectedPoolForLedger] = useState<Pool | null>(null);

  useEffect(() => {
    // Initial data load
    const loadData = async () => {
      setLoading(true);
      const mockPools = getMockPools();
      setPools(mockPools);
      
      // Simulate network delay
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };

    loadData();
  }, [setPools, setLoading]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 pb-32">
            {isLoading ? (
              <SkeletonLoader type="header" />
            ) : (
              <DashboardHeader user={user} totalPoolValue={46550} />
            )}

            <section className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <div>
                  <h3 className="text-xl font-black text-[#006D77] tracking-tight">Active Pools</h3>
                  <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Draws happening soon</p>
                </div>
                <button 
                  onClick={() => setShowProUpgrade(true)}
                  className="text-[10px] font-black text-[#E29578] uppercase tracking-widest border-b border-[#E29578]/30 pb-1"
                >
                  Go Pro
                </button>
              </div>
              
              {isLoading ? (
                <SkeletonLoader type="carousel" />
              ) : (
                <PoolCarousel pools={pools} onJoin={() => setShowJoinPool(true)} />
              )}
            </section>

            <section className="space-y-4 px-2">
              <h3 className="text-xl font-black text-[#006D77] tracking-tight">Syndicates</h3>
              {isLoading ? (
                <>
                  <SkeletonLoader type="card" />
                  <SkeletonLoader type="card" />
                </>
              ) : (
                <PoolList pools={pools} onJoin={(pool) => setSelectedPoolForLedger(pool)} />
              )}
            </section>
          </div>
        );
      case 'friends':
        return (
          <FriendsView 
            onOpenProfile={() => {}} 
            onOpenRequests={() => {}} 
            onOpenPool={(id) => {
              const pool = pools.find(p => p.id === id);
              if (pool) setSelectedPoolForLedger(pool);
            }} 
          />
        );
      case 'results':
        return (
          <TheBoard onOpenPool={(id) => {
            const pool = pools.find(p => p.id === id);
            if (pool) setSelectedPoolForLedger(pool);
          }} />
        );
      case 'insights':
        return <WealthInsights />;
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-[#EDF6F9]">
      <div className="px-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <QuickActions 
        onScanTicket={() => setShowScanner(true)}
        onCreatePool={() => setShowCreatePool(true)}
        onJoinPool={() => setShowJoinPool(true)}
      />

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showScanner && (
          <TicketScanner onClose={() => setShowScanner(false)} />
        )}
        
        {showCreatePool && (
          <CreatePoolWizard 
            onClose={() => setShowCreatePool(false)} 
            onComplete={() => setShowCreatePool(false)} 
          />
        )}

        {showJoinPool && (
          <JoinPoolScreen 
            onClose={() => setShowJoinPool(false)} 
            onJoinSuccess={() => setShowJoinPool(false)} 
          />
        )}

        {showProUpgrade && (
          <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />
        )}

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}

        {selectedPoolForLedger && (
          <ContributionLedger 
            pool={selectedPoolForLedger} 
            onClose={() => setSelectedPoolForLedger(null)} 
          />
        )}
      </AnimatePresence>

      <ShaneWinnerAlert 
        isVisible={showWinnerAlert} 
        onClose={() => setWinnerAlert(false)} 
      />
    </div>
  );
};

export default App;

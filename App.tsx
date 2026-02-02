import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { getUserPools } from './services/pools';
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
import PoolDetailView from './components/PoolDetailView';
import NotificationsCenter from './components/NotificationsCenter';
import SkeletonLoader from './components/SkeletonLoader';
import LandingPage from './components/landing/LandingPage';
import AdminPage from './components/admin/AdminPage';
// Temporary type for pool display until components are updated
interface DisplayPool {
  id: string;
  name: string;
  total_jackpot?: number;
  current_pool_value?: number;
  participants_count?: number;
  draw_date?: string;
  status?: string;
  game_type?: string;
  contribution_amount?: number;
  members_count?: number;
}
// Main App Content (extracted for cleaner routing)
const MainApp: React.FC = () => {
  const { user: authUser, session, loading: authLoading } = useAuth();
  const {
    user,
    pools,
    isLoading,
    isOnboarded,
    isAuthenticated,
    showWinnerAlert,
    setUser,
    setPools,
    setLoading,
    setAuthenticated,
    setWinnerAlert
  } = useStore();
  const [activeTab, setActiveTab] = useState('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPoolForLedger, setSelectedPoolForLedger] = useState<DisplayPool | null>(null);
  const [selectedPoolIdForDetail, setSelectedPoolIdForDetail] = useState<string | null>(null);
  // Sync auth state with store
  useEffect(() => {
    if (!authLoading) {
      setUser(authUser);
      setAuthenticated(!!authUser);
      setLoading(false);
    }
  }, [authUser, authLoading, setUser, setAuthenticated, setLoading]);
  // Load pools when authenticated
  useEffect(() => {
    const loadPools = async () => {
      if (user?.id) {
        setLoading(true);
        const { data, error } = await getUserPools(user.id);
        if (data && !error) {
          setPools(data);
        }
        setLoading(false);
      }
    };
    if (isAuthenticated && user?.id) {
      loadPools();
    }
  }, [isAuthenticated, user?.id, setPools, setLoading]);
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex items-center justify-center bg-[#EDF6F9]">
        <div className="text-center">
          <img src="/logo.png" alt="Shane's Retirement Fund" className="h-24 w-auto mx-auto mb-4" />
          <div className="animate-pulse text-[#006D77] font-medium">Loading...</div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <LandingPage />;
  }
  if (!isOnboarded) {
    return <Onboarding />;
  }
  // Transform pools for display components (bridge between old and new types)
  const displayPools: DisplayPool[] = pools.map(pool => ({
    id: pool.id,
    name: pool.name,
    total_jackpot: 0, // Will come from lottery_draws later
    current_pool_value: Number(pool.total_collected) || 0,
    participants_count: (pool as any).members_count || 0,
    draw_date: new Date().toISOString().split('T')[0],
    status: pool.status,
    game_type: pool.game_type,
    contribution_amount: Number(pool.contribution_amount) || 5,
    members_count: (pool as any).members_count || 0,
  }));
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 pb-32">
            {isLoading ? (
              <SkeletonLoader type="header" />
            ) : (
              <DashboardHeader user={user as any} totalPoolValue={displayPools.reduce((sum, p) => sum + (p.current_pool_value || 0), 0)} />
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
                <PoolCarousel pools={displayPools as any} onJoin={() => setShowJoinPool(true)} onPoolClick={(id) => setSelectedPoolIdForDetail(id)} />
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
                <PoolList pools={displayPools as any} onJoin={(pool) => setSelectedPoolIdForDetail(pool.id)} />
              )}
            </section>
          </div>
        );
      case 'friends':
        return (
          <FriendsView
            onOpenProfile={() => {}}
            onOpenRequests={() => {}}
            onOpenPool={(id) => setSelectedPoolIdForDetail(id)}
          />
        );
      case 'results':
        return (
          <TheBoard onOpenPool={(id) => setSelectedPoolIdForDetail(id)} />
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
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-[#EDF6F9]" style={{ minHeight: '100dvh' }}>
      <div className="px-4 sm:px-6 relative z-10 safe-area-top">
        <div className="flex justify-center pt-4 sm:pt-6 pb-3 sm:pb-4">
          <img src="/logo.png" alt="Shane's Retirement Fund" className="h-16 sm:h-24 w-auto" />
        </div>
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
            pool={selectedPoolForLedger as any}
            onClose={() => setSelectedPoolForLedger(null)}
          />
        )}
        {selectedPoolIdForDetail && (
          <PoolDetailView
            poolId={selectedPoolIdForDetail}
            onClose={() => setSelectedPoolIdForDetail(null)}
            onOpenLedger={() => {
              const pool = displayPools.find(p => p.id === selectedPoolIdForDetail);
              if (pool) {
                setSelectedPoolForLedger(pool);
              }
            }}
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
// App with Routes
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
};
export default App;

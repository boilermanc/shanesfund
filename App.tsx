import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { getUserPools } from './services/pools';
import type { DisplayPool } from './types/database';
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
import FriendMiniProfile from './components/FriendMiniProfile';
import AcceptFriendModal from './components/AcceptFriendModal';
import type { FriendWithProfile } from './services/friends';
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
import TopNav from './components/TopNav';
import LandingPage from './components/landing/LandingPage';
import AdminPage from './components/admin/AdminPage';
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
    setWinnerAlert,
    pendingRequests,
    removeFriend: storeRemoveFriend,
    acceptFriendRequest: storeAcceptFriend,
    declineFriendRequest: storeDeclineFriend,
    fetchFriends,
    fetchPendingRequests,
  } = useStore();
  const [activeTab, setActiveTab] = useState('home');
  // Update document.title based on active tab
  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Dashboard — Shane's Retirement Fund",
      friends: "Friends — Shane's Retirement Fund",
      results: "My Pools — Shane's Retirement Fund",
      insights: "Insights — Shane's Retirement Fund",
      profile: "Profile — Shane's Retirement Fund",
    };
    document.title = titles[activeTab] || "Shane's Retirement Fund";
  }, [activeTab]);
  const [showScanner, setShowScanner] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPoolForLedger, setSelectedPoolForLedger] = useState<DisplayPool | null>(null);
  const [selectedPoolIdForDetail, setSelectedPoolIdForDetail] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);
  const [pendingRequestToReview, setPendingRequestToReview] = useState<FriendWithProfile | null>(null);
  // Wire up realtime notifications
  useNotifications(user?.id);
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
      <div className="min-h-screen flex items-center justify-center bg-[#EDF6F9]">
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
    participants_count: pool.members_count || 0,
    draw_date: new Date().toISOString().split('T')[0],
    status: pool.status,
    game_type: pool.game_type,
    contribution_amount: Number(pool.contribution_amount) || 5,
    members_count: pool.members_count || 0,
  }));
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 pb-32 md:pb-12">
            {isLoading ? (
              <SkeletonLoader type="header" />
            ) : (
              <DashboardHeader user={user} totalPoolValue={displayPools.reduce((sum, p) => sum + (p.current_pool_value || 0), 0)} onOpenNotifications={() => setShowNotifications(true)} />
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
                <PoolCarousel pools={displayPools} onJoin={() => setShowJoinPool(true)} onPoolClick={(id) => setSelectedPoolIdForDetail(id)} />
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
                <PoolList pools={displayPools} onJoin={(pool) => setSelectedPoolIdForDetail(pool.id)} />
              )}
            </section>
          </div>
        );
      case 'friends':
        return (
          <FriendsView
            onOpenProfile={(friend) => setSelectedFriend(friend)}
            onOpenRequests={() => {
              if (pendingRequests.length > 0) {
                setPendingRequestToReview(pendingRequests[0]);
              }
            }}
            onOpenPool={(id) => setSelectedPoolIdForDetail(id)}
          />
        );
      case 'results':
        return (
          <TheBoard onOpenPool={(id) => setSelectedPoolIdForDetail(id)} onJoinPool={() => setShowJoinPool(true)} />
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
    <div className="min-h-screen bg-[#EDF6F9]" style={{ minHeight: '100dvh' }}>
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onScanTicket={() => setShowScanner(true)}
        onCreatePool={() => setShowCreatePool(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        user={user}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 safe-area-top">
        <div className="flex justify-center pt-4 sm:pt-6 pb-3 sm:pb-4 md:hidden">
          <img src="/logo.png" alt="Shane's Retirement Fund" className="h-16 sm:h-24 w-auto" />
        </div>
        <div className="md:pt-20">
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
      </div>
      <div className="md:hidden">
        <QuickActions
          onScanTicket={() => setShowScanner(true)}
          onCreatePool={() => setShowCreatePool(true)}
          onJoinPool={() => setShowJoinPool(true)}
        />
      </div>
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      {/* Modals & Overlays */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationsCenter onClose={() => setShowNotifications(false)} />
        )}
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
      <FriendMiniProfile
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onRemoveFriend={async (friendshipId) => {
          if (user?.id) {
            await storeRemoveFriend(friendshipId, user.id);
          }
          setSelectedFriend(null);
        }}
      />
      <AcceptFriendModal
        isVisible={!!pendingRequestToReview}
        friendName={pendingRequestToReview?.displayName || ''}
        friendAvatarUrl={pendingRequestToReview?.avatarUrl}
        onAccept={async () => {
          if (pendingRequestToReview && user?.id) {
            await storeAcceptFriend(pendingRequestToReview.id, user.id);
            // Show next pending request or close
            const remaining = pendingRequests.filter((r) => r.id !== pendingRequestToReview.id);
            setPendingRequestToReview(remaining.length > 0 ? remaining[0] : null);
          }
        }}
        onDecline={async () => {
          if (pendingRequestToReview && user?.id) {
            await storeDeclineFriend(pendingRequestToReview.id, user.id);
            const remaining = pendingRequests.filter((r) => r.id !== pendingRequestToReview.id);
            setPendingRequestToReview(remaining.length > 0 ? remaining[0] : null);
          }
        }}
        onClose={() => setPendingRequestToReview(null)}
      />
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

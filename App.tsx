import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

// Error Boundary to prevent white-screen crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#EDF6F9] p-6">
          <div className="text-center max-w-md">
            <img src="/logo.png" alt="Shane's Retirement Fund" className="h-20 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-black text-[#006D77] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#83C5BE] mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#006D77] text-white font-bold rounded-2xl"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { getUserPools } from './services/pools';
import { supabase } from './lib/supabase';
import { getNextDrawDate } from './utils/drawSchedule';
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
import ManualTicketEntry from './components/ManualTicketEntry';
import WinningMoment from './components/WinningMoment';
import ProUpgradeModal from './components/ProUpgradeModal';
import CreatePoolWizard from './components/CreatePoolWizard';
import CreateSyndicateModal from './components/CreateSyndicateModal';
import SyndicateDetailView from './components/SyndicateDetailView';
import JoinPoolScreen from './components/JoinPoolScreen';
import SettingsModal from './components/SettingsModal';
import ShaneWinnerAlert from './components/ShaneWinnerAlert';
import ContributionLedger from './components/ContributionLedger';
import PoolDetailView from './components/PoolDetailView';
import NotificationBell from './components/NotificationBell';
import NotificationPanel from './components/NotificationPanel';
import SkeletonLoader from './components/SkeletonLoader';
import TopNav from './components/TopNav';
import AppDrawer from './components/AppDrawer';
import Toast from './components/Toast';
import LandingPage from './components/landing/LandingPage';
const TermsOfService = React.lazy(() => import('./components/landing/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./components/landing/PrivacyPolicy'));
const ContactPage = React.lazy(() => import('./components/landing/ContactPage'));
import AdminPage from './components/admin/AdminPage';
// Main App Content (extracted for cleaner routing)
const MainApp: React.FC = () => {
  const { user: authUser, loading: authLoading } = useAuth();
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
    setWinnerAlert,
    pendingRequests,
    removeFriend: storeRemoveFriend,
    acceptFriendRequest: storeAcceptFriend,
    declineFriendRequest: storeDeclineFriend,
    fetchFriends,
    fetchPendingRequests,
    logout,
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
  const [scannerPoolContext, setScannerPoolContext] = useState<{ id: string; name: string; game_type: 'powerball' | 'mega_millions' } | undefined>();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryGameType, setManualEntryGameType] = useState<'powerball' | 'mega_millions' | undefined>();
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [createPoolGameType, setCreatePoolGameType] = useState<'powerball' | 'mega_millions' | undefined>();
  const [showJoinPool, setShowJoinPool] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPoolForLedger, setSelectedPoolForLedger] = useState<DisplayPool | null>(null);
  const [selectedPoolIdForDetail, setSelectedPoolIdForDetail] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);
  const [pendingRequestToReview, setPendingRequestToReview] = useState<FriendWithProfile | null>(null);
  const [showCreateSyndicate, setShowCreateSyndicate] = useState(false);
  const [selectedSyndicateId, setSelectedSyndicateId] = useState<string | null>(null);
  const [jackpots, setJackpots] = useState<Record<string, number>>({});
  const [winData, setWinData] = useState<Record<string, any> | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [poolsWithUpcomingTickets, setPoolsWithUpcomingTickets] = useState<Set<string>>(new Set());
  const [drawerPage, setDrawerPage] = useState<'terms' | 'privacy' | 'contact' | null>(null);
  const handleDrawerNavigate = (page: 'profile' | 'terms' | 'privacy' | 'contact') => {
    setShowDrawer(false);
    if (page === 'profile') {
      setActiveTab('profile');
    } else {
      setDrawerPage(page);
    }
  };
  const handleLogout = async () => {
    setShowDrawer(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Unexpected error during signOut:', err);
    } finally {
      logout();
    }
  };
  // Wire up realtime notifications
  useNotifications(user?.id);
  // Sync auth state with store (setUser already sets isAuthenticated)
  useEffect(() => {
    if (!authLoading) {
      setUser(authUser);
      setLoading(false);
    }
  }, [authUser, authLoading, setUser, setLoading]);
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
  // Fetch latest jackpot amounts from lottery_draws
  useEffect(() => {
    const fetchJackpots = async () => {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('game_type, jackpot_amount')
        .order('draw_date', { ascending: false })
        .limit(10);
      if (error) {
        console.error('Failed to fetch jackpots:', error.message);
        return;
      }
      const draws = data as { game_type: string; jackpot_amount: number | null }[] | null;
      if (draws) {
        const map: Record<string, number> = {};
        for (const draw of draws) {
          if (!map[draw.game_type] && draw.jackpot_amount != null) {
            map[draw.game_type] = draw.jackpot_amount;
          }
        }
        setJackpots(map);
      }
    };
    if (isAuthenticated) fetchJackpots();
  }, [isAuthenticated]);
  // Fetch which pools have tickets for the next upcoming draw
  useEffect(() => {
    const fetchUpcomingTickets = async () => {
      if (pools.length === 0) {
        setPoolsWithUpcomingTickets(new Set());
        return;
      }

      const poolIds = pools.map(p => p.id);
      const nextPbRaw = getNextDrawDate('powerball');
      const nextMmRaw = getNextDrawDate('mega_millions');
      const nextPbDate = nextPbRaw.toISOString().split('T')[0];
      const nextMmDate = nextMmRaw.toISOString().split('T')[0];

      console.log('[upcomingTickets] pool IDs:', poolIds);
      console.log('[upcomingTickets] getNextDrawDate powerball raw:', nextPbRaw, '→', nextPbDate);
      console.log('[upcomingTickets] getNextDrawDate mega_millions raw:', nextMmRaw, '→', nextMmDate);
      console.log('[upcomingTickets] querying tickets with draw_date IN', [nextPbDate, nextMmDate]);

      const { data, error } = await supabase
        .from('tickets')
        .select('pool_id, draw_date, game_type')
        .in('pool_id', poolIds)
        .in('draw_date', [nextPbDate, nextMmDate]);

      console.log('[upcomingTickets] query result — data:', data, 'error:', error);

      if (error) {
        console.error('Failed to fetch upcoming tickets:', error.message);
        setPoolsWithUpcomingTickets(new Set());
        return;
      }

      // Also fetch ALL tickets for these pools to see what draw_dates exist
      const { data: allTickets } = await supabase
        .from('tickets')
        .select('pool_id, draw_date, game_type')
        .in('pool_id', poolIds)
        .order('draw_date', { ascending: false })
        .limit(20);
      console.log('[upcomingTickets] all recent tickets for comparison:', allTickets);

      const matchedPoolIds = new Set((data || []).map(t => t.pool_id));
      console.log('[upcomingTickets] matched pool IDs:', [...matchedPoolIds]);
      setPoolsWithUpcomingTickets(matchedPoolIds);
    };

    if (isAuthenticated && pools.length > 0) {
      fetchUpcomingTickets();
    } else {
      setPoolsWithUpcomingTickets(new Set());
    }
  }, [isAuthenticated, pools]);
  // Transform pools for display components (bridge between old and new types)
  // NOTE: This must be above early returns to maintain consistent hook call order
  const displayPools: DisplayPool[] = useMemo(() => pools.map(pool => ({
    id: pool.id,
    name: pool.name,
    captain_id: pool.captain_id,
    total_jackpot: jackpots[pool.game_type] || 0,
    current_pool_value: Number(pool.total_collected) || 0,
    participants_count: pool.members_count || 0,
    draw_date: getNextDrawDate(pool.game_type).toISOString().split('T')[0],
    status: pool.status,
    game_type: pool.game_type,
    contribution_amount: Number(pool.contribution_amount) || 5,
    members_count: pool.members_count || 0,
    total_winnings: Number(pool.total_winnings) || 0,
  })), [pools, jackpots]);

  // Filter pools that have at least one ticket entered for the next upcoming draw
  const upcomingPools = useMemo(() => {
    return displayPools.filter(pool => {
      if (pool.status === 'archived') return false;
      return poolsWithUpcomingTickets.has(pool.id);
    });
  }, [displayPools, poolsWithUpcomingTickets]);

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
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 pb-32 md:pb-12">
            {isLoading ? (
              <SkeletonLoader type="header" />
            ) : (
              <DashboardHeader user={user} totalPoolValue={displayPools.reduce((sum, p) => sum + (p.current_pool_value || 0), 0)} pools={displayPools} />
            )}
            <section className="space-y-4">
              {(isLoading || displayPools.length > 0) && (
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
              )}
              {isLoading ? (
                <SkeletonLoader type="carousel" />
              ) : upcomingPools.length > 0 ? (
                <PoolCarousel pools={upcomingPools} onJoin={() => setShowJoinPool(true)} onPoolClick={(id) => setSelectedPoolIdForDetail(id)} />
              ) : displayPools.length > 0 ? (
                <div className="bg-white/60 p-6 rounded-[2rem] border border-[#FFDDD2]/50 text-center mx-2">
                  <p className="text-sm font-bold text-[#83C5BE]">No draws coming up in the next few days</p>
                  <p className="text-[10px] text-[#83C5BE]/70 mt-1">Check back soon — your pools will appear here before each draw.</p>
                </div>
              ) : (
                <PoolCarousel pools={[]} onJoin={() => setShowJoinPool(true)} onPoolClick={(id) => setSelectedPoolIdForDetail(id)} />
              )}
            </section>
            {(isLoading || displayPools.length > 0) && (
              <section className="space-y-4 px-2">
                <h3 className="text-xl font-black text-[#006D77] tracking-tight">Pools</h3>
                {isLoading ? (
                  <>
                    <SkeletonLoader type="card" />
                    <SkeletonLoader type="card" />
                  </>
                ) : (
                  <PoolList pools={displayPools} onSelectPool={(pool) => setSelectedPoolIdForDetail(pool.id)} />
                )}
              </section>
            )}
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
            onOpenSyndicate={(id) => setSelectedSyndicateId(id)}
            onCreateSyndicate={() => setShowCreateSyndicate(true)}
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
        onOpenDrawer={() => setShowDrawer(true)}
        user={user}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 safe-area-top">
        <div className="flex justify-between items-center pt-4 sm:pt-6 pb-3 sm:pb-4 md:hidden">
          <img src="/logo.png" alt="Shane's Retirement Fund" className="h-16 sm:h-24 w-auto" />
          <div className="flex items-center gap-2">
            <NotificationBell
              onClick={() => setShowNotifications(true)}
              onWinDetected={(notification) => {
                const data = (notification.data || {}) as Record<string, any>;
                setWinData(data);
                setWinnerAlert(true);
              }}
            />
            <button
              onClick={() => setShowDrawer(true)}
              className="p-2 rounded-xl text-[#006D77] hover:bg-[#EDF6F9] transition-all"
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>
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
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
            onOpenPool={(poolId) => {
              setShowNotifications(false);
              setSelectedPoolIdForDetail(poolId);
            }}
          />
        )}
        {showScanner && (
          <TicketScanner
            onClose={() => { setShowScanner(false); setScannerPoolContext(undefined); }}
            pool={scannerPoolContext}
            onCreatePool={scannerPoolContext ? undefined : (gameType?: 'powerball' | 'mega_millions') => { setShowScanner(false); setScannerPoolContext(undefined); setCreatePoolGameType(gameType); setShowCreatePool(true); }}
            onManualEntry={(gameType?: 'powerball' | 'mega_millions') => { setShowScanner(false); setScannerPoolContext(undefined); setManualEntryGameType(gameType); setShowManualEntry(true); }}
          />
        )}
        {showManualEntry && (
          <ManualTicketEntry
            onClose={() => { setShowManualEntry(false); setManualEntryGameType(undefined); }}
            onCreatePool={(gameType?: 'powerball' | 'mega_millions') => { setShowManualEntry(false); setManualEntryGameType(undefined); setCreatePoolGameType(gameType); setShowCreatePool(true); }}
            preselectedGameType={manualEntryGameType}
          />
        )}
        {showCreatePool && (
          <CreatePoolWizard
            onClose={() => { setShowCreatePool(false); setCreatePoolGameType(undefined); }}
            onComplete={() => { setShowCreatePool(false); setCreatePoolGameType(undefined); }}
            initialGameType={createPoolGameType}
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
            onScanTicket={(poolCtx: { id: string; name: string; game_type: 'powerball' | 'mega_millions' }) => {
              setScannerPoolContext(poolCtx);
              setShowScanner(true);
            }}
            onManualEntry={() => setShowManualEntry(true)}
            onOpenLedger={() => {
              const pool = displayPools.find(p => p.id === selectedPoolIdForDetail);
              if (pool) {
                setSelectedPoolForLedger(pool);
              }
            }}
          />
        )}
        {showCreateSyndicate && (
          <CreateSyndicateModal
            onClose={() => setShowCreateSyndicate(false)}
            onComplete={() => setShowCreateSyndicate(false)}
          />
        )}
        {selectedSyndicateId && (
          <SyndicateDetailView
            syndicateId={selectedSyndicateId}
            onClose={() => setSelectedSyndicateId(null)}
          />
        )}
        {showDrawer && (
          <AppDrawer
            onClose={() => setShowDrawer(false)}
            onNavigate={handleDrawerNavigate}
            onLogout={handleLogout}
            user={user}
          />
        )}
        {drawerPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#EDF6F9] overflow-y-auto"
          >
            <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-[#006D77] border-t-transparent rounded-full animate-spin" /></div>}>
              {drawerPage === 'terms' && <TermsOfService onBack={() => setDrawerPage(null)} />}
              {drawerPage === 'privacy' && <PrivacyPolicy onBack={() => setDrawerPage(null)} />}
              {drawerPage === 'contact' && <ContactPage onBack={() => setDrawerPage(null)} />}
            </React.Suspense>
          </motion.div>
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
        onClose={() => { setWinnerAlert(false); setWinData(null); }}
        prizeAmount={winData?.prize_amount}
        poolName={winData?.pool_name}
        prizeTier={winData?.prize_tier}
      />
      <Toast />
    </div>
  );
};
// App with Routes
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </ErrorBoundary>
  );
};
export default App;

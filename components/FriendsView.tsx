import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Users, Zap, ExternalLink, ThumbsUp, Trophy, TrendingUp, Check, Clock, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { searchUsers, type FriendWithProfile, type UserSearchResult } from '../services/friends';
import ShaneMascot from './ShaneMascot';

interface FriendsViewProps {
  onOpenProfile: (friend: FriendWithProfile) => void;
  onOpenRequests: () => void;
  onOpenPool: (poolId: string) => void;
}

const FriendsView: React.FC<FriendsViewProps> = ({ onOpenProfile, onOpenRequests, onOpenPool }) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    user,
    friends,
    pendingRequests,
    friendsLoading,
    activities,
    activitiesLoading,
    mutualPools,
    mutualPoolsLoading,
    sharedWealth,
    sharedWealthLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchFriendActivity,
    fetchMutualPools,
    fetchSharedWealth,
    sendFriendRequest,
  } = useStore();

  // Fetch friends and pending requests on mount
  useEffect(() => {
    if (user?.id) {
      fetchFriends(user.id);
      fetchPendingRequests(user.id);
    }
  }, [user?.id, fetchFriends, fetchPendingRequests]);

  // Fetch activity feed, mutual pools, and shared wealth after friends are loaded
  useEffect(() => {
    if (user?.id && !friendsLoading) {
      fetchFriendActivity(user.id);
      fetchMutualPools(user.id);
      fetchSharedWealth(user.id);
    }
  }, [user?.id, friendsLoading, fetchFriendActivity, fetchMutualPools, fetchSharedWealth]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (search.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      if (user?.id) {
        const { data } = await searchUsers(search, user.id);
        setSearchResults(data || []);
      }
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, user?.id]);

  const handleSendRequest = async (friendId: string) => {
    if (!user?.id) return;
    setSendingRequest(friendId);
    await sendFriendRequest(user.id, friendId);
    // Update search results to reflect new status
    setSearchResults((prev) =>
      prev.map((r) =>
        r.id === friendId ? { ...r, friendshipStatus: 'pending_sent' as const } : r
      )
    );
    setSendingRequest(null);
  };

  const isSearchActive = search.trim().length >= 2;

  const getAvatarUrl = (avatarUrl: string | null, name: string) => {
    if (avatarUrl) return avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=83C5BE&color=fff&bold=true`;
  };

  return (
    <div className="space-y-8 sm:space-y-10 pt-8 sm:pt-12 pb-32">
      {/* Header & Search */}
      <div className="px-2 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#006D77]">Inner Circle</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#E29578] animate-pulse" />
              <p className="text-[10px] sm:text-xs font-bold text-[#83C5BE]">{friends.length} connection{friends.length !== 1 ? 's' : ''} active</p>
            </div>
          </div>
          <button
            onClick={onOpenRequests}
            className="relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-[#FFDDD2] text-[#006D77] warm-shadow active:scale-95 transition-all"
          >
            <Users size={20} />
            {pendingRequests.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#E29578] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#EDF6F9]">
                {pendingRequests.length}
              </div>
            )}
          </button>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#006D77]" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-[#EDF6F9] border-none rounded-[1.5rem] sm:rounded-[2rem] py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm sm:text-base text-[#006D77] font-bold outline-none focus:ring-2 ring-[#83C5BE]/20 transition-all placeholder:text-[#83C5BE]"
            />
          </div>
          <button className="bg-[#E29578] text-white px-4 sm:px-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-[9px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-[#E29578]/20 active:scale-95 transition-all whitespace-nowrap">
            <ExternalLink size={14} />
            Invite
          </button>
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-2 space-y-3"
          >
            <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Search Results</h3>
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-[#83C5BE] animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-white p-6 rounded-[1.5rem] border border-[#FFDDD2] text-center">
                <p className="text-xs font-bold text-[#83C5BE]">No users found for "{search}"</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full p-0.5 sm:p-1 border-2 border-[#83C5BE] overflow-hidden">
                        <img src={getAvatarUrl(result.avatarUrl, result.displayName || result.email)} className="w-full h-full rounded-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-[#006D77] tracking-tight">{result.displayName || result.email.split('@')[0]}</h4>
                        <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] uppercase tracking-wider">{result.email}</p>
                      </div>
                    </div>
                    {result.friendshipStatus === 'accepted' ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EDF6F9] border border-[#83C5BE]/30">
                        <Check size={12} className="text-[#006D77]" />
                        <span className="text-[9px] font-black text-[#006D77] uppercase tracking-wider">Friends</span>
                      </div>
                    ) : result.friendshipStatus === 'pending_sent' ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2E9D4]/50 border border-[#E29578]/30">
                        <Clock size={12} className="text-[#E29578]" />
                        <span className="text-[9px] font-black text-[#E29578] uppercase tracking-wider">Pending</span>
                      </div>
                    ) : result.friendshipStatus === 'pending_received' ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFDDD2]/50 border border-[#E29578]/30">
                        <span className="text-[9px] font-black text-[#E29578] uppercase tracking-wider">Respond</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(result.id)}
                        disabled={sendingRequest === result.id}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#E29578] flex items-center justify-center text-white shadow-lg shadow-[#E29578]/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {sendingRequest === result.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <UserPlus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Rest of content - hidden when search is active */}
      {!isSearchActive && (
        <>
          {/* Shared Wealth Stat */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-2"
          >
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-[#FFDDD2] warm-shadow flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFDDD2]/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#FFDDD2]/40 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#83C5BE]/10 rounded-full -ml-12 -mb-12 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578] mb-3 sm:mb-4 border border-[#FFDDD2]">
                  <Trophy size={20} strokeWidth={2.5} />
                </div>

                <p className="text-[9px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-2">Shared Wealth {new Date().getFullYear()}</p>
                <motion.h3
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-4xl sm:text-5xl font-black text-[#E29578] tracking-tighter"
                >
                  {sharedWealthLoading ? '...' : `$${sharedWealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </motion.h3>

                <div className="flex items-center gap-2 mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#EDF6F9]/50 border border-[#FFDDD2]/50">
                  <TrendingUp size={12} className="text-[#006D77]" />
                  <p className="text-[9px] sm:text-[10px] font-black text-[#006D77] uppercase tracking-widest leading-none">
                    Total Inner Circle Wins
                  </p>
                </div>

                <p className="text-[8px] sm:text-[9px] font-bold text-[#83C5BE] mt-3 sm:mt-4 max-w-[200px] leading-relaxed">
                  Shane says: "Your network is your net worth! Look at all that collective retirement juice."
                </p>
              </div>
            </div>
          </motion.section>

          {/* Mutual Pools - Enhanced Horizontal Scroll */}
          <section className="space-y-3 sm:space-y-4 relative">
            <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em] px-2">Mutual Pools</h3>

            {mutualPoolsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-[#83C5BE] animate-spin" />
              </div>
            ) : mutualPools.length === 0 ? (
              <div className="px-2">
                <div className="bg-white p-6 rounded-[2rem] border border-[#FFDDD2] text-center space-y-2">
                  <p className="text-xs font-black text-[#006D77]">No shared pools yet</p>
                  <p className="text-[10px] font-bold text-[#83C5BE]">Pools you share with friends will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Scroll Container */}
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 sm:pb-6 -mx-6 px-6 scroll-smooth snap-x snap-mandatory no-scrollbar">
                  {mutualPools.map(pool => (
                    <motion.div
                      key={pool.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onOpenPool(pool.id)}
                      className="min-w-[140px] sm:min-w-[170px] bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-[#FFDDD2] warm-shadow flex flex-col items-center text-center group cursor-pointer hover:border-[#83C5BE] transition-all snap-center first:ml-0"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EDF6F9] mb-3 sm:mb-4 flex items-center justify-center text-[#E29578] group-hover:scale-110 transition-transform">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <p className="text-xs sm:text-sm font-black text-[#006D77] leading-tight mb-2 h-8 sm:h-10 flex items-center justify-center">{pool.name}</p>
                      <div className="flex items-center gap-1 bg-[#EDF6F9] px-2 sm:px-3 py-1 rounded-full">
                        <Users size={10} className="text-[#83C5BE]" />
                        <span className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-tighter">{pool.friendsCount} Friend{pool.friendsCount !== 1 ? 's' : ''}</span>
                      </div>
                    </motion.div>
                  ))}
                  {/* End Spacer */}
                  <div className="min-w-[24px]" />
                </div>

                {/* Right Fade Indicator */}
                <div className="absolute top-0 right-0 bottom-4 sm:bottom-6 w-12 bg-gradient-to-l from-[#EDF6F9] to-transparent pointer-events-none" />
              </div>
            )}
          </section>

          {/* Friends List */}
          <section className="space-y-4 sm:space-y-5 px-2">
            <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Friend List</h3>
            {friendsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-[#83C5BE] animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-[#FFDDD2] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#83C5BE] mx-auto">
                  <Users size={24} />
                </div>
                <p className="text-sm font-black text-[#006D77]">No friends yet</p>
                <p className="text-[10px] font-bold text-[#83C5BE]">Search for people above to start building your Inner Circle!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {friends.map(friend => (
                  <motion.div
                    key={friend.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onOpenProfile(friend)}
                    className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between group cursor-pointer hover:bg-[#EDF6F9]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full p-0.5 sm:p-1 border-2 border-[#83C5BE] overflow-hidden">
                          <img src={getAvatarUrl(friend.avatarUrl, friend.displayName)} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-[#006D77] tracking-tight">{friend.displayName}</h4>
                        <p className="text-[9px] sm:text-[10px] font-bold text-[#83C5BE] uppercase tracking-wider">
                          Friends since {new Date(friend.acceptedAt || friend.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border-2 border-[#006D77]/10 flex items-center justify-center text-[#006D77] group-hover:bg-[#006D77] group-hover:text-white transition-all">
                      <ExternalLink size={16} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Social Feed */}
          <section className="space-y-4 sm:space-y-5 px-2">
            <h3 className="text-[10px] sm:text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.3em] sm:tracking-[0.4em]">Recent Activity</h3>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-[#83C5BE] animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-[#FFDDD2] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#83C5BE] mx-auto">
                  <Zap size={24} />
                </div>
                <p className="text-sm font-black text-[#006D77]">No activity yet</p>
                <p className="text-[10px] font-bold text-[#83C5BE]">Activity from you and your friends will show up here.</p>
              </div>
            ) : (
              <div className="bg-[#FFDDD2]/20 rounded-[2rem] sm:rounded-[3rem] border border-[#FFDDD2] overflow-hidden">
                {activities.map((activity, i) => (
                  <div
                    key={activity.id}
                    className={`p-4 sm:p-6 flex gap-3 sm:gap-4 items-start ${i !== activities.length - 1 ? 'border-b border-[#FFDDD2]/40' : ''}`}
                  >
                    {activity.type === 'shane' ? (
                      <div className="shrink-0 scale-75 sm:scale-100 origin-top-left">
                        <ShaneMascot size="sm" expression="normal" animate />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-[#83C5BE]/30">
                        <img src={getAvatarUrl(activity.avatar || null, activity.user_name)} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[11px] sm:text-xs font-bold text-[#006D77] leading-relaxed">
                        <span className="font-black">{activity.user_name}</span> {activity.content}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-widest mt-1.5 sm:mt-2">{activity.time}</p>

                      {activity.type === 'shane' && (
                        <button className="mt-2 sm:mt-3 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#FFDDD2] text-[9px] sm:text-[10px] font-black text-[#E29578] uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 transition-all">
                          <ThumbsUp size={12} fill="currentColor" /> High Five
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default FriendsView;

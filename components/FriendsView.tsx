
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, MessageCircle, MoreHorizontal, Users, Zap, ExternalLink, ThumbsUp, Trophy, TrendingUp } from 'lucide-react';
import { Friend, Activity, Pool } from '../types';
import ShaneMascot from './ShaneMascot';

interface FriendsViewProps {
  onOpenProfile: (friend: Friend) => void;
  onOpenRequests: () => void;
  onOpenPool: (poolId: string) => void;
}

const FriendsView: React.FC<FriendsViewProps> = ({ onOpenProfile, onOpenRequests, onOpenPool }) => {
  const [search, setSearch] = useState('');

  const friends: Friend[] = [
    { id: '1', name: 'John D.', avatar: 'https://picsum.photos/seed/john/80', status: 'online', poolsCount: 3, lastActive: '2m ago' },
    { id: '2', name: 'Sarah M.', avatar: 'https://picsum.photos/seed/sarah/80', status: 'online', poolsCount: 5, lastActive: '5m ago' },
    { id: '3', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/mike/80', status: 'offline', poolsCount: 2, lastActive: '2h ago' },
    { id: '4', name: 'Harvey S.', avatar: 'https://picsum.photos/seed/harvey/80', status: 'offline', poolsCount: 8, lastActive: '1d ago' },
  ];

  const activities: Activity[] = [
    { id: 'a1', type: 'scan', user_name: 'John D.', content: 'just scanned a ticket for "The Work Syndicate".', time: '5m ago', avatar: 'https://picsum.photos/seed/john/80' },
    { id: 'a2', type: 'join', user_name: 'Sarah M.', content: 'joined "Friday Night Luck".', time: '12m ago', avatar: 'https://picsum.photos/seed/sarah/80' },
    { id: 'a3', type: 'shane', user_name: 'Shane', content: 'Your friend Mike just won $10! Give him a high five!', time: '1h ago' },
  ];

  const mutualPools = [
    { id: '1', name: 'Work Syndicate', members: 12, friendsCount: 3 },
    { id: '2', name: 'Mega Millions Pool', members: 45, friendsCount: 8 },
    { id: '3', name: 'Retirement Goal', members: 8, friendsCount: 2 },
    { id: '4', name: 'Friday Night Luck', members: 20, friendsCount: 5 },
  ];

  return (
    <div className="space-y-10 pt-12 pb-32">
      {/* Header & Search */}
      <div className="px-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-[#006D77]">Inner Circle</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#E29578] animate-pulse" />
              <p className="text-xs font-bold text-[#83C5BE]">14 connections active</p>
            </div>
          </div>
          <button 
            onClick={onOpenRequests}
            className="relative p-3.5 rounded-2xl bg-white border border-[#FFDDD2] text-[#006D77] warm-shadow active:scale-95 transition-all"
          >
            <Users size={24} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#E29578] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#EDF6F9]">
              2
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#006D77]" size={20} />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Inner Circle..."
              className="w-full bg-[#EDF6F9] border-none rounded-[2rem] py-4 pl-14 pr-6 text-[#006D77] font-bold outline-none focus:ring-2 ring-[#83C5BE]/20 transition-all placeholder:text-[#83C5BE]"
            />
          </div>
          <button className="bg-[#E29578] text-white px-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#E29578]/20 active:scale-95 transition-all whitespace-nowrap">
            <ExternalLink size={16} />
            Invite
          </button>
        </div>
      </div>

      {/* Shared Wealth Stat */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2"
      >
        <div className="bg-white p-8 rounded-[3rem] border border-[#FFDDD2] warm-shadow flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFDDD2]/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#FFDDD2]/40 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#83C5BE]/10 rounded-full -ml-12 -mb-12 blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#E29578] mb-4 border border-[#FFDDD2]">
              <Trophy size={24} strokeWidth={2.5} />
            </div>
            
            <p className="text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.4em] mb-2">Shared Wealth 2024</p>
            <motion.h3 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black text-[#E29578] tracking-tighter"
            >
              $142,580.00
            </motion.h3>
            
            <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[#EDF6F9]/50 border border-[#FFDDD2]/50">
              <TrendingUp size={14} className="text-[#006D77]" />
              <p className="text-[10px] font-black text-[#006D77] uppercase tracking-widest leading-none">
                Total Inner Circle Wins
              </p>
            </div>
            
            <p className="text-[9px] font-bold text-[#83C5BE] mt-4 max-w-[200px] leading-relaxed">
              Shane says: "Your network is your net worth! Look at all that collective retirement juice."
            </p>
          </div>
        </div>
      </motion.section>

      {/* Mutual Pools - Enhanced Horizontal Scroll */}
      <section className="space-y-4 relative">
        <h3 className="text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.4em] px-2">Mutual Pools</h3>
        
        <div className="relative">
          {/* Scroll Container */}
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 scroll-smooth snap-x snap-mandatory no-scrollbar">
            {mutualPools.map(pool => (
              <motion.div 
                key={pool.id} 
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenPool(pool.id)}
                className="min-w-[170px] bg-white p-6 rounded-[2.5rem] border border-[#FFDDD2] warm-shadow flex flex-col items-center text-center group cursor-pointer hover:border-[#83C5BE] transition-all snap-center first:ml-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] mb-4 flex items-center justify-center text-[#E29578] group-hover:scale-110 transition-transform">
                  <Zap size={20} fill="currentColor" />
                </div>
                <p className="text-sm font-black text-[#006D77] leading-tight mb-2 h-10 flex items-center justify-center">{pool.name}</p>
                <div className="flex items-center gap-1 bg-[#EDF6F9] px-3 py-1 rounded-full">
                  <Users size={12} className="text-[#83C5BE]" />
                  <span className="text-[9px] font-black text-[#83C5BE] uppercase tracking-tighter">{pool.friendsCount} Friends</span>
                </div>
              </motion.div>
            ))}
            {/* End Spacer */}
            <div className="min-w-[24px]" />
          </div>

          {/* Right Fade Indicator */}
          <div className="absolute top-0 right-0 bottom-6 w-12 bg-gradient-to-l from-[#EDF6F9] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Friends List */}
      <section className="space-y-5 px-2">
        <h3 className="text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.4em]">Friend List</h3>
        <div className="space-y-3">
          {friends.map(friend => (
            <motion.div 
              key={friend.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenProfile(friend)}
              className="bg-white p-4 rounded-[2rem] border border-[#FFDDD2] flex items-center justify-between group cursor-pointer hover:bg-[#EDF6F9]/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-1 border-2 border-[#83C5BE] overflow-hidden">
                    <img src={friend.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                  </div>
                  {friend.status === 'online' && (
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-[#006D77] tracking-tight">{friend.name}</h4>
                  <p className="text-[10px] font-bold text-[#83C5BE] uppercase tracking-wider">
                    In {friend.poolsCount} pools with you • {friend.lastActive}
                  </p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-2xl border-2 border-[#006D77]/10 flex items-center justify-center text-[#006D77] group-hover:bg-[#006D77] group-hover:text-white transition-all">
                <UserPlus size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Feed */}
      <section className="space-y-5 px-2">
        <h3 className="text-[11px] font-black text-[#83C5BE] uppercase tracking-[0.4em]">Recent Activity</h3>
        <div className="bg-[#FFDDD2]/20 rounded-[3rem] border border-[#FFDDD2] overflow-hidden">
          {activities.map((activity, i) => (
            <div 
              key={activity.id} 
              className={`p-6 flex gap-4 items-start ${i !== activities.length - 1 ? 'border-b border-[#FFDDD2]/40' : ''}`}
            >
              {activity.type === 'shane' ? (
                <div className="shrink-0"><ShaneMascot size="sm" animate /></div>
              ) : (
                <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-[#83C5BE]/30">
                  <img src={activity.avatar} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold text-[#006D77] leading-relaxed">
                  <span className="font-black">{activity.user_name}</span> {activity.content}
                </p>
                <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-widest mt-2">{activity.time}</p>
                
                {activity.type === 'shane' && (
                  <button className="mt-3 bg-white px-4 py-2 rounded-xl border border-[#FFDDD2] text-[10px] font-black text-[#E29578] uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95 transition-all">
                    <ThumbsUp size={14} fill="currentColor" /> High Five Mike
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FriendsView;

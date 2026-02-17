import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import type { SyndicateWithMembers } from '../services/syndicates';

interface SyndicateCardProps {
  syndicate: SyndicateWithMembers;
  onClick: () => void;
}

const getAvatarUrl = (avatarUrl: string | null, name: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=83C5BE&color=fff&bold=true`;
};

const SyndicateCard: React.FC<SyndicateCardProps> = ({ syndicate, onClick }) => {
  const memberPreview = syndicate.members?.slice(0, 4) || [];
  const extraCount = syndicate.member_count - memberPreview.length;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      className="min-w-[140px] sm:min-w-[170px] bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-[#FFDDD2] warm-shadow flex flex-col items-center text-center group cursor-pointer hover:border-[#83C5BE] transition-all snap-center first:ml-0"
    >
      {/* Emoji/Color Badge */}
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `${syndicate.color}20` }}
      >
        {syndicate.emoji ? (
          <span className="text-lg sm:text-xl">{syndicate.emoji}</span>
        ) : (
          <Users size={18} style={{ color: syndicate.color }} />
        )}
      </div>

      {/* Name */}
      <p className="text-xs sm:text-sm font-black text-[#006D77] leading-tight mb-2 h-8 sm:h-10 flex items-center justify-center">
        {syndicate.name}
      </p>

      {/* Member Avatars */}
      {memberPreview.length > 0 ? (
        <div className="flex items-center -space-x-2 mb-2">
          {memberPreview.map((m) => (
            <div key={m.userId} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
              <img src={getAvatarUrl(m.avatarUrl, m.displayName)} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-[#EDF6F9] flex items-center justify-center">
              <span className="text-[7px] font-black text-[#006D77]">+{extraCount}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Member Count */}
      <div className="flex items-center gap-1 bg-[#EDF6F9] px-2 sm:px-3 py-1 rounded-full">
        <Users size={10} className="text-[#83C5BE]" />
        <span className="text-[8px] sm:text-[9px] font-black text-[#83C5BE] uppercase tracking-tighter">
          {syndicate.member_count} Member{syndicate.member_count !== 1 ? 's' : ''}
        </span>
      </div>
    </motion.div>
  );
};

export default SyndicateCard;

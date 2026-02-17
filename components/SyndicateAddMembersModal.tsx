import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Loader2, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getAddableFriends, type AddableFriend } from '../services/syndicates';

interface SyndicateAddMembersModalProps {
  syndicateId: string;
  onClose: () => void;
  onMembersAdded: () => void;
}

const getAvatarUrl = (avatarUrl: string | null, name: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=83C5BE&color=fff&bold=true`;
};

const SyndicateAddMembersModal: React.FC<SyndicateAddMembersModalProps> = ({ syndicateId, onClose, onMembersAdded }) => {
  const { user, addSyndicateMember, showToast } = useStore();
  const [friends, setFriends] = useState<AddableFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data, error } = await getAddableFriends(user.id, syndicateId);
      if (error) {
        showToast(error, 'error');
      } else {
        setFriends(data || []);
      }
      setLoading(false);
    };
    load();
  }, [user?.id, syndicateId, showToast]);

  const handleAdd = async (friend: AddableFriend) => {
    if (!user?.id) return;
    setAddingId(friend.userId);
    const { error } = await addSyndicateMember(syndicateId, friend.userId, user.id);
    if (error) {
      showToast(error, 'error');
    } else {
      setAddedIds((prev) => new Set([...prev, friend.userId]));
      showToast(`Added ${friend.displayName}`, 'success');
    }
    setAddingId(null);
  };

  const handleDone = () => {
    if (addedIds.size > 0) {
      onMembersAdded();
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/30" onClick={handleDone} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="relative w-full sm:max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[70vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-[#FFDDD2]/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#006D77] tracking-tight">Add Friends</h3>
              <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">
                {friends.length - addedIds.size} friend{friends.length - addedIds.size !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={handleDone}
              className="p-2 rounded-xl bg-[#EDF6F9] text-[#006D77] border border-[#FFDDD2]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#83C5BE] animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <UserPlus size={24} className="text-[#83C5BE] mx-auto" />
              <p className="text-xs font-black text-[#006D77]">All friends are already in this syndicate</p>
              <p className="text-[10px] font-bold text-[#83C5BE]">Add more friends to your Inner Circle first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const isAdded = addedIds.has(friend.userId);
                const isAdding = addingId === friend.userId;
                return (
                  <div
                    key={friend.userId}
                    className="p-3 rounded-[1.5rem] border border-[#FFDDD2] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-[#83C5BE] overflow-hidden">
                        <img src={getAvatarUrl(friend.avatarUrl, friend.displayName)} className="w-full h-full rounded-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#006D77] tracking-tight">{friend.displayName}</h4>
                        <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-wider">{friend.email}</p>
                      </div>
                    </div>

                    {isAdded ? (
                      <div className="w-8 h-8 rounded-lg bg-[#006D77] flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(friend)}
                        disabled={isAdding}
                        className="w-8 h-8 rounded-lg bg-[#E29578] flex items-center justify-center text-white shadow-lg shadow-[#E29578]/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isAdding ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserPlus size={14} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Done Button */}
          {addedIds.size > 0 && (
            <button
              onClick={handleDone}
              className="w-full mt-4 py-3 rounded-[1.5rem] bg-[#006D77] text-white text-xs font-black uppercase tracking-[0.2em]"
            >
              Done — added {addedIds.size} friend{addedIds.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SyndicateAddMembersModal;

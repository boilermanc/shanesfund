import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Users, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import FocusTrap from './FocusTrap';

interface CreateSyndicateModalProps {
  onClose: () => void;
  onComplete: (syndicateId: string) => void;
}

const PRESET_COLORS = [
  '#83C5BE', '#E29578', '#006D77', '#FFDDD2', '#6B5B95', '#88B04B',
  '#F7CAC9', '#92A8D1',
];

const PRESET_EMOJIS = [
  '👥', '🏢', '👨‍👩‍👧‍👦', '🎓', '🏆', '💰', '🎯', '🔥',
  '⚡', '🌟', '🎲', '🍀', '🤝', '💎', '🚀', '🎉',
];

const getAvatarUrl = (avatarUrl: string | null, name: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=83C5BE&color=fff&bold=true`;
};

const CreateSyndicateModal: React.FC<CreateSyndicateModalProps> = ({ onClose, onComplete }) => {
  const { user, friends, friendsLoading, fetchFriends, createSyndicate, showToast } = useStore();
  const [step, setStep] = useState(0); // 0 = name/details, 1 = add friends
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#83C5BE');
  const [emoji, setEmoji] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.id && friends.length === 0 && !friendsLoading) {
      fetchFriends(user.id);
    }
  }, [user?.id, friends.length, friendsLoading, fetchFriends]);

  const handleCreate = async () => {
    if (!user?.id || !name.trim()) return;
    setIsCreating(true);

    const { data, error } = await createSyndicate(
      name.trim(),
      user.id,
      description.trim() || undefined,
      color,
      emoji || undefined
    );

    if (error) {
      showToast(error, 'error');
      setIsCreating(false);
      return;
    }

    // Add selected friends
    if (data?.id && selectedFriends.length > 0) {
      const { addSyndicateMember } = useStore.getState();
      for (const friendId of selectedFriends) {
        await addSyndicateMember(data.id, friendId, user.id);
      }
    }

    showToast('Syndicate created!', 'success');
    setIsCreating(false);
    onComplete(data?.id || '');
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <FocusTrap onClose={onClose} autoFocusFirst={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full sm:max-w-md bg-[#EDF6F9] rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#EDF6F9] z-10 px-6 pt-6 pb-4 border-b border-[#FFDDD2]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(0)}
                    className="p-2 rounded-xl bg-white text-[#006D77] border border-[#FFDDD2]"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#006D77] tracking-tight">
                    {step === 0 ? 'New Syndicate' : 'Add Friends'}
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">
                    {step === 0 ? 'Name your crew' : 'Optional — add later anytime'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white text-[#006D77] border border-[#FFDDD2]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {step === 0 ? (
              <>
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Syndicate Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 50))}
                    placeholder="e.g. Work Crew, Family Fund..."
                    autoFocus
                    className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] py-3 sm:py-4 px-5 text-sm font-bold text-[#006D77] outline-none focus:ring-2 ring-[#83C5BE]/30 placeholder:text-[#83C5BE]/50"
                  />
                  <p className="text-[9px] font-bold text-[#83C5BE] text-right">{name.length}/50</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 120))}
                    placeholder="What's this crew about?"
                    rows={2}
                    className="w-full bg-white border border-[#FFDDD2] rounded-[1.5rem] py-3 sm:py-4 px-5 text-sm font-bold text-[#006D77] outline-none focus:ring-2 ring-[#83C5BE]/30 placeholder:text-[#83C5BE]/50 resize-none"
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          color === c ? 'ring-2 ring-[#006D77] ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Emoji Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">Emoji (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEmoji('')}
                      className={`w-9 h-9 rounded-xl bg-white border text-[10px] font-black text-[#83C5BE] transition-all ${
                        emoji === '' ? 'border-[#006D77] ring-1 ring-[#006D77]' : 'border-[#FFDDD2]'
                      }`}
                    >
                      None
                    </button>
                    {PRESET_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={`w-9 h-9 rounded-xl bg-white border text-lg transition-all ${
                          emoji === e ? 'border-[#006D77] ring-1 ring-[#006D77] scale-110' : 'border-[#FFDDD2] hover:scale-105'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next / Create Button */}
                <button
                  onClick={() => friends.length > 0 ? setStep(1) : handleCreate()}
                  disabled={!name.trim() || isCreating}
                  className="w-full py-4 rounded-[2rem] bg-[#006D77] text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[#006D77]/20"
                >
                  {isCreating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : friends.length > 0 ? (
                    <>
                      Next: Add Friends
                      <ArrowRight size={16} strokeWidth={3} />
                    </>
                  ) : (
                    'Create Syndicate'
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Friends Selection */}
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="text-[#83C5BE] animate-spin" />
                  </div>
                ) : friends.length === 0 ? (
                  <div className="bg-white p-6 rounded-[2rem] border border-[#FFDDD2] text-center space-y-2">
                    <Users size={24} className="text-[#83C5BE] mx-auto" />
                    <p className="text-xs font-black text-[#006D77]">No friends to add yet</p>
                    <p className="text-[10px] font-bold text-[#83C5BE]">You can add friends to this syndicate later.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">
                      {selectedFriends.length} selected
                    </p>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                      {friends.map((friend) => {
                        const isSelected = selectedFriends.includes(friend.userId);
                        return (
                          <button
                            key={friend.userId}
                            onClick={() => toggleFriend(friend.userId)}
                            className={`w-full p-3 sm:p-4 rounded-[1.5rem] border flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-[#006D77]/5 border-[#006D77]'
                                : 'bg-white border-[#FFDDD2] hover:bg-[#EDF6F9]/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full border-2 border-[#83C5BE] overflow-hidden">
                                <img src={getAvatarUrl(friend.avatarUrl, friend.displayName)} className="w-full h-full rounded-full object-cover" alt="" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-black text-sm text-[#006D77] tracking-tight">{friend.displayName}</h4>
                                <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-wider">{friend.email}</p>
                              </div>
                            </div>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#006D77] text-white' : 'bg-[#EDF6F9] border border-[#FFDDD2]'
                            }`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || isCreating}
                  className="w-full py-4 rounded-[2rem] bg-[#E29578] text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[#E29578]/20"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create Syndicate${selectedFriends.length > 0 ? ` with ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''}` : ''}`
                  )}
                </button>

                {/* Skip Button */}
                {!isCreating && (
                  <button
                    onClick={handleCreate}
                    className="w-full py-3 text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.2em]"
                  >
                    Skip — create without adding friends
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </FocusTrap>
  );
};

export default CreateSyndicateModal;

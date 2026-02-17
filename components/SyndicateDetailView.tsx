import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, UserPlus, Trash2, LogOut, Crown, Loader2, MoreVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getSyndicateDetail } from '../services/syndicates';
import type { SyndicateWithMembers, SyndicateMemberProfile } from '../services/syndicates';
import FocusTrap from './FocusTrap';
import SyndicateAddMembersModal from './SyndicateAddMembersModal';

interface SyndicateDetailViewProps {
  syndicateId: string;
  onClose: () => void;
}

const getAvatarUrl = (avatarUrl: string | null, name: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=83C5BE&color=fff&bold=true`;
};

const SyndicateDetailView: React.FC<SyndicateDetailViewProps> = ({ syndicateId, onClose }) => {
  const { user, deleteSyndicate, removeSyndicateMember, leaveSyndicate, showToast, fetchSyndicates } = useStore();
  const [syndicate, setSyndicate] = useState<SyndicateWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetail = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await getSyndicateDetail(syndicateId, user.id);
    if (error) {
      showToast(error, 'error');
    } else {
      setSyndicate(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDetail();
  }, [syndicateId, user?.id]);

  const handleRemoveMember = async (member: SyndicateMemberProfile) => {
    if (!user?.id) return;
    setRemovingMemberId(member.userId);
    const { error } = await removeSyndicateMember(syndicateId, member.userId, user.id);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast(`Removed ${member.displayName}`, 'success');
      loadDetail();
    }
    setRemovingMemberId(null);
  };

  const handleLeave = async () => {
    if (!user?.id) return;
    setIsLeaving(true);
    const { error } = await leaveSyndicate(syndicateId, user.id);
    if (error) {
      showToast(error, 'error');
      setIsLeaving(false);
    } else {
      showToast('Left syndicate', 'info');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    const { error } = await deleteSyndicate(syndicateId);
    if (error) {
      showToast(error, 'error');
      setIsDeleting(false);
    } else {
      showToast('Syndicate deleted', 'info');
      onClose();
    }
  };

  const handleMembersAdded = () => {
    setShowAddMembers(false);
    loadDetail();
    if (user?.id) fetchSyndicates(user.id);
  };

  const isOwner = syndicate?.isOwner ?? false;

  return (
    <FocusTrap onClose={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full sm:max-w-md bg-[#EDF6F9] rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[90vh] overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-[#83C5BE] animate-spin" />
            </div>
          ) : !syndicate ? (
            <div className="p-8 text-center">
              <p className="text-sm font-black text-[#006D77]">Syndicate not found</p>
              <button onClick={onClose} className="mt-4 text-xs font-bold text-[#83C5BE]">Close</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-[#EDF6F9] z-10 px-6 pt-6 pb-4 border-b border-[#FFDDD2]/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-white text-[#006D77] border border-[#FFDDD2]"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="text-center flex-1 mx-4">
                    <div className="flex items-center justify-center gap-2">
                      {syndicate.emoji && <span className="text-xl">{syndicate.emoji}</span>}
                      <h2 className="text-xl font-black text-[#006D77] tracking-tight">{syndicate.name}</h2>
                    </div>
                    <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-[0.2em] mt-0.5">
                      {syndicate.member_count} member{syndicate.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2.5 rounded-xl bg-white text-[#006D77] border border-[#FFDDD2]"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl border border-[#FFDDD2] shadow-xl z-20 overflow-hidden">
                          {isOwner ? (
                            <button
                              onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                              className="w-full px-4 py-3 text-left text-xs font-black text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete Syndicate
                            </button>
                          ) : (
                            <button
                              onClick={() => { setShowMenu(false); handleLeave(); }}
                              className="w-full px-4 py-3 text-left text-xs font-black text-[#E29578] hover:bg-[#FFDDD2]/20 flex items-center gap-2"
                            >
                              <LogOut size={14} />
                              Leave Syndicate
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Syndicate Info Card */}
                <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#FFDDD2] text-center">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${syndicate.color}20` }}
                  >
                    {syndicate.emoji ? (
                      <span className="text-3xl">{syndicate.emoji}</span>
                    ) : (
                      <Users size={28} style={{ color: syndicate.color }} />
                    )}
                  </div>
                  {syndicate.description && (
                    <p className="text-xs font-bold text-[#83C5BE] mb-3">{syndicate.description}</p>
                  )}
                  <p className="text-[9px] font-black text-[#83C5BE] uppercase tracking-[0.2em]">
                    Created {new Date(syndicate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-[#83C5BE] uppercase tracking-[0.3em]">Members</h3>
                    {isOwner && (
                      <button
                        onClick={() => setShowAddMembers(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006D77] text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-[#006D77]/20"
                      >
                        <UserPlus size={12} />
                        Add
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(syndicate.members || []).map((member) => (
                      <div
                        key={member.userId}
                        className="bg-white p-3 sm:p-4 rounded-[1.5rem] border border-[#FFDDD2] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-[#83C5BE] overflow-hidden">
                              <img src={getAvatarUrl(member.avatarUrl, member.displayName)} className="w-full h-full rounded-full object-cover" alt="" />
                            </div>
                            {member.role === 'owner' && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F2E9D4] flex items-center justify-center border border-[#E29578]/30">
                                <Crown size={10} className="text-[#E29578]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-[#006D77] tracking-tight">{member.displayName}</h4>
                            <p className="text-[9px] font-bold text-[#83C5BE] uppercase tracking-wider">
                              {member.role === 'owner' ? 'Owner' : `Joined ${new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                            </p>
                          </div>
                        </div>

                        {/* Remove button — only show for owner on non-owner members */}
                        {isOwner && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            disabled={removingMemberId === member.userId}
                            className="p-2 rounded-xl text-[#E29578] hover:bg-[#FFDDD2]/30 transition-colors disabled:opacity-50"
                          >
                            {removingMemberId === member.userId ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[1300] flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
                  <div className="relative bg-white p-6 sm:p-8 rounded-[2rem] max-w-xs mx-4 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                      <Trash2 size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-black text-[#006D77]">Delete "{syndicate.name}"?</h3>
                    <p className="text-xs font-bold text-[#83C5BE]">This will remove all members and cannot be undone.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-[1.5rem] bg-[#EDF6F9] text-[#006D77] text-xs font-black"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-[1.5rem] bg-red-500 text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Add Members Modal */}
        {showAddMembers && syndicate && (
          <SyndicateAddMembersModal
            syndicateId={syndicateId}
            onClose={() => setShowAddMembers(false)}
            onMembersAdded={handleMembersAdded}
          />
        )}
      </motion.div>
    </FocusTrap>
  );
};

export default SyndicateDetailView;

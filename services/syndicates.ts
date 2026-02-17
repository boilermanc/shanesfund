import { supabase } from '../lib/supabase';
import type { Syndicate, SyndicateMemberWithUser } from '../types/database';

// Enriched syndicate type for UI display
export interface SyndicateWithMembers extends Syndicate {
  members?: SyndicateMemberProfile[];
  isOwner: boolean;
}

// Syndicate member with user profile
export interface SyndicateMemberProfile {
  id: string;          // syndicate_members.id
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

// Friend available to add to a syndicate
export interface AddableFriend {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
}

// Helper: map raw syndicate_members join row to SyndicateMemberProfile
function mapMemberRow(row: SyndicateMemberWithUser): SyndicateMemberProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.users?.display_name || row.users?.email || 'Unknown',
    avatarUrl: row.users?.avatar_url || null,
    email: row.users?.email || '',
    role: row.role,
    joinedAt: row.joined_at,
  };
}

// Create a syndicate (atomic: creates syndicate + owner membership)
export const createSyndicate = async (
  name: string,
  creatorId: string,
  description?: string,
  color?: string,
  emoji?: string
): Promise<{ data: Syndicate | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('create_syndicate_with_owner', {
      p_name: name,
      p_creator_id: creatorId,
      p_description: description || null,
      p_color: color || '#83C5BE',
      p_emoji: emoji || null,
    });
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    const syndicate = Array.isArray(data) ? data[0] : data;
    return { data: syndicate || null, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get all syndicates the user belongs to (with member preview)
export const getUserSyndicates = async (
  userId: string
): Promise<{ data: SyndicateWithMembers[] | null; error: string | null }> => {
  try {
    // Get syndicate IDs the user belongs to
    const { data: memberships, error: memberError } = await supabase
      .from('syndicate_members')
      .select('syndicate_id')
      .eq('user_id', userId);
    if (memberError) return { data: null, error: memberError.message };
    if (!memberships || memberships.length === 0) return { data: [], error: null };

    const syndicateIds = memberships.map((m: any) => m.syndicate_id);

    // Fetch the syndicates
    const { data: syndicates, error: synError } = await supabase
      .from('syndicates')
      .select('*')
      .in('id', syndicateIds)
      .order('created_at', { ascending: false });
    if (synError) return { data: null, error: synError.message };

    // Fetch member previews (first 5 per syndicate) for avatars
    const { data: memberRows } = await supabase
      .from('syndicate_members')
      .select('syndicate_id, user_id, role, joined_at, id, users(id, display_name, avatar_url, email)')
      .in('syndicate_id', syndicateIds)
      .order('joined_at', { ascending: true });

    // Group members by syndicate
    const memberMap = new Map<string, SyndicateMemberProfile[]>();
    for (const row of (memberRows || []) as SyndicateMemberWithUser[]) {
      const synId = row.syndicate_id;
      if (!memberMap.has(synId)) memberMap.set(synId, []);
      const members = memberMap.get(synId)!;
      if (members.length < 5) {
        members.push(mapMemberRow(row));
      }
    }

    const result: SyndicateWithMembers[] = ((syndicates || []) as any[]).map((s) => ({
      ...s,
      members: memberMap.get(s.id) || [],
      isOwner: s.creator_id === userId,
    }));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get a single syndicate with all members
export const getSyndicateDetail = async (
  syndicateId: string,
  currentUserId: string
): Promise<{ data: SyndicateWithMembers | null; error: string | null }> => {
  try {
    const { data: syndicate, error: synError } = await supabase
      .from('syndicates')
      .select('*')
      .eq('id', syndicateId)
      .single();
    if (synError) return { data: null, error: synError.message };
    if (!syndicate) return { data: null, error: 'Syndicate not found' };

    const synData = syndicate as any;

    const { data: memberRows, error: memError } = await supabase
      .from('syndicate_members')
      .select('*, users(id, display_name, avatar_url, email)')
      .eq('syndicate_id', syndicateId)
      .order('joined_at', { ascending: true });
    if (memError) return { data: null, error: memError.message };

    const members = ((memberRows || []) as SyndicateMemberWithUser[]).map(mapMemberRow);

    return {
      data: {
        ...synData,
        members,
        isOwner: synData.creator_id === currentUserId,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Update syndicate details (owner only, enforced by RLS)
export const updateSyndicate = async (
  syndicateId: string,
  updates: { name?: string; description?: string | null; color?: string; emoji?: string | null }
): Promise<{ data: Syndicate | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('syndicates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', syndicateId)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Delete a syndicate (owner only, enforced by RLS; CASCADE handles members)
export const deleteSyndicate = async (
  syndicateId: string
): Promise<{ data: null; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('syndicates')
      .delete()
      .eq('id', syndicateId);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Add a friend to a syndicate (owner only via RLS)
export const addMemberToSyndicate = async (
  syndicateId: string,
  userId: string,
  currentUserId: string
): Promise<{ data: null; error: string | null }> => {
  try {
    // Verify the target user is an accepted friend
    const { data: friendCheck } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
      .eq('status', 'accepted')
      .limit(1);

    if (!friendCheck || friendCheck.length === 0) {
      return { data: null, error: 'You can only add friends to your syndicate' };
    }

    // Insert the member
    const { error: insertError } = await supabase
      .from('syndicate_members')
      .insert({ syndicate_id: syndicateId, user_id: userId });
    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        return { data: null, error: 'This person is already in the syndicate' };
      }
      return { data: null, error: insertError.message };
    }

    // Update member count
    const { count } = await supabase
      .from('syndicate_members')
      .select('id', { count: 'exact', head: true })
      .eq('syndicate_id', syndicateId);

    await supabase
      .from('syndicates')
      .update({ member_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', syndicateId);

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Remove a member from a syndicate (owner can remove anyone via RLS)
export const removeMemberFromSyndicate = async (
  syndicateId: string,
  userId: string
): Promise<{ data: null; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('syndicate_members')
      .delete()
      .eq('syndicate_id', syndicateId)
      .eq('user_id', userId);
    if (error) return { data: null, error: error.message };

    // Update member count
    const { count } = await supabase
      .from('syndicate_members')
      .select('id', { count: 'exact', head: true })
      .eq('syndicate_id', syndicateId);

    await supabase
      .from('syndicates')
      .update({ member_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', syndicateId);

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Leave a syndicate (member removes themselves; owner cannot leave)
export const leaveSyndicate = async (
  syndicateId: string,
  userId: string
): Promise<{ data: null; error: string | null }> => {
  try {
    // Check if user is the owner
    const { data: syndicate } = await supabase
      .from('syndicates')
      .select('creator_id')
      .eq('id', syndicateId)
      .single();
    if ((syndicate as any)?.creator_id === userId) {
      return { data: null, error: 'Owners cannot leave their syndicate. Delete it instead.' };
    }

    return removeMemberFromSyndicate(syndicateId, userId);
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get friends who are NOT already in this syndicate
export const getAddableFriends = async (
  userId: string,
  syndicateId: string
): Promise<{ data: AddableFriend[] | null; error: string | null }> => {
  try {
    // Get accepted friends
    const { data: friendRows, error: friendError } = await supabase
      .from('friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (friendError) return { data: null, error: friendError.message };

    const friendUserIds = ((friendRows || []) as any[]).map((f) =>
      f.user_id === userId ? f.friend_id : f.user_id
    );

    if (friendUserIds.length === 0) return { data: [], error: null };

    // Fetch user profiles for all friends
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, email')
      .in('id', friendUserIds);

    // Get existing syndicate members to exclude
    const { data: existingMembers } = await supabase
      .from('syndicate_members')
      .select('user_id')
      .eq('syndicate_id', syndicateId);
    const existingIds = new Set(((existingMembers || []) as any[]).map((m) => m.user_id));

    const addable = ((users || []) as any[])
      .filter((u) => !existingIds.has(u.id))
      .map((u) => ({
        userId: u.id,
        displayName: u.display_name || u.email,
        avatarUrl: u.avatar_url,
        email: u.email,
      }));

    return { data: addable, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

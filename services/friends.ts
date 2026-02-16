import { supabase } from '../lib/supabase';
import type { Friend } from '../types/database';

// Sanitize user input for use in PostgREST ilike filter strings.
// Escapes SQL LIKE wildcards (%, _) and strips characters that are
// structural in PostgREST filter syntax (, and ) which cannot be escaped.
function sanitizeFilterInput(input: string): string {
  return input
    .replace(/\\/g, '\\\\') // escape backslashes first
    .replace(/%/g, '\\%')   // SQL LIKE wildcard
    .replace(/_/g, '\\_')   // SQL LIKE single-char wildcard
    .replace(/[,)]/g, '');  // PostgREST structural chars (condition separator, group close)
}

// Enriched friend type with the other user's profile info
export interface FriendWithProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  acceptedAt: string | null;
}

// Search result type
export interface UserSearchResult {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
}

// Mutual pool type
export interface MutualPool {
  id: string;
  name: string;
  gameType: string;
}

// Helper to map a friend row + user data into FriendWithProfile
function mapToFriendWithProfile(
  row: any,
  otherUser: { id: string; display_name: string | null; avatar_url: string | null; email: string }
): FriendWithProfile {
  return {
    id: row.id,
    userId: otherUser.id,
    displayName: otherUser.display_name || otherUser.email.split('@')[0],
    avatarUrl: otherUser.avatar_url,
    email: otherUser.email,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  };
}

// Send a friend request
export const sendFriendRequest = async (
  userId: string,
  friendId: string
): Promise<{ data: Friend | null; error: string | null }> => {
  try {
    // Guard: no self-friending
    if (userId === friendId) {
      return { data: null, error: 'You cannot send a friend request to yourself' };
    }

    // Check for existing relationship in either direction
    const { data: existing, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
      );

    if (checkError) {
      return { data: null, error: checkError.message };
    }

    if (existing && existing.length > 0) {
      const row = existing[0];

      if (row.status === 'accepted') {
        return { data: null, error: 'You are already friends with this user' };
      }

      if (row.status === 'blocked') {
        return { data: null, error: 'Unable to send friend request' };
      }

      if (row.status === 'pending') {
        // If the OTHER person already sent us a request, auto-accept
        if (row.user_id === friendId && row.friend_id === userId) {
          const { data: accepted, error: acceptError } = await supabase
            .from('friends')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', row.id)
            .select()
            .single();

          if (acceptError) {
            return { data: null, error: acceptError.message };
          }

          return { data: accepted, error: null };
        }

        // We already sent a request
        return { data: null, error: 'Friend request already sent' };
      }
    }

    // Insert the friend request
    const { data: friendRow, error: insertError } = await supabase
      .from('friends')
      .insert({ user_id: userId, friend_id: friendId, status: 'pending' })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Fire-and-forget: notify the recipient
    supabase.from('notifications').insert({
      user_id: friendId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: 'Someone wants to connect with you!',
      data: { friendship_id: friendRow.id, from_user_id: userId },
    }).then(({ error }) => { if (error) console.error('[sendFriendRequest] notification insert failed:', error.message); })
      .catch(err => console.error('[sendFriendRequest] notification insert failed:', err));

    return { data: friendRow, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Accept a friend request
export const acceptFriendRequest = async (
  friendshipId: string
): Promise<{ data: Friend | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Fire-and-forget: notify the original sender
    supabase.from('notifications').insert({
      user_id: data.user_id,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      message: 'Your friend request was accepted!',
      data: { friendship_id: data.id },
    }).then(({ error }) => { if (error) console.error('[acceptFriendRequest] notification insert failed:', error.message); })
      .catch(err => console.error('[acceptFriendRequest] notification insert failed:', err));

    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Decline a friend request
export const declineFriendRequest = async (
  friendshipId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)
      .eq('status', 'pending');

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

// Remove an accepted friend
export const removeFriend = async (
  friendshipId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)
      .eq('status', 'accepted');

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

// Block a user
export const blockUser = async (
  userId: string,
  targetId: string
): Promise<{ error: string | null }> => {
  try {
    // Delete any existing relationship between the two
    await supabase
      .from('friends')
      .delete()
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${userId})`
      );

    // Insert blocked row
    const { error } = await supabase
      .from('friends')
      .insert({ user_id: userId, friend_id: targetId, status: 'blocked' });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

// Unblock a user
export const unblockUser = async (
  userId: string,
  targetId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', targetId)
      .eq('status', 'blocked');

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

// Get all accepted friends with profile info
export const getFriends = async (
  userId: string
): Promise<{ data: FriendWithProfile[] | null; error: string | null }> => {
  try {
    // Friends where current user sent the request
    const { data: sentFriends, error: e1 } = await supabase
      .from('friends')
      .select('*, users!friends_friend_id_fkey(id, display_name, avatar_url, email)')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    // Friends where current user received the request
    const { data: receivedFriends, error: e2 } = await supabase
      .from('friends')
      .select('*, users!friends_user_id_fkey(id, display_name, avatar_url, email)')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    if (e1 || e2) {
      // Fallback: fetch without joins if FK names don't match
      return await getFriendsFallback(userId);
    }

    const friends: FriendWithProfile[] = [];

    for (const row of sentFriends || []) {
      const user = (row as any).users;
      if (user) {
        friends.push(mapToFriendWithProfile(row, user));
      }
    }

    for (const row of receivedFriends || []) {
      const user = (row as any).users;
      if (user) {
        friends.push(mapToFriendWithProfile(row, user));
      }
    }

    return { data: friends, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Fallback: fetch friends without FK joins (separate queries)
async function getFriendsFallback(
  userId: string
): Promise<{ data: FriendWithProfile[] | null; error: string | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('friends')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!rows || rows.length === 0) {
      return { data: [], error: null };
    }

    // Collect the IDs of the other users
    const otherUserIds = rows.map((r) =>
      r.user_id === userId ? r.friend_id : r.user_id
    );

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, email')
      .in('id', otherUserIds);

    if (usersError) {
      return { data: null, error: usersError.message };
    }

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    const friends: FriendWithProfile[] = [];
    for (const row of rows) {
      const otherId = row.user_id === userId ? row.friend_id : row.user_id;
      const user = userMap.get(otherId);
      if (user) {
        friends.push(mapToFriendWithProfile(row, user));
      }
    }

    return { data: friends, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

// Get incoming pending friend requests
export const getPendingRequests = async (
  userId: string
): Promise<{ data: FriendWithProfile[] | null; error: string | null }> => {
  try {
    // Incoming requests: friend_id = userId (someone sent us a request)
    const { data: rows, error } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) {
      return { data: null, error: error.message };
    }

    if (!rows || rows.length === 0) {
      return { data: [], error: null };
    }

    // Fetch sender profiles
    const senderIds = rows.map((r) => r.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, email')
      .in('id', senderIds);

    if (usersError) {
      return { data: null, error: usersError.message };
    }

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    const requests: FriendWithProfile[] = [];
    for (const row of rows) {
      const user = userMap.get(row.user_id);
      if (user) {
        requests.push(mapToFriendWithProfile(row, user));
      }
    }

    return { data: requests, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get outgoing sent friend requests
export const getSentRequests = async (
  userId: string
): Promise<{ data: FriendWithProfile[] | null; error: string | null }> => {
  try {
    // Outgoing requests: user_id = userId (we sent the request)
    const { data: rows, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      return { data: null, error: error.message };
    }

    if (!rows || rows.length === 0) {
      return { data: [], error: null };
    }

    // Fetch recipient profiles
    const recipientIds = rows.map((r) => r.friend_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, email')
      .in('id', recipientIds);

    if (usersError) {
      return { data: null, error: usersError.message };
    }

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    const requests: FriendWithProfile[] = [];
    for (const row of rows) {
      const user = userMap.get(row.friend_id);
      if (user) {
        requests.push(mapToFriendWithProfile(row, user));
      }
    }

    return { data: requests, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Search users by display name or email
export const searchUsers = async (
  query: string,
  currentUserId: string
): Promise<{ data: UserSearchResult[] | null; error: string | null }> => {
  try {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { data: [], error: null };
    }

    const sanitized = sanitizeFilterInput(trimmed);

    // Search users
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, email')
      .or(`display_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (searchError) {
      return { data: null, error: searchError.message };
    }

    if (!users || users.length === 0) {
      return { data: [], error: null };
    }

    // Get all friendships involving current user and these results
    const resultIds = users.map((u) => u.id);
    const { data: friendships } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
      .or(
        resultIds
          .map((id) => `user_id.eq.${id},friend_id.eq.${id}`)
          .join(',')
      );

    // Build a map of userId -> friendship status
    const statusMap = new Map<string, UserSearchResult['friendshipStatus']>();

    for (const f of friendships || []) {
      const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
      if (!resultIds.includes(otherId)) continue;

      if (f.status === 'accepted') {
        statusMap.set(otherId, 'accepted');
      } else if (f.status === 'blocked') {
        statusMap.set(otherId, 'blocked');
      } else if (f.status === 'pending') {
        statusMap.set(
          otherId,
          f.user_id === currentUserId ? 'pending_sent' : 'pending_received'
        );
      }
    }

    const results: UserSearchResult[] = users
      .filter((u) => statusMap.get(u.id) !== 'blocked')
      .map((u) => ({
        id: u.id,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        email: u.email,
        friendshipStatus: statusMap.get(u.id) || 'none',
      }));

    return { data: results, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get recent activity from a set of users (current user + friends)
export const getFriendActivity = async (
  userIds: string[]
): Promise<{ data: ActivityLog[] | null; error: string | null }> => {
  try {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get pools that both users share
export const getMutualPools = async (
  userId: string,
  friendId: string
): Promise<{ data: MutualPool[] | null; error: string | null }> => {
  try {
    // Get pool IDs for the current user
    const { data: myMemberships, error: e1 } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('user_id', userId);

    if (e1) {
      return { data: null, error: e1.message };
    }

    const myPoolIds = (myMemberships || []).map((m) => m.pool_id);

    if (myPoolIds.length === 0) {
      return { data: [], error: null };
    }

    // Get friend's memberships that overlap with ours
    const { data: friendMemberships, error: e2 } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('user_id', friendId)
      .in('pool_id', myPoolIds);

    if (e2) {
      return { data: null, error: e2.message };
    }

    const mutualPoolIds = (friendMemberships || []).map((m) => m.pool_id);

    if (mutualPoolIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch pool details
    const { data: pools, error: e3 } = await supabase
      .from('pools')
      .select('id, name, game_type')
      .in('id', mutualPoolIds);

    if (e3) {
      return { data: null, error: e3.message };
    }

    const mutualPools: MutualPool[] = (pools || []).map((p) => ({
      id: p.id,
      name: p.name,
      gameType: p.game_type,
    }));

    return { data: mutualPools, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Pool with friend overlap count (for the Mutual Pools section)
export interface PoolWithFriendCount {
  id: string;
  name: string;
  members: number;
  friendsCount: number;
}

// Get all of the user's active pools and count how many friends are in each
export const getPoolsWithFriendCounts = async (
  userId: string,
  friendIds: string[]
): Promise<{ data: PoolWithFriendCount[] | null; error: string | null }> => {
  try {
    // Get all pools the user is in
    const { data: myMemberships, error: e1 } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('user_id', userId);

    if (e1) {
      return { data: null, error: e1.message };
    }

    if (!myMemberships || myMemberships.length === 0) {
      return { data: [], error: null };
    }

    const poolIds = myMemberships.map((m) => m.pool_id);

    // Get active pool details
    const { data: pools, error: e2 } = await supabase
      .from('pools')
      .select('id, name')
      .in('id', poolIds)
      .eq('status', 'active');

    if (e2) {
      return { data: null, error: e2.message };
    }

    if (!pools || pools.length === 0) {
      return { data: [], error: null };
    }

    // Get all members of these pools in one query
    const { data: allMembers, error: e3 } = await supabase
      .from('pool_members')
      .select('pool_id, user_id')
      .in('pool_id', poolIds);

    if (e3) {
      return { data: null, error: e3.message };
    }

    // Count total members and friends per pool
    const friendIdSet = new Set(friendIds);
    const memberCountMap = new Map<string, number>();
    const friendCountMap = new Map<string, number>();

    for (const m of allMembers || []) {
      memberCountMap.set(m.pool_id, (memberCountMap.get(m.pool_id) || 0) + 1);
      if (friendIdSet.has(m.user_id)) {
        friendCountMap.set(m.pool_id, (friendCountMap.get(m.pool_id) || 0) + 1);
      }
    }

    // Only include pools that have at least 1 friend
    const result: PoolWithFriendCount[] = pools
      .filter((p) => (friendCountMap.get(p.id) || 0) > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        members: memberCountMap.get(p.id) || 0,
        friendsCount: friendCountMap.get(p.id) || 0,
      }));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get total winnings across all pools the user is in (Shared Wealth stat)
export const getSharedWealth = async (
  userId: string
): Promise<{ data: number; error: string | null }> => {
  try {
    // Get all pools the user is in
    const { data: memberships, error: e1 } = await supabase
      .from('pool_members')
      .select('*')
      .eq('user_id', userId);

    if (e1) {
      return { data: 0, error: e1.message };
    }

    if (!memberships || memberships.length === 0) {
      return { data: 0, error: null };
    }

    const poolIds = memberships.map((m) => m.pool_id);

    // Sum all winnings from those pools
    const { data: winnings, error: e2 } = await supabase
      .from('winnings')
      .select('*')
      .in('pool_id', poolIds);

    if (e2) {
      return { data: 0, error: e2.message };
    }

    const total = (winnings || []).reduce((sum, w) => sum + (w.prize_amount || 0), 0);

    return { data: total, error: null };
  } catch (err) {
    return { data: 0, error: 'An unexpected error occurred' };
  }
};

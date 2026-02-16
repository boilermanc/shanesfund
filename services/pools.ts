import { supabase } from '../lib/supabase';
import type { Pool, PoolMember, PoolMemberWithUser, Contribution, InsertTables, UpdateTables } from '../types/database';

// Fire-and-forget: log a user action to activity_log for the social feed.
// Auto-fetches pool name if pool_id is provided and pool_name isn't in details.
async function logActivity(
  userId: string,
  poolId: string | null,
  action: string,
  details: Record<string, any> = {}
) {
  const logDetails = { ...details };
  try {
    if (poolId && !logDetails.pool_name) {
      const { data: pool } = await supabase
        .from('pools')
        .select('name')
        .eq('id', poolId)
        .single();
      if (pool?.name) {
        logDetails.pool_name = pool.name;
      }
    }

    await supabase.from('activity_log').insert({
      user_id: userId,
      pool_id: poolId,
      action,
      details: logDetails,
    });
  } catch (err) {
    console.error('[logActivity] fire-and-forget failed:', err);
  }
}

export interface PoolWithMembers extends Pool {
  members_count?: number;
  pool_members?: PoolMember[];
}
// Get all pools for the current user
export const getUserPools = async (userId: string): Promise<{ data: PoolWithMembers[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pools')
      .select('*, pool_members!inner(user_id, role)')
      .eq('pool_members.user_id', userId)
      .eq('status', 'active');
    if (error) {
      return { data: null, error: error.message };
    }
    const poolIds = (data || []).map((p) => p.id);
    const { data: memberRows } = await supabase
      .from('pool_members')
      .select('pool_id')
      .in('pool_id', poolIds);

    const memberCountMap = new Map<string, number>();
    for (const row of memberRows || []) {
      memberCountMap.set(row.pool_id, (memberCountMap.get(row.pool_id) || 0) + 1);
    }

    const poolsWithCounts = (data || []).map((pool) => ({
      ...pool,
      members_count: memberCountMap.get(pool.id) || 0,
    }));
    return { data: poolsWithCounts, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Get a single pool by ID
export const getPool = async (poolId: string): Promise<{ data: PoolWithMembers | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pools')
      .select('*, pool_members(id, user_id, role, joined_at, users(id, display_name, avatar_url, email))')
      .eq('id', poolId)
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: { ...data, members_count: data.pool_members?.length || 0 }, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Create a new pool and add creator as captain (atomic via RPC)
export const createPool = async (
  pool: Omit<InsertTables<'pools'>, 'id' | 'invite_code' | 'created_at' | 'updated_at'>
): Promise<{ data: PoolWithMembers | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .rpc('create_pool_with_captain', {
        p_name: pool.name,
        p_game_type: pool.game_type,
        p_captain_id: pool.captain_id,
        p_is_private: pool.is_private ?? false,
        p_contribution_amount: pool.contribution_amount ?? 10,
        p_description: pool.description ?? null,
        p_settings: pool.settings ?? {},
      })
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: { ...data, members_count: 1 },
      error: null
    };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Update a pool
export const updatePool = async (
  poolId: string,
  updates: UpdateTables<'pools'>
): Promise<{ data: Pool | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pools')
      .update(updates)
      .eq('id', poolId)
      .select()
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Delete a pool (archive it)
export const archivePool = async (poolId: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('pools')
      .update({ status: 'archived' })
      .eq('id', poolId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};
// Join a pool by invite code
export const joinPoolByCode = async (
  inviteCode: string,
  userId: string
): Promise<{ data: Pool | null; error: string | null }> => {
  try {
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('status', 'active')
      .single();
    if (poolError || !pool) {
      return { data: null, error: 'Invalid invite code or pool not found' };
    }
    const { data: existingMember } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', pool.id)
      .eq('user_id', userId)
      .single();
    if (existingMember) {
      return { data: null, error: 'You are already a member of this pool' };
    }
    const { error: memberError } = await supabase
      .from('pool_members')
      .insert({
        pool_id: pool.id,
        user_id: userId,
        role: 'member',
      });
    if (memberError) {
      return { data: null, error: memberError.message };
    }
    logActivity(userId, pool.id, 'pool_joined', { pool_name: pool.name }).catch(err => console.error('[joinPoolByCode] logActivity failed:', err));
    return { data: pool, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Leave a pool
export const leavePool = async (
  poolId: string,
  userId: string
): Promise<{ error: string | null }> => {
  try {
    const { data: pool } = await supabase
      .from('pools')
      .select('captain_id')
      .eq('id', poolId)
      .single();
    if (pool?.captain_id === userId) {
      return { error: 'Captains cannot leave their own pool. Transfer ownership or archive the pool instead.' };
    }
    const { error } = await supabase
      .from('pool_members')
      .delete()
      .eq('pool_id', poolId)
      .eq('user_id', userId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};
// Get pool members
export const getPoolMembers = async (poolId: string): Promise<{ data: PoolMemberWithUser[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pool_members')
      .select('*, users(id, display_name, avatar_url, email)')
      .eq('pool_id', poolId);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as unknown as PoolMemberWithUser[], error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Remove a member from pool (captain only)
export const removeMember = async (
  poolId: string,
  memberId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('pool_members')
      .delete()
      .eq('pool_id', poolId)
      .eq('user_id', memberId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

// Create a contribution record (marks user as having paid)
export const createContribution = async (
  poolId: string,
  userId: string,
  amount: number,
  drawDate: string
): Promise<{ data: Contribution | null; error: string | null }> => {
  if (amount <= 0) {
    return { data: null, error: 'Contribution amount must be greater than zero' };
  }
  if (amount > 10000) {
    return { data: null, error: 'Contribution amount cannot exceed $10,000' };
  }

  try {
    const { data, error } = await supabase
      .from('contributions')
      .insert({
        pool_id: poolId,
        user_id: userId,
        amount: amount,
        paid: true,
        paid_at: new Date().toISOString(),
        draw_date: drawDate,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    logActivity(userId, poolId, 'contribution_made', { amount }).catch(err => console.error('[createContribution] logActivity failed:', err));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get pool by invite code (for preview before joining)
export const getPoolByInviteCode = async (
  inviteCode: string
): Promise<{ data: PoolWithMembers | null; error: string | null }> => {
  try {
    const { data: pool, error } = await supabase
      .from('pools')
      .select('*, pool_members(id, user_id, role, users(id, display_name, avatar_url))')
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !pool) {
      return { data: null, error: 'Invalid invite code or pool not found' };
    }

    return {
      data: { ...pool, members_count: pool.pool_members?.length || 0 },
      error: null
    };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Win checking — delegated to check-wins edge function (server-side)
export interface WinResult {
  ticketId: string;
  poolId: string;
  numbersMatched: number;
  bonusMatched: boolean;
  prizeTier: string | null;
  prizeAmount: number;
}

// Prize amounts for display only — the actual win determination happens server-side
const PRIZE_AMOUNTS: Record<string, Record<string, number>> = {
  powerball: {
    jackpot: 0, match_5: 1_000_000, match_4_bonus: 50_000, match_4: 100,
    match_3_bonus: 100, match_3: 7, match_2_bonus: 7, match_1_bonus: 4, match_bonus: 4,
  },
  mega_millions: {
    jackpot: 0, match_5: 1_000_000, match_4_bonus: 10_000, match_4: 500,
    match_3_bonus: 200, match_3: 10, match_2_bonus: 10, match_1_bonus: 4, match_bonus: 2,
  },
};

// Map tier name to (numbersMatched, bonusMatched) for display
const TIER_MATCH_INFO: Record<string, { numbers: number; bonus: boolean }> = {
  jackpot: { numbers: 5, bonus: true },
  match_5: { numbers: 5, bonus: false },
  match_4_bonus: { numbers: 4, bonus: true },
  match_4: { numbers: 4, bonus: false },
  match_3_bonus: { numbers: 3, bonus: true },
  match_3: { numbers: 3, bonus: false },
  match_2_bonus: { numbers: 2, bonus: true },
  match_1_bonus: { numbers: 1, bonus: true },
  match_bonus: { numbers: 0, bonus: true },
};

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://fhinyhfvezctknrsmzgp.supabase.co'}/functions/v1/check-wins`;

export async function checkTicketsForDraw(
  gameType: 'powerball' | 'mega_millions'
): Promise<{ wins: WinResult[]; checkedCount: number; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { wins: [], checkedCount: 0, error: 'Not authenticated' };
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ game_type: gameType }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { wins: [], checkedCount: 0, error: result.error || 'Win check failed' };
    }

    // The edge function returns aggregate prize_tiers: { "match_3": 2, "match_bonus": 1 }
    // Map them back to the WinResult[] shape the UI expects for display.
    const gameResult = result.results?.find(
      (r: any) => r.game_type === gameType
    );

    const wins: WinResult[] = [];
    if (gameResult?.prize_tiers) {
      const prizes = PRIZE_AMOUNTS[gameType] || {};
      for (const [tier, count] of Object.entries(gameResult.prize_tiers)) {
        const info = TIER_MATCH_INFO[tier];
        for (let i = 0; i < (count as number); i++) {
          wins.push({
            ticketId: '',
            poolId: '',
            numbersMatched: info?.numbers ?? 0,
            bonusMatched: info?.bonus ?? false,
            prizeTier: tier,
            prizeAmount: prizes[tier] ?? 0,
          });
        }
      }
    }

    return {
      wins,
      checkedCount: gameResult?.tickets_checked ?? 0,
      error: null,
    };
  } catch (err) {
    console.error('Error checking tickets:', err);
    return { wins: [], checkedCount: 0, error: 'Failed to check tickets' };
  }
}

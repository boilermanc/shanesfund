import { supabase } from '../lib/supabase';
import type { Pool, PoolMember, PoolMemberWithUser, Contribution, InsertTables, UpdateTables } from '../types/database';
import type { LotteryDraw } from './lottery';
import { getUncheckedTickets, markTicketChecked } from './tickets';

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
      .in('status', ['active', 'archived']);
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
// Archive a pool
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
// Unarchive a pool (set back to active)
export const unarchivePool = async (poolId: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('pools')
      .update({ status: 'active' })
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

function determinePrizeTier(mainMatches: number, bonusMatch: boolean): string | null {
  if (mainMatches === 5 && bonusMatch) return 'jackpot';
  if (mainMatches === 5) return 'match_5';
  if (mainMatches === 4 && bonusMatch) return 'match_4_bonus';
  if (mainMatches === 4) return 'match_4';
  if (mainMatches === 3 && bonusMatch) return 'match_3_bonus';
  if (mainMatches === 3) return 'match_3';
  if (mainMatches === 2 && bonusMatch) return 'match_2_bonus';
  if (mainMatches === 1 && bonusMatch) return 'match_1_bonus';
  if (mainMatches === 0 && bonusMatch) return 'match_bonus';
  return null;
}

export async function checkTicketsForDraw(
  gameType: 'powerball' | 'mega_millions',
  draw: LotteryDraw | null,
  pools: { id: string; game_type: string; status: string }[]
): Promise<{ wins: WinResult[]; checkedCount: number; error: string | null }> {
  try {
    if (!draw) {
      return { wins: [], checkedCount: 0, error: 'No draw data available' };
    }

    const matchingPools = pools.filter(p => p.game_type === gameType && p.status === 'active');
    if (matchingPools.length === 0) {
      return { wins: [], checkedCount: 0, error: null };
    }

    const winningNumbers = draw.winning_numbers;
    const winningBonus = draw.bonus_number;
    const prizes = PRIZE_AMOUNTS[gameType] || {};
    const jackpotAmount = draw.jackpot_amount ?? 0;

    const allWins: WinResult[] = [];
    let totalChecked = 0;

    for (const pool of matchingPools) {
      const { data: tickets, error: ticketsError } = await getUncheckedTickets(pool.id);

      if (ticketsError || !tickets) {
        console.error(`Error fetching tickets for pool ${pool.id}:`, ticketsError);
        continue;
      }

      const relevantTickets = tickets.filter(t => t.draw_date === draw.draw_date);

      for (const ticket of relevantTickets) {
        totalChecked++;

        const ticketNumbers = ticket.numbers as number[];
        const ticketBonus = ticket.bonus_number as number;

        const mainMatches = ticketNumbers.filter((n: number) => winningNumbers.includes(n)).length;
        const bonusMatch = ticketBonus === winningBonus;
        const prizeTier = determinePrizeTier(mainMatches, bonusMatch);
        const isWinner = prizeTier !== null;

        // Fire-and-forget — mark ticket as checked
        markTicketChecked(ticket.id, isWinner).catch(err =>
          console.error(`Failed to mark ticket ${ticket.id} as checked:`, err)
        );

        if (prizeTier) {
          allWins.push({
            ticketId: ticket.id,
            poolId: pool.id,
            numbersMatched: mainMatches,
            bonusMatched: bonusMatch,
            prizeTier,
            prizeAmount: prizeTier === 'jackpot' ? jackpotAmount : (prizes[prizeTier] ?? 0),
          });
        }
      }
    }

    return { wins: allWins, checkedCount: totalChecked, error: null };
  } catch (err) {
    console.error('Error checking tickets:', err);
    return { wins: [], checkedCount: 0, error: 'Failed to check tickets' };
  }
}

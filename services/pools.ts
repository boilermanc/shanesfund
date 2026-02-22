import { supabase } from '../lib/supabase';
import type { Pool, PoolMember, PoolMemberWithUser, Contribution, ContributionWithUser, InsertTables, UpdateTables } from '../types/database';
import { sendNotification } from './notifications';
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
      const msg = error.message;
      const isNetworkError = msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError');
      return { data: null, error: isNetworkError ? 'Network error — please check your connection and try again.' : msg };
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

// Create a contribution record (pending captain confirmation)
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
        paid: false,
        status: 'pending',
        draw_date: drawDate,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    logActivity(userId, poolId, 'contribution_submitted', { amount }).catch(err => console.error('[createContribution] logActivity failed:', err));

    // Fire-and-forget: notify the captain about pending contribution
    notifyCaptainOfContribution(poolId, userId, amount).catch(err => console.error('[createContribution] captain notification failed:', err));

    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Fire-and-forget helper: notify pool captain of a pending contribution
async function notifyCaptainOfContribution(poolId: string, memberId: string, amount: number) {
  const { data: pool } = await supabase
    .from('pools')
    .select('captain_id, name')
    .eq('id', poolId)
    .single();

  const poolData = pool as { captain_id: string; name: string } | null;
  if (!poolData?.captain_id) return;

  const { data: member } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', memberId)
    .single();

  const memberData = member as { display_name: string | null; email: string } | null;
  const memberName = memberData?.display_name || memberData?.email?.split('@')[0] || 'A member';

  await sendNotification({
    userId: poolData.captain_id,
    type: 'payment',
    title: 'Contribution Pending',
    message: `${memberName} submitted $${amount.toFixed(2)} for ${poolData.name}`,
    data: { pool_id: poolId, contribution_user_id: memberId },
  });
}

// Captain confirms a pending contribution
export const confirmContribution = async (
  contributionId: string,
  captainId: string
): Promise<{ data: Contribution | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .update({
        status: 'confirmed',
        paid: true,
        paid_at: new Date().toISOString(),
        confirmed_by: captainId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', contributionId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || 'Contribution not found or already processed' };
    }

    const contrib = data as unknown as Contribution;

    sendNotification({
      userId: contrib.user_id,
      type: 'payment',
      title: 'Contribution Confirmed',
      message: `Your $${contrib.amount.toFixed(2)} contribution has been confirmed!`,
      data: { pool_id: contrib.pool_id, contribution_id: contrib.id },
    }).catch(err => console.error('[confirmContribution] notification failed:', err));

    logActivity(captainId, contrib.pool_id, 'contribution_confirmed', { amount: contrib.amount, member_id: contrib.user_id }).catch(err => console.error('[confirmContribution] logActivity failed:', err));

    return { data: contrib, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Captain rejects a pending contribution
export const rejectContribution = async (
  contributionId: string,
  captainId: string
): Promise<{ data: Contribution | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .update({
        status: 'rejected',
        paid: false,
        confirmed_by: captainId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', contributionId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || 'Contribution not found or already processed' };
    }

    const contrib = data as unknown as Contribution;

    sendNotification({
      userId: contrib.user_id,
      type: 'payment',
      title: 'Contribution Not Confirmed',
      message: `Your $${contrib.amount.toFixed(2)} contribution was not confirmed. Please contact your pool captain.`,
      data: { pool_id: contrib.pool_id, contribution_id: contrib.id },
    }).catch(err => console.error('[rejectContribution] notification failed:', err));

    logActivity(captainId, contrib.pool_id, 'contribution_rejected', { amount: contrib.amount, member_id: contrib.user_id }).catch(err => console.error('[rejectContribution] logActivity failed:', err));

    return { data: contrib, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Get all contributions for a pool (with user info), optionally filtered by draw date
export const getPoolContributions = async (
  poolId: string,
  drawDate?: string
): Promise<{ data: ContributionWithUser[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('contributions')
      .select('*, users:user_id(id, display_name, avatar_url, email)')
      .eq('pool_id', poolId)
      .order('created_at', { ascending: false });

    if (drawDate) {
      query = query.eq('draw_date', drawDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as unknown as ContributionWithUser[], error: null };
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
    console.log(`[checkTickets] Starting for ${gameType}`, { draw: draw?.draw_date, poolCount: pools.length });

    if (!draw) {
      console.log(`[checkTickets] No draw data for ${gameType}`);
      return { wins: [], checkedCount: 0, error: 'No draw data available' };
    }

    const matchingPools = pools.filter(p => p.game_type === gameType && p.status === 'active');
    console.log(`[checkTickets] ${matchingPools.length} matching pools for ${gameType}:`, matchingPools.map(p => p.id));

    if (matchingPools.length === 0) {
      return { wins: [], checkedCount: 0, error: null };
    }

    const winningNumbers = draw.winning_numbers;
    const winningBonus = draw.bonus_number;
    const prizes = PRIZE_AMOUNTS[gameType] || {};
    const jackpotAmount = draw.jackpot_amount ?? 0;
    console.log(`[checkTickets] Draw ${draw.draw_date}: winning=${winningNumbers}, bonus=${winningBonus}`);

    const allWins: WinResult[] = [];
    let totalChecked = 0;

    for (const pool of matchingPools) {
      console.log(`[checkTickets] Fetching unchecked tickets for pool ${pool.id}...`);
      const { data: tickets, error: ticketsError } = await getUncheckedTickets(pool.id);

      if (ticketsError || !tickets) {
        console.error(`[checkTickets] Error fetching tickets for pool ${pool.id}:`, ticketsError);
        continue;
      }

      console.log(`[checkTickets] Pool ${pool.id}: ${tickets.length} unchecked tickets, filtering for draw ${draw.draw_date}`);
      const relevantTickets = tickets.filter(t => t.draw_date === draw.draw_date);
      console.log(`[checkTickets] ${relevantTickets.length} tickets match draw date`);

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

    console.log(`[checkTickets] Done for ${gameType}: ${totalChecked} checked, ${allWins.length} wins`);
    return { wins: allWins, checkedCount: totalChecked, error: null };
  } catch (err) {
    console.error('[checkTickets] Error:', err);
    return { wins: [], checkedCount: 0, error: 'Failed to check tickets' };
  }
}

/**
 * Check ALL unchecked tickets across all pools for a game type, matching each
 * ticket to its corresponding draw by date. This catches tickets from ANY past
 * draw, not just the single latest one.
 *
 * @param latestDraw - Optional latest draw from the API (may not be in DB yet).
 *                     Included so tickets can still be checked if the cron
 *                     hasn't ingested the draw into Supabase yet.
 */
export async function checkAllUncheckedTickets(
  gameType: 'powerball' | 'mega_millions',
  pools: { id: string; game_type: string; status: string }[],
  latestDraw?: LotteryDraw | null
): Promise<{ wins: WinResult[]; checkedCount: number; error: string | null }> {
  try {
    const matchingPools = pools.filter(p => p.game_type === gameType && p.status === 'active');
    if (matchingPools.length === 0) {
      return { wins: [], checkedCount: 0, error: null };
    }

    // 1. Gather all unchecked tickets across matching pools
    const allTickets: { id: string; pool_id: string; draw_date: string; numbers: number[]; bonus_number: number }[] = [];
    for (const pool of matchingPools) {
      const { data: tickets, error: ticketsError } = await getUncheckedTickets(pool.id);
      if (ticketsError || !tickets) continue;
      allTickets.push(...tickets.map(t => ({
        id: t.id,
        pool_id: t.pool_id,
        draw_date: t.draw_date,
        numbers: t.numbers as number[],
        bonus_number: t.bonus_number as number,
      })));
    }

    if (allTickets.length === 0) {
      return { wins: [], checkedCount: 0, error: null };
    }

    // 2. Fetch draw results for every unique draw date these tickets reference
    const drawDates = [...new Set(allTickets.map(t => t.draw_date))];
    const { getDrawsByDates } = await import('./lottery');
    const draws = await getDrawsByDates(gameType, drawDates);

    // Build lookup: draw_date -> draw
    const drawMap = new Map<string, LotteryDraw>();
    for (const draw of draws) {
      drawMap.set(draw.draw_date, draw);
    }

    // Include the API-sourced latest draw if it's not already in the map
    if (latestDraw && latestDraw.game_type === gameType && !drawMap.has(latestDraw.draw_date)) {
      drawMap.set(latestDraw.draw_date, latestDraw);
    }

    // 3. Check each ticket against its matching draw
    const prizes = PRIZE_AMOUNTS[gameType] || {};
    const allWins: WinResult[] = [];
    let totalChecked = 0;

    for (const ticket of allTickets) {
      const draw = drawMap.get(ticket.draw_date);
      if (!draw) continue; // No results for this date yet — skip

      totalChecked++;
      const mainMatches = ticket.numbers.filter((n: number) => draw.winning_numbers.includes(n)).length;
      const bonusMatch = ticket.bonus_number === draw.bonus_number;
      const prizeTier = determinePrizeTier(mainMatches, bonusMatch);
      const isWinner = prizeTier !== null;

      markTicketChecked(ticket.id, isWinner).catch(err =>
        console.error(`Failed to mark ticket ${ticket.id} as checked:`, err)
      );

      if (prizeTier) {
        const jackpotAmount = draw.jackpot_amount ?? 0;
        allWins.push({
          ticketId: ticket.id,
          poolId: ticket.pool_id,
          numbersMatched: mainMatches,
          bonusMatched: bonusMatch,
          prizeTier,
          prizeAmount: prizeTier === 'jackpot' ? jackpotAmount : (prizes[prizeTier] ?? 0),
        });
      }
    }

    return { wins: allWins, checkedCount: totalChecked, error: null };
  } catch (err) {
    console.error('[checkAllUncheckedTickets] Error:', err);
    return { wins: [], checkedCount: 0, error: 'Failed to check tickets' };
  }
}

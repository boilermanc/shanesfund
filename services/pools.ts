import { supabase } from '../lib/supabase';
import type { Pool, PoolMember, InsertTables, UpdateTables } from '../types/database';

// Fire-and-forget: log a user action to activity_log for the social feed.
// Auto-fetches pool name if pool_id is provided and pool_name isn't in details.
async function logActivity(
  userId: string,
  poolId: string | null,
  action: string,
  details: Record<string, any> = {}
) {
  try {
    if (poolId && !details.pool_name) {
      const { data: pool } = await supabase
        .from('pools')
        .select('name')
        .eq('id', poolId)
        .single();
      if (pool?.name) {
        details.pool_name = pool.name;
      }
    }

    await supabase.from('activity_log').insert({
      user_id: userId,
      pool_id: poolId,
      action,
      details,
    });
  } catch {
    // Silently ignore — activity logging should never break the main flow
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
    const poolsWithCounts = await Promise.all(
      (data || []).map(async (pool) => {
        const { count } = await supabase
          .from('pool_members')
          .select('*', { count: 'exact', head: true })
          .eq('pool_id', pool.id);
        return {
          ...pool,
          members_count: count || 0,
        };
      })
    );
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
// Create a new pool and add creator as captain
export const createPool = async (
  pool: Omit<InsertTables<'pools'>, 'id' | 'invite_code' | 'created_at' | 'updated_at'>
): Promise<{ data: PoolWithMembers | null; error: string | null }> => {
  try {
    // Create the pool
    const { data, error } = await supabase
      .from('pools')
      .insert(pool)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Add the creator as a captain member
    const { error: memberError } = await supabase
      .from('pool_members')
      .insert({
        pool_id: data.id,
        user_id: pool.captain_id,
        role: 'captain',
      });

    if (memberError) {
      console.error('Failed to add captain as member:', memberError.message);
      // Pool was created but member wasn't added - still return pool
    }

    // Return pool with members_count
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
    logActivity(userId, pool.id, 'pool_joined', { pool_name: pool.name });
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
export const getPoolMembers = async (poolId: string): Promise<{ data: any[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pool_members')
      .select('*, users(id, display_name, avatar_url, email)')
      .eq('pool_id', poolId);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
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
): Promise<{ data: any | null; error: string | null }> => {
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

    logActivity(userId, poolId, 'contribution_made', { amount });
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
// Ticket functions
export interface CreateTicketInput {
  pool_id: string;
  game_type: 'powerball' | 'mega_millions';
  numbers: number[];
  bonus_number: number;
  multiplier?: number;
  draw_date: string;
  entered_by: string;
  entry_method: 'scan' | 'manual';
  image_url?: string;
}
export async function createTicket(ticket: CreateTicketInput): Promise<{ data: any; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();
    if (error) {
      console.error('Error creating ticket:', error);
      return { data: null, error: error.message };
    }
    logActivity(ticket.entered_by, ticket.pool_id, 'ticket_scanned', {
      entry_method: ticket.entry_method,
    });
    return { data, error: null };
  } catch (err) {
    console.error('Exception creating ticket:', err);
    return { data: null, error: 'Failed to create ticket' };
  }
}
export async function getPoolTickets(poolId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
  return data || [];
}
// Win checking functions
export interface WinResult {
  ticketId: string;
  poolId: string;
  numbersMatched: number;
  bonusMatched: boolean;
  prizeTier: string | null;
  prizeAmount: number;
}
const POWERBALL_PRIZES: Record<string, number> = {
  'jackpot': 0, // Variable
  'match_5': 1000000,
  'match_4_bonus': 50000,
  'match_4': 100,
  'match_3_bonus': 100,
  'match_3': 7,
  'match_2_bonus': 7,
  'match_1_bonus': 4,
  'match_bonus': 4,
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
  gameType: 'powerball' | 'mega_millions'
): Promise<{ wins: WinResult[]; checkedCount: number; error: string | null }> {
  try {
    // Get the latest draw for this game
    const { data: draw, error: drawError } = await supabase
      .from('lottery_draws')
      .select('*')
      .eq('game_type', gameType)
      .order('draw_date', { ascending: false })
      .limit(1)
      .single();
    if (drawError || !draw) {
      return { wins: [], checkedCount: 0, error: 'No draw data found' };
    }
    // Get all unchecked tickets for this game type and draw date
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('game_type', gameType)
      .eq('draw_date', draw.draw_date)
      .eq('checked', false);
    if (ticketsError) {
      return { wins: [], checkedCount: 0, error: ticketsError.message };
    }
    if (!tickets || tickets.length === 0) {
      return { wins: [], checkedCount: 0, error: null };
    }
    const wins: WinResult[] = [];
    const winningNumbers = draw.winning_numbers as number[];
    const winningBonus = draw.bonus_number as number;
    for (const ticket of tickets) {
      const ticketNumbers = ticket.numbers as number[];
      const ticketBonus = ticket.bonus_number as number;
      // Count main number matches
      const mainMatches = ticketNumbers.filter(n => winningNumbers.includes(n)).length;
      const bonusMatch = ticketBonus === winningBonus;
      // Determine prize tier
      const prizeTier = determinePrizeTier(mainMatches, bonusMatch);
      if (prizeTier) {
        const prizeAmount = POWERBALL_PRIZES[prizeTier] || 0;
        // Insert winning record
        const { error: winError } = await supabase
          .from('winnings')
          .insert({
            ticket_id: ticket.id,
            pool_id: ticket.pool_id,
            prize_amount: prizeAmount,
            prize_tier: prizeTier,
            numbers_matched: mainMatches,
            bonus_matched: bonusMatch,
            draw_date: draw.draw_date,
          });
        if (!winError) {
          wins.push({
            ticketId: ticket.id,
            poolId: ticket.pool_id,
            numbersMatched: mainMatches,
            bonusMatched: bonusMatch,
            prizeTier,
            prizeAmount,
          });
          logActivity(ticket.entered_by, ticket.pool_id, 'win_detected', {
            amount: prizeAmount,
            prize_tier: prizeTier,
          });
        }
        // Mark ticket as winner
        await supabase
          .from('tickets')
          .update({ checked: true, is_winner: true })
          .eq('id', ticket.id);
      } else {
        // Mark ticket as checked (no win)
        await supabase
          .from('tickets')
          .update({ checked: true, is_winner: false })
          .eq('id', ticket.id);
      }
    }
    return { wins, checkedCount: tickets.length, error: null };
  } catch (err) {
    console.error('Error checking tickets:', err);
    return { wins: [], checkedCount: 0, error: 'Failed to check tickets' };
  }
}

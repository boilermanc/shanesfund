import { supabase } from '../lib/supabase';
import type { Pool, PoolMember, InsertTables, UpdateTables } from '../types/database';
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
// Create a new pool
export const createPool = async (
  pool: Omit<InsertTables<'pools'>, 'id' | 'invite_code' | 'created_at' | 'updated_at'>
): Promise<{ data: Pool | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('pools')
      .insert(pool)
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

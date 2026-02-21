import { supabase } from '../lib/supabase';
import type { Ticket, InsertTables, UpdateTables } from '../types/database';
import {
  validateTicketNumbers as validateNumbers,
  validateTicketForPool,
  validateDrawDate,
} from '../utils/ticketValidation';

// Fire-and-forget: notify pool members that a ticket was added
async function notifyPoolOfNewTicket(poolId: string, enteredBy: string, playCount: number) {
  try {
    // Look up pool name + who added it
    const [poolRes, userRes] = await Promise.all([
      supabase.from('pools').select('name').eq('id', poolId).single(),
      supabase.from('users').select('display_name').eq('id', enteredBy).single(),
    ]);
    const poolName = poolRes.data?.name || 'your pool';
    const userName = userRes.data?.display_name || 'Someone';
    const ticketLabel = playCount > 1 ? `${playCount} plays` : 'a ticket';

    // Get all pool members EXCEPT the person who added the ticket
    const { data: members } = await supabase
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', poolId)
      .neq('user_id', enteredBy);

    if (!members?.length) return;

    const notifications = members.map(m => ({
      user_id: m.user_id,
      type: 'pool_update' as const,
      title: 'New Ticket Added',
      message: `${userName} added ${ticketLabel} to ${poolName}`,
      data: { pool_id: poolId },
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) console.error('[notifyPoolOfNewTicket] failed:', error.message);
  } catch (err) {
    console.error('[notifyPoolOfNewTicket] failed:', err);
  }
}

// Get all tickets for a pool
export const getPoolTickets = async (
  poolId: string
): Promise<{ data: Ticket[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        users:entered_by (
          display_name,
          avatar_url
        )
      `)
      .eq('pool_id', poolId)
      .order('draw_date', { ascending: false });
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Get tickets by draw date
export const getTicketsByDrawDate = async (
  poolId: string,
  drawDate: string
): Promise<{ data: Ticket[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('pool_id', poolId)
      .eq('draw_date', drawDate);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Get a single ticket
export const getTicket = async (
  ticketId: string
): Promise<{ data: Ticket | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Add a new ticket (all ticket creation must go through this function)
export const addTicket = async (
  ticket: Omit<InsertTables<'tickets'>, 'id' | 'created_at'>,
  poolGameType?: 'powerball' | 'mega_millions'
): Promise<{ data: Ticket | null; error: string | null }> => {
  try {
    // Check if pool is archived — block ticket creation
    const { data: poolData } = await supabase
      .from('pools')
      .select('status')
      .eq('id', ticket.pool_id)
      .single();
    if (poolData?.status === 'archived') {
      return { data: null, error: 'This pool is archived. No new tickets can be added.' };
    }

    // Validate ticket game type matches pool game type
    if (poolGameType) {
      const poolCheck = validateTicketForPool(poolGameType, ticket.game_type);
      if (!poolCheck.valid) {
        return { data: null, error: poolCheck.error! };
      }
    }

    // Validate numbers (ranges, count, duplicates)
    const numbersCheck = validateNumbers(
      ticket.game_type,
      ticket.numbers,
      ticket.bonus_number
    );
    if (!numbersCheck.valid) {
      return { data: null, error: numbersCheck.errors.join(' ') };
    }

    // Validate draw date hasn't passed
    if (ticket.draw_date) {
      const drawCheck = validateDrawDate(ticket.game_type, ticket.draw_date);
      if (!drawCheck.valid) {
        return { data: null, error: drawCheck.error! };
      }
    }

    // Check for duplicate ticket in the same pool + draw date
    if (ticket.draw_date) {
      const sorted = [...ticket.numbers].sort((a, b) => a - b);
      const { data: existing } = await supabase
        .from('tickets')
        .select('id, numbers, bonus_number')
        .eq('pool_id', ticket.pool_id)
        .eq('draw_date', ticket.draw_date)
        .eq('bonus_number', ticket.bonus_number);

      if (existing?.some(t => {
        const tSorted = [...t.numbers].sort((a, b) => a - b);
        return tSorted.length === sorted.length && tSorted.every((n, i) => n === sorted[i]);
      })) {
        return { data: null, error: 'This ticket already exists in this pool for the selected draw.' };
      }
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    // Fire-and-forget activity log + pool notification
    supabase.from('activity_log').insert({
      user_id: ticket.entered_by,
      pool_id: ticket.pool_id,
      action: 'ticket_scanned',
      details: { entry_method: ticket.entry_method },
    }).then(({ error }) => { if (error) console.error('[addTicket] activity log failed:', error.message); })
      .catch(err => console.error('[addTicket] activity log failed:', err));
    notifyPoolOfNewTicket(ticket.pool_id, ticket.entered_by, 1);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Add multiple plays from a single physical ticket slip
interface BatchPlay {
  numbers: number[];
  bonus_number: number;
}

interface BatchTicketParams {
  pool_id: string;
  game_type: 'powerball' | 'mega_millions';
  draw_date: string;
  multiplier: number | null;
  entered_by: string;
  entry_method: 'scan' | 'manual';
  plays: BatchPlay[];
}

export const addTicketBatch = async (
  params: BatchTicketParams,
  poolGameType?: 'powerball' | 'mega_millions'
): Promise<{ data: Ticket[] | null; error: string | null }> => {
  try {
    if (params.plays.length === 0) {
      return { data: null, error: 'No plays provided' };
    }

    // Check if pool is archived
    const { data: poolData } = await supabase
      .from('pools')
      .select('status')
      .eq('id', params.pool_id)
      .single();
    if (poolData?.status === 'archived') {
      return { data: null, error: 'This pool is archived. No new tickets can be added.' };
    }

    // Validate game type matches pool
    if (poolGameType) {
      const poolCheck = validateTicketForPool(poolGameType, params.game_type);
      if (!poolCheck.valid) {
        return { data: null, error: poolCheck.error! };
      }
    }

    // Validate draw date
    if (params.draw_date) {
      const drawCheck = validateDrawDate(params.game_type, params.draw_date);
      if (!drawCheck.valid) {
        return { data: null, error: drawCheck.error! };
      }
    }

    // Validate each play's numbers
    for (let i = 0; i < params.plays.length; i++) {
      const play = params.plays[i];
      const label = params.plays.length > 1
        ? `Play ${String.fromCharCode(65 + i)}: `
        : '';
      const numbersCheck = validateNumbers(
        params.game_type,
        play.numbers,
        play.bonus_number
      );
      if (!numbersCheck.valid) {
        return { data: null, error: `${label}${numbersCheck.errors.join(' ')}` };
      }
    }

    // Check for duplicates against existing tickets in pool + draw
    const { data: existing } = await supabase
      .from('tickets')
      .select('id, numbers, bonus_number')
      .eq('pool_id', params.pool_id)
      .eq('draw_date', params.draw_date);

    for (let i = 0; i < params.plays.length; i++) {
      const play = params.plays[i];
      const sorted = [...play.numbers].sort((a, b) => a - b);
      const label = params.plays.length > 1
        ? `Play ${String.fromCharCode(65 + i)}: `
        : '';

      // Check against existing DB tickets
      if (existing?.some(t => {
        const tSorted = [...t.numbers].sort((a, b) => a - b);
        return t.bonus_number === play.bonus_number
          && tSorted.length === sorted.length
          && tSorted.every((n, idx) => n === sorted[idx]);
      })) {
        return { data: null, error: `${label}This ticket already exists in this pool for the selected draw.` };
      }

      // Check against other plays in the same batch
      for (let j = 0; j < i; j++) {
        const other = params.plays[j];
        const otherSorted = [...other.numbers].sort((a, b) => a - b);
        if (other.bonus_number === play.bonus_number
          && otherSorted.length === sorted.length
          && otherSorted.every((n, idx) => n === sorted[idx])) {
          return { data: null, error: `${label}Duplicate of Play ${String.fromCharCode(65 + j)}.` };
        }
      }
    }

    // Generate group ID only for multi-play slips
    const ticketGroupId = params.plays.length > 1 ? crypto.randomUUID() : null;

    // Build insert array
    const insertRows = params.plays.map(play => ({
      pool_id: params.pool_id,
      game_type: params.game_type,
      draw_date: params.draw_date,
      multiplier: params.multiplier,
      entered_by: params.entered_by,
      entry_method: params.entry_method,
      numbers: play.numbers,
      bonus_number: play.bonus_number,
      ticket_group_id: ticketGroupId,
    }));

    const { data, error } = await supabase
      .from('tickets')
      .insert(insertRows)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    // Fire-and-forget activity log + pool notification
    supabase.from('activity_log').insert({
      user_id: params.entered_by,
      pool_id: params.pool_id,
      action: 'ticket_scanned',
      details: { entry_method: params.entry_method, play_count: params.plays.length },
    }).then(({ error }) => { if (error) console.error('[addTicketBatch] activity log failed:', error.message); })
      .catch(err => console.error('[addTicketBatch] activity log failed:', err));
    notifyPoolOfNewTicket(params.pool_id, params.entered_by, params.plays.length);

    return { data: data as Ticket[], error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};

// Update a ticket
export const updateTicket = async (
  ticketId: string,
  updates: UpdateTables<'tickets'>
): Promise<{ data: Ticket | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
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
// Delete a ticket
export const deleteTicket = async (
  ticketId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};
// Upload ticket image
export const uploadTicketImage = async (
  poolId: string,
  ticketId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { url: null, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' };
  }

  if (file.size > MAX_SIZE) {
    return { url: null, error: 'File too large. Maximum size is 10MB.' };
  }

  try {
    const filePath = `${poolId}/${ticketId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('tickets')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      return { url: null, error: uploadError.message };
    }
    const { data } = supabase.storage
      .from('tickets')
      .getPublicUrl(filePath);
    // Update ticket with image URL
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ image_url: data.publicUrl })
      .eq('id', ticketId);
    if (updateError) {
      console.error('[uploadTicketImage] Failed to update ticket image_url:', updateError.message);
      return { url: null, error: 'Image uploaded but failed to link to ticket' };
    }
    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: 'An unexpected error occurred' };
  }
};
// Get unchecked tickets (for win checking)
export const getUncheckedTickets = async (
  poolId: string
): Promise<{ data: Ticket[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('pool_id', poolId)
      .eq('checked', false)
      .lte('draw_date', new Date().toISOString().split('T')[0]);
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred' };
  }
};
// Mark ticket as checked
export const markTicketChecked = async (
  ticketId: string,
  isWinner: boolean
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ checked: true, is_winner: isWinner })
      .eq('id', ticketId);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
};

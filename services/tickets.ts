import { supabase } from '../lib/supabase';
import type { Ticket, InsertTables, UpdateTables } from '../types/database';
import {
  validateTicketNumbers as validateNumbers,
  validateTicketForPool,
  validateDrawDate,
} from '../utils/ticketValidation';

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
    // Fire-and-forget activity log
    supabase.from('activity_log').insert({
      user_id: ticket.entered_by,
      pool_id: ticket.pool_id,
      action: 'ticket_scanned',
      details: { entry_method: ticket.entry_method },
    }).then(({ error }) => { if (error) console.error('[addTicket] activity log failed:', error.message); })
      .catch(err => console.error('[addTicket] activity log failed:', err));
    return { data, error: null };
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

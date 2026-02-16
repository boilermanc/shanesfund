import { supabase } from '../lib/supabase';
import type { Ticket, InsertTables, UpdateTables } from '../types/database';

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
  ticket: Omit<InsertTables<'tickets'>, 'id' | 'created_at'>
): Promise<{ data: Ticket | null; error: string | null }> => {
  try {
    // Reject duplicate main numbers
    if (hasDuplicates(ticket.numbers)) {
      return { data: null, error: 'Ticket numbers must not contain duplicates' };
    }
    // Validate numbers based on game type
    const isValid = validateTicketNumbers(
      ticket.game_type,
      ticket.numbers,
      ticket.bonus_number
    );
    if (!isValid) {
      return { data: null, error: 'Invalid ticket numbers for this game type' };
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
// Validate ticket numbers
export const validateTicketNumbers = (
  gameType: 'powerball' | 'mega_millions',
  numbers: number[],
  bonusNumber: number
): boolean => {
  if (numbers.length !== 5) return false;
  if (gameType === 'powerball') {
    // Powerball: 5 numbers (1-69) + Powerball (1-26)
    const validMain = numbers.every((n) => n >= 1 && n <= 69);
    const validBonus = bonusNumber >= 1 && bonusNumber <= 26;
    return validMain && validBonus;
  } else {
    // Mega Millions: 5 numbers (1-70) + Mega Ball (1-25)
    const validMain = numbers.every((n) => n >= 1 && n <= 70);
    const validBonus = bonusNumber >= 1 && bonusNumber <= 25;
    return validMain && validBonus;
  }
};
// Check if numbers have duplicates
export const hasDuplicates = (numbers: number[]): boolean => {
  return new Set(numbers).size !== numbers.length;
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
    await supabase
      .from('tickets')
      .update({ image_url: data.publicUrl })
      .eq('id', ticketId);
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

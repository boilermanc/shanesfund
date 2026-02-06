// services/lottery.ts
// Service functions for lottery draw data
import { supabase } from '../lib/supabase';
export interface LotteryDraw {
  id: string;
  game_type: 'powerball' | 'mega_millions';
  draw_date: string;
  winning_numbers: number[];
  bonus_number: number;
  multiplier: number | null;
  jackpot_amount: number | null;
  created_at: string;
}
export async function getLatestDraws(): Promise<{
  powerball: LotteryDraw | null;
  megaMillions: LotteryDraw | null;
}> {
  const { data: powerballData, error: pbError } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('game_type', 'powerball')
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();
  if (pbError && pbError.code !== 'PGRST116') {
    console.error('Error fetching Powerball:', pbError);
  }
  const { data: megaData, error: mmError } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('game_type', 'mega_millions')
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();
  if (mmError && mmError.code !== 'PGRST116') {
    console.error('Error fetching Mega Millions:', mmError);
  }
  return {
    powerball: powerballData as LotteryDraw | null,
    megaMillions: megaData as LotteryDraw | null,
  };
}
export async function getDrawHistory(
  gameType: 'powerball' | 'mega_millions',
  limit: number = 10
): Promise<LotteryDraw[]> {
  const { data, error } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('game_type', gameType)
    .order('draw_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data as LotteryDraw[];
}
export function formatJackpot(amount: number | null): string {
  if (!amount) return 'TBD';
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)} BILLION`;
  } else if (amount >= 1_000_000) {
    return `$${Math.round(amount / 1_000_000)} MILLION`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
}
export function formatDrawDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

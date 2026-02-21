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
  updated_at?: string;
}
// NY Open Data API endpoints (free, no API key required)
const NY_OPEN_DATA = {
  powerball: 'https://data.ny.gov/resource/d6yy-54nr.json?$limit=1&$order=draw_date%20DESC',
  mega_millions: 'https://data.ny.gov/resource/5xaw-6ayf.json?$limit=1&$order=draw_date%20DESC',
};
// Mega Millions official JSON endpoint for jackpot data
const MM_JACKPOT_URL = 'https://www.megamillions.com/cmspages/utilservice.asmx/GetLatestDrawData';

// Best-effort client-side fetch of Mega Millions jackpot (may fail due to CORS)
async function fetchMegaMillionsJackpot(): Promise<number | null> {
  try {
    const resp = await fetch(MM_JACKPOT_URL);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.Jackpot?.NextPrizePool ?? data?.Jackpot?.CurrentPrizePool ?? null;
  } catch {
    // CORS or network error — expected when called from browser
    return null;
  }
}
async function fetchLatestFromNYOpenData(): Promise<{
  powerball: LotteryDraw | null;
  megaMillions: LotteryDraw | null;
}> {
  const results: { powerball: LotteryDraw | null; megaMillions: LotteryDraw | null } = {
    powerball: null,
    megaMillions: null,
  };
  try {
    const [pbResponse, mmResponse] = await Promise.all([
      fetch(NY_OPEN_DATA.powerball),
      fetch(NY_OPEN_DATA.mega_millions),
    ]);
    // Parse Powerball
    if (pbResponse.ok) {
      const pbData = await pbResponse.json();
      if (Array.isArray(pbData) && pbData.length > 0) {
        const r = pbData[0];
        const parts = r.winning_numbers.trim().split(/\s+/).map(Number);
        if (parts.length >= 6) {
          results.powerball = {
            id: `ny-pb-${r.draw_date}`,
            game_type: 'powerball',
            draw_date: r.draw_date.split('T')[0],
            winning_numbers: parts.slice(0, 5),
            bonus_number: parts[5],
            multiplier: r.multiplier ? parseInt(r.multiplier, 10) : null,
            jackpot_amount: null,
            created_at: new Date().toISOString(),
          };
        }
      }
    }
    // Parse Mega Millions
    if (mmResponse.ok) {
      const mmData = await mmResponse.json();
      if (Array.isArray(mmData) && mmData.length > 0) {
        const r = mmData[0];
        const parts = r.winning_numbers.trim().split(/\s+/).map(Number);
        results.megaMillions = {
          id: `ny-mm-${r.draw_date}`,
          game_type: 'mega_millions',
          draw_date: r.draw_date.split('T')[0],
          winning_numbers: parts,
          bonus_number: parseInt(r.mega_ball, 10),
          multiplier: r.multiplier ? parseInt(r.multiplier, 10) : null,
          jackpot_amount: null,
          created_at: new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from NY Open Data:', error);
  }
  return results;
}
export async function getLatestDraws(): Promise<{
  powerball: LotteryDraw | null;
  megaMillions: LotteryDraw | null;
}> {
  // Try Supabase first (primary source) — fetch both in parallel
  const [pbResult, mmResult] = await Promise.all([
    supabase
      .from('lottery_draws')
      .select('*')
      .eq('game_type', 'powerball')
      .order('draw_date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('lottery_draws')
      .select('*')
      .eq('game_type', 'mega_millions')
      .order('draw_date', { ascending: false })
      .limit(1)
      .single(),
  ]);
  if (pbResult.error && pbResult.error.code !== 'PGRST116') {
    console.error('Error fetching Powerball:', pbResult.error);
  }
  if (mmResult.error && mmResult.error.code !== 'PGRST116') {
    console.error('Error fetching Mega Millions:', mmResult.error);
  }
  let powerball = pbResult.data as LotteryDraw | null;
  let megaMillions = mmResult.data as LotteryDraw | null;
  // Fallback to NY Open Data API if Supabase has no data
  if (!powerball || !megaMillions) {
    const apiResults = await fetchLatestFromNYOpenData();
    if (!powerball) powerball = apiResults.powerball;
    if (!megaMillions) megaMillions = apiResults.megaMillions;
  }
  // If Mega Millions jackpot is missing, try fetching directly (best-effort, may fail due to CORS)
  if (megaMillions && megaMillions.jackpot_amount === null) {
    const mmJackpot = await fetchMegaMillionsJackpot();
    if (mmJackpot !== null) {
      megaMillions = { ...megaMillions, jackpot_amount: mmJackpot };
    }
  }
  return { powerball, megaMillions };
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
  if (amount === null || amount === undefined) return 'TBD';
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
export function formatTimeAgo(dateString: string | undefined | null): string {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

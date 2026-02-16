import { supabase } from '../lib/supabase';

export interface MonthlyWinning {
  label: string;
  value: number;
}

export interface WinningTicketDetail {
  game: string;
  date: string;
  prize: string;
  numbers: number[];
  bonus: number;
}

export interface PoolStat {
  name: string;
  totalWins: number;
  winCount: number;
  ticketCount: number;
  gameType: 'powerball' | 'mega_millions';
}

export interface InsightsData {
  totalWinnings: number;
  personalShare: number;
  totalContributed: number;
  monthlyWinnings: MonthlyWinning[];
  winningTickets: Record<string, WinningTicketDetail[]>;
  poolStats: PoolStat[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatGameType(gameType: string): string {
  return gameType === 'mega_millions' ? 'Mega Millions' : 'Powerball';
}

function getMonthKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string, spansYears: boolean): string {
  const [yearStr, monthStr] = key.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (spansYears) {
    return `${MONTH_LABELS[monthIndex]} '${yearStr.slice(2)}`;
  }
  return MONTH_LABELS[monthIndex];
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

export async function getUserInsights(
  userId: string
): Promise<{ data: InsightsData | null; error: string | null }> {
  try {
    // 1. Get user's pool IDs
    const { data: memberships, error: memberError } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('user_id', userId);

    if (memberError) {
      return { data: null, error: memberError.message };
    }

    if (!memberships || memberships.length === 0) {
      return {
        data: {
          totalWinnings: 0,
          personalShare: 0,
          totalContributed: 0,
          monthlyWinnings: [],
          winningTickets: {},
          poolStats: [],
        },
        error: null,
      };
    }

    const poolIds = memberships.map((m) => m.pool_id);

    // 2. Get all winnings for user's pools, with ticket details
    const { data: winnings, error: winError } = await supabase
      .from('winnings')
      .select('*, tickets(numbers, bonus_number, game_type)')
      .in('pool_id', poolIds)
      .order('draw_date', { ascending: false });

    if (winError) {
      return { data: null, error: winError.message };
    }

    // 3. Get pool details for names and game types
    const { data: pools, error: poolError } = await supabase
      .from('pools')
      .select('id, name, game_type')
      .in('id', poolIds);

    if (poolError) {
      return { data: null, error: poolError.message };
    }

    const poolMap = new Map(
      (pools || []).map((p) => [p.id, { name: p.name, gameType: p.game_type }])
    );

    // 4. Get user's total contributions
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select('amount')
      .eq('user_id', userId);

    if (contribError) {
      return { data: null, error: contribError.message };
    }

    const totalContributed = (contributions || []).reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    // 5. Get total ticket counts per pool (for win rate calculation)
    const { data: ticketRows, error: ticketError } = await supabase
      .from('tickets')
      .select('pool_id')
      .in('pool_id', poolIds);

    if (ticketError) {
      return { data: null, error: ticketError.message };
    }

    const ticketCounts = new Map<string, number>();
    for (const row of ticketRows || []) {
      ticketCounts.set(row.pool_id, (ticketCounts.get(row.pool_id) || 0) + 1);
    }

    // Compute aggregates
    const winningsData = winnings || [];

    const totalWinnings = winningsData.reduce(
      (sum, w) => sum + (w.prize_amount || 0),
      0
    );

    const personalShare = winningsData.reduce((sum, w) => {
      if (w.per_member_share != null) {
        return sum + w.per_member_share;
      }
      if (w.contributing_members && w.contributing_members > 0) {
        return sum + (w.prize_amount || 0) / w.contributing_members;
      }
      return sum + (w.prize_amount || 0);
    }, 0);

    // Monthly winnings — bucket by year-month key to avoid cross-year collisions
    const monthMap = new Map<string, number>();
    const ticketsByKey = new Map<string, WinningTicketDetail[]>();

    for (const w of winningsData) {
      const key = getMonthKey(w.draw_date);
      monthMap.set(key, (monthMap.get(key) || 0) + (w.prize_amount || 0));

      const ticket = w.tickets as any;
      if (ticket) {
        const existing = ticketsByKey.get(key) || [];
        existing.push({
          game: formatGameType(ticket.game_type),
          date: formatShortDate(w.draw_date),
          prize: formatCurrency(w.prize_amount ?? 0),
          numbers: ticket.numbers || [],
          bonus: ticket.bonus_number || 0,
        });
        ticketsByKey.set(key, existing);
      }
    }

    // Build recent 4 calendar month keys
    const now = new Date();
    const recentKeys: string[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      recentKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Include year in labels when the 4-month window crosses a year boundary
    const spansYears = new Set(recentKeys.map(k => k.split('-')[0])).size > 1;

    const recentMonths: MonthlyWinning[] = recentKeys.map(key => ({
      label: formatMonthLabel(key, spansYears),
      value: monthMap.get(key) || 0,
    }));

    // Per-pool stats
    const poolWinMap = new Map<
      string,
      { totalWins: number; winCount: number }
    >();
    for (const w of winningsData) {
      const existing = poolWinMap.get(w.pool_id) || {
        totalWins: 0,
        winCount: 0,
      };
      existing.totalWins += (w.prize_amount || 0);
      existing.winCount += 1;
      poolWinMap.set(w.pool_id, existing);
    }

    const poolStats: PoolStat[] = [];
    for (const [poolId, stats] of poolWinMap) {
      const pool = poolMap.get(poolId);
      if (pool) {
        poolStats.push({
          name: pool.name,
          totalWins: stats.totalWins,
          winCount: stats.winCount,
          ticketCount: ticketCounts.get(poolId) || 0,
          gameType: pool.gameType as 'powerball' | 'mega_millions',
        });
      }
    }

    // Sort pools by total wins descending
    poolStats.sort((a, b) => b.totalWins - a.totalWins);

    // Convert ticketsByKey map to display-labeled object
    const winningTickets: Record<string, WinningTicketDetail[]> = {};
    for (const key of recentKeys) {
      const tickets = ticketsByKey.get(key);
      if (tickets) {
        winningTickets[formatMonthLabel(key, spansYears)] = tickets;
      }
    }

    return {
      data: {
        totalWinnings,
        personalShare,
        totalContributed,
        monthlyWinnings: recentMonths,
        winningTickets,
        poolStats: poolStats.slice(0, 5),
      },
      error: null,
    };
  } catch (err) {
    console.error('Error fetching insights:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export async function updateSavingsGoal(
  userId: string,
  goal: number | null
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ savings_goal: goal })
      .eq('id', userId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

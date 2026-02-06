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

function getMonthLabel(dateString: string): string {
  const date = new Date(dateString);
  return MONTH_LABELS[date.getMonth()];
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
    const ticketCounts = new Map<string, number>();
    for (const poolId of poolIds) {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', poolId);
      ticketCounts.set(poolId, count || 0);
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
        return sum + w.prize_amount / w.contributing_members;
      }
      return sum + w.prize_amount;
    }, 0);

    // Monthly winnings (last 4 months with data, or recent 4 calendar months)
    const monthMap = new Map<string, number>();
    const ticketsByMonth = new Map<string, WinningTicketDetail[]>();

    for (const w of winningsData) {
      const label = getMonthLabel(w.draw_date);
      monthMap.set(label, (monthMap.get(label) || 0) + w.prize_amount);

      const ticket = w.tickets as any;
      if (ticket) {
        const existing = ticketsByMonth.get(label) || [];
        existing.push({
          game: formatGameType(ticket.game_type),
          date: formatShortDate(w.draw_date),
          prize: formatCurrency(w.prize_amount),
          numbers: ticket.numbers || [],
          bonus: ticket.bonus_number || 0,
        });
        ticketsByMonth.set(label, existing);
      }
    }

    // Build monthly winnings array — take last 4 months that have data
    // Sort by calendar order (most recent last for the chart)
    const now = new Date();
    const recentMonths: MonthlyWinning[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = MONTH_LABELS[d.getMonth()];
      recentMonths.push({ label, value: monthMap.get(label) || 0 });
    }

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
      existing.totalWins += w.prize_amount;
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

    // Convert ticketsByMonth map to plain object
    const winningTickets: Record<string, WinningTicketDetail[]> = {};
    for (const [month, tickets] of ticketsByMonth) {
      winningTickets[month] = tickets;
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

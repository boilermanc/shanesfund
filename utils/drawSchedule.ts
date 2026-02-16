type GameType = 'powerball' | 'mega_millions';

// Draw day schedules (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const DRAW_DAYS: Record<GameType, number[]> = {
  powerball: [1, 3, 6],      // Monday, Wednesday, Saturday
  mega_millions: [2, 5],     // Tuesday, Friday
};

// Cutoff times in Eastern Time (24h format)
const CUTOFF_HOURS: Record<GameType, { hour: number; minute: number }> = {
  powerball: { hour: 22, minute: 59 },     // 10:59 PM ET
  mega_millions: { hour: 23, minute: 0 },  // 11:00 PM ET
};

/**
 * Convert a Date to Eastern Time components.
 * Uses Intl to handle DST automatically.
 */
function toEasternTime(date: Date): { year: number; month: number; day: number; hour: number; minute: number; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: parseInt(get('year')),
    month: parseInt(get('month')),
    day: parseInt(get('day')),
    hour: parseInt(get('hour')),
    minute: parseInt(get('minute')),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0,
  };
}

/**
 * Get the next upcoming draw date/time for a game type.
 * Returns a Date in ET-based calendar date (as UTC midnight for that date).
 */
export function getNextDrawDate(gameType: GameType): Date {
  const now = new Date();
  const et = toEasternTime(now);
  const drawDays = DRAW_DAYS[gameType];
  const cutoff = CUTOFF_HOURS[gameType];

  // Check today and the next 7 days to find the next draw
  for (let offset = 0; offset <= 7; offset++) {
    const candidateDate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const candidateET = toEasternTime(candidateDate);

    if (!drawDays.includes(candidateET.dayOfWeek)) continue;

    // If it's today, check if we're past the cutoff
    if (offset === 0) {
      const pastCutoff =
        et.hour > cutoff.hour ||
        (et.hour === cutoff.hour && et.minute >= cutoff.minute);
      if (pastCutoff) continue;
    }

    // Return a Date representing this draw day
    return new Date(candidateET.year, candidateET.month - 1, candidateET.day);
  }

  // Fallback — shouldn't reach here with 7-day window
  return new Date();
}

/**
 * Check if a given draw date's cutoff has passed (ticket entry should be blocked).
 * @param drawDate — ISO date string (YYYY-MM-DD)
 */
export function isDrawClosed(gameType: GameType, drawDate: string): boolean {
  const now = new Date();
  const et = toEasternTime(now);
  const cutoff = CUTOFF_HOURS[gameType];

  const [year, month, day] = drawDate.split('-').map(Number);

  // Build an ET-equivalent Date for the draw cutoff
  // Compare by calendar date first
  const todayDate = new Date(et.year, et.month - 1, et.day);
  const drawDateObj = new Date(year, month - 1, day);

  if (drawDateObj < todayDate) {
    // Draw date is in the past
    return true;
  }

  if (drawDateObj.getTime() === todayDate.getTime()) {
    // Same day — check if we're past the cutoff
    return (
      et.hour > cutoff.hour ||
      (et.hour === cutoff.hour && et.minute >= cutoff.minute)
    );
  }

  // Draw date is in the future
  return false;
}

/**
 * Get the draw day names for a game type.
 */
export function getDrawDays(gameType: GameType): string[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return DRAW_DAYS[gameType].map(d => dayNames[d]);
}

/**
 * Get human-readable schedule info for a game type.
 */
export function getDrawSchedule(gameType: GameType): { days: string[]; cutoffTime: string } {
  const days = getDrawDays(gameType);
  const cutoff = CUTOFF_HOURS[gameType];

  const hour = cutoff.hour % 12 || 12;
  const ampm = cutoff.hour >= 12 ? 'PM' : 'AM';
  const cutoffTime = `${hour}:${cutoff.minute.toString().padStart(2, '0')} ${ampm} ET`;

  return { days, cutoffTime };
}

/**
 * Format a Date as a friendly string like "Wed, Feb 19".
 */
export function formatDrawDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

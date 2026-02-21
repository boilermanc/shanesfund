import { isDrawClosed, getNextDrawDate, formatDrawDate } from './drawSchedule';

type GameType = 'powerball' | 'mega_millions';

const GAME_LABELS: Record<GameType, string> = {
  powerball: 'Powerball',
  mega_millions: 'Mega Millions',
};

const GAME_RULES: Record<GameType, { mainMax: number; bonusMax: number; bonusName: string }> = {
  powerball: { mainMax: 69, bonusMax: 26, bonusName: 'Powerball' },
  mega_millions: { mainMax: 70, bonusMax: 25, bonusName: 'Mega Ball' },
};

/**
 * Validate that a ticket's game type matches the pool's game type.
 */
export function validateTicketForPool(
  poolGameType: GameType,
  ticketGameType: GameType
): { valid: boolean; error?: string } {
  if (poolGameType === ticketGameType) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `This is a ${GAME_LABELS[ticketGameType]} ticket. Your pool plays ${GAME_LABELS[poolGameType]}.`,
  };
}

/**
 * Validate ticket numbers against game rules.
 * Returns all errors found (not just the first).
 */
export function validateTicketNumbers(
  gameType: GameType,
  numbers: number[],
  bonusNumber: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = GAME_RULES[gameType];

  if (!rules) {
    return { valid: false, errors: [`Unknown game type: ${gameType}`] };
  }

  // Check main number count
  if (numbers.length !== 5) {
    errors.push(`Expected 5 main numbers, got ${numbers.length}.`);
  }

  // Check for duplicates
  if (new Set(numbers).size !== numbers.length) {
    const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    errors.push(`Duplicate numbers found: ${[...new Set(dupes)].join(', ')}.`);
  }

  // Check main number ranges
  for (const n of numbers) {
    if (!Number.isInteger(n) || n < 1 || n > rules.mainMax) {
      errors.push(`Main number ${n} is out of range (1-${rules.mainMax}).`);
    }
  }

  // Check bonus number
  if (!Number.isInteger(bonusNumber) || bonusNumber < 1 || bonusNumber > rules.bonusMax) {
    errors.push(`${rules.bonusName} ${bonusNumber} is out of range (1-${rules.bonusMax}).`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that the draw date hasn't already passed.
 */
export function validateDrawDate(
  gameType: GameType,
  drawDate: string
): { valid: boolean; error?: string; nextDraw?: string } {
  if (!isDrawClosed(gameType, drawDate)) {
    return { valid: true };
  }

  const nextDraw = getNextDrawDate(gameType);
  const nextDrawFormatted = formatDrawDate(nextDraw);
  return {
    valid: false,
    error: `This draw has closed. Next draw: ${nextDrawFormatted}`,
    nextDraw: nextDrawFormatted,
  };
}

/**
 * Detect game type from ticket numbers when OCR doesn't identify the game name.
 * Uses number ranges to make a best guess.
 */
export function detectGameType(
  numbers: number[],
  bonusNumber: number
): 'powerball' | 'mega_millions' | 'unknown' {
  // If bonus number is out of range for both games, unknown
  if (bonusNumber < 1 || bonusNumber > 70) return 'unknown';

  // If any main number is 70 → must be Mega Millions (Powerball max is 69)
  if (numbers.some(n => n === 70)) return 'mega_millions';

  // If bonus is 27-70 → not valid for Powerball (max 26), not valid for MM (max 25)
  if (bonusNumber > 26) return 'unknown';

  // If bonus is exactly 26 → could be Powerball (1-26), not Mega Millions (max 25)
  if (bonusNumber === 26) return 'powerball';

  // Bonus is 1-25, main numbers are 1-69 → valid for both games
  // Can't definitively determine — return unknown
  return 'unknown';
}

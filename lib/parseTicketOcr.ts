/**
 * Parser for lottery ticket OCR text.
 * Extracts plays (5 main numbers + bonus) from raw tesseract output.
 *
 * Typical ticket format:
 *   A  03 15 27 42 58   PB 14   PP x3
 *   B  07 19 33 44 61   PB 22
 */

export interface ParsedPlay {
  numbers: number[];
  bonusNumber: number;
  multiplier?: number;
  gameType: 'powerball' | 'mega_millions' | null;
  raw: string;
}

export interface ParseResult {
  plays: ParsedPlay[];
  rawText: string;
}

/** Parse full OCR text and return all detected plays */
export function parseTicketOcr(ocrText: string): ParseResult {
  const lines = ocrText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const plays: ParsedPlay[] = [];

  for (const line of lines) {
    const play = parseLine(line);
    if (play) plays.push(play);
  }

  return { plays, rawText: ocrText };
}

/** Try to parse a single line into a play. Returns null if not a valid play line. */
function parseLine(line: string): ParsedPlay | null {
  let normalized = line;

  // Detect game type from bonus label before normalization mangles letters
  let gameType: 'powerball' | 'mega_millions' | null = null;
  if (/PB\s/i.test(normalized) || /POWERBALL/i.test(normalized)) {
    gameType = 'powerball';
  } else if (/MB\s/i.test(normalized) || /MEGA/i.test(normalized)) {
    gameType = 'mega_millions';
  }

  // Extract bonus number before normalization: "PB 14" or "MB 08"
  let bonusNumber = 0;
  const bonusMatch = normalized.match(/(?:PB|MB)\s*(\d{1,2})/i);
  if (bonusMatch) {
    bonusNumber = parseInt(bonusMatch[1], 10);
    normalized = normalized.replace(bonusMatch[0], ' ');
  }

  // Extract multiplier: "PP x3" or "MP x2" or "3x"
  let multiplier: number | undefined;
  const multMatch = normalized.match(/(?:PP|MP)\s*[xX]?(\d)/i)
    || normalized.match(/(\d)\s*[xX]\s*$/);
  if (multMatch) {
    multiplier = parseInt(multMatch[1], 10);
    normalized = normalized.replace(multMatch[0], ' ');
  }

  // Now apply OCR error corrections on the remaining text (numbers area)
  normalized = normalized
    .replace(/[oO]/g, '0')
    .replace(/[lI|]/g, '1');

  // Remove row letter prefix (A, B, C, etc.)
  normalized = normalized.replace(/^[A-Za-z]\s+/, '');

  // Extract all 1-2 digit number groups
  const numberMatches = normalized.match(/\d{1,2}/g);
  if (!numberMatches) return null;

  const numbers = numberMatches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1 && n <= 70);

  // Need at least 5 main numbers
  if (numbers.length < 5) return null;

  const mainNumbers = numbers.slice(0, 5);

  // If bonus wasn't found via PB/MB label, try the 6th number
  if (bonusNumber === 0 && numbers.length >= 6) {
    bonusNumber = numbers[5];
  }

  if (bonusNumber === 0) return null;

  return {
    numbers: mainNumbers,
    bonusNumber,
    multiplier,
    gameType,
    raw: line,
  };
}

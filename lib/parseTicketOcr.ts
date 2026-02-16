/**
 * Parser for lottery ticket OCR text.
 * Extracts plays (5 main numbers + bonus) from raw tesseract output.
 *
 * Typical Powerball format:
 *   A  03 15 27 42 58   PB 14   PP x3
 *   B  07 19 33 44 61   PB 22
 *
 * Typical Mega Millions format (GA lottery — MB label is above the number):
 *   A  15 16 30 53 61 QP   MB
 *                           12 QP 2X
 *
 * Tesseract often splits the bonus onto a separate line, so we merge
 * adjacent lines when a single line doesn't produce a valid play.
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

/** Scan the full OCR text for game type headers (e.g. "MEGA MILLIONS", "POWERBALL") */
function detectDocumentGameType(text: string): 'powerball' | 'mega_millions' | null {
  const upper = text.toUpperCase();

  // Check specific multi-word names first
  if (/MEGA\s*MILLIONS/.test(upper) || /MEGAMILLIONS/.test(upper)) {
    return 'mega_millions';
  }
  if (/MEGA\s*BALL/.test(upper)) {
    return 'mega_millions';
  }
  if (/POWERBALL/.test(upper)) {
    return 'powerball';
  }

  // Abbreviated labels anywhere in the document
  if (/\bMB\b/.test(upper)) return 'mega_millions';
  if (/\bPB\b/.test(upper)) return 'powerball';

  return null;
}

/** Parse full OCR text and return all detected plays */
export function parseTicketOcr(ocrText: string): ParseResult {
  const documentGameType = detectDocumentGameType(ocrText);

  const lines = ocrText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const plays: ParsedPlay[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Try parsing the line on its own
    const play = parseLine(lines[i], documentGameType);
    if (play) {
      plays.push(play);
      continue;
    }

    // Ticket layouts often split the bonus number onto the next line
    // (e.g. "A 15 16 30 53 61 QP MB" / "12 QP 2X").
    // Try merging with the next 1–2 lines to reassemble the full play.
    let merged = false;
    for (let j = 1; j <= 2 && i + j < lines.length; j++) {
      const combined = lines.slice(i, i + j + 1).join(' ');
      const mergedPlay = parseLine(combined, documentGameType);
      if (mergedPlay) {
        plays.push(mergedPlay);
        i += j; // skip the lines we consumed
        merged = true;
        break;
      }
    }
    if (merged) continue;
  }

  return { plays, rawText: ocrText };
}

/** Try to parse a single line into a play. Returns null if not a valid play line. */
function parseLine(
  line: string,
  documentGameType: 'powerball' | 'mega_millions' | null = null
): ParsedPlay | null {
  let normalized = line;

  // Detect game type from bonus label before normalization mangles letters
  let gameType: 'powerball' | 'mega_millions' | null = null;
  if (/\bPB\b/i.test(normalized) || /POWERBALL/i.test(normalized)) {
    gameType = 'powerball';
  } else if (/\bMB\b/i.test(normalized) || /MEGA/i.test(normalized)) {
    gameType = 'mega_millions';
  }

  // Fall back to document-level game type detected from headers
  if (!gameType) gameType = documentGameType;

  // Extract bonus number: "PB 14", "MB 08", "MEGA BALL 14"
  let bonusNumber = 0;
  const bonusMatch = normalized.match(/(?:PB|MB|MEGA\s*BALL)\s*[:\s]*(\d{1,2})/i);
  if (bonusMatch) {
    bonusNumber = parseInt(bonusMatch[1], 10);
    normalized = normalized.replace(bonusMatch[0], ' ');
  }

  // Extract multiplier: "PP x3", "MP x2", "3x", "2X", "MEGAPLIER 3", "POWER PLAY 2"
  let multiplier: number | undefined;
  const multMatch = normalized.match(/(?:PP|MP|MEGAPLIER|POWER\s*PLAY)\s*[xX:\s]*(\d)/i)
    || normalized.match(/(\d)\s*[xX]\s*$/);
  if (multMatch) {
    multiplier = parseInt(multMatch[1], 10);
    normalized = normalized.replace(multMatch[0], ' ');
  }

  // Strip QP (Quick Pick) markers common on lottery tickets
  normalized = normalized.replace(/\bQP\b/gi, ' ');

  // Now apply OCR error corrections on the remaining text (numbers area)
  normalized = normalized
    .replace(/[oO]/g, '0')
    .replace(/[lI|]/g, '1');

  // Remove row letter prefix: "A ", "A) ", "A. "
  normalized = normalized.replace(/^[A-Za-z][).\s]\s*/, '');

  // Skip lines with 4+ consecutive digits — likely barcodes, serial numbers, dates
  if (/\d{4,}/.test(normalized)) return null;

  // Extract all 1-2 digit number groups
  const numberMatches = normalized.match(/\d{1,2}/g);
  if (!numberMatches) return null;

  const numbers = numberMatches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1 && n <= 70);

  // Need at least 5 main numbers; reject lines with too many (noise)
  if (numbers.length < 5 || numbers.length > 8) return null;

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

import { TeamPurse, TeamSlot } from '../types';
import { MOCK_MEN_TEAMS, MOCK_WOMEN_TEAMS } from '../data/mockData';
import { getAppConfig } from './config';

export interface SheetFetchResult {
  teams: TeamPurse[];
  source: 'google-sheets' | 'mock-data';
  lastUpdated: string;
  error?: string;
}

const CACHE_KEY_PREFIX = 'PURSE_CACHE_V3_';

export function getCachedPurse(tournament: 'men' | 'women'): TeamPurse[] {
  try {
    const saved = localStorage.getItem(`${CACHE_KEY_PREFIX}${tournament}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return tournament === 'men' ? MOCK_MEN_TEAMS : MOCK_WOMEN_TEAMS;
}

export function setCachedPurse(tournament: 'men' | 'women', teams: TeamPurse[]): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${tournament}`, JSON.stringify(teams));
  } catch {
    // ignore
  }
}

// Known GIDs for this specific published Google Sheet
const PUBLISHED_GIDS = {
  men: '477299999',
  women: '828496356',
};

// Known team colors map
const TEAM_COLORS: Record<string, string> = {
  'RGC KINGS': '#6366f1',
  'RGC CHARGERS': '#0284c7',
  'RGC KNIGHT RIDERS': '#7e22ce',
  'RGC SUNRISERS': '#ea580c',
  'RGC INDIANS': '#2563eb',
  'RGC SUPER KINGS': '#eab308',
  'RGC SUPERGIANTS': '#0d9488',
  'RGC CAPITALS': '#06b6d4',
  'RGC CHALLENGERS': '#dc2626',
  'RGC TITANS': '#1e3a8a',
  'RGC ROYALS': '#ec4899',
  'RGC WARRIORZ': '#a855f7',
  'RGC GIANTS': '#f97316',
};

// Simple CSV line parser handling quotes
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((c) => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function fetchPurseData(tournament: 'men' | 'women'): Promise<SheetFetchResult> {
  const config = getAppConfig();
  const cached = getCachedPurse(tournament);
  const rawInput = (config.googleSheetId || '1q4KIQ4McbSTIHsKTEW3gaDG__tVBiG0lIXJOc5qGaEY').trim();

  // Extract ID if a full Google Sheets URL is provided
  let sheetId = rawInput;
  const match = rawInput.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    sheetId = match[1];
  }

  const timestamp = Date.now();
  const gid = PUBLISHED_GIDS[tournament];
  let fetchUrl = '';

  if (sheetId.startsWith('2PACX-') || sheetId.includes('/pub')) {
    const base = rawInput.split('/pub')[0];
    fetchUrl = `${base}/pub?gid=${gid}&single=true&output=csv&_t=${timestamp}`;
  } else {
    // Direct Google Spreadsheet export (Instant live updates with ZERO CDN delay!)
    fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_t=${timestamp}`;
  }

  try {
    const response = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: Failed to fetch sheet data`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 3) {
      throw new Error('Sheet data too short or empty');
    }

    const parsedTeams = parseTeamsFromCSV(rows);

    if (parsedTeams.length > 0) {
      setCachedPurse(tournament, parsedTeams);
    }

    return {
      teams: parsedTeams.length > 0 ? parsedTeams : cached,
      source: 'google-sheets',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    console.warn(`Failed to fetch Google Sheet for ${tournament}:`, err);
    return {
      teams: cached,
      source: 'mock-data',
      lastUpdated: new Date().toLocaleTimeString(),
      error: err instanceof Error ? err.message : 'Unknown sheet fetch error',
    };
  }
}

// Dynamically extracts all RGC teams and their slots from the sheet grid
function parseTeamsFromCSV(rows: string[][]): TeamPurse[] {
  const teams: TeamPurse[] = [];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cell = rows[r][c]?.trim();
      if (!cell || !cell.toUpperCase().startsWith('RGC ')) continue;

      const rawTeamName = cell.replace(/[\s\-]+$/, '');
      const teamId = rawTeamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Avoid duplicates
      if (teams.some((t) => t.id === teamId)) continue;

      const slots: TeamSlot[] = [];
      let totalSpent = 0;
      let remainingPurse = 100000;

      // Scan downwards under column c
      for (let rowIdx = r + 1; rowIdx < rows.length; rowIdx++) {
        if (c >= rows[rowIdx].length) continue;

        // Stop if we hit another team in the same column
        if (rowIdx > r + 1 && rows[rowIdx][c]?.trim().toUpperCase().startsWith('RGC ')) {
          break;
        }

        const catCell = rows[rowIdx][c]?.trim() || '';
        const bidCell = rows[rowIdx][c + 1]?.trim() || '';
        const playerCell = rows[rowIdx][c + 2]?.trim() || '';

        // Check for TOTAL and REMAINING cells across adjacent columns
        const rowSlice = rows[rowIdx].slice(c, c + 5);
        for (let i = 0; i < rowSlice.length; i++) {
          const val = rowSlice[i]?.trim().toUpperCase();
          if (val === 'TOTAL') {
            for (let j = i + 1; j < rowSlice.length; j++) {
              const num = parseNumber(rowSlice[j]);
              if (num > 0) {
                totalSpent = num;
                break;
              }
            }
          }
          if (val === 'REMAINING' || val === 'REMAINING PURSE') {
            for (let j = i + 1; j < rowSlice.length; j++) {
              const num = parseNumber(rowSlice[j]);
              if (num > 0) {
                remainingPurse = num;
                break;
              }
            }
          }
        }

        // Check if category row
        const upperCat = catCell.toUpperCase();
        if (['A', 'B', 'BOWLER', 'BOWLERS', 'C', 'D', 'E', 'F', 'CHIT'].includes(upperCat)) {
          const bidAmount = parseNumber(bidCell);
          slots.push({
            category: catCell,
            playerName: playerCell,
            bidAmount,
          });
        }

        // Stop scanning after CHIT
        if (upperCat === 'CHIT') {
          break;
        }
      }

      // If spent wasn't explicitly populated from TOTAL row, sum the slot bids
      if (totalSpent === 0 && slots.length > 0) {
        totalSpent = slots.reduce((sum, s) => sum + s.bidAmount, 0);
        remainingPurse = Math.max(0, 100000 - totalSpent);
      }

      // Match base name for color lookup (e.g. "RGC KINGS - foo" matches "RGC KINGS")
      const baseKey = Object.keys(TEAM_COLORS).find((k) =>
        rawTeamName.toUpperCase().includes(k)
      );
      const teamColor = (baseKey && TEAM_COLORS[baseKey]) || '#f59e0b';

      teams.push({
        id: teamId,
        name: rawTeamName,
        color: teamColor,
        totalPurse: 100000,
        spent: totalSpent,
        remaining: remainingPurse,
        slots,
      });
    }
  }

  return teams;
}

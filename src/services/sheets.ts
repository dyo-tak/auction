import { TeamPurse, TeamSlot } from '../types';
import { MOCK_MEN_TEAMS, MOCK_WOMEN_TEAMS } from '../data/mockData';
import { getAppConfig } from './config';

export interface SheetFetchResult {
  teams: TeamPurse[];
  source: 'google-sheets' | 'mock-data';
  lastUpdated: string;
  error?: string;
}

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
  const sheetName = tournament === 'men' ? 'Purse Men' : 'Purse Women';
  const defaultTeams = tournament === 'men' ? MOCK_MEN_TEAMS : MOCK_WOMEN_TEAMS;

  if (!config.googleSheetId) {
    return {
      teams: defaultTeams,
      source: 'mock-data',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      sheetName
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: Failed to fetch sheet tab '${sheetName}'`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 3) {
      throw new Error('Sheet data too short or empty');
    }

    const teams = parseTeamGridFromSheet(rows, defaultTeams);

    return {
      teams: teams.length > 0 ? teams : defaultTeams,
      source: 'google-sheets',
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    console.warn(`Failed to fetch Google Sheet for ${sheetName}:`, err);
    return {
      teams: defaultTeams,
      source: 'mock-data',
      lastUpdated: new Date().toLocaleTimeString(),
      error: err instanceof Error ? err.message : 'Unknown sheet fetch error',
    };
  }
}

// Parses grid of teams (e.g. 3 teams across in columns A-C, D-F, G-I, repeated vertically)
function parseTeamGridFromSheet(rows: string[][], fallbackTeams: TeamPurse[]): TeamPurse[] {
  const teams: TeamPurse[] = [];

  // Find all team header positions (cells containing "RGC" or team names)
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cell = rows[r][c]?.trim();
      if (!cell) continue;

      const matchedTeam = fallbackTeams.find((ft) =>
        cell.toLowerCase().includes(ft.name.toLowerCase().replace('rgc ', ''))
      );

      if (matchedTeam && !teams.some((t) => t.id === matchedTeam.id)) {
        // Found a team block at (r, c)
        // Header row has team name
        // r+1 is usually CAT, BID AMOUNT, PLAYER NAME
        // r+2 to r+12 are slots
        const slots: TeamSlot[] = [];
        let totalSpent = 0;

        // Scan subsequent rows under this column
        for (let rowIdx = r + 1; rowIdx < Math.min(r + 18, rows.length); rowIdx++) {
          const colCat = rows[rowIdx][c]?.trim();
          const colBid = parseNumber(rows[rowIdx][c + 1]);
          const colPlayer = rows[rowIdx][c + 2]?.trim();

          if (!colCat) continue;

          if (colCat.toUpperCase().includes('TOTAL')) {
            if (colBid > 0) totalSpent = colBid;
          } else if (['A', 'B', 'BOWLER', 'BOWLERS', 'C', 'D', 'E', 'F', 'CHIT'].includes(colCat.toUpperCase())) {
            slots.push({
              category: colCat,
              playerName: colPlayer || '',
              bidAmount: colBid,
            });
            totalSpent += colBid;
          }
        }

        if (slots.length > 0) {
          teams.push({
            ...matchedTeam,
            slots,
            spent: totalSpent,
            remaining: Math.max(0, matchedTeam.totalPurse - totalSpent),
          });
        }
      }
    }
  }

  return teams.length > 0 ? teams : fallbackTeams;
}

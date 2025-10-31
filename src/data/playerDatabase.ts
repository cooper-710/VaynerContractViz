// ============================================================================
// PLAYER DATABASE
// ============================================================================
// Central database of players available for valuation and comparison

export interface PlayerStats {
  wRCplus: number;
  xwOBA: number;
  xSLG: number;
  HRperPA: number;
  RBI: number;
  BarrelPerPA: number;
  HardHitPct: number;
  EV50: number;
  maxEV: number;
  BBpct: number;
  Kpct: number;
  ContactPct: number;
  WAR: number;
  PA: number;
  age: number;
  fg_Def: number;
  fg_BsR: number;
}

export type StatPeriod = '2025' | '3yr-avg' | '3yr-contract' | 'career';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  team: string;
  
  // Stats for different time periods
  stats2025: PlayerStats;
  threeYearStats: PlayerStats; // 3-year rolling average
  threeYearContractStats?: PlayerStats; // 3-year avg at time of contract signing (for comps)
  careerStats: PlayerStats;
  
  // Contract info (for comps who have already signed)
  hasContract?: boolean;
  AAV?: number;
  years?: number;
  signedYear?: number;

  // Availability flags
  has2025Season?: boolean;
}

// Helper to get stats for a specific period
export function getStatsForPeriod(player: Player, period: StatPeriod): PlayerStats {
  switch (period) {
    case '2025':
      return player.stats2025;
    case '3yr-avg':
      return player.threeYearStats;
    case '3yr-contract':
      return player.threeYearContractStats || player.threeYearStats;
    case 'career':
      return player.careerStats;
  }
}

// Stat labels for UI
export const STAT_LABELS: Record<keyof Omit<PlayerStats, 'age'>, string> = {
  wRCplus: 'wRC+',
  xwOBA: 'xwOBA',
  xSLG: 'xSLG',
  HRperPA: 'HR',
  RBI: 'RBI',
  BarrelPerPA: 'Barrel%',
  HardHitPct: 'Hard Hit%',
  EV50: 'EV50',
  maxEV: 'maxEV',
  BBpct: 'BB%',
  Kpct: 'K%',
  ContactPct: 'Contact%',
  WAR: 'WAR',
  PA: 'PA',
};

// Helper to generate stat variations for different periods
// This creates realistic variations from a base stat set
function generateStatPeriods(
  baseStats: PlayerStats,
  age: number,
  signedYear?: number
): {
  stats2025: PlayerStats;
  threeYearStats: PlayerStats;
  threeYearContractStats?: PlayerStats;
  careerStats: PlayerStats;
} {
  // 2025 stats (slight random variation from 3yr avg)
  const stats2025: PlayerStats = {
    ...baseStats,
    wRCplus: Math.round(baseStats.wRCplus * (0.95 + Math.random() * 0.1)),
    xwOBA: baseStats.xwOBA * (0.97 + Math.random() * 0.06),
    xSLG: baseStats.xSLG * (0.97 + Math.random() * 0.06),
    HRperPA: baseStats.HRperPA * (0.9 + Math.random() * 0.2),
    RBI: baseStats.RBI,
    WAR: baseStats.WAR * (0.85 + Math.random() * 0.3),
    age,
  };

  // Career stats (generally slightly better for prime years)
  const careerStats: PlayerStats = {
    ...baseStats,
    wRCplus: Math.round(baseStats.wRCplus * 1.05),
    xwOBA: baseStats.xwOBA * 1.02,
    xSLG: baseStats.xSLG * 1.02,
    RBI: baseStats.RBI,
    WAR: baseStats.WAR * 1.1,
    age,
  };

  // 3-year contract stats (at time of signing, often peak performance)
  let threeYearContractStats: PlayerStats | undefined;
  if (signedYear) {
    threeYearContractStats = {
      ...baseStats,
      wRCplus: Math.round(baseStats.wRCplus * 1.08),
      xwOBA: baseStats.xwOBA * 1.03,
      xSLG: baseStats.xSLG * 1.03,
      RBI: baseStats.RBI,
      WAR: baseStats.WAR * 1.15,
      age: age - (2025 - signedYear), // Age at signing
    };
  }

  return {
    stats2025,
    threeYearStats: baseStats,
    threeYearContractStats,
    careerStats,
  };
}

// All available players (can be valued or used as comps if they have contracts)
import { fetchCsv, getField, getString } from './csvLoader';

const CSV_URL = '/Full_Data.csv';

let cachedPlayers: Player[] | null = null;

export async function loadPlayersFromCsv(): Promise<Player[]> {
  if (cachedPlayers) return cachedPlayers;
  const rows = await fetchCsv(CSV_URL);

  // Group all seasons per player
  const byId: Map<string, any[]> = new Map();
  const names: Map<string, string> = new Map();

  for (const row of rows) {
    const name = getString(row, ['player_display', 'sc_Name', 'fg_player']);
    if (!name) continue;
    const normId = getString(row, ['player_norm']).replace(/\s+/g, '-');
    if (!byId.has(normId)) byId.set(normId, []);
    byId.get(normId)!.push(row);
    names.set(normId, name);
  }

  const toSeasonObj = (r: any) => {
    const season = getField(r, ['season'], 0);
    const pa = getField(r, ['fg_PA']);
    const hr = getField(r, ['fg_HR']);
    const hrPerPa = pa > 0 ? (hr / pa) * 100 : 0;
    return {
      season: Number(season),
      wRCplus: getField(r, ['fg_wRC+']),
      xwOBA: getField(r, ['fg_xwOBA', 'sc_X_woba', 'sc_X_est_woba'], 0),
      xSLG: getField(r, ['fg_xSLG', 'sc_X_slg', 'sc_X_est_slg'], 0),
      HRperPA: Number(hrPerPa.toFixed(2)),
      HR: hr,
      RBI: getField(r, ['fg_RBI'], 0),
      BarrelPerPA: getField(r, ['sc_EV_brl_percent'], 0),
      HardHitPct: getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0),
      EV50: getField(r, ['sc_EV_ev50', 'sc_EV_avg_hit_speed', 'fg_EV50', 'fg_EV'], 0),
      maxEV: getField(r, ['fg_maxEV', 'sc_maxEV', 'MaxEV', 'max_exit_velo', 'sc_EV_max'], 0),
      BBpct: getField(r, ['fg_BB%'], 0),
      Kpct: getField(r, ['fg_K%'], 0),
      ContactPct: getField(r, ['fg_Contact%'], 0),
      WAR: getField(r, ['fg_WAR', 'fg_L-WAR'], 0),
      PA: pa,
      age: getField(r, ['fg_Age'], 0),
      fg_Def: getField(r, ['fg_Def', 'Def'], 0),
      fg_BsR: getField(r, ['fg_BsR', 'BsR'], 0),
      position: getString(r, ['sp_position', 'fg_Pos', 'fg_Pos '], 'OF'),
      team: getString(r, ['fg_Team', 'fg_Team\n', 'fg_Team ', 'fg_Team,']),
      signedYear: getField(r, ['sp_Start']),
      aavRaw: getField(r, ['sp_aav', 'sp_AAV', 'AAV']),
      yrs: getField(r, ['sp_Yrs', 'sp_YRS', 'sp_Years']),
    };
  };

  const aggregate = (seasons: any[]): PlayerStats => {
    if (seasons.length === 0) {
      return { wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, BarrelPerPA: 0, HardHitPct: 0, EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, WAR: 0, PA: 0, age: 0, fg_Def: 0, fg_BsR: 0 };
    }
    const mean = (k: string, d = 6) => Number((seasons.reduce((s, r) => s + Number(r[k] || 0), 0) / seasons.length).toFixed(d));
    const sum = (k: string) => seasons.reduce((s, r) => s + Number(r[k] || 0), 0);
    const totalPA = sum('PA');
    const avgHR = mean('HR', 1);
    return {
      wRCplus: mean('wRCplus', 2),
      xwOBA: mean('xwOBA', 6),
      xSLG: mean('xSLG', 6),
      HRperPA: avgHR,
      RBI: mean('RBI', 1),
      BarrelPerPA: mean('BarrelPerPA', 4),
      HardHitPct: mean('HardHitPct', 4),
      EV50: mean('EV50', 4),
      maxEV: mean('maxEV', 1),
      BBpct: mean('BBpct', 4),
      Kpct: mean('Kpct', 4),
      ContactPct: mean('ContactPct', 4),
      WAR: mean('WAR', 3),
      PA: Number(mean('PA', 0).toFixed(0)),
      age: mean('age', 2),
      fg_Def: mean('fg_Def', 2),
      fg_BsR: mean('fg_BsR', 2),
    };
  };

  const players: Player[] = [];
  for (const [id, arr] of byId.entries()) {
    const seasons = arr.map(toSeasonObj).filter(s => s.season > 0).sort((a, b) => a.season - b.season);
    if (seasons.length === 0) continue;
    const name = names.get(id) || id;

    const s2025 = seasons.filter(s => s.season === 2025);
    const s3yr = seasons.filter(s => [2025, 2024, 2023].includes(s.season));
    const career = seasons;

    // 3yr pre-contract based on signedYear (if present in any row)
    const anySigned = seasons.find(s => s.signedYear);
    const signedYear = anySigned?.signedYear ? Number(anySigned.signedYear) : undefined;
    const preYears = signedYear ? [signedYear - 1, signedYear - 2, signedYear - 3] : [];
    const s3pre = signedYear ? seasons.filter(s => preYears.includes(s.season)) : [];

    const team = (s2025[0]?.team || seasons[seasons.length - 1].team) || '—';
    const position = (s2025[0]?.position || seasons[seasons.length - 1].position) || 'OF';

    const contractRow = seasons.find(s => s.aavRaw && s.yrs);
    const rawAav = contractRow?.aavRaw || 0;
    const years = contractRow?.yrs || 0;
    const aavMillions = rawAav > 1000 ? Math.round((rawAav / 1_000_000) * 10) / 10 : rawAav;

    players.push({
      id,
      name,
      jerseyNumber: 0,
      position,
      team,
      hasContract: !!aavMillions && !!years,
      AAV: aavMillions || undefined,
      years: years || undefined,
      signedYear: signedYear || undefined,
      stats2025: aggregate(s2025),
      threeYearStats: aggregate(s3yr.length ? s3yr : seasons.slice(-3)),
      threeYearContractStats: s3pre.length ? aggregate(s3pre) : undefined,
      careerStats: aggregate(career),
      has2025Season: s2025.length > 0,
    });
  }

  cachedPlayers = players.sort((a, b) => a.name.localeCompare(b.name));
  return cachedPlayers;
}

// Provide an empty list immediately for synchronous imports; real data is async via loadPlayersFromCsv
export const ALL_PLAYERS: Player[] = [];

// Helper function to get player by ID or name
export function getPlayerById(playerId: string): Player | undefined {
  return ALL_PLAYERS.find(p => p.id === playerId);
}

export function getPlayerByName(playerName: string): Player | undefined {
  return ALL_PLAYERS.find(p => p.name.toLowerCase() === playerName.toLowerCase());
}

// Helper function to search players
export function searchPlayers(query: string): Player[] {
  const lowerQuery = query.toLowerCase();
  return ALL_PLAYERS.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.team.toLowerCase().includes(lowerQuery) ||
    p.position.toLowerCase().includes(lowerQuery)
  );
}

// Get players with contracts (for use as comparisons)
export function getPlayersWithContracts(): Player[] {
  return ALL_PLAYERS.filter(p => p.hasContract === true);
}

// Helper function to get suggested comps for a player (same position preferred)
export function getSuggestedComps(player: Player, limit: number = 4): Player[] {
  const withContracts = getPlayersWithContracts();
  
  // First, get same position players
  const samePosition = withContracts.filter(comp => 
    comp.position === player.position && comp.id !== player.id
  );
  
  // If we have enough same position players, return them
  if (samePosition.length >= limit) {
    return samePosition.slice(0, limit);
  }
  
  // Otherwise, fill with other players
  const others = withContracts.filter(comp => 
    comp.position !== player.position && comp.id !== player.id
  );
  
  return [...samePosition, ...others].slice(0, limit);
}

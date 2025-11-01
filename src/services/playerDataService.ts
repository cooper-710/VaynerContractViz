// ============================================================================
// PLAYER DATA SERVICE
// ============================================================================
// This service provides player statistics and comparison data.
// 
// BACKEND INTEGRATION GUIDE:
// When connecting to a real backend, replace the mock data returns with actual
// API calls. The function signatures and return types should remain the same.
//
// Expected API Endpoints:
// - GET /api/players/:playerId - Returns PlayerProfile
// - GET /api/players/:playerId/comparisons - Returns ComparisonsResponse
// ============================================================================

import type {
  PlayerProfile,
  ComparisonPlayer,
  YearlyStats,
  PlayerStatsResponse,
  ComparisonsResponse,
} from '../types';
import { loadPlayersFromCsv, type PlayerStats } from '../data/playerDatabase';
import { fetchMultipleCsvs, mergeCsvRowsByName, getField, getString, normalizePlayerName } from '../data/csvLoader';
import type { StatPeriod, Player } from '../data/playerDatabase';

// ============================================================================
// PLAYER STATISTICS
// ============================================================================

/**
 * Fetches comprehensive statistics for a specific player
 * 
 * @param playerId - Unique identifier for the player (e.g., "pete-alonso")
 * @returns Promise<PlayerProfile> - Complete player statistical profile
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with: 
 * const response = await fetch(`/api/players/${playerId}`);
 * return response.json();
 */
export async function getPlayerStats(playerId: string): Promise<PlayerProfile> {
  // Load rows from all three CSVs and merge them
  const [fangraphsRows, spotracRows, statscastRows] = await fetchMultipleCsvs([
    '/fangraphs.csv',
    '/spotrac.csv',
    '/statscast.csv',
  ]);
  const rows = mergeCsvRowsByName(fangraphsRows, spotracRows, statscastRows);
  
  const players = await loadPlayersFromCsv();
  const matchInList = players.find(p => p.id === playerId || p.name.toLowerCase() === playerId.toLowerCase());
  if (!matchInList) throw new Error('Player not found');

  const normId = matchInList.id;
  const displayName = matchInList.name;

  const playerRows = rows.filter(r => {
    const name = getString(r, ['Name']);
    const normalized = normalizePlayerName(name);
    return normalized === normId || normalizePlayerName(displayName) === normalized;
  });

  // Map seasons
  const yearly = playerRows
    .map((r) => {
      const year = String(getField(r, ['Season', 'year'], 0));
      const war = getField(r, ['fg_WAR', 'fg_L-WAR'], 0);
      const wrcPlus = getField(r, ['fg_wRC+'], 0);
      const hr = getField(r, ['fg_HR'], 0);
      const xwoba = getField(r, ['fg_xwOBA'], 0);
      const xslg = getField(r, ['fg_xSLG'], 0);
      const avg = getField(r, ['fg_AVG'], 0);
      const rbi = getField(r, ['fg_RBI'], 0);
      const obp = getField(r, ['fg_OBP'], 0);
      const slg = getField(r, ['fg_SLG'], 0);
      const ops = obp && slg ? obp + slg : 0;
      const exitVelo = getField(r, ['fg_EV', 'exit_velocity_avg'], 0);
      const maxEV = getField(r, ['fg_maxEV'], 0);
      const hardHitPct = getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0);
      const barrelPct = getField(r, ['fg_Barrel%', 'barrel_batted_rate'], 0);
      const wpa = getField(r, ['fg_WPA'], 0);
      const launchAngle = getField(r, ['fg_LA'], 0);
      return { year, war, wrcPlus, hr, xwoba, xslg, avg, rbi, ops, exitVelo, maxEV, hardHitPct, barrelPct, wpa, launchAngle };
    })
    .filter(s => s.year !== '0')
    .sort((a, b) => Number(a.year) - Number(b.year));

  const latest = yearly[yearly.length - 1];
  const position = matchInList.position;

  return {
    playerId: normId,
    name: displayName,
    position,
    age: matchInList.stats2025.age || 0,
    traditional: {
      avg: latest?.avg || 0,
      hr: latest?.hr || 0,
      rbi: latest?.rbi || 0,
      ops: latest?.ops || 0,
    },
    advanced: {
      xwoba: latest?.xwoba || 0,
      xslg: latest?.xslg || 0,
      wrcPlus: latest?.wrcPlus || 0,
      war: latest?.war || 0,
      wpa: latest?.wpa || 0,
    },
    battedBall: {
      exitVelo: latest?.exitVelo || 0,
      maxEV: latest?.maxEV || 0,
      hardHitPct: latest?.hardHitPct || 0,
      barrelPct: latest?.barrelPct || 0,
      launchAngle: latest?.launchAngle || 0,
    },
    careerStats: yearly,
    battedBallTrend: yearly.map(y => ({
      year: y.year,
      war: 0,
      wrcPlus: 0,
      hr: 0,
      xwoba: 0,
      exitVelo: y.exitVelo,
      hardHitPct: y.hardHitPct,
      barrelPct: y.barrelPct,
    })),
  };
}

// ============================================================================
// PLAYER COMPARISONS
// ============================================================================

/**
 * Fetches market comparison players with comprehensive statistics
 * 
 * @param playerId - Target player to compare against
 * @returns Promise<ComparisonPlayer[]> - Array of comparable players with contract data
 * 
 * BACKEND INTEGRATION:
 * Replace mock return with:
 * const response = await fetch(`/api/players/${playerId}/comparisons`);
 * return response.json();
 */
export async function getPlayerComparisons(playerId: string): Promise<ComparisonPlayer[]> {
  const players = await loadPlayersFromCsv();
  const base = players.find(p => p.id === playerId) || players[0];
  if (!base) return [];
  const samePos = players.filter(p => p.position === base.position && p.id !== base.id).slice(0, 5);
  return samePos.map(p => ({
    player: p.name,
    age: p.stats2025.age,
    position: p.position,
    team: p.team,
    careerWar: p.careerStats.WAR,
    careerWrcPlus: p.careerStats.wRCplus,
    careerXwoba: p.careerStats.xwOBA,
    careerHr: Math.round((p.careerStats.HRperPA / 100) * p.careerStats.PA),
    careerXslg: p.careerStats.xSLG,
    careerHardHitPct: p.careerStats.HardHitPct,
    careerBarrelPct: p.careerStats.BarrelPerPA,
    war2025: p.stats2025.WAR,
    wrcPlus2025: p.stats2025.wRCplus,
    xwoba2025: p.stats2025.xwOBA,
    hr2025: Math.round((p.stats2025.HRperPA / 100) * p.stats2025.PA),
    xslg2025: p.stats2025.xSLG,
    hardHitPct2025: p.stats2025.HardHitPct,
    barrelPct2025: p.stats2025.BarrelPerPA,
    war3yr: p.threeYearStats.WAR,
    wrcPlus3yr: p.threeYearStats.wRCplus,
    xwoba3yr: p.threeYearStats.xwOBA,
    hr3yr: Math.round((p.threeYearStats.HRperPA / 100) * p.threeYearStats.PA),
    xslg3yr: p.threeYearStats.xSLG,
    hardHitPct3yr: p.threeYearStats.HardHitPct,
    barrelPct3yr: p.threeYearStats.BarrelPerPA,
    warPreSign: p.threeYearContractStats?.WAR || p.threeYearStats.WAR,
    wrcPlusPreSign: p.threeYearContractStats?.wRCplus || p.threeYearStats.wRCplus,
    xwobaPreSign: p.threeYearContractStats?.xwOBA || p.threeYearStats.xwOBA,
    hrPreSign: Math.round((((p.threeYearContractStats?.HRperPA || p.threeYearStats.HRperPA) / 100) * (p.threeYearContractStats?.PA || p.threeYearStats.PA))),
    xslgPreSign: p.threeYearContractStats?.xSLG || p.threeYearStats.xSLG,
    hardHitPctPreSign: p.threeYearContractStats?.HardHitPct || p.threeYearStats.HardHitPct,
    barrelPctPreSign: p.threeYearContractStats?.BarrelPerPA || p.threeYearStats.BarrelPerPA,
    aav: p.AAV || 0,
    years: p.years || 0,
    totalValue: (p.AAV || 0) * (p.years || 0),
    signingYear: p.signedYear || 2025,
  }));
}

// ============================================================================
// PERIOD STATS FROM CSV (for comparisons)
// ============================================================================

function aggregateToPlayerStats(rows: any[]): PlayerStats {
  if (rows.length === 0) {
    return {
      wRCplus: 0, xwOBA: 0, xSLG: 0, HRperPA: 0, BarrelPerPA: 0, HardHitPct: 0,
      EV50: 0, maxEV: 0, BBpct: 0, Kpct: 0, ContactPct: 0, WAR: 0, PA: 0, age: 0,
      fg_Def: 0, fg_BsR: 0,
    };
  }

  const avg = (k: string, decimals = 6) => {
    const vals = rows.map(r => Number(r[k] || 0));
    const mean = vals.reduce((a, b) => a + b, 0) / rows.length;
    return Number(mean.toFixed(decimals));
  };

  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);

  const totalPA = sum('PA');
  const totalHR = sum('HR');
  const hrPerPa = totalPA > 0 ? (totalHR / totalPA) * 100 : 0;

  return {
    wRCplus: avg('wRCplus', 2),
    xwOBA: avg('xwOBA', 6),
    xSLG: avg('xSLG', 6),
    HRperPA: Number(hrPerPa.toFixed(2)),
    BarrelPerPA: avg('barrelPct', 4),
    HardHitPct: avg('hardHitPct', 4),
    EV50: avg('exitVelo', 4),
    maxEV: avg('maxEV', 1),
    BBpct: avg('bbPct', 4),
    Kpct: avg('kPct', 4),
    ContactPct: avg('contactPct', 4),
    WAR: avg('war', 3),
    PA: Number(avg('PA', 0).toFixed(0)),
    age: avg('age', 2),
    fg_Def: avg('fg_Def', 2),
    fg_BsR: avg('fg_BsR', 2),
  };
}

async function getPlayerSeasonRowsFromCsv(player: Player): Promise<Array<any>> {
  // Load rows from all three CSVs and merge them
  const [fangraphsRows, spotracRows, statscastRows] = await fetchMultipleCsvs([
    '/fangraphs.csv',
    '/spotrac.csv',
    '/statscast.csv',
  ]);
  const rows = mergeCsvRowsByName(fangraphsRows, spotracRows, statscastRows);
  const normId = player.id;
  return rows
    .filter(r => {
      const name = getString(r, ['Name']);
      const normalized = normalizePlayerName(name);
      return normalized === normId;
    })
    .map((r) => ({
      season: Number(getField(r, ['Season', 'year'], 0)),
      war: getField(r, ['fg_WAR', 'fg_L-WAR'], 0),
      wRCplus: getField(r, ['fg_wRC+'], 0),
      xwOBA: getField(r, ['fg_xwOBA'], 0),
      xSLG: getField(r, ['fg_xSLG'], 0),
      HR: getField(r, ['fg_HR'], 0),
      PA: getField(r, ['fg_PA', 'pa'], 0),
      barrelPct: getField(r, ['fg_Barrel%', 'barrel_batted_rate'], 0),
      hardHitPct: getField(r, ['fg_HardHit%', 'fg_HardHit%+'], 0),
      exitVelo: getField(r, ['fg_EV', 'exit_velocity_avg'], 0),
      maxEV: getField(r, ['fg_maxEV'], 0),
      bbPct: getField(r, ['fg_BB%', 'bb_percent'], 0),
      kPct: getField(r, ['fg_K%', 'k_percent'], 0),
      contactPct: getField(r, ['fg_Contact%'], 0),
      age: getField(r, ['fg_Age', 'player_age'], 0),
      fg_Def: getField(r, ['fg_Def'], 0),
      fg_BsR: getField(r, ['fg_BsR'], 0),
    }))
    .filter(r => r.season > 0)
    .sort((a, b) => a.season - b.season);
}

export async function getPeriodStatsForPlayers(
  players: Player[],
  period: StatPeriod
): Promise<Record<string, PlayerStats>> {
  const results: Record<string, PlayerStats> = {};
  for (const p of players) {
    const seasons = await getPlayerSeasonRowsFromCsv(p);
    let targetRows: any[] = [];
    if (period === '2025') {
      targetRows = seasons.filter(s => s.season === 2025);
    } else if (period === '3yr-avg') {
      targetRows = seasons.filter(s => [2025, 2024, 2023].includes(s.season));
    } else if (period === 'career') {
      targetRows = seasons;
    } else if (period === '3yr-contract') {
      const signedYear = p.signedYear || 0;
      if (signedYear) {
        const years = [signedYear - 1, signedYear - 2, signedYear - 3];
        targetRows = seasons.filter(s => years.includes(s.season));
      } else {
        targetRows = seasons.slice(-3); // fallback last 3
      }
    }
    results[p.id] = aggregateToPlayerStats(targetRows);
  }
  return results;
}

/**
 * Utility function to calculate stat for specific time period view
 * Used by components to display the correct stat based on user selection
 */
export function getStatForTimeView(
  player: ComparisonPlayer,
  metric: keyof Omit<ComparisonPlayer, 'player' | 'age' | 'position' | 'team' | 'aav' | 'years' | 'totalValue' | 'signingYear'>,
  timeView: '2025' | 'career' | '3yr-rolling' | '3yr-pre-signing'
): number {
  const suffix = timeView === '2025' ? '2025' : 
                timeView === 'career' ? '' : 
                timeView === '3yr-rolling' ? '3yr' : 'PreSign';
  
  const key = timeView === 'career' ? `career${metric.charAt(0).toUpperCase() + metric.slice(1)}` : `${metric}${suffix}`;
  return (player as any)[key] || 0;
}

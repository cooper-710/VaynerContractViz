import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SBButton } from '../boras/SBButton';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Player, PlayerStats } from '../../data/playerDatabase';

interface EstimatedValueProps {
  player: Player | null;
  comps: Player[];
  onContinue: () => void;
  onBack: () => void;
}



// Mapping from config key to PlayerStats field name
const STAT_KEY_MAP: Record<string, keyof import('../../data/playerDatabase').PlayerStats> = {
  'fg_xwOBA': 'xwOBA',
  'fg_PA': 'PA',
  'sc_EV_brl_pa': 'BarrelPerPA',
  'fg_xSLG': 'xSLG',
  'fg_BB%': 'BBpct',
  'fg_K%': 'Kpct',
  'fg_Contact%': 'ContactPct',
  'sc_EV_ev50': 'EV50',
  'fg_Def': 'fg_Def',
  'fg_BsR': 'fg_BsR',
  'fg_maxEV': 'maxEV',
  'fg_HardHit%': 'HardHitPct',
};

const STAT_CONFIG = {
  fg_xwOBA: { label: 'xwOBA', higherBetter: true, weight: 0.28, decimals: 3, scale: 'decimal' as const },
  fg_PA: { label: 'PA', higherBetter: true, weight: 0.14, decimals: 0, scale: 'raw' as const },
  sc_EV_brl_pa: { label: 'Brls/PA', higherBetter: true, weight: 0.12, decimals: 1, scale: 'pct' as const },
  fg_xSLG: { label: 'xSLG', higherBetter: true, weight: 0.10, decimals: 3, scale: 'decimal' as const },
  'fg_BB%': { label: 'BB%', higherBetter: true, weight: 0.08, decimals: 1, scale: 'pct' as const },
  'fg_K%': { label: 'K%', higherBetter: false, weight: 0.07, decimals: 1, scale: 'pct' as const },
  'fg_Contact%': { label: 'Contact%', higherBetter: true, weight: 0.04, decimals: 1, scale: 'pct' as const },
  sc_EV_ev50: { label: 'EV50', higherBetter: true, weight: 0.04, decimals: 1, scale: 'mph' as const },
  fg_Def: { label: 'DEF', higherBetter: true, weight: 0.03, decimals: 1, scale: 'runs' as const },
  fg_BsR: { label: 'BsR', higherBetter: true, weight: 0.02, decimals: 1, scale: 'runs' as const },
  fg_maxEV: { label: 'maxEV', higherBetter: true, weight: 0.05, decimals: 1, scale: 'mph' as const },
  'fg_HardHit%': { label: 'HardHit%', higherBetter: true, weight: 0.03, decimals: 1, scale: 'pct' as const },
};

// Position-specific weight presets
const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  'C': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.085, 'fg_xSLG': 0.075,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.10, 'fg_BsR': 0.015, 'fg_maxEV': 0.03, 'fg_HardHit%': 0.025
  },
  'SS': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.09, 'fg_xSLG': 0.08,
    'fg_BB%': 0.09, 'fg_K%': 0.065, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.035,
    'fg_Def': 0.08, 'fg_BsR': 0.03, 'fg_maxEV': 0.04, 'fg_HardHit%': 0.02
  },
  'CF': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.09, 'fg_xSLG': 0.075,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.035,
    'fg_Def': 0.08, 'fg_BsR': 0.04, 'fg_maxEV': 0.035, 'fg_HardHit%': 0.015
  },
  '2B': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.10, 'fg_xSLG': 0.085,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.05, 'fg_BsR': 0.03, 'fg_maxEV': 0.04, 'fg_HardHit%': 0.025
  },
  '3B': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.10, 'fg_xSLG': 0.10,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.04, 'fg_BsR': 0.02, 'fg_maxEV': 0.05, 'fg_HardHit%': 0.02
  },
  'LF': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.10, 'fg_xSLG': 0.11,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.04, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.03, 'fg_BsR': 0.01, 'fg_maxEV': 0.06, 'fg_HardHit%': 0.03
  },
  'RF': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.10, 'fg_xSLG': 0.11,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.04, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.03, 'fg_BsR': 0.01, 'fg_maxEV': 0.06, 'fg_HardHit%': 0.03
  },
  '1B': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.10, 'fg_xSLG': 0.105,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.02, 'fg_BsR': 0.02, 'fg_maxEV': 0.055, 'fg_HardHit%': 0.03
  },
  'DH': {
    'fg_xwOBA': 0.28, 'fg_PA': 0.14, 'sc_EV_brl_pa': 0.105, 'fg_xSLG': 0.115,
    'fg_BB%': 0.09, 'fg_K%': 0.07, 'fg_Contact%': 0.05, 'sc_EV_ev50': 0.04,
    'fg_Def': 0.00, 'fg_BsR': 0.02, 'fg_maxEV': 0.06, 'fg_HardHit%': 0.03
  },
};

// Helper function to get weights for a specific position
function getWeightsForPosition(position: string): Record<string, number> {
  const normalizedPos = position?.trim().toUpperCase() || '';
  const positionWeights = POSITION_WEIGHTS[normalizedPos];
  
  if (positionWeights) {
    return positionWeights;
  }
  
  // Fallback to default weights from STAT_CONFIG
  return Object.fromEntries(
    Object.entries(STAT_CONFIG).map(([key, config]) => [key, config.weight])
  );
}

export function EstimatedValue({ player, comps, onContinue, onBack }: EstimatedValueProps) {
  // If no player selected, show error state
  if (!player || !comps || comps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A3A8B0] mb-4">Please select a player and comparisons from the intro screen.</p>
          <SBButton onClick={onBack}>Go Back</SBButton>
        </div>
      </div>
    );
  }

  const PETE_STATS = player.threeYearStats;
  const COMPS = comps;

  const [selectedComps, setSelectedComps] = useState<Set<string>>(
    new Set(comps.map((c) => c.id))
  );
  const [selectedPosition, setSelectedPosition] = useState<string>(player.position || '1B');
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(
    getWeightsForPosition(player.position)
  );
  const [adjustAAV, setAdjustAAV] = useState(true);
  const [adjustYears, setAdjustYears] = useState(true);
  const [inflationPercent, setInflationPercent] = useState(4);
  const [weightsOpen, setWeightsOpen] = useState(false);

  // Update weights when position changes
  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
    setCustomWeights(getWeightsForPosition(position));
  };

  const calculations = useMemo(() => {
    const activeComps = COMPS.filter((c) => selectedComps.has(c.id));
    
    if (activeComps.length === 0) {
      return {
        baselineAAV: 0,
        baselineYears: 0,
        fairAAV: 0,
        fairYears: 0,
        aavMultiplier: 1,
        yearsAdjustment: 0,
        cohortStats: {} as PlayerStats,
        statComparisons: [] as any[],
        statImpacts: [] as any[],
      };
    }

    // Calculate baseline from comps adjusted for inflation (average of inflation-adjusted AAVs)
    const presentYear = 2025;
    const inflationRate = Math.max(0, inflationPercent) / 100;
    const adjustedAAVs = activeComps.map((c) => {
      const signedYear = (c as any).signedYear as number | undefined;
      const yearsSinceSigning = signedYear ? Math.max(0, presentYear - signedYear) : 0;
      const factor = Math.pow(1 + inflationRate, yearsSinceSigning);
      return c.AAV * factor;
    });
    const baselineAAV = adjustedAAVs.reduce((sum, v) => sum + v, 0) / activeComps.length;
    const inflationAdjustedById = Object.fromEntries(
      activeComps.map((c, idx) => [c.id, adjustedAAVs[idx]])
    );
    const rawBaselineAAV = activeComps.reduce((sum, c) => sum + c.AAV, 0) / activeComps.length;
    const cohortAvgSignedYear = activeComps.reduce((sum, c) => sum + ((c as any).signedYear || 0), 0) / activeComps.length;
    const baselineYears = activeComps.reduce((sum, c) => sum + c.years, 0) / activeComps.length;

    // Cohort average age at signing (prefer age at signing if present)
    const cohortSigningAge = (activeComps.reduce((sum, c) => {
      const ageAtSigning = (c.threeYearContractStats?.age as number) || (c.threeYearStats.age as number);
      return sum + ageAtSigning;
    }, 0) / activeComps.length) || PETE_STATS.age;

    // Calculate cohort average stats (using pre-contract stats for comps)
    const cohortStats = Object.keys(STAT_CONFIG).reduce((acc, configKey) => {
      const statKey = STAT_KEY_MAP[configKey] as keyof PlayerStats;
      if (statKey === 'HRperPA') {
        const avgHr = activeComps.reduce((sum, c) => {
          const s = c.threeYearContractStats || c.threeYearStats;
          // HRperPA is stored as the actual HR count in the database
          // Use it directly instead of converting from percentage
          const hr = Math.round(s.HRperPA as number);
          return sum + hr;
        }, 0) / activeComps.length;
        (acc as any)[statKey] = avgHr;
      } else {
        (acc as any)[statKey] = activeComps.reduce((sum, c) => {
          const s = c.threeYearContractStats || c.threeYearStats;
          return sum + (s[statKey] as number);
        }, 0) / activeComps.length;
      }
      return acc;
    }, {} as any) as PlayerStats;

    // Calculate Pete's performance relative to cohort for each stat
    const statComparisons = Object.entries(STAT_CONFIG).map(([configKey, config]) => {
      const statKey = STAT_KEY_MAP[configKey] as keyof PlayerStats;
      let peteValue: number;
      let cohortValue: number;
      
      if (statKey === 'HRperPA') {
        peteValue = Math.round(PETE_STATS.HRperPA as number);
        cohortValue = cohortStats[statKey] as number;
      } else {
        peteValue = (PETE_STATS[statKey] as number);
        cohortValue = cohortStats[statKey] as number;
      }
      
      const delta = peteValue - cohortValue;
      
      // Calculate percentage difference with protection against division by zero or very small denominators
      let pctDiff: number;
      if (Math.abs(cohortValue) < 0.001) {
        // If cohort value is essentially zero, use absolute difference scaled appropriately
        // For very small denominators, cap the percentage to avoid extreme values
        pctDiff = Math.sign(delta) * Math.min(500, Math.abs(delta * 100));
      } else {
        pctDiff = (delta / Math.abs(cohortValue)) * 100;
        // Clamp percentage to reasonable bounds (-500% to +500%)
        pctDiff = Math.max(-500, Math.min(500, pctDiff));
      }
      
      // Calculate ratio for AAV impact
      // For stats that can be negative (like Def, BsR), we need special handling
      let ratio = 1;
      if (configKey === 'fg_Def' || configKey === 'fg_BsR') {
        // For Def/BsR: higher is better, but values can be negative
        // Use delta-based approach: convert delta to ratio equivalent
        // A delta of +5 Def should give similar impact to +10% on a positive stat
        // Scale: each unit of Def/BsR delta = 2% ratio change (scaled by typical range)
        const typicalRange = 10; // Typical range for Def/BsR is about -10 to +10
        const deltaRatio = 1 + (delta / typicalRange) * 0.2; // 0.2 = 2% per unit
        ratio = Math.max(0.5, Math.min(2.0, deltaRatio));
      } else if (config.higherBetter) {
        // For regular stats where higher is better
        if (Math.abs(cohortValue) < 0.001) {
          ratio = peteValue > 0 ? 1.1 : (peteValue < 0 ? 0.9 : 1);
        } else {
          ratio = peteValue / cohortValue;
        }
        // Clamp ratio to reasonable bounds to prevent extreme values
        ratio = Math.max(0.1, Math.min(10, ratio));
      } else {
        // For stats where lower is better (like K%, age)
        if (Math.abs(peteValue) < 0.001) {
          ratio = cohortValue > 0 ? 1.1 : (cohortValue < 0 ? 0.9 : 1);
        } else {
          ratio = cohortValue / peteValue;
        }
        // Clamp ratio to reasonable bounds to prevent extreme values
        ratio = Math.max(0.1, Math.min(10, ratio));
      }
      
      return {
        stat: config.label,
        key: configKey,
        peteValue,
        cohortValue,
        ratio,
        delta,
        pctDiff,
        weight: customWeights[configKey],
      };
    });

    // Calculate weighted multiplier for AAV and individual stat impacts
    let weightedSum = 0;
    let totalWeight = 0;
    
    const statImpacts = statComparisons.map((comp) => {
      const contribution = (comp.ratio - 1) * comp.weight;
      weightedSum += comp.ratio * comp.weight;
      totalWeight += comp.weight;
      
      // Calculate impact on AAV (this stat's contribution to the multiplier)
      const statMultiplier = 1 + (contribution / totalWeight);
      const aavImpact = baselineAAV * contribution / totalWeight;
      
      return {
        ...comp,
        contribution,
        aavImpact,
      };
    });
    
    const rawMultiplier = weightedSum / totalWeight;
    const aavMultiplier = adjustAAV ? Math.max(0.80, Math.min(1.30, rawMultiplier)) : 1.0;
    const fairAAV = baselineAAV * aavMultiplier;

    // Years adjustment - cleaner formula based on age and performance
    // Formula: Baseline × age_multiplier + performance_adjustment
    
    const ageDelta = PETE_STATS.age - cohortSigningAge;
    
    // Curved age multiplier using a quadratic response
    // Older than cohort signing age => increasingly harsh penalty
    // Younger than cohort signing age => tempered benefit (reduced)
    const olderDelta = Math.max(0, ageDelta);
    const youngerDelta = Math.max(0, -ageDelta);
    const penaltyComponent = (0.08 * olderDelta) + (0.020 * olderDelta * olderDelta);
    const benefitComponent = (0.02 * youngerDelta) - (0.008 * youngerDelta * youngerDelta);
    const rawAgeMultiplier = 1 - penaltyComponent + benefitComponent;
    const ageMultiplier = Math.max(0.4, Math.min(1.35, rawAgeMultiplier));
    
    // Absolute age penalty: reduce years for players 30+ (stronger)
    const absoluteAgePenalty = PETE_STATS.age >= 30 
      ? Math.min(3.0, (PETE_STATS.age - 29) * 0.45)
      : 0;
    
    // Performance adjustment: elite players get slightly longer deals (damped)
    const performanceAdjustmentRaw = (aavMultiplier - 1) * 1.2;
    const performanceAdjustment = Math.max(-1, Math.min(1, performanceAdjustmentRaw));
    
    const totalYearsAdjustment = adjustYears 
      ? ((baselineYears * ageMultiplier) - baselineYears) - absoluteAgePenalty + performanceAdjustment
      : 0;
    
    // Soft cap: do not exceed baseline by more than +1.0 year
    const proposedYears = baselineYears + totalYearsAdjustment;
    const cappedYears = Math.min(baselineYears + 1.0, proposedYears);
    const fairYears = Math.max(3, Math.round(cappedYears * 2) / 2); // Min 3 years, round to 0.5

    return {
      baselineAAV,
      baselineYears,
      fairAAV,
      fairYears,
      aavMultiplier,
      yearsAdjustment: totalYearsAdjustment,
      cohortStats,
      ageDelta,
      ageMultiplier,
      absoluteAgePenalty,
      performanceAdjustment,
      proposedYears,
      cappedYears,
      cohortSigningAge,
      statComparisons,
      statImpacts,
      rawBaselineAAV,
      inflationAdjustedById,
      presentYear,
      cohortAvgSignedYear,
    };
  }, [selectedComps, customWeights, adjustAAV, adjustYears, inflationPercent]);

  const barChartData = [
    {
      name: 'Baseline',
      value: calculations.baselineAAV,
    },
    {
      name: 'Adjusted',
      value: calculations.fairAAV,
    },
  ];

  const formatStatValue = (stat: keyof typeof STAT_CONFIG, value: number) => {
    const config = STAT_CONFIG[stat];
    
    // Handle based on scale type
    if (config.scale === 'pct') {
      // Percentage: assume value is between 0-1 if less than 1, otherwise it's already a percentage
      const pct = value <= 1 ? value * 100 : value;
      return `${pct.toFixed(config.decimals)}%`;
    } else if (config.scale === 'decimal') {
      // Decimal format (like xwOBA, xSLG) - display as 0.###
      return value.toFixed(config.decimals);
    } else if (config.scale === 'mph') {
      // Exit velocity in mph
      return `${value.toFixed(config.decimals)} mph`;
    } else if (config.scale === 'runs') {
      // Runs saved/contributed (can be negative)
      return value.toFixed(config.decimals);
    } else if (config.scale === 'rate') {
      // Rate (like Brls/PA)
      return value.toFixed(config.decimals);
    } else {
      // Raw numbers (like PA) - if decimals is 0, show as integer
      if (config.decimals === 0) {
        return Math.round(value).toString();
      }
    return value.toFixed(config.decimals);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] overflow-auto">
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Estimated Value</h2>
          </div>
          <div className="flex gap-3">
            <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
              Back
            </SBButton>
            <SBButton onClick={onContinue} icon={<ArrowRight size={18} />} iconPosition="right">
              Continue
            </SBButton>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Main Visual: AAV Calculation Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-8 grain-overlay"
            >
              <div className="mb-8">
                <h3 className="text-[#ECEDEF] mb-1">AAV Calculation</h3>
              </div>

              <div className="flex items-center justify-between gap-6">
                {/* Cohort Baseline */}
                <div className="flex-1 bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
                  <div className="text-xs text-[#A3A8B0] mb-3 uppercase tracking-wider">Cohort Average AAV</div>
                  <div className="text-5xl text-[#A8B4BD] mb-2">
                    ${calculations.baselineAAV.toFixed(1)}M
                  </div>
                  <div className="text-xs text-[#A3A8B0] ml-[2px]">Inflation Adjusted</div>
                </div>

                {/* Multiplier Arrow */}
                <div className="flex flex-col items-center px-4">
                  <div className="bg-gradient-to-r from-[#004B73]/20 to-[#004B73]/40 border border-[#004B73]/50 rounded-lg px-6 py-3 mb-2">
                    <div className="text-xs text-[#A8B4BD] mb-1 text-center">Performance Multiplier</div>
                    <div className="text-3xl text-[#004B73]">
                      {calculations.aavMultiplier.toFixed(3)}×
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#A3A8B0]">
                    <div className="h-px w-8 bg-[rgba(255,255,255,0.2)]"></div>
                    <ArrowRight className="text-[#004B73]" size={24} />
                    <div className="h-px w-8 bg-[rgba(255,255,255,0.2)]"></div>
                  </div>
                </div>

                {/* Estimated Value */}
                <div className="flex-1 bg-gradient-to-br from-[#004B73]/30 to-[#004B73]/10 border border-[#004B73]/50 rounded-xl p-6">
                  <div className="text-xs text-[#A8B4BD] mb-3 uppercase tracking-wider">
                    Estimated Fair AAV
                  </div>
                  <div className="text-5xl text-[#ECEDEF] mb-2">
                    ${calculations.fairAAV.toFixed(1)}M
                  </div>
                  <div className="flex items-center gap-2">
                    {calculations.fairAAV > calculations.baselineAAV ? (
                      <>
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-xs text-green-500">
                          +${(calculations.fairAAV - calculations.baselineAAV).toFixed(1)}M above cohort
                        </span>
                      </>
                    ) : calculations.fairAAV < calculations.baselineAAV ? (
                      <>
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-xs text-red-500">
                          ${(calculations.baselineAAV - calculations.fairAAV).toFixed(1)}M below cohort
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus size={14} className="text-[#A3A8B0]" />
                        <span className="text-xs text-[#A3A8B0]">
                          At cohort average
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistical Basis Summary */}
              <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Stats Above Average</div>
                    <div className="text-xl text-green-500">
                      {calculations.statImpacts.filter(s => s.pctDiff > 2).length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Stats Below Average</div>
                    <div className="text-xl text-red-500">
                      {calculations.statImpacts.filter(s => s.pctDiff < -2).length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Total AAV Impact</div>
                    <div className={`text-xl ${
                      calculations.fairAAV > calculations.baselineAAV ? 'text-green-500' :
                      calculations.fairAAV < calculations.baselineAAV ? 'text-red-500' : 'text-[#A3A8B0]'
                    }`}>
                      {calculations.fairAAV > calculations.baselineAAV ? '+' : ''}
                      ${(calculations.fairAAV - calculations.baselineAAV).toFixed(2)}M
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#A3A8B0] mb-1">Net Performance</div>
                    <div className={`text-xl ${
                      calculations.aavMultiplier > 1 ? 'text-green-500' :
                      calculations.aavMultiplier < 1 ? 'text-red-500' : 'text-[#A3A8B0]'
                    }`}>
                      {calculations.aavMultiplier > 1 ? '+' : ''}
                      {((calculations.aavMultiplier - 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comprehensive Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <h3 className="text-[#ECEDEF] mb-4">Statistical Comparison & AAV Impact</h3>
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-transparent">
                      <TableHead className="text-[#A8B4BD] sticky left-0 bg-[#17181B] z-10">Stat</TableHead>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableHead key={comp.id} className="text-[#A8B4BD] text-center">
                          {comp.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-[#004B73] text-center">Cohort Avg</TableHead>
                      <TableHead className="text-[#004B73] text-center">{player.name.split(' ').slice(-1)[0]}</TableHead>
                      <TableHead className="text-[#A8B4BD] text-center">Diff %</TableHead>
                      <TableHead className="text-[#A8B4BD] text-center">AAV Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(STAT_CONFIG).map(([configKey, config]) => {
                      const statKey = STAT_KEY_MAP[configKey] as keyof PlayerStats;
                      const impact = calculations.statImpacts.find(s => s.key === configKey);
                      
                      return (
                        <TableRow key={configKey} className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                          <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10">
                            {config.label}
                          </TableCell>
                          {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => {
                            const compStats = comp.threeYearContractStats || comp.threeYearStats;
                            return (
                              <TableCell key={comp.id} className="text-[#A3A8B0] text-center">
                                {formatStatValue(configKey as keyof typeof STAT_CONFIG, compStats[statKey] as number)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-[#004B73] text-center">
                            {formatStatValue(configKey as keyof typeof STAT_CONFIG, calculations.cohortStats[statKey] as number || 0)}
                          </TableCell>
                          <TableCell className="text-[#ECEDEF] text-center">
                            {formatStatValue(configKey as keyof typeof STAT_CONFIG, PETE_STATS[statKey] as number)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`${
                              impact && impact.pctDiff > 2
                                ? 'text-green-500'
                                : impact && impact.pctDiff < -2
                                ? 'text-red-500'
                                : 'text-[#A3A8B0]'
                            }`}>
                              {impact ? (impact.pctDiff > 0 ? '+' : '') + impact.pctDiff.toFixed(1) : '0.0'}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`${
                              impact && impact.aavImpact > 0.1
                                ? 'text-green-500'
                                : impact && impact.aavImpact < -0.1
                                ? 'text-red-500'
                                : 'text-[#A3A8B0]'
                            }`}>
                              {impact ? (impact.aavImpact > 0 ? '+' : '') + impact.aavImpact.toFixed(2) : '0.00'}M
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Contract context rows moved to bottom */}
                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10">Year Signed</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center">
                          {(comp as any).signedYear || '—'}
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center">
                        {Number.isFinite(calculations.cohortAvgSignedYear) ? Math.round(calculations.cohortAvgSignedYear) : '—'}
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center">
                        2026
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                    </TableRow>

                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10">AAV</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center">
                          ${comp.AAV.toFixed(1)}M
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center">
                        ${(COMPS.filter(c => selectedComps.has(c.id)).reduce((s, c) => s + c.AAV, 0) / COMPS.filter(c => selectedComps.has(c.id)).length).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center">
                        —
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                    </TableRow>

                    <TableRow className="border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]">
                      <TableCell className="text-[#ECEDEF] sticky left-0 bg-[#17181B] z-10">AAV (Inflation)</TableCell>
                      {COMPS.filter(c => selectedComps.has(c.id)).map((comp) => (
                        <TableCell key={comp.id} className="text-[#A3A8B0] text-center">
                          ${calculations.inflationAdjustedById?.[comp.id]?.toFixed(1) || comp.AAV.toFixed(1)}M
                        </TableCell>
                      ))}
                      <TableCell className="text-[#004B73] text-center">
                        ${calculations.baselineAAV.toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-[#ECEDEF] text-center">
                        —
                      </TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                      <TableCell className="text-center text-[#A3A8B0]">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                <p className="text-[#A3A8B0] text-xs leading-relaxed">
                  <span className="text-[#A8B4BD] font-medium">Data Source:</span> 3 Year Pre-Contract Averages
                </p>
              </div>
            </motion.div>

            

            {/* Fair Value Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-[#004B73]/20 to-[#004B73]/10 border border-[#004B73]/30 rounded-[14px] p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#A8B4BD] mb-2">Fair Market Value</div>
                  <div className="text-3xl text-[#ECEDEF]">
                    ${calculations.fairAAV.toFixed(1)}M × {calculations.fairYears} years
                  </div>
                  <div className="text-sm text-[#A3A8B0] mt-2">
                    Total Value: ${(calculations.fairAAV * calculations.fairYears).toFixed(1)}M
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#A3A8B0] mb-1">vs Baseline</div>
                  <div className={`text-2xl ${
                    calculations.fairAAV > calculations.baselineAAV ? 'text-green-500' : 
                    calculations.fairAAV < calculations.baselineAAV ? 'text-red-500' : 'text-[#A3A8B0]'
                  }`}>
                    {calculations.fairAAV > calculations.baselineAAV ? '+' : ''}
                    {(calculations.fairAAV - calculations.baselineAAV).toFixed(1)}M AAV
                  </div>
                  <div className={`text-sm ${
                    calculations.fairYears > calculations.baselineYears ? 'text-green-500' : 
                    calculations.fairYears < calculations.baselineYears ? 'text-red-500' : 'text-[#A3A8B0]'
                  }`}>
                    {calculations.fairYears > calculations.baselineYears ? '+' : ''}
                    {(calculations.fairYears - calculations.baselineYears).toFixed(1)} years
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar: Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 space-y-4"
          >
            {/* Inflation Adjustment */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay space-y-3">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Inflation Adjustment</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="inflation" className="text-[#ECEDEF] text-sm">
                  Annual inflation
                </Label>
                <span className="text-[#A3A8B0] text-sm font-mono">{inflationPercent.toFixed(1)}%</span>
              </div>
              <Slider
                value={[inflationPercent]}
                onValueChange={(value) => setInflationPercent(value[0])}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
            {/* Comps Selection */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Include Comps</h4>
              <div className="space-y-2">
                {COMPS.map((comp) => (
                  <div key={comp.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`comp-${comp.id}`}
                      checked={selectedComps.has(comp.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedComps);
                        if (checked) {
                          newSet.add(comp.id);
                        } else {
                          if (newSet.size > 1) { // Ensure at least one comp remains
                            newSet.delete(comp.id);
                          }
                        }
                        setSelectedComps(newSet);
                      }}
                    />
                    <Label
                      htmlFor={`comp-${comp.id}`}
                      className="text-[#ECEDEF] text-sm cursor-pointer flex-1"
                    >
                      {comp.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjustment Toggles */}
            <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-5 grain-overlay space-y-3">
              <h4 className="text-[#A8B4BD] text-sm mb-3">Adjustments</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="adjust-aav" className="text-[#ECEDEF] text-sm">
                  Adjust AAV
                </Label>
                <Checkbox
                  id="adjust-aav"
                  checked={adjustAAV}
                  onCheckedChange={setAdjustAAV}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="adjust-years" className="text-[#ECEDEF] text-sm">
                  Adjust Years
                </Label>
                <Checkbox
                  id="adjust-years"
                  checked={adjustYears}
                  onCheckedChange={setAdjustYears}
                />
              </div>
            </div>

            {/* Stat Weights (Collapsible) */}
            <Collapsible open={weightsOpen} onOpenChange={setWeightsOpen}>
              <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] overflow-hidden">
                <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[#A8B4BD] text-sm">Stat Weights</h4>
                    <Select value={selectedPosition} onValueChange={handlePositionChange}>
                      <SelectTrigger className="w-[80px] h-7 bg-[#0B0B0C] border-[rgba(255,255,255,0.14)] text-[#ECEDEF] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#17181B] border-[rgba(255,255,255,0.14)]">
                        {['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'].map((pos) => (
                          <SelectItem
                            key={pos}
                            value={pos}
                            className="text-[#ECEDEF] focus:bg-[#004B73]/20 focus:text-[#ECEDEF] text-xs"
                          >
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[#A3A8B0] transition-transform ${
                      weightsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 space-y-3">
                    {Object.entries(STAT_CONFIG).map(([key, config]) => {
                      const weight = customWeights[key];
                      
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                              <Label className="text-[#ECEDEF] text-xs">{config.label}</Label>
                            <span className="text-[#A3A8B0] text-xs font-mono">
                              {weight.toFixed(2)}x
                            </span>
                          </div>
                          <Slider
                            value={[weight]}
                            onValueChange={(value) => {
                              setCustomWeights((prev) => ({ ...prev, [key]: value[0] }));
                            }}
                            min={0}
                            max={0.5}
                            step={0.01}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Contract Length Breakdown moved to sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay"
            >
              <h3 className="text-[#ECEDEF] mb-4">Contract Length Formula</h3>
              <div className="grid grid-cols-1 gap-3 mb-2">
                <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
                  <div className="text-xs text-[#A3A8B0] mb-1">Average Cohort Years</div>
                  <div className="text-xl text-[#ECEDEF]">
                    {calculations.baselineYears.toFixed(1)}
                  </div>
                </div>
                
                {adjustYears && (
                  <>
                    <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 mt-2">
                      <div className="text-xs text-[#A3A8B0] mb-2 uppercase tracking-wider">Adjustments</div>
                      <div className="space-y-2">
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Age Multiplier Effect</div>
                          <div className={`text-lg ${((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears) > 0 ? '+' : ''}{((calculations.baselineYears * calculations.ageMultiplier) - calculations.baselineYears).toFixed(2)}
                          </div>
                        </div>
                        
                        {calculations.absoluteAgePenalty > 0 && (
                          <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                            <div className="text-xs text-[#A3A8B0] mb-1">Absolute Age Penalty</div>
                            <div className={`text-lg text-red-500`}>
                              -{calculations.absoluteAgePenalty.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Performance Adjustment</div>
                          <div className={`text-lg ${calculations.performanceAdjustment < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {calculations.performanceAdjustment > 0 ? '+' : ''}{calculations.performanceAdjustment.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
                        <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-3">
                          <div className="text-xs text-[#A3A8B0] mb-1">Total Adjustment</div>
                          <div className={`text-lg ${calculations.yearsAdjustment < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {calculations.yearsAdjustment > 0 ? '+' : ''}{calculations.yearsAdjustment.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0B0B0C] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
                      <div className="text-xs text-[#A3A8B0] mb-1">Proposed Years</div>
                      <div className={`text-lg ${calculations.proposedYears >= calculations.baselineYears ? 'text-green-500' : 'text-red-500'}`}>
                        {calculations.proposedYears.toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="bg-[#004B73] border border-[#004B73] rounded-lg p-4">
                  <div className="text-xs text-[#A8B4BD] mb-1">Fair Length</div>
                  <div className="text-xl text-[#ECEDEF]">
                    {calculations.fairYears.toFixed(1)} years
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

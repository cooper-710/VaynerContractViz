import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SBButton } from '../boras/SBButton';
import { BarChart2, Users, Calculator, DollarSign, TrendingUp, X, Search, Check, Activity, Target } from 'lucide-react';
import { ALL_PLAYERS, loadPlayersFromCsv, getPlayersWithContracts, searchPlayers, type Player } from '../../data/playerDatabase';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import borasLogo from '../../assets/Boras2.png';
import sequenceLogo from '../../assets/Sequence.png';
import { fetchMultipleCsvs } from '../../data/csvLoader';
import { getString, getField, normalizePlayerName } from '../../data/csvLoader';

interface NarrativeIntroProps {
  onBegin: (selectedPlayer: Player, selectedComps: Player[]) => void;
  onNavigateTo: (
    screen:
      | 'player-stats'
      | 'player-comparisons'
      | 'estimated-value'
      | 'team-fit'
      | 'contract-architecture'
      | 'contract-summary'
      | 'mocap'
      | 'mocap-report',
    selectedPlayer: Player,
    selectedComps: Player[]
  ) => void;
}

// Position code to abbreviation mapping
const POSITION_CODE_MAP: Record<number, string> = {
  1: 'P',
  2: 'C',
  3: '1B',
  4: '2B',
  5: '3B',
  6: 'SS',
  7: 'OF',
  8: 'OF',
  9: 'OF',
  10: 'DH',
};

/**
 * Load primary positions from Positions.csv for 2025 season
 * Returns a map of playerId -> primary position abbreviation
 */
async function loadPrimaryPositions(): Promise<Map<string, string>> {
  const [positionsRows] = await fetchMultipleCsvs(['/Positions.csv']);
  const positionCountsByPlayer = new Map<string, Map<string, number>>();
  
  // Process rows for 2025 season only
  for (const row of positionsRows) {
    const name = getString(row, ['player_name']);
    const season = getField(row, ['season'], 0);
    const positionCode = getField(row, ['position_code'], 0);
    
    if (!name || season !== 2025 || !positionCode || positionCode === 0) continue;
    
    const normId = normalizePlayerName(name);
    const positionAbbr = POSITION_CODE_MAP[positionCode];
    
    if (positionAbbr) {
      if (!positionCountsByPlayer.has(normId)) {
        positionCountsByPlayer.set(normId, new Map());
      }
      const counts = positionCountsByPlayer.get(normId)!;
      counts.set(positionAbbr, (counts.get(positionAbbr) || 0) + 1);
    }
  }
  
  // Determine primary position (most frequently played)
  const primaryPositions = new Map<string, string>();
  for (const [playerId, positionCounts] of positionCountsByPlayer.entries()) {
    let maxCount = 0;
    let primaryPos = '';
    for (const [pos, count] of positionCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        primaryPos = pos;
      }
    }
    if (primaryPos) {
      primaryPositions.set(playerId, primaryPos);
    }
  }
  
  return primaryPositions;
}

export function NarrativeIntro({ onBegin, onNavigateTo }: NarrativeIntroProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedComps, setSelectedComps] = useState<Player[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [compSearchQuery, setCompSearchQuery] = useState('');
  const [playerSearchOpen, setPlayerSearchOpen] = useState(false);
  const [compSearchOpen, setCompSearchOpen] = useState(false);
  const [players, setPlayers] = React.useState<Player[]>(ALL_PLAYERS);
  const [loadingPlayers, setLoadingPlayers] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [playerPrimaryPositionsMap, setPlayerPrimaryPositionsMap] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    let active = true;
    setLoadingPlayers(true);
    loadPlayersFromCsv()
      .then((list) => {
        if (!active) return;
        setPlayers(list);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Failed to load player data');
      })
      .finally(() => active && setLoadingPlayers(false));
    return () => {
      active = false;
    };
  }, []);

  // Load primary positions from Positions.csv
  React.useEffect(() => {
    loadPrimaryPositions()
      .then((positions) => {
        setPlayerPrimaryPositionsMap(positions);
      })
      .catch((err) => {
        console.error('Failed to load primary positions:', err);
      });
  }, []);

  // Pre-load Pete Alonso and comps when players are loaded
  React.useEffect(() => {
    if (players.length === 0 || loadingPlayers || selectedPlayer !== null || selectedComps.length > 0) return;
    
    // Find Pete Alonso
    const peteAlonso = players.find(p => 
      p.name.toLowerCase().includes('pete alonso') || 
      p.name.toLowerCase().includes('alonso')
    );
    
    // Find comps
    const compNames = [
      'Freddie Freeman',
      'Matt Olson',
      'Vladimir Guerrero',
      'Rafael Devers',
      'Yordan Alvarez'
    ];
    
    const foundComps = compNames
      .map(name => {
        if (name === 'Vladimir Guerrero') {
          // Special handling for Vladimir Guerrero Jr.
          return players.find(p => 
            p.name.toLowerCase().includes('vladimir') && 
            p.name.toLowerCase().includes('guerrero')
          );
        }
        return players.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) &&
          p.name.toLowerCase().includes(name.toLowerCase().split(' ')[1])
        );
      })
      .filter((player): player is Player => player !== undefined);
    
    // Set pre-loaded values
    if (peteAlonso) {
      setSelectedPlayer(peteAlonso);
    }
    
    if (foundComps.length > 0) {
      setSelectedComps(foundComps);
    }
  }, [players, loadingPlayers, selectedPlayer, selectedComps]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerSearchOpen(false);
    setPlayerSearchQuery('');
  };

  const handleCompSelect = (comp: Player) => {
    if (selectedComps.length < 5 && !selectedComps.find(c => c.id === comp.id)) {
      setSelectedComps([...selectedComps, comp]);
    }
    setCompSearchQuery('');
  };

  const handleCompRemove = (compId: string) => {
    setSelectedComps(selectedComps.filter(c => c.id !== compId));
  };

  const handleBegin = () => {
    if (selectedPlayer && selectedComps.length >= 1) {
      onBegin(selectedPlayer, selectedComps);
    }
  };

  const canBegin = selectedPlayer !== null && selectedComps.length >= 1;
  const canViewMocap = selectedPlayer !== null;

  const handleCardClick = (screen:
    | 'player-stats'
    | 'player-comparisons'
    | 'estimated-value'
    | 'team-fit'
    | 'contract-architecture'
    | 'contract-summary') => {
    if (!canBegin || !selectedPlayer) return;
    onNavigateTo(screen, selectedPlayer, selectedComps);
  };

  const steps = [
    { label: 'Player Stats', key: 'player', icon: BarChart2, screen: 'player-stats' },
    { label: 'Comparables', key: 'comps', icon: Users, screen: 'player-comparisons' },
    { label: 'Estimated Value', key: 'value', icon: Calculator, screen: 'estimated-value' },
    { label: 'Team Fit', key: 'team-fit', icon: Target, screen: 'team-fit' },
    { label: 'Contract Structure', key: 'structure', icon: DollarSign, screen: 'contract-architecture' },
    { label: 'Summary', key: 'summary', icon: TrendingUp, screen: 'contract-summary' },
  ];

  const currentStep = selectedPlayer && selectedComps.length >= 1 ? 2 : selectedPlayer ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#0B0B0C] relative overflow-hidden">
      {/* Layered Radial Gradient Vignette + Soft Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Outer vignette layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 100% at 50% 0%, transparent 40%, rgba(0, 0, 0, 0.6) 100%)`,
          }}
        />
        {/* Soft glow layer 1 - Navy */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(0, 75, 115, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Soft glow layer 2 - Silver */}
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(168, 180, 189, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        {/* Inner vignette layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, rgba(0, 0, 0, 0.4) 80%)`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="pt-32 pb-8 px-6 text-center"
          style={{
            textShadow: '0 0 20px rgba(0, 75, 115, 0.4)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <img 
                src={borasLogo} 
                alt="Boras Corp Logo" 
                className="object-contain"
                style={{ height: '8rem' }}
              />
              <h1 className="font-semibold text-[#ECEDEF] tracking-tight" style={{
                fontSize: '8rem',
                textShadow: '0 0 30px rgba(0, 75, 115, 0.6), 0 0 60px rgba(0, 75, 115, 0.4), -1px -1px 0 rgba(0, 75, 115, 0.8), 1px -1px 0 rgba(0, 75, 115, 0.8), -1px 1px 0 rgba(0, 75, 115, 0.8), 1px 1px 0 rgba(0, 75, 115, 0.8)',
              }}>
                Boras Corp.
              </h1>
            </div>
          </motion.div>
        </motion.header>

        {/* Main Content Area */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-32">
          {/* Player Selection Card - Frosted Glass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-12"
          >
            <div 
              className="backdrop-blur-xl bg-[rgba(23,24,27,0.6)] border border-[rgba(0,75,115,0.3)] rounded-2xl p-8 shadow-xl"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 75, 115, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold text-[#ECEDEF] mb-2 tracking-tight">
                  Select Player to Valuate
                </h2>
              </div>

              {selectedPlayer ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <div 
                    className="backdrop-blur-lg bg-[rgba(23,24,27,0.7)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 shadow-lg flex items-center justify-between"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#ECEDEF] mb-1 tracking-tight">
                        {selectedPlayer.name}
                      </h3>
                      <p className="text-sm text-[#A3A8B0]">
                        {playerPrimaryPositionsMap.get(selectedPlayer.id) || selectedPlayer.position} • {selectedPlayer.team}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedPlayer(null);
                        setPlayerSearchQuery('');
                      }}
                      className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#A3A8B0] hover:text-[#ECEDEF] transition-all"
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <div className="relative">
                  {/* Elevated Search Input with Leading Icon */}
                  <div 
                    className="relative backdrop-blur-lg bg-[rgba(23,24,27,0.7)] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-lg overflow-hidden"
                    style={{
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    }}
                  >
                    <div className="flex items-center px-5 py-4 gap-3">
                      <Search className="w-5 h-5 text-[#A3A8B0] flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search for a player..."
                        value={playerSearchQuery}
                        onChange={(e) => {
                          setPlayerSearchQuery(e.target.value);
                          setPlayerSearchOpen(true);
                        }}
                        onFocus={() => setPlayerSearchOpen(true)}
                        className="flex-1 bg-transparent text-[#ECEDEF] placeholder:text-[#A3A8B0] outline-none text-base font-medium"
                      />
                    </div>
                    
                    {/* Dropdown Results */}
                    <AnimatePresence>
                      {playerSearchOpen && playerSearchQuery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-[rgba(255,255,255,0.08)] max-h-[300px] overflow-y-auto"
                        >
                          {players
                            .filter(p => 
                              p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                              p.team.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                              p.position.toLowerCase().includes(playerSearchQuery.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((player) => (
                              <motion.button
                                key={player.id}
                                whileHover={{ backgroundColor: 'rgba(0, 75, 115, 0.15)' }}
                                onClick={() => handlePlayerSelect(player)}
                                className="w-full px-5 py-3 text-left flex items-center justify-between hover:bg-[rgba(0,75,115,0.1)] transition-colors border-b border-[rgba(255,255,255,0.03)] last:border-0"
                              >
                                <div>
                                  <div className="text-[#ECEDEF] font-medium">{player.name}</div>
                                  <div className="text-sm text-[#A3A8B0] mt-0.5">
                                    {playerPrimaryPositionsMap.get(player.id) || player.position} • {player.team}
                                  </div>
                                </div>
                                {player.AAV && (
                                  <span className="text-sm text-[#A8B4BD] font-medium">
                                    ${player.AAV}M
                                  </span>
                                )}
                              </motion.button>
                            ))}
                          {players.filter(p => 
                            p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                            p.team.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
                            p.position.toLowerCase().includes(playerSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-5 py-6 text-center text-sm text-[#A3A8B0]">
                              No player found
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* View Mocap Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mb-12"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Left: View Mocap Button */}
              <motion.button
                onClick={() => canViewMocap && onNavigateTo('mocap', selectedPlayer!, selectedComps)}
                disabled={!canViewMocap}
                whileHover={canViewMocap ? { scale: 1.01 } : {}}
                whileTap={canViewMocap ? { scale: 0.99 } : {}}
                className="group relative"
              >
                <div 
                  className={cn(
                    'backdrop-blur-xl rounded-2xl p-6 shadow-xl flex items-center justify-center gap-3 transition-all duration-300 w-full',
                    canViewMocap 
                      ? 'bg-[rgba(23,24,27,0.6)] border border-[rgba(0,75,115,0.3)] hover:border-[rgba(0,75,115,0.5)] hover:bg-[rgba(23,24,27,0.7)] cursor-pointer'
                      : 'bg-[rgba(23,24,27,0.4)] border border-[rgba(255,255,255,0.08)] opacity-50 cursor-not-allowed'
                  )}
                  style={{
                    boxShadow: canViewMocap
                      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 75, 115, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Activity 
                    size={20} 
                    className={cn(
                      'transition-colors',
                      canViewMocap ? 'text-[#004B73] group-hover:text-[#0066a0]' : 'text-[#A3A8B0]'
                    )}
                  />
                  <span className={cn(
                    'text-lg font-semibold tracking-tight',
                    canViewMocap ? 'text-[#ECEDEF]' : 'text-[#A3A8B0]'
                  )}>
                    View Mocap
                  </span>
                </div>
              </motion.button>

              {/* Right: View Mocap Report Button */}
              <motion.button
                onClick={() => canViewMocap && onNavigateTo('mocap-report', selectedPlayer!, selectedComps)}
                disabled={!canViewMocap}
                whileHover={canViewMocap ? { scale: 1.01 } : {}}
                whileTap={canViewMocap ? { scale: 0.99 } : {}}
                className="group relative"
              >
                <div 
                  className={cn(
                    'backdrop-blur-xl rounded-2xl p-6 shadow-xl flex items-center justify-center gap-3 transition-all duration-300 w-full',
                    canViewMocap 
                      ? 'bg-[rgba(23,24,27,0.6)] border border-[rgba(0,75,115,0.3)] hover:border-[rgba(0,75,115,0.5)] hover:bg-[rgba(23,24,27,0.7)] cursor-pointer'
                      : 'bg-[rgba(23,24,27,0.4)] border border-[rgba(255,255,255,0.08)] opacity-50 cursor-not-allowed'
                  )}
                  style={{
                    boxShadow: canViewMocap
                      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 75, 115, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Activity 
                    size={20} 
                    className={cn(
                      'transition-colors',
                      canViewMocap ? 'text-[#004B73] group-hover:text-[#0066a0]' : 'text-[#A3A8B0]'
                    )}
                  />
                  <span className={cn(
                    'text-lg font-semibold tracking-tight',
                    canViewMocap ? 'text-[#ECEDEF]' : 'text-[#A3A8B0]'
                  )}>
                    View Mocap Report
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Comparables Section - Prominent Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <div 
              className="backdrop-blur-xl bg-[rgba(23,24,27,0.65)] border border-[rgba(0,75,115,0.4)] rounded-2xl p-8 shadow-2xl"
              style={{
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(0, 75, 115, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-semibold text-[#ECEDEF] mb-2 tracking-tight">
                  Comparison Players
                </h3>
                <p className="text-sm text-[#A3A8B0]">
                  Select 1-5 players with signed contracts for market comparison
                </p>
              </div>

              {/* Selected Comps with Removable Chips and Inline Status */}
              <AnimatePresence>
                {selectedComps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 flex flex-wrap gap-3 justify-center"
                  >
                    {selectedComps.map((comp, index) => (
                      <motion.div
                        key={comp.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        className="group relative"
                      >
                        <div 
                          className="backdrop-blur-lg bg-[rgba(0,75,115,0.25)] border border-[rgba(0,75,115,0.4)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg"
                          style={{
                            boxShadow: '0 4px 12px rgba(0, 75, 115, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {/* Inline Status Indicator */}
                          <div className="w-2 h-2 rounded-full bg-[#004B73] shadow-lg shadow-[#004B73]/50" />
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[#ECEDEF] font-semibold text-sm">
                              {comp.name}
                            </span>
                            <span className="text-xs text-[#A8B4BD] opacity-80">
                              {playerPrimaryPositionsMap.get(comp.id) || comp.position}
                            </span>
                            {comp.AAV && (
                              <span className="text-xs text-[#A8B4BD] font-medium">
                                ${comp.AAV}M
                              </span>
                            )}
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCompRemove(comp.id)}
                            className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-[#A3A8B0] hover:text-[#ECEDEF] transition-all ml-1"
                          >
                            <X size={12} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comp Search Input */}
              {selectedComps.length < 5 ? (
                <div 
                  className="relative backdrop-blur-lg bg-[rgba(23,24,27,0.7)] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-lg overflow-hidden"
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                  }}
                >
                  <div className="flex items-center px-5 py-4 gap-3">
                    <Search className="w-5 h-5 text-[#A3A8B0] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search for comparison players..."
                      value={compSearchQuery}
                      onChange={(e) => {
                        setCompSearchQuery(e.target.value);
                        setCompSearchOpen(true);
                      }}
                      onFocus={() => setCompSearchOpen(true)}
                      className="flex-1 bg-transparent text-[#ECEDEF] placeholder:text-[#A3A8B0] outline-none text-base font-medium"
                    />
                  </div>
                  
                  {/* Dropdown Results */}
                  <AnimatePresence>
                    {compSearchOpen && compSearchQuery && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[rgba(255,255,255,0.08)] max-h-[300px] overflow-y-auto"
                      >
                        {(players.length ? players : getPlayersWithContracts())
                          .filter(p => !selectedComps.find(c => c.id === p.id))
                          .filter(p => selectedPlayer ? p.id !== selectedPlayer.id : true)
                          .filter(p => 
                            p.name.toLowerCase().includes(compSearchQuery.toLowerCase()) ||
                            p.team.toLowerCase().includes(compSearchQuery.toLowerCase()) ||
                            p.position.toLowerCase().includes(compSearchQuery.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((player) => (
                            <motion.button
                              key={player.id}
                              whileHover={{ backgroundColor: 'rgba(0, 75, 115, 0.15)' }}
                              onClick={() => handleCompSelect(player)}
                              className="w-full px-5 py-3 text-left flex items-center justify-between hover:bg-[rgba(0,75,115,0.1)] transition-colors border-b border-[rgba(255,255,255,0.03)] last:border-0"
                            >
                              <div>
                                <div className="text-[#ECEDEF] font-medium">{player.name}</div>
                                <div className="text-sm text-[#A3A8B0] mt-0.5">
                                  {playerPrimaryPositionsMap.get(player.id) || player.position} • {player.team}
                                  {selectedPlayer && (playerPrimaryPositionsMap.get(player.id) || player.position) === (playerPrimaryPositionsMap.get(selectedPlayer.id) || selectedPlayer.position) && (
                                    <span className="ml-2 text-[#004B73]">★ Same Position</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-[#A8B4BD] font-medium">
                                ${player.AAV}M × {player.years}yr
                              </span>
                            </motion.button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-4 px-6 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-sm text-[#A3A8B0]">
                  Maximum 5 comparisons selected
                </div>
              )}

              {!canBegin && selectedComps.length === 0 && (
                <p className="text-center text-[#A3A8B0] text-xs mt-4">
                  At least 1 comparison player is required
                </p>
              )}
            </div>
          </motion.div>

          {/* Minimal Horizontal Stepper + Clickable Icon Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            {/* Clickable Icon Cards */}
            <div className="grid grid-cols-6 gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isUpcoming = index > currentStep;
                // Team Fit (index 3) should be clickable when Estimated Value (index 2) is clickable
                const isClickable = canBegin && (index <= currentStep || (index === 3 && currentStep >= 2));
                // Show glow on first FOUR cards ONLY when both searches are filled
                // - Player Stats (0), Comparables (1), Estimated Value (2), Team Fit (3)
                const shouldGlow = (selectedPlayer && selectedComps.length >= 1) && index <= 3;
                
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="h-full"
                  >
                    <motion.button
                      onClick={() => handleCardClick(step.screen as any)}
                      disabled={!isClickable}
                      whileHover={isClickable ? { scale: 1.02, y: -2 } : {}}
                      whileTap={isClickable ? { scale: 0.98 } : {}}
                      className={cn(
                        'w-full h-full relative backdrop-blur-xl rounded-xl p-6 border transition-all duration-300',
                        'flex flex-col items-center justify-center text-center gap-3',
                        'min-h-[140px]',
                        isClickable && 'cursor-pointer',
                        !isClickable && 'cursor-not-allowed',
                        // When shouldGlow is true, all first three cards get strong blue glow
                        shouldGlow && 'border-[#004B73] bg-[rgba(0,75,115,0.1)]',
                        // When shouldGlow is false, show default styling
                        !shouldGlow && 'border-[rgba(255,255,255,0.08)] bg-[rgba(23,24,27,0.4)] opacity-50',
                        // Hover states only for clickable cards
                        isClickable && !isActive && 'hover:border-[rgba(0,75,115,0.5)] hover:bg-[rgba(0,75,115,0.08)]',
                      )}
                      style={{
                        boxShadow: shouldGlow
                          ? '0 8px 24px rgba(0, 75, 115, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                          : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                      }}
                    >
                      {/* Icon Container */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                        shouldGlow && 'bg-[rgba(0,75,115,0.2)]',
                        !shouldGlow && 'bg-[rgba(255,255,255,0.03)]',
                      )}>
                        <Icon 
                          size={24} 
                          className={cn(
                            shouldGlow && 'text-[#ECEDEF]',
                            !shouldGlow && 'text-[#A3A8B0]',
                          )}
                        />
                      </div>
                      
                      {/* Label */}
                      <span className={cn(
                        'text-sm font-medium transition-colors whitespace-nowrap',
                        shouldGlow && 'text-[#ECEDEF]',
                        !shouldGlow && 'text-[#A3A8B0]',
                      )}>
                        {step.label}
                      </span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
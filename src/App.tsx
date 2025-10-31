import React, { useState } from 'react';
import { Menu, Home, BarChart3, Hammer, TrendingUp, Users, Activity, FileText, Share2, History, BookOpen } from 'lucide-react';
import { ContractProvider } from './components/narrative/ContractContext';
import { NarrativeIntro } from './components/screens/NarrativeIntro';
import type { Player } from './data/playerDatabase';
import { PlayerStats } from './components/screens/PlayerStats';
import { PlayerComparisons } from './components/screens/PlayerComparisons';
import { EstimatedValue } from './components/screens/EstimatedValue';
import { ContractArchitecture } from './components/screens/ContractArchitecture';
import { ContractSummary } from './components/screens/ContractSummary';
import { Overview } from './components/screens/Overview';
import { DealBuilder } from './components/screens/DealBuilder';
import { ValuationComps } from './components/screens/ValuationComps';
import { TeamFit } from './components/screens/TeamFit';
import { Projections } from './components/screens/Projections';
import { OfferSheet } from './components/screens/OfferSheet';
import { ShareExport } from './components/screens/ShareExport';
import { Audit } from './components/screens/Audit';
import { cn } from './components/ui/utils';

type Mode = 'narrative' | 'exploration';
type Screen = 
  | 'intro'
  | 'player-stats'
  | 'player-comparisons'
  | 'estimated-value'
  | 'contract-architecture'
  | 'contract-summary'
  | 'overview' 
  | 'builder' 
  | 'valuation' 
  | 'teamfit' 
  | 'projections' 
  | 'offer' 
  | 'share' 
  | 'audit';

function AppContent() {
  const [mode, setMode] = useState<Mode>('narrative');
  const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedComps, setSelectedComps] = useState<Player[]>([]);

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'builder', label: 'Deal Builder', icon: Hammer },
    { id: 'valuation', label: 'Valuation & Comps', icon: TrendingUp },
    { id: 'teamfit', label: 'Team Fit', icon: Users },
    { id: 'projections', label: 'Projections', icon: Activity },
    { id: 'offer', label: 'Offer Sheet', icon: FileText },
    { id: 'share', label: 'Share & Export', icon: Share2 },
    { id: 'audit', label: 'Audit', icon: History },
  ];

  // Narrative Mode Screens
  if (mode === 'narrative') {
    if (currentScreen === 'intro') {
      return (
        <NarrativeIntro
          onBegin={(player, comps) => {
            setSelectedPlayer(player);
            setSelectedComps(comps);
            setCurrentScreen('player-stats');
          }}
          onNavigateTo={(screen, player, comps) => {
            setSelectedPlayer(player);
            setSelectedComps(comps);
            setCurrentScreen(screen);
          }}
        />
      );
    }
    
    if (currentScreen === 'player-stats') {
      return <PlayerStats 
        player={selectedPlayer}
        onContinue={() => setCurrentScreen('player-comparisons')} 
        onBack={() => setCurrentScreen('intro')}
      />;
    }
    
    if (currentScreen === 'player-comparisons') {
      return <PlayerComparisons 
        player={selectedPlayer}
        comps={selectedComps}
        onContinue={() => setCurrentScreen('estimated-value')}
        onBack={() => setCurrentScreen('player-stats')}
      />;
    }
    
    if (currentScreen === 'estimated-value') {
      return <EstimatedValue 
        player={selectedPlayer}
        comps={selectedComps}
        onContinue={() => setCurrentScreen('contract-architecture')}
        onBack={() => setCurrentScreen('player-comparisons')}
      />;
    }
    
    if (currentScreen === 'contract-architecture') {
      return <ContractArchitecture 
        onContinue={() => setCurrentScreen('contract-summary')}
        onBack={() => setCurrentScreen('estimated-value')}
      />;
    }
    
    if (currentScreen === 'contract-summary') {
      return <ContractSummary 
        onExploreData={() => {
          setMode('exploration');
          setCurrentScreen('overview');
        }}
        onStartOver={() => setCurrentScreen('intro')}
        onBack={() => setCurrentScreen('contract-architecture')}
      />;
    }
  }

  // Exploration Mode - Interactive data exploration interface
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0B0C]">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r border-[rgba(255,255,255,0.14)] bg-[#121315] transition-all duration-300 flex flex-col overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo/Header */}
        <div className="border-b border-[rgba(255,255,255,0.14)] p-4 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#004B73] rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">B</span>
                </div>
                <span className="text-[#A8B4BD] font-semibold">BORAS CORP</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
              >
                <Menu size={18} className="text-[#A3A8B0]" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors mx-auto"
            >
              <Menu size={18} className="text-[#A3A8B0]" />
            </button>
          )}
        </div>

        {/* Back to Narrative Button */}
        <div className="p-3 border-b border-[rgba(255,255,255,0.14)]">
          <button
            onClick={() => {
              setMode('narrative');
              setCurrentScreen('intro');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#004B73]/10 text-[#A8B4BD] hover:bg-[#004B73]/20 transition-all"
          >
            <BookOpen size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Back to Narrative</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as Screen)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-[180ms]',
                    isActive
                      ? 'bg-[#004B73] text-white'
                      : 'text-[#A3A8B0] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ECEDEF]'
                  )}
                >
                  <Icon size={18} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="border-t border-[rgba(255,255,255,0.14)] p-4">
            <div className="text-xs text-[#A3A8B0]">
              <p className="mb-1">Pete Alonso Contract</p>
              <p>Data Exploration</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'overview' && <Overview onEditBuilder={() => setCurrentScreen('builder')} />}
        {currentScreen === 'builder' && <DealBuilder />}
        {currentScreen === 'valuation' && <ValuationComps />}
        {currentScreen === 'teamfit' && <TeamFit />}
        {currentScreen === 'projections' && <Projections />}
        {currentScreen === 'offer' && <OfferSheet />}
        {currentScreen === 'share' && <ShareExport />}
        {currentScreen === 'audit' && <Audit />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ContractProvider>
      <AppContent />
    </ContractProvider>
  );
}

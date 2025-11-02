import React from 'react';
import { motion } from 'motion/react';
import { SBButton } from '../boras/SBButton';
import { ArrowLeft } from 'lucide-react';
import type { Player } from '../../data/playerDatabase';

interface MocapReportProps {
  onBack: () => void;
  player: Player | null;
  backLabel?: string;
}

export function MocapReport({ onBack, player, backLabel = 'Back to Intro' }: MocapReportProps) {
  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#ECEDEF]">Motion Capture Report</h2>
            <p className="text-sm text-[#A3A8B0] mt-1">
              Biomechanical analysis for {player?.name || 'Player'}
            </p>
          </div>
          <SBButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
            {backLabel}
          </SBButton>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <iframe
            src="/Pete_Alonso.pdf"
            className="w-full h-full border-0"
            title="Motion Capture Report"
          />
        </motion.div>
      </div>
    </div>
  );
}


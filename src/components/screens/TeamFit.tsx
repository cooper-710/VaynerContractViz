import React from 'react';
import { ChartPlaceholder } from '../boras/ChartPlaceholder';
import { SBChip } from '../boras/SBChip';

export function TeamFit() {
  return (
    <div className="h-screen bg-[#0B0B0C] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[#ECEDEF]">Team Fit</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* CBT & Payroll Impact */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">Competitive Balance Tax Impact</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[#A3A8B0] mb-3 text-sm">Current CBT Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Current Payroll</span>
                    <span className="text-[#ECEDEF]">$242M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">CBT Threshold</span>
                    <span className="text-[#ECEDEF]">$241M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Over Threshold</span>
                    <span className="text-red-400">$1M</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[#A3A8B0] mb-3 text-sm">With Alonso Contract</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Projected Payroll</span>
                    <span className="text-[#ECEDEF]">$272M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">CBT Threshold</span>
                    <span className="text-[#ECEDEF]">$241M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Over Threshold</span>
                    <span className="text-red-400">$31M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Est. Tax Penalty</span>
                    <span className="text-red-400">$15.5M</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[#A3A8B0] text-xs mt-4 italic">
              Team will be subject to 50% tax rate as 3rd-year offender
            </p>
          </div>
          
          {/* Payroll Forecast */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">3-Year Payroll Forecast</h3>
            <ChartPlaceholder title="Payroll with Soto vs. CBT Thresholds" type="cashflow" height={240} />
          </div>
          
          {/* Depth Chart */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <h3 className="text-[#ECEDEF] mb-4">Depth Chart Fit</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[#A3A8B0] text-sm">First Base</h4>
                  <SBChip variant="positive">Retain Star</SBChip>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#ECEDEF]">Current: Pete Alonso</span>
                    <span className="text-[#A3A8B0]">3.8 WAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8B4BD]">With Extension: Pete Alonso</span>
                    <span className="text-emerald-400">3.5-4.0 WAR proj.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A3A8B0]">Replacement if lost</span>
                    <span className="text-red-400">-2.0 WAR risk</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[#A3A8B0] text-sm">Lineup Impact</h4>
                </div>
                <p className="text-[#ECEDEF] text-sm">
                  Retains franchise cornerstone and elite run producer. Alonso's power anchors middle of lineup with 40+ HR potential.
                </p>
              </div>
            </div>
          </div>
          
          {/* Opportunity Cost */}
          <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-[14px] p-6 grain-overlay">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[#ECEDEF]">Opportunity Cost</h3>
              <SBChip variant="neutral">Analysis</SBChip>
            </div>
            <p className="text-[#A3A8B0] text-sm mb-4">
              Committing $30M AAV to Alonso maintains flexibility to address rotation and bullpen needs.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Estimated Remaining Budget</span>
                <span className="text-[#ECEDEF]">$45-55M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A8B0]">Priority Needs</span>
                <span className="text-[#ECEDEF]">SP, OF, RP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

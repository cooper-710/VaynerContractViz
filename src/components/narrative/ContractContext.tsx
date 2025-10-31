import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ContractTerms {
  // Base Terms
  years: number;
  baseAAV: number;
  
  // Structure
  signingBonus: number;
  salaryStructure: 'even' | 'front-loaded' | 'back-loaded';
  frontLoadPercent: number;
  
  // Deferrals
  deferralPercent: number;
  deferralYears: number;
  deferralInterest: number;
  
  // Bonuses
  performanceBonus: number;
  awardBonus: number;
  playingTimeBonus: number;
  
  // Options & Clauses
  optOutYear: number | null;
  teamOptionYear: number | null;
  teamOptionValue: number;
  buyoutValue: number;
  noTradeClause: 'full' | 'limited' | 'none';
  limitedNoTradeTeams: number;
  
  // Escalators
  hasEscalator: boolean;
  escalatorPercent: number;
  escalatorTrigger: string;
  
  // Other
  signing2024: boolean;
  taxConsiderations: boolean;
}

interface ContractContextType {
  terms: ContractTerms;
  updateTerm: (key: keyof ContractTerms, value: any) => void;
  resetTerms: () => void;
  
  // Calculated values
  totalValue: number;
  guaranteedValue: number;
  potentialValue: number;
  cbtImpact: number;
  yearlyBreakdown: YearlyBreakdown[];
}

export interface YearlyBreakdown {
  year: number;
  baseSalary: number;
  bonus: number;
  deferred: number;
  totalCash: number;
  cbtHit: number;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

const defaultTerms: ContractTerms = {
  years: 7,
  baseAAV: 30,
  signingBonus: 15,
  salaryStructure: 'front-loaded',
  frontLoadPercent: 15,
  deferralPercent: 0,
  deferralYears: 10,
  deferralInterest: 2.5,
  performanceBonus: 2,
  awardBonus: 1,
  playingTimeBonus: 1,
  optOutYear: 4,
  teamOptionYear: null,
  teamOptionValue: 25,
  buyoutValue: 5,
  noTradeClause: 'full',
  limitedNoTradeTeams: 10,
  hasEscalator: false,
  escalatorPercent: 5,
  escalatorTrigger: 'MVP finish',
  signing2024: true,
  taxConsiderations: false,
};

export function ContractProvider({ children }: { children: ReactNode }) {
  const [terms, setTerms] = useState<ContractTerms>(defaultTerms);

  const updateTerm = (key: keyof ContractTerms, value: any) => {
    setTerms(prev => ({ ...prev, [key]: value }));
  };

  const resetTerms = () => {
    setTerms(defaultTerms);
  };

  // Calculate yearly breakdown
  const calculateYearlyBreakdown = (): YearlyBreakdown[] => {
    const breakdown: YearlyBreakdown[] = [];
    const totalYears = terms.years;
    
    for (let i = 0; i < totalYears; i++) {
      let baseSalary = terms.baseAAV;
      
      // Apply salary structure
      if (terms.salaryStructure === 'front-loaded') {
        if (i < 3) {
          baseSalary = terms.baseAAV * (1 + terms.frontLoadPercent / 100);
        } else {
          baseSalary = terms.baseAAV * (1 - terms.frontLoadPercent / 200);
        }
      } else if (terms.salaryStructure === 'back-loaded') {
        if (i < totalYears - 3) {
          baseSalary = terms.baseAAV * (1 - terms.frontLoadPercent / 200);
        } else {
          baseSalary = terms.baseAAV * (1 + terms.frontLoadPercent / 100);
        }
      }
      
      // Add signing bonus to first year
      const bonus = i === 0 ? terms.signingBonus : 0;
      
      // Calculate deferrals
      const deferred = (baseSalary + bonus) * (terms.deferralPercent / 100);
      const totalCash = baseSalary + bonus - deferred;
      
      // CBT calculation (simplified)
      const cbtHit = terms.baseAAV - (deferred / totalYears);
      
      breakdown.push({
        year: 2026 + i,
        baseSalary: Math.round(baseSalary * 10) / 10,
        bonus: Math.round(bonus * 10) / 10,
        deferred: Math.round(deferred * 10) / 10,
        totalCash: Math.round(totalCash * 10) / 10,
        cbtHit: Math.round(cbtHit * 10) / 10,
      });
    }
    
    return breakdown;
  };

  const yearlyBreakdown = calculateYearlyBreakdown();
  
  // Calculations
  const totalValue = yearlyBreakdown.reduce((sum, year) => sum + year.baseSalary + year.bonus, 0);
  const guaranteedValue = totalValue * (terms.teamOptionYear ? 0.85 : 1);
  const potentialValue = totalValue + (terms.performanceBonus + terms.awardBonus + terms.playingTimeBonus) * terms.years;
  const cbtImpact = yearlyBreakdown[0]?.cbtHit || terms.baseAAV;

  return (
    <ContractContext.Provider value={{
      terms,
      updateTerm,
      resetTerms,
      totalValue,
      guaranteedValue,
      potentialValue,
      cbtImpact,
      yearlyBreakdown,
    }}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within ContractProvider');
  }
  return context;
}

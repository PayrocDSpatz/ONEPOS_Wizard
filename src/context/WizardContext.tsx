import React, { createContext, useContext, useMemo, useState } from 'react';
import { BizState, ProcessingState, HardwareState, Derived } from '../types';
import { DEFAULT_HARDWARE_PRICING } from '../constants';
import { computeDerived } from '../lib/calc';

interface WizardCtx {
  biz: BizState; setBiz: React.Dispatch<React.SetStateAction<BizState>>;
  processing: ProcessingState; setProcessing: React.Dispatch<React.SetStateAction<ProcessingState>>;
  hardware: HardwareState; setHardware: React.Dispatch<React.SetStateAction<HardwareState>>;
  notes: string; setNotes: React.Dispatch<React.SetStateAction<string>>;
  derived: Derived;
}
const Ctx = createContext<WizardCtx | null>(null);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [biz, setBiz] = useState<BizState>({ entityType: 'LLC', locations: 1, type: 'fastcasual', cuisine: 'Other', cuisineOther: 'NONE', openDate: '' });
  const [processing, setProcessing] = useState<ProcessingState>({ monthlyVolume: 80000, averageTicket: 38, cardPresentPct: 0.95, pricingModel: 'flatrate', markupBps: 35, markupPerItem: 0.06, flatPct: 0.04, flatPctEditing: undefined, flatPerItem: 0.1, monthlyFeesToMerchant: 0, useDefaultCosts: true, customCosts: { basePct: 0.019, assessmentsPct: 0.0013, perItem: 0.1 }, agentShare: 0.5, agentShareEditing: undefined });
  const [hardware, setHardware] = useState<HardwareState>({ posTerminals: 1, terminalOnlyUnits: 0, receiptPrinters: 0, kitchenPrinters: 1, handhelds: 2, kdsUnits: 1, cashDrawers: 0, scanners: 0, pricing: { ...DEFAULT_HARDWARE_PRICING }, amortTermMonths: 30, includeSoftwareInCoverage: true, softwareMonthly: 129*2, bufferPct: 0.3, includeInstallTraining: true });
  const [notes, setNotes] = useState('');
  const derived = useMemo(() => computeDerived(biz, processing, hardware), [biz, processing, hardware]);
  return <Ctx.Provider value={{ biz, setBiz, processing, setProcessing, hardware, setHardware, notes, setNotes, derived }}>{children}</Ctx.Provider>;
};
export const useWizard = () => { const v = useContext(Ctx); if (!v) throw new Error('useWizard must be used within WizardProvider'); return v; };

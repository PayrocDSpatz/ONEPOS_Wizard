import React, { useState } from 'react';
import { WizardProvider } from './context/WizardContext';
import { StepHeader } from './components/StepHeader';
import { IntroStep } from './steps/IntroStep';
import { BasicsStep } from './steps/BasicsStep';
import { HardwareStep } from './steps/HardwareStep';
import { PricingStep } from './steps/PricingStep';
import { ReviewStep } from './steps/ReviewStep';

const steps = [
  { key: 'intro', title: 'Welcome', node: <IntroStep/> },
  { key: 'basics', title: 'Business Basics', node: <BasicsStep/> },
  { key: 'hardware', title: 'Hardware Needs', node: <HardwareStep/> },
  { key: 'pricing', title: 'Processing & Pricing', node: <PricingStep/> },
  { key: 'review', title: 'Review & Export', node: <ReviewStep/> },
] as const;

export default function App() {
  const [step, setStep] = useState(0);
  return (
    <WizardProvider>
      <div className="max-w-5xl mx-auto p-6 space-y-6 bg-white text-black rounded-xl border border-gray-200 shadow-sm">
        <StepHeader step={step} total={steps.length} />
        {steps[step].node}
        <div className="flex items-center justify-between pt-4">
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Back</button>
          <div className="flex gap-3">
            <span className="self-center text-sm text-black">Step {step + 1} of {steps.length}</span>
            <button onClick={()=>setStep(s=>Math.min(steps.length-1,s+1))} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">{step<steps.length-1? 'Next':'Finish'}</button>
          </div>
        </div>
      </div>
    </WizardProvider>
  );
}

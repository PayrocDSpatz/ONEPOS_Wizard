import React from 'react';
export const StepHeader: React.FC<{ step:number; total:number }> = ({ step, total }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-black">ONEPOS Hardware Eligibility</h1>
      <p className="text-base md:text-lg text-black font-medium">Consultative discovery to assess low/no-cost placement viability.</p>
    </div>
    <span className="text-sm text-black rounded-full bg-gray-100 px-2 py-1">Step {step + 1} / {total}</span>
  </div>
);

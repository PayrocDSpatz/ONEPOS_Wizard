import React from 'react';
export const Field: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5 text-base">
    <span className="inline-block max-w-max rounded-md px-2 py-0.5 bg-white text-black border border-gray-300 shadow-sm text-[16px] md:text-[18px] font-semibold">{label}</span>
    {children}
  </label>
);

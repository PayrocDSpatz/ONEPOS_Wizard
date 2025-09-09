import React from 'react';
export const SelectField: React.FC<{ value:any; onChange:(v:any)=>void; options:{id:string; name:string;}[]; }> = ({ value, onChange, options }) => (
  <select className="h-12 rounded-lg border border-gray-400 px-3 bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={value} onChange={(e)=>onChange(e.target.value)}>
    {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
  </select>
);

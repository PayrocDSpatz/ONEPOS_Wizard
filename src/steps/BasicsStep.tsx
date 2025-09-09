import React from 'react';
import { Field } from '../components/Field';
import { NumberField } from '../components/NumberField';
import { SelectField } from '../components/SelectField';
import { useWizard } from '../context/WizardContext';
import { ENTITY_TYPES, RESTAURANT_TYPES, CUISINE_OPTIONS } from '../constants';
import { toNum } from '../utils';

export const BasicsStep: React.FC = () => {
  const { biz, setBiz, processing, setProcessing, derived } = useWizard();
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Entity Type"><SelectField value={biz.entityType} onChange={(v)=>setBiz({ ...biz, entityType: v as any })} options={ENTITY_TYPES} /></Field>
        <Field label="Restaurant Type"><SelectField value={biz.type} onChange={(v)=>setBiz({ ...biz, type: v as any })} options={RESTAURANT_TYPES} /></Field>
        <Field label="Cuisine / Concept"><SelectField value={biz.cuisine} onChange={(v)=>setBiz({ ...biz, cuisine: v as any })} options={CUISINE_OPTIONS} /></Field>
        <Field label="Locations"><NumberField value={biz.locations} onChange={(v)=>setBiz({ ...biz, locations: v })} onCommit={(v)=>setBiz({ ...biz, locations: toNum(v,0) })} /></Field>
        <Field label="Opening Date (if new)"><input className="h-12 rounded-lg border border-gray-400 px-3 text-[16px] bg-white text-black" type="date" value={biz.openDate} onChange={(e)=>setBiz({ ...biz, openDate: e.target.value })} /></Field>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Field label="Monthly Card Volume ($)"><NumberField value={processing.monthlyVolume} onChange={(v)=>setProcessing({ ...processing, monthlyVolume: v })} onCommit={(v)=>setProcessing({ ...processing, monthlyVolume: toNum(v,0) })} /></Field>
        <Field label="Average Ticket ($)"><NumberField value={processing.averageTicket} onChange={(v)=>setProcessing({ ...processing, averageTicket: v })} onCommit={(v)=>setProcessing({ ...processing, averageTicket: toNum(v,0) })} /></Field>
        <Field label="Card-Present Mix (%)"><NumberField value={Math.round(Number(processing.cardPresentPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, cardPresentPct: v })} onCommit={(v)=>setProcessing({ ...processing, cardPresentPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} /></Field>
        <Field label="Est. Transactions / Month"><div className="h-12 rounded-lg border px-3 flex items-center bg-gray-50 text-[16px]">{derived.tx.toLocaleString()}</div></Field>
      </div>
    </div>
  );
};

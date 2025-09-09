import React from 'react';
import { Field } from '../components/Field';
import { NumberField } from '../components/NumberField';
import { useWizard } from '../context/WizardContext';
import { toNum } from '../utils';

export const PricingStep: React.FC = () => {
  const { processing, setProcessing, derived } = useWizard();
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Pricing Model">
          <select className="h-10 rounded-lg border px-3" value={processing.pricingModel} onChange={(e)=>setProcessing({ ...processing, pricingModel: (e.target as HTMLSelectElement).value as any })}>
            <option value="interchange">Interchange-Plus (IC+)</option>
            <option value="flatrate">Flat Rate</option>
          </select>
        </Field>
        <Field label="Monthly Fees Billed via Processor ($)">
          <NumberField value={processing.monthlyFeesToMerchant} onChange={(v)=>setProcessing({ ...processing, monthlyFeesToMerchant: v })} onCommit={(v)=>setProcessing({ ...processing, monthlyFeesToMerchant: toNum(v,0) })} />
        </Field>
      </div>

      {processing.pricingModel === 'interchange' ? (
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Markup (bps)"><NumberField value={processing.markupBps} onChange={(v)=>setProcessing({ ...processing, markupBps: v })} onCommit={(v)=>setProcessing({ ...processing, markupBps: toNum(v,0) })} /></Field>
          <Field label="Per-Item Markup ($)"><NumberField value={processing.markupPerItem} onChange={(v)=>setProcessing({ ...processing, markupPerItem: v })} onCommit={(v)=>setProcessing({ ...processing, markupPerItem: toNum(v,0) })} /></Field>
          <Field label="Card-Present Mix (%)"><NumberField value={Math.round(Number(processing.cardPresentPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, cardPresentPct: v })} onCommit={(v)=>setProcessing({ ...processing, cardPresentPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} /></Field>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Flat %">
            <NumberField
              value={processing.flatPctEditing ?? (Number(processing.flatPct)*100).toString()}
              onChange={(v)=>setProcessing({ ...processing, flatPctEditing: v })}
              onCommit={(v)=>{ const num = Math.min(100, Math.max(0, toNum(v,0))); setProcessing({ ...processing, flatPct: num/100, flatPctEditing: undefined }); }}
            />
          </Field>
          <Field label="Per-Item ($)"><NumberField value={processing.flatPerItem} onChange={(v)=>setProcessing({ ...processing, flatPerItem: v })} onCommit={(v)=>setProcessing({ ...processing, flatPerItem: toNum(v,0) })} /></Field>
          <Field label="Card-Present Mix (%)"><NumberField value={Math.round(Number(processing.cardPresentPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, cardPresentPct: v })} onCommit={(v)=>setProcessing({ ...processing, cardPresentPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} /></Field>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Agent Revenue Share (%)">
          <NumberField
            value={processing.agentShareEditing ?? (Number(processing.agentShare) * 100).toString()}
            onChange={(v) => setProcessing({ ...processing, agentShareEditing: v })}
            onCommit={(v) => { const num = Math.min(100, Math.max(10, toNum(v, 10))); setProcessing({ ...processing, agentShare: num / 100, agentShareEditing: undefined }); }}
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-6 gap-4 p-4 rounded-lg border bg-gray-50">
        <div><div className="text-sm text-gray-800">Est. Merchant Fees</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.merchantFees)}</div></div>
        <div><div className="text-sm text-gray-800">Est. Network Costs</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.networkCosts)}</div></div>
        <div><div className="text-sm text-gray-800">Gross Profit</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.grossProfit)}</div></div>
        <div><div className="text-sm text-gray-800">Transactions</div><div className="text-xl font-semibold">{derived.tx.toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-800">Cost % Used</div><div className="text-xl font-semibold">{(derived.costPct*100).toFixed(2)}%</div></div>
        <div><div className="text-sm text-gray-800">Agent Profit</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.agentProfit)}</div></div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 p-4 rounded-lg border bg-gray-50">
        <div><div className="text-sm text-gray-800">Hardware CAPEX</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.capex)}</div></div>
        <div><div className="text-sm text-gray-800">Amortized / Month</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.amort)}</div></div>
        <div><div className="text-sm text-gray-800">Coverage Target</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.coverageTarget)}</div></div>
        <div><div className="text-sm text-gray-800">Required w/ Buffer</div><div className="text-xl font-semibold">{Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(derived.required)}</div></div>
      </div>
    </div>
  );
};

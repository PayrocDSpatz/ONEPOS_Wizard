import React from 'react';
import { Field } from '../components/Field';
import { NumberField } from '../components/NumberField';
import { useWizard } from '../context/WizardContext';
import { toNum } from '../utils';
import { currency } from '../utils';

export const HardwareStep: React.FC = () => {
  const { hardware, setHardware, derived } = useWizard();
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[ ['posTerminals','Full Terminal Stations'], ['terminalOnlyUnits','Terminal-Only Units'], ['receiptPrinters','Receipt Printers'], ['kitchenPrinters','Kitchen Printers'], ['handhelds','Tablets (w/ reader)'], ['kdsUnits','KDS Controllers'], ['cashDrawers','Cash Drawers'], ['scanners','Barcode Scanners'] ].map(([k,label]: any) => (
          <Field key={k} label={label}>
            <NumberField value={(hardware as any)[k]} onChange={(v)=>setHardware({ ...hardware, [k]: v } as any)} onCommit={(v)=>setHardware({ ...hardware, [k]: toNum(v,0) } as any)} />
          </Field>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-4 p-4 rounded-lg border bg-gray-50">
        {Object.entries(hardware.pricing).map(([k,v]) => {
          const nice = k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
          const isInstall = k === 'installTraining';
          return (
            <div key={k} className={isInstall ? 'p-3 rounded-lg border border-red-500 bg-red-50' : ''}>
              <Field label={isInstall ? (<span className="text-red-700">Install &amp; Training</span>) : nice}>
                <div className="flex items-center gap-3">
                  <NumberField value={v as any} onChange={(val)=>setHardware({ ...hardware, pricing: { ...hardware.pricing, [k]: val } })} onCommit={(val)=>setHardware({ ...hardware, pricing: { ...hardware.pricing, [k]: toNum(val,0) } })} />
                  {isInstall && (
                    <label className="flex items-center gap-2 text-sm text-red-700">
                      <input type="checkbox" checked={!!hardware.includeInstallTraining} onChange={(e)=>setHardware({ ...hardware, includeInstallTraining: (e.target as HTMLInputElement).checked })} />
                      <span>Include in CAPEX</span>
                    </label>
                  )}
                </div>
              </Field>
            </div>
          );
        })}
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Field label="Amortization Term (months)">
          <select className="h-10 rounded-lg border px-3" value={hardware.amortTermMonths} onChange={(e)=>setHardware({ ...hardware, amortTermMonths: toNum(e.target.value,30) })}>
            {[24,30,36,48].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Include Software in Coverage">
          <div className="h-12 flex items-center gap-3">
            <input type="checkbox" checked={!!hardware.includeSoftwareInCoverage} onChange={(e)=>setHardware({ ...hardware, includeSoftwareInCoverage: (e.target as HTMLInputElement).checked })} />
            <span className="text-base md:text-lg text-black font-medium">Adds software monthly to coverage target</span>
          </div>
        </Field>
        <Field label="Software Monthly ($)">
          <div className="h-12 rounded-lg border px-3 flex items-center bg-gray-50 text-[16px]">{currency(derived.softwareMonthly)}</div>
          <div className="text-sm md:text-base text-gray-800">Auto: $59 per Full/Terminal-Only/Tablet; $59 for first KDS + $10 each add’l.</div>
        </Field>
        <Field label="Risk Buffer (%)">
          <NumberField value={Math.round(Number(hardware.bufferPct||0)*100)} onChange={(v)=>setHardware({ ...hardware, bufferPct: v as any })} onCommit={(v)=>setHardware({ ...hardware, bufferPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} />
        </Field>
      </div>
      <div className="grid md:grid-cols-4 gap-4 p-4 rounded-lg border bg-gray-50">
        <div><div className="text-sm text-gray-800">Hardware CAPEX</div><div className="text-xl font-semibold">{currency(derived.capex)}</div></div>
        <div><div className="text-sm text-gray-800">Amortized / Month</div><div className="text-xl font-semibold">{currency(derived.amort)}</div></div>
        <div><div className="text-sm text-gray-800">Coverage Target</div><div className="text-xl font-semibold">{currency(derived.coverageTarget)}</div></div>
        <div><div className="text-sm text-gray-800">Required w/ Buffer</div><div className="text-xl font-semibold">{currency(derived.required)}</div></div>
      </div>
    </div>
  );
};

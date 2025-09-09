import React from 'react';
import { useWizard } from '../context/WizardContext';
import { Field } from '../components/Field';
import { currency } from '../utils';

export const ReviewStep: React.FC = () => {
  const { derived, hardware, notes, setNotes, biz, processing } = useWizard();
  const lead = {
    ...biz, ...processing, ...hardware,
    EstTransactions: derived.tx,
    MerchantFeesCollected: derived.merchantFees,
    NetworkCosts: derived.networkCosts,
    GrossProfit: derived.grossProfit,
    HardwareCAPEX: derived.capex,
    HardwareAmortizedMonthly: derived.amort,
    SoftwareMonthly: derived.softwareMonthly,
    CoverageTargetMonthly: derived.coverageTarget,
    RequiredWithBuffer: derived.required,
    Eligibility: derived.eligibility,
    AgentProfit: derived.agentProfit,
    NetAgentProfit: derived.agentProfit - derived.coverageTarget,
    Notes: notes,
  } as Record<string, any>;
  function exportCsvTab(lead: Record<string, any>) {
    const headers = Object.keys(lead);
    const values = headers.map((h) => JSON.stringify(lead[h] ?? ''));
    const csv = headers.join(',') + '\n' + values.join(',');
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const opened = window.open(dataUri, '_blank'); if (!opened) alert('Pop-up blocked. Allow pop-ups to open the CSV.');
  }
  async function exportResults(){
    const safeName = 'onepos_lead'; try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet([lead]);
      XLSX.utils.book_append_sheet(wb, sheet, 'ONEPOS Lead');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = safeName + '.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 500);
    } catch {
      exportCsvTab(lead);
    }
  }
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg border bg-gray-50">
        <div><div className="text-sm text-gray-800">Agent Profit</div><div className="text-xl font-semibold">{currency(derived.agentProfit)}</div></div>
        <div><div className="text-sm text-gray-800">Coverage Target</div><div className="text-xl font-semibold">{currency(derived.coverageTarget)}</div></div>
        <div><div className="text-sm text-gray-800">Net Agent Profit (Monthly)</div><div className="text-xl font-semibold">{currency(derived.agentProfit - derived.coverageTarget)}</div></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg border bg-gray-50">
        <div><div className="text-sm text-gray-800">Agent Profit (Monthly)</div><div className="text-xl font-semibold">{currency(derived.agentProfit)}</div></div>
        <div><div className="text-sm text-gray-800">Coverage Target (No Software)</div><div className="text-xl font-semibold">{currency(derived.coverageTargetNoSoftware)}</div></div>
        <div><div className="text-sm text-gray-800">Net Agent Profit (No Software)</div><div className="text-xl font-semibold">{currency(derived.agentProfit - derived.coverageTargetNoSoftware)}</div></div>
      </div>
      {(derived.agentProfit - derived.coverageTarget) > 0 ? (
        <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">The agent can cover the monthly hardware &amp; software cost and still retain a profit.</div>
      ) : (
        <div className="p-3 rounded-md bg-amber-50 text-amber-700 text-sm">At the current share, monthly agent profit does not fully cover the hardware &amp; software cost.</div>
      )}
      {!hardware.includeInstallTraining && (
        <div className="p-3 rounded-md bg-rose-50 text-rose-700 text-sm">Note: Install &amp; Training is excluded from CAPEX and must be paid separately by the Merchant.</div>
      )}
      <Field label="Internal Notes">
        <textarea className="min-h-[80px] rounded-lg border border-gray-400 px-3 py-2 text-[16px] w-full bg-white text-black" value={notes} onChange={(e)=>setNotes((e.target as HTMLTextAreaElement).value)} />
      </Field>
      <div className="flex gap-3">
        <button onClick={exportResults} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export to Excel</button>
        <button onClick={()=>exportCsvTab(lead)} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export CSV (open tab)</button>
        <button onClick={()=>window.location.reload()} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Reset</button>
      </div>
    </div>
  );
};

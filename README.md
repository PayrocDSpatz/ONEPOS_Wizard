# ONEPOS_Wizard
Initial code for wizard without additional prompts to collect merchant data
import React, { useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------
const currency = (n: number | string) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Robust download helper for sandboxed environments (e.g., canvas, Safari)
const triggerDownload = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener noreferrer";
    const supportsDownload = ("download" in HTMLAnchorElement.prototype) as any;
    if (supportsDownload) {
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } else {
      // iOS Safari and some webviews ignore the download attribute
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  } catch (e) {
    try {
      // Last‑ditch: open a data URL if Blob/URL fails
      const reader = new FileReader();
      reader.onload = () => {
        const opened = window.open(reader.result as string, "_blank");
        if (!opened) alert("Pop‑up blocked. Please allow pop‑ups to download the file.");
      };
      reader.readAsDataURL(blob);
    } catch (_) {
      alert("Download was blocked by the browser. Please allow downloads/pop‑ups for this page.");
    }
  }
};

// Clipboard helper that works under Permissions-Policy blocks
const safeCopy = async (text: string, downloadName = 'onepos_lead.json') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      alert('JSON copied to clipboard.');
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        alert('JSON copied (fallback).');
        return true;
      }
      throw new Error('execCommand copy failed');
    } catch (e2) {
      // Final fallback: download a .json file instead
      try {
        const blob = new Blob([text], { type: 'application/json;charset=utf-8;' });
        triggerDownload(blob, downloadName);
        alert('Clipboard is blocked here. Downloaded a .json file instead.');
      } catch (_) {
        alert('Clipboard is blocked and download failed. Please use Export CSV (open tab).');
      }
      return false;
    }
  }
};

// Alternate explicit CSV exporter that opens in a new tab (bypasses download attr)
function exportCsvTab(lead: Record<string, any>, filename: string) {
  const headers = Object.keys(lead);
  const values = headers.map((h) => JSON.stringify(lead[h] ?? ""));
  const csv = headers.join(",") + "\n" + values.join(",");

  try {
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const opened = window.open(dataUri, "_blank");
    if (!opened) alert("Pop-up blocked. Allow pop-ups to open the CSV.");
  } catch (e) {
    console.error(e);
    alert("Couldn't open CSV in a new tab. Use Copy JSON as a fallback.");
  }
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------
const RESTAURANT_TYPES = [
  { id: "quick", name: "Quick Service / QSR" },
  { id: "fastcasual", name: "Fast Casual" },
  { id: "casual", name: "Casual Dining" },
  { id: "finedining", name: "Fine Dining" },
  { id: "takeout", name: "Takeout / Ghost Kitchen" },
  { id: "bar", name: "Bar / Nightlife" },
  { id: "coffee", name: "Coffee / Bakery" },
  { id: "foodtruck", name: "Food Truck" },
];

const ENTITY_TYPES = [
  { id: "Corporation", name: "Corporation" },
  { id: "LLC", name: "LLC" },
  { id: "Sole Proprietor", name: "Sole Proprietor" },
  { id: "501C", name: "501C" },
  { id: "Partnership", name: "Partnership" },
  { id: "Government/Municipality", name: "Government/Municipality" },
];

const CUISINE_OPTIONS = [
  { id: "American", name: "American" },
  { id: "BBQ", name: "BBQ" },
  { id: "Chinese", name: "Chinese" },
  { id: "Indian", name: "Indian" },
  { id: "Italian", name: "Italian" },
  { id: "Japanese", name: "Japanese" },
  { id: "Mediterranean", name: "Mediterranean" },
  { id: "Mexican", name: "Mexican" },
  { id: "Seafood", name: "Seafood" },
  { id: "Steakhouse", name: "Steakhouse" },
  { id: "Thai", name: "Thai" },
  { id: "Other", name: "Other" },
];

const DEFAULT_COST_ASSUMPTIONS: Record<string, { basePct: number; assessmentsPct: number; perItem: number; }> = {
  quick: { basePct: 0.0175, assessmentsPct: 0.0013, perItem: 0.10 },
  fastcasual: { basePct: 0.0175, assessmentsPct: 0.0013, perItem: 0.10 },
  casual: { basePct: 0.0190, assessmentsPct: 0.0013, perItem: 0.10 },
  finedining: { basePct: 0.0205, assessmentsPct: 0.0013, perItem: 0.10 },
  takeout: { basePct: 0.0190, assessmentsPct: 0.0013, perItem: 0.12 },
  bar: { basePct: 0.0195, assessmentsPct: 0.0013, perItem: 0.10 },
  coffee: { basePct: 0.0170, assessmentsPct: 0.0013, perItem: 0.09 },
  foodtruck: { basePct: 0.0185, assessmentsPct: 0.0013, perItem: 0.10 },
};

const DEFAULT_HARDWARE_PRICING = {
  // New pricing (Full Station tiered + others)
  posTerminalFirst: 2999,
  posTerminalAdditional: 2499,
  terminalOnly: 1495,
  handheld: 800, // Tablet w/ case + reader
  kitchenPrinter: 425,
  receiptPrinter: 0, // not specified; set to 0
  kds: 675, // KDS Controller + Bump Bar
  cashDrawer: 149,
  scanner: 0, // not specified; set to 0
  installTraining: 995,
};

// -----------------------------------------------------------------------------
// Calculator
// -----------------------------------------------------------------------------
function computeDerived(biz: any, processing: any, hardware: any) {
  const vol = toNum(processing.monthlyVolume, 0);
  const avg = Math.max(1, toNum(processing.averageTicket, 1));
  const tx = Math.max(1, Math.round(vol / avg));

  const cpRaw = toNum(processing.cardPresentPct, 0.95);
  const cp = cpRaw > 1 ? clamp01(cpRaw / 100) : clamp01(cpRaw); // accept % or 0–1

  const base = processing.useDefaultCosts
    ? DEFAULT_COST_ASSUMPTIONS[biz.type] || DEFAULT_COST_ASSUMPTIONS["fastcasual"]
    : {
        basePct: toNum(processing.customCosts.basePct, 0.019),
        assessmentsPct: toNum(processing.customCosts.assessmentsPct, 0.0013),
        perItem: toNum(processing.customCosts.perItem, 0.10),
      };

  const blendedPerItem = base.perItem * (0.8 * cp + 1 * (1 - cp));
  const costPct = (base.basePct + base.assessmentsPct) * (0.85 * cp + 1 * (1 - cp));

  const merchantFees =
    processing.pricingModel === "interchange"
      ? vol * (costPct + toNum(processing.markupBps) / 10000) + tx * (blendedPerItem + toNum(processing.markupPerItem)) + toNum(processing.monthlyFeesToMerchant)
      : vol * toNum(processing.flatPct) + tx * toNum(processing.flatPerItem) + toNum(processing.monthlyFeesToMerchant);

  const networkCosts = vol * costPct + tx * blendedPerItem;
  const grossProfit = Math.max(0, merchantFees - networkCosts);

  // Agent profit (based on percent entered in Step 5)
  const agentShare = clamp01(toNum(processing.agentShare, 0.5));
  const agentProfit = grossProfit * agentShare;

  const p = hardware.pricing;
  const posCount = toNum(hardware.posTerminals, 0);
  const capex =
    (hardware.includeInstallTraining ? toNum(p.installTraining) : 0) +
    (posCount > 0 ? toNum(p.posTerminalFirst) + Math.max(0, posCount - 1) * toNum(p.posTerminalAdditional) : 0) +
    toNum(hardware.terminalOnlyUnits) * toNum(p.terminalOnly) +
    toNum(hardware.receiptPrinters) * toNum(p.receiptPrinter) +
    toNum(hardware.kitchenPrinters) * toNum(p.kitchenPrinter) +
    toNum(hardware.handhelds) * toNum(p.handheld) +
    toNum(hardware.kdsUnits) * toNum(p.kds) +
    toNum(hardware.cashDrawers) * toNum(p.cashDrawer) +
    toNum(hardware.scanners) * toNum(p.scanner);

  const amort = capex / Math.max(1, toNum(hardware.amortTermMonths, 30));
  // Auto-calc software monthly: $59 per Full/Terminal-Only/Tablet; $59 for first KDS + $10 each additional
  const kdsCount = toNum(hardware.kdsUnits, 0);
  const softwareMonthly =
    59 * (toNum(hardware.posTerminals,0) + toNum(hardware.terminalOnlyUnits,0) + toNum(hardware.handhelds,0)) +
    (kdsCount > 0 ? 59 + Math.max(0, kdsCount - 1) * 10 : 0);
  const coverageTarget = amort + (hardware.includeSoftwareInCoverage ? softwareMonthly : 0);
  const required = coverageTarget * (1 + toNum(hardware.bufferPct, 0.3));

  let eligibility = "Review";
  if (grossProfit >= required) eligibility = "Eligible: No‑Cost Hardware";
  else if (grossProfit >= coverageTarget * 0.6) eligibility = "Eligible: Low‑Cost / Subsidized";
  else eligibility = "Not Eligible (Revise Deal)";

  return { tx, costPct, blendedPerItem, merchantFees, networkCosts, grossProfit, capex, amort, softwareMonthly, coverageTargetNoSoftware: amort, coverageTarget, required, eligibility, agentProfit };
}

// -----------------------------------------------------------------------------
// Light runtime tests (non-blocking)
// -----------------------------------------------------------------------------
(function runSelfTests(){
  const approx = (a:number,b:number,tol=1e-6)=>Math.abs(a-b)<=tol;
  // IC+ profit should equal markup on volume + per-item markup + monthly fees
  const tBiz:any = { type: 'fastcasual' };
  const tProc:any = { monthlyVolume: 100000, averageTicket: 50, cardPresentPct: 1, pricingModel: 'interchange', markupBps: 50, markupPerItem: 0.05, monthlyFeesToMerchant: 10, useDefaultCosts: true };
  const tHw:any = { posTerminals: 0, terminalOnlyUnits:0, receiptPrinters:0, kitchenPrinters:0, handhelds:0, kdsUnits:0, cashDrawers:0, scanners:0, pricing: DEFAULT_HARDWARE_PRICING, amortTermMonths:36, includeSoftwareInCoverage:true, bufferPct:0.3, includeInstallTraining:true };
  const d = computeDerived(tBiz, tProc, tHw);
  const tx = Math.round(100000/50);
  const expectedGross = (100000*(50/10000)) + (tx*0.05) + 10; // markup on vol + per item + monthly fee
  console.assert(approx(d.grossProfit, expectedGross), 'Gross profit formula (IC+) check failed');

  // Software monthly calc
  const hw2:any = { ...tHw, posTerminals:1, terminalOnlyUnits:1, handhelds:2, kdsUnits:3 };
  const d2 = computeDerived(tBiz, tProc, hw2);
  const expectedSoft = 59*(1+1+2) + (59 + (3-1)*10);
  console.assert(approx(d2.softwareMonthly, expectedSoft), 'Software monthly calc failed');

  // Coverage target (no software) equals amort
  console.assert(approx(d2.coverageTargetNoSoftware, d2.amort), 'coverageTargetNoSoftware should equal amort');
})();

// -----------------------------------------------------------------------------
// Small building blocks (plain HTML + Tailwind)
// -----------------------------------------------------------------------------
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-base">
      <span className="inline-block max-w-max rounded-md px-2 py-0.5 bg-white text-black border border-gray-300 shadow-sm text-[16px] md:text-[18px] font-semibold">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ value, onChange, onCommit, step = "any", placeholder }:{ value: any; onChange: (v:string)=>void; onCommit?: (v:string)=>void; step?: string; placeholder?: string; }) {
  return (
    <input
      className="h-12 rounded-lg border border-gray-400 px-3 text-[16px] bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      type="text"
      inputMode="decimal"
      step={step}
      value={String(value ?? "")}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit && onCommit(e.target.value)}
    />
  );
}

function TextField({ value, onChange, placeholder }:{ value: any; onChange: (v:string)=>void; placeholder?: string; }) {
  return (
    <input
      className="h-12 rounded-lg border border-gray-400 px-3 text-[16px] bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SelectField({ value, onChange, options }:{ value:any; onChange:(v:any)=>void; options:{id:string; name:string;}[] }) {
  return (
    <select
      className="h-12 rounded-lg border border-gray-400 px-3 bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

// -----------------------------------------------------------------------------
// Main App
// -----------------------------------------------------------------------------
export default function App() {
  const [step, setStep] = useState(0);

  const [biz, setBiz] = useState({
    entityType: "LLC",
    locations: 1,
    type: "fastcasual",
    cuisine: "Other",
    cuisineOther: "NONE",
    openDate: "",
  });

  const [processing, setProcessing] = useState({
    monthlyVolume: 80000,
    averageTicket: 38,
    cardPresentPct: 0.95,
    pricingModel: "flatrate", // default Flat Rate
    markupBps: 35,
    markupPerItem: 0.06,
    flatPct: 0.04,
    flatPctEditing: undefined as any,
    flatPerItem: 0.1,
    monthlyFeesToMerchant: 0,
    useDefaultCosts: true,
    customCosts: { basePct: 0.019, assessmentsPct: 0.0013, perItem: 0.1 },
    agentShare: 0.5,
    agentShareEditing: undefined as any,
  });

  const [hardware, setHardware] = useState({
    posTerminals: 1,
    terminalOnlyUnits: 0,
    receiptPrinters: 0,
    kitchenPrinters: 1,
    handhelds: 2,
    kdsUnits: 1,
    cashDrawers: 0,
    scanners: 0,
    pricing: { ...DEFAULT_HARDWARE_PRICING },
    amortTermMonths: 30,
    includeSoftwareInCoverage: true,
    softwareMonthly: 129 * 2,
    bufferPct: 0.3,
    includeInstallTraining: true,
  });

  const [notes, setNotes] = useState("");

  const steps = [
    { key: "intro", title: "Welcome", blurb: "A quick, focused intro to gather defaults." },
    { key: "basics", title: "Business Basics", blurb: "Tell me about the concept and trade profile." },
    { key: "hardware", title: "Hardware Needs", blurb: "Let’s map stations and back‑of‑house." },
    { key: "pricing", title: "Processing & Pricing", blurb: "How are fees structured today?" },
    { key: "review", title: "Review & Export", blurb: "We’ll calculate coverage and next steps." },
  ];

  const derived = useMemo(() => computeDerived(biz, processing, hardware), [biz, processing, hardware]);

  function makeLead() {
    return {
      EntityType: biz.entityType,
      Locations: biz.locations,
      RestaurantType: RESTAURANT_TYPES.find((t) => t.id === biz.type)?.name || biz.type,
      Cuisine: biz.cuisine,
      OpenDate: biz.openDate,
      MonthlyVolume: processing.monthlyVolume,
      AverageTicket: processing.averageTicket,
      EstTransactions: derived.tx,
      CardPresentPct: processing.cardPresentPct,
      PricingModel: processing.pricingModel,
      MarkupBps: processing.markupBps,
      MarkupPerItem: processing.markupPerItem,
      FlatPct: processing.flatPct,
      FlatPerItem: processing.flatPerItem,
      MonthlyFeesToMerchant: processing.monthlyFeesToMerchant,
      CostPctUsed: derived.costPct,
      NetworkPerItemCost: derived.blendedPerItem,
      MerchantFeesCollected: derived.merchantFees,
      NetworkCosts: derived.networkCosts,
      GrossProfit: derived.grossProfit,
      POS_Terminals: hardware.posTerminals,
      TerminalOnly_Units: hardware.terminalOnlyUnits,
      Receipt_Printers: hardware.receiptPrinters,
      Kitchen_Printers: hardware.kitchenPrinters,
      Handhelds: hardware.handhelds,
      KDS_Units: hardware.kdsUnits,
      CashDrawers: hardware.cashDrawers,
      Scanners: hardware.scanners,
      UnitCost_FullStation_First: hardware.pricing.posTerminalFirst,
      UnitCost_FullStation_Additional: hardware.pricing.posTerminalAdditional,
      UnitCost_TerminalOnly: hardware.pricing.terminalOnly,
      UnitCost_ReceiptPrinter: hardware.pricing.receiptPrinter,
      UnitCost_KitchenPrinter: hardware.pricing.kitchenPrinter,
      UnitCost_Tablet: hardware.pricing.handheld,
      UnitCost_KDSController: hardware.pricing.kds,
      UnitCost_CashDrawer: hardware.pricing.cashDrawer,
      UnitCost_Scanner: hardware.pricing.scanner,
      InstallTraining: hardware.pricing.installTraining,
      IncludeInstallTraining: hardware.includeInstallTraining,
      HardwareCAPEX: derived.capex,
      HardwareAmortizedMonthly: derived.amort,
      AmortTermMonths: hardware.amortTermMonths,
      SoftwareMonthly: derived.softwareMonthly,
      IncludeSoftwareInCoverage: hardware.includeSoftwareInCoverage,
      BufferPct: hardware.bufferPct,
      CoverageTargetMonthly: derived.coverageTarget,
      RequiredWithBuffer: derived.required,
      Eligibility: derived.eligibility,
      AgentSharePct: Math.round(Number(processing.agentShare||0)*100),
      AgentProfit: derived.agentProfit,
      NetAgentProfit: derived.agentProfit - derived.coverageTarget,
      Notes: notes,
    };
  }

  async function exportResults() {
    const safeName = "onepos_lead";
    const lead = makeLead();

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet([lead]);
      XLSX.utils.book_append_sheet(wb, sheet, "ONEPOS Lead");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      triggerDownload(blob, `${safeName}.xlsx`);
    } catch (err) {
      const headers = Object.keys(lead);
      const values = headers.map((h) => JSON.stringify(lead[h] ?? ""));
     const csv = headers.join(",") + "\n" + values.join(",");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `${safeName}.csv`);
    }
  }

  function StepHeader() {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-black">ONEPOS Hardware Eligibility</h1>
          <p className="text-base md:text-lg text-black font-medium">Consultative discovery to assess low/no‑cost placement viability.</p>
        </div>
        <span className="text-sm text-black rounded-full bg-gray-100 px-2 py-1">Step {step + 1} / {steps.length}</span>
      </div>
    );
  }

  const view = (() => {
    switch (steps[step].key) {
      case "intro":
        return (
          <div className="space-y-6">
            <p className="text-base md:text-lg text-black">
              I’ll ask a few focused questions about volume, average ticket, concept, and hardware layout. Then I’ll estimate
              processing profitability to see if a <b>no‑cost</b> or <b>low‑cost</b> hardware placement is viable.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Restaurant Type">
                <SelectField value={biz.type} onChange={(v) => setBiz({ ...biz, type: v })} options={RESTAURANT_TYPES} />
              </Field>
              <Field label="Est. Monthly Card Volume ($)">
                <NumberField
                  value={processing.monthlyVolume}
                  onChange={(v) => setProcessing({ ...processing, monthlyVolume: v })}
                  onCommit={(v) => setProcessing({ ...processing, monthlyVolume: toNum(v, 0) })}
                />
              </Field>
              <Field label="Average Ticket ($)">
                <NumberField
                  value={processing.averageTicket}
                  onChange={(v) => setProcessing({ ...processing, averageTicket: v })}
                  onCommit={(v) => setProcessing({ ...processing, averageTicket: toNum(v, 0) })}
                />
              </Field>
            </div>
          </div>
        );

      case "basics":
        return (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Entity Type"><SelectField value={biz.entityType || "LLC"} onChange={(v) => setBiz({ ...biz, entityType: v })} options={ENTITY_TYPES} /></Field>
              <Field label="Restaurant Type"><SelectField value={biz.type} onChange={(v) => setBiz({ ...biz, type: v })} options={RESTAURANT_TYPES} /></Field>
              <Field label="Cuisine / Concept"><SelectField value={biz.cuisine} onChange={(v) => setBiz({ ...biz, cuisine: v })} options={CUISINE_OPTIONS} /></Field>
              <Field label="Locations">
                <NumberField value={biz.locations} onChange={(v) => setBiz({ ...biz, locations: v })} onCommit={(v) => setBiz({ ...biz, locations: toNum(v, 0) })} />
              </Field>
              <Field label="Opening Date (if new)"><input className="h-12 rounded-lg border border-gray-400 px-3 text-[16px] bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" type="date" value={biz.openDate} onChange={(e) => setBiz({ ...biz, openDate: e.target.value })} /></Field>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <Field label="Monthly Card Volume ($)"><NumberField value={processing.monthlyVolume} onChange={(v) => setProcessing({ ...processing, monthlyVolume: v })} onCommit={(v) => setProcessing({ ...processing, monthlyVolume: toNum(v, 0) })} /></Field>
              <Field label="Average Ticket ($)"><NumberField value={processing.averageTicket} onChange={(v) => setProcessing({ ...processing, averageTicket: v })} onCommit={(v) => setProcessing({ ...processing, averageTicket: toNum(v, 0) })} /></Field>
              <Field label="Card‑Present Mix (%)">
                <NumberField
                  value={Math.round(Number(processing.cardPresentPct || 0) * 100)}
                  onChange={(v) => setProcessing({ ...processing, cardPresentPct: v })}
                  onCommit={(v) => setProcessing({ ...processing, cardPresentPct: Math.min(100, Math.max(0, toNum(v, 0))) / 100 })}
                />
              </Field>
              <Field label="Est. Transactions / Month">
                <div className="h-12 rounded-lg border px-3 flex items-center bg-gray-50 text-[16px]">{derived.tx.toLocaleString()}</div>
              </Field>
            </div>
          </div>
        );

      case "hardware":
        return (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[ ["posTerminals","Full Terminal Stations"], ["terminalOnlyUnits","Terminal-Only Units"], ["receiptPrinters","Receipt Printers"], ["kitchenPrinters","Kitchen Printers"], ["handhelds","Tablets (w/ reader)"], ["kdsUnits","KDS Controllers"], ["cashDrawers","Cash Drawers"], ["scanners","Barcode Scanners"] ].map(([k,label]: any) => (
                <Field key={k} label={label}>
                  <NumberField value={(hardware as any)[k]} onChange={(v) => setHardware({ ...hardware, [k]: v } as any)} onCommit={(v) => setHardware({ ...hardware, [k]: toNum(v, 0) } as any)} />
                </Field>
              ))}
            </div>
            <div className="grid md:grid-cols-4 gap-4 p-4 rounded-lg border bg-gray-50">
              {Object.entries(hardware.pricing).map(([k,v]) => {
                const nice = k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
                const isInstall = k === "installTraining";
                return (
                  <div key={k} className={isInstall ? "p-3 rounded-lg border border-red-500 bg-red-50" : ""}>
                    <Field label={isInstall ? (<span className="text-red-700">Install &amp; Training</span>) : nice}>
                      <div className="flex items-center gap-3">
                        <NumberField value={v as any} onChange={(val) => setHardware({ ...hardware, pricing: { ...hardware.pricing, [k]: val } })} onCommit={(val) => setHardware({ ...hardware, pricing: { ...hardware.pricing, [k]: toNum(val, 0) } })} />
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
                <select className="h-10 rounded-lg border px-3" value={hardware.amortTermMonths} onChange={(e)=>setHardware({ ...hardware, amortTermMonths: toNum(e.target.value,36) })}>
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

      case "pricing":
        return (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Pricing Model">
                <select className="h-10 rounded-lg border px-3" value={processing.pricingModel} onChange={(e)=>setProcessing({ ...processing, pricingModel: (e.target as HTMLSelectElement).value })}>
                  <option value="interchange">Interchange‑Plus (IC+)</option>
                  <option value="flatrate">Flat Rate</option>
                </select>
              </Field>
              <Field label="Monthly Fees Billed via Processor ($)">
                <NumberField value={processing.monthlyFeesToMerchant} onChange={(v)=>setProcessing({ ...processing, monthlyFeesToMerchant: v })} onCommit={(v)=>setProcessing({ ...processing, monthlyFeesToMerchant: toNum(v,0) })} />
              </Field>
            </div>
            {processing.pricingModel === "interchange" ? (
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Markup (bps)"><NumberField value={processing.markupBps} onChange={(v)=>setProcessing({ ...processing, markupBps: v })} onCommit={(v)=>setProcessing({ ...processing, markupBps: toNum(v,0) })} /></Field>
                <Field label="Per‑Item Markup ($)"><NumberField value={processing.markupPerItem} onChange={(v)=>setProcessing({ ...processing, markupPerItem: v })} onCommit={(v)=>setProcessing({ ...processing, markupPerItem: toNum(v,0) })} /></Field>
                <Field label="Card‑Present Mix (%)"><NumberField value={Math.round(Number(processing.cardPresentPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, cardPresentPct: v })} onCommit={(v)=>setProcessing({ ...processing, cardPresentPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} /></Field>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Flat %">
                  <NumberField
                    value={processing.flatPctEditing ?? (Number(processing.flatPct)*100).toString()}
                    onChange={(v)=>setProcessing({ ...processing, flatPctEditing: v })}
                    onCommit={(v)=>{
                      const num = Math.min(100, Math.max(0, toNum(v,0)));
                      setProcessing({ ...processing, flatPct: num/100, flatPctEditing: undefined });
                    }}
                  />
                </Field>
                <Field label="Per‑Item ($)"><NumberField value={processing.flatPerItem} onChange={(v)=>setProcessing({ ...processing, flatPerItem: v })} onCommit={(v)=>setProcessing({ ...processing, flatPerItem: toNum(v,0) })} /></Field>
                <Field label="Card‑Present Mix (%)"><NumberField value={Math.round(Number(processing.cardPresentPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, cardPresentPct: v })} onCommit={(v)=>setProcessing({ ...processing, cardPresentPct: Math.min(100,Math.max(0,toNum(v,0)))/100 })} /></Field>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Agent Revenue Share (%)">
                <NumberField
                  value={processing.agentShareEditing ?? (Number(processing.agentShare) * 100).toString()}
                  onChange={(v) => setProcessing({ ...processing, agentShareEditing: v })}
                  onCommit={(v) => {
                    const num = Math.min(100, Math.max(10, toNum(v, 10)));
                    setProcessing({ ...processing, agentShare: num / 100, agentShareEditing: undefined });
                  }}
                />
              </Field>
            </div>
            <div className="text-base md:text-lg text-black font-medium">Cost assumptions (override if needed).</div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!processing.useDefaultCosts} onChange={(e)=>setProcessing({ ...processing, useDefaultCosts: (e.target as HTMLInputElement).checked })} />
              <span className="text-sm text-black">Use default network costs by type</span>
            </div>
            <div className={`grid md:grid-cols-3 gap-4 ${processing.useDefaultCosts ? "opacity-60 pointer-events-none" : ""}`}>
              <Field label="Base Cost % (IC + Assessments)"><NumberField value={Math.round(Number(processing.customCosts.basePct||0)*100)} onChange={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, basePct: v } })} onCommit={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, basePct: Math.min(100,Math.max(0,toNum(v,0)))/100 } })} /></Field>
              <Field label="Assessments %"><NumberField value={Math.round(Number(processing.customCosts.assessmentsPct||0)*100)} onChange={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, assessmentsPct: v } })} onCommit={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, assessmentsPct: Math.min(100,Math.max(0,toNum(v,0)))/100 } })} /></Field>
              <Field label="Network Per‑Item ($)"><NumberField value={processing.customCosts.perItem} onChange={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, perItem: v } })} onCommit={(v)=>setProcessing({ ...processing, customCosts: { ...processing.customCosts, perItem: toNum(v,0) } })} /></Field>
            </div>
            <div className="grid md:grid-cols-6 gap-4 p-4 rounded-lg border bg-gray-50">
              <div><div className="text-sm text-gray-800">Est. Merchant Fees</div><div className="text-xl font-semibold">{currency(derived.merchantFees)}</div></div>
              <div><div className="text-sm text-gray-800">Est. Network Costs</div><div className="text-xl font-semibold">{currency(derived.networkCosts)}</div></div>
              <div><div className="text-sm text-gray-800">Gross Profit</div><div className="text-xl font-semibold">{currency(derived.grossProfit)}</div></div>
              <div><div className="text-sm text-gray-800">Transactions</div><div className="text-xl font-semibold">{derived.tx.toLocaleString()}</div></div>
              <div><div className="text-sm text-gray-800">Cost % Used</div><div className="text-xl font-semibold">{(derived.costPct*100).toFixed(2)}%</div></div>
              <div><div className="text-sm text-gray-800">Agent Profit</div><div className="text-xl font-semibold">{currency(derived.agentProfit)}</div></div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 p-4 rounded-lg border bg-gray-50">
              <div><div className="text-sm text-gray-800">Hardware CAPEX</div><div className="text-xl font-semibold">{currency(derived.capex)}</div></div>
              <div><div className="text-sm text-gray-800">Amortized / Month</div><div className="text-xl font-semibold">{currency(derived.amort)}</div></div>
              <div><div className="text-sm text-gray-800">Coverage Target</div><div className="text-xl font-semibold">{currency(derived.coverageTarget)}</div></div>
              <div><div className="text-sm text-gray-800">Required w/ Buffer</div><div className="text-xl font-semibold">{currency(derived.required)}</div></div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            {/* Agent summary */}
            <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg border bg-gray-50">
              <div><div className="text-sm text-gray-800">Agent Profit</div><div className="text-xl font-semibold">{currency(derived.agentProfit)}</div></div>
              <div><div className="text-sm text-gray-800">Coverage Target</div><div className="text-xl font-semibold">{currency(derived.coverageTarget)}</div></div>
              <div><div className="text-sm text-gray-800">Net Agent Profit (Monthly)</div><div className="text-xl font-semibold">{currency(derived.agentProfit - derived.coverageTarget)}</div></div>
            </div>
            {/* Totals (No Software) */}
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
              <div className="p-3 rounded-md bg-rose-50 text-rose-700 text-sm">
                Note: Install &amp; Training ({currency(hardware.pricing.installTraining)}) is excluded from CAPEX and must be paid separately by the Merchant.
              </div>
            )}

            <Field label="Internal Notes">
              <textarea className="min-h-[80px] rounded-lg border border-gray-400 px-3 py-2 text-[16px] w-full bg-white text-black placeholder-gray-500 caret-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={notes} onChange={(e)=>setNotes((e.target as HTMLTextAreaElement).value)} />
            </Field>

            <div className="flex gap-3">
              <button onClick={exportResults} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export to Excel</button>
              <button onClick={()=>exportCsvTab(makeLead(), 'onepos_lead.csv')} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export CSV (open tab)</button>
              <button onClick={()=>safeCopy(JSON.stringify(makeLead(), null, 2))} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Copy JSON</button>
              <button onClick={()=>window.location.reload()} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Reset</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 bg-white text-black rounded-xl border border-gray-200 shadow-sm">
      <StepHeader />

      {/* Step content */}
      {view}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex gap-3">
          <span className="self-center text-sm text-black">Step {step + 1} of {steps.length}</span>
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {step < steps.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}

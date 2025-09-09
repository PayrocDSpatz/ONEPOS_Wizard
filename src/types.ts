export type RestaurantTypeId =
  | 'quick' | 'fastcasual' | 'casual' | 'finedining' | 'takeout' | 'bar' | 'coffee' | 'foodtruck';
export type EntityTypeId =
  | 'Corporation' | 'LLC' | 'Sole Proprietor' | '501C' | 'Partnership' | 'Government/Municipality';
export type CuisineId =
  | 'American' | 'BBQ' | 'Chinese' | 'Indian' | 'Italian' | 'Japanese' | 'Mediterranean' | 'Mexican'
  | 'Seafood' | 'Steakhouse' | 'Thai' | 'Other';

export interface BizState { entityType: EntityTypeId; locations: number; type: RestaurantTypeId; cuisine: CuisineId; cuisineOther?: string; openDate?: string; }
export interface ProcessingState {
  monthlyVolume: number | string; averageTicket: number | string; cardPresentPct: number | string;
  pricingModel: 'interchange' | 'flatrate'; markupBps: number | string; markupPerItem: number | string;
  flatPct: number; flatPctEditing?: string; flatPerItem: number | string; monthlyFeesToMerchant: number | string;
  useDefaultCosts: boolean; customCosts: { basePct: number | string; assessmentsPct: number | string; perItem: number | string };
  agentShare: number; agentShareEditing?: string;
}
export interface HardwarePricing { posTerminalFirst:number; posTerminalAdditional:number; terminalOnly:number; handheld:number; kitchenPrinter:number; receiptPrinter:number; kds:number; cashDrawer:number; scanner:number; installTraining:number; }
export interface HardwareState {
  posTerminals:any; terminalOnlyUnits:any; receiptPrinters:any; kitchenPrinters:any; handhelds:any; kdsUnits:any; cashDrawers:any; scanners:any;
  pricing: HardwarePricing; amortTermMonths:number; includeSoftwareInCoverage:boolean; softwareMonthly:number; bufferPct:any; includeInstallTraining:boolean;
}
export interface Derived { tx:number; costPct:number; blendedPerItem:number; merchantFees:number; networkCosts:number; grossProfit:number; capex:number; amort:number; softwareMonthly:number; coverageTargetNoSoftware:number; coverageTarget:number; required:number; eligibility:string; agentProfit:number; }

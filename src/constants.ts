import { HardwarePricing } from './types';
export const RESTAURANT_TYPES = [
  { id: 'quick', name: 'Quick Service / QSR' },
  { id: 'fastcasual', name: 'Fast Casual' },
  { id: 'casual', name: 'Casual Dining' },
  { id: 'finedining', name: 'Fine Dining' },
  { id: 'takeout', name: 'Takeout / Ghost Kitchen' },
  { id: 'bar', name: 'Bar / Nightlife' },
  { id: 'coffee', name: 'Coffee / Bakery' },
  { id: 'foodtruck', name: 'Food Truck' },
];
export const ENTITY_TYPES = [
  { id: 'Corporation', name: 'Corporation' },
  { id: 'LLC', name: 'LLC' },
  { id: 'Sole Proprietor', name: 'Sole Proprietor' },
  { id: '501C', name: '501C' },
  { id: 'Partnership', name: 'Partnership' },
  { id: 'Government/Municipality', name: 'Government/Municipality' },
];
export const CUISINE_OPTIONS = [
  { id: 'American', name: 'American' }, { id: 'BBQ', name: 'BBQ' }, { id: 'Chinese', name: 'Chinese' },
  { id: 'Indian', name: 'Indian' }, { id: 'Italian', name: 'Italian' }, { id: 'Japanese', name: 'Japanese' },
  { id: 'Mediterranean', name: 'Mediterranean' }, { id: 'Mexican', name: 'Mexican' },
  { id: 'Seafood', name: 'Seafood' }, { id: 'Steakhouse', name: 'Steakhouse' }, { id: 'Thai', name: 'Thai' }, { id: 'Other', name: 'Other' },
];
export const DEFAULT_HARDWARE_PRICING: HardwarePricing = { posTerminalFirst:2999, posTerminalAdditional:2499, terminalOnly:1495, handheld:800, kitchenPrinter:425, receiptPrinter:0, kds:675, cashDrawer:149, scanner:0, installTraining:995 };
export const DEFAULT_COST_ASSUMPTIONS: Record<string, { basePct: number; assessmentsPct: number; perItem: number; }> = {
  quick:{ basePct:0.0175, assessmentsPct:0.0013, perItem:0.10 }, fastcasual:{ basePct:0.0175, assessmentsPct:0.0013, perItem:0.10 },
  casual:{ basePct:0.0190, assessmentsPct:0.0013, perItem:0.10 }, finedining:{ basePct:0.0205, assessmentsPct:0.0013, perItem:0.10 },
  takeout:{ basePct:0.0190, assessmentsPct:0.0013, perItem:0.12 }, bar:{ basePct:0.0195, assessmentsPct:0.0013, perItem:0.10 },
  coffee:{ basePct:0.0170, assessmentsPct:0.0013, perItem:0.09 }, foodtruck:{ basePct:0.0185, assessmentsPct:0.0013, perItem:0.10 },
};

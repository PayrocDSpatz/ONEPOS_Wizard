import React from 'react';
import { Field } from '../components/Field';
import { NumberField } from '../components/NumberField';
import { SelectField } from '../components/SelectField';
import { useWizard } from '../context/WizardContext';
import { RESTAURANT_TYPES } from '../constants';
import { toNum } from '../utils';

export const IntroStep: React.FC = () => {
  const { biz, setBiz, processing, setProcessing } = useWizard();
  return (
    <div className="space-y-6">
      <p className="text-base md:text-lg text-black">
        I’ll ask a few focused questions about volume, average ticket, concept, and hardware layout. Then I’ll estimate
        processing profitability to see if a <b>no-cost</b> or <b>low-cost</b> hardware placement is viable.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Restaurant Type">
          <SelectField value={biz.type} onChange={(v) => setBiz({ ...biz, type: v as any })} options={RESTAURANT_TYPES} />
        </Field>
        <Field label="Est. Monthly Card Volume ($)">
          <NumberField value={processing.monthlyVolume} onChange={(v)=>setProcessing({ ...processing, monthlyVolume: v })} onCommit={(v)=>setProcessing({ ...processing, monthlyVolume: toNum(v,0) })} />
        </Field>
        <Field label="Average Ticket ($)">
          <NumberField value={processing.averageTicket} onChange={(v)=>setProcessing({ ...processing, averageTicket: v })} onCommit={(v)=>setProcessing({ ...processing, averageTicket: toNum(v,0) })} />
        </Field>
      </div>
    </div>
  );
};

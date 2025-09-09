import React from 'react';
import { triggerDownload, exportCsvTab, safeCopy } from '../utils/download';

export const ExportButtons: React.FC<{ lead: Record<string, any> }> = ({ lead }) => {
  const exportXlsx = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet([lead]);
      XLSX.utils.book_append_sheet(wb, sheet, 'ONEPOS Lead');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, 'onepos_lead.xlsx');
    } catch {
      exportCsvTab(lead);
    }
  };
  return (
    <div className="flex gap-3">
      <button onClick={exportXlsx} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export to Excel</button>
      <button onClick={() => exportCsvTab(lead)} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Export CSV (open tab)</button>
      <button onClick={() => safeCopy(JSON.stringify(lead, null, 2))} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Copy JSON</button>
      <button onClick={() => window.location.reload()} className="h-12 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Reset</button>
    </div>
  );
};

export const triggerDownload = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener noreferrer';
    const supportsDownload = ('download' in HTMLAnchorElement.prototype) as any;
    if (supportsDownload) { document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 500); }
    else { window.open(url, '_blank'); setTimeout(()=>URL.revokeObjectURL(url), 2000); }
  } catch {
    alert('Allow downloads/pop-ups for this page.');
  }
};
export function exportCsvTab(lead: Record<string, any>) {
  const headers = Object.keys(lead);
  const values = headers.map((h) => JSON.stringify(lead[h] ?? ''));
  const csv = headers.join(',') + '\n' + values.join(',');
  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const opened = window.open(dataUri, '_blank');
  if (!opened) alert('Pop-up blocked. Allow pop-ups to open the CSV.');
}
export const safeCopy = async (text: string, downloadName = 'onepos_lead.json') => {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); alert('JSON copied to clipboard.'); return true; }
    throw new Error('Clipboard API unavailable');
  } catch {
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand('copy'); document.body.removeChild(ta);
      if (ok) { alert('JSON copied (fallback).'); return true; }
      throw new Error('execCommand copy failed');
    } catch {
      const blob = new Blob([text], { type: 'application/json;charset=utf-8;' });
      triggerDownload(blob, downloadName);
      alert('Clipboard blocked; downloaded a .json instead.');
      return false;
    }
  }
};

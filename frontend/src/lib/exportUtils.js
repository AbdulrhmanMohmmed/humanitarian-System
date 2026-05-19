/**
 * Export utilities for HIAOS system
 * Provides CSV/JSON/PDF export, clipboard copy, and file download helpers
 */

export function downloadCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function downloadJSON(data, filename = 'export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

export function downloadText(text, filename = 'report.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

export function exportTableAsCSV(tableId, filename = 'table.csv') {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map(row =>
    Array.from(row.querySelectorAll('th, td'))
      .map(cell => JSON.stringify(cell.textContent.trim()))
      .join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function generatePDFContent(title, sections) {
  let html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl}h1{color:#1e3a5f;border-bottom:3px solid #2563eb;padding-bottom:10px}
h2{color:#2563eb;margin-top:30px}table{width:100%;border-collapse:collapse;margin:15px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f1f5f9}
.stat{display:inline-block;background:#f1f5f9;padding:10px 20px;border-radius:8px;margin:5px}</style></head><body>`;
  html += `<h1>${title}</h1><p>تاريخ التصدير: ${new Date().toLocaleDateString('ar')}</p>`;
  for (const s of sections) {
    html += `<h2>${s.title}</h2>`;
    if (s.text) html += `<p>${s.text}</p>`;
    if (s.stats) {
      html += '<div>';
      for (const [k, v] of Object.entries(s.stats)) {
        html += `<div class="stat"><strong>${k}:</strong> ${v}</div>`;
      }
      html += '</div>';
    }
    if (s.table) {
      html += '<table><tr>' + s.table.headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      for (const row of s.table.rows) {
        html += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      html += '</table>';
    }
  }
  html += '</body></html>';
  return html;
}

export function printReport(title, sections) {
  const html = generatePDFContent(title, sections);
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

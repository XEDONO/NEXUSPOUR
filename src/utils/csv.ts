export function exportCSV(rows: string[][], filename = 'export.csv') {
  const csv = rows.map(r => r.map(cell => {
    if (cell == null) return '';
    return `"${String(cell).replace(/"/g, '""')}"`;
  }).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map(l => l.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
}

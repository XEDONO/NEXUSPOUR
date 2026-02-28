// Heuristic parsers for the two provided PDFs (stock list and checklist).
// Parsers accept an array of text lines (from pdfToLines) and return structured items.

export type StockItemParsed = { name: string; qty: number; unit?: string; location?: string; notes?: string };
export type ChecklistParsed = { section?: string; text: string };

// parseStockPDFLines tries to map lines into name + quantity patterns.
// It looks for patterns like: "12 x Whole Milk (1L)" or "Whole Milk - 12" or "Whole Milk 12 pcs"
export function parseStockPDFLines(lines: string[]): StockItemParsed[] {
  const items: StockItemParsed[] = [];

  const qtyFirst = /^\s*(\d{1,4})\s*[xX*\-]?\s*(.+)$/; // '12 x Item name'
  const qtyLast = /^(.+?)\s+[-–:]?\s*(\d{1,4})\s*(pcs|bottles|bags|kg|g|L|ml)?\s*$/i; // 'Item name 12 pcs'
  const inlineUnit = /(\d{1,4})\s*(pcs|bottles|bags|kg|g|L|ml)\b/i;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // skip header/footers heuristics
    if (/^(page|stock|item|qty|quantity)\b/i.test(line)) continue;

    let m = line.match(qtyFirst);
    if (m) {
      const qty = parseInt(m[1], 10) || 0;
      const name = m[2].trim();
      items.push({ name, qty });
      continue;
    }

    m = line.match(qtyLast);
    if (m) {
      const name = m[1].trim();
      const qty = parseInt(m[2], 10) || 0;
      const unit = (m[3] || '').trim();
      items.push({ name, qty, unit });
      continue;
    }

    // inline unit detection
    m = line.match(inlineUnit);
    if (m) {
      const qty = parseInt(m[1], 10) || 0;
      const name = line.replace(m[0], '').trim();
      const unit = (m[2] || '').trim();
      items.push({ name, qty, unit });
      continue;
    }

    // fallback: if line contains a number, try to use it
    const anyNum = line.match(/(\d{1,4})/);
    if (anyNum) {
      const qty = parseInt(anyNum[1], 10) || 0;
      const name = line.replace(anyNum[1], '').replace(/[\-:\|]/g, '').trim();
      items.push({ name: name || line, qty });
      continue;
    }

    // as a last resort, push as name with qty 0
    items.push({ name: line, qty: 0 });
  }

  return items;
}

// parseChecklistPDFLines groups lines into sections if it detects section headers.
// Section headers are lines in ALL CAPS or lines ending with ':' or short words like 'Opening', 'Closing'.
export function parseChecklistPDFLines(lines: string[]): ChecklistParsed[] {
  const tasks: ChecklistParsed[] = [];
  let currentSection: string | undefined = undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // detect a section header
    if (/^[A-Z0-9\s]{3,}$/.test(line) && line.length < 40) {
      currentSection = toTitleCase(line.toLowerCase());
      continue;
    }

    if (/[:：]\s*$/.test(line) || /^(opening|closing|daily|weekly|monthly)\b/i.test(line)) {
      currentSection = toTitleCase(line.replace(/[:：]\s*$/, ''));
      continue;
    }

    // small garbage filters
    if (/^page\s+\d+/i.test(line)) continue;

    // treat as task
    tasks.push({ section: currentSection, text: line });
  }

  return tasks;
}

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1));
}

export default { parseStockPDFLines, parseChecklistPDFLines };

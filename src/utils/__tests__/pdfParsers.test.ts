import { describe, it, expect } from 'vitest';
import { parseStockPDFLines, parseChecklistPDFLines } from '../pdfParsers';

describe('pdfParsers', () => {
  it('parses stock lines with qty first', () => {
    const lines = ['12 x Whole Milk (1L)', '5 Espresso Beans 1kg', 'Paper Cups - 240'];
    const parsed = parseStockPDFLines(lines);
    expect(parsed[0].name).toContain('Whole Milk');
    expect(parsed[0].qty).toBe(12);
    expect(parsed[1].qty).toBe(5);
    expect(parsed[2].qty).toBe(240);
  });

  it('parses checklist lines into sections and tasks', () => {
    const lines = ['OPENING', 'Power on espresso machine', 'Check fridge temps', 'DAILY:', 'Wipe counters'];
    const parsed = parseChecklistPDFLines(lines);
    expect(parsed[0].section).toBe('Opening');
    expect(parsed[0].text).toBe('Power on espresso machine');
    expect(parsed[2].section).toBe('Daily');
  });
});

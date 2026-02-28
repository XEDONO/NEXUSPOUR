// Simple allergen parsing and matching utilities
export type AllergenMap = Record<string, string[]>; // ingredient -> allergens list

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Heuristic parser: looks for lines like "Ingredient: Milk, Soy" or "Ingredient — Milk, Soy"
export function parseAllergenPDFLines(lines: string[]): AllergenMap {
  const map: AllergenMap = {};
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // try colon or dash separators
    const m = line.match(/^(.+?)\s*[:\-–—]\s*(.+)$/);
    if (m) {
      const ingredient = m[1].trim();
      const rest = m[2].trim();
      const allergens = rest.split(/[;,\/]| and /i).map(s => s.trim()).filter(Boolean);
      if (ingredient) map[ingredient] = allergens;
      continue;
    }

    // try comma-first rows: "Milk, Soy — Ingredient"
    const m2 = line.match(/^(.+?)\s*[\-–—]\s*(.+)$/);
    if (m2) {
      const left = m2[1].trim();
      const right = m2[2].trim();
      // decide which token looks like allergens by presence of words like milk, soy, gluten
      if (/[a-z]{2,}/i.test(left) && right) {
        const allergens = left.split(/[;,\/]| and /i).map(s => s.trim()).filter(Boolean);
        map[right] = allergens;
        continue;
      }
    }

    // fallback: if line contains a comma and two tokens, treat as ingredient,allergen
    const parts = line.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const ingredient = parts[0];
      const allergens = parts.slice(1);
      map[ingredient] = allergens;
      continue;
    }
  }
  return map;
}

export function parseAllergenCSV(text: string): AllergenMap {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return parseAllergenPDFLines(lines);
}

// Very small fuzzy matcher: checks tokens overlap and substring matches
export function matchAllergensToItem(name: string, map: AllergenMap): string[] {
  const n = norm(name);
  const tokens = new Set(n.split(' ').filter(Boolean));
  const found = new Set<string>();
  for (const ing of Object.keys(map)) {
    const nIng = norm(ing);
    if (!nIng) continue;
    if (n.includes(nIng)) {
      map[ing].forEach(a => found.add(a));
      continue;
    }
    // token overlap
    const ingTokens = nIng.split(' ').filter(Boolean);
    let common = 0;
    for (const t of ingTokens) if (tokens.has(t)) common++;
    if (common >= Math.max(1, Math.floor(ingTokens.length / 2))) {
      map[ing].forEach(a => found.add(a));
      continue;
    }
  }
  return Array.from(found);
}

export default { parseAllergenPDFLines, parseAllergenCSV, matchAllergensToItem };

import Papa from 'papaparse';

export interface RawCsvRow {
  [key: string]: string | number | null | undefined;
}

export async function fetchCsv(url: string): Promise<RawCsvRow[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  const parsed = Papa.parse<RawCsvRow>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  if (parsed.errors && parsed.errors.length > 0) {
    // Keep going but surface first error for debugging
    // This should be logged by callers if needed
    // eslint-disable-next-line no-console
    console.warn('CSV parse errors:', parsed.errors.slice(0, 3));
  }
  return (parsed.data || []) as RawCsvRow[];
}

export function getField(row: RawCsvRow, keys: string[], fallback: number = 0): number {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(/[$,%]/g, ''));
      if (!Number.isNaN(n)) return n;
    }
  }
  return fallback;
}

export function getString(row: RawCsvRow, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return fallback;
}



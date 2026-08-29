// Deterministic normalisation helpers for GST reconciliation.
// Every transformation here is explainable and testable — no heuristics/AI.

export function normalizeGstin(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).toUpperCase().replace(/[^0-9A-Z]/g, '').trim();
  return s.length ? s : null;
}

export function normalizeInvoiceNo(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  // Uppercase and strip everything except alphanumerics so that
  // "INV-001", "INV/001" and "inv 001" all compare equal.
  const s = String(raw).toUpperCase().replace(/[^0-9A-Z]/g, '');
  return s.length ? s : null;
}

export function parseAmount(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  // Strip currency symbols, commas and spaces; handle parentheses as negative.
  let s = String(raw).trim();
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[₹$,\s]/g, '');
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

// Excel stores dates as serial numbers (days since 1899-12-30).
function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const d = new Date(utcValue);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function parseDate(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;

  if (typeof raw === 'number') {
    // Treat plausible Excel serials (roughly year 1900–2100).
    if (raw > 20000 && raw < 80000) return excelSerialToDate(raw);
    return null;
  }

  const s = String(raw).trim();
  if (!s) return null;

  // dd-mm-yyyy or dd/mm/yyyy (Indian convention — day first)
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dt = new Date(Date.UTC(year, month - 1, day));
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
  }

  // yyyy-mm-dd
  const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const dt = new Date(Date.UTC(+y, +m - 1, +d));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export interface RawRow {
  [key: string]: unknown;
}

export interface NormalizedEntry {
  rowIndex: number;
  gstin: string | null;
  gstinNorm: string | null;
  vendorName: string | null;
  invoiceNo: string | null;
  invoiceNoNorm: string | null;
  invoiceDate: Date | null;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

// Accepted header aliases (lower-cased, alphanumerics only) → canonical field.
const HEADER_ALIASES: Record<string, keyof RawFieldSet> = {
  gstin: 'gstin',
  gstinno: 'gstin',
  gstinofsupplier: 'gstin',
  supplierGSTIN: 'gstin',
  suppliergstin: 'gstin',
  gstinuin: 'gstin',
  gstinuinofsupplier: 'gstin',
  vendor: 'vendor',
  vendorname: 'vendor',
  suppliername: 'vendor',
  supplier: 'vendor',
  tradename: 'vendor',
  partyname: 'vendor',
  name: 'vendor',
  invoiceno: 'invoiceNo',
  invoicenumber: 'invoiceNo',
  invno: 'invoiceNo',
  billno: 'invoiceNo',
  documentnumber: 'invoiceNo',
  invoicedate: 'invoiceDate',
  invdate: 'invoiceDate',
  date: 'invoiceDate',
  billdate: 'invoiceDate',
  documentdate: 'invoiceDate',
  taxablevalue: 'taxableValue',
  taxable: 'taxableValue',
  taxableamount: 'taxableValue',
  basicamount: 'taxableValue',
  igst: 'igst',
  igstamount: 'igst',
  integratedtax: 'igst',
  cgst: 'cgst',
  cgstamount: 'cgst',
  centraltax: 'cgst',
  sgst: 'sgst',
  sgstamount: 'sgst',
  statetax: 'sgst',
  sgstutgst: 'sgst',
  totaltax: 'totalTax',
  taxamount: 'totalTax',
  totalgst: 'totalTax',
};

interface RawFieldSet {
  gstin?: unknown;
  vendor?: unknown;
  invoiceNo?: unknown;
  invoiceDate?: unknown;
  taxableValue?: unknown;
  igst?: unknown;
  cgst?: unknown;
  sgst?: unknown;
  totalTax?: unknown;
}

function headerKey(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Map an arbitrary row object (keyed by original headers) to a normalized
 * entry, using a tolerant header-alias table. Returns null for a blank row.
 */
export function normalizeRow(
  row: RawRow,
  rowIndex: number,
): NormalizedEntry | null {
  const fields: RawFieldSet = {};
  for (const [key, value] of Object.entries(row)) {
    const canonical = HEADER_ALIASES[headerKey(key)];
    if (canonical && fields[canonical] === undefined) {
      fields[canonical] = value;
    }
  }

  const gstinNorm = normalizeGstin(fields.gstin);
  const invoiceNoNorm = normalizeInvoiceNo(fields.invoiceNo);
  const taxableValue = parseAmount(fields.taxableValue);
  const igst = parseAmount(fields.igst);
  const cgst = parseAmount(fields.cgst);
  const sgst = parseAmount(fields.sgst);
  let totalTax = parseAmount(fields.totalTax);
  if (totalTax === 0 && (igst || cgst || sgst)) {
    totalTax = igst + cgst + sgst;
  }

  // Skip a fully blank row (no identifying data and no amounts).
  const hasContent =
    gstinNorm ||
    invoiceNoNorm ||
    taxableValue ||
    totalTax ||
    fields.vendor ||
    fields.invoiceDate;
  if (!hasContent) return null;

  return {
    rowIndex,
    gstin: fields.gstin ? String(fields.gstin).trim() : gstinNorm,
    gstinNorm,
    vendorName: fields.vendor ? String(fields.vendor).trim() : null,
    invoiceNo: fields.invoiceNo ? String(fields.invoiceNo).trim() : invoiceNoNorm,
    invoiceNoNorm,
    invoiceDate: parseDate(fields.invoiceDate),
    taxableValue,
    igst,
    cgst,
    sgst,
    totalTax,
  };
}

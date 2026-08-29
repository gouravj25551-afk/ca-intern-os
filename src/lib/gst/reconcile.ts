import type { NormalizedEntry } from './normalize';

// Self-contained INR formatter so the engine has no UI dependency and stays
// unit-testable in isolation.
const INR = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function formatCurrency(value: number): string {
  return `₹${INR.format(value)}`;
}

export type MatchStatus =
  | 'EXACT_MATCH'
  | 'AMOUNT_MISMATCH'
  | 'INVOICE_NUMBER_MISMATCH'
  | 'GSTIN_MISMATCH'
  | 'DATE_MISMATCH'
  | 'TAX_MISMATCH'
  | 'MISSING_IN_2B'
  | 'MISSING_IN_BOOKS'
  | 'DUPLICATE';

export interface MatchConfig {
  /** Absolute tolerance (₹) for taxable value comparison. */
  taxableTolerance: number;
  /** Absolute tolerance (₹) for tax amount comparison. */
  taxTolerance: number;
  /** Allowed difference in days between invoice dates. */
  dateToleranceDays: number;
}

export const DEFAULT_CONFIG: MatchConfig = {
  taxableTolerance: 1,
  taxTolerance: 1,
  dateToleranceDays: 0,
};

export interface ReconResult {
  status: MatchStatus;
  reason: string;
  gstin: string | null;
  vendorName: string | null;
  invoiceNo: string | null;
  invoiceDate: Date | null;
  bookTaxable: number | null;
  bookTax: number | null;
  b2bTaxable: number | null;
  b2bTax: number | null;
  taxDifference: number | null;
  bookRowIndex: number | null;
  b2bRowIndex: number | null;
}

export interface ReconSummary {
  totalBook: number;
  totalB2B: number;
  matched: number;
  amountMismatch: number;
  invoiceNumberMismatch: number;
  gstinMismatch: number;
  dateMismatch: number;
  taxMismatch: number;
  missingIn2B: number;
  missingInBooks: number;
  duplicates: number;
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / 86400000);
}

function key(gstin: string | null, inv: string | null): string {
  return `${gstin ?? ''}|${inv ?? ''}`;
}

/**
 * Compare a matched book/2B pair and classify it. Returns EXACT_MATCH plus the
 * matching status and a human-readable reason listing *why*.
 */
function classifyPair(
  book: NormalizedEntry,
  b2b: NormalizedEntry,
  cfg: MatchConfig,
): { status: MatchStatus; reason: string } {
  const reasons: string[] = [];
  const taxableDiff = Math.abs(book.taxableValue - b2b.taxableValue);
  const taxDiff = Math.abs(book.totalTax - b2b.totalTax);

  const amountMismatch = taxableDiff > cfg.taxableTolerance;
  const taxMismatch = taxDiff > cfg.taxTolerance;

  let dateMismatch = false;
  if (book.invoiceDate && b2b.invoiceDate) {
    if (daysBetween(book.invoiceDate, b2b.invoiceDate) > cfg.dateToleranceDays) {
      dateMismatch = true;
    }
  }

  if (amountMismatch) {
    reasons.push(
      `Taxable value mismatch: Books ${formatCurrency(book.taxableValue)} vs GSTR-2B ${formatCurrency(b2b.taxableValue)} (diff ${formatCurrency(book.taxableValue - b2b.taxableValue)})`,
    );
  }
  if (taxMismatch) {
    reasons.push(
      `Tax mismatch: Books GST ${formatCurrency(book.totalTax)} vs GSTR-2B GST ${formatCurrency(b2b.totalTax)} (diff ${formatCurrency(book.totalTax - b2b.totalTax)})`,
    );
  }
  if (dateMismatch) {
    reasons.push(
      `Date mismatch: Books ${book.invoiceDate?.toISOString().slice(0, 10)} vs GSTR-2B ${b2b.invoiceDate?.toISOString().slice(0, 10)}`,
    );
  }

  // Priority for the single headline status: amount > tax > date.
  let status: MatchStatus = 'EXACT_MATCH';
  if (amountMismatch) status = 'AMOUNT_MISMATCH';
  else if (taxMismatch) status = 'TAX_MISMATCH';
  else if (dateMismatch) status = 'DATE_MISMATCH';

  const reason =
    status === 'EXACT_MATCH'
      ? 'Exact match on GSTIN, invoice number, taxable value and tax.'
      : reasons.join(' • ');

  return { status, reason };
}

function baseRow(
  book: NormalizedEntry | null,
  b2b: NormalizedEntry | null,
): Omit<ReconResult, 'status' | 'reason'> {
  const src = book ?? b2b!;
  const bookTax = book ? book.totalTax : null;
  const b2bTax = b2b ? b2b.totalTax : null;
  return {
    gstin: (book?.gstin ?? b2b?.gstin) || null,
    vendorName: (book?.vendorName ?? b2b?.vendorName) || null,
    invoiceNo: (book?.invoiceNo ?? b2b?.invoiceNo) || null,
    invoiceDate: (book?.invoiceDate ?? b2b?.invoiceDate) || null,
    bookTaxable: book ? book.taxableValue : null,
    bookTax,
    b2bTaxable: b2b ? b2b.taxableValue : null,
    b2bTax,
    taxDifference:
      bookTax !== null && b2bTax !== null ? bookTax - b2bTax : null,
    bookRowIndex: book ? book.rowIndex : null,
    b2bRowIndex: b2b ? b2b.rowIndex : null,
  };
}

/**
 * Detect duplicates (same GSTIN + invoice no appearing more than once in the
 * SAME source). Keeps the first occurrence for matching; returns the rest as
 * duplicate results and the deduplicated list.
 */
function splitDuplicates(
  entries: NormalizedEntry[],
  source: 'Books' | 'GSTR-2B',
): { unique: NormalizedEntry[]; duplicates: ReconResult[] } {
  const seen = new Map<string, NormalizedEntry>();
  const unique: NormalizedEntry[] = [];
  const duplicates: ReconResult[] = [];
  for (const e of entries) {
    if (!e.gstinNorm && !e.invoiceNoNorm) {
      unique.push(e);
      continue;
    }
    const k = key(e.gstinNorm, e.invoiceNoNorm);
    if (seen.has(k)) {
      duplicates.push({
        ...baseRow(source === 'Books' ? e : null, source === 'GSTR-2B' ? e : null),
        status: 'DUPLICATE',
        reason: `Duplicate invoice in ${source}: GSTIN ${e.gstinNorm ?? '—'}, Invoice ${e.invoiceNo ?? '—'} appears more than once.`,
      });
    } else {
      seen.set(k, e);
      unique.push(e);
    }
  }
  return { unique, duplicates };
}

/**
 * Core reconciliation. Fully deterministic and explainable.
 */
export function reconcile(
  bookEntriesRaw: NormalizedEntry[],
  b2bEntriesRaw: NormalizedEntry[],
  config: Partial<MatchConfig> = {},
): { results: ReconResult[]; summary: ReconSummary } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: ReconResult[] = [];

  const totalBook = bookEntriesRaw.length;
  const totalB2B = b2bEntriesRaw.length;

  // 1. Duplicates within each source.
  const bookSplit = splitDuplicates(bookEntriesRaw, 'Books');
  const b2bSplit = splitDuplicates(b2bEntriesRaw, 'GSTR-2B');
  results.push(...bookSplit.duplicates, ...b2bSplit.duplicates);

  const books = [...bookSplit.unique];
  const b2b = [...b2bSplit.unique];

  const usedBook = new Set<number>();
  const usedB2B = new Set<number>();

  // 2. Primary match on GSTIN + invoice number.
  const b2bByKey = new Map<string, NormalizedEntry[]>();
  b2b.forEach((e, i) => {
    const k = key(e.gstinNorm, e.invoiceNoNorm);
    if (!b2bByKey.has(k)) b2bByKey.set(k, []);
    b2bByKey.get(k)!.push({ ...e, rowIndex: e.rowIndex });
    // store index alongside via parallel structure below
  });
  // Build index list for consumption.
  const b2bIndexByKey = new Map<string, number[]>();
  b2b.forEach((e, i) => {
    const k = key(e.gstinNorm, e.invoiceNoNorm);
    if (!b2bIndexByKey.has(k)) b2bIndexByKey.set(k, []);
    b2bIndexByKey.get(k)!.push(i);
  });

  books.forEach((bk, bi) => {
    if (!bk.gstinNorm && !bk.invoiceNoNorm) return;
    const k = key(bk.gstinNorm, bk.invoiceNoNorm);
    const candidates = b2bIndexByKey.get(k);
    if (!candidates) return;
    const matchIdx = candidates.find((ci) => !usedB2B.has(ci));
    if (matchIdx === undefined) return;
    usedBook.add(bi);
    usedB2B.add(matchIdx);
    const { status, reason } = classifyPair(bk, b2b[matchIdx], cfg);
    results.push({
      ...baseRow(bk, b2b[matchIdx]),
      status,
      reason,
    });
  });

  // 3. Secondary: same GSTIN + taxable (+date), different invoice number.
  books.forEach((bk, bi) => {
    if (usedBook.has(bi)) return;
    if (!bk.gstinNorm) return;
    const matchIdx = b2b.findIndex(
      (e, ci) =>
        !usedB2B.has(ci) &&
        e.gstinNorm === bk.gstinNorm &&
        Math.abs(e.taxableValue - bk.taxableValue) <= cfg.taxableTolerance &&
        Math.abs(e.totalTax - bk.totalTax) <= cfg.taxTolerance,
    );
    if (matchIdx === -1) return;
    usedBook.add(bi);
    usedB2B.add(matchIdx);
    results.push({
      ...baseRow(bk, b2b[matchIdx]),
      status: 'INVOICE_NUMBER_MISMATCH',
      reason: `Invoice number mismatch: Books "${bk.invoiceNo ?? '—'}" vs GSTR-2B "${b2b[matchIdx].invoiceNo ?? '—'}" (same GSTIN, taxable value and tax).`,
    });
  });

  // 4. Secondary: same invoice number + taxable, different GSTIN.
  books.forEach((bk, bi) => {
    if (usedBook.has(bi)) return;
    if (!bk.invoiceNoNorm) return;
    const matchIdx = b2b.findIndex(
      (e, ci) =>
        !usedB2B.has(ci) &&
        e.invoiceNoNorm === bk.invoiceNoNorm &&
        Math.abs(e.taxableValue - bk.taxableValue) <= cfg.taxableTolerance,
    );
    if (matchIdx === -1) return;
    usedBook.add(bi);
    usedB2B.add(matchIdx);
    results.push({
      ...baseRow(bk, b2b[matchIdx]),
      status: 'GSTIN_MISMATCH',
      reason: `GSTIN mismatch: Books "${bk.gstinNorm ?? '—'}" vs GSTR-2B "${b2b[matchIdx].gstinNorm ?? '—'}" (same invoice number and taxable value).`,
    });
  });

  // 5. Remaining unmatched book entries → missing in 2B.
  books.forEach((bk, bi) => {
    if (usedBook.has(bi)) return;
    results.push({
      ...baseRow(bk, null),
      status: 'MISSING_IN_2B',
      reason: `Invoice present in Books but not found in GSTR-2B (GSTIN ${bk.gstinNorm ?? '—'}, Invoice ${bk.invoiceNo ?? '—'}).`,
    });
  });

  // 6. Remaining unmatched 2B entries → missing in books.
  b2b.forEach((e, ci) => {
    if (usedB2B.has(ci)) return;
    results.push({
      ...baseRow(null, e),
      status: 'MISSING_IN_BOOKS',
      reason: `Invoice present in GSTR-2B but not found in Books (GSTIN ${e.gstinNorm ?? '—'}, Invoice ${e.invoiceNo ?? '—'}).`,
    });
  });

  const summary: ReconSummary = {
    totalBook,
    totalB2B,
    matched: results.filter((r) => r.status === 'EXACT_MATCH').length,
    amountMismatch: results.filter((r) => r.status === 'AMOUNT_MISMATCH').length,
    invoiceNumberMismatch: results.filter(
      (r) => r.status === 'INVOICE_NUMBER_MISMATCH',
    ).length,
    gstinMismatch: results.filter((r) => r.status === 'GSTIN_MISMATCH').length,
    dateMismatch: results.filter((r) => r.status === 'DATE_MISMATCH').length,
    taxMismatch: results.filter((r) => r.status === 'TAX_MISMATCH').length,
    missingIn2B: results.filter((r) => r.status === 'MISSING_IN_2B').length,
    missingInBooks: results.filter((r) => r.status === 'MISSING_IN_BOOKS').length,
    duplicates: results.filter((r) => r.status === 'DUPLICATE').length,
  };

  return { results, summary };
}

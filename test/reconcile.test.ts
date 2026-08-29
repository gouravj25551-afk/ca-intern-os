// Deterministic unit tests for the GST reconciliation engine.
// Run with: npm test  (uses node:test via tsx)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile } from '../src/lib/gst/reconcile';
import { normalizeRow, normalizeGstin, normalizeInvoiceNo, parseAmount, parseDate } from '../src/lib/gst/normalize';
import type { NormalizedEntry } from '../src/lib/gst/normalize';

function entry(p: Partial<NormalizedEntry>): NormalizedEntry {
  return {
    rowIndex: 0,
    gstin: p.gstin ?? null,
    gstinNorm: p.gstinNorm ?? (p.gstin ? normalizeGstin(p.gstin) : null),
    vendorName: p.vendorName ?? null,
    invoiceNo: p.invoiceNo ?? null,
    invoiceNoNorm: p.invoiceNoNorm ?? (p.invoiceNo ? normalizeInvoiceNo(p.invoiceNo) : null),
    invoiceDate: p.invoiceDate ?? null,
    taxableValue: p.taxableValue ?? 0,
    igst: p.igst ?? 0,
    cgst: p.cgst ?? 0,
    sgst: p.sgst ?? 0,
    totalTax: p.totalTax ?? 0,
  };
}

test('normalisation helpers', () => {
  assert.equal(normalizeGstin(' 27aaacs1234a1z5 '), '27AAACS1234A1Z5');
  assert.equal(normalizeInvoiceNo('INV-001'), 'INV001');
  assert.equal(normalizeInvoiceNo('inv/001'), 'INV001');
  assert.equal(parseAmount('₹1,23,456.78'), 123456.78);
  assert.equal(parseAmount('(500)'), -500);
  const d = parseDate('05-04-2024');
  assert.equal(d?.toISOString().slice(0, 10), '2024-04-05');
});

test('exact match', () => {
  const b = [entry({ gstin: '27AAACS1234A1Z5', invoiceNo: 'INV-001', taxableValue: 100000, totalTax: 18000 })];
  const t = [entry({ gstin: '27AAACS1234A1Z5', invoiceNo: 'INV/001', taxableValue: 100000, totalTax: 18000 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.matched, 1, 'invoice-number formatting differences still match exactly');
});

test('tax mismatch is explained', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 50000, totalTax: 9000 })];
  const t = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 50000, totalTax: 8500 })];
  const { results, summary } = reconcile(b, t);
  assert.equal(summary.taxMismatch, 1);
  assert.match(results[0].reason, /Tax mismatch/);
  assert.equal(results[0].taxDifference, 500);
});

test('amount (taxable) mismatch', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 50000, totalTax: 9000 })];
  const t = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 45000, totalTax: 9000 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.amountMismatch, 1);
});

test('invoice number mismatch (same GSTIN, taxable, tax)', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180 })];
  const t = [entry({ gstin: 'G1', invoiceNo: 'B2', taxableValue: 1000, totalTax: 180 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.invoiceNumberMismatch, 1);
});

test('GSTIN mismatch (same invoice + taxable)', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180 })];
  const t = [entry({ gstin: 'G2', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.gstinMismatch, 1);
});

test('date mismatch', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180, invoiceDate: new Date('2024-04-05') })];
  const t = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180, invoiceDate: new Date('2024-04-15') })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.dateMismatch, 1);
});

test('missing in 2B and missing in books', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'ONLY-BOOKS', taxableValue: 100, totalTax: 18 })];
  const t = [entry({ gstin: 'G9', invoiceNo: 'ONLY-2B', taxableValue: 200, totalTax: 36 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.missingIn2B, 1);
  assert.equal(summary.missingInBooks, 1);
});

test('duplicate detection within a source', () => {
  const b = [
    entry({ gstin: 'G1', invoiceNo: 'DUP', taxableValue: 100, totalTax: 18 }),
    entry({ gstin: 'G1', invoiceNo: 'DUP', taxableValue: 100, totalTax: 18 }),
  ];
  const t = [entry({ gstin: 'G1', invoiceNo: 'DUP', taxableValue: 100, totalTax: 18 })];
  const { summary } = reconcile(b, t);
  assert.equal(summary.duplicates, 1, 'second book occurrence flagged duplicate');
  assert.equal(summary.matched, 1, 'first occurrence still matches');
});

test('tolerance config suppresses tiny differences', () => {
  const b = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180.4 })];
  const t = [entry({ gstin: 'G1', invoiceNo: 'A1', taxableValue: 1000, totalTax: 180 })];
  const { summary } = reconcile(b, t, { taxTolerance: 1 });
  assert.equal(summary.matched, 1, 'difference within tolerance is an exact match');
});

test('normalizeRow maps aliased headers', () => {
  const row = { 'GSTIN of Supplier': 'G1', 'Invoice Number': 'A1', 'Taxable Amount': '1,000', 'IGST': '180' };
  const e = normalizeRow(row, 2);
  assert.equal(e?.gstinNorm, 'G1');
  assert.equal(e?.invoiceNoNorm, 'A1');
  assert.equal(e?.taxableValue, 1000);
  assert.equal(e?.totalTax, 180);
});

'use client';

import * as React from 'react';
import { Download, FileDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { MATCH_STATUSES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import { exportReconSummaryPdf } from '@/lib/pdf';

export interface ResultRow {
  id: string;
  status: string;
  reason: string;
  gstin: string | null;
  vendorName: string | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  bookTaxable: number | null;
  bookTax: number | null;
  b2bTaxable: number | null;
  b2bTax: number | null;
  taxDifference: number | null;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <div className={`text-2xl font-semibold ${tone ?? 'text-ink-900'}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-500">{label}</div>
    </div>
  );
}

export function ResultsView({
  reconciliationId,
  title,
  clientName,
  period,
  results,
  totals,
}: {
  reconciliationId: string;
  title: string;
  clientName: string;
  period: string | null;
  results: ResultRow[];
  totals: { totalBook: number; totalB2B: number };
}) {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [minDiff, setMinDiff] = React.useState('');

  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of results) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [results]);

  const mismatched =
    (counts.AMOUNT_MISMATCH ?? 0) +
    (counts.TAX_MISMATCH ?? 0) +
    (counts.DATE_MISMATCH ?? 0) +
    (counts.INVOICE_NUMBER_MISMATCH ?? 0) +
    (counts.GSTIN_MISMATCH ?? 0);

  const months = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      if (r.invoiceDate) set.add(r.invoiceDate.slice(0, 7));
    }
    return Array.from(set).sort();
  }, [results]);

  const filtered = results.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      (r.gstin ?? '').toLowerCase().includes(q) ||
      (r.vendorName ?? '').toLowerCase().includes(q) ||
      (r.invoiceNo ?? '').toLowerCase().includes(q);
    const matchesStatus = !status || r.status === status;
    const matchesMonth = !month || (r.invoiceDate ?? '').startsWith(month);
    const matchesDiff =
      !minDiff || Math.abs(r.taxDifference ?? 0) >= Number(minDiff);
    return matchesQ && matchesStatus && matchesMonth && matchesDiff;
  });

  function exportPdf() {
    exportReconSummaryPdf({
      title,
      clientName,
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        'Total Book Invoices': totals.totalBook,
        'Total 2B Invoices': totals.totalB2B,
        Matched: counts.EXACT_MATCH ?? 0,
        Mismatched: mismatched,
        'Missing in GSTR-2B': counts.MISSING_IN_2B ?? 0,
        'Missing in Books': counts.MISSING_IN_BOOKS ?? 0,
        Duplicates: counts.DUPLICATE ?? 0,
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Book invoices" value={totals.totalBook} />
        <Stat label="2B invoices" value={totals.totalB2B} />
        <Stat label="Matched" value={counts.EXACT_MATCH ?? 0} tone="text-emerald-600" />
        <Stat label="Mismatched" value={mismatched} tone="text-amber-600" />
        <Stat label="Missing in 2B" value={counts.MISSING_IN_2B ?? 0} tone="text-red-600" />
        <Stat label="Missing in Books" value={counts.MISSING_IN_BOOKS ?? 0} tone="text-purple-600" />
        <Stat label="Duplicates" value={counts.DUPLICATE ?? 0} tone="text-red-600" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search GSTIN, vendor or invoice…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          <option value="">All statuses</option>
          {MATCH_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-40">
          <option value="">All months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input type="number" placeholder="Min tax diff ₹" value={minDiff} onChange={(e) => setMinDiff(e.target.value)} className="w-36" />
        <a href={`/api/gst/${reconciliationId}/export`}>
          <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Excel</Button>
        </a>
        <Button variant="outline" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4" /> PDF summary</Button>
      </div>

      <p className="text-sm text-ink-500">{filtered.length} of {results.length} rows</p>

      {filtered.length === 0 ? (
        <EmptyState title="No rows match your filters" description="Adjust the search or filters above." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Status</Th>
              <Th>GSTIN</Th>
              <Th>Vendor</Th>
              <Th>Invoice</Th>
              <Th className="text-right">Books Tax</Th>
              <Th className="text-right">2B Tax</Th>
              <Th className="text-right">Diff</Th>
              <Th>Why</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((r) => (
              <Tr key={r.id}>
                <Td><StatusBadge group="matchStatus" value={r.status} /></Td>
                <Td className="font-mono text-xs">{r.gstin ?? '—'}</Td>
                <Td>{r.vendorName ?? '—'}</Td>
                <Td>
                  {r.invoiceNo ?? '—'}
                  {r.invoiceDate && <div className="text-xs text-ink-400">{formatDate(r.invoiceDate)}</div>}
                </Td>
                <Td className="text-right">{r.bookTax !== null ? formatCurrency(r.bookTax) : '—'}</Td>
                <Td className="text-right">{r.b2bTax !== null ? formatCurrency(r.b2bTax) : '—'}</Td>
                <Td className={`text-right ${r.taxDifference && Math.abs(r.taxDifference) > 0.01 ? 'font-medium text-amber-700' : ''}`}>
                  {r.taxDifference !== null ? formatCurrency(r.taxDifference) : '—'}
                </Td>
                <Td className="max-w-xs text-xs text-ink-500">{r.reason}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}

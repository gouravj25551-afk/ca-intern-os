import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ReconRunner } from './ReconRunner';
import { ResultsView, type ResultRow } from './ResultsView';

export const metadata: Metadata = { title: 'Reconciliation' };

export default async function ReconciliationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const recon = await prisma.gSTReconciliation.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true } },
      results: { orderBy: [{ status: 'asc' }, { vendorName: 'asc' }] },
      _count: { select: { bookEntries: true, b2bEntries: true } },
    },
  });
  if (!recon) notFound();

  const rows: ResultRow[] = recon.results.map((r) => ({
    id: r.id,
    status: r.status,
    reason: r.reason,
    gstin: r.gstin,
    vendorName: r.vendorName,
    invoiceNo: r.invoiceNo,
    invoiceDate: r.invoiceDate ? r.invoiceDate.toISOString().slice(0, 10) : null,
    bookTaxable: r.bookTaxable,
    bookTax: r.bookTax,
    b2bTaxable: r.b2bTaxable,
    b2bTax: r.b2bTax,
    taxDifference: r.taxDifference,
  }));

  const hasResults = rows.length > 0;

  return (
    <div>
      <Link href="/gst" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to reconciliations
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">{recon.title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          <Link href={`/clients/${recon.client.id}`} className="hover:text-brand-700">{recon.client.name}</Link>
          {recon.period ? ` · ${recon.period}` : ''}
        </p>
      </div>

      <div className="space-y-6">
        <ReconRunner reconciliationId={recon.id} hasResults={hasResults} />

        {hasResults ? (
          <ResultsView
            reconciliationId={recon.id}
            title={recon.title}
            clientName={recon.client.name}
            period={recon.period}
            results={rows}
            totals={{ totalBook: recon._count.bookEntries, totalB2B: recon._count.b2bEntries }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-8 text-center text-sm text-ink-500">
            Upload both files above and run the reconciliation to see the dashboard and results here.
          </div>
        )}
      </div>
    </div>
  );
}

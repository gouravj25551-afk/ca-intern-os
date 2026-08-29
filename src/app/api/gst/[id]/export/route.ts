import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { buildXlsx } from '@/lib/excel';
import { labelFor } from '@/lib/constants';
import { formatDate } from '@/lib/dates';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const recon = await prisma.gSTReconciliation.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { name: true } },
      results: { orderBy: { status: 'asc' } },
    },
  });
  if (!recon) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const resultRows = recon.results.map((r) => ({
    Status: labelFor('matchStatus', r.status),
    GSTIN: r.gstin ?? '',
    Vendor: r.vendorName ?? '',
    'Invoice No': r.invoiceNo ?? '',
    'Invoice Date': r.invoiceDate ? formatDate(r.invoiceDate) : '',
    'Books Taxable': r.bookTaxable ?? '',
    'Books Tax': r.bookTax ?? '',
    '2B Taxable': r.b2bTaxable ?? '',
    '2B Tax': r.b2bTax ?? '',
    'Tax Difference': r.taxDifference ?? '',
    Reason: r.reason,
  }));

  const counts: Record<string, number> = {};
  for (const r of recon.results) {
    const key = labelFor('matchStatus', r.status);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const summaryRows = Object.entries(counts).map(([Metric, Count]) => ({ Metric, Count }));

  const buffer = buildXlsx([
    { name: 'Summary', rows: summaryRows.length ? summaryRows : [{ Metric: 'No results', Count: 0 }] },
    { name: 'Results', rows: resultRows },
  ]);

  const filename = `gst-reconciliation-${recon.title.replace(/[^a-z0-9]+/gi, '-')}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

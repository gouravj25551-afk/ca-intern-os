import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  parseWorkbookBuffer,
  ACCEPTED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
} from '@/lib/excel';
import { normalizeRow, type NormalizedEntry } from '@/lib/gst/normalize';
import { reconcile, DEFAULT_CONFIG } from '@/lib/gst/reconcile';
import { logActivity } from '@/lib/activity';

export const runtime = 'nodejs';

function hasValidExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_UPLOAD_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function fileToEntries(file: File): Promise<NormalizedEntry[]> {
  const buf = Buffer.from(await file.arrayBuffer());
  const rows = parseWorkbookBuffer(buf);
  const entries: NormalizedEntry[] = [];
  rows.forEach((row, i) => {
    const e = normalizeRow(row, i + 2); // +2: header row + 1-based
    if (e) entries.push(e);
  });
  return entries;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const recon = await prisma.gSTReconciliation.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true } } },
  });
  if (!recon) return NextResponse.json({ error: 'Reconciliation not found.' }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const booksFile = form.get('books');
  const b2bFile = form.get('gstr2b');

  if (!(booksFile instanceof File) || !(b2bFile instanceof File)) {
    return NextResponse.json(
      { error: 'Both the Purchase Register and GSTR-2B files are required.' },
      { status: 400 },
    );
  }

  for (const f of [booksFile, b2bFile]) {
    if (f.size === 0) {
      return NextResponse.json({ error: `"${f.name}" is empty.` }, { status: 400 });
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `"${f.name}" exceeds the 5 MB limit.` }, { status: 400 });
    }
    if (!hasValidExtension(f.name)) {
      return NextResponse.json(
        { error: `"${f.name}" must be a .csv, .xls or .xlsx file.` },
        { status: 400 },
      );
    }
  }

  // Optional matching config.
  const taxableTolerance = Number(form.get('taxableTolerance')) || DEFAULT_CONFIG.taxableTolerance;
  const taxTolerance = Number(form.get('taxTolerance')) || DEFAULT_CONFIG.taxTolerance;
  const dateToleranceDays = Number(form.get('dateToleranceDays')) || DEFAULT_CONFIG.dateToleranceDays;

  let bookEntries: NormalizedEntry[];
  let b2bEntries: NormalizedEntry[];
  try {
    bookEntries = await fileToEntries(booksFile);
    b2bEntries = await fileToEntries(b2bFile);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not read the files.' },
      { status: 400 },
    );
  }

  if (bookEntries.length === 0 && b2bEntries.length === 0) {
    return NextResponse.json(
      { error: 'No recognizable invoice rows were found. Check the file format against the template.' },
      { status: 400 },
    );
  }

  const { results, summary } = reconcile(bookEntries, b2bEntries, {
    taxableTolerance,
    taxTolerance,
    dateToleranceDays,
  });

  // Persist atomically: clear prior data, store new entries + results.
  await prisma.$transaction([
    prisma.gSTMatchResult.deleteMany({ where: { reconciliationId: recon.id } }),
    prisma.gSTBookEntry.deleteMany({ where: { reconciliationId: recon.id } }),
    prisma.gST2BEntry.deleteMany({ where: { reconciliationId: recon.id } }),
    prisma.gSTBookEntry.createMany({
      data: bookEntries.map((e) => ({
        reconciliationId: recon.id,
        gstin: e.gstin,
        gstinNorm: e.gstinNorm,
        vendorName: e.vendorName,
        invoiceNo: e.invoiceNo,
        invoiceNoNorm: e.invoiceNoNorm,
        invoiceDate: e.invoiceDate,
        taxableValue: e.taxableValue,
        igst: e.igst,
        cgst: e.cgst,
        sgst: e.sgst,
        totalTax: e.totalTax,
        rowIndex: e.rowIndex,
      })),
    }),
    prisma.gST2BEntry.createMany({
      data: b2bEntries.map((e) => ({
        reconciliationId: recon.id,
        gstin: e.gstin,
        gstinNorm: e.gstinNorm,
        vendorName: e.vendorName,
        invoiceNo: e.invoiceNo,
        invoiceNoNorm: e.invoiceNoNorm,
        invoiceDate: e.invoiceDate,
        taxableValue: e.taxableValue,
        igst: e.igst,
        cgst: e.cgst,
        sgst: e.sgst,
        totalTax: e.totalTax,
        rowIndex: e.rowIndex,
      })),
    }),
    prisma.gSTMatchResult.createMany({
      data: results.map((r) => ({
        reconciliationId: recon.id,
        status: r.status,
        reason: r.reason,
        gstin: r.gstin,
        vendorName: r.vendorName,
        invoiceNo: r.invoiceNo,
        invoiceDate: r.invoiceDate,
        bookTaxable: r.bookTaxable,
        bookTax: r.bookTax,
        b2bTaxable: r.b2bTaxable,
        b2bTax: r.b2bTax,
        taxDifference: r.taxDifference,
      })),
    }),
    prisma.gSTReconciliation.update({
      where: { id: recon.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  await logActivity({
    userId: user.id,
    action: 'gst.reconciliation.run',
    entityType: 'GSTReconciliation',
    entityId: recon.id,
    summary: `Ran reconciliation "${recon.title}" (${recon.client.name}) — ${summary.matched} matched, ${results.length - summary.matched} exceptions`,
  });

  return NextResponse.json({ ok: true, summary });
}

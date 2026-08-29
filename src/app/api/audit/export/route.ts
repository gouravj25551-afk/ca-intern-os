import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { buildXlsx } from '@/lib/excel';
import { labelFor } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workingPaperId = searchParams.get('workingPaperId');
  const clientId = searchParams.get('clientId');
  const area = searchParams.get('area');
  const status = searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (workingPaperId) where.id = workingPaperId;
  if (area) where.area = area;
  if (status) where.status = status;
  if (clientId) where.audit = { clientId };

  const papers = await prisma.workingPaper.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      audit: { include: { client: { select: { name: true } } } },
      preparedBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      checklist: { orderBy: { order: 'asc' } },
    },
  });

  const summaryRows = papers.map((w) => ({
    Reference: w.reference ?? '',
    Client: w.audit.client.name,
    Audit: w.audit.title,
    'Working Paper': w.title,
    Area: w.area === 'CUSTOM' ? w.customAreaName ?? 'Custom' : labelFor('auditArea', w.area),
    Status: labelFor('workingPaperStatus', w.status),
    'Review Status': labelFor('reviewStatus', w.reviewStatus),
    'Prepared By': w.preparedBy?.name ?? '',
    'Reviewed By': w.reviewedBy?.name ?? '',
    Objective: w.objective ?? '',
    'Required Documents': w.requiredDocuments ?? '',
    'Work Performed': w.workPerformed ?? '',
    Findings: w.findings ?? '',
    'Reviewer Notes': w.reviewerNotes ?? '',
    'Checklist (done/total)': `${w.checklist.filter((c) => c.isChecked).length}/${w.checklist.length}`,
  }));

  const checklistRows = papers.flatMap((w) =>
    w.checklist.map((c) => ({
      Client: w.audit.client.name,
      'Working Paper': w.title,
      Item: c.text,
      Done: c.isChecked ? 'Yes' : 'No',
      Remarks: c.remarks ?? '',
    })),
  );

  const buffer = buildXlsx([
    { name: 'Working Papers', rows: summaryRows },
    { name: 'Checklists', rows: checklistRows },
  ]);

  const filename = workingPaperId
    ? `working-paper-${workingPaperId}.xlsx`
    : `working-papers-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

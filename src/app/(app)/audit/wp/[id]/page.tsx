import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { labelFor } from '@/lib/constants';
import { toLines } from '@/lib/utils';
import { WpChecklist } from './WpChecklist';
import { WpActions } from './WpActions';
import type { WpSummaryData } from '@/lib/pdf';

export const metadata: Metadata = { title: 'Working Paper' };

export default async function WorkingPaperPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const wp = await prisma.workingPaper.findUnique({
    where: { id: params.id },
    include: {
      audit: { include: { client: true } },
      checklist: { orderBy: { order: 'asc' } },
      preparedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  if (!wp) notFound();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const areaLabel = wp.area === 'CUSTOM' ? wp.customAreaName || 'Custom' : labelFor('auditArea', wp.area);

  const pdfData: WpSummaryData = {
    title: wp.title,
    reference: wp.reference,
    clientName: wp.audit.client.name,
    auditTitle: wp.audit.title,
    area: areaLabel,
    status: labelFor('workingPaperStatus', wp.status),
    reviewStatus: labelFor('reviewStatus', wp.reviewStatus),
    preparedBy: wp.preparedBy?.name,
    reviewedBy: wp.reviewedBy?.name,
    objective: wp.objective,
    requiredDocuments: wp.requiredDocuments,
    workPerformed: wp.workPerformed,
    findings: wp.findings,
    reviewerNotes: wp.reviewerNotes,
    checklist: wp.checklist.map((c) => ({ text: c.text, isChecked: c.isChecked })),
  };

  return (
    <div>
      <Link href="/audit" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to audit papers
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {wp.reference && <span className="text-sm font-medium text-ink-400">{wp.reference}</span>}
            <h1 className="text-xl font-semibold text-ink-900">{wp.title}</h1>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            <Link href={`/clients/${wp.audit.client.id}`} className="hover:text-brand-700">{wp.audit.client.name}</Link>
            {' · '}{wp.audit.title}{' · '}{areaLabel}
          </p>
          <div className="mt-2 flex gap-2">
            <StatusBadge group="workingPaperStatus" value={wp.status} />
            <StatusBadge group="reviewStatus" value={wp.reviewStatus} />
          </div>
        </div>
        <WpActions
          wp={{
            id: wp.id,
            auditId: wp.auditId,
            reference: wp.reference,
            title: wp.title,
            area: wp.area,
            customAreaName: wp.customAreaName,
            status: wp.status,
            reviewStatus: wp.reviewStatus,
            objective: wp.objective,
            workPerformed: wp.workPerformed,
            findings: wp.findings,
            reviewerNotes: wp.reviewerNotes,
            requiredDocuments: wp.requiredDocuments,
            preparedById: wp.preparedById,
            reviewedById: wp.reviewedById,
          }}
          users={users}
          pdfData={pdfData}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title="Objective" text={wp.objective} />
          <Card>
            <CardHeader><CardTitle>Required documents</CardTitle></CardHeader>
            <CardBody>
              {toLines(wp.requiredDocuments).length === 0 ? (
                <p className="text-sm text-ink-400">None listed.</p>
              ) : (
                <ul className="list-inside list-disc space-y-1 text-sm text-ink-700">
                  {toLines(wp.requiredDocuments).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              )}
            </CardBody>
          </Card>
          <Section title="Work performed" text={wp.workPerformed} />
          <Section title="Findings / observations" text={wp.findings} />
          <Section title="Reviewer notes" text={wp.reviewerNotes} />
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Checklist</CardTitle></CardHeader>
            <CardBody>
              <WpChecklist
                workingPaperId={wp.id}
                items={wp.checklist.map((c) => ({ id: c.id, text: c.text, isChecked: c.isChecked }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Preparation</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Row label="Prepared by" value={wp.preparedBy?.name} />
              <Row label="Reviewed by" value={wp.reviewedBy?.name} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string | null }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        {text ? (
          <p className="whitespace-pre-wrap text-sm text-ink-700">{text}</p>
        ) : (
          <p className="text-sm text-ink-400">Not documented yet.</p>
        )}
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800">{value || '—'}</span>
    </div>
  );
}

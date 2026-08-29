import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { AuditView, type WpRow } from './AuditView';

export const metadata: Metadata = { title: 'Audit Papers' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  await requireUser();

  const [clients, audits, workingPapers, users] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, financialYear: true } }),
    prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } },
    }),
    prisma.workingPaper.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        audit: { include: { client: { select: { id: true, name: true } } } },
        preparedBy: { select: { name: true } },
      },
    }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const auditOptions = audits.map((a) => ({
    id: a.id,
    label: `${a.client.name} — ${a.title}`,
  }));

  const wpRows: WpRow[] = workingPapers.map((w) => ({
    id: w.id,
    reference: w.reference,
    title: w.title,
    area: w.area,
    customAreaName: w.customAreaName,
    status: w.status,
    reviewStatus: w.reviewStatus,
    auditId: w.auditId,
    auditTitle: w.audit.title,
    clientId: w.audit.client.id,
    clientName: w.audit.client.name,
    preparedByName: w.preparedBy?.name ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Audit Working Papers"
        description="Document audit work by client, audit and area. Generic working-paper templates — not an official ICAI checklist."
      />
      <AuditView
        workingPapers={wpRows}
        clients={clients}
        audits={auditOptions}
        users={users}
        defaultClientId={searchParams.clientId}
      />
    </div>
  );
}

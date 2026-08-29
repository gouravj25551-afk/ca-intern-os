import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComplianceView, type TaskRow } from './ComplianceView';

export const metadata: Metadata = { title: 'Compliance' };

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  await requireUser();
  const [clients, tasks] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.complianceTask.findMany({
      orderBy: { dueDate: 'asc' },
      include: { client: { select: { id: true, name: true } } },
    }),
  ]);

  const rows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    period: t.period,
    dueDate: t.dueDate.toISOString().slice(0, 10),
    assignedTo: t.assignedTo,
    status: t.status,
    priority: t.priority,
    notes: t.notes,
    clientId: t.client.id,
    clientName: t.client.name,
    isSample: t.isSample,
  }));

  return (
    <div>
      <PageHeader
        title="Compliance Calendar"
        description="Track client-wise compliance tasks. Enter due dates manually and verify statutory dates independently — this tool does not assert deadlines."
      />
      <ComplianceView tasks={rows} clients={clients} defaultClientId={searchParams.clientId} />
    </div>
  );
}

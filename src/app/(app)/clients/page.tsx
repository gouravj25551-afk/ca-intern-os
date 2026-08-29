import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientsView, type ClientRow } from './ClientsView';

export const metadata: Metadata = { title: 'Clients' };

export default async function ClientsPage() {
  await requireUser();
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { audits: true, complianceTasks: true, reconciliations: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="The central record for each client — links audit work, GST reconciliations and compliance."
      />
      <ClientsView clients={clients as unknown as ClientRow[]} />
    </div>
  );
}

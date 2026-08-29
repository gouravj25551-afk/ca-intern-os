import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { GstListView, type ReconRow } from './GstListView';

export const metadata: Metadata = { title: 'GST Reconciliation' };

export default async function GstPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  await requireUser();
  const [clients, reconciliations] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.gSTReconciliation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
    }),
  ]);

  const rows: ReconRow[] = reconciliations.map((r) => ({
    id: r.id,
    title: r.title,
    period: r.period,
    clientName: r.client.name,
    clientId: r.client.id,
    resultCount: r._count.results,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="GST Reconciliation"
        description="Compare your Purchase Register with GSTR-2B. Fully deterministic matching — every exception is explained. Not a substitute for professional GST review."
      />
      <GstListView reconciliations={rows} clients={clients} defaultClientId={searchParams.clientId} />
    </div>
  );
}

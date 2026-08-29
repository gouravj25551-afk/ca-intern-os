'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, GitCompareArrows, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/dates';
import { NewReconciliationForm, type ClientOption } from './NewReconciliationForm';
import { deleteReconciliation } from './actions';

export interface ReconRow {
  id: string;
  title: string;
  period: string | null;
  clientName: string;
  clientId: string;
  resultCount: number;
  updatedAt: string;
}

export function GstListView({
  reconciliations,
  clients,
  defaultClientId,
}: {
  reconciliations: ReconRow[];
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ReconRow | null>(null);
  const [pending, setPending] = React.useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    const res = await deleteReconciliation(deleting.id);
    setPending(false);
    if (!res.ok) return toast.error(res.error);
    toast.success('Reconciliation deleted.');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New reconciliation
        </Button>
      </div>

      {reconciliations.length === 0 ? (
        <EmptyState
          icon={<GitCompareArrows className="h-5 w-5" />}
          title="No reconciliations yet"
          description="Create a reconciliation, then upload your Purchase Register and GSTR-2B to compare them."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New reconciliation</Button>}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Reconciliation</Th>
              <Th>Client</Th>
              <Th>Period</Th>
              <Th>Results</Th>
              <Th>Updated</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {reconciliations.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <Link href={`/gst/${r.id}`} className="inline-flex items-center gap-1 font-medium text-ink-900 hover:text-brand-700">
                    {r.title} <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                  </Link>
                </Td>
                <Td>
                  <Link href={`/clients/${r.clientId}`} className="hover:text-brand-700">{r.clientName}</Link>
                </Td>
                <Td>{r.period ?? '—'}</Td>
                <Td>{r.resultCount > 0 ? `${r.resultCount} rows` : 'Not run'}</Td>
                <Td className="text-ink-500">{formatDate(r.updatedAt)}</Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New GST reconciliation" size="lg">
        <NewReconciliationForm clients={clients} defaultClientId={defaultClientId} onDone={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete reconciliation?"
        message={`This permanently deletes "${deleting?.title}" and all its uploaded data and results.`}
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

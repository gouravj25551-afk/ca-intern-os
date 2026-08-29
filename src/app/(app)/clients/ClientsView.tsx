'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { toast } from '@/components/ui/Toast';
import { ENTITY_TYPES, labelFor } from '@/lib/constants';
import { ClientForm, type ClientFormValues } from './ClientForm';
import { deleteClient } from './actions';

export interface ClientRow extends ClientFormValues {
  id: string;
  name: string;
  entityType: string;
  financialYear: string;
  isSample: boolean;
  _count: { audits: number; complianceTasks: number; reconciliations: number };
}

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [entityFilter, setEntityFilter] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClientRow | null>(null);
  const [deleting, setDeleting] = React.useState<ClientRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.gstin ?? '').toLowerCase().includes(q) ||
      (c.contactPerson ?? '').toLowerCase().includes(q);
    const matchesEntity = !entityFilter || c.entityType === entityFilter;
    return matchesQuery && matchesEntity;
  });

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const res = await deleteClient(deleting.id);
    setDeletePending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Client deleted.');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search by name, GSTIN or contact…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="sm:w-56"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add client
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title="No active clients yet"
          description="Add your first client to start tracking audit work, GST reconciliations and compliance."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first client
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No clients match your filters" description="Try a different search term or entity type." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Client</Th>
              <Th>Entity</Th>
              <Th>FY</Th>
              <Th>Work</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <Link href={`/clients/${c.id}`} className="group inline-flex items-center gap-1 font-medium text-ink-900 hover:text-brand-700">
                    {c.name}
                    <ChevronRight className="h-3.5 w-3.5 text-ink-300 group-hover:text-brand-600" />
                  </Link>
                  {c.isSample && <Badge tone="amber" className="ml-2">SAMPLE</Badge>}
                  {c.gstin && <div className="text-xs text-ink-400">{c.gstin}</div>}
                </Td>
                <Td>{labelFor('entityType', c.entityType)}</Td>
                <Td>{c.financialYear}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1 text-xs text-ink-500">
                    <span>{c._count.audits} audits</span>·
                    <span>{c._count.reconciliations} recons</span>·
                    <span>{c._count.complianceTasks} tasks</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add client" size="lg">
        <ClientForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit client" size="lg">
        {editing && <ClientForm initial={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete client?"
        message={`This permanently deletes "${deleting?.name}" and all its audit work, reconciliations and compliance tasks. This cannot be undone.`}
        confirmLabel="Delete client"
        destructive
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

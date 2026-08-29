'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Search, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { AUDIT_AREAS, WORKING_PAPER_STATUSES, labelFor } from '@/lib/constants';
import { NewAuditForm, type ClientOption } from './NewAuditForm';
import { WorkingPaperForm, type AuditOption, type UserOption } from './WorkingPaperForm';

export interface WpRow {
  id: string;
  reference: string | null;
  title: string;
  area: string;
  customAreaName: string | null;
  status: string;
  reviewStatus: string;
  auditId: string;
  auditTitle: string;
  clientId: string;
  clientName: string;
  preparedByName: string | null;
}

export function AuditView({
  workingPapers,
  clients,
  audits,
  users,
  defaultClientId,
}: {
  workingPapers: WpRow[];
  clients: ClientOption[];
  audits: AuditOption[];
  users: UserOption[];
  defaultClientId?: string;
}) {
  const [query, setQuery] = React.useState('');
  const [clientId, setClientId] = React.useState(defaultClientId ?? '');
  const [area, setArea] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [newAudit, setNewAudit] = React.useState(false);
  const [newWp, setNewWp] = React.useState(false);

  const filtered = workingPapers.filter((w) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      w.title.toLowerCase().includes(q) ||
      (w.reference ?? '').toLowerCase().includes(q) ||
      w.clientName.toLowerCase().includes(q);
    return (
      matchesQ &&
      (!clientId || w.clientId === clientId) &&
      (!area || w.area === area) &&
      (!status || w.status === status)
    );
  });

  const exportParams = new URLSearchParams();
  if (clientId) exportParams.set('clientId', clientId);
  if (area) exportParams.set('area', area);
  if (status) exportParams.set('status', status);
  const exportUrl = `/api/audit/export?${exportParams.toString()}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search working papers…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-44">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="w-44">
          <option value="">All areas</option>
          {AUDIT_AREAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          {WORKING_PAPER_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-500">{filtered.length} working paper{filtered.length === 1 ? '' : 's'}</p>
        <div className="flex gap-2">
          <a href={exportUrl}>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export Excel</Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => setNewAudit(true)}>
            <Plus className="h-4 w-4" /> New audit
          </Button>
          <Button size="sm" onClick={() => setNewWp(true)} disabled={audits.length === 0}>
            <Plus className="h-4 w-4" /> New working paper
          </Button>
        </div>
      </div>

      {workingPapers.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No working papers yet"
          description={audits.length === 0
            ? 'Create an audit first, then add working papers to it.'
            : 'Add your first working paper to start documenting audit work.'}
          action={audits.length === 0
            ? <Button onClick={() => setNewAudit(true)}><Plus className="h-4 w-4" /> Create an audit</Button>
            : <Button onClick={() => setNewWp(true)}><Plus className="h-4 w-4" /> New working paper</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No working papers match your filters" description="Adjust the search or filters above." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Ref</Th>
              <Th>Working paper</Th>
              <Th>Client</Th>
              <Th>Area</Th>
              <Th>Status</Th>
              <Th>Review</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((w) => (
              <Tr key={w.id}>
                <Td className="text-ink-500">{w.reference ?? '—'}</Td>
                <Td>
                  <Link href={`/audit/wp/${w.id}`} className="font-medium text-ink-900 hover:text-brand-700">{w.title}</Link>
                  <div className="text-xs text-ink-400">{w.auditTitle}</div>
                </Td>
                <Td>
                  <Link href={`/clients/${w.clientId}`} className="hover:text-brand-700">{w.clientName}</Link>
                </Td>
                <Td>{w.area === 'CUSTOM' ? (w.customAreaName ?? 'Custom') : labelFor('auditArea', w.area)}</Td>
                <Td><StatusBadge group="workingPaperStatus" value={w.status} /></Td>
                <Td><StatusBadge group="reviewStatus" value={w.reviewStatus} /></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal open={newAudit} onClose={() => setNewAudit(false)} title="New audit" size="lg">
        <NewAuditForm clients={clients} defaultClientId={defaultClientId} onDone={() => setNewAudit(false)} />
      </Modal>
      <Modal open={newWp} onClose={() => setNewWp(false)} title="New working paper" size="xl">
        <WorkingPaperForm audits={audits} users={users} onDone={() => setNewWp(false)} />
      </Modal>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, Check, CalendarClock,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { toast } from '@/components/ui/Toast';
import { COMPLIANCE_TYPES, COMPLIANCE_STATUSES, labelFor } from '@/lib/constants';
import { formatDate, dueBucket } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { ComplianceForm, type ClientOption, type TaskValues } from './ComplianceForm';
import { setComplianceStatus, deleteComplianceTask } from './actions';

export interface TaskRow {
  id: string;
  title: string;
  type: string;
  period: string | null;
  dueDate: string; // ISO date (yyyy-mm-dd)
  assignedTo: string | null;
  status: string;
  priority: string;
  notes: string | null;
  clientId: string;
  clientName: string;
  isSample: boolean;
}

type ViewMode = 'list' | 'week' | 'month';

function effectiveStatus(t: TaskRow): string {
  if (t.status === 'COMPLETED') return 'COMPLETED';
  const bucket = dueBucket(new Date(t.dueDate), false);
  return bucket === 'overdue' ? 'OVERDUE' : t.status;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <div className={cn('text-2xl font-semibold', tone ?? 'text-ink-900')}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-500">{label}</div>
    </div>
  );
}

export function ComplianceView({
  tasks,
  clients,
  defaultClientId,
}: {
  tasks: TaskRow[];
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [view, setView] = React.useState<ViewMode>('list');
  const [query, setQuery] = React.useState('');
  const [clientId, setClientId] = React.useState(defaultClientId ?? '');
  const [type, setType] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [cursor, setCursor] = React.useState(() => new Date());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [deleting, setDeleting] = React.useState<TaskRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  const withEffective = tasks.map((t) => ({ ...t, eff: effectiveStatus(t) }));

  const counts = React.useMemo(() => {
    const c = { today: 0, week: 0, upcoming: 0, overdue: 0, completed: 0 };
    for (const t of tasks) {
      const b = dueBucket(new Date(t.dueDate), t.status === 'COMPLETED');
      if (b === 'today') c.today++;
      else if (b === 'this-week') c.week++;
      else if (b === 'upcoming') c.upcoming++;
      else if (b === 'overdue') c.overdue++;
      else if (b === 'completed') c.completed++;
    }
    return c;
  }, [tasks]);

  const filtered = withEffective.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || t.title.toLowerCase().includes(q) || t.clientName.toLowerCase().includes(q);
    return (
      matchesQ &&
      (!clientId || t.clientId === clientId) &&
      (!type || t.type === type) &&
      (!statusFilter || t.eff === statusFilter)
    );
  });

  async function markComplete(t: TaskRow) {
    setBusy(true);
    const res = await setComplianceStatus(t.id, 'COMPLETED');
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success('Marked completed.');
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const res = await deleteComplianceTask(deleting.id);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success('Task deleted.');
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Due today" value={counts.today} tone="text-brand-600" />
        <Stat label="Due this week" value={counts.week} tone="text-amber-600" />
        <Stat label="Upcoming" value={counts.upcoming} />
        <Stat label="Overdue" value={counts.overdue} tone="text-red-600" />
        <Stat label="Completed" value={counts.completed} tone="text-emerald-600" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
          {(['list', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium capitalize',
                view === v ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-40">
          <option value="">All clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-36">
          <option value="">All types</option>
          {COMPLIANCE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="">All statuses</option>
          {COMPLIANCE_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add task</Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-5 w-5" />}
          title="No compliance tasks yet"
          description="Add your first compliance task. Due dates are entered manually — verify statutory dates independently."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add task</Button>}
        />
      ) : view === 'list' ? (
        <ListView tasks={filtered} onComplete={markComplete} onEdit={setEditing} onDelete={setDeleting} busy={busy} />
      ) : view === 'week' ? (
        <WeekView tasks={filtered} cursor={cursor} setCursor={setCursor} onEdit={setEditing} />
      ) : (
        <MonthView tasks={filtered} cursor={cursor} setCursor={setCursor} onEdit={setEditing} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add compliance task" size="lg">
        <ComplianceForm clients={clients} defaultClientId={defaultClientId} onDone={() => setCreateOpen(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit compliance task" size="lg">
        {editing && (
          <ComplianceForm
            clients={clients}
            initial={{ ...editing } as TaskValues}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

type EffTask = TaskRow & { eff: string };

function ListView({
  tasks, onComplete, onEdit, onDelete, busy,
}: {
  tasks: EffTask[];
  onComplete: (t: TaskRow) => void;
  onEdit: (t: TaskRow) => void;
  onDelete: (t: TaskRow) => void;
  busy: boolean;
}) {
  if (tasks.length === 0) {
    return <EmptyState title="No tasks match your filters" />;
  }
  const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Task</Th>
          <Th>Client</Th>
          <Th>Type</Th>
          <Th>Due</Th>
          <Th>Priority</Th>
          <Th>Status</Th>
          <Th className="text-right">Actions</Th>
        </Tr>
      </Thead>
      <Tbody>
        {sorted.map((t) => (
          <Tr key={t.id}>
            <Td>
              <div className="font-medium text-ink-900">{t.title}</div>
              {t.period && <div className="text-xs text-ink-400">{t.period}</div>}
              {t.isSample && <Badge tone="amber" className="mt-1">SAMPLE</Badge>}
            </Td>
            <Td><Link href={`/clients/${t.clientId}`} className="hover:text-brand-700">{t.clientName}</Link></Td>
            <Td>{labelFor('complianceType', t.type)}</Td>
            <Td className={t.eff === 'OVERDUE' ? 'font-medium text-red-600' : ''}>{formatDate(t.dueDate)}</Td>
            <Td><StatusBadge group="priority" value={t.priority} /></Td>
            <Td><StatusBadge group="complianceStatus" value={t.eff} /></Td>
            <Td>
              <div className="flex justify-end gap-1">
                {t.status !== 'COMPLETED' && (
                  <Button size="sm" variant="ghost" onClick={() => onComplete(t)} disabled={busy} aria-label="Mark complete">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onEdit(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(t)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 Sun
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function WeekView({
  tasks, cursor, setCursor, onEdit,
}: {
  tasks: EffTask[];
  cursor: Date;
  setCursor: (d: Date) => void;
  onEdit: (t: TaskRow) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const todayIso = iso(new Date());

  return (
    <div>
      <CalNav
        label={`Week of ${formatDate(start)}`}
        onPrev={() => { const d = new Date(start); d.setDate(d.getDate() - 7); setCursor(d); }}
        onNext={() => { const d = new Date(start); d.setDate(d.getDate() + 7); setCursor(d); }}
        onToday={() => setCursor(new Date())}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {days.map((d) => {
          const key = iso(d);
          const dayTasks = tasks.filter((t) => t.dueDate === key);
          return (
            <div key={key} className={cn('rounded-lg border p-2', key === todayIso ? 'border-brand-300 bg-brand-50/40' : 'border-ink-200 bg-white')}>
              <div className="mb-2 text-xs font-medium text-ink-500">
                {d.toLocaleDateString('en-IN', { weekday: 'short' })} {d.getDate()}
              </div>
              <div className="space-y-1.5">
                {dayTasks.map((t) => (
                  <button key={t.id} onClick={() => onEdit(t)} className="block w-full rounded-md border border-ink-100 bg-white px-2 py-1 text-left text-xs hover:border-brand-300">
                    <div className="truncate font-medium text-ink-800">{t.title}</div>
                    <div className="truncate text-ink-400">{t.clientName}</div>
                  </button>
                ))}
                {dayTasks.length === 0 && <div className="text-[11px] text-ink-300">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  tasks, cursor, setCursor, onEdit,
}: {
  tasks: EffTask[];
  cursor: Date;
  setCursor: (d: Date) => void;
  onEdit: (t: TaskRow) => void;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const todayIso = iso(new Date());

  return (
    <div>
      <CalNav
        label={cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        onPrev={() => setCursor(new Date(year, month - 1, 1))}
        onNext={() => setCursor(new Date(year, month + 1, 1))}
        onToday={() => setCursor(new Date())}
      />
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-ink-50 py-1.5 text-center font-medium text-ink-500">{d}</div>
        ))}
        {cells.map((d) => {
          const key = iso(d);
          const dayTasks = tasks.filter((t) => t.dueDate === key);
          const inMonth = d.getMonth() === month;
          return (
            <div key={key} className={cn('min-h-[84px] bg-white p-1', !inMonth && 'bg-ink-50/60 text-ink-300')}>
              <div className={cn('mb-1 text-right text-[11px]', key === todayIso && 'font-bold text-brand-600')}>{d.getDate()}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    className={cn(
                      'block w-full truncate rounded px-1 py-0.5 text-left text-[11px]',
                      t.eff === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                      t.eff === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-700',
                    )}
                    title={`${t.title} — ${t.clientName}`}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && <div className="text-[10px] text-ink-400">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalNav({ label, onPrev, onNext, onToday }: { label: string; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink-800">{label}</h3>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={onToday}>Today</Button>
        <Button size="sm" variant="ghost" onClick={onPrev} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={onNext} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

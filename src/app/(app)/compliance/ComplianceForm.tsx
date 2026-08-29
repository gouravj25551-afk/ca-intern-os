'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { COMPLIANCE_TYPES, COMPLIANCE_STATUSES, PRIORITIES } from '@/lib/constants';
import { createComplianceTask, updateComplianceTask } from './actions';

export interface ClientOption { id: string; name: string }
export interface TaskValues {
  id?: string;
  clientId?: string;
  title?: string;
  type?: string;
  period?: string | null;
  dueDate?: string;
  assignedTo?: string | null;
  status?: string;
  priority?: string;
  notes?: string | null;
}

export function ComplianceForm({
  clients,
  initial,
  defaultClientId,
  onDone,
}: {
  clients: ClientOption[];
  initial?: TaskValues;
  defaultClientId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const res = initial?.id
      ? await updateComplianceTask(initial.id, fd)
      : await createComplianceTask(fd);
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success(initial?.id ? 'Task updated.' : 'Task added.');
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Client" htmlFor="clientId" required error={errors.clientId}>
        <Select id="clientId" name="clientId" defaultValue={initial?.clientId ?? defaultClientId ?? ''}>
          <option value="">Select a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Task title" htmlFor="title" required error={errors.title}>
        <Input id="title" name="title" defaultValue={initial?.title ?? ''} placeholder="e.g. File GSTR-3B" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Compliance type" htmlFor="type" required>
          <Select id="type" name="type" defaultValue={initial?.type ?? 'GST'}>
            {COMPLIANCE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Period" htmlFor="period" hint="e.g. Apr-2024, Q1 FY24-25">
          <Input id="period" name="period" defaultValue={initial?.period ?? ''} />
        </Field>
        <Field label="Due date" htmlFor="dueDate" required error={errors.dueDate}>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={initial?.dueDate ?? ''} required />
        </Field>
        <Field label="Assigned to" htmlFor="assignedTo">
          <Input id="assignedTo" name="assignedTo" defaultValue={initial?.assignedTo ?? ''} />
        </Field>
        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={initial?.status ?? 'PENDING'}>
            {COMPLIANCE_STATUSES.filter((s) => s.value !== 'OVERDUE').map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="priority" required>
          <Select id="priority" name="priority" defaultValue={initial?.priority ?? 'MEDIUM'}>
            {PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ''} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        {onDone && <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>}
        <Button type="submit" loading={pending}>{initial?.id ? 'Save changes' : 'Add task'}</Button>
      </div>
    </form>
  );
}

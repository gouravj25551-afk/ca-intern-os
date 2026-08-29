'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createAudit } from './actions';

export interface ClientOption { id: string; name: string; financialYear: string }

export function NewAuditForm({
  clients,
  defaultClientId,
  onDone,
}: {
  clients: ClientOption[];
  defaultClientId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [clientId, setClientId] = React.useState(defaultClientId ?? '');

  const selectedFy = clients.find((c) => c.id === clientId)?.financialYear ?? '';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const res = await createAudit(new FormData(e.currentTarget));
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success('Audit created.');
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Client" htmlFor="clientId" required error={errors.clientId}>
        <Select id="clientId" name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Audit title" htmlFor="title" required error={errors.title}>
          <Input id="title" name="title" placeholder="Statutory Audit FY 2024-25" required />
        </Field>
        <Field label="Audit type" htmlFor="auditType" required error={errors.auditType}>
          <Input id="auditType" name="auditType" defaultValue="Statutory Audit" required />
        </Field>
        <Field label="Financial year" htmlFor="financialYear" required error={errors.financialYear}>
          <Input id="financialYear" name="financialYear" defaultValue={selectedFy} key={selectedFy} placeholder="2024-25" required />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        {onDone && <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>}
        <Button type="submit" loading={pending}>Create audit</Button>
      </div>
    </form>
  );
}

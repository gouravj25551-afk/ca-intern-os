'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { createReconciliation } from './actions';

export interface ClientOption { id: string; name: string }

export function NewReconciliationForm({
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const res = await createReconciliation(new FormData(e.currentTarget));
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success('Reconciliation created. Upload files to run it.');
    router.refresh();
    if (res.data) router.push(`/gst/${res.data.id}`);
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Client" htmlFor="clientId" required error={errors.clientId}>
        <Select id="clientId" name="clientId" defaultValue={defaultClientId ?? ''}>
          <option value="">Select a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" required error={errors.title}>
          <Input id="title" name="title" placeholder="GSTR-2B vs Books — Apr 2024" required />
        </Field>
        <Field label="Period" htmlFor="period" hint="e.g. Apr-2024 or 2024-25">
          <Input id="period" name="period" placeholder="Apr-2024" />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        {onDone && <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>}
        <Button type="submit" loading={pending}>Create reconciliation</Button>
      </div>
    </form>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { ENTITY_TYPES } from '@/lib/constants';
import { createClient, updateClient, type Result } from './actions';

export interface ClientFormValues {
  id?: string;
  name?: string;
  entityType?: string;
  financialYear?: string;
  gstin?: string | null;
  pan?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export function ClientForm({
  initial,
  onDone,
}: {
  initial?: ClientFormValues;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);
    let res: Result<{ id: string }> | Result;
    if (initial?.id) {
      res = await updateClient(initial.id, formData);
    } else {
      res = await createClient(formData);
    }
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success(initial?.id ? 'Client updated.' : 'Client added.');
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client name" htmlFor="name" required error={errors.name} className="sm:col-span-2">
          <Input id="name" name="name" defaultValue={initial?.name ?? ''} required />
        </Field>
        <Field label="Entity type" htmlFor="entityType" required error={errors.entityType}>
          <Select id="entityType" name="entityType" defaultValue={initial?.entityType ?? 'PRIVATE_LIMITED'}>
            {ENTITY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Financial year" htmlFor="financialYear" required error={errors.financialYear} hint="e.g. 2024-25">
          <Input id="financialYear" name="financialYear" defaultValue={initial?.financialYear ?? ''} placeholder="2024-25" required />
        </Field>
        <Field label="GSTIN" htmlFor="gstin" error={errors.gstin}>
          <Input id="gstin" name="gstin" defaultValue={initial?.gstin ?? ''} placeholder="Optional" />
        </Field>
        <Field label="PAN" htmlFor="pan" error={errors.pan}>
          <Input id="pan" name="pan" defaultValue={initial?.pan ?? ''} placeholder="Optional" />
        </Field>
        <Field label="Contact person" htmlFor="contactPerson" error={errors.contactPerson}>
          <Input id="contactPerson" name="contactPerson" defaultValue={initial?.contactPerson ?? ''} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ''} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone} className="sm:col-span-2">
          <Input id="phone" name="phone" defaultValue={initial?.phone ?? ''} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ''} placeholder="Any relevant background, engagement details, etc." />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending}>
          {initial?.id ? 'Save changes' : 'Add client'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { AUDIT_AREAS, WORKING_PAPER_STATUSES, REVIEW_STATUSES } from '@/lib/constants';
import { templateFor } from '@/lib/audit-templates';
import { createWorkingPaper, updateWorkingPaper } from './actions';

export interface WpValues {
  id?: string;
  auditId?: string;
  reference?: string | null;
  title?: string;
  area?: string;
  customAreaName?: string | null;
  status?: string;
  reviewStatus?: string;
  objective?: string | null;
  workPerformed?: string | null;
  findings?: string | null;
  reviewerNotes?: string | null;
  requiredDocuments?: string | null;
  preparedById?: string | null;
  reviewedById?: string | null;
}

export interface UserOption { id: string; name: string }
export interface AuditOption { id: string; label: string }

export function WorkingPaperForm({
  initial,
  audits,
  users,
  lockedAuditId,
  onDone,
}: {
  initial?: WpValues;
  audits: AuditOption[];
  users: UserOption[];
  lockedAuditId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [area, setArea] = React.useState(initial?.area ?? 'CASH_AND_BANK');
  const [objective, setObjective] = React.useState(initial?.objective ?? '');
  const [checklistText, setChecklistText] = React.useState('');
  const [requiredDocs, setRequiredDocs] = React.useState(initial?.requiredDocuments ?? '');

  function applyTemplate() {
    const t = templateFor(area);
    setObjective(t.objective);
    setRequiredDocs(t.requiredDocuments.join('\n'));
    setChecklistText(t.checklist.join('\n'));
    toast.info('Template applied — edit as needed for this engagement.');
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const res = initial?.id
      ? await updateWorkingPaper(initial.id, formData)
      : await createWorkingPaper(formData);
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success(initial?.id ? 'Working paper saved.' : 'Working paper created.');
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!initial?.id && (
        <Field label="Audit" htmlFor="auditId" required error={errors.auditId}>
          <Select id="auditId" name="auditId" defaultValue={lockedAuditId ?? initial?.auditId ?? ''} disabled={!!lockedAuditId}>
            <option value="">Select an audit…</option>
            {audits.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </Select>
          {lockedAuditId && <input type="hidden" name="auditId" value={lockedAuditId} />}
        </Field>
      )}
      {initial?.id && <input type="hidden" name="auditId" value={initial.auditId ?? ''} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Reference" htmlFor="reference" hint="e.g. WP-A-1">
          <Input id="reference" name="reference" defaultValue={initial?.reference ?? ''} />
        </Field>
        <Field label="Title" htmlFor="title" required error={errors.title}>
          <Input id="title" name="title" defaultValue={initial?.title ?? ''} required />
        </Field>
        <Field label="Audit area" htmlFor="area" required>
          <Select id="area" name="area" value={area} onChange={(e) => setArea(e.target.value)}>
            {AUDIT_AREAS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        {area === 'CUSTOM' && (
          <Field label="Custom area name" htmlFor="customAreaName">
            <Input id="customAreaName" name="customAreaName" defaultValue={initial?.customAreaName ?? ''} />
          </Field>
        )}
        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={initial?.status ?? 'NOT_STARTED'}>
            {WORKING_PAPER_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Review status" htmlFor="reviewStatus" required>
          <Select id="reviewStatus" name="reviewStatus" defaultValue={initial?.reviewStatus ?? 'NOT_REVIEWED'}>
            {REVIEW_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prepared by" htmlFor="preparedById">
          <Select id="preparedById" name="preparedById" defaultValue={initial?.preparedById ?? ''}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Field label="Reviewed by" htmlFor="reviewedById">
          <Select id="reviewedById" name="reviewedById" defaultValue={initial?.reviewedById ?? ''}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
      </div>

      <div className="rounded-lg bg-ink-50 px-3 py-2">
        <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
          Prefill from generic {AUDIT_AREAS.find((a) => a.value === area)?.label} template
        </Button>
        <p className="mt-1 text-xs text-ink-400">
          Generic common-practice prompts to save typing — adapt to the engagement. Not an official checklist.
        </p>
      </div>

      <Field label="Objective" htmlFor="objective">
        <Textarea id="objective" name="objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} />
      </Field>
      <Field label="Required documents" htmlFor="requiredDocuments" hint="One per line">
        <Textarea id="requiredDocuments" name="requiredDocuments" value={requiredDocs} onChange={(e) => setRequiredDocs(e.target.value)} />
      </Field>
      <Field label="Work performed" htmlFor="workPerformed">
        <Textarea id="workPerformed" name="workPerformed" defaultValue={initial?.workPerformed ?? ''} />
      </Field>
      <Field label="Findings / observations" htmlFor="findings">
        <Textarea id="findings" name="findings" defaultValue={initial?.findings ?? ''} />
      </Field>
      <Field label="Reviewer notes" htmlFor="reviewerNotes">
        <Textarea id="reviewerNotes" name="reviewerNotes" defaultValue={initial?.reviewerNotes ?? ''} />
      </Field>

      {/* Only used on create to seed the checklist via a hidden field. */}
      {!initial?.id && checklistText && (
        <input type="hidden" name="_seedChecklist" value={checklistText} />
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>
        )}
        <Button type="submit" loading={pending}>
          {initial?.id ? 'Save changes' : 'Create working paper'}
        </Button>
      </div>
    </form>
  );
}

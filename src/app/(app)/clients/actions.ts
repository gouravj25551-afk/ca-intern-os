'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { clientSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';

export type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrors(
  err: import('zod').ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}

function parseClient(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get('name'),
    entityType: formData.get('entityType'),
    financialYear: formData.get('financialYear'),
    gstin: formData.get('gstin'),
    pan: formData.get('pan'),
    contactPerson: formData.get('contactPerson'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });
}

export async function createClient(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = parseClient(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const client = await prisma.client.create({
    data: {
      name: d.name,
      entityType: d.entityType,
      financialYear: d.financialYear,
      gstin: d.gstin ?? null,
      pan: d.pan ?? null,
      contactPerson: d.contactPerson ?? null,
      email: d.email || null,
      phone: d.phone ?? null,
      notes: d.notes ?? null,
      ownerId: user.id,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'client.created',
    entityType: 'Client',
    entityId: client.id,
    summary: `Added client "${client.name}"`,
  });
  revalidatePath('/clients');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: client.id } };
}

export async function updateClient(
  id: string,
  formData: FormData,
): Promise<Result> {
  const user = await requireUser();
  const parsed = parseClient(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Client not found.' };

  await prisma.client.update({
    where: { id },
    data: {
      name: d.name,
      entityType: d.entityType,
      financialYear: d.financialYear,
      gstin: d.gstin ?? null,
      pan: d.pan ?? null,
      contactPerson: d.contactPerson ?? null,
      email: d.email || null,
      phone: d.phone ?? null,
      notes: d.notes ?? null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'client.updated',
    entityType: 'Client',
    entityId: id,
    summary: `Updated client "${d.name}"`,
  });
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}

export async function deleteClient(id: string): Promise<Result> {
  const user = await requireUser();
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Client not found.' };

  // Cascades remove audits, reconciliations, compliance tasks & attachments.
  await prisma.client.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: 'client.deleted',
    entityType: 'Client',
    entityId: id,
    summary: `Deleted client "${existing.name}"`,
  });
  revalidatePath('/clients');
  revalidatePath('/dashboard');
  return { ok: true };
}

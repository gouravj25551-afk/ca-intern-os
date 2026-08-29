'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { complianceTaskSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';
import type { Result } from '../clients/actions';

function fieldErrors(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}

function parse(formData: FormData) {
  return complianceTaskSchema.safeParse({
    clientId: formData.get('clientId'),
    title: formData.get('title'),
    type: formData.get('type'),
    period: formData.get('period'),
    dueDate: formData.get('dueDate'),
    assignedTo: formData.get('assignedTo'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    notes: formData.get('notes'),
  });
}

export async function createComplianceTask(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const client = await prisma.client.findUnique({ where: { id: d.clientId } });
  if (!client) return { ok: false, error: 'Client not found.' };

  const dueDate = new Date(d.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { ok: false, error: 'Invalid due date.', fieldErrors: { dueDate: 'Invalid date' } };
  }

  const task = await prisma.complianceTask.create({
    data: {
      clientId: d.clientId,
      title: d.title,
      type: d.type,
      period: d.period ?? null,
      dueDate,
      assignedTo: d.assignedTo ?? null,
      status: d.status,
      priority: d.priority,
      notes: d.notes ?? null,
      completedAt: d.status === 'COMPLETED' ? new Date() : null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'compliance.created',
    entityType: 'ComplianceTask',
    entityId: task.id,
    summary: `Added compliance task "${task.title}" for ${client.name}`,
  });
  revalidatePath('/compliance');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateComplianceTask(id: string, formData: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const existing = await prisma.complianceTask.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Task not found.' };

  const dueDate = new Date(d.dueDate);
  await prisma.complianceTask.update({
    where: { id },
    data: {
      clientId: d.clientId,
      title: d.title,
      type: d.type,
      period: d.period ?? null,
      dueDate,
      assignedTo: d.assignedTo ?? null,
      status: d.status,
      priority: d.priority,
      notes: d.notes ?? null,
      completedAt:
        d.status === 'COMPLETED'
          ? existing.completedAt ?? new Date()
          : null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'compliance.updated',
    entityType: 'ComplianceTask',
    entityId: id,
    summary: `Updated compliance task "${d.title}"`,
  });
  revalidatePath('/compliance');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function setComplianceStatus(
  id: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE',
): Promise<Result> {
  const user = await requireUser();
  const existing = await prisma.complianceTask.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Task not found.' };
  await prisma.complianceTask.update({
    where: { id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? existing.completedAt ?? new Date() : null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'compliance.status',
    entityType: 'ComplianceTask',
    entityId: id,
    summary: `Marked "${existing.title}" as ${status.toLowerCase()}`,
  });
  revalidatePath('/compliance');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteComplianceTask(id: string): Promise<Result> {
  const user = await requireUser();
  const existing = await prisma.complianceTask.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Task not found.' };
  await prisma.complianceTask.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: 'compliance.deleted',
    entityType: 'ComplianceTask',
    entityId: id,
    summary: `Deleted compliance task "${existing.title}"`,
  });
  revalidatePath('/compliance');
  revalidatePath('/dashboard');
  return { ok: true };
}

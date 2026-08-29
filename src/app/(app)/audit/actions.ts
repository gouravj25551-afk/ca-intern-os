'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { auditSchema, workingPaperSchema } from '@/lib/validation';
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

// ---- Audits ----------------------------------------------------------------

export async function createAudit(formData: FormData): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = auditSchema.safeParse({
    clientId: formData.get('clientId'),
    title: formData.get('title'),
    financialYear: formData.get('financialYear'),
    auditType: formData.get('auditType'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const client = await prisma.client.findUnique({ where: { id: d.clientId } });
  if (!client) return { ok: false, error: 'Client not found.' };

  const audit = await prisma.audit.create({
    data: {
      clientId: d.clientId,
      title: d.title,
      financialYear: d.financialYear,
      auditType: d.auditType,
      notes: d.notes ?? null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'audit.created',
    entityType: 'Audit',
    entityId: audit.id,
    summary: `Created audit "${audit.title}" for ${client.name}`,
  });
  revalidatePath('/audit');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: audit.id } };
}

export async function deleteAudit(id: string): Promise<Result> {
  const user = await requireUser();
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) return { ok: false, error: 'Audit not found.' };
  await prisma.audit.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: 'audit.deleted',
    entityType: 'Audit',
    entityId: id,
    summary: `Deleted audit "${audit.title}"`,
  });
  revalidatePath('/audit');
  return { ok: true };
}

// ---- Working papers --------------------------------------------------------

function parseWp(formData: FormData) {
  return workingPaperSchema.safeParse({
    auditId: formData.get('auditId'),
    title: formData.get('title'),
    area: formData.get('area'),
    customAreaName: formData.get('customAreaName'),
    reference: formData.get('reference'),
    status: formData.get('status'),
    reviewStatus: formData.get('reviewStatus'),
    objective: formData.get('objective'),
    workPerformed: formData.get('workPerformed'),
    findings: formData.get('findings'),
    reviewerNotes: formData.get('reviewerNotes'),
    requiredDocuments: formData.get('requiredDocuments'),
    preparedById: formData.get('preparedById'),
    reviewedById: formData.get('reviewedById'),
  });
}

export async function createWorkingPaper(formData: FormData): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = parseWp(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const audit = await prisma.audit.findUnique({ where: { id: d.auditId }, include: { client: true } });
  if (!audit) return { ok: false, error: 'Audit not found.' };

  const wp = await prisma.workingPaper.create({
    data: {
      auditId: d.auditId,
      title: d.title,
      area: d.area,
      customAreaName: d.area === 'CUSTOM' ? d.customAreaName ?? null : null,
      reference: d.reference ?? null,
      status: d.status,
      reviewStatus: d.reviewStatus,
      objective: d.objective ?? null,
      workPerformed: d.workPerformed ?? null,
      findings: d.findings ?? null,
      reviewerNotes: d.reviewerNotes ?? null,
      requiredDocuments: d.requiredDocuments ?? null,
      preparedById: d.preparedById || user.id,
      reviewedById: d.reviewedById || null,
    },
  });
  // Optionally seed checklist items from the template (one per line).
  const seed = formData.get('_seedChecklist');
  if (typeof seed === 'string' && seed.trim()) {
    const lines = seed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length) {
      await prisma.workingPaperChecklistItem.createMany({
        data: lines.map((text, i) => ({ workingPaperId: wp.id, text, order: i })),
      });
    }
  }

  await logActivity({
    userId: user.id,
    action: 'workingpaper.created',
    entityType: 'WorkingPaper',
    entityId: wp.id,
    summary: `Created working paper "${wp.title}" (${audit.client.name})`,
  });
  revalidatePath('/audit');
  revalidatePath(`/audit/${d.auditId}`);
  return { ok: true, data: { id: wp.id } };
}

export async function updateWorkingPaper(id: string, formData: FormData): Promise<Result> {
  const user = await requireUser();
  const parsed = parseWp(formData);
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the errors.', fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const existing = await prisma.workingPaper.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Working paper not found.' };

  await prisma.workingPaper.update({
    where: { id },
    data: {
      title: d.title,
      area: d.area,
      customAreaName: d.area === 'CUSTOM' ? d.customAreaName ?? null : null,
      reference: d.reference ?? null,
      status: d.status,
      reviewStatus: d.reviewStatus,
      objective: d.objective ?? null,
      workPerformed: d.workPerformed ?? null,
      findings: d.findings ?? null,
      reviewerNotes: d.reviewerNotes ?? null,
      requiredDocuments: d.requiredDocuments ?? null,
      preparedById: d.preparedById || null,
      reviewedById: d.reviewedById || null,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'workingpaper.updated',
    entityType: 'WorkingPaper',
    entityId: id,
    summary: `Updated working paper "${d.title}"`,
  });
  revalidatePath('/audit');
  revalidatePath(`/audit/wp/${id}`);
  return { ok: true };
}

export async function deleteWorkingPaper(id: string): Promise<Result> {
  const user = await requireUser();
  const wp = await prisma.workingPaper.findUnique({ where: { id } });
  if (!wp) return { ok: false, error: 'Working paper not found.' };
  await prisma.workingPaper.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: 'workingpaper.deleted',
    entityType: 'WorkingPaper',
    entityId: id,
    summary: `Deleted working paper "${wp.title}"`,
  });
  revalidatePath('/audit');
  return { ok: true };
}

// ---- Checklist -------------------------------------------------------------

export async function addChecklistItem(workingPaperId: string, text: string): Promise<Result> {
  await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Checklist text is required.' };
  const count = await prisma.workingPaperChecklistItem.count({ where: { workingPaperId } });
  await prisma.workingPaperChecklistItem.create({
    data: { workingPaperId, text: trimmed, order: count },
  });
  revalidatePath(`/audit/wp/${workingPaperId}`);
  return { ok: true };
}

export async function toggleChecklistItem(id: string, isChecked: boolean): Promise<Result> {
  await requireUser();
  const item = await prisma.workingPaperChecklistItem.update({
    where: { id },
    data: { isChecked },
  });
  revalidatePath(`/audit/wp/${item.workingPaperId}`);
  return { ok: true };
}

export async function deleteChecklistItem(id: string): Promise<Result> {
  await requireUser();
  const item = await prisma.workingPaperChecklistItem.delete({ where: { id } });
  revalidatePath(`/audit/wp/${item.workingPaperId}`);
  return { ok: true };
}

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import type { Result } from '../clients/actions';

export async function createReconciliation(formData: FormData): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const clientId = String(formData.get('clientId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const period = String(formData.get('period') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!clientId) return { ok: false, error: 'Client is required.', fieldErrors: { clientId: 'Required' } };
  if (title.length < 2) return { ok: false, error: 'Title is required.', fieldErrors: { title: 'Required' } };

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { ok: false, error: 'Client not found.' };

  const recon = await prisma.gSTReconciliation.create({
    data: {
      clientId,
      title,
      period: period || null,
      notes: notes || null,
      createdById: user.id,
    },
  });
  await logActivity({
    userId: user.id,
    action: 'gst.reconciliation.created',
    entityType: 'GSTReconciliation',
    entityId: recon.id,
    summary: `Created GST reconciliation "${title}" for ${client.name}`,
  });
  revalidatePath('/gst');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: recon.id } };
}

export async function deleteReconciliation(id: string): Promise<Result> {
  const user = await requireUser();
  const recon = await prisma.gSTReconciliation.findUnique({ where: { id } });
  if (!recon) return { ok: false, error: 'Reconciliation not found.' };
  await prisma.gSTReconciliation.delete({ where: { id } });
  await logActivity({
    userId: user.id,
    action: 'gst.reconciliation.deleted',
    entityType: 'GSTReconciliation',
    entityId: id,
    summary: `Deleted GST reconciliation "${recon.title}"`,
  });
  revalidatePath('/gst');
  return { ok: true };
}

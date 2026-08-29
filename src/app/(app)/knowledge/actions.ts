'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import type { Result } from '../clients/actions';

export async function toggleFavorite(articleId: string): Promise<Result<{ favorited: boolean }>> {
  const user = await requireUser();
  const existing = await prisma.knowledgeFavorite.findUnique({
    where: { userId_articleId: { userId: user.id, articleId } },
  });
  if (existing) {
    await prisma.knowledgeFavorite.delete({ where: { id: existing.id } });
    revalidatePath('/knowledge');
    return { ok: true, data: { favorited: false } };
  }
  await prisma.knowledgeFavorite.create({ data: { userId: user.id, articleId } });
  revalidatePath('/knowledge');
  return { ok: true, data: { favorited: true } };
}

export async function recordView(articleId: string): Promise<void> {
  try {
    await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });
  } catch {
    // best-effort
  }
}

import 'server-only';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
// Reuse the exact same starter library the seed script uses (single source).
import { KNOWLEDGE } from '../../prisma/knowledge-seed';

/**
 * Idempotently ensure the knowledge base is populated. Safe to call on every
 * first-admin bootstrap / deploy: it upserts by slug, so re-running is a no-op.
 * Best-effort — never throws into the caller.
 */
export async function ensureKnowledgeSeeded(): Promise<void> {
  try {
    const existing = await prisma.knowledgeArticle.count();
    if (existing > 0) return;

    for (const cat of KNOWLEDGE) {
      const category = await prisma.knowledgeCategory.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, order: cat.order },
        create: { name: cat.name, slug: cat.slug, order: cat.order },
      });
      for (const art of cat.articles) {
        const slug = slugify(`${cat.slug}-${art.title}`);
        await prisma.knowledgeArticle.upsert({
          where: { slug },
          update: {},
          create: {
            slug,
            title: art.title,
            description: art.description,
            content: art.content ?? null,
            checklist: art.checklist?.join('\n') ?? null,
            commonDocuments: art.commonDocuments?.join('\n') ?? null,
            reviewPoints: art.reviewPoints?.join('\n') ?? null,
            notes: art.notes ?? null,
            reference: art.reference,
            categoryId: category.id,
          },
        });
      }
    }
  } catch (err) {
    console.error('knowledge bootstrap failed', err);
  }
}

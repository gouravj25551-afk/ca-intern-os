import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { KnowledgeView, type ArticleCard, type CategoryOption } from './KnowledgeView';

export const metadata: Metadata = { title: 'Knowledge Base' };

export default async function KnowledgePage() {
  const user = await requireUser();
  const [categories, articles, favorites] = await Promise.all([
    prisma.knowledgeCategory.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { articles: true } } },
    }),
    prisma.knowledgeArticle.findMany({
      orderBy: { title: 'asc' },
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.knowledgeFavorite.findMany({ where: { userId: user.id }, select: { articleId: true } }),
  ]);

  const favSet = new Set(favorites.map((f) => f.articleId));

  const cards: ArticleCard[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description,
    categoryName: a.category.name,
    categorySlug: a.category.slug,
    reference: a.reference,
    updatedAt: a.updatedAt.toISOString(),
    lastViewedAt: a.lastViewedAt ? a.lastViewedAt.toISOString() : null,
    isFavorite: favSet.has(a.id),
  }));

  const catOptions: CategoryOption[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count.articles,
  }));

  return (
    <div>
      <PageHeader
        title="CA Knowledge & Work Assistant"
        description="A structured work-reference library. Always confirm regulatory details against the cited source — content is a starting point, not legal or tax advice."
      />
      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-8 text-center text-sm text-ink-500">
          The knowledge base is empty. Run <code className="rounded bg-ink-100 px-1">npm run db:seed</code> to load the starter library.
        </div>
      ) : (
        <KnowledgeView articles={cards} categories={catOptions} />
      )}
    </div>
  );
}

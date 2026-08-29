import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toLines } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import { recordView } from '../actions';
import { ArticleActions } from './ArticleActions';

export const metadata: Metadata = { title: 'Article' };

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug: params.slug },
    include: { category: true, favorites: { where: { userId: user.id } } },
  });
  if (!article) notFound();

  // Record a view (best-effort, non-blocking behaviour).
  await recordView(article.id);

  const isFavorite = article.favorites.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/knowledge" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to knowledge base
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="blue" className="mb-2">{article.category.name}</Badge>
          <h1 className="text-2xl font-semibold text-ink-900">{article.title}</h1>
          {article.description && <p className="mt-1 text-sm text-ink-500">{article.description}</p>}
        </div>
        <ArticleActions articleId={article.id} isFavorite={isFavorite} />
      </div>

      <div className="space-y-5">
        {article.content && (
          <Card>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{article.content}</p>
            </CardBody>
          </Card>
        )}

        <ListCard title="Checklist" items={toLines(article.checklist)} />
        <ListCard title="Common documents" items={toLines(article.commonDocuments)} />
        <ListCard title="Common review points" items={toLines(article.reviewPoints)} />

        {article.notes && (
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardBody><p className="whitespace-pre-wrap text-sm text-ink-700">{article.notes}</p></CardBody>
          </Card>
        )}

        <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-500">
          {article.reference ? (
            <p><span className="font-medium text-ink-600">Reference / source:</span> {article.reference}</p>
          ) : (
            <p>No source cited. Verify any regulatory detail independently.</p>
          )}
          <p className="mt-1">Last updated {formatDate(article.updatedAt)}. This library is a work aid, not legal or tax advice.</p>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-700">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </CardBody>
    </Card>
  );
}

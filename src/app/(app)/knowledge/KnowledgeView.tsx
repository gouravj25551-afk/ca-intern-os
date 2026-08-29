'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Star, Clock, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/dates';
import { toggleFavorite } from './actions';
import { toast } from '@/components/ui/Toast';

export interface ArticleCard {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  reference: string | null;
  updatedAt: string;
  lastViewedAt: string | null;
  isFavorite: boolean;
}

export interface CategoryOption { id: string; name: string; slug: string; count: number }

export function KnowledgeView({
  articles,
  categories,
}: {
  articles: ArticleCard[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [onlyFavorites, setOnlyFavorites] = React.useState(false);

  const filtered = articles.filter((a) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      a.title.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.categoryName.toLowerCase().includes(q);
    const matchesCat = !category || a.categorySlug === category;
    const matchesFav = !onlyFavorites || a.isFavorite;
    return matchesQ && matchesCat && matchesFav;
  });

  const recentlyViewed = [...articles]
    .filter((a) => a.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? ''))
    .slice(0, 5);

  async function fav(id: string) {
    const res = await toggleFavorite(id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search the knowledge base…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <button
          onClick={() => setOnlyFavorites((f) => !f)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium',
            onlyFavorites ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
          )}
        >
          <Star className={cn('h-4 w-4', onlyFavorites && 'fill-amber-400 text-amber-400')} /> Favorites
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryChip active={category === ''} onClick={() => setCategory('')} label="All" count={articles.length} />
        {categories.map((c) => (
          <CategoryChip key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)} label={c.name} count={c.count} />
        ))}
      </div>

      {recentlyViewed.length > 0 && !query && !category && !onlyFavorites && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700">
            <Clock className="h-4 w-4 text-ink-400" /> Recently viewed
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentlyViewed.map((a) => (
              <Link key={a.id} href={`/knowledge/${a.slug}`} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-sm text-ink-700 hover:border-brand-300 hover:text-brand-700">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title={onlyFavorites ? 'No favorites yet' : 'No articles match your search'}
          description={onlyFavorites ? 'Star articles to keep them here for quick access.' : 'Try a different search term or category.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <div key={a.id} className="group relative flex flex-col rounded-xl border border-ink-200 bg-white p-4 shadow-card transition-shadow hover:shadow-soft">
              <button
                onClick={() => fav(a.id)}
                className="absolute right-3 top-3 text-ink-300 hover:text-amber-400"
                aria-label={a.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Star className={cn('h-4 w-4', a.isFavorite && 'fill-amber-400 text-amber-400')} />
              </button>
              <Badge tone="blue" className="mb-2 w-fit">{a.categoryName}</Badge>
              <Link href={`/knowledge/${a.slug}`} className="pr-6 text-sm font-semibold text-ink-900 hover:text-brand-700">
                {a.title}
              </Link>
              {a.description && <p className="mt-1 line-clamp-3 text-sm text-ink-500">{a.description}</p>}
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
                <span>Updated {formatDate(a.updatedAt)}</span>
                {a.reference && <span className="truncate">Ref: {a.reference}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
        active ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
      )}
    >
      {label} <span className="text-xs text-ink-400">{count}</span>
    </button>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { toggleFavorite } from '../actions';

export function ArticleActions({ articleId, isFavorite }: { articleId: string; isFavorite: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onToggle() {
    setPending(true);
    const res = await toggleFavorite(articleId);
    setPending(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(res.data?.favorited ? 'Added to favorites.' : 'Removed from favorites.');
    router.refresh();
  }

  return (
    <Button variant={isFavorite ? 'secondary' : 'outline'} size="sm" onClick={onToggle} loading={pending}>
      <Star className={isFavorite ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4'} />
      {isFavorite ? 'Favorited' : 'Favorite'}
    </Button>
  );
}

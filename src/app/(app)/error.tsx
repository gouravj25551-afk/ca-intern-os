'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-red-200">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold text-ink-900">Something went wrong</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        An unexpected error occurred. You can try again, or go back and retry the action.
      </p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}

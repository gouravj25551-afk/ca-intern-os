import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-100 px-4 text-center">
      <div className="text-5xl font-bold text-brand-600">404</div>
      <h1 className="mt-2 text-lg font-semibold text-ink-900">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/dashboard" className="mt-4">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}

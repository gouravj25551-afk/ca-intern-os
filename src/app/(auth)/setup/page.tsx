import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { userCount } from '@/lib/auth';
import { SetupForm } from './SetupForm';

export const metadata: Metadata = { title: 'First-time setup' };
export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  // Once an account exists, the setup route is closed.
  const count = await userCount();
  if (count > 0) redirect('/login');

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            CA
          </div>
          <h1 className="text-xl font-semibold text-ink-900">
            Welcome to CA Intern OS
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Create the first administrator account to get started.
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <SetupForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          This one-time setup is only available until the first account exists.
        </p>
      </div>
    </div>
  );
}

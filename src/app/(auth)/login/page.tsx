import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { userCount } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // First run: no users yet → send to setup.
  const count = await userCount();
  if (count === 0) redirect('/setup');

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            CA
          </div>
          <h1 className="text-xl font-semibold text-ink-900">CA Intern OS</h1>
          <p className="mt-1 text-sm text-ink-500">
            One workspace for audit, reconciliation &amp; compliance.
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Private internal tool. Authorised users only.
        </p>
      </div>
    </div>
  );
}

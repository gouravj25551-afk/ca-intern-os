import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Users, FolderCheck, ClipboardCheck, GitCompareArrows,
  CalendarClock, AlertTriangle, ArrowRight, Plus,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatDateTime, dueBucket } from '@/lib/dates';
import { labelFor } from '@/lib/constants';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    clientCount,
    openAudit,
    reviewPending,
    reconCount,
    tasks,
    recentActivity,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.workingPaper.count({ where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'PREPARED'] } } }),
    prisma.workingPaper.count({ where: { status: 'REVIEW_PENDING' } }),
    prisma.gSTReconciliation.count(),
    prisma.complianceTask.findMany({
      where: { status: { not: 'COMPLETED' } },
      orderBy: { dueDate: 'asc' },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } }),
  ]);

  const overdue = tasks.filter((t) => dueBucket(t.dueDate, false) === 'overdue');
  const dueToday = tasks.filter((t) => dueBucket(t.dueDate, false) === 'today');
  const dueThisWeek = tasks.filter((t) => dueBucket(t.dueDate, false) === 'this-week');
  const todaysWork = [...overdue, ...dueToday, ...dueThisWeek].slice(0, 6);

  const noData = clientCount === 0;

  const stats = [
    { label: 'Active clients', value: clientCount, icon: Users, href: '/clients', tone: 'text-brand-600' },
    { label: 'Open audit work', value: openAudit, icon: FolderCheck, href: '/audit', tone: 'text-ink-900' },
    { label: 'Review pending', value: reviewPending, icon: ClipboardCheck, href: '/audit', tone: 'text-amber-600' },
    { label: 'GST reconciliations', value: reconCount, icon: GitCompareArrows, href: '/gst', tone: 'text-ink-900' },
    { label: 'Due this week', value: dueThisWeek.length + dueToday.length, icon: CalendarClock, href: '/compliance', tone: 'text-brand-600' },
    { label: 'Overdue tasks', value: overdue.length, icon: AlertTriangle, href: '/compliance', tone: 'text-red-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what needs your attention today.</p>
      </div>

      {noData ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No active clients yet"
          description="Add your first client to start tracking audit work, GST reconciliations and compliance tasks."
          action={<Link href="/clients"><Button><Plus className="h-4 w-4" /> Add your first client</Button></Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.label} href={s.href} className="rounded-xl border border-ink-200 bg-white p-4 shadow-card transition-shadow hover:shadow-soft">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-ink-400" />
                    <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                  </div>
                  <div className={`mt-3 text-2xl font-semibold ${s.tone}`}>{s.value}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{s.label}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Today&apos;s work</CardTitle>
                  <Link href="/compliance" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
                </CardHeader>
                <CardBody>
                  {todaysWork.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-400">Nothing overdue or due soon. You&apos;re all caught up.</p>
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {todaysWork.map((t) => {
                        const bucket = dueBucket(t.dueDate, false);
                        const eff = bucket === 'overdue' ? 'OVERDUE' : t.status;
                        return (
                          <li key={t.id} className="flex items-center justify-between py-2.5">
                            <div>
                              <p className="text-sm font-medium text-ink-900">{t.title}</p>
                              <p className="text-xs text-ink-400">
                                <Link href={`/clients/${t.client.id}`} className="hover:text-brand-700">{t.client.name}</Link>
                                {' · '}{labelFor('complianceType', t.type)} · Due {formatDate(t.dueDate)}
                              </p>
                            </div>
                            <StatusBadge group="complianceStatus" value={eff} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
                <CardBody>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-ink-400">No activity yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {recentActivity.map((a) => (
                        <li key={a.id} className="text-sm">
                          <p className="text-ink-700">{a.summary}</p>
                          <p className="text-xs text-ink-400">{a.user?.name ? `${a.user.name} · ` : ''}{formatDateTime(a.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

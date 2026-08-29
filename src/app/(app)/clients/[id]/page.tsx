import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  FolderCheck,
  GitCompareArrows,
  CalendarClock,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { labelFor } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/dates';

export const metadata: Metadata = { title: 'Client' };

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { workingPapers: true } } },
      },
      reconciliations: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { results: true } } },
      },
      complianceTasks: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!client) notFound();

  const activity = await prisma.activityLog.findMany({
    where: { entityId: client.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-900">{client.name}</h1>
            {client.isSample && <Badge tone="amber">SAMPLE</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {labelFor('entityType', client.entityType)} · FY {client.financialYear}
            {client.gstin ? ` · GSTIN ${client.gstin}` : ''}
            {client.pan ? ` · PAN ${client.pan}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column: details + contact + notes */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <DetailRow icon={<UserIcon className="h-4 w-4" />} value={client.contactPerson} />
              <DetailRow icon={<Mail className="h-4 w-4" />} value={client.email} />
              <DetailRow icon={<Phone className="h-4 w-4" />} value={client.phone} />
              {!client.contactPerson && !client.email && !client.phone && (
                <p className="text-ink-400">No contact details on record.</p>
              )}
            </CardBody>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-ink-600">{client.notes}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardBody>
              {activity.length === 0 ? (
                <p className="text-sm text-ink-400">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="text-ink-700">{a.summary}</p>
                      <p className="text-xs text-ink-400">{formatDateTime(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column: work across modules */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <FolderCheck className="h-4 w-4 text-brand-600" /> Audit work
                </span>
              </CardTitle>
              <Link href={`/audit?clientId=${client.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Manage →
              </Link>
            </CardHeader>
            <CardBody>
              {client.audits.length === 0 ? (
                <EmptyState title="No audits yet" description="Create an audit for this client in the Audit Papers module." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {client.audits.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <Link href={`/audit?clientId=${client.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{a.title}</Link>
                        <p className="text-xs text-ink-400">{a.auditType} · FY {a.financialYear}</p>
                      </div>
                      <span className="text-xs text-ink-500">{a._count.workingPapers} working papers</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-brand-600" /> GST reconciliations
                </span>
              </CardTitle>
              <Link href={`/gst?clientId=${client.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Manage →
              </Link>
            </CardHeader>
            <CardBody>
              {client.reconciliations.length === 0 ? (
                <EmptyState title="No reconciliations yet" description="Start a GST reconciliation for this client." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {client.reconciliations.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2.5">
                      <Link href={`/gst/${r.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{r.title}</Link>
                      <span className="text-xs text-ink-500">{r._count.results} results</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-brand-600" /> Compliance tasks
                </span>
              </CardTitle>
              <Link href={`/compliance?clientId=${client.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Manage →
              </Link>
            </CardHeader>
            <CardBody>
              {client.complianceTasks.length === 0 ? (
                <EmptyState title="No compliance tasks yet" description="Add compliance tasks for this client." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {client.complianceTasks.slice(0, 8).map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-ink-900">{t.title}</p>
                        <p className="text-xs text-ink-400">{labelFor('complianceType', t.type)} · Due {formatDate(t.dueDate)}</p>
                      </div>
                      <StatusBadge group="complianceStatus" value={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, value }: { icon: React.ReactNode; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-ink-700">
      <span className="text-ink-400">{icon}</span>
      {value}
    </div>
  );
}

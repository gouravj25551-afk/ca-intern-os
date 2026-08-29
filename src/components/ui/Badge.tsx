import * as React from 'react';
import { cn } from '@/lib/utils';
import { labelFor, type LABELS } from '@/lib/constants';

type Tone =
  | 'gray'
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'purple'
  | 'teal';

const tones: Record<Tone, string> = {
  gray: 'bg-ink-100 text-ink-700 ring-ink-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
};

export function Badge({
  tone = 'gray',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Map domain statuses to tones.
const STATUS_TONES: Record<string, Tone> = {
  // working paper status
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  PREPARED: 'teal',
  REVIEW_PENDING: 'amber',
  REVIEWED: 'green',
  CLOSED: 'gray',
  // review status
  NOT_REVIEWED: 'gray',
  REOPENED: 'red',
  // compliance
  PENDING: 'gray',
  COMPLETED: 'green',
  OVERDUE: 'red',
  // priority
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'red',
  // match status
  EXACT_MATCH: 'green',
  AMOUNT_MISMATCH: 'amber',
  INVOICE_NUMBER_MISMATCH: 'amber',
  GSTIN_MISMATCH: 'amber',
  DATE_MISMATCH: 'amber',
  TAX_MISMATCH: 'amber',
  MISSING_IN_2B: 'red',
  MISSING_IN_BOOKS: 'purple',
  DUPLICATE: 'red',
};

export function StatusBadge({
  group,
  value,
}: {
  group: keyof typeof LABELS;
  value: string | null | undefined;
}) {
  if (!value) return <span className="text-ink-400">—</span>;
  return <Badge tone={STATUS_TONES[value] ?? 'gray'}>{labelFor(group, value)}</Badge>;
}

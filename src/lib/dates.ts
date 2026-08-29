import {
  format,
  isToday,
  isThisWeek,
  isPast,
  startOfDay,
  differenceInCalendarDays,
} from 'date-fns';

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd MMM yyyy, HH:mm');
}

// For <input type="date"> values.
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM-dd');
}

export type DueBucket =
  | 'overdue'
  | 'today'
  | 'this-week'
  | 'upcoming'
  | 'completed';

/**
 * Deterministic bucketing of a compliance task. "Overdue" only applies to
 * tasks that are not completed and whose due date is strictly before today.
 */
export function dueBucket(
  dueDate: Date,
  isCompleted: boolean,
): DueBucket {
  if (isCompleted) return 'completed';
  const due = startOfDay(dueDate);
  const today = startOfDay(new Date());
  if (due < today) return 'overdue';
  if (isToday(dueDate)) return 'today';
  // isThisWeek uses locale week; treat within next 7 days as "this week".
  const diff = differenceInCalendarDays(due, today);
  if (diff <= 7) return 'this-week';
  return 'upcoming';
}

export function isOverdue(dueDate: Date, isCompleted: boolean): boolean {
  if (isCompleted) return false;
  return isPast(startOfDay(dueDate)) && !isToday(dueDate);
}

export { isToday, isThisWeek };

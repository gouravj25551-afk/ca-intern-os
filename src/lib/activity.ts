import { prisma } from '@/lib/prisma';

interface LogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
}

/**
 * Record an activity-log entry. Best-effort: never throw into the caller's
 * mutation path (logging must not break the actual operation).
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
      },
    });
  } catch (err) {
    console.error('activity log failed', err);
  }
}

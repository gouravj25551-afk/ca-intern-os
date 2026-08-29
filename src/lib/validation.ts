import { z } from 'zod';

// Tolerant optional string: accepts string | null | undefined (an absent /
// conditionally-rendered form field yields null from FormData.get) and
// normalises empty values to undefined.
const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    const s = (v ?? '').toString().trim();
    return s === '' ? undefined : s;
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const setupAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[a-z]/, 'Include a lowercase letter.')
    .regex(/[A-Z]/, 'Include an uppercase letter.')
    .regex(/[0-9]/, 'Include a number.'),
});

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required.'),
  entityType: z.enum([
    'PROPRIETORSHIP',
    'PARTNERSHIP',
    'LLP',
    'PRIVATE_LIMITED',
    'PUBLIC_LIMITED',
    'HUF',
    'TRUST',
    'SOCIETY',
    'AOP',
    'OTHER',
  ]),
  financialYear: z.string().trim().min(4, 'Financial year is required.'),
  gstin: optionalString,
  pan: optionalString,
  contactPerson: optionalString,
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  phone: optionalString,
  notes: optionalString,
});

export const auditSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  title: z.string().trim().min(2, 'Audit title is required.'),
  financialYear: z.string().trim().min(4, 'Financial year is required.'),
  auditType: z.string().trim().min(2, 'Audit type is required.'),
  notes: optionalString,
});

export const workingPaperSchema = z.object({
  auditId: z.string().min(1, 'Audit is required.'),
  title: z.string().trim().min(2, 'Title is required.'),
  area: z.enum([
    'CASH_AND_BANK',
    'SALES',
    'PURCHASES',
    'TRADE_RECEIVABLES',
    'TRADE_PAYABLES',
    'FIXED_ASSETS',
    'LOANS_AND_BORROWINGS',
    'EXPENSES',
    'PAYROLL',
    'STATUTORY_DUES',
    'OTHER',
    'CUSTOM',
  ]),
  customAreaName: optionalString,
  reference: optionalString,
  status: z.enum([
    'NOT_STARTED',
    'IN_PROGRESS',
    'PREPARED',
    'REVIEW_PENDING',
    'REVIEWED',
    'CLOSED',
  ]),
  reviewStatus: z.enum([
    'NOT_REVIEWED',
    'REVIEW_PENDING',
    'REVIEWED',
    'REOPENED',
  ]),
  objective: optionalString,
  workPerformed: optionalString,
  findings: optionalString,
  reviewerNotes: optionalString,
  requiredDocuments: optionalString,
  preparedById: optionalString,
  reviewedById: optionalString,
});

export const complianceTaskSchema = z.object({
  clientId: z.string().min(1, 'Client is required.'),
  title: z.string().trim().min(2, 'Task title is required.'),
  type: z.enum([
    'GST',
    'TDS',
    'INCOME_TAX',
    'ROC',
    'AUDIT',
    'ADVANCE_TAX',
    'OTHER',
  ]),
  period: optionalString,
  dueDate: z.string().min(1, 'Due date is required.'),
  assignedTo: optionalString,
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  notes: optionalString,
});

export const knowledgeArticleSchema = z.object({
  categoryId: z.string().min(1, 'Category is required.'),
  title: z.string().trim().min(2, 'Title is required.'),
  description: optionalString,
  content: optionalString,
  checklist: optionalString,
  commonDocuments: optionalString,
  reviewPoints: optionalString,
  notes: optionalString,
  reference: optionalString,
});

export type ClientInput = z.infer<typeof clientSchema>;
export type AuditInput = z.infer<typeof auditSchema>;
export type WorkingPaperInput = z.infer<typeof workingPaperSchema>;
export type ComplianceTaskInput = z.infer<typeof complianceTaskSchema>;
export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleSchema>;

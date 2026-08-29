// Central place for enum labels and option lists so the UI stays consistent.

export const ENTITY_TYPES = [
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership Firm' },
  { value: 'LLP', label: 'LLP' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited' },
  { value: 'HUF', label: 'HUF' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOCIETY', label: 'Society' },
  { value: 'AOP', label: 'AOP / BOI' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const AUDIT_AREAS = [
  { value: 'CASH_AND_BANK', label: 'Cash & Bank' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PURCHASES', label: 'Purchases' },
  { value: 'TRADE_RECEIVABLES', label: 'Trade Receivables' },
  { value: 'TRADE_PAYABLES', label: 'Trade Payables' },
  { value: 'FIXED_ASSETS', label: 'Fixed Assets' },
  { value: 'LOANS_AND_BORROWINGS', label: 'Loans & Borrowings' },
  { value: 'EXPENSES', label: 'Expenses' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'STATUTORY_DUES', label: 'Statutory Dues' },
  { value: 'OTHER', label: 'Other' },
  { value: 'CUSTOM', label: 'Custom Working Paper' },
] as const;

export const WORKING_PAPER_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PREPARED', label: 'Prepared' },
  { value: 'REVIEW_PENDING', label: 'Review Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

export const REVIEW_STATUSES = [
  { value: 'NOT_REVIEWED', label: 'Not Reviewed' },
  { value: 'REVIEW_PENDING', label: 'Review Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'REOPENED', label: 'Reopened' },
] as const;

export const COMPLIANCE_TYPES = [
  { value: 'GST', label: 'GST' },
  { value: 'TDS', label: 'TDS' },
  { value: 'INCOME_TAX', label: 'Income Tax' },
  { value: 'ROC', label: 'ROC' },
  { value: 'AUDIT', label: 'Audit' },
  { value: 'ADVANCE_TAX', label: 'Advance Tax' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const COMPLIANCE_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
] as const;

export const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
] as const;

export const MATCH_STATUSES = [
  { value: 'EXACT_MATCH', label: 'Exact Match' },
  { value: 'AMOUNT_MISMATCH', label: 'Amount Mismatch' },
  { value: 'INVOICE_NUMBER_MISMATCH', label: 'Invoice No. Mismatch' },
  { value: 'GSTIN_MISMATCH', label: 'GSTIN Mismatch' },
  { value: 'DATE_MISMATCH', label: 'Date Mismatch' },
  { value: 'TAX_MISMATCH', label: 'Tax Mismatch' },
  { value: 'MISSING_IN_2B', label: 'Missing in GSTR-2B' },
  { value: 'MISSING_IN_BOOKS', label: 'Missing in Books' },
  { value: 'DUPLICATE', label: 'Duplicate' },
] as const;

// Generic label lookup helper.
function labelMap(opts: readonly { value: string; label: string }[]) {
  return Object.fromEntries(opts.map((o) => [o.value, o.label]));
}

export const LABELS = {
  entityType: labelMap(ENTITY_TYPES),
  auditArea: labelMap(AUDIT_AREAS),
  workingPaperStatus: labelMap(WORKING_PAPER_STATUSES),
  reviewStatus: labelMap(REVIEW_STATUSES),
  complianceType: labelMap(COMPLIANCE_TYPES),
  complianceStatus: labelMap(COMPLIANCE_STATUSES),
  priority: labelMap(PRIORITIES),
  matchStatus: labelMap(MATCH_STATUSES),
};

export function labelFor(
  group: keyof typeof LABELS,
  value: string | null | undefined,
): string {
  if (!value) return '—';
  return LABELS[group][value] ?? value;
}

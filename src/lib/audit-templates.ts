// Generic, editable audit working-paper starters. These are common-practice
// prompts to save typing — NOT an official ICAI checklist or a statement of
// statutory requirements. Users should adapt them to each engagement.

export interface AreaTemplate {
  objective: string;
  checklist: string[];
  requiredDocuments: string[];
}

export const AREA_TEMPLATES: Record<string, AreaTemplate> = {
  CASH_AND_BANK: {
    objective:
      'Verify existence, completeness and accuracy of cash and bank balances as at the reporting date.',
    checklist: [
      'Obtain bank confirmations / statements for all accounts',
      'Perform bank reconciliation and review reconciling items',
      'Verify physical cash count / cash certificate',
      'Check for stale / unpresented cheques',
      'Review restricted or lien-marked balances for disclosure',
    ],
    requiredDocuments: [
      'Bank statements (all accounts)',
      'Bank reconciliation statements',
      'Bank confirmation letters',
      'Cash book / cash certificate',
    ],
  },
  SALES: {
    objective:
      'Verify occurrence, completeness, accuracy and cut-off of revenue from sales.',
    checklist: [
      'Test a sample of invoices to dispatch / delivery evidence',
      'Perform sales cut-off testing around period end',
      'Reconcile sales register with GST returns and ledger',
      'Review credit notes and sales returns for validity',
      'Assess revenue recognition policy consistency',
    ],
    requiredDocuments: [
      'Sales register / invoices',
      'Dispatch / delivery documents',
      'GST returns (GSTR-1/3B)',
      'Credit note register',
    ],
  },
  PURCHASES: {
    objective:
      'Verify occurrence, completeness, accuracy and cut-off of purchases.',
    checklist: [
      'Test a sample of purchase invoices to GRN / receipt evidence',
      'Perform purchase cut-off testing around period end',
      'Reconcile purchase register with GST 2B / returns',
      'Review debit notes and purchase returns',
      'Check for unrecorded liabilities after period end',
    ],
    requiredDocuments: [
      'Purchase register / invoices',
      'Goods receipt notes (GRN)',
      'GSTR-2B / purchase reconciliation',
      'Debit note register',
    ],
  },
  TRADE_RECEIVABLES: {
    objective:
      'Verify existence, valuation and recoverability of trade receivables.',
    checklist: [
      'Obtain and review ageing of receivables',
      'Send / review balance confirmations for major debtors',
      'Assess provision for doubtful debts and its adequacy',
      'Review subsequent receipts as evidence of recoverability',
      'Check for long-outstanding / disputed balances',
    ],
    requiredDocuments: [
      'Debtors ageing report',
      'Balance confirmations',
      'Ledger extracts of major parties',
      'Subsequent receipt evidence',
    ],
  },
  TRADE_PAYABLES: {
    objective: 'Verify completeness and valuation of trade payables.',
    checklist: [
      'Obtain and review ageing of payables',
      'Reconcile supplier statements to ledger balances',
      'Search for unrecorded liabilities',
      'Review long-outstanding creditors for write-back',
      'Check advances to suppliers separately',
    ],
    requiredDocuments: [
      'Creditors ageing report',
      'Supplier statements / confirmations',
      'Ledger extracts of major suppliers',
    ],
  },
  FIXED_ASSETS: {
    objective:
      'Verify existence, ownership, valuation and depreciation of fixed assets.',
    checklist: [
      'Verify additions to invoices and capitalisation policy',
      'Physically verify / review physical verification report',
      'Recompute depreciation and check rates / methods',
      'Verify title deeds / ownership documents for key assets',
      'Review disposals and resulting gain / loss',
    ],
    requiredDocuments: [
      'Fixed asset register',
      'Purchase invoices for additions',
      'Depreciation working',
      'Title / ownership documents',
    ],
  },
  LOANS_AND_BORROWINGS: {
    objective:
      'Verify existence, classification and disclosure of loans and borrowings.',
    checklist: [
      'Obtain confirmations from lenders',
      'Verify interest computation and accrual',
      'Review loan agreements for terms and covenants',
      'Check classification of current vs non-current portion',
      'Assess security / charges and their disclosure',
    ],
    requiredDocuments: [
      'Loan statements / confirmations',
      'Loan agreements',
      'Interest workings',
      'Charge / security documents',
    ],
  },
  EXPENSES: {
    objective: 'Verify occurrence, accuracy and cut-off of expenses.',
    checklist: [
      'Perform analytical review of major expense heads',
      'Vouch a sample of expenses to supporting evidence',
      'Test expense cut-off around period end',
      'Review prepaid and outstanding expenses',
      'Check TDS applicability on expenses',
    ],
    requiredDocuments: [
      'Expense ledgers',
      'Sample vouchers / bills',
      'Prepaid / outstanding workings',
      'TDS returns',
    ],
  },
  PAYROLL: {
    objective: 'Verify accuracy and completeness of payroll costs.',
    checklist: [
      'Reconcile payroll register to ledger and bank payments',
      'Test a sample of employees to appointment / salary records',
      'Verify statutory deductions (PF, ESI, TDS) and deposits',
      'Review full-and-final settlements',
      'Check provision for gratuity / leave encashment',
    ],
    requiredDocuments: [
      'Payroll register',
      'PF / ESI / TDS challans and returns',
      'Employee master / appointment letters',
      'Actuarial / provision workings',
    ],
  },
  STATUTORY_DUES: {
    objective:
      'Verify completeness, accuracy and timeliness of statutory dues.',
    checklist: [
      'Reconcile GST / TDS / PF / ESI liabilities to returns',
      'Verify timely deposit of statutory dues',
      'Review interest / late fee on delayed payments',
      'Check year-end provisions for statutory dues',
      'Assess disclosure of disputed dues',
    ],
    requiredDocuments: [
      'GST / TDS / PF / ESI returns and challans',
      'Reconciliation statements',
      'Demand / assessment orders (if any)',
    ],
  },
  OTHER: {
    objective: 'State the audit objective for this area.',
    checklist: [
      'Define the assertions being tested',
      'Document the audit procedures performed',
      'Record conclusions',
    ],
    requiredDocuments: ['List the documents obtained'],
  },
  CUSTOM: {
    objective: 'State the objective of this custom working paper.',
    checklist: [
      'Define the scope of work',
      'Document procedures performed',
      'Record conclusions',
    ],
    requiredDocuments: ['List supporting documents'],
  },
};

export function templateFor(area: string): AreaTemplate {
  return AREA_TEMPLATES[area] ?? AREA_TEMPLATES.OTHER;
}

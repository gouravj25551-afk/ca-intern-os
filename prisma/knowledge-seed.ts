// Starter knowledge library. Content is generic common-practice guidance and
// is NOT legal or tax advice. Every article carries a generic reference field;
// users must verify regulatory detail against the cited/applicable source.

export interface SeedCategory {
  name: string;
  slug: string;
  order: number;
  articles: SeedArticle[];
}

export interface SeedArticle {
  title: string;
  description: string;
  content?: string;
  checklist?: string[];
  commonDocuments?: string[];
  reviewPoints?: string[];
  notes?: string;
  reference: string;
}

export const KNOWLEDGE: SeedCategory[] = [
  {
    name: 'Audit',
    slug: 'audit',
    order: 1,
    articles: [
      {
        title: 'Trade Receivables',
        description: 'Verifying existence, valuation and recoverability of debtors.',
        content:
          'Trade receivables testing focuses on whether balances exist, are owned by the entity, and are recoverable at the stated amount. Combine confirmations, ageing analysis and subsequent-receipt review.',
        checklist: [
          'Obtain and cast the debtors ageing',
          'Send / review balance confirmations for major parties',
          'Review subsequent receipts as evidence of recoverability',
          'Assess adequacy of provision for doubtful debts',
          'Investigate long-outstanding and disputed balances',
        ],
        commonDocuments: ['Debtors ageing report', 'Balance confirmations', 'Ledger extracts', 'Subsequent receipt evidence'],
        reviewPoints: ['Unusual credit balances in debtors', 'Round-sum or old balances without movement', 'Related-party receivables disclosure'],
        reference: 'General audit practice — verify against applicable Standards on Auditing.',
      },
      {
        title: 'Trade Payables',
        description: 'Completeness and valuation of creditors, and search for unrecorded liabilities.',
        checklist: [
          'Obtain creditors ageing and reconcile to ledger',
          'Reconcile supplier statements to balances',
          'Perform search for unrecorded liabilities',
          'Review long-outstanding creditors for write-back',
          'Segregate advances to suppliers',
        ],
        commonDocuments: ['Creditors ageing', 'Supplier statements', 'Ledger extracts'],
        reviewPoints: ['Debit balances in creditors', 'Unrecorded liabilities near year-end', 'MSME dues disclosure where applicable'],
        reference: 'General audit practice — verify against applicable Standards on Auditing.',
      },
      {
        title: 'Bank',
        description: 'Existence and accuracy of bank balances via confirmations and reconciliations.',
        checklist: [
          'Obtain bank confirmations for all accounts',
          'Review bank reconciliation statements',
          'Investigate old / unusual reconciling items',
          'Check for lien-marked or restricted balances',
        ],
        commonDocuments: ['Bank statements', 'Bank reconciliations', 'Bank confirmation letters'],
        reviewPoints: ['Stale cheques carried forward', 'Post-dated cheque treatment', 'Accounts not disclosed'],
        reference: 'General audit practice — verify against applicable Standards on Auditing.',
      },
      {
        title: 'Fixed Assets',
        description: 'Existence, ownership, valuation and depreciation of property, plant & equipment.',
        checklist: [
          'Verify additions to invoices and capitalisation policy',
          'Review physical verification report',
          'Recompute depreciation; check rates and method',
          'Verify title / ownership documents for key assets',
          'Review disposals and resultant gain/loss',
        ],
        commonDocuments: ['Fixed asset register', 'Purchase invoices', 'Depreciation working', 'Title documents'],
        reviewPoints: ['Capital vs revenue classification', 'Assets not in use / impairment indicators', 'CWIP ageing'],
        reference: 'General audit practice — verify against applicable accounting standards.',
      },
      {
        title: 'Revenue',
        description: 'Occurrence, completeness, accuracy and cut-off of revenue.',
        checklist: [
          'Test invoices to dispatch / delivery evidence',
          'Perform revenue cut-off testing',
          'Reconcile revenue with GST returns',
          'Review credit notes and returns',
          'Assess revenue recognition policy',
        ],
        commonDocuments: ['Sales register', 'Dispatch documents', 'GST returns', 'Credit note register'],
        reviewPoints: ['Cut-off around period end', 'Unusual last-week sales', 'Revenue recognition timing'],
        reference: 'General audit practice — verify against applicable accounting standards.',
      },
      {
        title: 'Expenses',
        description: 'Occurrence, accuracy and cut-off of expenses with analytical review.',
        checklist: [
          'Perform analytical review of major heads',
          'Vouch a sample to supporting evidence',
          'Test expense cut-off',
          'Review prepaid and outstanding expenses',
          'Check TDS applicability',
        ],
        commonDocuments: ['Expense ledgers', 'Sample vouchers', 'Prepaid/outstanding workings', 'TDS returns'],
        reviewPoints: ['Personal expenses through business', 'Provisions vs actuals', 'Missing supporting documents'],
        reference: 'General audit practice — verify against applicable Standards on Auditing.',
      },
    ],
  },
  {
    name: 'GST',
    slug: 'gst',
    order: 2,
    articles: [
      {
        title: 'Purchase reconciliation (Books vs GSTR-2B)',
        description: 'Comparing the purchase register with auto-drafted GSTR-2B to identify ITC differences.',
        content:
          'Reconciling the purchase register against GSTR-2B highlights invoices missing on either side, tax/value differences and duplicates. Use the GST Reconciliation module to automate the matching, then investigate each exception with the vendor.',
        checklist: [
          'Normalise GSTIN and invoice numbers before matching',
          'Identify invoices missing in 2B and in books',
          'Investigate tax and taxable-value differences',
          'Flag and remove duplicate invoices',
          'Follow up with vendors on genuine differences',
        ],
        commonDocuments: ['Purchase register', 'GSTR-2B download', 'Vendor communications'],
        reviewPoints: ['ITC claimed but not appearing in 2B', 'Vendor filing status', 'Timing differences across periods'],
        notes: 'The reconciliation tool is deterministic and explainable; it does not replace professional GST review.',
        reference: 'Verify ITC positions against the GST law and the relevant return period.',
      },
      {
        title: 'Input Tax Credit review',
        description: 'Assessing eligibility and conditions for claiming ITC.',
        checklist: [
          'Confirm invoice appears in GSTR-2B',
          'Check the credit is not blocked/ineligible',
          'Verify goods/services received',
          'Check payment to vendor within the prescribed time',
          'Reconcile ITC ledger to returns',
        ],
        commonDocuments: ['Tax invoices', 'GSTR-2B', 'Payment evidence'],
        reviewPoints: ['Blocked credits', 'Reversal requirements', 'Proportionate ITC where applicable'],
        reference: 'Verify eligibility against the applicable provisions of the GST law.',
      },
      {
        title: 'GSTR review',
        description: 'Reviewing periodic GST returns for consistency.',
        checklist: [
          'Reconcile GSTR-1 with books and e-invoices',
          'Reconcile GSTR-3B with GSTR-1 and 2B',
          'Check interest/late fee on delays',
          'Review RCM liability and payment',
        ],
        commonDocuments: ['GSTR-1', 'GSTR-3B', 'Books of accounts'],
        reviewPoints: ['Turnover mismatches', 'RCM completeness', 'Amendment handling'],
        reference: 'Verify against the applicable GST return requirements for the period.',
      },
    ],
  },
  {
    name: 'TDS',
    slug: 'tds',
    order: 3,
    articles: [
      {
        title: 'TDS reconciliation',
        description: 'Reconciling TDS deducted, deposited and reported with Form 26AS / books.',
        checklist: [
          'Reconcile TDS ledger to returns filed',
          'Match challans to deposits',
          'Reconcile with 26AS where relevant',
          'Check timeliness of deduction and deposit',
        ],
        commonDocuments: ['TDS returns', 'Challans', '26AS', 'Expense ledgers'],
        reviewPoints: ['Short/late deduction', 'Interest computation', 'Correct section mapping'],
        reference: 'Verify sections, rates and due dates against the Income-tax law for the year.',
      },
      {
        title: 'Deduction review',
        description: 'Checking whether TDS was deducted at the correct rate and section.',
        checklist: [
          'Identify nature of each payment',
          'Map to the correct TDS section',
          'Apply correct rate and threshold',
          'Check for lower/nil deduction certificates',
        ],
        commonDocuments: ['Vendor invoices', 'Agreements', 'Lower deduction certificates'],
        reviewPoints: ['Threshold breaches', 'PAN availability', 'Correct rate selection'],
        reference: 'Verify sections and rates against the Income-tax law for the relevant year.',
      },
      {
        title: 'Payment review',
        description: 'Verifying timely deposit of TDS and correct challan details.',
        checklist: [
          'Match deposits to due dates',
          'Verify challan section and assessment year',
          'Compute interest on any delay',
        ],
        commonDocuments: ['Challans', 'Bank statements', 'TDS returns'],
        reviewPoints: ['Delay interest', 'Mismatched assessment year', 'Unpaid liabilities'],
        reference: 'Verify due dates against the Income-tax law for the relevant year.',
      },
    ],
  },
  {
    name: 'Income Tax',
    slug: 'income-tax',
    order: 4,
    articles: [
      {
        title: 'Advance tax review',
        description: 'Assessing advance tax estimates and instalment adequacy.',
        checklist: [
          'Estimate current-year taxable income',
          'Compute expected tax liability',
          'Compare against instalments paid',
          'Assess interest exposure for shortfalls',
        ],
        commonDocuments: ['Provisional financials', 'Advance tax challans'],
        reviewPoints: ['Instalment adequacy', 'Interest for deferment/shortfall'],
        reference: 'Verify instalment schedule and interest provisions against the Income-tax law.',
      },
    ],
  },
  {
    name: 'ROC',
    slug: 'roc',
    order: 5,
    articles: [
      {
        title: 'Annual filing overview',
        description: 'High-level checklist for company annual filings and registers.',
        checklist: [
          'Confirm financial statements are approved',
          'Prepare board/AGM documentation',
          'Maintain statutory registers',
          'Track filing status of applicable forms',
        ],
        commonDocuments: ['Financial statements', 'Board/AGM minutes', 'Statutory registers'],
        reviewPoints: ['Filing deadlines', 'Register completeness', 'Director/KMP details'],
        reference: 'Verify applicable forms and due dates against the Companies Act and MCA requirements.',
      },
    ],
  },
  {
    name: 'Accounting',
    slug: 'accounting',
    order: 6,
    articles: [
      {
        title: 'Year-end closing checklist',
        description: 'Common steps to close the books before finalisation.',
        checklist: [
          'Complete bank and ledger reconciliations',
          'Record provisions and accruals',
          'Reconcile statutory ledgers (GST/TDS)',
          'Review prepaid and depreciation',
          'Confirm inter-company balances',
        ],
        commonDocuments: ['Trial balance', 'Reconciliations', 'Provision workings'],
        reviewPoints: ['Cut-off accuracy', 'Suspense/temporary accounts cleared', 'Rounding and grouping'],
        reference: 'General accounting practice — verify against applicable accounting standards.',
      },
    ],
  },
];

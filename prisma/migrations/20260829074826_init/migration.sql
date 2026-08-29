-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'HUF', 'TRUST', 'SOCIETY', 'AOP', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkingPaperStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PREPARED', 'REVIEW_PENDING', 'REVIEWED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_REVIEWED', 'REVIEW_PENDING', 'REVIEWED', 'REOPENED');

-- CreateEnum
CREATE TYPE "AuditArea" AS ENUM ('CASH_AND_BANK', 'SALES', 'PURCHASES', 'TRADE_RECEIVABLES', 'TRADE_PAYABLES', 'FIXED_ASSETS', 'LOANS_AND_BORROWINGS', 'EXPENSES', 'PAYROLL', 'STATUTORY_DUES', 'OTHER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('EXACT_MATCH', 'AMOUNT_MISMATCH', 'INVOICE_NUMBER_MISMATCH', 'GSTIN_MISMATCH', 'DATE_MISMATCH', 'TAX_MISMATCH', 'MISSING_IN_2B', 'MISSING_IN_BOOKS', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('GST', 'TDS', 'INCOME_TAX', 'ROC', 'AUDIT', 'ADVANCE_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL DEFAULT 'PRIVATE_LIMITED',
    "financialYear" TEXT NOT NULL,
    "gstin" TEXT,
    "pan" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "auditType" TEXT NOT NULL DEFAULT 'Statutory Audit',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingPaper" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "title" TEXT NOT NULL,
    "area" "AuditArea" NOT NULL DEFAULT 'OTHER',
    "customAreaName" TEXT,
    "status" "WorkingPaperStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "objective" TEXT,
    "workPerformed" TEXT,
    "findings" TEXT,
    "reviewerNotes" TEXT,
    "requiredDocuments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auditId" TEXT NOT NULL,
    "preparedById" TEXT,
    "reviewedById" TEXT,

    CONSTRAINT "WorkingPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingPaperChecklistItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workingPaperId" TEXT NOT NULL,

    CONSTRAINT "WorkingPaperChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,
    "workingPaperId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTReconciliation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "period" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "GSTReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTBookEntry" (
    "id" TEXT NOT NULL,
    "gstin" TEXT,
    "gstinNorm" TEXT,
    "vendorName" TEXT,
    "invoiceNo" TEXT,
    "invoiceNoNorm" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "taxableValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rowIndex" INTEGER NOT NULL DEFAULT 0,
    "reconciliationId" TEXT NOT NULL,

    CONSTRAINT "GSTBookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GST2BEntry" (
    "id" TEXT NOT NULL,
    "gstin" TEXT,
    "gstinNorm" TEXT,
    "vendorName" TEXT,
    "invoiceNo" TEXT,
    "invoiceNoNorm" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "taxableValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rowIndex" INTEGER NOT NULL DEFAULT 0,
    "reconciliationId" TEXT NOT NULL,

    CONSTRAINT "GST2BEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSTMatchResult" (
    "id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "gstin" TEXT,
    "vendorName" TEXT,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "bookTaxable" DOUBLE PRECISION,
    "bookTax" DOUBLE PRECISION,
    "b2bTaxable" DOUBLE PRECISION,
    "b2bTax" DOUBLE PRECISION,
    "taxDifference" DOUBLE PRECISION,
    "bookEntryId" TEXT,
    "b2bEntryId" TEXT,
    "reconciliationId" TEXT NOT NULL,

    CONSTRAINT "GSTMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ComplianceType" NOT NULL DEFAULT 'OTHER',
    "period" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ComplianceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "checklist" TEXT,
    "commonDocuments" TEXT,
    "reviewPoints" TEXT,
    "notes" TEXT,
    "reference" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFavorite" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_ownerId_idx" ON "Client"("ownerId");

-- CreateIndex
CREATE INDEX "Audit_clientId_idx" ON "Audit"("clientId");

-- CreateIndex
CREATE INDEX "WorkingPaper_auditId_idx" ON "WorkingPaper"("auditId");

-- CreateIndex
CREATE INDEX "WorkingPaper_status_idx" ON "WorkingPaper"("status");

-- CreateIndex
CREATE INDEX "WorkingPaper_area_idx" ON "WorkingPaper"("area");

-- CreateIndex
CREATE INDEX "WorkingPaperChecklistItem_workingPaperId_idx" ON "WorkingPaperChecklistItem"("workingPaperId");

-- CreateIndex
CREATE INDEX "Attachment_clientId_idx" ON "Attachment"("clientId");

-- CreateIndex
CREATE INDEX "Attachment_workingPaperId_idx" ON "Attachment"("workingPaperId");

-- CreateIndex
CREATE INDEX "GSTReconciliation_clientId_idx" ON "GSTReconciliation"("clientId");

-- CreateIndex
CREATE INDEX "GSTBookEntry_reconciliationId_idx" ON "GSTBookEntry"("reconciliationId");

-- CreateIndex
CREATE INDEX "GSTBookEntry_gstinNorm_idx" ON "GSTBookEntry"("gstinNorm");

-- CreateIndex
CREATE INDEX "GST2BEntry_reconciliationId_idx" ON "GST2BEntry"("reconciliationId");

-- CreateIndex
CREATE INDEX "GST2BEntry_gstinNorm_idx" ON "GST2BEntry"("gstinNorm");

-- CreateIndex
CREATE INDEX "GSTMatchResult_reconciliationId_idx" ON "GSTMatchResult"("reconciliationId");

-- CreateIndex
CREATE INDEX "GSTMatchResult_status_idx" ON "GSTMatchResult"("status");

-- CreateIndex
CREATE INDEX "ComplianceTask_clientId_idx" ON "ComplianceTask"("clientId");

-- CreateIndex
CREATE INDEX "ComplianceTask_dueDate_idx" ON "ComplianceTask"("dueDate");

-- CreateIndex
CREATE INDEX "ComplianceTask_status_idx" ON "ComplianceTask"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_name_key" ON "KnowledgeCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCategory_slug_key" ON "KnowledgeCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_categoryId_idx" ON "KnowledgeArticle"("categoryId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_title_idx" ON "KnowledgeArticle"("title");

-- CreateIndex
CREATE INDEX "KnowledgeFavorite_userId_idx" ON "KnowledgeFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeFavorite_userId_articleId_key" ON "KnowledgeFavorite"("userId", "articleId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaper" ADD CONSTRAINT "WorkingPaper_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaper" ADD CONSTRAINT "WorkingPaper_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaper" ADD CONSTRAINT "WorkingPaper_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaperChecklistItem" ADD CONSTRAINT "WorkingPaperChecklistItem_workingPaperId_fkey" FOREIGN KEY ("workingPaperId") REFERENCES "WorkingPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_workingPaperId_fkey" FOREIGN KEY ("workingPaperId") REFERENCES "WorkingPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GSTReconciliation" ADD CONSTRAINT "GSTReconciliation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GSTReconciliation" ADD CONSTRAINT "GSTReconciliation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GSTBookEntry" ADD CONSTRAINT "GSTBookEntry_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "GSTReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GST2BEntry" ADD CONSTRAINT "GST2BEntry_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "GSTReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GSTMatchResult" ADD CONSTRAINT "GSTMatchResult_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "GSTReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceTask" ADD CONSTRAINT "ComplianceTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFavorite" ADD CONSTRAINT "KnowledgeFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFavorite" ADD CONSTRAINT "KnowledgeFavorite_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

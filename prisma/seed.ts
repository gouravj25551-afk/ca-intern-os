import { PrismaClient } from '@prisma/client';
import { KNOWLEDGE } from './knowledge-seed';
import { slugify } from '../src/lib/utils';

const prisma = new PrismaClient();

async function seedKnowledge() {
  for (const cat of KNOWLEDGE) {
    const category = await prisma.knowledgeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, order: cat.order },
      create: { name: cat.name, slug: cat.slug, order: cat.order },
    });
    for (const art of cat.articles) {
      const slug = slugify(`${cat.slug}-${art.title}`);
      await prisma.knowledgeArticle.upsert({
        where: { slug },
        update: {
          title: art.title,
          description: art.description,
          content: art.content ?? null,
          checklist: art.checklist?.join('\n') ?? null,
          commonDocuments: art.commonDocuments?.join('\n') ?? null,
          reviewPoints: art.reviewPoints?.join('\n') ?? null,
          notes: art.notes ?? null,
          reference: art.reference,
          categoryId: category.id,
        },
        create: {
          slug,
          title: art.title,
          description: art.description,
          content: art.content ?? null,
          checklist: art.checklist?.join('\n') ?? null,
          commonDocuments: art.commonDocuments?.join('\n') ?? null,
          reviewPoints: art.reviewPoints?.join('\n') ?? null,
          notes: art.notes ?? null,
          reference: art.reference,
          categoryId: category.id,
        },
      });
    }
  }
  console.log(`Seeded ${KNOWLEDGE.length} knowledge categories.`);
}

async function seedDemo() {
  const existing = await prisma.client.findFirst({ where: { isSample: true } });
  if (existing) {
    console.log('Demo data already present — skipping.');
    return;
  }
  const client = await prisma.client.create({
    data: {
      name: 'SAMPLE — Acme Traders Pvt Ltd',
      entityType: 'PRIVATE_LIMITED',
      financialYear: '2024-25',
      gstin: '27AAACS1234A1Z5',
      pan: 'AAACS1234A',
      contactPerson: 'Sample Contact',
      email: 'sample@example.com',
      phone: '+91 90000 00000',
      notes: 'This is clearly labelled DEMO/SAMPLE data created by the seed script. Delete it before real use.',
      isSample: true,
    },
  });

  const audit = await prisma.audit.create({
    data: {
      clientId: client.id,
      title: 'SAMPLE — Statutory Audit FY 2024-25',
      financialYear: '2024-25',
      auditType: 'Statutory Audit',
      notes: 'Demo audit.',
    },
  });

  await prisma.workingPaper.create({
    data: {
      auditId: audit.id,
      reference: 'WP-A-1',
      title: 'Cash & Bank verification',
      area: 'CASH_AND_BANK',
      status: 'IN_PROGRESS',
      reviewStatus: 'NOT_REVIEWED',
      objective: 'Verify existence and accuracy of bank balances (demo).',
      requiredDocuments: 'Bank statements\nBank reconciliation\nBank confirmations',
      checklist: {
        create: [
          { text: 'Obtain bank confirmations', order: 0, isChecked: true },
          { text: 'Review bank reconciliation', order: 1 },
          { text: 'Check stale cheques', order: 2 },
        ],
      },
    },
  });

  const today = new Date();
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  await prisma.complianceTask.createMany({
    data: [
      { clientId: client.id, title: 'SAMPLE — File GSTR-3B', type: 'GST', period: 'Demo period', dueDate: addDays(-3), status: 'PENDING', priority: 'HIGH', isSample: true },
      { clientId: client.id, title: 'SAMPLE — Deposit TDS', type: 'TDS', period: 'Demo period', dueDate: addDays(0), status: 'IN_PROGRESS', priority: 'MEDIUM', isSample: true },
      { clientId: client.id, title: 'SAMPLE — Advance tax instalment', type: 'ADVANCE_TAX', period: 'Demo period', dueDate: addDays(5), status: 'PENDING', priority: 'MEDIUM', isSample: true },
    ],
  });

  console.log('Seeded clearly-labelled DEMO/SAMPLE data.');
}

async function main() {
  await seedKnowledge();
  if (process.env.SEED_DEMO === 'true' || process.argv.includes('--demo')) {
    await seedDemo();
  } else {
    console.log('Skipping demo data (set SEED_DEMO=true or pass --demo to include it).');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

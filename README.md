# CA Intern OS

**One workspace for audit, reconciliation & compliance.**

A production-ready internal tool for a CA office / articled intern to manage
day-to-day audit working papers, GST reconciliation, compliance tracking and a
knowledge library. **Version 1 is fully deterministic — no AI, no LLM, no
external paid APIs.** Every calculation, match and due-date computation is done
in plain application code and is explainable.

---

## Tech stack

| Layer | Choice |
|------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Custom session (JWT via `jose` in an httpOnly cookie, `bcryptjs` hashing) |
| Excel / CSV | SheetJS (`xlsx`) — server-side parse & export |
| PDF | `jspdf` + `jspdf-autotable` — client-side summaries |
| Validation | `zod` |

## Modules

1. **Audit Working Paper Manager** — Clients → Audits → Working Papers by area,
   with checklists, required documents, work performed, findings, reviewer
   notes, prepared/review status, generic (editable) area templates, and
   Excel / PDF export. Custom working papers supported.
2. **GST Reconciliation** — Upload Purchase Register + GSTR-2B (CSV/Excel),
   deterministic matching engine detecting Exact Match, Amount Mismatch,
   Invoice-Number Mismatch, GSTIN Mismatch, Date Mismatch, Tax Mismatch,
   Missing in 2B, Missing in Books and Duplicates. Every row shows **why**.
   Dashboard, filters and Excel export. Sample templates included.
3. **Compliance Calendar** — Client-wise tasks with type, period, due date,
   assignee, priority and status. List / Week / Month views, overdue logic,
   and dashboard counts (Due today / this week / upcoming / overdue / completed).
4. **CA Knowledge & Work Assistant** — Structured, searchable reference library
   (Audit, GST, TDS, Income Tax, ROC, Accounting) with checklists, common
   documents, review points, favorites and recently-viewed. Not a chatbot.

A **Dashboard** aggregates active clients, open audit work, review-pending,
reconciliations, compliance due/overdue and recent activity, with a
"Today's Work" list and useful empty states.

> **Disclaimers baked into the UI:** the app never asserts statutory deadlines
> or claims a checklist is an official ICAI requirement, and it states plainly
> that it is not a substitute for professional judgement or statutory review.

---

## Local development

### Prerequisites
- Node.js 20+
- A PostgreSQL database

### Setup
```bash
cp .env.example .env          # then edit values (see below)
npm install
npm run prisma:migrate:dev    # creates the schema
npm run db:seed               # loads the knowledge library
#   SEED_DEMO=true npm run db:seed   # also loads clearly-labelled DEMO data
npm run dev                   # http://localhost:3000
```

On first visit you'll be sent to **`/setup`** to create the first admin
account. Alternatively set `ADMIN_EMAIL` / `ADMIN_PASSWORD` and run
`npm run setup:admin`.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled URL on Vercel) |
| `DIRECT_URL` | optional | Direct/unpooled URL for `prisma migrate` |
| `AUTH_SECRET` | ✅ | Long random secret for signing session JWTs (`openssl rand -base64 48`) |
| `SESSION_MAX_AGE` | optional | Session lifetime in seconds (default 28800 = 8h) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | optional | For `npm run setup:admin` |
| `NEXT_PUBLIC_APP_URL` | optional | Public base URL (metadata) |

**Never commit `.env`.** Only `.env.example` is committed.

### Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start production server |
| `npm test` | Reconciliation engine unit tests (node:test) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:migrate:dev` | Create/apply a dev migration |
| `npm run prisma:migrate` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed knowledge base (add `SEED_DEMO=true` for demo data) |
| `npm run setup:admin` | Create the first admin from env vars |

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → import the repo**. Framework is auto-detected
   (Next.js).
3. Provision a PostgreSQL database (Vercel Postgres, Neon or Supabase) and set
   `DATABASE_URL` (pooled) and, if available, `DIRECT_URL` (direct) in the
   project's **Environment Variables**. Also set `AUTH_SECRET`.
4. Deploy. The build command (`prisma generate && prisma migrate deploy &&
   next build`, see `vercel.json`) runs migrations automatically.
5. After first deploy, open the site — you'll be routed to `/setup` to create
   the admin. (Or run the seed / `setup:admin` against the production DB.)

> The GST reconciliation and Excel/PDF work runs in the Node.js runtime; no
> extra configuration needed.

---

## Security & privacy notes
- All app routes are protected by middleware; API routes independently
  re-check the session (defence in depth).
- Passwords are hashed with bcrypt (cost 12). Sessions are signed JWTs in
  `httpOnly`, `sameSite=lax` cookies (`secure` in production).
- The whole app sends `noindex` headers and a disallow-all `robots.txt` — it is
  a private tool and must not be indexed.
- Client data is never placed in query strings unnecessarily; forms and uploads
  are validated (type, size, content) server-side.
- No secrets in source; everything sensitive is an environment variable.

## Testing
- `npm test` — 11 deterministic unit tests covering normalisation and all nine
  reconciliation categories.
- An end-to-end browser suite (auth, clients, audit + working paper + checklist,
  GST upload/reconcile, compliance + overdue logic, knowledge search/favorite,
  Excel export, logout + route protection) was run against a real Postgres and
  Chromium during development — all flows pass.

## Roadmap (V2)
- Optional AI assistant layered on the existing knowledge/work architecture.
- Binary file attachments backed by blob storage (the `Attachment` metadata
  model and access-control design are already in the schema).

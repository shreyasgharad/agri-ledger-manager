# AgriAggregator

Mobile-first billing and ledger app for crop aggregators/brokers: farmers, weighing, buyer auction, advances, and two printable bills (farmer + buyer) per sale, with a central database that syncs across devices.

> Phase 1: single user, **no login** (open access). Login, roles and hierarchy come later; the schema is designed for them already.

## Docs
- [PRD.md](PRD.md) – what we are building and why
- [docs/STRUCTURE.md](docs/STRUCTURE.md) – routes, folders, data model
- [docs/LOVABLE_PROMPTS.md](docs/LOVABLE_PROMPTS.md) – the 23 Lovable prompts (database + UI)

## What works today
- **Farmers** with unique codes (`F-0001`) and villages; **Buyers** with codes (`B-0001`).
- **Lots**: pick farmer + crop, weigh bag by bag (running totals in kg and quintals).
- **Auction**: add each buyer's rate, the highest is highlighted, confirm the winner.
- **Advances**: transport / labour / other (reason required for "other"), deducted on the farmer's bill.
- **Bills**: one tap issues both bills with gap-free numbers per financial year (`FB/26-27/00001`, `BB/26-27/00001`), commission 0-2% per side, printable on A4 or 80 mm thermal paper, shareable on WhatsApp.
- **Payments** against each bill; balances are computed (billed minus paid), never typed.
- **Settings** for business name/address/GSTIN/footer, default commission, **bag prices (jute/plastic)** and who can use the app.
- **Farmer ledger**: tap a farmer for the full history (bills, lots, advances, payments); the admin also sees profit & loss.
- **Create bill**: one short form (farmer, quantity, buyer, rate); open advances, bags and expenses are cut automatically.
- Open access, no login (Phase 1). Every table already carries `org_id`, so login can be enabled later without schema changes.

## Logins and roles
| Role | Can do |
|---|---|
| **Admin** (father) | Everything: edit/remove advances, profit & loss, Settings (bag prices, commission, people) |
| **Staff** | View, and add farmers, lots, advances, bills, payments. Cannot edit advances, see profit & loss, or open Settings |
| **View only** | Look at everything except profit & loss. Cannot add or change anything |
| **Pending** | Signed up, waiting for the admin to approve |

The first person to sign up becomes the admin; everyone after that waits for approval in Settings. Rules are enforced in the database (RLS), not just hidden in the screens. Until `app_flags.roles_enforced = 'on'` the app runs open (no login), so a new install is never locked out. See `supabase/migrations/20261018000100_roles_and_rls.sql`.

## Tech stack
React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · React Router · Supabase (Postgres, Realtime; Auth in Phase 2).

## Getting started
```bash
npm install
cp .env.example .env     # set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev              # http://localhost:8080
npm run build
npm run lint
npm run typecheck
npm test                 # vitest: billing math and components
```
The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Lovable Cloud sets these).

## Database
Schema lives in `supabase/migrations/`. The broker schema is `20261011000000_agri_aggregator_schema.sql`
(idempotent; safe to re-run). Billing math lives in the Postgres functions `compute_bill`, `issue_bills`,
`confirm_sale` and is mirrored and unit-tested in `src/lib/billing.ts`.

## Business rules
- Commission 1.5–2% charged to both farmer and buyer.
- Farmer net = gross − farmer commission − unsettled advances; buyer payable = gross + buyer commission.
- Advances: transport, labour, other (with reason).
- Bill numbers are sequential per financial year.

## Roadmap
1. (done) Open-access app: schema, lots, auction, advances, bills, printing
1b. Reports, CSV import/export, edit screens, PWA/offline
2. Login + RLS, staff accounts, offline queue
3. Roles/hierarchy, WhatsApp auto-send
4. Farmer portal and analytics

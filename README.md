# AgriAggregator

Mobile-first billing and ledger app for crop aggregators/brokers: farmers, weighing, buyer auction, advances, and two printable bills (farmer + buyer) per sale, with a central database that syncs across devices.

> Phase 1: single user, **no login** (open access). Login, roles and hierarchy come later; the schema is designed for them already.

## Docs
- [PRD.md](PRD.md) – what we are building and why
- [docs/STRUCTURE.md](docs/STRUCTURE.md) – routes, folders, data model
- [docs/LOVABLE_PROMPTS.md](docs/LOVABLE_PROMPTS.md) – the 23 Lovable prompts (database + UI)

## Status
The code in `src/` is still the older generic farmer ledger (Farmers, Transactions, Inventory, mock Billing). It is being replaced step by step with the Lovable prompts above. Not yet implemented: lots/weighing, auction, advances, real bills and printing.

## Tech stack
React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · React Router · Supabase (Postgres, Realtime; Auth in Phase 2).

## Getting started
```bash
npm install
cp .env.example .env     # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:8080
npm run build
npm run lint
```
Note: the Supabase URL/key are currently hard-coded in `src/integrations/supabase/client.ts`; Prompt 11 moves them to env vars.

## Business rules
- Commission 1.5–2% charged to both farmer and buyer.
- Farmer net = gross − farmer commission − unsettled advances; buyer payable = gross + buyer commission.
- Advances: transport, labour, other (with reason).
- Bill numbers are sequential per financial year.

## Roadmap
1. Open-access app with new schema, lots, auction, advances, bills, printing
2. Login + RLS, staff accounts, offline queue
3. Roles/hierarchy, WhatsApp auto-send
4. Farmer portal and analytics

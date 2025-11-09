# Moto Isla Raffle – Working Context

## What This App Does
- Full-stack raffle platform focused on motorcycle giveaways; participants pick ticket numbers, reserve them for 15 minutes, and complete payment via bank transfer with WhatsApp confirmation.
- Real-time availability updates powered by Supabase; reservations auto-expire and tickets return to the pool.
- Admin area (under `src/app/admin`) manages raffles, tickets, orders, and dashboard statistics.
- Deployment lives on Supabase Hosting; environment variables (Supabase URL/keys, service role) drive both the client and API routes.

## Technical Stack Snapshot
- Next.js 15 (App Router) with React 19, TypeScript, and Suspense-ready components.
- UI: Tailwind CSS, shadcn/ui primitives, Radix UI.
- State/data: TanStack React Query, React Context (`RaffleContext`) for cart state, React Hook Form + Zod validations.
- Backend: Supabase (PostgreSQL + Realtime) accessed via Next.js route handlers; Upstash Redis + Ratelimit packages are installed for rate limiting.
- Testing/tooling: ESLint 9, Jest 30 with Testing Library, Tailwind/PostCSS, TypeScript 5.

## High-Level Architecture
- `src/app`: App Router pages
  - `page.tsx`: main raffle page that loads current raffle/tickets via `/api/raffles` and `/api/tickets`, manages cart state and checkout transitions.
  - `checkout/`: payment instructions and proof upload.
  - `admin/`: dashboard + management views.
  - `api/`: server routes for raffles, tickets, orders, cleanup jobs, admin actions.
- `src/contexts/RaffleContext.tsx`: central client context that fetches raffle/ticket data, tracks cart items, active orders, and exposes actions (add/remove/clear tickets, refresh data, etc.).
- `src/components`: UI building blocks (raffle display, admin widgets, shared UI elements like drawers/buttons).
- `src/hooks`: domain hooks such as `useCart`, `useApi`, and timers for reservation countdowns.
- `src/lib`: Supabase client, shared types, utility helpers, validation schemas.
- `supabase/`: migrations, configuration, and seed data to bootstrap the database.

## Database Notes (from Supabase migrations)
- Tables: `raffles`, `tickets`, `orders`, `users`, plus later migrations for customer fields, settings, and per-user ticket limits.
- `raffles` include `max_tickets_per_user`, status, draw metadata, and references to winning tickets.
- `tickets` store raffle linkage, ticket number, status (`free`, `reserved`, `paid`), timestamps for reservation/payment, and optional user linkage.
- `orders` hold arrays of ticket IDs, total value, payment status, proof URL, and payment deadlines.
- Row Level Security is on; public read policies allow viewing active raffles/tickets, while service role policies allow full admin access.

## API Surface (documented in README)
- Public: `GET /api/tickets`, `POST /api/tickets` (reserve + create order), `GET /api/orders/{id}`, `POST /api/cleanup`.
- Admin: CRUD endpoints for raffles and stats under `/api/admin`.
- Client checkout flow builds a query string (orderId, customer data, ticket numbers, totals) and pushes to `/checkout`.

## Commands & Tooling
- Install: `npm install`
- Dev server: `npm run dev` (app listens on port 3001 per README)
- Quality gates: `npm run lint`, `npm run type-check`, `npm run test`
- Production build: `npm run build` then upload to Supabase Hosting (via dashboard or connected repo)
- Supabase local dev: `npx supabase start`, `npx supabase db reset`

## Admin Workflow Snapshot
- **Gatekeeping**: `/admin` page asks for a password that is verified server-side via `/api/admin/auth`; successful logins set an `admin-token` HTTP-only cookie (JWT signed with `JWT_SECRET`) and a `sessionStorage` flag while rate limiting uses in-memory counters (`lib/auth.ts`).
- **Dashboard Data**: Once authenticated, the client pulls KPIs from `/api/admin/stats` and scoped order data from `/api/admin/orders`, both of which use the Supabase REST API with the service-role key defined in `supabase-config.ts`.
- **Order Management**: `OrderActionsMenu` + `useUpdateOrderStatus` provide quick status transitions (pending/paid/cancelled), WhatsApp shortcuts, and proof verification flows without leaving the page.
- **Raffle Lifecycle**: `CreateRaffleForm` handles new raffles (React Hook Form + `useCreateRaffle` mutation). `RafflesList` exposes edit/cancel/draw-winner actions; `TicketManager` surfaces seat availability controls; `DrawWinner` records the winning ticket and persists it to Supabase.
- **Configuration Panel**: `AdminSettings` writes operational knobs (ticket window, contact links, payment text) via `/api/admin/settings`, allowing content tweaks without redeploying.

## Deployment Runbook (Supabase)
1. **Pre-flight**: Run `npm run lint`, `npm run type-check`, and spot tests; confirm Supabase migrations are applied locally (`npx supabase db reset`) before exporting data to the hosted project.
2. **Environment**: In Supabase Dashboard → Project Settings → Hosting, add every variable from `env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, admin credentials, Upstash keys, etc.). Missing `SUPABASE_SERVICE_ROLE_KEY` will crash server routes at runtime.
3. **Build + Upload**: `npm run build` locally, verify with `npm run start` if desired, then either connect the GitHub repo to Supabase Web Apps or upload the build artifact; Supabase will run `npm install` and `npm run build`.
4. **Secrets Hygiene**: Service-role keys stay server-side—never inject them into public runtime config. Keep admin APIs scoped to server routes that Supabase hosts.
5. **Smoke Test**: After each deploy, hit `/` and `/admin`, create a dummy order, and monitor Supabase logs (Database + Hosting) for errors/reservations cleanup activity.

## Known Priorities / Roadmap (README highlights)
- Immediate focus: security hardening (rate limiting, CSRF), resolve ESLint warnings, expand testing, write API/deployment docs, optimize bundle performance.
- Future phases: richer payments (Stripe/PayPal), user accounts, enhanced admin analytics, multi-prize raffles, mobile app, internationalization, enterprise features.

Keep this file updated when major architectural or workflow changes land so future requests have accurate context.

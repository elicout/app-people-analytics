# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Next.js version warning**: This project uses Next.js 16.x, which has breaking changes vs. earlier versions. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices. Do not assume App Router or Server Component behaviour from training data — verify first.

---

## What this project is

A **People Analytics platform** for Team Leaders (TLs) in a corporate environment. Each TL logs in and sees only their own team's data — workforce metrics, performance, attendance, overtime, turnover, and an org chart — plus an AI chat assistant that can query the database in natural language.

**Current state**: Local dev with fully mocked data (in-memory DuckDB, hardcoded employees). No real HR system connection yet.

**Eventual target**: Azure / Databricks Apps deployment with AAD SSO, Unity Catalog RLS, and a FastAPI backend serving real data. The mock/real boundary is the critical architectural seam to preserve for that migration (see *Data layer* section).

---

## Stack

| Technology | Role | Constraint |
|---|---|---|
| Next.js 16.2.4 | Framework (App Router) | `--webpack` flag required — see below |
| React 19 | UI runtime | Server Components by default |
| TypeScript 5 (strict) | Type system | No implicit `any`, no unnarrowed `unknown` |
| Tailwind CSS 4 | Styling | Utility-first; no separate CSS files |
| NextAuth v5 beta | Auth + session | Credentials provider today; AAD target |
| DuckDB (`duckdb-async`) | In-memory SQL | **Incompatible with Turbopack** |
| LangChain / LangGraph | AI agent orchestration | `createReactAgent` pattern |
| `@langchain/openai` | LLM client | gpt-4o-mini |
| Recharts | Dashboard charts / sparklines | |
| `@xyflow/react` | Org chart (React Flow) | Client Component only |
| lucide-react | Icons | |

**Turbopack is disabled.** DuckDB is a native Node module. Always run dev and build with `--webpack`:

```bash
npm run dev -- --webpack
npm run build
npm run lint
```

There is no test suite at the time of writing.

---

## Folder structure

```
src/
├── app/
│   ├── (app)/              # Protected routes — all require valid session
│   │   ├── dashboard/      # Main KPI dashboard (Server Component, ~423 lines)
│   │   ├── employees/      # Employee directory table
│   │   ├── org/            # React Flow org chart
│   │   └── layout.tsx      # Wraps (app) routes with AppShell + headcount query
│   ├── (auth)/
│   │   └── login/          # Credentials login page
│   ├── api/
│   │   ├── ai/chat/        # POST — LLM chat endpoint (RLS enforced here + in agent)
│   │   └── auth/[...nextauth]/ # NextAuth handlers (GET + POST)
│   ├── layout.tsx          # Root layout — SessionProvider + Geist font
│   └── page.tsx            # Home redirect → /dashboard or /login
├── components/
│   ├── dashboard/          # KpiCard, KpiChartCard, KpiGrid, CardGrid, CardRow,
│   │                       # SplitCard, DimensionCard, DistributionBar, AlertBadge
│   ├── layout/             # AppShell (sidebar + header), AiPanel (AI chat drawer)
│   ├── org/                # OrgFlow (React Flow canvas), OrgNode (node types)
│   └── ui/                 # Generic primitives — currently only CollapsibleSection
├── data/
│   └── mock.ts             # ALL mock data: employees, metrics, TEAM_LEADERS, passwords
│                           # ⚠ Direct imports from here are a code smell — see Data layer
├── lib/
│   ├── ai/
│   │   ├── agent.ts        # LangGraph ReAct agent + RLS validation + sql_query tool
│   │   └── semantic-model.yaml  # Data model the LLM reads before generating SQL
│   ├── auth/
│   │   ├── config.ts       # NextAuthConfig: credentials check, JWT fields
│   │   └── index.ts        # Re-exports auth(), signIn, signOut, GET/POST handlers
│   └── db/
│       ├── client.ts       # DuckDB singleton + typed query<T>() helper
│       └── seed.ts         # Schema DDL + data insert on first boot
├── proxy.ts                # Auth middleware (Next.js 16 renamed from middleware.ts)
└── types/
    ├── index.ts            # All shared TS interfaces and type aliases
    └── next-auth.d.ts      # Session type augmentation (teamId, teamName, role)
```

**Flags / inconsistencies found during scan:**

- `src/data/mock.ts` is overloaded — employees, all metric records, and mock passwords live in one file. Future split: `users.ts`, `employees.ts`, `metrics.ts`.
- `src/components/ui/` holds only `CollapsibleSection.tsx`. Generic primitives (Button, Badge, etc.) should live here, not inline in dashboard components.
- No `src/constants/` or `src/lib/constants.ts` file exists. Alert thresholds (95 %, 80 %), chart colour palettes, metric targets, and RLS column names are scattered (see refactor note in Code quality).
- No `src/hooks/` directory — no custom React hooks at time of writing.
- `src/lib/db/` has no repository abstraction. All pages import `query()` and write SQL directly (see Data layer section for the target structure).
- Abbreviations used in the UI without an authoritative glossary: **GD** = Gestão de Desempenho (Performance Management), **GT** = Gestão de Talentos (Talent Management), **GEP** = Gestão Estratégica de Pessoas (Calculates a categorical score for termination potential considering variables like performance, ternure, etc...), **GPTW** = Great Place to Work index, **BH** = Banco de Horas (Time Bank), **HE** = Horas Extras (Overtime).

---

## Code quality — standing instructions

### Before writing new code in any file

1. Scan the target file and its direct imports for: duplicated logic, prop drilling deeper than two levels, components doing more than one thing, inline types that belong in `src/types/index.ts`, `any` types that can be replaced, missing JSDoc on exports.
2. **Report findings before writing.** If the refactor is out of scope, add a `// REFACTOR:` comment at the top of the file describing what needs doing and why.

### Hard rules

- **Explicit TypeScript everywhere.** No implicit `any`. No `unknown` left unnarrowed. If a third-party type forces `any`, wrap it and document why.
- **Explicit Server vs Client boundary.** Every `"use client"` must be justified. Default to Server Components. Interactive state, browser APIs, and React Flow require client; everything else should stay server.
- **One component, one responsibility.** If a component fetches data *and* renders a complex layout *and* manages local state, split it.
- **No hardcoded values.** Routes, RLS column names, alert thresholds, target percentages, and magic numbers belong in a `src/lib/constants.ts` file (to be created). Until it exists, add a `// REFACTOR: extract to constants` comment.
- **Every async operation handles loading, error, and empty states.** A component that renders nothing on error is a silent failure.
- **No direct imports from `src/data/mock.ts` outside `src/lib/db/`.** Once the repository layer exists, `mock.ts` is an internal implementation detail of the mock repository. Components and pages must never know whether they're talking to mock or real data.

### Naming conventions (derived from existing code)

| Artifact | Convention | Example |
|---|---|---|
| React components | PascalCase, `.tsx` | `KpiChartCard.tsx` |
| Utility modules | camelCase, `.ts` | `utils.ts`, `client.ts` |
| Next.js routes | kebab-case directories | `app/api/ai/chat/route.ts` |
| TypeScript interfaces | PascalCase, no `I` prefix | `EmployeeWithMetrics` |
| TypeScript type aliases | PascalCase | `AlertLevel`, `TrendDirection` |
| Database columns | snake_case | `hire_date`, `manager_chain` |
| TS type properties | camelCase (mapped from DB) | `hireDate`, `managerChain` |
| React props interfaces | `<ComponentName>Props` | `KpiCardProps` |
| Server Components | no directive, `.tsx` | `dashboard/page.tsx` |
| Client Components | `"use client"` first line | `AiPanel.tsx` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `OPENAI_API_KEY` |

UI labels are **Portuguese** (domain language of the target users). Component names, types, functions, and database columns are **English**. This is intentional — do not "fix" it.

---

## Documentation — standing instructions

- **After any session that changes the architecture** (new page, new API route, new DB table, new AI tool, auth changes), update this CLAUDE.md to reflect it. Do not wait to be asked.
- **Every exported function, hook, and type gets a JSDoc comment** — minimum one-line description. Non-obvious behaviour gets `@param`, `@returns`, and a gotchas note.
- **Complex logic blocks** — especially RLS injection in `agent.ts` and response parsing — must have inline comments explaining *why*, not just *what*.
- **API routes must have a top-of-file comment** with: HTTP method, request shape, response shape, auth requirement.
- **Maintain `ARCHITECTURE.md`** (create it if absent) documenting: data flow, the AI pipeline end-to-end, the auth model, and the mock/real data boundary. Update it whenever those change.

---

## Data layer — the mock/real boundary

This is the most critical architectural constraint for the eventual Databricks migration.

### Current state (honest assessment)

The boundary **does not yet exist cleanly**. Today:
- `src/app/(app)/dashboard/page.tsx` calls `query<T>(sql, params)` directly.
- `src/lib/db/seed.ts` imports raw arrays from `src/data/mock.ts` and inserts them into DuckDB on boot.
- There is no interface, no factory, no abstraction separating "where data comes from" from "how data is used."

### Target structure (migration goal)

```
src/lib/db/
├── interfaces/          # TypeScript interfaces for each repository
│   ├── IEmployeeRepository.ts
│   ├── IPerformanceRepository.ts
│   └── ...
├── mock/                # DuckDB-backed implementations (current behaviour)
│   ├── EmployeeRepository.ts
│   └── ...
├── real/                # FastAPI / Unity Catalog implementations (stubs initially)
│   ├── EmployeeRepository.ts
│   └── ...
├── factory.ts           # Reads process.env.DATA_SOURCE → returns right impl
└── index.ts             # THE ONLY FILE the rest of the app imports from
```

`factory.ts` pattern:

```ts
const source = process.env.DATA_SOURCE ?? "mock";
if (source !== "mock" && source !== "real") {
  throw new Error(`Invalid DATA_SOURCE "${source}". Must be "mock" or "real".`);
}
export const db = source === "real" ? realRepositories : mockRepositories;
```

### Standing rules

- No component, hook, or API route imports from `src/data/mock.ts` or calls `query()` directly.
- `src/lib/db/index.ts` is the only public import surface for data access.
- **When adding any new data entity**, create the interface, mock implementation, and real stub together in the same session.
- Until the boundary is built, every raw `query()` call is a debt item — add `// REFACTOR: move to repository` at the call site.

---

## AI layer constraints

### Architecture

- **`src/lib/ai/agent.ts`** — LangGraph `createReactAgent` initialised per-request with the caller's email and team name.
- **`src/lib/ai/semantic-model.yaml`** — loaded at agent creation time; describes all 6 tables, key metrics, and 5 few-shot SQL examples with `{user_email}` / `{rls}` / `{rls_turnover}` placeholders.
- **One tool: `sql_query`** — executes parameterised read-only SQL against DuckDB. No other tools exist.

### Hard rules

- **`sql_query` is the only tool.** Do not add tools without a written justification explaining why it cannot be done via SQL.
- **RLS is enforced in the tool, not just in the prompt.** The `validateScope()` function in `agent.ts` checks that the generated SQL contains `manager_chain` and the user's email before execution. This is the last line of defence — it must not be removed or weakened.
- **Known fragility in `validateScope()`**: the check is a case-sensitive string match. Any refactor of this function must maintain equivalent or stronger guarantees.
- **If data entities change** (new table, renamed column, new metric), the semantic model YAML **must** be updated in the same session. An out-of-date YAML causes the agent to hallucinate SQL.
- **Conversation history is capped at the last 10 message pairs** to bound context cost. Do not raise this without measuring token impact.
- **The system prompt hardcodes the RLS filter template** — when changing RLS logic, update both `agent.ts` and `semantic-model.yaml` together.

---

## Auth model

### Session fields (JWT)

| Field | Source | Type |
|---|---|---|
| `email` | Credentials input (validated against mock) | `string` |
| `teamId` | Looked up from `TEAM_LEADERS` in mock.ts | `string` |
| `teamName` | Looked up from `TEAM_LEADERS` | `string` |
| `role` | Hardcoded `"tl"` today; `"director"` for `ana.sousa@` | `"tl" \| "director"` |

Session type is extended in `src/types/next-auth.d.ts`.

### Identity enforcement

- **Never trust client-provided identity claims.** Email, teamId, and role are always read from the server session (`auth()` in Server Components and API routes), never from request body, query params, or cookies set by the client.
- **`src/proxy.ts`** (Next.js 16 middleware) enforces route protection: unauthenticated requests redirect to `/login`; authenticated users hitting `/login` redirect to `/dashboard`.
- **RLS is applied at query time**, not at the session level. Every SQL query that touches `employees` or `turnover` must include the `manager_chain` CONTAINS filter. The two patterns in use:
  - `employees` / `performance` / `attendance` / `productivity` / `overtime`: `CONTAINS(manager_chain, ?) AND email != ?` — params `[userEmail, userEmail]` (excludes the TL's own row)
  - `turnover`: `CONTAINS(manager_chain, ?)` — param `[userEmail]` (includes the TL's own departures)

---

## Environment variables

Create `.env.local` in the project root. All variables below are required in dev.

| Variable | Purpose | Required in dev |
|---|---|---|
| `AUTH_SECRET` | NextAuth JWT signing secret | Yes — use a long random string |
| `AUTH_TRUST_HOST` | Set `true` for local HTTP dev | Yes — set to `true` |
| `OPENAI_API_KEY` | OpenAI API key for gpt-4o-mini | Yes — AI chat will 500 without it |
| `DATA_SOURCE` | `"mock"` or `"real"` | No — defaults to `"mock"` (once factory exists) |

**Missing required variables must throw with a clear error at startup**, not silently fail at request time. Add startup validation in `src/lib/ai/agent.ts` (already implicitly fails) and in the future `factory.ts`.

**Never commit `.env.local`.** It is already in `.gitignore`. `AUTH_SECRET="lucas"` and a live `OPENAI_API_KEY` are currently in that file — rotate both before any non-local use.

---

## Cloning to a new machine

```bash
# 1. Clone and install
git clone <repo-url>
cd app_people_analytics
npm install

# 2. Configure environment
cp .env.example .env.local   # or create manually — see Environment variables above
# Fill in AUTH_SECRET (generate: openssl rand -base64 32)
# Fill in OPENAI_API_KEY

# 3. Run dev (webpack flag required — do NOT use --turbopack)
npm run dev -- --webpack

# 4. Open http://localhost:3000
# Login with any mock account (password: password123):
#   sarah.chen@company.com   → Alpha Squad
#   marcus.rivera@company.com → Beta Force
#   priya.nair@company.com   → Gamma Unit
#   ana.sousa@company.com    → Director view (all teams)
```

### Switching from mock to real data (when ready)

1. Implement `src/lib/db/interfaces/` and `src/lib/db/real/` repositories.
2. Set `DATA_SOURCE=real` in `.env.local`.
3. Configure Databricks / FastAPI connection strings (variables TBD).
4. Run migrations to align DuckDB schema with Unity Catalog schema if needed.
5. Validate that `validateScope()` in `agent.ts` still holds against the real RLS policy.

---

## Claude skills

This project has two project-specific Claude skills:

- **`pa-ai-chat`** — AI chat UI, conversation history, LangGraph pipeline, OpenAI integration, streaming, deep-linking.
- **`pa-semantic-layer`** — semantic model YAML, metric definitions, AI schema, data dictionary.

**This CLAUDE.md takes precedence over skill defaults on any project-specific convention** (naming, RLS enforcement, data layer structure, auth rules). Use skills for their domain knowledge; follow this file for how things are done in this specific codebase.

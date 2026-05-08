# People Analytics

A People Analytics platform for Team Leaders. Each TL logs in and sees their own team's workforce metrics — performance, attendance, overtime, turnover, and an org chart — plus an AI assistant that answers natural-language questions about the team by querying a local DuckDB database.

**Current state:** local development with fully mocked data (in-memory DuckDB, seeded employees). No real HR system connection yet.

---

## Stack

- **Next.js 16** (App Router, webpack — Turbopack is disabled; see note below)
- **DuckDB** — in-memory SQL database, seeded on first boot
- **NextAuth v5** — credentials auth today; AAD SSO target
- **LangChain / LangGraph** — AI agent with a `sql_query` tool
- **Recharts** — dashboard charts
- **React Flow** — org chart
- **Tailwind CSS 4**

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd app_people_analytics
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Random secret for NextAuth JWTs — generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Set to `true` for local HTTP dev |
| `OPENAI_API_KEY` | OpenAI key for the AI chat assistant (gpt-4o-mini) |

`OPENAI_API_KEY` is optional to get the app running — everything except the AI panel works without it.

### 3. Run the dev server

```bash
npm run dev -- --webpack
```

> **The `--webpack` flag is required.** DuckDB is a native Node module that is incompatible with Turbopack. Running without the flag will fail.

Open [http://localhost:3000](http://localhost:3000).

---

## Mock login credentials

All accounts use the password **`password123`**.

| Email | Team | Role |
|---|---|---|
| `sarah.chen@company.com` | Alpha Squad | Team Leader |
| `marcus.rivera@company.com` | Beta Force | Team Leader |
| `priya.nair@company.com` | Gamma Unit | Team Leader |
| `ana.sousa@company.com` | — | Director (sees all teams) |

---

## Other commands

```bash
npm run build    # Production build (webpack, no --turbopack)
npm run lint     # ESLint
```

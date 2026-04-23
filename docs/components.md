# Visual Components — People Analytics

This document maps every visual building block in the app: what it looks like, where the file lives, what props it accepts, and how it connects to DuckDB. Written for someone coming from Streamlit.

---

## How this stack compares to Streamlit

In Streamlit you write one Python file top-to-bottom: fetch data, then render widgets. Here the pattern is similar but split across two roles:

| Streamlit concept | This app equivalent |
|---|---|
| Python function that fetches + renders | **Server Component** (async `page.tsx`) — runs on the server, can call the DB |
| Widget / chart | **Client Component** (has `"use client"` at the top) — runs in the browser |
| `st.metric()` | `KpiCard` |
| `st.columns()` | `KpiGrid` |
| `st.expander()` | `CollapsibleSection` |
| `st.bar_chart()` | `DistributionBar` (inline in dashboard) |
| `st.sidebar` | `AppShell` sidebar |

**The key rule:** only Server Components can call `query()`. They pass the result as props to Client Components. Client Components never touch the DB directly.

---

## The data layer

### DuckDB (`src/lib/db/client.ts`)

```
src/lib/db/client.ts   ← the one function you call to query data
src/lib/db/seed.ts     ← creates tables + inserts mock data on first boot
src/data/mock.ts       ← all mock data (employees, metrics, passwords)
```

The only function you need is:

```typescript
import { query } from "@/lib/db/client";

const rows = await query<{ name: string; score: number }>(
  "SELECT name, score FROM performance WHERE team_id = ?",
  [teamId]   // ← always filter by teamId (security requirement)
);
```

`query<T>` is generic — the type `T` describes one row. It returns `T[]`. You call it inside an `async` page function, never inside a component.

### Tables available

| Table | Key columns | What it stores |
|---|---|---|
| `employees` | `id`, `team_id`, `name`, `role`, `department`, `email`, `hire_date`, `tenure_months`, `salary_usd`, `status` | People (active, on_leave, terminated) |
| `performance` | `employee_id`, `period` (YYYY-MM), `score` (0-100), `rating` | Monthly performance scores |
| `attendance` | `employee_id`, `date`, `status` (present/absent/late), `hours_worked` | Daily attendance |
| `productivity` | `employee_id`, `period`, `tasks_completed`, `tasks_pending`, `delivery_on_time_rate`, `quality_score` | Monthly productivity |
| `overtime` | `employee_id`, `period`, `regular_hours`, `overtime_hours`, `overtime_cost_usd` | Monthly overtime |
| `turnover` | `employee_id`, `team_id`, `termination_date`, `reason` | Terminated employees |

**Always filter by `team_id` or join through `employees` with a `team_id` filter.** The security model enforces this.

---

## Visual components

### 1. KpiCard + KpiGrid

**Files:**
- `src/components/dashboard/KpiCard.tsx`
- `src/components/dashboard/KpiGrid.tsx`
- `src/components/dashboard/AlertBadge.tsx`

**What it looks like:** A white rounded card with a large metric value, a colored status badge (green / yellow / red), a trend arrow (↑ or ↓), and an optional target line.

**How to use in a page:**

```tsx
// 1. Import
import KpiGrid from "@/components/dashboard/KpiGrid";
import { KpiSummary } from "@/types";
import { getAlertLevel, trendDir } from "@/lib/utils";

// 2. Build the data object (in your async page function, after querying DB)
const kpis: KpiSummary[] = [
  {
    id: "attendance",             // unique string, used as React key
    label: "Presença",            // shown at the top of the card
    value: 82.5,                  // raw number (used for comparisons)
    formattedValue: "82.5%",      // what's displayed large on the card
    unit: "%",                    // "%" → shows "p.p." in trend; "" → shows absolute number
    previousValue: 85.0,          // last period's value (used for trend direction)
    target: 70,                   // goal; shown as "Meta: 70.0%" at the bottom
    trend: trendDir(82.5, 85.0),  // "up" | "down" | "stable" — auto-computed
    trendValue: 82.5 - 85.0,      // delta vs. previous (-2.5)
    alert: getAlertLevel(82.5, 70, true), // "green" | "yellow" | "red" — auto-computed
    higherIsBetter: true,         // flips trend color logic (red when falling)
    description: "Office presence rate",
  },
];

// 3. Render
return <KpiGrid kpis={kpis} />;
```

**`KpiGrid`** auto-sizes: 1 column on mobile → 2 on sm → 3 on lg → 4 on xl. You don't configure this.

**Alert color logic** (from `src/lib/utils.ts`):

```
higherIsBetter = true:
  value >= 95% of target → green
  value >= 80% of target → yellow
  value <  80% of target → red

higherIsBetter = false (e.g., turnover, overtime):
  value <= 105% of target → green
  value <= 120% of target → yellow
  value >  120% of target → red
```

**AlertBadge** is rendered automatically inside KpiCard — you never use it directly.

---

### 2. CollapsibleSection

**File:** `src/components/ui/CollapsibleSection.tsx`

**What it looks like:** A row with a bold section title, a +/- toggle button, and a horizontal line. Content below collapses/expands.

**How to use:**

```tsx
import CollapsibleSection from "@/components/ui/CollapsibleSection";

<CollapsibleSection title="WORKFORCE PLANNING" id="workforce">
  {/* anything goes here */}
  <KpiGrid kpis={workforceKpis} />
</CollapsibleSection>
```

Props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | required | Section header text (shown uppercase) |
| `id` | string | — | HTML id, used for `#anchor` navigation from the sidebar |
| `defaultOpen` | boolean | `true` | Whether the section starts expanded |
| `children` | ReactNode | required | Content |

---

### 3. DistributionBar

**File:** Defined inline inside `src/app/(app)/dashboard/page.tsx`

**What it looks like:** A group of vertical bars (like a bar chart), with the count above each bar and a label below. Hover shows the percentage.

**How to use:** Currently inline in the dashboard page. To reuse it, copy the function or extract it to `src/components/dashboard/DistributionBar.tsx`.

```tsx
<DistributionBar
  title="Distribuição de Cargos"
  items={[
    { label: "Analyst",  count: 5, color: "#1e40af" },
    { label: "Senior",   count: 3, color: "#2563eb" },
    { label: "Manager",  count: 2, color: "#3b82f6" },
  ]}
  total={10}
/>
```

Props:

| Prop | Type | Description |
|---|---|---|
| `title` | string | Card header label |
| `items` | `Array<{ label, sublabel?, count, color? }>` | Each bar. `count` drives bar height. |
| `total` | number | Used to compute percentage shown on hover |

---

### 4. SplitCard

**File:** Defined inline inside `src/app/(app)/dashboard/page.tsx`

**What it looks like:** A white card split into two (or more) large-number columns side by side. Good for Male/Female splits, Leaders/Non-leaders, etc.

```tsx
<SplitCard
  title="Gênero"
  items={[
    { label: "Homens", value: "7", sub: "(54%)" },
    { label: "Mulheres", value: "6", sub: "(46%)" },
  ]}
/>
```

Props:

| Prop | Type | Description |
|---|---|---|
| `title` | string | Card header |
| `items` | `Array<{ label, value, sub? }>` | Each column. `value` is displayed large, `sub` smaller next to it. |

---

### 5. MotivosCard

**File:** Defined inline inside `src/app/(app)/dashboard/page.tsx`

**What it looks like:** A white card with horizontal progress bars, one per exit reason. Good for ranked lists.

```tsx
<MotivosCard
  items={[
    ["Remuneração", 20],
    ["Carreira",    15],
    ["Outros",      45],
  ]}
/>
```

Props: `items` is an array of `[label: string, percentage: number]` tuples. Bars are scaled relative to the largest value (not necessarily 100%).

---

### 6. OrgTree

**File:** `src/components/org/OrgTree.tsx`

**What it looks like:** A hierarchy diagram. The team leader is shown in a blue card at the top. Each employee hangs below on a connector line. Hovering an employee shows a detailed tooltip card.

**Where it's used:** `src/app/(app)/org/page.tsx`

**How the page feeds it:**

```tsx
// org/page.tsx (Server Component)
const employees = await query<EmpRow>(
  `SELECT id, name, role, department, email, CAST(hire_date AS VARCHAR) as hire_date,
          tenure_months, salary_usd, status
   FROM employees WHERE team_id = ? AND status != 'terminated' ORDER BY name`,
  [tid]
);

// Then passes to the Client Component:
<OrgTree
  leader={{ name: session.user.name, role: "Team Leader" }}
  employees={employees}
/>
```

Props:

| Prop | Type | Description |
|---|---|---|
| `leader` | `{ name: string; role: string }` | The TL node shown at top |
| `employees` | `Employee[]` | All direct reports |

---

### 7. AiPanel

**File:** `src/components/layout/AiPanel.tsx`

**What it looks like:** A slide-in panel from the right edge of the screen. Has a chat history, suggestion chips, and an input box. Opens when you click "Assistente IA" in the header.

**How it works:** It's a fully client-side component. On submit, it calls `POST /api/ai/chat` with the user's message. The server route runs a LangGraph agent that generates and executes SQL against DuckDB, then returns a natural-language answer.

It's controlled by `AppShell` (which holds the `open` state). You never need to touch AiPanel unless you're modifying the chat UX.

---

### 8. AppShell (layout)

**File:** `src/components/layout/AppShell.tsx`

**What it looks like:** The permanent chrome — sidebar on the left (logo, user profile, nav links) and a sticky header at the top with the page title and the AI button.

**It is not a visual data component.** It wraps every authenticated page. You configure it in `src/app/(app)/layout.tsx`, which reads the session and headcount from the DB once per navigation.

---

## How a new dashboard section is built — step by step

This is the equivalent of adding a new section in Streamlit. Example: adding a "Training" section.

### Step 1 — Write the SQL query in the page

Open `src/app/(app)/dashboard/page.tsx`. Add your query to the `Promise.all` block:

```typescript
query<{ rate: number }>(
  `SELECT ROUND(AVG(t.completion_rate) * 100, 1) as rate
   FROM some_training_table t
   JOIN employees e ON e.id = t.employee_id
   WHERE e.team_id = ?`,
  [tid]
),
```

Destructure the result at the top of the array.

### Step 2 — Build KpiSummary objects

```typescript
const trainingKpis: KpiSummary[] = [
  kpi(
    "training-completion",         // id
    "Conclusão de Treinamentos",   // label
    completionRate,                // value
    `${completionRate.toFixed(1)}%`, // formattedValue
    "%",                           // unit
    completionRate - prevRate,     // trendValue (delta)
    trendDir(completionRate, prevRate), // trend direction
    getAlertLevel(completionRate, 80, true), // alert
    true,                          // higherIsBetter
    80                             // target
  ),
];
```

The `kpi()` helper at the top of `dashboard/page.tsx` is just a shorthand constructor so you don't repeat field names.

### Step 3 — Add a CollapsibleSection to the JSX

```tsx
<CollapsibleSection title="TREINAMENTOS" id="treinamentos">
  <KpiGrid kpis={trainingKpis} />
</CollapsibleSection>
```

### Step 4 — Add the section to the sidebar nav

Open `src/components/layout/AppShell.tsx`. Add to `NAV_ITEMS`:

```typescript
{ href: "/dashboard#treinamentos", label: "Treinamentos", icon: GraduationCap, isPage: false },
```

Import `GraduationCap` from `lucide-react` at the top of the file.

That's it — the data flows from DuckDB through the page query to the KpiSummary object to the KpiCard render.

---

## How to add a new standalone page

Example: a dedicated Turnover detail page at `/turnover`.

1. Create `src/app/(app)/turnover/page.tsx` as an `async` Server Component.
2. Call `query()` inside it, filter by `tid` from `auth()`.
3. Return JSX using any mix of KpiGrid, CollapsibleSection, and inline card components.
4. Add the route to `NAV_ITEMS` in AppShell with `isPage: true`.

No routing config needed — Next.js picks up any `page.tsx` file in the `(app)` folder automatically.

---

## File map

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx            ← reads session + headcount, renders AppShell
│   │   ├── dashboard/page.tsx    ← MAIN DASHBOARD — all queries + KPI sections
│   │   ├── employees/page.tsx    ← employee table page
│   │   └── org/page.tsx          ← org chart page
│   ├── (auth)/login/page.tsx     ← login form
│   ├── api/ai/chat/route.ts      ← AI chat endpoint (LangGraph agent)
│   └── globals.css               ← global styles + scrollbar
│
├── components/
│   ├── dashboard/
│   │   ├── AlertBadge.tsx        ← green/yellow/red dot badge
│   │   ├── KpiCard.tsx           ← single metric card
│   │   └── KpiGrid.tsx           ← responsive grid of KpiCards
│   ├── layout/
│   │   ├── AppShell.tsx          ← sidebar + header chrome
│   │   └── AiPanel.tsx           ← AI chat slide-in panel
│   ├── org/
│   │   └── OrgTree.tsx           ← org hierarchy diagram
│   └── ui/
│       └── CollapsibleSection.tsx ← expandable section wrapper
│
├── lib/
│   ├── db/
│   │   ├── client.ts             ← query() function
│   │   └── seed.ts               ← table creation + mock data insert
│   ├── ai/agent.ts               ← LangGraph ReAct agent
│   ├── auth/                     ← NextAuth config
│   └── utils.ts                  ← getAlertLevel, trendDir, trendColorClass
│
├── data/mock.ts                  ← all mock data (employees, metrics)
└── types/index.ts                ← KpiSummary, AlertLevel, Employee, etc.
```

---

## Customizing an existing KPI card

### Anatomy of KpiCard

Every card is a single `<div>` with three stacked zones. Here's the current layout annotated:

```
┌─────────────────────────────────────────────┐
│  [LABEL]                    [ALERT BADGE]   │  ← top row
│  [MAIN VALUE]                               │
├─────────────────────────────────────────────│
│  [TREND ICON] [DELTA] vs. anterior          │  ← trend row
├─────────────────────────────────────────────│
│  Meta: 70.0%                                │  ← target line (optional)
└─────────────────────────────────────────────┘
```

In code (`src/components/dashboard/KpiCard.tsx`):

```tsx
<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm ...">

  {/* ── ZONE 1: top row ── */}
  <div className="mb-4 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{kpi.label}</p>      {/* label */}
      <p className="mt-1 text-3xl font-bold text-slate-900">{kpi.formattedValue}</p>  {/* value */}
    </div>
    <AlertBadge level={kpi.alert} />    {/* badge — top right */}
  </div>

  {/* ── ZONE 2: trend row ── */}
  <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
    <TrendIcon className="h-4 w-4" />
    <span>+2.5 p.p.</span>
    <span className="ml-1 font-normal text-slate-400">vs. anterior</span>
  </div>

  {/* ── ZONE 3: target line (only if target > 0) ── */}
  {kpi.target > 0 && (
    <p className="mt-3 text-xs text-slate-400">Meta: 70.0%</p>
  )}

</div>
```

### Example 1 — Move the badge below the value

Instead of top-right, you want the badge directly under the large number:

```tsx
// Before (in KpiCard.tsx):
<div className="mb-4 flex items-start justify-between">
  <div>
    <p ...>{kpi.label}</p>
    <p ...>{kpi.formattedValue}</p>
  </div>
  <AlertBadge level={kpi.alert} />    {/* ← remove from here */}
</div>

// After — badge moves below the value, badge on its own line:
<div className="mb-4">
  <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
  <p className="mt-1 text-3xl font-bold text-slate-900">{kpi.formattedValue}</p>
  <div className="mt-2">
    <AlertBadge level={kpi.alert} />  {/* ← now here */}
  </div>
</div>
```

### Example 2 — Add a second metric below the main value (like a sub-KPI)

You want to show both "82.5%" large and "127 days avg" smaller underneath:

Add a `subValue` prop to the card:

```tsx
// In KpiCard.tsx — extend the prop signature:
export default function KpiCard({ kpi, subValue }: {
  kpi: KpiSummary;
  subValue?: string;   // ← new optional prop
}) {
  ...
  return (
    <div ...>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{kpi.formattedValue}</p>
          {subValue && (
            <p className="mt-0.5 text-sm text-slate-400">{subValue}</p>   {/* ← new line */}
          )}
        </div>
        <AlertBadge level={kpi.alert} />
      </div>
      ...
    </div>
  );
}

// Usage in dashboard/page.tsx:
<KpiCard kpi={attendanceKpi} subValue="127 dias consecutivos" />
```

### Example 3 — Change the card's accent color for a specific KPI

You want the "Turnover" card to always have a red-tinted border:

```tsx
// In KpiCard.tsx — compute border based on alert level:
const borderClass =
  kpi.alert === "red"    ? "border-red-300"    :
  kpi.alert === "yellow" ? "border-amber-300"  :
                           "border-slate-200";

return (
  <div className={`rounded-xl border bg-white p-6 shadow-sm ${borderClass}`}>
    ...
  </div>
);
```

---

## Creating a new KPI card variant

Sometimes the standard card layout isn't enough — you need a sparkline, a donut slice, or a progress bar embedded in the card. The approach is always the same: **create a new component file in `src/components/dashboard/`** rather than modifying KpiCard.

### Variant A — Card with sparkline (no extra dependency)

A sparkline is a tiny trend line drawn with SVG. No library needed.

**Create `src/components/dashboard/SparklineCard.tsx`:**

```tsx
// "use client" is NOT needed — pure display, no interactivity
import AlertBadge from "./AlertBadge";
import { AlertLevel, TrendDirection } from "@/types";
import { trendColorClass } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface SparklineCardProps {
  label: string;
  value: string;           // formatted display value, e.g. "82.5%"
  trend: TrendDirection;
  trendValue: number;
  trendUnit: string;       // "p.p." | "" | "h" etc.
  alert: AlertLevel;
  higherIsBetter: boolean;
  data: number[];          // ordered array of raw values, oldest first
  target?: number;
  targetLabel?: string;
}

// Pure SVG — takes an array of numbers, draws a polyline
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-10 w-full" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 32;

  const points = data
    .map((v, i) => {
      const x = ((i / (data.length - 1)) * (W - 4) + 2).toFixed(1);
      const y = (H - 2 - ((v - min) / range) * (H - 4)).toFixed(1);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="#1e40af"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SparklineCard({
  label, value, trend, trendValue, trendUnit,
  alert, higherIsBetter, data, target, targetLabel,
}: SparklineCardProps) {
  const trendColor = trendColorClass(trend, higherIsBetter);
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">

      {/* Top row */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <AlertBadge level={alert} />
      </div>

      {/* Sparkline — the main addition */}
      <div className="mb-3">
        <Sparkline data={data} />
      </div>

      {/* Trend row */}
      <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span>
          {trendValue > 0 ? "+" : ""}{trendValue.toFixed(1)}{trendUnit ? ` ${trendUnit}` : ""}
        </span>
        <span className="ml-1 font-normal text-slate-400">vs. anterior</span>
      </div>

      {target && (
        <p className="mt-3 text-xs text-slate-400">
          Meta: {targetLabel ?? target}
        </p>
      )}
    </div>
  );
}
```

**Usage in `dashboard/page.tsx`:**

```tsx
import SparklineCard from "@/components/dashboard/SparklineCard";

// monthlyTurnover is already queried in the page:
// const monthlyTurnover = await query<MonthCount>(...);
const tvTrend = monthlyTurnover.map((r) => r.count);

<SparklineCard
  label="Taxa de Turnover"
  value={`${tvRate.toFixed(1)}%`}
  trend="down"
  trendValue={-1}
  trendUnit="p.p."
  alert="green"
  higherIsBetter={false}
  data={tvTrend}          // ← the array that feeds the sparkline
  target={10}
  targetLabel="10%"
/>
```

**How to feed the sparkline from DuckDB:**

The sparkline needs an ordered array of numbers. Query your metric grouped by month, then extract just the values:

```typescript
const monthlyData = await query<{ month: string; rate: number }>(
  `SELECT
     CAST(DATE_TRUNC('month', date) AS VARCHAR) as month,
     ROUND(100.0 * COUNT(CASE WHEN status='present' THEN 1 END) / NULLIF(COUNT(*), 0), 1) as rate
   FROM attendance a
   JOIN employees e ON e.id = a.employee_id
   WHERE e.team_id = ?
   GROUP BY DATE_TRUNC('month', date)
   ORDER BY 1`,
  [tid]
);

// Extract just the numbers, oldest → newest
const sparkData = monthlyData.map((r) => r.rate);
// e.g. [78.0, 81.5, 80.2, 82.5]
```

### Variant B — Card with a progress bar

Good for "X out of Y" metrics like training completion or hour-bank compensation.

**Create `src/components/dashboard/ProgressCard.tsx`:**

```tsx
import AlertBadge from "./AlertBadge";
import { AlertLevel } from "@/types";

interface ProgressCardProps {
  label: string;
  value: string;          // e.g. "73%"
  pct: number;            // 0–100, drives bar width
  alert: AlertLevel;
  subLabel?: string;      // e.g. "47h à compensar"
  target?: number;        // e.g. 80 → draws a target marker on the bar
}

export default function ProgressCard({
  label, value, pct, alert, subLabel, target,
}: ProgressCardProps) {
  const barColor =
    alert === "red" ? "bg-red-500" : alert === "yellow" ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">

      {/* Top row */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {subLabel && (
            <p className="mt-0.5 text-xs text-slate-400">{subLabel}</p>
          )}
        </div>
        <AlertBadge level={alert} />
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
        {/* Target marker — a thin vertical tick on the bar */}
        {target !== undefined && (
          <div
            className="absolute top-0 h-2 w-0.5 bg-slate-400"
            style={{ left: `${Math.min(target, 100)}%` }}
            title={`Meta: ${target}%`}
          />
        )}
      </div>

    </div>
  );
}
```

**Usage:**

```tsx
import ProgressCard from "@/components/dashboard/ProgressCard";

<ProgressCard
  label="Banco de Horas Compensado"
  value={`${bhComp}%`}
  pct={bhComp}           // raw number 0–100, fills the bar
  alert={getAlertLevel(bhComp, 80, true)}
  subLabel={`${bhPending}h à compensar`}
  target={80}            // draws the target tick at 80% on the bar
/>
```

### Variant C — Card with a donut slice

Good for single-ratio metrics like "% on target" or gender split. Uses SVG, no library.

**Create `src/components/dashboard/DonutCard.tsx`:**

```tsx
import AlertBadge from "./AlertBadge";
import { AlertLevel } from "@/types";

interface DonutCardProps {
  label: string;
  value: string;
  pct: number;      // 0–100, what fraction of the donut is filled
  alert: AlertLevel;
  centerLabel?: string;  // text inside the donut hole, e.g. "82%"
}

function DonutRing({ pct, color }: { pct: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {/* Track */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      {/* Arc */}
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

export default function DonutCard({ label, value, pct, alert, centerLabel }: DonutCardProps) {
  const color = alert === "red" ? "#ef4444" : alert === "yellow" ? "#f59e0b" : "#10b981";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <AlertBadge level={alert} />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutRing pct={pct} color={color} />
          {centerLabel && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
              {centerLabel}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
```

**Usage:**

```tsx
import DonutCard from "@/components/dashboard/DonutCard";

<DonutCard
  label="Presença no Escritório"
  value="82.5%"
  pct={82.5}
  alert="green"
  centerLabel="82%"
/>
```

---

## Decision guide — which card to use

| Situation | Use |
|---|---|
| One number, status, and trend | `KpiCard` (default) |
| Trend over time matters (show the curve) | `SparklineCard` |
| "X% of goal" where the distance to goal is the story | `ProgressCard` |
| A ratio or proportion that reads as a fraction of a circle | `DonutCard` |
| Two numbers side by side (e.g. M/F, leaders/others) | `SplitCard` (inline in dashboard) |
| Ranked breakdown of categories | `DistributionBar` (inline in dashboard) |

All of these share the same outer shell: `rounded-xl border border-slate-200 bg-white p-6 shadow-sm`. Keep that wrapper on any new card you create and it will automatically fit into a `KpiGrid`.

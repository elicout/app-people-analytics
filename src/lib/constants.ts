/** Minimum delta for trendDir() to consider a change non-stable. */
export const TREND_STABLE_DELTA = 0.1 as const;

/** Explicit alert thresholds per KPI. Add an entry here when a KPI gets defined rules.
 *  Thresholds are absolute values (not ratios). For higherIsBetter KPIs: red < yellow < green.
 *  For lowerIsBetter: green < yellow < red. */
export interface KpiRule {
  higherIsBetter: boolean;
  yellow: number;
  red: number;
}

export const KPI_RULES = {
  presence: { higherIsBetter: true, yellow: 60, red: 50 },
  activity: { higherIsBetter: true, yellow: 80, red: 70 },
  bh_comp:  { higherIsBetter: true, yellow: 80, red: 70 },
} as const satisfies Record<string, KpiRule>;

/** KPI target values. Shared between dashboard, org chart, and AI agent context. */
export const TARGETS = {
  PRESENCE_PCT:        60,
  ON_TIME_PCT:         60,
  ACTIVITY_PCT:        90,
  PERFORMANCE_SCORE:   80,
  OVERTIME_HOURS:      100,
  BH_COMPENSATED_PCT:  80,
  TURNOVER_RATE_PCT:   10,
  TURNOVER_COUNT:      5,
  REGRETTED_RATE_PCT:  5,
  GPTW_SCORE:          80,
} as const;

/** GD (Gestão de Desempenho) cluster config.
 *  THRESHOLDS and TENURE_LEADER_SPLIT_MONTHS are also encoded in SQL in
 *  dashboard/page.tsx — update both together when changing cluster boundaries. */
export const GD_CONFIG = {
  THRESHOLDS: { CE: 90, FE: 80, CA: 70, PA: 60 } as const,
  COLORS: ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#bfdbfe"] as const,
  TENURE_LEADER_SPLIT_MONTHS: 24,
} as const;

export const RLS = {
  /** DuckDB column used for row-level security across all employee-related tables. */
  COLUMN: "manager_chain",
} as const;

/** Fixed 12-month chart window matching the mock data period range.
 *  Update when the data set is refreshed or the reference date changes. */
export const CHART_PERIODS = [
  "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
] as const satisfies string[];

/** Ratios still derived from headcount — replace each one as the DB gains the underlying column.
 *  GEP_PCT: no GEP score in DB yet. REGRETTED_PCT: no regretted flag in turnover table yet. */
export const MOCK_RATIOS = {
  GEP_PCT:       0.07,
  REGRETTED_PCT: 0.50,
} as const;

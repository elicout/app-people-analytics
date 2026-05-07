/** Alert level thresholds used by getAlertLevel() in utils.ts. */
export const ALERT = {
  GREEN_RATIO:        0.95,
  YELLOW_RATIO:       0.80,
  LOWER_GREEN_RATIO:  1.05,
  LOWER_YELLOW_RATIO: 1.20,
  TREND_STABLE_DELTA: 0.1,
} as const;

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

/** Ratios used to derive mock KPIs from headcount.
 *  Move to mock repository when the data boundary is built (see CLAUDE.md § Data layer). */
export const MOCK_RATIOS = {
  PCD_PCT:       0.05,
  MALE_PCT:      0.50,
  GEP_PCT:       0.07,
  REGRETTED_PCT: 0.50,
  OPEN_POS_PCT:  0.04,
} as const;

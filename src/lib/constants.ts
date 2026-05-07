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

/** Ratios used to derive mock KPIs from headcount.
 *  Move to mock repository when the data boundary is built (see CLAUDE.md § Data layer). */
export const MOCK_RATIOS = {
  PCD_PCT:       0.05,
  MALE_PCT:      0.50,
  GEP_PCT:       0.07,
  REGRETTED_PCT: 0.50,
  OPEN_POS_PCT:  0.04,
} as const;

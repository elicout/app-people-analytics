// ── Row shapes (snake_case matches DuckDB column names) ───────────────────────

export interface MonthCount          { month: string; count: number }
export interface ClusterCount        { cluster: string; count: number }
export interface RoleCount           { role: string; count: number }
export interface TenureSplit         { leader_tenure: number; nonleader_tenure: number }
export interface TenureBandCount     { band: string; sort_key: number; count: number }
export interface AgeGroupCount       { age_group: string; sort_key: number; count: number }
export interface TeamCount           { team_id: string; count: number }
export interface DiversitySummary    { male: number; female: number; pcd: number }
export interface EmployeeListRow {
  id: string; name: string; role: string; department: string; email: string;
  hire_date: string; tenure_months: number; salary_usd: number; status: string;
}
export interface EmployeeOrgRow {
  id: string; team_id: string; name: string; role: string; role_level: number;
  department: string; email: string; hire_date: string; tenure_months: number;
  salary_usd: number; manager_id: string | null; status: string;
}
export interface EmployeePresenceRow { employee_id: string; presence_rate: number }
export interface EmployeeOnTimeRow   { employee_id: string; on_time_rate: number }
export interface EmployeeScoreRow    { employee_id: string; avg_score: number }
export interface EmployeeOtRow       { employee_id: string; total_ot_hours: number }
export interface TimeBankSummaryRow  { total_accrued: number; total_compensated: number; balance: number; balance_pct: number }
export interface TimeBankEmployeeRow { employee_id: string; name: string; total_accrued: number; total_compensated: number; balance: number; balance_pct: number }

// ── Repository interfaces ──────────────────────────────────────────────────────

export interface IEmployeeRepository {
  getHeadcount(userEmail: string): Promise<number>;
  getTotalSalary(userEmail: string): Promise<number>;
  getMonthlyHires(userEmail: string): Promise<MonthCount[]>;
  getMonthlyHeadcountCumulative(userEmail: string): Promise<MonthCount[]>;
  getRoleDistribution(userEmail: string): Promise<RoleCount[]>;
  getTenureSplit(userEmail: string): Promise<TenureSplit>;
  /** Sex breakdown and PCD count for active/on-leave employees in scope. */
  getDiversitySummary(userEmail: string): Promise<DiversitySummary>;
  /** Count of open (vacant) positions in scope. */
  getOpenPositionsCount(userEmail: string): Promise<number>;
  /** Cumulative open position count per month, ordered ascending, derived from opened_date. */
  getMonthlyOpenPositions(userEmail: string): Promise<MonthCount[]>;
  /** Headcount bucketed into tenure bands, ordered short → long tenure. */
  getTenureDistribution(userEmail: string): Promise<TenureBandCount[]>;
  /** Headcount bucketed into age groups derived from birth_year. */
  getAgeDistribution(userEmail: string): Promise<AgeGroupCount[]>;
  /** Headcount per team (excludes team-leadership). */
  getTeamDistribution(userEmail: string): Promise<TeamCount[]>;
  /** Active employees ordered by name — for the employees directory page. */
  getList(userEmail: string): Promise<EmployeeListRow[]>;
  /** Active non-leadership employees ordered by role_level — for the org chart. */
  getForOrg(userEmail: string): Promise<EmployeeOrgRow[]>;
}

export interface IAttendanceRepository {
  /** Team-level attendance rate as a percentage (0–100). */
  getTeamRate(userEmail: string): Promise<number>;
  /** Per-employee presence rate (0–1) for org chart nodes. */
  getPerEmployee(userEmail: string): Promise<EmployeePresenceRow[]>;
}

export interface IProductivityRepository {
  /** Team-level on-time delivery rate as a percentage (0–100). */
  getTeamOnTimeRate(userEmail: string): Promise<number>;
  getPerEmployee(userEmail: string): Promise<EmployeeOnTimeRow[]>;
}

export interface IOvertimeRepository {
  /** Total overtime hours across the team for the current period. */
  getTotalHours(userEmail: string): Promise<number>;
  /** Latest-period overtime hours per employee for org chart nodes. */
  getPerEmployee(userEmail: string): Promise<EmployeeOtRow[]>;
}

export interface IPerformanceRepository {
  /** GD (Gestão de Desempenho) cluster distribution ordered CE→NA. */
  getGdClusters(userEmail: string): Promise<ClusterCount[]>;
  getHighPerformersCount(userEmail: string): Promise<number>;
  getPerEmployee(userEmail: string): Promise<EmployeeScoreRow[]>;
}

export interface ITurnoverRepository {
  getCount(userEmail: string): Promise<number>;
  getMonthlyCount(userEmail: string): Promise<MonthCount[]>;
}

export interface ITimeBankRepository {
  /** Aggregate BH totals across the team — drives the Jornada card summary. */
  getSummary(userEmail: string): Promise<TimeBankSummaryRow>;
  /** Per-employee BH breakdown — drives the Jornada nominal table. */
  getPerEmployee(userEmail: string): Promise<TimeBankEmployeeRow[]>;
}

// ── Composite ─────────────────────────────────────────────────────────────────

export interface Repositories {
  employees:    IEmployeeRepository;
  attendance:   IAttendanceRepository;
  productivity: IProductivityRepository;
  overtime:     IOvertimeRepository;
  performance:  IPerformanceRepository;
  turnover:     ITurnoverRepository;
  timeBank:     ITimeBankRepository;
}

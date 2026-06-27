import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type {
  IEmployeeRepository, MonthCount, RoleCount,
  TenureSplit, TenureBandCount, AgeGroupCount, TeamCount,
  DiversitySummary, EmployeeListRow, EmployeeOrgRow,
} from "../interfaces/types";

export class MockEmployeeRepository implements IEmployeeRepository {
  async getHeadcount(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      `SELECT CAST(COUNT(*) AS INTEGER) as value
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')`,
      rp
    );
    return rows[0]?.value ?? 0;
  }

  async getTotalSalary(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      `SELECT ROUND(SUM(salary_usd), 0) as value
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')`,
      rp
    );
    return rows[0]?.value ?? 0;
  }

  async getMonthlyHires(userEmail: string): Promise<MonthCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<MonthCount>(
      `SELECT CAST(DATE_TRUNC('month', hire_date) AS VARCHAR) as month,
              CAST(COUNT(*) AS INTEGER) as count
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')
       GROUP BY DATE_TRUNC('month', hire_date) ORDER BY 1`,
      rp
    );
  }

  async getMonthlyHeadcountCumulative(userEmail: string): Promise<MonthCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<MonthCount>(
      `SELECT month, CAST(SUM(count) OVER (ORDER BY month) AS INTEGER) as count FROM (
         SELECT CAST(DATE_TRUNC('month', hire_date) AS VARCHAR) as month,
                CAST(COUNT(*) AS INTEGER) as count
         FROM employees
         WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')
         GROUP BY DATE_TRUNC('month', hire_date)
       ) ORDER BY month`,
      rp
    );
  }

  async getRoleDistribution(userEmail: string): Promise<RoleCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<RoleCount>(
      `SELECT role, CAST(COUNT(*) AS INTEGER) as count
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')
       GROUP BY role ORDER BY count DESC`,
      rp
    );
  }

  async getTenureSplit(userEmail: string): Promise<TenureSplit> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<TenureSplit>(
      `SELECT
         ROUND(AVG(CASE WHEN tenure_months > 24 THEN tenure_months END), 0) as leader_tenure,
         ROUND(AVG(CASE WHEN tenure_months <= 24 THEN tenure_months END), 0) as nonleader_tenure
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')`,
      rp
    );
    return rows[0] ?? { leader_tenure: 24, nonleader_tenure: 13 };
  }

  async getDiversitySummary(userEmail: string): Promise<DiversitySummary> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ male: number; female: number; pcd: number }>(
      `SELECT
         CAST(COUNT(*) FILTER (WHERE sex = 'M') AS INTEGER) as male,
         CAST(COUNT(*) FILTER (WHERE sex = 'F') AS INTEGER) as female,
         CAST(COUNT(*) FILTER (WHERE pcd = true)  AS INTEGER) as pcd
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')`,
      rp
    );
    return rows[0] ?? { male: 0, female: 0, pcd: 0 };
  }

  async getMonthlyOpenPositions(userEmail: string): Promise<MonthCount[]> {
    const rows = await query<MonthCount>(
      `SELECT
         CAST(DATE_TRUNC('month', opened_date) AS VARCHAR) as month,
         CAST(SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', opened_date)) AS INTEGER) as count
       FROM employees
       WHERE CONTAINS(manager_chain, ?) AND status = 'open' AND opened_date IS NOT NULL
       GROUP BY DATE_TRUNC('month', opened_date)
       ORDER BY month`,
      [buildRlsParams(userEmail).employee[0]!]
    );
    return rows;
  }

  async getOpenPositionsCount(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      `SELECT CAST(COUNT(*) AS INTEGER) as value
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND status = 'open'`,
      // RLS for open positions: uses only manager_chain (no email filter — vacancies have no email)
      [rp[0]!]
    );
    return rows[0]?.value ?? 0;
  }

  async getTenureDistribution(userEmail: string): Promise<TenureBandCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<TenureBandCount>(
      `SELECT band, sort_key, CAST(COUNT(*) AS INTEGER) as count FROM (
         SELECT
           CASE
             WHEN tenure_months <  6  THEN '0–6m'
             WHEN tenure_months < 12  THEN '6–12m'
             WHEN tenure_months < 24  THEN '1–2a'
             WHEN tenure_months < 60  THEN '2–5a'
             ELSE '5a+'
           END as band,
           CASE
             WHEN tenure_months <  6  THEN 1
             WHEN tenure_months < 12  THEN 2
             WHEN tenure_months < 24  THEN 3
             WHEN tenure_months < 60  THEN 4
             ELSE 5
           END as sort_key
         FROM employees
         WHERE CONTAINS(manager_chain,?) AND email!=? AND status NOT IN ('terminated','open')
       ) GROUP BY band, sort_key ORDER BY sort_key`,
      rp
    );
  }

  async getAgeDistribution(userEmail: string): Promise<AgeGroupCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<AgeGroupCount>(
      `SELECT age_group, sort_key, CAST(COUNT(*) AS INTEGER) as count FROM (
         SELECT
           CASE
             WHEN (2024 - birth_year) < 30 THEN '< 30'
             WHEN (2024 - birth_year) < 40 THEN '30–39'
             WHEN (2024 - birth_year) < 50 THEN '40–49'
             ELSE '50+'
           END as age_group,
           CASE
             WHEN (2024 - birth_year) < 30 THEN 1
             WHEN (2024 - birth_year) < 40 THEN 2
             WHEN (2024 - birth_year) < 50 THEN 3
             ELSE 4
           END as sort_key
         FROM employees
         WHERE CONTAINS(manager_chain,?) AND email!=?
           AND status NOT IN ('terminated','open') AND birth_year IS NOT NULL
       ) GROUP BY age_group, sort_key ORDER BY sort_key`,
      rp
    );
  }

  async getTeamDistribution(userEmail: string): Promise<TeamCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<TeamCount>(
      `SELECT team_id, CAST(COUNT(*) AS INTEGER) as count
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=?
         AND status NOT IN ('terminated','open') AND team_id != 'team-leadership'
       GROUP BY team_id ORDER BY count DESC`,
      rp
    );
  }

  async getList(userEmail: string): Promise<EmployeeListRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeeListRow>(
      `SELECT id, name, role, department, email,
              CAST(hire_date AS VARCHAR) as hire_date, tenure_months, salary_usd, status
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status != 'terminated'
       ORDER BY CASE WHEN status = 'open' THEN 1 ELSE 0 END, name`,
      rp
    );
  }

  async getForOrg(userEmail: string): Promise<EmployeeOrgRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeeOrgRow>(
      `SELECT id, team_id, name, role, role_level, department, email,
              CAST(hire_date AS VARCHAR) AS hire_date, tenure_months, salary_usd, manager_id, status
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status != 'terminated'
         AND team_id != 'team-leadership'
       ORDER BY role_level, role`,
      rp
    );
  }
}

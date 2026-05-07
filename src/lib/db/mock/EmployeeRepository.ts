import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type {
  IEmployeeRepository, MonthCount, RoleCount,
  TenureSplit, EmployeeListRow, EmployeeOrgRow,
} from "../interfaces/types";

export class MockEmployeeRepository implements IEmployeeRepository {
  async getHeadcount(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      "SELECT CAST(COUNT(*) AS INTEGER) as value FROM employees WHERE CONTAINS(manager_chain,?) AND email!=? AND status!='terminated'",
      rp
    );
    return rows[0]?.value ?? 0;
  }

  async getTotalSalary(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      "SELECT ROUND(SUM(salary_usd), 0) as value FROM employees WHERE CONTAINS(manager_chain,?) AND email!=? AND status!='terminated'",
      rp
    );
    return rows[0]?.value ?? 0;
  }

  async getMonthlyHires(userEmail: string): Promise<MonthCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<MonthCount>(
      `SELECT CAST(DATE_TRUNC('month', hire_date) AS VARCHAR) as month,
              CAST(COUNT(*) AS INTEGER) as count
       FROM employees WHERE CONTAINS(manager_chain,?) AND email!=?
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
         FROM employees WHERE CONTAINS(manager_chain,?) AND email!=?
         GROUP BY DATE_TRUNC('month', hire_date)
       ) ORDER BY month`,
      rp
    );
  }

  async getRoleDistribution(userEmail: string): Promise<RoleCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<RoleCount>(
      `SELECT role, CAST(COUNT(*) AS INTEGER) as count
       FROM employees WHERE CONTAINS(manager_chain,?) AND email!=? AND status!='terminated'
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
       FROM employees WHERE CONTAINS(manager_chain,?) AND email!=? AND status!='terminated'`,
      rp
    );
    return rows[0] ?? { leader_tenure: 24, nonleader_tenure: 13 };
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

import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { ITimeBankRepository, TimeBankSummaryRow, TimeBankEmployeeRow } from "../interfaces/types";

export class MockTimeBankRepository implements ITimeBankRepository {
  async getSummary(userEmail: string): Promise<TimeBankSummaryRow> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<TimeBankSummaryRow>(
      `SELECT
         CAST(SUM(tb.hours_accrued) AS INTEGER)      AS total_accrued,
         CAST(SUM(tb.hours_compensated) AS INTEGER)  AS total_compensated,
         CAST(SUM(tb.hours_accrued) - SUM(tb.hours_compensated) AS INTEGER) AS balance,
         ROUND(SUM(tb.hours_compensated) / NULLIF(SUM(tb.hours_accrued), 0) * 100, 1) AS balance_pct
       FROM time_bank tb
       JOIN employees e ON e.id = tb.employee_id
       WHERE CONTAINS(e.manager_chain, ?) AND e.email != ?`,
      rp
    );
    return rows[0] ?? { total_accrued: 0, total_compensated: 0, balance: 0, balance_pct: 0 };
  }

  async getPerEmployee(userEmail: string): Promise<TimeBankEmployeeRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<TimeBankEmployeeRow>(
      `SELECT
         e.id   AS employee_id,
         e.name,
         CAST(SUM(tb.hours_accrued) AS INTEGER)      AS total_accrued,
         CAST(SUM(tb.hours_compensated) AS INTEGER)  AS total_compensated,
         CAST(SUM(tb.hours_accrued) - SUM(tb.hours_compensated) AS INTEGER) AS balance,
         ROUND(SUM(tb.hours_compensated) / NULLIF(SUM(tb.hours_accrued), 0) * 100, 1) AS balance_pct
       FROM time_bank tb
       JOIN employees e ON e.id = tb.employee_id
       WHERE CONTAINS(e.manager_chain, ?) AND e.email != ? AND e.team_id != 'team-leadership'
       GROUP BY e.id, e.name
       ORDER BY e.name`,
      rp
    );
  }
}

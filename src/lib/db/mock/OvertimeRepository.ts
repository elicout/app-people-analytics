import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { IOvertimeRepository, EmployeeOtRow } from "../interfaces/types";

export class MockOvertimeRepository implements IOvertimeRepository {
  async getTotalHours(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ ot_hours: number }>(
      `SELECT CAST(SUM(o.overtime_hours) AS INTEGER) as ot_hours
       FROM overtime o JOIN employees e ON e.id=o.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=?`,
      rp
    );
    return rows[0]?.ot_hours ?? 0;
  }

  async getPerEmployee(userEmail: string): Promise<EmployeeOtRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeeOtRow>(
      `SELECT o.employee_id, SUM(o.overtime_hours) AS total_ot_hours
       FROM overtime o JOIN employees e ON e.id = o.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
         AND o.period = (SELECT MAX(period) FROM overtime)
       GROUP BY o.employee_id`,
      rp
    );
  }
}

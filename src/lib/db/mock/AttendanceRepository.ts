import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { IAttendanceRepository, EmployeePresenceRow } from "../interfaces/types";

export class MockAttendanceRepository implements IAttendanceRepository {
  async getTeamRate(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ rate: number }>(
      `SELECT ROUND(100.0 * COUNT(CASE WHEN a.status='present' THEN 1 END) /
              NULLIF(COUNT(*), 0), 1) as rate
       FROM attendance a JOIN employees e ON e.id=a.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=?`,
      rp
    );
    return Number(rows[0]?.rate ?? 0);
  }

  async getPerEmployee(userEmail: string): Promise<EmployeePresenceRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeePresenceRow>(
      `SELECT a.employee_id,
              ROUND(COUNT(CASE WHEN a.status='present' THEN 1 END) * 1.0 / NULLIF(COUNT(*),0), 3) AS presence_rate
       FROM attendance a JOIN employees e ON e.id = a.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY a.employee_id`,
      rp
    );
  }
}

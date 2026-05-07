import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { IProductivityRepository, EmployeeOnTimeRow } from "../interfaces/types";

export class MockProductivityRepository implements IProductivityRepository {
  async getTeamOnTimeRate(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ rate: number }>(
      `SELECT ROUND(AVG(p.delivery_on_time_rate) * 100, 1) as rate
       FROM productivity p JOIN employees e ON e.id=p.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=?`,
      rp
    );
    return Number(rows[0]?.rate ?? 0);
  }

  async getPerEmployee(userEmail: string): Promise<EmployeeOnTimeRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeeOnTimeRow>(
      `SELECT p.employee_id, ROUND(AVG(p.delivery_on_time_rate), 3) AS on_time_rate
       FROM productivity p JOIN employees e ON e.id = p.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY p.employee_id`,
      rp
    );
  }
}

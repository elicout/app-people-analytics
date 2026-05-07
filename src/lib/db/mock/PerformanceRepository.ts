import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { IPerformanceRepository, ClusterCount, EmployeeScoreRow } from "../interfaces/types";

export class MockPerformanceRepository implements IPerformanceRepository {
  async getGdClusters(userEmail: string): Promise<ClusterCount[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<ClusterCount>(
      `SELECT cluster, CAST(COUNT(*) AS INTEGER) as count FROM (
         SELECT e.id,
           CASE
             WHEN AVG(p.score) >= 90 THEN 'CE'
             WHEN AVG(p.score) >= 80 THEN 'FE'
             WHEN AVG(p.score) >= 70 THEN 'CA'
             WHEN AVG(p.score) >= 60 THEN 'PA'
             ELSE 'NA'
           END as cluster
         FROM employees e LEFT JOIN performance p ON e.id=p.employee_id
         WHERE CONTAINS(e.manager_chain,?) AND e.email!=? GROUP BY e.id
       ) sub GROUP BY cluster
       ORDER BY CASE cluster WHEN 'CE' THEN 1 WHEN 'FE' THEN 2 WHEN 'CA' THEN 3 WHEN 'PA' THEN 4 ELSE 5 END`,
      rp
    );
  }

  async getHighPerformersCount(userEmail: string): Promise<number> {
    const { employee: rp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      `SELECT CAST(COUNT(*) AS INTEGER) as value FROM (
         SELECT e.id FROM employees e JOIN performance p ON e.id=p.employee_id
         WHERE CONTAINS(e.manager_chain,?) AND e.email!=? GROUP BY e.id HAVING AVG(p.score) >= 80
       ) sub`,
      rp
    );
    return rows[0]?.value ?? 0;
  }

  async getPerEmployee(userEmail: string): Promise<EmployeeScoreRow[]> {
    const { employee: rp } = buildRlsParams(userEmail);
    return query<EmployeeScoreRow>(
      `SELECT p.employee_id, ROUND(AVG(p.score), 1) AS avg_score
       FROM performance p JOIN employees e ON e.id = p.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY p.employee_id`,
      rp
    );
  }
}

import { query } from "@/lib/db/client";
import { buildRlsParams } from "@/lib/db/rls";
import type { ITurnoverRepository, MonthCount } from "../interfaces/types";

export class MockTurnoverRepository implements ITurnoverRepository {
  async getCount(userEmail: string): Promise<number> {
    const { turnover: tp } = buildRlsParams(userEmail);
    const rows = await query<{ value: number }>(
      "SELECT CAST(COUNT(*) AS INTEGER) as value FROM turnover WHERE CONTAINS(manager_chain,?)",
      tp
    );
    return rows[0]?.value ?? 0;
  }

  async getMonthlyCount(userEmail: string): Promise<MonthCount[]> {
    const { turnover: tp } = buildRlsParams(userEmail);
    return query<MonthCount>(
      `SELECT CAST(DATE_TRUNC('month', termination_date) AS VARCHAR) as month,
              CAST(COUNT(*) AS INTEGER) as count
       FROM turnover WHERE CONTAINS(manager_chain,?) GROUP BY 1 ORDER BY 1`,
      tp
    );
  }
}

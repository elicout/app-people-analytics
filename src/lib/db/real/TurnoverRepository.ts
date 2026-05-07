import type { ITurnoverRepository, MonthCount } from "../interfaces/types";

export class RealTurnoverRepository implements ITurnoverRepository {
  getCount(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyCount(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
}

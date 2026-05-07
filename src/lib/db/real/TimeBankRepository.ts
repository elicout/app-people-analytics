import type { ITimeBankRepository, TimeBankSummaryRow, TimeBankEmployeeRow } from "../interfaces/types";

export class RealTimeBankRepository implements ITimeBankRepository {
  getSummary(_userEmail: string): Promise<TimeBankSummaryRow> { throw new Error("Not implemented: connect real data source"); }
  getPerEmployee(_userEmail: string): Promise<TimeBankEmployeeRow[]> { throw new Error("Not implemented: connect real data source"); }
}

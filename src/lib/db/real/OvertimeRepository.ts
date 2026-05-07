import type { IOvertimeRepository, EmployeeOtRow } from "../interfaces/types";

export class RealOvertimeRepository implements IOvertimeRepository {
  getTotalHours(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getPerEmployee(_userEmail: string): Promise<EmployeeOtRow[]> { throw new Error("Not implemented: connect real data source"); }
}

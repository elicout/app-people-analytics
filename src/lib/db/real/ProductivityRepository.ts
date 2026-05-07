import type { IProductivityRepository, EmployeeOnTimeRow } from "../interfaces/types";

export class RealProductivityRepository implements IProductivityRepository {
  getTeamOnTimeRate(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getPerEmployee(_userEmail: string): Promise<EmployeeOnTimeRow[]> { throw new Error("Not implemented: connect real data source"); }
}

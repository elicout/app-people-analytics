import type { IAttendanceRepository, EmployeePresenceRow } from "../interfaces/types";

export class RealAttendanceRepository implements IAttendanceRepository {
  getTeamRate(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getPerEmployee(_userEmail: string): Promise<EmployeePresenceRow[]> { throw new Error("Not implemented: connect real data source"); }
}

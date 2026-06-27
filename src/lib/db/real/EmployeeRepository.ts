import type {
  IEmployeeRepository, MonthCount, RoleCount,
  TenureSplit, TenureBandCount, AgeGroupCount, TeamCount,
  DiversitySummary, EmployeeListRow, EmployeeOrgRow,
} from "../interfaces/types";

export class RealEmployeeRepository implements IEmployeeRepository {
  getHeadcount(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getTotalSalary(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyHires(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyHeadcountCumulative(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
  getRoleDistribution(_userEmail: string): Promise<RoleCount[]> { throw new Error("Not implemented: connect real data source"); }
  getTenureSplit(_userEmail: string): Promise<TenureSplit> { throw new Error("Not implemented: connect real data source"); }
  getDiversitySummary(_userEmail: string): Promise<DiversitySummary> { throw new Error("Not implemented: connect real data source"); }
  getOpenPositionsCount(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyOpenPositions(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
  getTenureDistribution(_userEmail: string): Promise<TenureBandCount[]> { throw new Error("Not implemented: connect real data source"); }
  getAgeDistribution(_userEmail: string): Promise<AgeGroupCount[]> { throw new Error("Not implemented: connect real data source"); }
  getTeamDistribution(_userEmail: string): Promise<TeamCount[]> { throw new Error("Not implemented: connect real data source"); }
  getList(_userEmail: string): Promise<EmployeeListRow[]> { throw new Error("Not implemented: connect real data source"); }
  getForOrg(_userEmail: string): Promise<EmployeeOrgRow[]> { throw new Error("Not implemented: connect real data source"); }
}

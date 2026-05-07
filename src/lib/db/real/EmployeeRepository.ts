import type {
  IEmployeeRepository, MonthCount, RoleCount,
  TenureSplit, EmployeeListRow, EmployeeOrgRow,
} from "../interfaces/types";

export class RealEmployeeRepository implements IEmployeeRepository {
  getHeadcount(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getTotalSalary(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyHires(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
  getMonthlyHeadcountCumulative(_userEmail: string): Promise<MonthCount[]> { throw new Error("Not implemented: connect real data source"); }
  getRoleDistribution(_userEmail: string): Promise<RoleCount[]> { throw new Error("Not implemented: connect real data source"); }
  getTenureSplit(_userEmail: string): Promise<TenureSplit> { throw new Error("Not implemented: connect real data source"); }
  getList(_userEmail: string): Promise<EmployeeListRow[]> { throw new Error("Not implemented: connect real data source"); }
  getForOrg(_userEmail: string): Promise<EmployeeOrgRow[]> { throw new Error("Not implemented: connect real data source"); }
}

import type { IPerformanceRepository, ClusterCount, EmployeeScoreRow } from "../interfaces/types";

export class RealPerformanceRepository implements IPerformanceRepository {
  getGdClusters(_userEmail: string): Promise<ClusterCount[]> { throw new Error("Not implemented: connect real data source"); }
  getHighPerformersCount(_userEmail: string): Promise<number> { throw new Error("Not implemented: connect real data source"); }
  getPerEmployee(_userEmail: string): Promise<EmployeeScoreRow[]> { throw new Error("Not implemented: connect real data source"); }
}

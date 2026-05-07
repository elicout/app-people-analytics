import { RealEmployeeRepository } from "./EmployeeRepository";
import { RealAttendanceRepository } from "./AttendanceRepository";
import { RealProductivityRepository } from "./ProductivityRepository";
import { RealOvertimeRepository } from "./OvertimeRepository";
import { RealPerformanceRepository } from "./PerformanceRepository";
import { RealTurnoverRepository } from "./TurnoverRepository";
import type { Repositories } from "../interfaces/types";

export const realRepositories: Repositories = {
  employees:    new RealEmployeeRepository(),
  attendance:   new RealAttendanceRepository(),
  productivity: new RealProductivityRepository(),
  overtime:     new RealOvertimeRepository(),
  performance:  new RealPerformanceRepository(),
  turnover:     new RealTurnoverRepository(),
};

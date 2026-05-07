import { MockEmployeeRepository } from "./EmployeeRepository";
import { MockAttendanceRepository } from "./AttendanceRepository";
import { MockProductivityRepository } from "./ProductivityRepository";
import { MockOvertimeRepository } from "./OvertimeRepository";
import { MockPerformanceRepository } from "./PerformanceRepository";
import { MockTurnoverRepository } from "./TurnoverRepository";
import { MockTimeBankRepository } from "./TimeBankRepository";
import type { Repositories } from "../interfaces/types";

export const mockRepositories: Repositories = {
  employees:    new MockEmployeeRepository(),
  attendance:   new MockAttendanceRepository(),
  productivity: new MockProductivityRepository(),
  overtime:     new MockOvertimeRepository(),
  performance:  new MockPerformanceRepository(),
  turnover:     new MockTurnoverRepository(),
  timeBank:     new MockTimeBankRepository(),
};

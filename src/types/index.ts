export type AlertLevel = "green" | "yellow" | "red";
export type TrendDirection = "up" | "down" | "stable";

export interface KpiSummary {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  unit: string;
  previousValue: number;
  target: number;
  trend: TrendDirection;
  trendValue: number;
  alert?: AlertLevel;
  sub?: string;
  higherIsBetter: boolean;
  description?: string;
}

export interface KpiChartPoint {
  month: string;  // "2024-01"
  value: number;
}

export interface KpiChartItem {
  id: string;
  label: string;
  formattedValue: string;
  alert?: AlertLevel;
  chart?: {
    data: KpiChartPoint[];
    color?: string;
    unit?: string;  // appended to tooltip value: "" | "%" | "h" etc.
  };
}

export interface SplitCardItem {
  label: string;
  value: string;
  showLabel?: boolean;
  subtitle?: string;
  sub?: string;
  alert?: AlertLevel;
  tooltip?: string;
}

export interface SplitCardData {
  title: string;
  items: SplitCardItem[];
}

export interface TeamLeader {
  id: string;
  name: string;
  email: string;
  teamId: string;
  teamName: string;
  role: "tl" | "director";
  avatarUrl?: string;
}

export interface Employee {
  id: string;
  teamId: string;
  name: string;
  role: string;
  roleLevel: number;
  department: string;
  email: string;
  hireDate: string;
  tenureMonths: number;
  salaryUsd: number;
  managerId: string | null;
  managerChain: string;
  avatarUrl?: string;
  status: "active" | "on_leave" | "terminated" | "open";
}

export interface EmployeeMetrics {
  presenceRate: number | null;   // 0–1
  onTimeRate: number | null;     // 0–1
  avgPerfScore: number | null;   // 0–100
  totalOtHours: number | null;
  bhCompPct: number | null;      // 0–100, from time_bank
}

export interface EmployeeWithMetrics extends Employee {
  metrics: EmployeeMetrics;
}

export interface PerformanceRecord {
  employeeId: string;
  period: string; // "YYYY-MM"
  score: number; // 0-100
  goalsCompleted: number;
  goalsTotal: number;
  rating: "exceeds" | "meets" | "below";
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  status: "present" | "absent" | "late" | "on_leave";
  hoursWorked: number;
}

export interface ProductivityRecord {
  employeeId: string;
  period: string; // "YYYY-MM"
  tasksCompleted: number;
  tasksPending: number;
  deliveryOnTimeRate: number; // 0-1
  qualityScore: number; // 0-100
}

export interface OvertimeRecord {
  employeeId: string;
  period: string; // "YYYY-MM"
  regularHours: number;
  overtimeHours: number;
  overtimeCostUsd: number;
}

export interface TurnoverRecord {
  employeeId: string;
  terminationDate: string;
  reason: "voluntary" | "involuntary" | "retirement";
  teamId: string;
  managerChain: string;
}

export interface TimeBankRecord {
  employeeId: string;
  period: string; // "YYYY-MM"
  hoursAccrued: number;      // overtime hours credited to the bank
  hoursCompensated: number;  // hours taken as compensatory time off
}

export interface TeamAnalytics {
  teamId: string;
  period: string;
  headcount: number;
  avgTenureMonths: number;
  totalSalaryCostUsd: number;
  avgSalaryUsd: number;
  turnoverRate: number; // 0-1
  avgPerformanceScore: number;
  avgAttendanceRate: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

import type {
  TeamLeader,
  Employee,
  PerformanceRecord,
  AttendanceRecord,
  ProductivityRecord,
  OvertimeRecord,
  TurnoverRecord,
  TimeBankRecord,
} from "@/types";

// ----- Team Leaders (mock logins) -----
export const TEAM_LEADERS: TeamLeader[] = [
  { id: "tl-001", name: "Sarah Chen",    email: "sarah.chen@company.com",    teamId: "team-alpha",   teamName: "Alpha Squad", role: "tl" },
  { id: "tl-002", name: "Marcus Rivera", email: "marcus.rivera@company.com", teamId: "team-beta",    teamName: "Beta Force",  role: "tl" },
  { id: "tl-003", name: "Priya Nair",    email: "priya.nair@company.com",    teamId: "team-gamma",   teamName: "Gamma Unit",  role: "tl" },
  { id: "dir-001", name: "Ana Sousa",    email: "ana.sousa@company.com",     teamId: "team-all",     teamName: "Direção",     role: "director" },
];

// Password for all mock users: "password123"
export const MOCK_PASSWORDS: Record<string, string> = {
  "sarah.chen@company.com":    "password123",
  "marcus.rivera@company.com": "password123",
  "priya.nair@company.com":    "password123",
  "ana.sousa@company.com":     "password123",
};

// ----- Employees -----
// tenureMonths reference date ≈ 2024-04; team leaders reference ≈ 2026-05
export const EMPLOYEES: Employee[] = [
  // ── Team Leaders (dir-001 manages them; visible only to director) ───────────
  { id: "tl-001", teamId: "team-leadership", name: "Sarah Chen",    role: "Team Leader", roleLevel: 0, department: "Engineering", email: "sarah.chen@company.com",    hireDate: "2018-03-01", tenureMonths: 97,  salaryUsd: 13000, managerId: "dir-001", managerChain: "ana.sousa@company.com",                                         status: "active",   sex: "F", birthYear: 1984, pcd: false },
  { id: "tl-002", teamId: "team-leadership", name: "Marcus Rivera", role: "Team Leader", roleLevel: 0, department: "Product",     email: "marcus.rivera@company.com", hireDate: "2018-09-01", tenureMonths: 91,  salaryUsd: 13500, managerId: "dir-001", managerChain: "ana.sousa@company.com",                                         status: "active",   sex: "M", birthYear: 1982, pcd: false },
  { id: "tl-003", teamId: "team-leadership", name: "Priya Nair",    role: "Team Leader", roleLevel: 0, department: "Engineering", email: "priya.nair@company.com",    hireDate: "2017-11-01", tenureMonths: 101, salaryUsd: 14000, managerId: "dir-001", managerChain: "ana.sousa@company.com",                                         status: "active",   sex: "F", birthYear: 1980, pcd: false },

  // ── Alpha Squad (managed by tl-001 → dir-001) ────────────────────────────────
  { id: "emp-001", teamId: "team-alpha", name: "Jordan Lee",      role: "Senior Engineer", roleLevel: 2, department: "Engineering", email: "jordan.lee@company.com",      hireDate: "2021-03-15", tenureMonths: 37, salaryUsd: 9500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "M", birthYear: 1990, pcd: false },
  { id: "emp-002", teamId: "team-alpha", name: "Aisha Patel",     role: "Engineer",        roleLevel: 3, department: "Engineering", email: "aisha.patel@company.com",     hireDate: "2022-07-01", tenureMonths: 21, salaryUsd: 7200,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "F", birthYear: 1994, pcd: false },
  { id: "emp-003", teamId: "team-alpha", name: "Tom Nguyen",      role: "Engineer",        roleLevel: 3, department: "Engineering", email: "tom.nguyen@company.com",      hireDate: "2023-01-10", tenureMonths: 15, salaryUsd: 6800,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "M", birthYear: 1996, pcd: false },
  { id: "emp-004", teamId: "team-alpha", name: "Clara Osei",      role: "QA Engineer",     roleLevel: 3, department: "Engineering", email: "clara.osei@company.com",      hireDate: "2022-09-20", tenureMonths: 19, salaryUsd: 6500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "on_leave", sex: "F", birthYear: 1991, pcd: false },
  { id: "emp-005", teamId: "team-alpha", name: "Ben Walsh",       role: "Junior Engineer", roleLevel: 4, department: "Engineering", email: "ben.walsh@company.com",       hireDate: "2023-06-01", tenureMonths: 10, salaryUsd: 5500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "M", birthYear: 1999, pcd: false },
  { id: "emp-014", teamId: "team-alpha", name: "Rafael Santos",   role: "Senior QA Engineer", roleLevel: 2, department: "Engineering", email: "rafael.santos@company.com",   hireDate: "2023-07-15", tenureMonths: 8,  salaryUsd: 8800,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "M", birthYear: 1988, pcd: false },
  { id: "emp-015", teamId: "team-alpha", name: "Isabel Ferreira", role: "Junior Engineer", roleLevel: 4, department: "Engineering", email: "isabel.ferreira@company.com", hireDate: "2024-02-15", tenureMonths: 2,  salaryUsd: 5800,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "F", birthYear: 2001, pcd: true  },
  { id: "emp-016", teamId: "team-alpha", name: "Kwame Asante",    role: "Data Engineer",   roleLevel: 3, department: "Engineering", email: "kwame.asante@company.com",    hireDate: "2023-10-01", tenureMonths: 6,  salaryUsd: 7500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active",   sex: "M", birthYear: 1993, pcd: false },

  // ── Beta Force (managed by tl-002 → dir-001) ─────────────────────────────────
  { id: "emp-006", teamId: "team-beta", name: "Nina Russo",    role: "Product Manager",  roleLevel: 2, department: "Product",    email: "nina.russo@company.com",   hireDate: "2020-11-01", tenureMonths: 41, salaryUsd: 10500, managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1985, pcd: false },
  { id: "emp-007", teamId: "team-beta", name: "Sam Kim",       role: "Designer",         roleLevel: 3, department: "Design",     email: "sam.kim@company.com",      hireDate: "2021-08-15", tenureMonths: 32, salaryUsd: 8000,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1992, pcd: false },
  { id: "emp-008", teamId: "team-beta", name: "Diego Torres",  role: "Data Analyst",     roleLevel: 3, department: "Analytics",  email: "diego.torres@company.com", hireDate: "2022-02-01", tenureMonths: 26, salaryUsd: 7800,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1991, pcd: true  },
  { id: "emp-009", teamId: "team-beta", name: "Mei Wong",      role: "Engineer",         roleLevel: 3, department: "Engineering", email: "mei.wong@company.com",    hireDate: "2023-03-01", tenureMonths: 13, salaryUsd: 7000,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1997, pcd: false },
  { id: "emp-017", teamId: "team-beta", name: "Zara Mohammed",  role: "UX Designer",     roleLevel: 3, department: "Design",     email: "zara.mohammed@company.com", hireDate: "2023-08-15", tenureMonths: 7,  salaryUsd: 7800,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1995, pcd: false },
  { id: "emp-018", teamId: "team-beta", name: "Lucas Barbosa",  role: "Product Analyst",  roleLevel: 4, department: "Product",    email: "lucas.barbosa@company.com", hireDate: "2024-01-10", tenureMonths: 3,  salaryUsd: 6200,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1997, pcd: false },
  { id: "emp-019", teamId: "team-beta", name: "Anna Kowalski",  role: "Data Engineer",    roleLevel: 3, department: "Analytics",  email: "anna.kowalski@company.com", hireDate: "2023-11-20", tenureMonths: 4,  salaryUsd: 8100,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1990, pcd: false },
  { id: "emp-020", teamId: "team-beta", name: "Raj Patel",      role: "Senior Designer",  roleLevel: 2, department: "Design",     email: "raj.patel@company.com",     hireDate: "2022-11-15", tenureMonths: 17, salaryUsd: 9200,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1987, pcd: true  },

  // ── Gamma Unit (managed by tl-003 → dir-001) ─────────────────────────────────
  { id: "emp-010", teamId: "team-gamma", name: "Liam Burke",        role: "Lead Engineer",  roleLevel: 1, department: "Engineering",    email: "liam.burke@company.com",    hireDate: "2019-05-01", tenureMonths: 59, salaryUsd: 11000, managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1986, pcd: false },
  { id: "emp-011", teamId: "team-gamma", name: "Fatima Al-Hassan",  role: "Engineer",       roleLevel: 3, department: "Engineering",    email: "fatima.al@company.com",     hireDate: "2021-01-10", tenureMonths: 39, salaryUsd: 8500,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1990, pcd: true  },
  { id: "emp-012", teamId: "team-gamma", name: "Oscar Mendes",      role: "DevOps",         roleLevel: 3, department: "Infrastructure", email: "oscar.mendes@company.com",  hireDate: "2022-06-15", tenureMonths: 22, salaryUsd: 8200,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1993, pcd: false },
  { id: "emp-013", teamId: "team-gamma", name: "Hana Suzuki",       role: "Engineer",       roleLevel: 3, department: "Engineering",    email: "hana.suzuki@company.com",   hireDate: "2023-08-01", tenureMonths: 8,  salaryUsd: 6800,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1998, pcd: false },
  { id: "emp-021", teamId: "team-gamma", name: "Sofia Andrade",     role: "Cloud Engineer", roleLevel: 3, department: "Infrastructure", email: "sofia.andrade@company.com", hireDate: "2023-09-01", tenureMonths: 7,  salaryUsd: 8600,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 1992, pcd: false },
  { id: "emp-022", teamId: "team-gamma", name: "Ibrahim Al-Farsi",  role: "Engineer",       roleLevel: 3, department: "Engineering",    email: "ibrahim.al@company.com",    hireDate: "2024-03-15", tenureMonths: 1,  salaryUsd: 7000,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "M", birthYear: 1996, pcd: false },
  { id: "emp-023", teamId: "team-gamma", name: "Yuki Tanaka",       role: "Junior DevOps",  roleLevel: 4, department: "Infrastructure", email: "yuki.tanaka@company.com",   hireDate: "2024-05-20", tenureMonths: 1,  salaryUsd: 5900,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active", sex: "F", birthYear: 2000, pcd: false },

  // ── Open positions (no person — hierarchy data only; no metrics generated) ───
  { id: "pos-001", teamId: "team-alpha", name: "", role: "Senior Engineer",  roleLevel: 2, department: "Engineering",    email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com",   status: "open", openedDate: "2023-09-15" },
  { id: "pos-002", teamId: "team-beta",  name: "", role: "Data Scientist",   roleLevel: 3, department: "Analytics",     email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "open", openedDate: "2023-12-01" },
  { id: "pos-003", teamId: "team-gamma", name: "", role: "DevOps Engineer",  roleLevel: 3, department: "Infrastructure", email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com",   status: "open", openedDate: "2024-03-01" },
];

// 12-month period window ending 2024-06 — drives all monthly metric records
const PERIODS = [
  "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
];

// Active/on-leave employees only (open positions have no metrics)
const ACTIVE_EMPLOYEES = EMPLOYEES.filter((e) => e.status !== "open");

// Filter periods to those on or after the employee's hire date (more realistic)
function periodsFor(emp: Employee): string[] {
  const hireMonth = emp.hireDate.substring(0, 7);
  return PERIODS.filter((p) => p >= hireMonth);
}

export const PERFORMANCE_RECORDS: PerformanceRecord[] = ACTIVE_EMPLOYEES.flatMap((emp) =>
  periodsFor(emp).map((period) => ({
    employeeId: emp.id,
    period,
    score: Math.floor(55 + Math.random() * 45),
    goalsCompleted: Math.floor(3 + Math.random() * 6),
    goalsTotal: 8,
    rating: (Math.random() > 0.65 ? "exceeds" : Math.random() > 0.35 ? "meets" : "below") as PerformanceRecord["rating"],
  }))
);

export const ATTENDANCE_RECORDS: AttendanceRecord[] = ACTIVE_EMPLOYEES.flatMap((emp) => {
  // Specific patterns for a few employees to trigger alerts
  const fixedPresentDays =
    emp.id === "emp-002" ? 15 :  // Aisha: 50% → yellow
    emp.id === "emp-003" ? 12 :  // Tom: 40% → red
    null;
  const records: AttendanceRecord[] = [];
  for (let d = 1; d <= 30; d++) {
    let status: AttendanceRecord["status"];
    let hoursWorked: number;
    if (fixedPresentDays !== null) {
      const present = d <= fixedPresentDays;
      status = present ? "present" : "absent";
      hoursWorked = present ? 8 : 0;
    } else {
      const rand = Math.random();
      status = rand > 0.9 ? "absent" : rand > 0.85 ? "late" : rand > 0.8 ? "on_leave" : "present";
      hoursWorked = rand > 0.9 ? 0 : rand > 0.85 ? 6 : 8;
    }
    records.push({
      employeeId: emp.id,
      date: `2024-06-${String(d).padStart(2, "0")}`,
      status,
      hoursWorked,
    });
  }
  return records;
});

export const PRODUCTIVITY_RECORDS: ProductivityRecord[] = ACTIVE_EMPLOYEES.flatMap((emp) =>
  periodsFor(emp).map((period) => ({
    employeeId: emp.id,
    period,
    tasksCompleted: Math.floor(8 + Math.random() * 22),
    tasksPending: Math.floor(1 + Math.random() * 6),
    deliveryOnTimeRate: 0.55 + Math.random() * 0.45,
    qualityScore: Math.floor(60 + Math.random() * 40),
  }))
);

export const OVERTIME_RECORDS: OvertimeRecord[] = ACTIVE_EMPLOYEES.flatMap((emp) =>
  periodsFor(emp).map((period) => {
    const ot = Math.floor(Math.random() * 18);
    return {
      employeeId: emp.id,
      period,
      regularHours: 160,
      overtimeHours: ot,
      overtimeCostUsd: ot * (emp.salaryUsd / 160) * 1.5,
    };
  })
);

const BH_COMP_RATES: Record<string, number> = {
  "emp-001": 0.70, "emp-002": 0.40, "emp-003": 0.85, "emp-004": 0.20,
  "emp-005": 0.60, "emp-006": 0.75, "emp-007": 0.55, "emp-008": 0.90,
  "emp-009": 0.45, "emp-010": 0.65, "emp-011": 0.80, "emp-012": 0.35,
  "emp-013": 0.50, "emp-014": 0.65, "emp-015": 0.50, "emp-016": 0.75,
  "emp-017": 0.45, "emp-018": 0.80, "emp-019": 0.60, "emp-020": 0.70,
  "emp-021": 0.55, "emp-022": 0.40, "emp-023": 0.85,
  "tl-001": 0.60, "tl-002": 0.55, "tl-003": 0.70,
};

export const TIME_BANK_RECORDS: TimeBankRecord[] = OVERTIME_RECORDS.map((o) => {
  const rate = BH_COMP_RATES[o.employeeId] ?? 0.5;
  return {
    employeeId: o.employeeId,
    period: o.period,
    hoursAccrued: o.overtimeHours,
    hoursCompensated: Math.min(Math.round(o.overtimeHours * rate), o.overtimeHours),
  };
});

// Turnover — intentionally uneven distribution to produce a realistic chart with spikes and quiet months
export const TURNOVER_RECORDS: TurnoverRecord[] = [
  // Jul 2023 — quiet (1)
  { employeeId: "emp-ex-001", teamId: "team-beta",  terminationDate: "2023-07-19", reason: "voluntary",   managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  // Aug 2023 — spike (3)
  { employeeId: "emp-ex-002", teamId: "team-alpha", terminationDate: "2023-08-04", reason: "voluntary",   managerChain: "sarah.chen@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-003", teamId: "team-gamma", terminationDate: "2023-08-14", reason: "involuntary", managerChain: "priya.nair@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-004", teamId: "team-beta",  terminationDate: "2023-08-28", reason: "voluntary",   managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  // Sep 2023 — empty
  // Oct 2023 — moderate (2)
  { employeeId: "emp-ex-005", teamId: "team-alpha", terminationDate: "2023-10-11", reason: "voluntary",   managerChain: "sarah.chen@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-006", teamId: "team-gamma", terminationDate: "2023-10-22", reason: "retirement",  managerChain: "priya.nair@company.com,ana.sousa@company.com" },
  // Nov 2023 — quiet (1)
  { employeeId: "emp-ex-007", teamId: "team-beta",  terminationDate: "2023-11-07", reason: "involuntary", managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  // Dec 2023 — empty
  // Jan 2024 — empty
  // Feb 2024 — spike (3)
  { employeeId: "emp-ex-008", teamId: "team-alpha", terminationDate: "2024-02-06", reason: "voluntary",   managerChain: "sarah.chen@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-009", teamId: "team-gamma", terminationDate: "2024-02-13", reason: "voluntary",   managerChain: "priya.nair@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-010", teamId: "team-beta",  terminationDate: "2024-02-27", reason: "involuntary", managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  // Mar 2024 — quiet (1)
  { employeeId: "emp-ex-011", teamId: "team-gamma", terminationDate: "2024-03-15", reason: "voluntary",   managerChain: "priya.nair@company.com,ana.sousa@company.com" },
  // Apr 2024 — empty
  // May 2024 — moderate (2)
  { employeeId: "emp-ex-012", teamId: "team-alpha", terminationDate: "2024-05-08", reason: "voluntary",   managerChain: "sarah.chen@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-013", teamId: "team-beta",  terminationDate: "2024-05-21", reason: "involuntary", managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  // Jun 2024 — empty
];

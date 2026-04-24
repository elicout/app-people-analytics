import type {
  TeamLeader,
  Employee,
  PerformanceRecord,
  AttendanceRecord,
  ProductivityRecord,
  OvertimeRecord,
  TurnoverRecord,
} from "@/types";

// ----- Team Leaders (mock logins) -----
export const TEAM_LEADERS: TeamLeader[] = [
  {
    id: "tl-001",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    teamId: "team-alpha",
    teamName: "Alpha Squad",
    role: "tl",
  },
  {
    id: "tl-002",
    name: "Marcus Rivera",
    email: "marcus.rivera@company.com",
    teamId: "team-beta",
    teamName: "Beta Force",
    role: "tl",
  },
  {
    id: "tl-003",
    name: "Priya Nair",
    email: "priya.nair@company.com",
    teamId: "team-gamma",
    teamName: "Gamma Unit",
    role: "tl",
  },
  {
    id: "dir-001",
    name: "Ana Sousa",
    email: "ana.sousa@company.com",
    teamId: "team-all",
    teamName: "Direção",
    role: "director",
  },
];

// Password for all mock users: "password123"
export const MOCK_PASSWORDS: Record<string, string> = {
  "sarah.chen@company.com": "password123",
  "marcus.rivera@company.com": "password123",
  "priya.nair@company.com": "password123",
  "ana.sousa@company.com": "password123",
};

// ----- Employees -----
export const EMPLOYEES: Employee[] = [
  // Team Leaders (visible to director only; teamId="team-leadership" keeps them off org tree nodes)
  { id: "tl-001", teamId: "team-leadership", name: "Sarah Chen",    role: "Team Leader", roleLevel: 0, department: "Engineering", email: "sarah.chen@company.com",    hireDate: "2018-03-01", tenureMonths: 97,  salaryUsd: 13000, managerId: "dir-001", managerChain: "ana.sousa@company.com", status: "active" },
  { id: "tl-002", teamId: "team-leadership", name: "Marcus Rivera", role: "Team Leader", roleLevel: 0, department: "Product",     email: "marcus.rivera@company.com", hireDate: "2018-09-01", tenureMonths: 91,  salaryUsd: 13500, managerId: "dir-001", managerChain: "ana.sousa@company.com", status: "active" },
  { id: "tl-003", teamId: "team-leadership", name: "Priya Nair",    role: "Team Leader", roleLevel: 0, department: "Engineering", email: "priya.nair@company.com",    hireDate: "2017-11-01", tenureMonths: 101, salaryUsd: 14000, managerId: "dir-001", managerChain: "ana.sousa@company.com", status: "active" },

  // Alpha Squad (tl-001 → dir-001)
  { id: "emp-001", teamId: "team-alpha", name: "Jordan Lee",      role: "Senior Engineer", roleLevel: 2, department: "Engineering", email: "jordan.lee@company.com",      hireDate: "2021-03-15", tenureMonths: 37, salaryUsd: 9500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-002", teamId: "team-alpha", name: "Aisha Patel",     role: "Engineer",        roleLevel: 3, department: "Engineering", email: "aisha.patel@company.com",     hireDate: "2022-07-01", tenureMonths: 21, salaryUsd: 7200,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-003", teamId: "team-alpha", name: "Tom Nguyen",      role: "Engineer",        roleLevel: 3, department: "Engineering", email: "tom.nguyen@company.com",      hireDate: "2023-01-10", tenureMonths: 15, salaryUsd: 6800,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-004", teamId: "team-alpha", name: "Clara Osei",      role: "QA Engineer",     roleLevel: 3, department: "Engineering", email: "clara.osei@company.com",      hireDate: "2022-09-20", tenureMonths: 19, salaryUsd: 6500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "on_leave" },
  { id: "emp-005", teamId: "team-alpha", name: "Ben Walsh",       role: "Junior Engineer", roleLevel: 4, department: "Engineering", email: "ben.walsh@company.com",       hireDate: "2023-06-01", tenureMonths: 10, salaryUsd: 5500,  managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com", status: "active" },

  // Beta Force (tl-002 → dir-001)
  { id: "emp-006", teamId: "team-beta", name: "Nina Russo",    role: "Product Manager", roleLevel: 2, department: "Product",    email: "nina.russo@company.com",   hireDate: "2020-11-01", tenureMonths: 41, salaryUsd: 10500, managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-007", teamId: "team-beta", name: "Sam Kim",       role: "Designer",        roleLevel: 3, department: "Design",     email: "sam.kim@company.com",      hireDate: "2021-08-15", tenureMonths: 32, salaryUsd: 8000,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-008", teamId: "team-beta", name: "Diego Torres",  role: "Data Analyst",    roleLevel: 3, department: "Analytics",  email: "diego.torres@company.com", hireDate: "2022-02-01", tenureMonths: 26, salaryUsd: 7800,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-009", teamId: "team-beta", name: "Mei Wong",      role: "Engineer",        roleLevel: 3, department: "Engineering", email: "mei.wong@company.com",     hireDate: "2023-03-01", tenureMonths: 13, salaryUsd: 7000,  managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "active" },

  // Gamma Unit (tl-003 → dir-001)
  { id: "emp-010", teamId: "team-gamma", name: "Liam Burke",       role: "Lead Engineer", roleLevel: 1, department: "Engineering",    email: "liam.burke@company.com",   hireDate: "2019-05-01", tenureMonths: 59, salaryUsd: 11000, managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-011", teamId: "team-gamma", name: "Fatima Al-Hassan", role: "Engineer",      roleLevel: 3, department: "Engineering",    email: "fatima.al@company.com",    hireDate: "2021-01-10", tenureMonths: 39, salaryUsd: 8500,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-012", teamId: "team-gamma", name: "Oscar Mendes",     role: "DevOps",        roleLevel: 3, department: "Infrastructure", email: "oscar.mendes@company.com", hireDate: "2022-06-15", tenureMonths: 22, salaryUsd: 8200,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active" },
  { id: "emp-013", teamId: "team-gamma", name: "Hana Suzuki",      role: "Engineer",      roleLevel: 3, department: "Engineering",    email: "hana.suzuki@company.com",  hireDate: "2023-08-01", tenureMonths: 8,  salaryUsd: 6800,  managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com", status: "active" },

  // Open positions (no person — hierarchy data only, no metrics records generated)
  { id: "pos-001", teamId: "team-alpha", name: "", role: "Senior Engineer",  roleLevel: 2, department: "Engineering",    email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-001", managerChain: "sarah.chen@company.com,ana.sousa@company.com",   status: "open" },
  { id: "pos-002", teamId: "team-beta",  name: "", role: "Data Scientist",   roleLevel: 3, department: "Analytics",     email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-002", managerChain: "marcus.rivera@company.com,ana.sousa@company.com", status: "open" },
  { id: "pos-003", teamId: "team-gamma", name: "", role: "DevOps Engineer",  roleLevel: 3, department: "Infrastructure", email: "", hireDate: "2099-01-01", tenureMonths: 0, salaryUsd: 0, managerId: "tl-003", managerChain: "priya.nair@company.com,ana.sousa@company.com",   status: "open" },
];

const PERIODS = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];

export const PERFORMANCE_RECORDS: PerformanceRecord[] = EMPLOYEES.filter(emp => emp.status !== "open").flatMap((emp) =>
  PERIODS.map((period) => ({
    employeeId: emp.id,
    period,
    score: Math.floor(60 + Math.random() * 40),
    goalsCompleted: Math.floor(3 + Math.random() * 5),
    goalsTotal: 8,
    rating: (Math.random() > 0.7 ? "exceeds" : Math.random() > 0.3 ? "meets" : "below") as PerformanceRecord["rating"],
  }))
);

export const ATTENDANCE_RECORDS: AttendanceRecord[] = EMPLOYEES.filter(emp => emp.status !== "open").flatMap((emp) => {
  // emp-002 (Aisha): 15/30 = 50% → yellow | emp-003 (Tom): 12/30 = 40% → red
  const fixedPresentDays = emp.id === "emp-002" ? 15 : emp.id === "emp-003" ? 12 : null;
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

export const PRODUCTIVITY_RECORDS: ProductivityRecord[] = EMPLOYEES.filter(emp => emp.status !== "open").flatMap((emp) =>
  PERIODS.map((period) => ({
    employeeId: emp.id,
    period,
    tasksCompleted: Math.floor(10 + Math.random() * 20),
    tasksPending: Math.floor(1 + Math.random() * 5),
    deliveryOnTimeRate: 0.6 + Math.random() * 0.4,
    qualityScore: Math.floor(65 + Math.random() * 35),
  }))
);

export const OVERTIME_RECORDS: OvertimeRecord[] = EMPLOYEES.filter(emp => emp.status !== "open").flatMap((emp) =>
  PERIODS.map((period) => {
    const ot = Math.floor(Math.random() * 15);
    return {
      employeeId: emp.id,
      period,
      regularHours: 160,
      overtimeHours: ot,
      overtimeCostUsd: ot * (emp.salaryUsd / 160) * 1.5,
    };
  })
);

export const TURNOVER_RECORDS: TurnoverRecord[] = [
  { employeeId: "emp-ex-001", teamId: "team-alpha", terminationDate: "2024-02-15", reason: "voluntary",   managerChain: "sarah.chen@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-002", teamId: "team-beta",  terminationDate: "2024-04-01", reason: "involuntary", managerChain: "marcus.rivera@company.com,ana.sousa@company.com" },
  { employeeId: "emp-ex-003", teamId: "team-gamma", terminationDate: "2024-05-20", reason: "voluntary",   managerChain: "priya.nair@company.com,ana.sousa@company.com" },
];

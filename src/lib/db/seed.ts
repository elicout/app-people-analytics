import { Database } from "duckdb-async";
import {
  EMPLOYEES,
  PERFORMANCE_RECORDS,
  ATTENDANCE_RECORDS,
  PRODUCTIVITY_RECORDS,
  OVERTIME_RECORDS,
  TURNOVER_RECORDS,
  TIME_BANK_RECORDS,
} from "@/data/mock";

export async function seedDatabase(db: Database): Promise<void> {
  const conn = await db.connect();

  await conn.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR PRIMARY KEY,
      team_id VARCHAR NOT NULL,
      name VARCHAR,
      role VARCHAR,
      role_level INTEGER,
      department VARCHAR,
      email VARCHAR,
      hire_date DATE,
      tenure_months INTEGER,
      salary_usd DECIMAL(10,2),
      manager_id VARCHAR,
      status VARCHAR,
      manager_chain VARCHAR
    );

    CREATE TABLE IF NOT EXISTS performance (
      employee_id VARCHAR,
      period VARCHAR,
      score INTEGER,
      goals_completed INTEGER,
      goals_total INTEGER,
      rating VARCHAR,
      PRIMARY KEY (employee_id, period)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      employee_id VARCHAR,
      date DATE,
      status VARCHAR,
      hours_worked DECIMAL(4,2),
      PRIMARY KEY (employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS productivity (
      employee_id VARCHAR,
      period VARCHAR,
      tasks_completed INTEGER,
      tasks_pending INTEGER,
      delivery_on_time_rate DECIMAL(4,3),
      quality_score INTEGER,
      PRIMARY KEY (employee_id, period)
    );

    CREATE TABLE IF NOT EXISTS overtime (
      employee_id VARCHAR,
      period VARCHAR,
      regular_hours INTEGER,
      overtime_hours INTEGER,
      overtime_cost_usd DECIMAL(10,2),
      PRIMARY KEY (employee_id, period)
    );

    CREATE TABLE IF NOT EXISTS turnover (
      employee_id VARCHAR PRIMARY KEY,
      team_id VARCHAR,
      termination_date DATE,
      reason VARCHAR,
      manager_chain VARCHAR
    );

    CREATE TABLE IF NOT EXISTS time_bank (
      employee_id VARCHAR,
      period VARCHAR,
      hours_accrued DECIMAL(6,2),
      hours_compensated DECIMAL(6,2),
      PRIMARY KEY (employee_id, period)
    );
  `);

  // Seed only if empty
  const empCount = await conn.all("SELECT COUNT(*) as c FROM employees");
  if ((empCount[0] as { c: number }).c > 0) {
    await conn.close();
    return;
  }

  const empStmt = await conn.prepare(
    "INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const e of EMPLOYEES) {
    await empStmt.run(e.id, e.teamId, e.name, e.role, e.roleLevel, e.department, e.email, e.hireDate, e.tenureMonths, e.salaryUsd, e.managerId, e.status, e.managerChain);
  }
  await empStmt.finalize();

  const perfStmt = await conn.prepare(
    "INSERT INTO performance VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const p of PERFORMANCE_RECORDS) {
    await perfStmt.run(p.employeeId, p.period, p.score, p.goalsCompleted, p.goalsTotal, p.rating);
  }
  await perfStmt.finalize();

  const attStmt = await conn.prepare(
    "INSERT INTO attendance VALUES (?, ?, ?, ?)"
  );
  for (const a of ATTENDANCE_RECORDS) {
    await attStmt.run(a.employeeId, a.date, a.status, a.hoursWorked);
  }
  await attStmt.finalize();

  const prodStmt = await conn.prepare(
    "INSERT INTO productivity VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const p of PRODUCTIVITY_RECORDS) {
    await prodStmt.run(p.employeeId, p.period, p.tasksCompleted, p.tasksPending, p.deliveryOnTimeRate, p.qualityScore);
  }
  await prodStmt.finalize();

  const otStmt = await conn.prepare(
    "INSERT INTO overtime VALUES (?, ?, ?, ?, ?)"
  );
  for (const o of OVERTIME_RECORDS) {
    await otStmt.run(o.employeeId, o.period, o.regularHours, o.overtimeHours, o.overtimeCostUsd);
  }
  await otStmt.finalize();

  const tvStmt = await conn.prepare(
    "INSERT INTO turnover VALUES (?, ?, ?, ?, ?)"
  );
  for (const t of TURNOVER_RECORDS) {
    await tvStmt.run(t.employeeId, t.teamId, t.terminationDate, t.reason, t.managerChain);
  }
  await tvStmt.finalize();

  const tbStmt = await conn.prepare(
    "INSERT INTO time_bank VALUES (?, ?, ?, ?)"
  );
  for (const tb of TIME_BANK_RECORDS) {
    await tbStmt.run(tb.employeeId, tb.period, tb.hoursAccrued, tb.hoursCompensated);
  }
  await tbStmt.finalize();

  await conn.close();
}

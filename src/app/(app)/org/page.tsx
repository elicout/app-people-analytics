import { auth } from "@/lib/auth";
import { query } from "@/lib/db/client";
import OrgFlow from "@/components/org/OrgFlow";
import { TEAM_LEADERS } from "@/data/mock";
import type { EmployeeWithMetrics, TeamLeader } from "@/types";

interface EmpRow {
  id: string;
  team_id: string;
  name: string;
  role: string;
  role_level: number;
  department: string;
  email: string;
  hire_date: string;
  tenure_months: number;
  salary_usd: number;
  manager_id: string | null;
  status: string;
}

export default async function OrgPage() {
  const session = await auth();
  const ue = session!.user.email!;
  const isDirector = session!.user.role === "director";

  const tlRecords: TeamLeader[] = TEAM_LEADERS.filter(l => l.role === "tl");
  const currentUser = TEAM_LEADERS.find(l => l.teamId === session!.user.teamId)!;

  // Employees visible to this user via RLS; exclude team-leadership records
  // (TLs appear as root nodes in the org tree, not as employee nodes)
  const rp = [ue, ue];

  const [employees, attRows, prodRows, perfRows, otRows] = await Promise.all([
    query<EmpRow>(
      `SELECT id, team_id, name, role, role_level, department, email,
       CAST(hire_date AS VARCHAR) AS hire_date, tenure_months, salary_usd, manager_id, status
       FROM employees
       WHERE CONTAINS(manager_chain,?) AND email!=? AND status != 'terminated'
         AND team_id != 'team-leadership'
       ORDER BY role_level, role`,
      rp
    ),
    query<{ employee_id: string; presence_rate: number }>(
      `SELECT a.employee_id,
       ROUND(COUNT(CASE WHEN a.status='present' THEN 1 END) * 1.0 / NULLIF(COUNT(*),0), 3) AS presence_rate
       FROM attendance a JOIN employees e ON e.id = a.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY a.employee_id`,
      rp
    ),
    query<{ employee_id: string; on_time_rate: number }>(
      `SELECT p.employee_id, ROUND(AVG(p.delivery_on_time_rate), 3) AS on_time_rate
       FROM productivity p JOIN employees e ON e.id = p.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY p.employee_id`,
      rp
    ),
    query<{ employee_id: string; avg_score: number }>(
      `SELECT p.employee_id, ROUND(AVG(p.score), 1) AS avg_score
       FROM performance p JOIN employees e ON e.id = p.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
       GROUP BY p.employee_id`,
      rp
    ),
    query<{ employee_id: string; total_ot_hours: number }>(
      `SELECT o.employee_id, SUM(o.overtime_hours) AS total_ot_hours
       FROM overtime o JOIN employees e ON e.id = o.employee_id
       WHERE CONTAINS(e.manager_chain,?) AND e.email!=? AND e.team_id != 'team-leadership'
         AND o.period = (SELECT MAX(period) FROM overtime)
       GROUP BY o.employee_id`,
      rp
    ),
  ]);

  const attMap  = new Map(attRows.map(r  => [r.employee_id, r.presence_rate]));
  const prodMap = new Map(prodRows.map(r => [r.employee_id, r.on_time_rate]));
  const perfMap = new Map(perfRows.map(r => [r.employee_id, r.avg_score]));
  const otMap   = new Map(otRows.map(r   => [r.employee_id, r.total_ot_hours]));

  const employeesWithMetrics: EmployeeWithMetrics[] = employees.map(e => ({
    id: e.id,
    teamId: e.team_id,
    name: e.name,
    role: e.role,
    roleLevel: e.role_level,
    department: e.department,
    email: e.email,
    hireDate: e.hire_date,
    tenureMonths: e.tenure_months,
    salaryUsd: e.salary_usd,
    managerId: e.manager_id,
    managerChain: "",
    status: e.status as EmployeeWithMetrics["status"],
    metrics: {
      presenceRate:  attMap.get(e.id)  != null ? Number(attMap.get(e.id))  : null,
      onTimeRate:    prodMap.get(e.id) != null ? Number(prodMap.get(e.id)) : null,
      avgPerfScore:  perfMap.get(e.id) != null ? Number(perfMap.get(e.id)) : null,
      totalOtHours:  otMap.get(e.id)   != null ? Number(otMap.get(e.id))   : null,
    },
  }));

  return (
    <div className="px-8 py-6 h-full flex flex-col">
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Organograma</h1>
        <p className="text-sm text-gray-400 mt-0.5">Clique no líder para expandir ou recolher a equipa</p>
      </div>
      <div className="flex-1 min-h-0">
        <OrgFlow
          employees={employeesWithMetrics}
          teamLeaders={isDirector ? tlRecords : [currentUser]}
          director={isDirector ? currentUser : undefined}
        />
      </div>
    </div>
  );
}

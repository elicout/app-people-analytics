import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/db";
import OrgFlow from "@/components/org/OrgFlow";
import { TEAM_LEADERS } from "@/data/mock";
import type { EmployeeWithMetrics, TeamLeader } from "@/types";

export default async function OrgPage() {
  const session = await auth();
  const ue = session!.user.email!;
  const isDirector = session!.user.role === "director";

  const tlRecords: TeamLeader[] = TEAM_LEADERS.filter(l => l.role === "tl");
  const currentUser = TEAM_LEADERS.find(l => l.teamId === session!.user.teamId)!;

  const { employees, attendance, productivity, performance, overtime } = getRepositories();

  // Employees visible to this user via RLS; exclude team-leadership records
  // (TLs appear as root nodes in the org tree, not as employee nodes)
  const [empList, attRows, prodRows, perfRows, otRows] = await Promise.all([
    employees.getForOrg(ue),
    attendance.getPerEmployee(ue),
    productivity.getPerEmployee(ue),
    performance.getPerEmployee(ue),
    overtime.getPerEmployee(ue),
  ]);

  const attMap  = new Map(attRows.map(r  => [r.employee_id, r.presence_rate]));
  const prodMap = new Map(prodRows.map(r => [r.employee_id, r.on_time_rate]));
  const perfMap = new Map(perfRows.map(r => [r.employee_id, r.avg_score]));
  const otMap   = new Map(otRows.map(r   => [r.employee_id, r.total_ot_hours]));

  const employeesWithMetrics: EmployeeWithMetrics[] = empList.map(e => ({
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
        <p className="text-sm text-gray-400 mt-0.5">Clique no líder para expandir ou recolher a equipe</p>
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

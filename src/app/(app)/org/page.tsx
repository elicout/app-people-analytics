import { auth } from "@/lib/auth";
import { query } from "@/lib/db/client";
import OrgTree from "@/components/org/OrgTree";

interface EmpRow {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  hire_date: string;
  tenure_months: number;
  salary_usd: number;
  status: string;
}

export default async function OrgPage() {
  const session = await auth();
  const tid = session!.user.teamId;

  const employees = await query<EmpRow>(
    `SELECT id, name, role, department, email, CAST(hire_date AS VARCHAR) as hire_date, tenure_months, salary_usd, status
     FROM employees WHERE team_id = ? AND status != 'terminated' ORDER BY name`,
    [tid]
  );

  const leader = {
    name: session!.user.name ?? "Team Leader",
    role: "Team Leader",
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Org Tree</h1>
      <p className="text-sm text-gray-400 mb-8">{session!.user.teamName}</p>
      <OrgTree leader={leader} employees={employees} />
    </div>
  );
}

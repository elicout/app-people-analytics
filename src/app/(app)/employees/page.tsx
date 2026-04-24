import { auth } from "@/lib/auth";
import { query } from "@/lib/db/client";

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

export default async function EmployeesPage() {
  const session = await auth();
  const ue = session!.user.email!;

  const employees = await query<EmpRow>(
    `SELECT id, name, role, department, email, CAST(hire_date AS VARCHAR) as hire_date, tenure_months, salary_usd, status
     FROM employees WHERE CONTAINS(manager_chain,?) AND email!=? AND status != 'terminated' ORDER BY name`,
    [ue, ue]
  );

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-400 mt-0.5">{Number(employees.length)} team members</p>
        </div>

        {/* Download button — visual only for now */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg cursor-not-allowed opacity-60"
          title="Export coming soon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Name", "Role", "Department", "Email", "Hire Date", "Tenure", "Salary / mo", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                <td className="px-4 py-3 text-gray-500">{emp.department}</td>
                <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                <td className="px-4 py-3 text-gray-500">{String(emp.hire_date).slice(0, 10)}</td>
                <td className="px-4 py-3 text-gray-500">{emp.tenure_months}mo</td>
                <td className="px-4 py-3 text-gray-600">${Number(emp.salary_usd).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {emp.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/db";
import EmployeesTable from "@/components/employees/EmployeesTable";

export default async function EmployeesPage() {
  const session = await auth();
  const ue = session!.user.email!;

  const { employees, timeBank } = getRepositories();
  const [employeeList, timeBankRows] = await Promise.all([
    employees.getList(ue),
    timeBank.getPerEmployee(ue),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Colaboradores</h1>
          <p className="text-sm text-gray-400 mt-0.5">{employeeList.length} membros na equipa</p>
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

      <EmployeesTable employees={employeeList} timeBankRows={timeBankRows} />
    </div>
  );
}

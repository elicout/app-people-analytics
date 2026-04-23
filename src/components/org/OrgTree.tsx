"use client";

import { useState } from "react";

interface Employee {
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

interface OrgTreeProps {
  leader: { name: string; role: string };
  employees: Employee[];
}

function EmployeeCard({ emp }: { emp: Employee }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-56 bg-white rounded-xl border border-gray-100 shadow-lg p-4 pointer-events-none">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
        <span className="text-sm font-semibold text-blue-600">
          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
      <p className="text-xs text-gray-400">{emp.department}</p>
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
        <p className="text-xs text-gray-400">{emp.email}</p>
        <p className="text-xs text-gray-400">Hired {String(emp.hire_date).slice(0, 10)}</p>
        <p className="text-xs text-gray-400">{emp.tenure_months} months tenure</p>
      </div>
      <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        emp.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
      }`}>
        {emp.status.replace("_", " ")}
      </span>
    </div>
  );
}

function EmployeeNode({ emp }: { emp: Employee }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      {/* Connector line */}
      <div className="w-px h-6 bg-gray-200" />

      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && <EmployeeCard emp={emp} />}

        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-default w-64">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-gray-500">
              {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
            <p className="text-xs text-gray-400 truncate">{emp.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrgTree({ leader, employees }: OrgTreeProps) {
  return (
    <div className="flex flex-col items-center gap-0">
      {/* Team Leader node */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl w-64">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold">
            {leader.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold">{leader.name}</p>
          <p className="text-xs text-blue-200">{leader.role}</p>
        </div>
      </div>

      {/* Vertical connector from leader to row */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Horizontal bar */}
      {employees.length > 1 && (
        <div
          className="h-px bg-gray-200"
          style={{ width: `${employees.length * 280}px`, maxWidth: "100%" }}
        />
      )}

      {/* Employee nodes */}
      <div className="flex gap-4 flex-wrap justify-center">
        {employees.map((emp) => (
          <EmployeeNode key={emp.id} emp={emp} />
        ))}
      </div>
    </div>
  );
}

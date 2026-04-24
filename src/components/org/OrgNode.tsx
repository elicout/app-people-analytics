"use client";

import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import type { AlertLevel, EmployeeWithMetrics } from "@/types";

const alertRing: Record<AlertLevel, string> = {
  green: "ring-2 ring-emerald-400",
  yellow: "ring-2 ring-amber-400",
  red: "ring-2 ring-red-500",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

// ── Tooltip card ──────────────────────────────────────────────

function EmployeeCard({ emp }: { emp: EmployeeWithMetrics }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-white rounded-xl border border-gray-100 shadow-lg p-4 pointer-events-none">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
        <span className="text-sm font-semibold text-blue-600">{initials(emp.name)}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
      <p className="text-xs text-gray-400">{emp.department}</p>
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
        <p className="text-xs text-gray-400">{emp.email}</p>
        <p className="text-xs text-gray-400">Contratado {emp.hireDate.slice(0, 10)}</p>
        <p className="text-xs text-gray-400">{emp.tenureMonths} meses de empresa</p>
      </div>
      <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        emp.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
      }`}>
        {emp.status.replace("_", " ")}
      </span>
    </div>
  );
}

// ── TL node ───────────────────────────────────────────────────

function TLCard({ name, email, teamName, roleLabel, employeeCount }: { name: string; email: string; teamName: string; roleLabel: string; employeeCount: number }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-white rounded-xl border border-gray-100 shadow-lg p-4 pointer-events-none">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
        <span className="text-sm font-semibold text-blue-600">{initials(name)}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{roleLabel}</p>
      <p className="text-xs text-gray-400">{teamName}</p>
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
        <p className="text-xs text-gray-400">{email}</p>
        <p className="text-xs text-gray-400">{employeeCount} liderados</p>
      </div>
    </div>
  );
}

export type TLNodeData = Record<string, unknown> & {
  name: string;
  email: string;
  teamName: string;
  teamId: string;
  roleLabel: string;
  employeeCount: number;
  isCollapsed: boolean;
  collapsible: boolean;
  onToggleCollapse: (teamId: string) => void;
};

export function TLNode({ data }: { data: TLNodeData }) {
  const { name, email, teamName, teamId, roleLabel, employeeCount, isCollapsed, collapsible, onToggleCollapse } = data;
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && <TLCard name={name} email={email} teamName={teamName} employeeCount={employeeCount} roleLabel={roleLabel} />}
        <div
          className={`flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl w-64 transition-colors select-none ${collapsible ? "cursor-pointer hover:bg-blue-700" : "cursor-default"}`}
          onClick={() => collapsible && onToggleCollapse(teamId)}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold">{initials(name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-blue-200 truncate">{teamName}</p>
          </div>
          {collapsible && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-blue-200">{employeeCount}</span>
              {isCollapsed
                ? <ChevronRightIcon className="w-4 h-4 text-blue-200" />
                : <ChevronDownIcon className="w-4 h-4 text-blue-200" />}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </>
  );
}

// ── Employee node ─────────────────────────────────────────────

export type EmpNodeData = Record<string, unknown> & {
  employee: EmployeeWithMetrics;
  alertLevel: AlertLevel | null;
};

export function EmployeeNode({ data }: { data: EmpNodeData }) {
  const { employee: emp, alertLevel } = data;
  const [hovered, setHovered] = useState(false);
  const ring = alertLevel ? alertRing[alertLevel] : "";

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && <EmployeeCard emp={emp} />}
        <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-default w-64 ${ring}`}>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-gray-500">{initials(emp.name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
            <p className="text-xs text-gray-400 truncate">{emp.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}

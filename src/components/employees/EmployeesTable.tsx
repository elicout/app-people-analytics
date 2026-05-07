"use client";

import { useState } from "react";
import { getAlertLevel, alertColorClasses } from "@/lib/utils";
import { KPI_RULES } from "@/lib/constants";
import type { EmployeeListRow, TimeBankEmployeeRow } from "@/lib/db";

type View = "cadastral" | "jornada";

interface Props {
  employees: EmployeeListRow[];
  timeBankRows: TimeBankEmployeeRow[];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Hover card (mirrors EmployeeCard in OrgNode.tsx) ─────────────────────────

interface CardPos { x: number; y: number }

function HoverCard({ emp, pos }: { emp: EmployeeListRow; pos: CardPos }) {
  return (
    <div
      className="fixed z-50 w-56 bg-white rounded-xl border border-gray-100 shadow-lg p-4 pointer-events-none"
      style={{ left: pos.x + 20, top: pos.y - 20 }}
    >
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
        <span className="text-sm font-semibold text-blue-600">{initials(emp.name)}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{emp.role}</p>
      <p className="text-xs text-gray-400">{emp.department}</p>
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
        <p className="text-xs text-gray-400">{emp.email}</p>
        <p className="text-xs text-gray-400">Contratado {String(emp.hire_date).slice(0, 10)}</p>
        <p className="text-xs text-gray-400">{emp.tenure_months} meses de empresa</p>
      </div>
      <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        emp.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
      }`}>
        {emp.status.replace("_", " ")}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeesTable({ employees, timeBankRows }: Props) {
  const [view, setView] = useState<View>("cadastral");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<CardPos>({ x: 0, y: 0 });

  const tbMap = new Map(timeBankRows.map((r) => [r.employee_id, r]));
  const hoveredEmp = hoveredId ? employees.find((e) => e.id === hoveredId) ?? null : null;

  return (
    <div>
      {/* ── Toggle ── */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {(["cadastral", "jornada"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === v
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {v === "cadastral" ? "Dados Cadastrais" : "Jornada"}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 h-14">
              {view === "cadastral"
                ? ["Nome", "Cargo", "Departamento", "Email", "Admissão", "Tempo de Casa", "Salário / mês", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 pb-3 align-bottom text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))
                : ["Nome", "Cargo", "Status", "HE Realizadas", "BH a Compensar", "BH Comp %"].map((h) => (
                    <th key={h} className="text-left px-4 pb-3 align-bottom text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))
              }
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp) => {
              const tb = tbMap.get(emp.id);
              return (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 transition-colors cursor-default"
                  onMouseEnter={(e) => {
                    setHoveredId(emp.id);
                    setCardPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => setCardPos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {view === "cadastral" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          emp.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                        }`}>
                          {emp.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{tb ? `${tb.total_accrued}h` : "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{tb ? `${tb.balance}h` : "—"}</td>
                      <td className="px-4 py-3">
                        {tb ? (() => {
                          const level = getAlertLevel(tb.balance_pct, KPI_RULES.bh_comp);
                          const cls = level ? alertColorClasses(level) : { bg: "bg-gray-50", text: "text-gray-600" };
                          return (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls.bg} ${cls.text}`}>
                              {tb.balance_pct.toFixed(1)}%
                            </span>
                          );
                        })() : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Hover card portal ── */}
      {hoveredEmp && <HoverCard emp={hoveredEmp} pos={cardPos} />}
    </div>
  );
}

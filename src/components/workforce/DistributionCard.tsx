"use client";

import { useState } from "react";
import DistributionBar from "@/components/dashboard/DistributionBar";
import type { RoleCount, TeamCount, TenureBandCount } from "@/lib/db/interfaces/types";

const TEAM_LABELS: Record<string, string> = {
  "team-alpha": "Alpha Squad",
  "team-beta":  "Beta Force",
  "team-gamma": "Gamma Unit",
};

type Dimension = "team" | "role" | "tenure";

interface DistributionCardProps {
  roleData:   RoleCount[];
  teamData:   TeamCount[];
  tenureData: TenureBandCount[];
  total:      number;
}

/** Distribution bar card with a tab switcher for three workforce dimensions. */
export default function DistributionCard({ roleData, teamData, tenureData, total }: DistributionCardProps) {
  const [dim, setDim] = useState<Dimension>("team");

  const tabs: { id: Dimension; label: string }[] = [
    { id: "team",   label: "Equipa" },
    { id: "role",   label: "Cargo" },
    { id: "tenure", label: "Tempo de Casa" },
  ];

  const items =
    dim === "team"
      ? teamData.map((r) => ({ label: TEAM_LABELS[r.team_id] ?? r.team_id, count: r.count }))
      : dim === "role"
      ? roleData.map((r) => ({ label: r.role, count: r.count }))
      : tenureData.map((r) => ({ label: r.band, count: r.count }));

  return (
    <div className="rounded-4xl border border-slate-200 bg-white px-6 pt-6 pb-4 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-medium text-gray-600">Distribuição de Colaboradores</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setDim(t.id)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                dim === t.id
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <DistributionBar title="" items={items} total={total} bare barGap={20} />
    </div>
  );
}

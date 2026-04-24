"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Controls, Background, BackgroundVariant, useNodesState, useEdgesState, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TLNode, EmployeeNode, type TLNodeData, type EmpNodeData } from "./OrgNode";
import { getAlertLevel } from "@/lib/utils";
import type { AlertLevel, EmployeeWithMetrics, TeamLeader } from "@/types";

type MetricKey = "presence" | "onTime" | "performance" | "overtime";

const METRIC_CONFIG: Record<MetricKey, {
  label: string;
  getValue: (m: EmployeeWithMetrics["metrics"]) => number | null;
  target: number;
  higherIsBetter: boolean;
}> = {
  presence:    { label: "Presença",         getValue: m => m.presenceRate  !== null ? m.presenceRate  * 100 : null, target: 60,  higherIsBetter: true  },
  onTime:      { label: "Atividade Digital", getValue: m => m.onTimeRate    !== null ? m.onTimeRate    * 100 : null, target: 60,  higherIsBetter: true  },
  performance: { label: "Performance",      getValue: m => m.avgPerfScore,                                           target: 80,  higherIsBetter: true  },
  overtime:    { label: "Horas Extras",     getValue: m => m.totalOtHours,                                          target: 100, higherIsBetter: false },
};

// Must be defined outside the component to avoid re-registration on every render
const nodeTypes = {
  tl: TLNode,
  employee: EmployeeNode,
};

const NODE_W = 256;
const TEAM_GAP = 80;
const ROW_H = 110;

interface OrgFlowProps {
  employees: EmployeeWithMetrics[];
  teamLeaders: TeamLeader[];
  director?: TeamLeader;
}

const COLLAPSE_MS = 200;

export default function OrgFlow({ employees, teamLeaders, director }: OrgFlowProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const [collapsingTeams, setCollapsingTeams] = useState<Set<string>>(new Set());

  // Refs so the stable callback can read current state without re-creating
  const collapsedRef = useRef(collapsedTeams);
  const collapsingRef = useRef(collapsingTeams);
  collapsedRef.current = collapsedTeams;
  collapsingRef.current = collapsingTeams;

  const handleToggleCollapse = useCallback((teamId: string) => {
    if (collapsingRef.current.has(teamId)) return; // Ignore during exit animation
    if (collapsedRef.current.has(teamId)) {
      // Expanding: show nodes immediately (entry animation plays on mount)
      setCollapsedTeams(prev => { const n = new Set(prev); n.delete(teamId); return n; });
    } else {
      // Collapsing: trigger exit animation, then remove nodes after it finishes
      setCollapsingTeams(prev => new Set(prev).add(teamId));
      setTimeout(() => {
        setCollapsedTeams(prev => new Set(prev).add(teamId));
        setCollapsingTeams(prev => { const n = new Set(prev); n.delete(teamId); return n; });
      }, COLLAPSE_MS);
    }
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const computed = useMemo(() => {
    const nextNodes: Node[] = [];
    const nextEdges: Edge[] = [];

    // When a director is present, TL nodes start one row lower
    const tlYOffset = director ? ROW_H : 0;

    // Director root node (centered over all TL columns)
    if (director) {
      const totalWidth = teamLeaders.length * (NODE_W + TEAM_GAP) - TEAM_GAP;
      const dirX = Math.round((totalWidth - NODE_W) / 2);
      nextNodes.push({
        id: director.id,
        type: "tl",
        position: { x: dirX, y: 0 },
        width: NODE_W,
        data: {
          name: director.name,
          email: director.email,
          teamName: director.teamName,
          teamId: director.teamId,
          roleLabel: "Diretora / Diretor",
          employeeCount: teamLeaders.length,
          isCollapsed: false,
          collapsible: false,
          onToggleCollapse: () => {},
        },
        draggable: false,
      });
    }

    teamLeaders.forEach((tl, teamIndex) => {
      const x = teamIndex * (NODE_W + TEAM_GAP);
      const teamEmps = employees
        .filter(e => e.teamId === tl.teamId)
        .sort((a, b) => a.roleLevel - b.roleLevel || a.role.localeCompare(b.role));
      const isCollapsed = collapsedTeams.has(tl.teamId);
      const isCollapsing = collapsingTeams.has(tl.teamId);

      nextNodes.push({
        id: tl.id,
        type: "tl",
        position: { x, y: tlYOffset },
        width: NODE_W,
        data: {
          name: tl.name,
          email: tl.email,
          teamName: tl.teamName,
          teamId: tl.teamId,
          roleLabel: "Team Leader",
          employeeCount: teamEmps.length,
          isCollapsed,
          collapsible: true,
          onToggleCollapse: handleToggleCollapse,
        },
        draggable: false,
      });

      // Edge from director to this TL
      if (director) {
        nextEdges.push({
          id: `e-${director.id}-${tl.id}`,
          source: director.id,
          target: tl.id,
          type: "smoothstep",
          style: { stroke: "#e2e8f0", strokeWidth: 1.5 },
        });
      }

      // Show employees when expanded OR while the exit animation is playing
      if (!isCollapsed || isCollapsing) {
        teamEmps.forEach((emp, empIndex) => {
          const alertLevel: AlertLevel | null = selectedMetric
            ? (() => {
                const cfg = METRIC_CONFIG[selectedMetric];
                const val = cfg.getValue(emp.metrics);
                return val !== null ? getAlertLevel(val, cfg.target, cfg.higherIsBetter) : null;
              })()
            : null;

          nextNodes.push({
            id: emp.id,
            type: "employee",
            position: { x, y: tlYOffset + (empIndex + 1) * ROW_H },
            width: NODE_W,
            data: { employee: emp, alertLevel, isCollapsing },
            draggable: false,
          });

          nextEdges.push({
            id: `e-${tl.id}-${emp.id}`,
            source: tl.id,
            target: emp.id,
            type: "smoothstep",
            style: { stroke: "#e2e8f0", strokeWidth: 1.5 },
          });
        });
      }
    });

    return { nextNodes, nextEdges };
  }, [employees, teamLeaders, director, collapsedTeams, collapsingTeams, selectedMetric, handleToggleCollapse]);

  useEffect(() => {
    setNodes(computed.nextNodes);
    setEdges(computed.nextEdges);
  }, [computed, setNodes, setEdges]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Metric filter bar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-xs text-gray-400 mr-1">Destacar por:</span>
        {(Object.entries(METRIC_CONFIG) as [MetricKey, (typeof METRIC_CONFIG)[MetricKey]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(prev => prev === key ? null : key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetric === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cfg.label}
          </button>
        ))}
        {selectedMetric && (
          <div className="flex items-center gap-3 ml-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Bom</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Atenção</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Crítico</span>
          </div>
        )}
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 min-h-0 rounded-xl border border-gray-100 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesConnectable={false}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#9ca3af" />
        </ReactFlow>
      </div>
    </div>
  );
}

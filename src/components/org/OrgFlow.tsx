"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Controls, Background, BackgroundVariant, Panel, useNodesState, useEdgesState, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, RectangleStackIcon } from "@heroicons/react/24/solid";
import { TLNode, EmployeeNode, OpenPositionNode, type TLNodeData, type EmpNodeData } from "./OrgNode";
import { getAlertLevel } from "@/lib/utils";
import { KPI_RULES, TARGETS, type KpiRule } from "@/lib/constants";
import type { AlertLevel, EmployeeWithMetrics, TeamLeader } from "@/types";

type MetricKey = "presence" | "onTime" | "bh_comp";

const METRIC_CONFIG: Record<MetricKey, {
  label: string;
  getValue: (m: EmployeeWithMetrics["metrics"]) => number | null;
  format: (v: number) => string;
  rule: KpiRule | undefined;
  target: number | undefined;
}> = {
  presence: { label: "Presença",         getValue: m => m.presenceRate !== null ? m.presenceRate * 100 : null, format: v => `${Math.round(v)}%`, rule: KPI_RULES.presence, target: TARGETS.PRESENCE_PCT     },
  onTime:   { label: "Atividade Digital", getValue: m => m.onTimeRate   !== null ? m.onTimeRate   * 100 : null, format: v => `${Math.round(v)}%`, rule: KPI_RULES.activity, target: undefined                 },
  bh_comp:  { label: "BH Compensado",    getValue: m => m.bhCompPct,                                           format: v => `${Math.round(v)}%`, rule: KPI_RULES.bh_comp,  target: TARGETS.BH_COMPENSATED_PCT },
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function alertOrder(level: AlertLevel | null | undefined): number {
  if (level === "red")    return 0;
  if (level === "yellow") return 1;
  if (level === "green")  return 2;
  return 3;
}

// ── Panel KPI config ─────────────────────────────────────────────────────────
// To add a new KPI to the org chart panel, append an entry here.
interface PanelKpi {
  id: string;
  label: string;
  getValue: (emps: EmployeeWithMetrics[]) => number;
  format?: (v: number) => string;
  filterable?: boolean;
}

const PANEL_KPIS: PanelKpi[] = [
  { id: "headcount", label: "Headcount",       getValue: emps => emps.filter(e => e.status !== "open").length },
  { id: "posicoes",  label: "Posições Abertas", getValue: emps => emps.filter(e => e.status === "open").length, filterable: true },
];

// Must be defined outside the component to avoid re-registration on every render
const nodeTypes = {
  tl: TLNode,
  employee: EmployeeNode,
  open: OpenPositionNode,
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
  const [filterLevels, setFilterLevels] = useState<Set<AlertLevel>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleKpis, setVisibleKpis] = useState<Set<string>>(new Set(PANEL_KPIS.map(k => k.id)));
  const [kpiMenuOpen, setKpiMenuOpen] = useState(false);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());

  // Side panel resize + collapse
  const [panelWidth, setPanelWidth] = useState(256);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const panelWidthRef = useRef(256);
  panelWidthRef.current = panelWidth;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidthRef.current;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      setPanelWidth(Math.min(420, Math.max(180, dragStartWidth.current + delta)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const handleToggleFilterOpen = () => {
    setFilterOpen(prev => {
      if (!prev) {
        setSelectedMetric(null);
        setFilterLevels(new Set());
      }
      return !prev;
    });
  };

  const metricAlertSummary = useMemo(() => {
    const summary = {} as Record<MetricKey, { hasWarning: boolean; hasCritical: boolean }>;
    for (const [key, cfg] of Object.entries(METRIC_CONFIG) as [MetricKey, (typeof METRIC_CONFIG)[MetricKey]][]) {
      let hasWarning = false;
      let hasCritical = false;
      for (const emp of employees.filter(e => e.status !== "open")) {
        const val = cfg.getValue(emp.metrics);
        if (val !== null) {
          const level = getAlertLevel(val, cfg.rule);
          if (level === "yellow") hasWarning = true;
          if (level === "red") hasCritical = true;
        }
      }
      summary[key] = { hasWarning, hasCritical };
    }
    return summary;
  }, [employees]);
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
        .sort((a, b) => {
          if (a.status === "open" && b.status !== "open") return 1;
          if (a.status !== "open" && b.status === "open") return -1;
          return a.roleLevel - b.roleLevel || a.role.localeCompare(b.role);
        });
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
        let visibleIndex = 0;
        for (const emp of teamEmps) {
          const isOpen = emp.status === "open";

          if (filterOpen && !isOpen) continue;

          // Open positions are never metric-coloured
          const alertLevel: AlertLevel | null | undefined = (selectedMetric && !isOpen)
            ? (() => {
                const cfg = METRIC_CONFIG[selectedMetric];
                const val = cfg.getValue(emp.metrics);
                return val !== null ? getAlertLevel(val, cfg.rule) : null;
              })()
            : null;

          if (filterLevels.size > 0 && (alertLevel == null || !filterLevels.has(alertLevel))) continue;

          nextNodes.push({
            id: emp.id,
            type: isOpen ? "open" : "employee",
            position: { x, y: tlYOffset + (visibleIndex + 1) * ROW_H },
            width: NODE_W,
            data: { employee: emp, alertLevel, isCollapsing },
            draggable: false,
          });

          nextEdges.push({
            id: `e-${tl.id}-${emp.id}`,
            source: tl.id,
            target: emp.id,
            type: "smoothstep",
            style: isOpen
              ? { stroke: "#d1d5db", strokeWidth: 1.5, strokeDasharray: "5 5" }
              : { stroke: "#e2e8f0", strokeWidth: 1.5 },
          });

          visibleIndex++;
        }
      }
    });

    return { nextNodes, nextEdges };
  }, [employees, teamLeaders, director, collapsedTeams, collapsingTeams, selectedMetric, filterLevels, filterOpen, handleToggleCollapse]);

  useEffect(() => {
    setNodes(computed.nextNodes);
    setEdges(computed.nextEdges);
  }, [computed, setNodes, setEdges]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Metric filter bar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-xs text-gray-400 mr-1">Destacar por:</span>
        {(Object.entries(METRIC_CONFIG) as [MetricKey, (typeof METRIC_CONFIG)[MetricKey]][]).map(([key, cfg]) => {
          const { hasWarning, hasCritical } = metricAlertSummary[key] ?? {};
          const isSelected = selectedMetric === key;
          return (
            <button
              key={key}
              onClick={() => {
                const next = selectedMetric === key ? null : key;
                setSelectedMetric(next);
                setFilterLevels(new Set());
                if (next !== null) setPanelCollapsed(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cfg.label}
              {(hasWarning || hasCritical) && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background:
                      hasWarning && hasCritical
                        ? "linear-gradient(to right, #fbbf24 50%, #ef4444 50%)"
                        : hasWarning ? "#fbbf24" : "#ef4444",
                  }}
                />
              )}
            </button>
          );
        })}
        {selectedMetric && (
          <div className="flex items-center gap-2 ml-3 text-xs">
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Bom
            </span>
            <button
              onClick={() => setFilterLevels(prev => { const n = new Set(prev); n.has("yellow") ? n.delete("yellow") : n.add("yellow"); return n; })}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
                filterLevels.has("yellow")
                  ? "bg-amber-50 text-amber-600 font-semibold ring-1 ring-amber-200"
                  : "text-gray-400 hover:text-amber-500"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Atenção
            </button>
            <button
              onClick={() => setFilterLevels(prev => { const n = new Set(prev); n.has("red") ? n.delete("red") : n.add("red"); return n; })}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
                filterLevels.has("red")
                  ? "bg-red-50 text-red-600 font-semibold ring-1 ring-red-200"
                  : "text-gray-400 hover:text-red-500"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Crítico
            </button>
          </div>
        )}
      </div>

      {/* Canvas + side panel */}
      <div className="flex-1 min-h-0 flex">
        {/* React Flow canvas */}
        <div className="flex-1 min-w-0 rounded-xl border border-gray-100 overflow-hidden">
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
            <Panel position="top-left">
              <div className="flex flex-col gap-2 min-w-[125px]">
                {/* KPI selector button */}
                <div className="relative">
                  <button
                    onClick={() => setKpiMenuOpen(prev => !prev)}
                    className="w-full rounded-3xl bg-white border border-gray-100 shadow-sm px-4 py-2 flex items-center justify-between gap-2 text-xs font-medium text-gray-400 hover:border-gray-200 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <RectangleStackIcon className="w-3.5 h-3.5 shrink-0" />
                      KPIs
                    </span>
                    <ChevronDownIcon className={`w-3 h-3 shrink-0 transition-transform duration-200 ${kpiMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {kpiMenuOpen && (
                    <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-2xl border border-gray-100 shadow-md py-1.5 z-10">
                      {PANEL_KPIS.map(kpi => (
                        <label key={kpi.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={visibleKpis.has(kpi.id)}
                            onChange={() => setVisibleKpis(prev => {
                              const n = new Set(prev);
                              n.has(kpi.id) ? n.delete(kpi.id) : n.add(kpi.id);
                              return n;
                            })}
                            className="rounded"
                          />
                          {kpi.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visible KPI cards */}
                {PANEL_KPIS.filter(k => visibleKpis.has(k.id)).map(kpi => {
                  const value = kpi.getValue(employees);
                  const isActive = kpi.filterable && filterOpen;
                  const Tag = kpi.filterable ? "button" : "div";
                  return (
                    <Tag
                      key={kpi.id}
                      {...(kpi.filterable ? { onClick: handleToggleFilterOpen } : {})}
                      className={`w-full text-left rounded-3xl border shadow-sm px-4 py-3 transition-colors ${
                        kpi.filterable ? "cursor-pointer" : ""
                      } ${
                        isActive
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <p className={`text-xs font-medium ${isActive ? "text-blue-200" : "text-gray-400"}`}>{kpi.label}</p>
                      <p className={`text-xl font-bold mt-0.5 ${isActive ? "text-white" : "text-gray-900"}`}>
                        {kpi.format ? kpi.format(value) : value}
                      </p>
                    </Tag>
                  );
                })}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Metric side panel — slides in, collapsible, resizable */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: !selectedMetric ? 0 : panelCollapsed ? 36 : panelWidth,
            marginLeft: selectedMetric ? 12 : 0,
            transition: isDragging ? "none" : "width 300ms ease-in-out, margin-left 300ms ease-in-out",
          }}
        >
          {panelCollapsed ? (
            // Collapsed strip
            <div className="w-9 h-full flex flex-col items-center pt-3 bg-white rounded-xl border border-gray-100">
              <button
                onClick={() => setPanelCollapsed(false)}
                className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                title="Expandir painel"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-full flex">
              {/* Drag handle */}
              <div
                className="w-1.5 shrink-0 cursor-col-resize group"
                onMouseDown={handleDragStart}
              >
                <div className="w-px h-full mx-auto bg-gray-100 group-hover:bg-blue-300 transition-colors" />
              </div>

              {/* Panel content */}
              <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 truncate">
                      {selectedMetric ? METRIC_CONFIG[selectedMetric].label : ""}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">todos os colaboradores</p>
                  </div>
                  <button
                    onClick={() => setPanelCollapsed(true)}
                    className="shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Recolher painel"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable list grouped by TL */}
                <div className="flex-1 overflow-y-auto">
                  {selectedMetric && teamLeaders.map(tl => {
                    const cfg = METRIC_CONFIG[selectedMetric];
                    const teamEmps = employees
                      .filter(e => e.teamId === tl.teamId && e.status !== "open")
                      .map(emp => {
                        const val = cfg.getValue(emp.metrics);
                        const level = val !== null ? getAlertLevel(val, cfg.rule) : null;
                        return { emp, val, level };
                      })
                      .filter(({ level }) => filterLevels.size === 0 || (level != null && filterLevels.has(level)))
                      .sort((a, b) => alertOrder(a.level) - alertOrder(b.level));

                    if (teamEmps.length === 0) return null;

                    return (
                      <div key={tl.id} className="border-b border-gray-50 last:border-b-0">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-white leading-none">{initials(tl.name)}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-600 truncate">{tl.teamName}</p>
                        </div>
                        {teamEmps.map(({ emp, val, level }) => {
                          const badgeClass =
                            level === "red"    ? "bg-red-50 text-red-600"         :
                            level === "yellow" ? "bg-amber-50 text-amber-700"     :
                            level === "green"  ? "bg-emerald-50 text-emerald-700" :
                                                 "bg-gray-50 text-gray-400";

                          const delta = (val !== null && cfg.target !== undefined) ? Math.round(val - cfg.target) : null;
                          const deltaStr = delta === null ? null
                            : delta === 0 ? cfg.format(0)
                            : (delta > 0 ? "+" : "−") + cfg.format(Math.abs(delta));
                          const deltaColor = delta === null ? "" : delta > 0
                            ? "text-emerald-700"
                            : delta < 0
                            ? "text-red-600"
                            : "text-gray-500";

                          return (
                            <div key={emp.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{emp.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">{emp.role}</p>
                              </div>
                              <div className="shrink-0 flex items-baseline gap-1">
                                {/* meta — only shown when a target is defined for this metric */}
                                {cfg.target !== undefined && (
                                  <>
                                    <span className="text-[9px] font-medium text-gray-400">meta</span>
                                    <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{cfg.format(cfg.target)}</span>
                                    <span className="text-gray-200 text-[11px] select-none">|</span>
                                  </>
                                )}
                                {/* real — label outside, colored pill for value */}
                                <span className="text-[9px] font-medium text-gray-400">real</span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${badgeClass}`}>
                                  {val !== null ? cfg.format(val) : "—"}
                                </span>
                                {val !== null && (
                                  <>
                                    <span className="text-gray-200 text-[11px] select-none">|</span>
                                    {/* delta — bare colored text */}
                                    <span className={`text-[11px] font-semibold tabular-nums ${deltaColor}`}>
                                      {deltaStr}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div className="pb-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

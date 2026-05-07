"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiChartItem } from "@/types";
import AlertBadge from "./AlertBadge";

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatMonth(month: string): string {
  const parts = month.split("-");
  const m = parseInt(parts[1] ?? "1", 10);
  return MONTHS_PT[m - 1] ?? month;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number | undefined;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-900">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        {unit ?? ""}
      </p>
    </div>
  );
}

interface Props {
  kpis: KpiChartItem[];
  chartHeight?: number;
  span?: number;
}

export default function KpiChartCard({ kpis, chartHeight = 200 }: Props) {
  const [activeId, setActiveId] = useState(
    () => kpis.find((k) => k.chart)?.id ?? kpis[0]?.id
  );

  const active = kpis.find((k) => k.id === activeId);

  return (
    <div className="rounded-4xl bg-white border border-slate-200 p-4 shadow-xs transition-shadow flex flex-col overflow-hidden">

      {/* KPI tabs */}
      <div className="flex divide-x divide-slate-100 border-b border-slate-100 -mx-4 -mt-4">
        {kpis.map((kpi) => {
          const isActive = kpi.id === activeId;
          const hasChart = Boolean(kpi.chart);

          const content = (
            <>
              <div className="flex items-start justify-between gap-1 mb-1">
                <p className="text-xs font-medium leading-tight text-gray-500">
                  {kpi.label}
                </p>
                {kpi.alert && <AlertBadge level={kpi.alert} />}
              </div>
              <p className="text-3xl font-bold leading-tight text-slate-900">
                {kpi.formattedValue}
              </p>
              {hasChart && (
                <p className={`mt-1 text-[10px] text-gray-400 ${isActive ? "font-bold" : "font-medium"}`}>
                  {isActive ? "▴ Visualizando" : "Histórico disponível"}
                </p>
              )}
            </>
          );

          return hasChart ? (
            <button
              key={kpi.id}
              onClick={() => setActiveId(kpi.id)}
              className={`flex-1 text-left px-3 pt-7 pb-4 first:pl-4 last:pr-4 transition-all ${
                isActive ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              {content}
            </button>
          ) : (
            <div key={kpi.id} className="flex-1 px-3 pt-7 pb-4 first:pl-4 last:pr-4">
              {content}
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {active?.chart && (
        <div className="mt-3 px-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={activeId}
              data={active.chart.data.map((d) => ({
                value: d.value,
                label: formatMonth(d.month),
              }))}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false} //{ stroke: "#e2e8f0", strokeWidth: 1 }
                tickLine={false}
                padding={{ left: 16, right: 16 }}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} unit={active.chart?.unit} />
                )}
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={active.chart.color ?? "#000000"}
                //stroke={active.chart.color ?? "#1d4ed8"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: active.chart.color ?? "#000000" }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}

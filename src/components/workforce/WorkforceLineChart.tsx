"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { KpiChartPoint } from "@/types";

interface LineConfig {
  color?:           string;
  strokeDasharray?: string;
}

interface WorkforceLineChartProps {
  hcData:             KpiChartPoint[];
  hiresData:          KpiChartPoint[];
  openPositionsData:  KpiChartPoint[];
  title?:             string;
  height?:            number;
  hcLine?:            LineConfig;
  hiresLine?:         LineConfig;
  openPositionsLine?: LineConfig;
}

type SeriesKey = "headcount" | "admissoes" | "posicoes";

function shortMonth(month: string): string {
  const m = parseInt(month.substring(5, 7), 10);
  return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][m - 1] ?? month;
}

/** Multi-line Recharts chart showing headcount, monthly admissions, and open positions. Legend items are clickable to toggle each series. */
export default function WorkforceLineChart({
  hcData, hiresData, openPositionsData, title, height = 220,
  hcLine            = { color: "#000000" },
  hiresLine         = { color: "#15803d", strokeDasharray: "4 2" },
  openPositionsLine = { color: "#b45309", strokeDasharray: "6 3" },
}: WorkforceLineChartProps) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  function toggle(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const data = hcData.map((pt, i) => ({
    month: pt.month,
    headcount: pt.value,
    admissoes: hiresData[i]?.value ?? 0,
    posicoes:  openPositionsData[i]?.value ?? 0,
  }));

  const series: { key: SeriesKey; label: string; config: LineConfig }[] = [
    { key: "headcount", label: "Headcount",       config: hcLine            },
    { key: "admissoes", label: "Admissões",        config: hiresLine         },
    { key: "posicoes",  label: "Posições Abertas", config: openPositionsLine },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        {title && <p className="text-sm font-medium text-gray-600">{title}</p>}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 ml-auto">
          {series.map(({ key, label, config }) => {
            const isHidden = hidden.has(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  isHidden
                    ? "text-gray-400"
                    : "bg-white text-gray-900 shadow-xs"
                }`}
              >
                <svg width="16" height="8" className={isHidden ? "opacity-30" : ""}>
                  <line
                    x1="0" y1="4" x2="16" y2="4"
                    stroke={config.color}
                    strokeWidth="2"
                    strokeDasharray={config.strokeDasharray}
                  />
                </svg>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            tickFormatter={shortMonth}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            labelFormatter={(label: unknown) => shortMonth(String(label))}
          />
          {series.map(({ key, label, config }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={config.color}
              strokeWidth={2}
              strokeDasharray={config.strokeDasharray}
              dot={false}
              activeDot={{ r: 4 }}
              hide={hidden.has(key)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

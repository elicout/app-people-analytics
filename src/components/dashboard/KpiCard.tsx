import { ArrowUpRightIcon, ArrowDownRightIcon, MinusIcon } from "@heroicons/react/24/solid";
import { KpiSummary } from "@/types";
import { trendColorClass } from "@/lib/utils";
import AlertBadge from "./AlertBadge";

export default function KpiCard({ kpi }: { kpi: KpiSummary }) {
  const trendColor = trendColorClass(kpi.trend, kpi.higherIsBetter);
  const TrendIcon =
    kpi.trend === "up" ? ArrowUpRightIcon : kpi.trend === "down" ? ArrowDownRightIcon : MinusIcon;
  const isPercent = kpi.unit === "%";

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{kpi.formattedValue}</p>
        </div>
        <AlertBadge level={kpi.alert} />
      </div>

      <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span>
          {kpi.trendValue > 0 ? "+" : ""}
          {isPercent ? kpi.trendValue.toFixed(1) : Math.round(kpi.trendValue)}
          {isPercent ? " p.p." : ""}
        </span>
        <span className="ml-1 font-normal text-slate-400">vs. m</span>
      </div>

      {kpi.target > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Meta: {isPercent ? `${kpi.target.toFixed(1)}%` : kpi.target.toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}

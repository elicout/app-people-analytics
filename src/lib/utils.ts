import { AlertLevel, TrendDirection } from "@/types";
import { TREND_STABLE_DELTA, type KpiRule } from "@/lib/constants";

export function trendDir(current: number, previous: number): TrendDirection {
  const diff = current - previous;
  if (Math.abs(diff) < TREND_STABLE_DELTA) return "stable";
  return diff > 0 ? "up" : "down";
}

/** Returns the alert level for a value given an explicit KPI rule.
 *  Returns undefined when no rule is provided — callers should treat that as "no alert". */
export function getAlertLevel(value: number, rule: KpiRule | undefined): AlertLevel | undefined {
  if (!rule) return undefined;
  if (rule.higherIsBetter) {
    if (value < rule.red)    return "red";
    if (value < rule.yellow) return "yellow";
    return "green";
  }
  if (value > rule.red)    return "red";
  if (value > rule.yellow) return "yellow";
  return "green";
}

export function alertColorClasses(alert: AlertLevel) {
  const map = {
    green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    yellow: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };
  return map[alert];
}

export function trendColorClass(direction: TrendDirection, higherIsBetter: boolean): string {
  if (direction === "stable") return "text-slate-500";
  const positive =
    (direction === "up" && higherIsBetter) || (direction === "down" && !higherIsBetter);
  return positive ? "text-emerald-600" : "text-red-600";
}

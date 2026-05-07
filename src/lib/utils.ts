import { AlertLevel, TrendDirection } from "@/types";
import { ALERT } from "@/lib/constants";

export function trendDir(current: number, previous: number): TrendDirection {
  const diff = current - previous;
  if (Math.abs(diff) < ALERT.TREND_STABLE_DELTA) return "stable";
  return diff > 0 ? "up" : "down";
}

export function getAlertLevel(
  value: number,
  target: number,
  higherIsBetter: boolean
): AlertLevel {
  const ratio = value / target;
  if (higherIsBetter) {
    if (ratio >= ALERT.GREEN_RATIO) return "green";
    if (ratio >= ALERT.YELLOW_RATIO) return "yellow";
    return "red";
  }
  if (ratio <= ALERT.LOWER_GREEN_RATIO) return "green";
  if (ratio <= ALERT.LOWER_YELLOW_RATIO) return "yellow";
  return "red";
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

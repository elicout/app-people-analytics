import { AlertLevel } from "@/types";
import { alertColorClasses } from "@/lib/utils";

const labels: Record<AlertLevel, string> = {
  green: "No alvo",
  yellow: "Atenção",
  red: "Crítico",
};

export default function AlertBadge({ level, tooltip }: { level: AlertLevel; tooltip?: string }) {
  const colors = alertColorClasses(level);
  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {labels[level]}
    </span>
  );

  if (!tooltip) return badge;

  return (
    <div className="relative group inline-flex shrink-0">
      {badge}
      <div className="pointer-events-none absolute right-0 bottom-full mb-1.5 z-10 hidden group-hover:block whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-lg">
        {tooltip}
      </div>
    </div>
  );
}

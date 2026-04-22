import { AlertLevel } from "@/types";
import { alertColorClasses } from "@/lib/utils";

const labels: Record<AlertLevel, string> = {
  green: "No alvo",
  yellow: "Atenção",
  red: "Crítico",
};

export default function AlertBadge({ level }: { level: AlertLevel }) {
  const colors = alertColorClasses(level);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {labels[level]}
    </span>
  );
}

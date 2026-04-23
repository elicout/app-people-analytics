import AlertBadge from "./AlertBadge";
import { SplitCardData } from "@/types";

interface Props {
  card: SplitCardData;
  span?: number;
}

export default function SplitCard({ card }: Props) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col">
      <p className="text-sm font-medium text-gray-600">{card.title}</p>
      <div className="flex flex-1 items-end mt-4">
        {card.items.map(({ label, value, showLabel = true, subtitle, sub, alert }) => (
          <div key={label} className="flex-1">
            {subtitle && (
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-medium text-gray-500">{subtitle}</p>
                {alert && <AlertBadge level={alert} />}
              </div>
            )}
            {showLabel && <p className="text-xs text-gray-400 mb-0.5">{label}</p>}
            <p className="text-3xl font-bold text-slate-900 leading-tight">
              {value}
              {sub && <span className="ml-1 text-base font-normal text-slate-400">{sub}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

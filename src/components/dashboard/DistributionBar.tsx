interface DistributionBarProps {
  title: string;
  items: Array<{ label: string; sublabel?: string; count: number; color?: string }>;
  total: number;
  maxBarHeight?: number;
  barGap?: number;
  span?: number | "fill"; // consumed by CardGrid, not used in render
  bare?: boolean; // omits the card shell — use when already inside a card
}

export default function DistributionBar({ title, items, total, maxBarHeight = 112, barGap = 8, bare }: DistributionBarProps) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className={bare ? undefined : "rounded-4xl bg-white border border-slate-200 p-6 shadow-xs"}>
      {title && <p className="mb-4 text-sm font-medium text-gray-600">{title}</p>}
      <div className="flex items-end" style={{ gap: barGap }}>
        {items.map(({ label, sublabel, count, color }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barH = Math.max(4, Math.round((count / max) * maxBarHeight));
          return (
            <div key={label} className="flex flex-col items-center flex-1 group relative">
              <span className="text-[11px] font-bold text-slate-700 mb-1">{count}</span>
              <div
                style={{ height: barH, background: color ?? "#000000" }}
                className="w-full rounded-t opacity-80"
              />
              {/* h-6 is fixed so all columns have the same height below the bar baseline */}
              <div className="text-[9px] text-slate-400 text-center leading-tight h-6 flex items-start justify-center w-full pt-1">
                <span>
                  {label}
                  {sublabel && <><br /><span className="text-[8px]">{sublabel}</span></>}
                </span>
              </div>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

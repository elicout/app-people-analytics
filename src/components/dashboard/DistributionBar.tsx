interface DistributionBarProps {
  title: string;
  items: Array<{ label: string; sublabel?: string; count: number; color?: string }>;
  total: number;
  span?: number | "fill"; // consumed by CardGrid, not used in render
}

export default function DistributionBar({ title, items, total }: DistributionBarProps) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-xl bg-gray-50 p-6 shadow-sx transition-shadow hover:shadow-sm">
      <p className="mb-4 text-sm font-medium text-slate-500">{title}</p>
      <div className="flex gap-2 items-end h-20">
        {items.map(({ label, sublabel, count, color }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barH = Math.max(4, Math.round((count / max) * 56));
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1 group relative">
              <span className="text-[11px] font-bold text-slate-700">{count}</span>
              <div
                style={{ height: barH, background: color ?? "#1e40af" }}
                className="w-full rounded-t opacity-80"
              />
              <span className="text-[9px] text-slate-400 text-center leading-tight">
                {label}
                {sublabel && <><br /><span className="text-[8px]">{sublabel}</span></>}
              </span>
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

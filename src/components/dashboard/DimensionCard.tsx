interface Props {
  title: string;
  items: Array<{ label: string; sublabel?: string; count: number }>;
  span?: number | "fill";
  height?: number;
}

export default function DimensionCard({ title, items, height }: Props) {
  return (
    <div
      className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs"
      style={height ? { height } : undefined}
    >
      <p className="mb-4 text-sm font-medium text-slate-500">{title}</p>
      <div className="flex divide-x divide-slate-200">
        {items.map(({ label, sublabel, count }) => (
          <div key={label} className="flex-1 flex flex-col items-center px-3 first:pl-0 last:pr-0">
            <p className="text-2xl font-bold text-slate-900 mb-2">{count}</p>
            <p className="text-xs text-slate-500 text-center leading-tight">
              {label}
              {sublabel && <><br /><span className="text-[10px] text-slate-400">{sublabel}</span></>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

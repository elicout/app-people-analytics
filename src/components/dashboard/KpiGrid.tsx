import { KpiSummary } from "@/types";
import CardRow from "./CardRow";
import KpiCard from "./KpiCard";

const ROW_SIZE = 4;

export default function KpiGrid({ kpis }: { kpis: KpiSummary[] }) {
  const rows: KpiSummary[][] = [];
  for (let i = 0; i < kpis.length; i += ROW_SIZE) {
    rows.push(kpis.slice(i, i + ROW_SIZE));
  }

  return (
    <div className="space-y-5">
      {rows.map((row, i) => (
        <CardRow key={i}>
          {row.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </CardRow>
      ))}
    </div>
  );
}

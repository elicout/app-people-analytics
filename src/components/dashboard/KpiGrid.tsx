import { KpiSummary } from "@/types";
import KpiCard from "./KpiCard";

export default function KpiGrid({ kpis }: { kpis: KpiSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

import { KpiSummary } from "@/types";
import CardGrid from "./CardGrid";
import KpiCard from "./KpiCard";

export default function KpiGrid({ kpis }: { kpis: KpiSummary[] }) {
  return (
    <CardGrid>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </CardGrid>
  );
}

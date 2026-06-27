import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/db";
import type { KpiSummary, AlertLevel, TrendDirection } from "@/types";
import { CHART_PERIODS } from "@/lib/constants";
import CardRow from "@/components/dashboard/CardRow";
import KpiCard from "@/components/dashboard/KpiCard";
import DistributionBar from "@/components/dashboard/DistributionBar";
import WorkforceLineChart from "@/components/workforce/WorkforceLineChart";
import DistributionCard from "@/components/workforce/DistributionCard";

function kpi(
  id: string, label: string, value: number, formattedValue: string, unit: string,
  trendValue: number, trend: TrendDirection, alert: AlertLevel | undefined,
  higherIsBetter: boolean, target = 0, description?: string
): KpiSummary {
  return { id, label, value, formattedValue, unit, previousValue: value - trendValue, target, trend, trendValue, alert, higherIsBetter, description };
}

function normMonth(m: string): string { return m.substring(0, 7); }

export default async function WorkforcePage() {
  const session = await auth();
  const ue = session!.user.email!;

  const { employees } = getRepositories();

  const [
    hc, salary, openPositions,
    monthlyHires, monthlyHC, monthlyOpenPositions,
    diversity, roleData, teamData, tenureData, ageData,
  ] = await Promise.all([
    employees.getHeadcount(ue),
    employees.getTotalSalary(ue),
    employees.getOpenPositionsCount(ue),
    employees.getMonthlyHires(ue),
    employees.getMonthlyHeadcountCumulative(ue),
    employees.getMonthlyOpenPositions(ue),
    employees.getDiversitySummary(ue),
    employees.getRoleDistribution(ue),
    employees.getTeamDistribution(ue),
    employees.getTenureDistribution(ue),
    employees.getAgeDistribution(ue),
  ]);

  // ── Chart data — align to fixed 12-month window ──────────────────────────────
  const hcByMonth        = new Map(monthlyHC.map((r) => [normMonth(r.month), r.count]));
  const hiresByMonth     = new Map(monthlyHires.map((r) => [normMonth(r.month), r.count]));
  const openPosByMonth   = new Map(monthlyOpenPositions.map((r) => [normMonth(r.month), r.count]));

  let lastHcVal = 0;
  for (const r of monthlyHC) {
    if (normMonth(r.month) <= CHART_PERIODS[0]!) lastHcVal = r.count;
    else break;
  }
  const hcChartData    = CHART_PERIODS.map((p) => {
    if (hcByMonth.has(p)) lastHcVal = hcByMonth.get(p)!;
    return { month: `${p}-01`, value: lastHcVal };
  });
  const hiresChartData = CHART_PERIODS.map((p) => ({ month: `${p}-01`, value: hiresByMonth.get(p) ?? 0 }));

  let lastOpenVal = 0;
  for (const r of monthlyOpenPositions) {
    if (normMonth(r.month) <= CHART_PERIODS[0]!) lastOpenVal = r.count;
    else break;
  }
  const openPositionsChartData = CHART_PERIODS.map((p) => {
    if (openPosByMonth.has(p)) lastOpenVal = openPosByMonth.get(p)!;
    return { month: `${p}-01`, value: lastOpenVal };
  });

  const lastHires = hiresByMonth.get(CHART_PERIODS[CHART_PERIODS.length - 1]!) ?? 0;

  // ── KPI definitions ───────────────────────────────────────────────────────────
  const headcountKpi  = kpi("headcount", "Headcount",        hc,           hc.toLocaleString("pt-BR"), "",   0, "stable", undefined, true);
  const admissoesKpi  = kpi("admissoes", "Admissões",        lastHires,    String(lastHires),          "",   0, "stable", undefined, true, 0, "Admissões no último mês");
  const posicoesKpi   = kpi("posicoes",  "Posições Abertas", openPositions, String(openPositions),    "",   0, "stable", openPositions > 5 ? "yellow" : undefined, false);
  const custoKpi      = kpi("custo",     "Custo Total",      salary,       `R$ ${(salary / 1_000).toFixed(0)}K`, "", 0, "stable", undefined, false);

  const mulheresKpi   = { ...kpi("mulheres", "Mulheres", diversity.female, String(diversity.female), "", 0, "stable", undefined, true), sub: hc > 0 ? `${Math.round((diversity.female / hc) * 100)}%` : "0%" };
  const homensKpi     = { ...kpi("homens",   "Homens",   diversity.male,   String(diversity.male),   "", 0, "stable", undefined, true), sub: hc > 0 ? `${Math.round((diversity.male   / hc) * 100)}%` : "0%" };
  const pcdKpi        = { ...kpi("pcds",     "PCDs",     diversity.pcd,    String(diversity.pcd),    "", 0, "stable", undefined, true), sub: hc > 0 ? `${Math.round((diversity.pcd    / hc) * 100)}%` : "0%" };

  const ageItems = ageData.map((r) => ({ label: r.age_group, count: r.count }));

  return (
    <div className="min-h-full py-6 space-y-6 max-w-5xl mx-auto px-8">

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <CardRow>
        <KpiCard kpi={headcountKpi} />
        <KpiCard kpi={admissoesKpi} />
        <KpiCard kpi={posicoesKpi} />
        <KpiCard kpi={custoKpi} />
      </CardRow>

      {/* ── Dual line chart ───────────────────────────────────────────────── */}
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-xs">
        <WorkforceLineChart title="Evolução — Headcount, Admissões e Posições Abertas" hcData={hcChartData} hiresData={hiresChartData} openPositionsData={openPositionsChartData} height={220} />
      </div>

      {/* ── Distribution switcher ─────────────────────────────────────────── */}
      <DistributionCard
        roleData={roleData}
        teamData={teamData}
        tenureData={tenureData}
        total={hc}
      />

      {/* ── Diversidade ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">Diversidade</p>
        <CardRow>
          <KpiCard kpi={mulheresKpi} />
          <KpiCard kpi={homensKpi} />
          <KpiCard kpi={pcdKpi} />
        </CardRow>
        <DistributionBar
          title="Distribuição Etária"
          items={ageItems}
          total={hc}
          barGap={20}
        />
      </div>

    </div>
  );
}

import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/db";
import { KpiSummary, KpiChartItem, SplitCardData, AlertLevel, TrendDirection } from "@/types";
import { getAlertLevel, trendDir } from "@/lib/utils";
import { TARGETS, GD_CONFIG, MOCK_RATIOS, KPI_RULES, CHART_PERIODS } from "@/lib/constants";
import KpiGrid from "@/components/dashboard/KpiGrid";
import CardGrid from "@/components/dashboard/CardGrid";
import CardRow from "@/components/dashboard/CardRow";
import KpiCard from "@/components/dashboard/KpiCard";
import DistributionBar from "@/components/dashboard/DistributionBar";
import DimensionCard from "@/components/dashboard/DimensionCard";
import SplitCard from "@/components/dashboard/SplitCard";
import KpiChartCard from "@/components/dashboard/KpiChartCard";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

// ─── helpers ─────────────────────────────────────────────────────────────────
function kpi(
  id: string,
  label: string,
  value: number,
  formattedValue: string,
  unit: string,
  trendValue: number,
  trend: TrendDirection,
  alert: AlertLevel | undefined,
  higherIsBetter: boolean,
  target = 0,
  description?: string
): KpiSummary {
  return { id, label, value, formattedValue, unit, previousValue: value - trendValue, target, trend, trendValue, alert, higherIsBetter, description };
}

// ─── sub-components ───────────────────────────────────────────────────────────



function MotivosCard({ items }: { items: Array<[string, number]>; span?: number | "fill" }) {
  const max = Math.max(...items.map(([, v]) => v), 1);
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-xs">
      <p className="mb-10 text-sm font-medium text-slate-500">Principais Motivos de Desligamento</p>
      <div className="space-y-3">
        {items.map(([label, pct]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-40 shrink-0">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gray-700"
                // className="h-1.5 rounded-full bg-blue-700"
                style={{ width: `${(pct / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-8 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await auth();
  const ue = session!.user.email!;  // user email — the RLS key

  const { employees, attendance, productivity, performance, turnover, timeBank } = getRepositories();

  const [
    hc,
    salary,
    monthlyHires,
    presence,
    activity,
    bhSummary,
    roleRows,
    tenureSplit,
    diversity,
    openPositions,
    gdClusters,
    highPerf,
    tvCount,
    monthlyTurnover,
    monthlyHC,
  ] = await Promise.all([
    employees.getHeadcount(ue),
    employees.getTotalSalary(ue),
    employees.getMonthlyHires(ue),
    attendance.getTeamRate(ue),
    productivity.getTeamOnTimeRate(ue),
    timeBank.getSummary(ue),
    employees.getRoleDistribution(ue),
    employees.getTenureSplit(ue),
    employees.getDiversitySummary(ue),
    employees.getOpenPositionsCount(ue),
    performance.getGdClusters(ue),
    performance.getHighPerformersCount(ue),
    turnover.getCount(ue),
    turnover.getMonthlyCount(ue),
    employees.getMonthlyHeadcountCumulative(ue),
  ]);

  // ── derived values ───────────────────────────────────────────────────────────
  const bhComp     = Math.round(bhSummary.balance_pct);
  const bhPending  = bhSummary.balance;
  const otHours    = bhSummary.total_accrued;
  const tvRate     = hc > 0 ? (tvCount / hc) * 100 : 0;
  const leaderT    = Math.round(tenureSplit.leader_tenure ?? 24);
  const nonLeaderT = Math.round(tenureSplit.nonleader_tenure ?? 13);
  const gepCount   = Math.max(1, Math.round(hc * MOCK_RATIOS.GEP_PCT));
  const regretted  = Math.max(1, Math.round(tvCount * MOCK_RATIOS.REGRETTED_PCT));

  // Workforce chart — align cumulative HC and monthly hires to the fixed 12-month window
  // normMonth: strips time portion so DuckDB DATE strings ("2023-07-01") → "2023-07"
  function normMonth(m: string): string { return m.substring(0, 7); }
  const hcByMonth    = new Map(monthlyHC.map((r) => [normMonth(r.month), r.count]));
  const hiresByMonth = new Map(monthlyHires.map((r) => [normMonth(r.month), r.count]));
  const tvByMonth    = new Map(monthlyTurnover.map((r) => [normMonth(r.month), r.count]));

  // Forward-fill HC from the last known value before the chart window starts
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
  const tvDesligData   = CHART_PERIODS.map((p) => ({ month: `${p}-01`, value: tvByMonth.get(p) ?? 0 }));
  const tvRateData     = CHART_PERIODS.map((p) => ({
    month: `${p}-01`,
    value: hc > 0 ? parseFloat(((tvByMonth.get(p) ?? 0) / hc * 100).toFixed(1)) : 0,
  }));

  const lastHires = hiresByMonth.get(CHART_PERIODS[CHART_PERIODS.length - 1]!) ?? 0;

  // GD/GT cluster map
  const gdMap: Record<string, number> = {};
  for (const r of gdClusters) gdMap[r.cluster] = r.count;
  const gdTotal = Object.values(gdMap).reduce((a, b) => a + b, 0) || 1;

  const GD = ["NA", "PA", "CA", "FE", "CE"].map((k, i) => ({
    label: k,
    count: gdMap[k] ?? 0,
    color: GD_CONFIG.COLORS[i]!,
  }));

  const GT = [
    { label: "Orientar", sublabel: "/ Decidir", key: "NA" },
    { label: "Desenvolver", key: "PA" },
    { label: "Engajar", sublabel: "/ Aprimorar", key: "CA" },
    { label: "Talento", key: "FE" },
    { label: "Expertise", sublabel: "/ Sucessor", key: "CE" },
  ].map(({ key, ...rest }, i) => ({
    ...rest,
    count: gdMap[key] ?? 0,
    color: GD_CONFIG.COLORS[i]!,
  }));

  // ── KPI definitions ──────────────────────────────────────────────────────────

  const workforceChartKpis: KpiChartItem[] = [
    {
      id: "headcount",
      label: "Headcount",
      formattedValue: hc.toLocaleString("pt-BR"),
      chart: { data: hcChartData },
    },
    {
      id: "admissoes",
      label: "Admissões",
      formattedValue: String(lastHires),
      chart: { data: hiresChartData },
    },
    {
      id: "posicoes",
      label: "Posições Abertas",
      formattedValue: String(openPositions),
    },
    {
      id: "custo",
      label: "Custo Total",
      formattedValue: `R$ ${(salary / 1_000).toFixed(0)}K`,
    },
  ];

  const workforceKpis: KpiSummary[] = [
    kpi("atividade", "Atividade Digital", activity, `${activity.toFixed(1)}%`, "%", 1.2, "up", getAlertLevel(activity, KPI_RULES.activity), true, 80),
    kpi("presenca", "Presença no Escritório", presence, `${presence.toFixed(1)}%`, "%", -0.5, "down", getAlertLevel(presence, KPI_RULES.presence), true, TARGETS.PRESENCE_PCT),
  ];

  const jornadaCard: SplitCardData = {
    title: "Jornada",
    items: [
      { label: "Saldo Compensado", subtitle: "BH", value: `${bhComp}%`, sub: "compensado", showLabel: false, alert: getAlertLevel(bhComp, KPI_RULES.bh_comp), tooltip: `Meta: ${TARGETS.BH_COMPENSATED_PCT}%` },
      { label: "Horas a Compensar", value: `${bhPending}h`, sub: "à compensar", showLabel: false },
      { label: "Horas Extras Realizadas", subtitle: "HE", value: `${otHours}h`, sub: "realizadas", showLabel: false },
    ],
  };

  const diversidadeKpis: KpiSummary[] = [
    { ...kpi("pcds", "PCDs", diversity.pcd, String(diversity.pcd), "", 0, "stable", "green", true), sub: hc > 0 ? `${Math.round((diversity.pcd / hc) * 100)}%` : "0%" },
    { ...kpi("mulheres", "Mulheres", diversity.female, String(diversity.female), "", 0, "stable", "green", true), sub: hc > 0 ? `${Math.round((diversity.female / hc) * 100)}%` : "0%" },
    { ...kpi("homens", "Homens", diversity.male, String(diversity.male), "", 0, "stable", undefined, true), sub: hc > 0 ? `${Math.round((diversity.male / hc) * 100)}%` : "0%" },
    kpi("tenure-outros", "Tempo de Casa Médio", nonLeaderT, `${nonLeaderT} meses`, "", 0, "stable", undefined, true),
  ];

  const highPerfCard: SplitCardData = {
    title: "High Performers",
    items: [
      { label: "Quantidade", value: String(highPerf)},
      { label: "Abaixo do Mercado", value: String(Math.max(1, Math.round(highPerf * 0.1))), sub: "(25% dos hp)"},
    ],
  };

  const performanceKpis: KpiSummary[] = [
    kpi("gep", "GEP", gepCount, `${gepCount}`, "", 0, "stable", undefined, false),
    kpi("gptw", "GPTW", 90, "90", "", 2, "up", undefined, true, TARGETS.GPTW_SCORE),
  ];

  const turnoverKpis: KpiSummary[] = [
    kpi("turnover-rate", "Turnover", tvRate, `${tvRate.toFixed(1)}%`, "%", -1, "down", undefined, false, TARGETS.TURNOVER_RATE_PCT),
    kpi("desligamentos", "Desligamentos", tvCount, String(tvCount), "", -10, "down", undefined, false),
    kpi("regretted-rate", "Turnover Regretted", hc > 0 ? (regretted / hc) * 100 : 0, `${hc > 0 ? ((regretted / hc) * 100).toFixed(1) : 0}%`, "%", -1, "down", undefined, false, TARGETS.REGRETTED_RATE_PCT),
    kpi("deslig-regretted", "Desligamentos Regretted", regretted, String(regretted), "", 0, "stable", regretted > 3 ? "red" : "yellow", false),
  ];

  // Regretted turnover is still ratio-derived (no "regretted" flag in DB yet)
  // REFACTOR: add a regretted boolean to turnover table when data model allows it
  const mockRegRates  = CHART_PERIODS.map((p) => parseFloat(((tvByMonth.get(p) ?? 0) / Math.max(hc, 1) * 0.5 * 100).toFixed(1)));
  const mockRegCounts = CHART_PERIODS.map((p) => Math.round((tvByMonth.get(p) ?? 0) * MOCK_RATIOS.REGRETTED_PCT));

  const turnoverChartKpis: KpiChartItem[] = [
    {
      id: "turnover-rate",
      label: "Turnover",
      formattedValue: `${tvRate.toFixed(1)}%`,
      chart: { data: tvRateData, unit: "%" },
    },
    {
      id: "desligamentos",
      label: "Desligamentos",
      formattedValue: String(tvCount),
      chart: { data: tvDesligData },
    },
  ];

  const turnoverRegrettedChartKpis: KpiChartItem[] = [
    {
      id: "regretted-rate",
      label: "Turnover Regretted",
      formattedValue: `${hc > 0 ? ((regretted / hc) * 100).toFixed(1) : 0}%`,
      chart: { data: CHART_PERIODS.map((p, i) => ({ month: `${p}-01`, value: mockRegRates[i]! })), unit: "%" },
    },
    {
      id: "deslig-regretted",
      label: "Desligamentos Regretted",
      formattedValue: String(regretted),
      chart: { data: CHART_PERIODS.map((p, i) => ({ month: `${p}-01`, value: mockRegCounts[i]! })) },
    },
  ];

  return (
    <div className="min-h-full py-6 space-y-8 max-w-5xl mx-auto">

      {/* ══════════ WORKFORCE PLANNING ══════════ */}
      <CollapsibleSection title="Workforce Planning" id="workforce">
        <div className="space-y-5">
          <KpiChartCard kpis={workforceChartKpis} chartHeight={200} />
          <CardRow>
            {workforceKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
          </CardRow>
          <SplitCard card={jornadaCard} />
        </div>
      </CollapsibleSection>

      {/* ══════════ DIVERSIDADE ══════════ */}
      <CollapsibleSection title="Diversidade" id="diversidade">
        <CardGrid>
          <CardRow>
            {diversidadeKpis.slice(0, 4).map((k) => <KpiCard key={k.id} kpi={k} />)}
          </CardRow>
          {/* <CardRow>
            {diversidadeKpis.slice(4).map((k) => <KpiCard key={k.id} kpi={k} />)}
            <DistributionBar
              title="Distribuição de Cargos"
              items={roleRows.map((r) => ({ label: r.role, count: r.count }))}
              total={hc}
              span={3}
            />
          </CardRow> */}
        </CardGrid>
      </CollapsibleSection>

      {/* ══════════ PERFORMANCE E TALENTOS ══════════ */}
      <CollapsibleSection title="Performance e Talentos" id="performance">
        <CardGrid>
          <CardRow>
            <DimensionCard title="Gestão de Desempenho (GD)" items={GD} />
            <DimensionCard title="Gestão de Talentos (GT)" items={GT} />
          </CardRow>
          <CardRow>
            <SplitCard card={highPerfCard} span={2} />
            {performanceKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
          </CardRow>
        </CardGrid>
      </CollapsibleSection>

      {/* ══════════ TURNOVER ══════════ */}
      <CollapsibleSection title="Turnover" id="turnover">
        <div className="grid grid-cols-4 gap-5">
          {/* Left: Taxa de Turnover + Desligamentos — col 2 × row 2 */}
          <div style={{ gridColumn: "span 2", gridRow: "span 2" }} className="grid">
            <KpiChartCard kpis={turnoverChartKpis} chartHeight={200} />
          </div>
          {/* Right: Turnover Regretted + Deslig. Regretted — col 2 × row 2 */}
          <div style={{ gridColumn: "span 2", gridRow: "span 2" }} className="grid">
            <KpiChartCard kpis={turnoverRegrettedChartKpis} chartHeight={200} />
          </div>
          {/* Row 3: Principais Motivos de Desligamento — full width */}
          <div style={{ gridColumn: "span 4" }}>
            <MotivosCard
              items={[
                ["Remuneração", 20],
                ["Carreira", 15],
                ["Carga de Trabalho", 10],
                ["Trabalho Remoto", 10],
                ["Outros", 45],
              ]}
            />
          </div>
          {/* Commented: Desligamentos por Cargo
          <SplitCard card={{
            title: "Desligamentos por Cargo",
            items: [
              { label: "Líderes", value: String(Math.round(tvCount * 0.28)) },
              { label: "Não Líderes", value: String(tvCount - Math.round(tvCount * 0.28)) },
            ],
          }} />
          */}
        </div>
      </CollapsibleSection>
    </div>
  );
}

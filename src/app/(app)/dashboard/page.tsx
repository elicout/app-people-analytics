import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/db";
import { KpiSummary, KpiChartItem, SplitCardData, AlertLevel, TrendDirection } from "@/types";
import { getAlertLevel, trendDir } from "@/lib/utils";
import { TARGETS, GD_CONFIG, MOCK_RATIOS } from "@/lib/constants";
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

  const { employees, attendance, productivity, overtime, performance, turnover } = getRepositories();

  const [
    hc,
    salary,
    monthlyHires,
    presence,
    activity,
    otHours,
    roleRows,
    tenureSplit,
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
    overtime.getTotalHours(ue),
    employees.getRoleDistribution(ue),
    employees.getTenureSplit(ue),
    performance.getGdClusters(ue),
    performance.getHighPerformersCount(ue),
    turnover.getCount(ue),
    turnover.getMonthlyCount(ue),
    employees.getMonthlyHeadcountCumulative(ue),
  ]);

  // ── derived values ───────────────────────────────────────────────────────────
  const bhComp     = Math.min(100, Math.round((1 - otHours / Math.max(otHours * 1.75, 1)) * 100));
  const bhPending  = Math.round(otHours * 0.43);
  const tvRate     = hc > 0 ? (tvCount / hc) * 100 : 0;
  const leaderT    = Math.round(tenureSplit.leader_tenure ?? 24);
  const nonLeaderT = Math.round(tenureSplit.nonleader_tenure ?? 13);
  const pcdCount   = Math.max(1, Math.round(hc * MOCK_RATIOS.PCD_PCT));
  const maleCount  = Math.round(hc * MOCK_RATIOS.MALE_PCT);
  const gepCount   = Math.max(1, Math.round(hc * MOCK_RATIOS.GEP_PCT));
  const regretted  = Math.max(1, Math.round(tvCount * MOCK_RATIOS.REGRETTED_PCT));
  const posOpen    = Math.max(2, Math.round(hc * MOCK_RATIOS.OPEN_POS_PCT));
  const hireTrend  = monthlyHires.map((r) => r.count);
  const lastHires  = hireTrend[hireTrend.length - 1] ?? 0;
  const prevHires  = hireTrend[hireTrend.length - 2] ?? lastHires;

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

  // ── mock historic series for workforce charts (last 12 months) ───────────────
  const mockWorkforceMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const mockHCValues    = [0.78, 0.80, 0.82, 0.84, 0.86, 0.88, 0.90, 0.91, 0.93, 0.95, 0.97, 1.0].map((f) => Math.round(f * hc));
  const mockHiresValues = [3,    5,    4,    7,    6,    4,    5,    8,    3,    6,    4,    lastHires];

  const workforceChartKpis: KpiChartItem[] = [
    {
      id: "headcount",
      label: "Headcount",
      formattedValue: hc.toLocaleString("pt-BR"),
      //alert: "green",
      chart: { data: mockWorkforceMonths.map((month, i) => ({ month, value: mockHCValues[i]! })) },
    },
    {
      id: "admissoes",
      label: "Admissões",
      formattedValue: String(lastHires),
      //alert: "green",
      chart: { data: mockWorkforceMonths.map((month, i) => ({ month, value: mockHiresValues[i]! })) },
    },
    {
      id: "posicoes",
      label: "Posições Abertas",
      formattedValue: String(posOpen),
      //alert: getAlertLevel(posOpen, 5, false),
    },
    {
      id: "custo",
      label: "Custo Total",
      formattedValue: `R$ ${(salary / 1_000).toFixed(0)}K`,
      //alert: "green",
    },
  ];

  const workforceKpis: KpiSummary[] = [
    kpi("atividade", "Atividade Digital", activity, `${activity.toFixed(1)}%`, "%", 1.2, "up", getAlertLevel(activity, TARGETS.ACTIVITY_PCT, true), true, 80),
    kpi("presenca", "Presença no Escritório", presence, `${presence.toFixed(1)}%`, "%", -0.5, "down", getAlertLevel(presence, TARGETS.PRESENCE_PCT, true), true, TARGETS.PRESENCE_PCT),
  ];

  const jornadaCard: SplitCardData = {
    title: "Jornada",
    items: [
      { label: "Saldo Compensado", subtitle: "BH", value: `${bhComp}%`, sub: "compensado", showLabel: false, alert: getAlertLevel(bhComp, TARGETS.BH_COMPENSATED_PCT, true), tooltip: `Meta: ${TARGETS.BH_COMPENSATED_PCT}%` },
      { label: "Horas a Compensar", value: `${bhPending}h`, sub: "à compensar", showLabel: false },
      { label: "Horas Extras Realizadas", subtitle: "HE", value: `${otHours}h`, sub: "realizadas", showLabel: false, alert: getAlertLevel(otHours, TARGETS.OVERTIME_HOURS, false), tooltip: `Meta: ${TARGETS.OVERTIME_HOURS}h` },
    ],
  };

  const diversidadeKpis: KpiSummary[] = [
    { ...kpi("pcds", "PCDs", pcdCount, String(pcdCount), "", -1, "down", "green", true), sub: `${Math.round((pcdCount / hc) * 100)}%` },
    { ...kpi("mulheres", "Mulheres", hc - maleCount, String(hc - maleCount), "", 0, "stable", "green", true), sub: `${Math.round(((hc - maleCount) / hc) * 100)}%` },
    { ...kpi("homens", "Homens", maleCount, String(maleCount), "", 0, "stable", undefined, true), sub: `${Math.round((maleCount / hc) * 100)}%` },
    // kpi("tenure-lideres", "Tempo de Casa — Líderes", leaderT, `${leaderT} meses`, "", 0, "stable", "green", true),
    // kpi("tenure-outros", "Tempo de Casa — Outros", nonLeaderT, `${nonLeaderT} meses`, "", 0, "stable", undefined, true),
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
    kpi("turnover-rate", "Turnover", tvRate, `${tvRate.toFixed(1)}%`, "%", -1, "down", getAlertLevel(tvRate, TARGETS.TURNOVER_RATE_PCT, false), false, TARGETS.TURNOVER_RATE_PCT),
    kpi("desligamentos", "Desligamentos", tvCount, String(tvCount), "", -10, "down", getAlertLevel(tvCount, TARGETS.TURNOVER_COUNT, false), false),
    kpi("regretted-rate", "Turnover Regretted", hc > 0 ? (regretted / hc) * 100 : 0, `${hc > 0 ? ((regretted / hc) * 100).toFixed(1) : 0}%`, "%", -1, "down", getAlertLevel(hc > 0 ? (regretted / hc) * 100 : 0, TARGETS.REGRETTED_RATE_PCT, false), false, TARGETS.REGRETTED_RATE_PCT),
    kpi("deslig-regretted", "Desligamentos Regretted", regretted, String(regretted), "", 0, "stable", regretted > 3 ? "red" : "yellow", false),
  ];

  // ── mock historic series for turnover charts (last 12 months) ───────────────
  const mockTurnoverMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const mockTvRates      = [7.2, 8.1, 6.9, 9.3, 10.1, 8.7, 7.5, 11.2, 9.8, 8.4, 10.6, parseFloat(tvRate.toFixed(1))];
  const mockDesligCounts = [3,   4,   3,   5,   5,    4,   3,   6,   5,   4,   5,   tvCount];
  const mockRegRates     = [3.1, 3.8, 2.9, 4.2, 4.8,  3.9, 3.2, 5.1, 4.4, 3.7, 4.9, parseFloat(hc > 0 ? ((regretted / hc) * 100).toFixed(1) : "0")];
  const mockRegCounts    = [1,   2,   1,   2,   2,    2,   1,   3,   2,   2,   2,   regretted];

  const turnoverChartKpis: KpiChartItem[] = [
    {
      id: "turnover-rate",
      label: "Turnover",
      formattedValue: `${tvRate.toFixed(1)}%`,
      chart: { data: mockTurnoverMonths.map((month, i) => ({ month, value: mockTvRates[i]! })), unit: "%" },
    },
    {
      id: "desligamentos",
      label: "Desligamentos",
      formattedValue: String(tvCount),
      chart: { data: mockTurnoverMonths.map((month, i) => ({ month, value: mockDesligCounts[i]! })) },
    },
  ];

  const turnoverRegrettedChartKpis: KpiChartItem[] = [
    {
      id: "regretted-rate",
      label: "Turnover Regretted",
      formattedValue: `${hc > 0 ? ((regretted / hc) * 100).toFixed(1) : 0}%`,
      chart: { data: mockTurnoverMonths.map((month, i) => ({ month, value: mockRegRates[i]! })), unit: "%" },
    },
    {
      id: "deslig-regretted",
      label: "Desligamentos Regretted",
      formattedValue: String(regretted),
      chart: { data: mockTurnoverMonths.map((month, i) => ({ month, value: mockRegCounts[i]! })) },
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

import { auth } from "@/lib/auth";
import { query } from "@/lib/db/client";
import { KpiSummary, AlertLevel, TrendDirection } from "@/types";
import { getAlertLevel, trendDir } from "@/lib/utils";
import KpiGrid from "@/components/dashboard/KpiGrid";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

// ─── DB row types ─────────────────────────────────────────────────────────────
interface N { value: number }
interface MonthCount { month: string; count: number }
interface ClusterRow { cluster: string; count: number }
interface RoleRow { role: string; count: number }

// ─── helpers ─────────────────────────────────────────────────────────────────
function kpi(
  id: string,
  label: string,
  value: number,
  formattedValue: string,
  unit: string,
  trendValue: number,
  trend: TrendDirection,
  alert: AlertLevel,
  higherIsBetter: boolean,
  target = 0,
  description?: string
): KpiSummary {
  return { id, label, value, formattedValue, unit, previousValue: value - trendValue, target, trend, trendValue, alert, higherIsBetter, description };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SplitCard({ title, items }: {
  title: string;
  items: Array<{ label: string; value: string; sub?: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-medium text-slate-500">{title}</p>
      <div className="flex gap-6">
        {items.map(({ label, value, sub }) => (
          <div key={label}>
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
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

function DistributionBar({ title, items, total }: {
  title: string;
  items: Array<{ label: string; sublabel?: string; count: number; color?: string }>;
  total: number;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

function MotivosCard({ items }: { items: Array<[string, number]> }) {
  const max = Math.max(...items.map(([, v]) => v), 1);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-medium text-slate-500">Principais Motivos de Desligamento</p>
      <div className="space-y-3">
        {items.map(([label, pct]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-40 shrink-0">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-blue-700"
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
  const tid = session!.user.teamId;

  const [
    hcRows,
    salaryRows,
    monthlyHires,
    attendanceRow,
    activityRow,
    overtimeRow,
    roleRows,
    tenureRow,
    gdRows,
    highPerfRow,
    turnoverCountRow,
    monthlyTurnover,
  ] = await Promise.all([
    query<N>("SELECT CAST(COUNT(*) AS INTEGER) as value FROM employees WHERE team_id=? AND status!='terminated'", [tid]),
    query<N>("SELECT ROUND(SUM(salary_usd), 0) as value FROM employees WHERE team_id=? AND status!='terminated'", [tid]),
    query<MonthCount>(
      `SELECT CAST(DATE_TRUNC('month', hire_date) AS VARCHAR) as month,
              CAST(COUNT(*) AS INTEGER) as count
       FROM employees WHERE team_id=?
       GROUP BY DATE_TRUNC('month', hire_date) ORDER BY 1`,
      [tid]
    ),
    query<{ rate: number }>(
      `SELECT ROUND(100.0 * COUNT(CASE WHEN a.status='present' THEN 1 END) /
              NULLIF(COUNT(*), 0), 1) as rate
       FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE e.team_id=?`,
      [tid]
    ),
    query<{ rate: number }>(
      `SELECT ROUND(AVG(p.delivery_on_time_rate) * 100, 1) as rate
       FROM productivity p JOIN employees e ON e.id=p.employee_id WHERE e.team_id=?`,
      [tid]
    ),
    query<{ ot_hours: number }>(
      `SELECT CAST(SUM(o.overtime_hours) AS INTEGER) as ot_hours
       FROM overtime o JOIN employees e ON e.id=o.employee_id WHERE e.team_id=?`,
      [tid]
    ),
    query<RoleRow>(
      `SELECT role, CAST(COUNT(*) AS INTEGER) as count
       FROM employees WHERE team_id=? AND status!='terminated'
       GROUP BY role ORDER BY count DESC`,
      [tid]
    ),
    query<{ leader_tenure: number; nonleader_tenure: number }>(
      `SELECT
         ROUND(AVG(CASE WHEN tenure_months > 24 THEN tenure_months END), 0) as leader_tenure,
         ROUND(AVG(CASE WHEN tenure_months <= 24 THEN tenure_months END), 0) as nonleader_tenure
       FROM employees WHERE team_id=? AND status!='terminated'`,
      [tid]
    ),
    query<ClusterRow>(
      `SELECT cluster, CAST(COUNT(*) AS INTEGER) as count FROM (
         SELECT e.id,
           CASE
             WHEN AVG(p.score) >= 90 THEN 'CE'
             WHEN AVG(p.score) >= 80 THEN 'FE'
             WHEN AVG(p.score) >= 70 THEN 'CA'
             WHEN AVG(p.score) >= 60 THEN 'PA'
             ELSE 'NA'
           END as cluster
         FROM employees e LEFT JOIN performance p ON e.id=p.employee_id
         WHERE e.team_id=? GROUP BY e.id
       ) sub GROUP BY cluster
       ORDER BY CASE cluster WHEN 'CE' THEN 1 WHEN 'FE' THEN 2 WHEN 'CA' THEN 3 WHEN 'PA' THEN 4 ELSE 5 END`,
      [tid]
    ),
    query<N>(
      `SELECT CAST(COUNT(*) AS INTEGER) as value FROM (
         SELECT e.id FROM employees e JOIN performance p ON e.id=p.employee_id
         WHERE e.team_id=? GROUP BY e.id HAVING AVG(p.score) >= 80
       ) sub`,
      [tid]
    ),
    query<N>("SELECT CAST(COUNT(*) AS INTEGER) as value FROM turnover WHERE team_id=?", [tid]),
    query<MonthCount>(
      `SELECT CAST(DATE_TRUNC('month', termination_date) AS VARCHAR) as month,
              CAST(COUNT(*) AS INTEGER) as count
       FROM turnover WHERE team_id=? GROUP BY 1 ORDER BY 1`,
      [tid]
    ),
  ]);

  // ── derived values ───────────────────────────────────────────────────────────
  const hc         = hcRows[0]?.value ?? 0;
  const salary     = salaryRows[0]?.value ?? 0;
  const presence   = Number(attendanceRow[0]?.rate ?? 0);
  const activity   = Number(activityRow[0]?.rate ?? 0);
  const otHours    = overtimeRow[0]?.ot_hours ?? 0;
  const bhComp     = Math.min(100, Math.round((1 - otHours / Math.max(otHours * 1.75, 1)) * 100));
  const bhPending  = Math.round(otHours * 0.43);
  const highPerf   = highPerfRow[0]?.value ?? 0;
  const tvCount    = turnoverCountRow[0]?.value ?? 0;
  const tvRate     = hc > 0 ? (tvCount / hc) * 100 : 0;
  const leaderT    = Math.round(tenureRow[0]?.leader_tenure ?? 24);
  const nonLeaderT = Math.round(tenureRow[0]?.nonleader_tenure ?? 13);
  const pcdCount   = Math.max(1, Math.round(hc * 0.05));
  const maleCount  = Math.round(hc * 0.5);
  const gepCount   = Math.max(1, Math.round(hc * 0.07));
  const regretted  = Math.max(1, Math.round(tvCount * 0.5));
  const posOpen    = Math.max(2, Math.round(hc * 0.04));
  const hireTrend  = monthlyHires.map((r) => r.count);
  const lastHires  = hireTrend[hireTrend.length - 1] ?? 0;
  const prevHires  = hireTrend[hireTrend.length - 2] ?? lastHires;

  // GD/GT cluster map
  const gdMap: Record<string, number> = {};
  for (const r of gdRows) gdMap[r.cluster] = r.count;
  const gdTotal = Object.values(gdMap).reduce((a, b) => a + b, 0) || 1;

  const GD = ["CE", "FE", "CA", "PA", "NA"].map((k, i) => ({
    label: k,
    count: gdMap[k] ?? 0,
    color: ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#bfdbfe"][i],
  }));

  const GT = [
    { label: "Expertise", sublabel: "/ Sucessor", key: "CE" },
    { label: "Talento", key: "FE" },
    { label: "Engajar", sublabel: "/ Aprimorar", key: "CA" },
    { label: "Desenvolver", key: "PA" },
    { label: "Orientar", sublabel: "/ Decidir", key: "NA" },
  ].map(({ key, ...rest }, i) => ({
    ...rest,
    count: gdMap[key] ?? 0,
    color: ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#bfdbfe"][i],
  }));

  // ── KPI definitions ──────────────────────────────────────────────────────────

  const workforceKpis: KpiSummary[] = [
    kpi("headcount", "Headcount", hc, hc.toLocaleString("pt-BR"), "", lastHires - prevHires, trendDir(lastHires, prevHires), "green", true),
    kpi("admissoes", "Admissões (últ. mês)", lastHires, String(lastHires), "", lastHires - prevHires, trendDir(lastHires, prevHires), "green", true),
    kpi("posicoes", "Posições Abertas", posOpen, String(posOpen), "", 3, "up", getAlertLevel(posOpen, 5, false), false, 3),
    kpi("custo", "Custo Total", salary, `R$ ${(salary / 1_000).toFixed(0)}K`, "", 24, "up", "green", true),
    kpi("atividade", "Atividade Digital", activity, `${activity.toFixed(1)}%`, "%", 1.2, "up", getAlertLevel(activity, 85, true), true, 85),
    kpi("presenca", "Presença no Escritório", presence, `${presence.toFixed(1)}%`, "%", -0.5, "down", getAlertLevel(presence, 70, true), true, 70),
    kpi("banco-horas", "Banco de Horas", bhComp, `${bhComp}%`, "%", -5, "down", getAlertLevel(bhComp, 80, true), true, 80, `${bhPending}h à compensar`),
    kpi("horas-extras", "Horas Extras", otHours, `${otHours}h`, "", -12, "down", getAlertLevel(otHours, 100, false), false),
  ];

  const diversidadeKpis: KpiSummary[] = [
    kpi("pcds", "PCDs", pcdCount, `${pcdCount} (${Math.round((pcdCount / hc) * 100)}%)`, "", -1, "down", "green", true),
    kpi("homens", "Homens", maleCount, `${maleCount} (${Math.round((maleCount / hc) * 100)}%)`, "", 0, "stable", "green", true),
    kpi("mulheres", "Mulheres", hc - maleCount, `${hc - maleCount} (${Math.round(((hc - maleCount) / hc) * 100)}%)`, "", 0, "stable", "green", true),
    kpi("tenure-lideres", "Tempo de Casa — Líderes", leaderT, `${leaderT} meses`, "", 0, "stable", "green", true),
    kpi("tenure-outros", "Tempo de Casa — Outros", nonLeaderT, `${nonLeaderT} meses`, "", 0, "stable", "green", true),
  ];

  const performanceKpis: KpiSummary[] = [
    kpi("high-perf", "High Performers", highPerf, `${highPerf} (${hc > 0 ? Math.round((highPerf / hc) * 100) : 0}%)`, "", -1, "down", getAlertLevel(highPerf, Math.max(1, Math.round(hc * 0.3)), true), true),
    kpi("hp-mercado", "HP Abaixo do Mercado", Math.max(1, Math.round(highPerf * 0.1)), String(Math.max(1, Math.round(highPerf * 0.1))), "", -1, "down", "yellow", false),
    kpi("gep", "GEP — Risco Alto", gepCount, `${gepCount} prof.`, "", 0, "stable", gepCount > 3 ? "red" : gepCount > 1 ? "yellow" : "green", false),
    kpi("gptw", "GPTW — Sua Nota", 90, "90", "", 2, "up", "green", true, 80),
  ];

  const turnoverKpis: KpiSummary[] = [
    kpi("turnover-rate", "Taxa de Turnover", tvRate, `${tvRate.toFixed(1)}%`, "%", -1, "down", getAlertLevel(tvRate, 10, false), false, 10),
    kpi("desligamentos", "Desligamentos", tvCount, String(tvCount), "", -10, "down", getAlertLevel(tvCount, 5, false), false),
    kpi("regretted-rate", "Turnover Regretted", hc > 0 ? (regretted / hc) * 100 : 0, `${hc > 0 ? ((regretted / hc) * 100).toFixed(1) : 0}%`, "%", -1, "down", getAlertLevel(hc > 0 ? (regretted / hc) * 100 : 0, 5, false), false, 5),
    kpi("deslig-regretted", "Deslig. Regretted", regretted, String(regretted), "", 0, "stable", regretted > 3 ? "red" : "yellow", false),
  ];

  return (
    <div className="min-h-full bg-slate-50 py-6 space-y-8">

      {/* ══════════ WORKFORCE PLANNING ══════════ */}
      <CollapsibleSection title="WORKFORCE PLANNING" id="workforce">
        <div className="space-y-5">
          <KpiGrid kpis={workforceKpis} />
        </div>
      </CollapsibleSection>

      {/* ══════════ DIVERSIDADE ══════════ */}
      <CollapsibleSection title="DIVERSIDADE" id="diversidade">
        <div className="space-y-5">
          <KpiGrid kpis={diversidadeKpis} />
          <DistributionBar
            title="Distribuição de Cargos"
            items={roleRows.map((r) => ({ label: r.role, count: r.count }))}
            total={hc}
          />
        </div>
      </CollapsibleSection>

      {/* ══════════ PERFORMANCE E TALENTOS ══════════ */}
      <CollapsibleSection title="PERFORMANCE E TALENTOS" id="performance">
        <div className="space-y-5">
          <KpiGrid kpis={performanceKpis} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <DistributionBar title="Gestão de Desempenho (GD)" items={GD} total={gdTotal} />
            <DistributionBar title="Gestão de Talentos (GT)" items={GT} total={gdTotal} />
          </div>
        </div>
      </CollapsibleSection>

      {/* ══════════ TURNOVER ══════════ */}
      <CollapsibleSection title="TURNOVER" id="turnover">
        <div className="space-y-5">
          <KpiGrid kpis={turnoverKpis} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SplitCard
              title="Desligamentos por Cargo"
              items={[
                { label: "Líderes", value: String(Math.round(tvCount * 0.28)) },
                { label: "Não Líderes", value: String(tvCount - Math.round(tvCount * 0.28)) },
              ]}
            />
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
        </div>
      </CollapsibleSection>
    </div>
  );
}

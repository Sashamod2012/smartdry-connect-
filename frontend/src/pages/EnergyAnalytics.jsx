import { useEffect, useState } from "react";
import { Flame, BatteryCharging, Sun, Timer, Scale, TrendingDown, Zap, Coins, Wallet, FlaskConical } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getEnergySummary } from "@/lib/api";
import { StatCard } from "@/components/StatCard";

const COLORS = ["#F59E0B", "#38BDF8", "#10B981"];

export default function EnergyAnalytics() {
  const [d, setD] = useState(null);

  useEffect(() => {
    getEnergySummary().then(setD).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 fade-up" data-testid="energy-analytics-page">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">Energy & Performance</h1>
        <p className="text-sm text-slate-400 mt-1.5 max-w-3xl">
          Analytics framework designed for controlled pilot validation. All figures below are illustrative simulated values —
          no measured energy savings or performance claims are made at this stage.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3 flex items-start gap-3" data-testid="energy-disclaimer">
        <FlaskConical className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200/90 leading-relaxed font-mono">
          SIMULATED / DEMO DATA — NOT PILOT RESULTS. This dashboard demonstrates the analytics capability.
          Real LPG, solar, yield and cost performance will be measured during the controlled pilot programme.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard testId="kpi-lpg" icon={Flame} label="LPG Consumed" value={d ? d.lpg_consumed_kg : "—"} unit="kg" sub={`${d?.batches_completed ?? "—"} demo batches`} accent="text-amber-400" />
        <StatCard testId="kpi-battery" icon={BatteryCharging} label="Battery Energy" value={d ? d.battery_energy_kwh : "—"} unit="kWh" sub="Controls & sensors" accent="text-emerald-400" />
        <StatCard testId="kpi-solar" icon={Sun} label="Solar Contribution" value={d ? d.solar_contribution_kwh : "—"} unit="kWh" sub="PV array (demo model)" accent="text-sky-400" />
        <StatCard testId="kpi-duration" icon={Timer} label="Drying Duration" value={d ? d.total_drying_hours : "—"} unit="h total" sub={`Avg ${d && d.batches_completed ? (d.total_drying_hours / d.batches_completed).toFixed(1) : "—"} h/batch`} accent="text-slate-200" />
        <StatCard testId="kpi-yield" icon={TrendingDown} label="Product Yield" value={d ? `${d.product_yield_pct}%` : "—"} sub={`${d?.starting_weight_kg ?? "—"} → ${d?.final_weight_kg ?? "—"} kg`} accent="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard testId="kpi-start-weight" icon={Scale} label="Starting Weight" value={d ? d.starting_weight_kg : "—"} unit="kg" accent="text-slate-200" />
        <StatCard testId="kpi-final-weight" icon={Scale} label="Final Weight" value={d ? d.final_weight_kg : "—"} unit="kg" accent="text-slate-200" />
        <StatCard testId="kpi-energy-per-kg" icon={Zap} label="Energy per kg" value={d ? d.energy_per_kg_kwh : "—"} unit="kWh-eq/kg" sub="Simulated model" accent="text-sky-400" />
        <StatCard testId="kpi-cost-per-kg" icon={Coins} label="Energy Cost per kg" value={d ? `$${d.cost_per_kg}` : "—"} sub={`Cost/batch $${d?.cost_per_batch ?? "—"} (demo)`} accent="text-amber-400" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="energy-split-chart">
          <div className="sd-label mb-2">Energy Source Contribution (kWh-equivalent, simulated)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d?.energy_split || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {(d?.energy_split || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1322", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-mono text-slate-600">LPG provides thermal energy for hot-air drying; solar + battery power the electrical control, sensing and communications layer.</p>
        </div>

        <div className="sd-card p-5 lg:col-span-3" data-testid="comparison-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="sd-label">Comparison Model — Existing Practice vs SmartDry System</span>
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">SIMULATED COMPARISON</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="comparison-table">
              <thead>
                <tr className="border-b border-white/[0.07] text-left">
                  <th className="py-2.5 pr-3 sd-label">Metric</th>
                  <th className="py-2.5 pr-3 sd-label">Existing Equipment / Practice</th>
                  <th className="py-2.5 pr-3 sd-label">SmartDry System</th>
                  <th className="py-2.5 sd-label">Basis</th>
                </tr>
              </thead>
              <tbody>
                {(d?.comparison || []).map((row) => (
                  <tr key={row.metric} className="border-b border-white/[0.04]">
                    <td className="py-2.5 pr-3 text-slate-200 font-medium">{row.metric}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{row.existing}</td>
                    <td className="py-2.5 pr-3 text-emerald-400 font-mono">{row.smartdry}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[10px]">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] font-mono text-slate-600 leading-relaxed">
            Comparison values are illustrative and simulated for demonstration only. SmartDry Connect makes no claim of measured
            energy savings, efficiency gains or cost reductions until controlled pilot validation is complete.
          </p>
        </div>
      </div>
    </div>
  );
}

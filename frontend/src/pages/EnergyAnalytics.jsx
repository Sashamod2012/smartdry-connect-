import { useEffect, useState } from "react";
import {
  Flame, BatteryCharging, Sun, Zap, PlugZap, FlaskConical, Thermometer, Scale, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getEnergySummary } from "@/lib/api";

const COLORS = ["#F59E0B", "#38BDF8", "#10B981"];

const DataTag = ({ source }) => (
  <span className={`text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded border ${
    source === "measured"
      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
      : "bg-amber-50 text-amber-700 border-amber-300"
  }`}>
    {source === "measured" ? "MEASURED" : "SIMULATED"}
  </span>
);

const MetricRow = ({ label, value, source, testId }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs font-bold text-slate-800" data-testid={testId}>{value ?? "—"}</span>
      {source && <DataTag source={source} />}
    </span>
  </div>
);

const SectionCard = ({ icon: Icon, title, tone, children, testId }) => (
  <div className="sd-card p-5" data-testid={testId}>
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-7 h-7 rounded-md border flex items-center justify-center ${tone}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="sd-label">{title}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const SeriesChart = ({ title, data, color, unit, testId, area }) => {
  const Chart = area ? AreaChart : LineChart;
  return (
    <div className="sd-card p-5 min-w-0" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <span className="sd-label">{title}</span>
        <DataTag source="simulated" />
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data || []} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} interval={5} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
              formatter={(v) => [`${v} ${unit}`, title]} />
            {area
              ? <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
              : <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function EnergyAnalytics() {
  const [d, setD] = useState(null);

  useEffect(() => {
    getEnergySummary().then(setD).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 fade-up" data-testid="energy-analytics-page">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Energy Performance</h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-3xl">
          How SmartDry Connect records and displays energy information during agricultural dehydration.
          Every metric is tagged by data source — measured pilot data will replace simulated values using the same structure.
        </p>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3" data-testid="energy-disclaimer">
        <FlaskConical className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed font-mono">
          SIMULATED / DEMO DATA — NOT PILOT RESULTS. No percentage energy-savings claims are made: baseline and test
          measurements will be captured during the controlled pilot programme and shown here as MEASURED data.
        </p>
      </div>

      <div className="sd-card p-5" data-testid="energy-config-indicator">
        <div className="sd-label mb-4">Energy Configuration</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Thermal Source</div>
              <div className="font-mono text-sm font-extrabold text-amber-700" data-testid="config-thermal">{d?.thermal?.source || "LPG"}</div>
            </div>
          </div>
          <div className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 flex items-center gap-3">
            <Sun className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Electrical Source</div>
              <div className="font-mono text-sm font-extrabold text-sky-700" data-testid="config-electrical">{d?.electrical?.source || "Solar + Battery"}</div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 flex items-center gap-3">
            <PlugZap className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Grid</div>
              <div className="font-mono text-sm font-extrabold text-slate-700" data-testid="config-grid">{d?.electrical?.grid_status || "OFF"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <SectionCard icon={Flame} title="Thermal Energy" tone="bg-amber-50 border-amber-200 text-amber-600" testId="thermal-energy-section">
          <MetricRow label="Thermal Source" value={d?.thermal?.source} source={d?.thermal?.data_source} testId="thermal-source" />
          <MetricRow label="LPG Consumption" value={d ? `${d.thermal.lpg_consumption_kg} kg` : "—"} source={d?.thermal?.data_source} testId="thermal-lpg" />
          <MetricRow label="Thermal Operating Time" value={d ? `${d.thermal.operating_hours} h` : "—"} source={d?.thermal?.data_source} testId="thermal-hours" />
        </SectionCard>

        <SectionCard icon={Zap} title="Electrical Energy" tone="bg-sky-50 border-sky-200 text-sky-600" testId="electrical-energy-section">
          <MetricRow label="Electrical Source" value={d?.electrical?.source} source={d?.electrical?.data_source} testId="electrical-source" />
          <MetricRow label="Solar Status" value={d?.electrical?.solar_status} source={d?.electrical?.data_source} testId="electrical-solar" />
          <MetricRow label="Battery Status" value={d?.electrical?.battery_status} source={d?.electrical?.data_source} testId="electrical-battery" />
          <MetricRow label="Grid Status" value={d?.electrical?.grid_status} source={d?.electrical?.data_source} testId="electrical-grid" />
          <MetricRow label="Energy Consumption" value={d ? `${d.electrical.energy_kwh} kWh` : "—"} source={d?.electrical?.data_source} testId="electrical-kwh" />
        </SectionCard>

        <SectionCard icon={Scale} title="Process" tone="bg-emerald-50 border-emerald-200 text-emerald-600" testId="process-section">
          <MetricRow label="Starting Weight" value={d ? `${d.process.starting_weight_kg} kg` : "—"} source={d?.process?.data_source} testId="process-start-weight" />
          <MetricRow label="Final Weight" value={d ? `${d.process.final_weight_kg} kg` : "—"} source={d?.process?.data_source} testId="process-final-weight" />
          <MetricRow label="Drying Duration" value={d ? `${d.process.drying_duration_hours} h` : "—"} source={d?.process?.data_source} testId="process-duration" />
          <MetricRow label="Product Yield" value={d ? `${d.process.product_yield_pct}%` : "—"} source={d?.process?.data_source} testId="process-yield" />
          <MetricRow label="Energy per kg" value={d?.process?.energy_per_kg_kwh != null ? `${d.process.energy_per_kg_kwh} kWh-eq/kg` : "Insufficient data"} source={d?.process?.data_source} testId="process-energy-per-kg" />
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SeriesChart testId="chart-temperature" title="Temperature Over Time" data={d?.timeseries?.temperature} color="#059669" unit="°C" />
        <SeriesChart testId="chart-weight" title="Product Weight Over Time" data={d?.timeseries?.weight} color="#0284c7" unit="kg" />
        <SeriesChart testId="chart-energy" title="Energy Consumption Over Time" data={d?.timeseries?.energy_kwh} color="#d97706" unit="kWh-eq" area />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="energy-split-chart">
          <div className="flex items-center justify-between mb-2">
            <span className="sd-label">Energy Source Contribution (kWh-equivalent)</span>
            <DataTag source="simulated" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d?.energy_split || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {(d?.energy_split || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-mono text-slate-500">LPG provides thermal energy for hot-air drying; solar + battery power the electrical control, sensing and communications layer.</p>
        </div>

        <div className="sd-card p-5 lg:col-span-3" data-testid="comparison-panel">
          <div className="flex items-center justify-between mb-4">
            <span className="sd-label">Comparison Model — Existing Practice vs SmartDry System</span>
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-300">SIMULATED COMPARISON</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="comparison-table">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2.5 pr-3 sd-label">Metric</th>
                  <th className="py-2.5 pr-3 sd-label">Existing Equipment / Practice</th>
                  <th className="py-2.5 pr-3 sd-label">SmartDry System</th>
                  <th className="py-2.5 sd-label">Basis</th>
                </tr>
              </thead>
              <tbody>
                {(d?.comparison || []).map((row) => (
                  <tr key={row.metric} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 text-slate-700 font-medium">{row.metric}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{row.existing}</td>
                    <td className="py-2.5 pr-3 text-emerald-600 font-mono">{row.smartdry}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[10px]">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] font-mono text-slate-500 leading-relaxed">
            Comparison values are illustrative and simulated for demonstration only. SmartDry Connect makes no claim of measured
            energy savings, efficiency gains or cost reductions until controlled pilot validation is complete.
          </p>
        </div>
      </div>
    </div>
  );
}

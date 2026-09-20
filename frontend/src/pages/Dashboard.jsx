import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Thermometer, Droplets, Weight, Flame, Timer, Zap, Activity, ArrowRight,
  Cpu, Cloud, MonitorSmartphone, Sun, BatteryCharging, PlugZap,
} from "lucide-react";
import { getTelemetry } from "@/lib/api";
import { StatusLed } from "@/components/StatCard";

const statusStyle = {
  RUNNING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  IDLE: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  PAUSED: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  COMPLETE: "bg-sky-500/15 text-sky-400 border-sky-500/40",
};

export default function Dashboard() {
  const [t, setT] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => getTelemetry().then((d) => mounted && setT(d)).catch(() => {});
    load();
    const iv = setInterval(load, 4000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const fmtElapsed = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

  return (
    <div className="space-y-6 fade-up" data-testid="dashboard-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Digital monitoring & traceability layer for the SmartDry Connect™ hybrid LPG hot-air dryer.
            Electrical controls, sensors and communications powered by solar/battery.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/monitor" data-testid="dash-goto-monitor-btn" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
            <Activity className="w-4 h-4" /> Live Monitor
          </Link>
          <Link to="/new-batch" data-testid="dash-goto-newbatch-btn" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 text-sm font-semibold transition-colors">
            New Batch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="sd-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="sd-label">Dryer Status</div>
            <div className="flex items-center gap-3 mt-1">
              <span data-testid="dryer-status-badge" className={`px-3 py-1 rounded-full border text-xs font-mono font-bold tracking-wider ${statusStyle[t?.dryer_status] || statusStyle.IDLE}`}>
                {t?.dryer_status || "—"}
              </span>
              <StatusLed level="ok" label={t ? `Stage: ${t.drying_stage}` : "Connecting…"} />
            </div>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1.5">
            <span>CYCLE PROGRESS</span>
            <span className="text-emerald-400 font-bold">{t?.progress_pct ?? 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#0d1322] border border-white/[0.06] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-[width] duration-700" style={{ width: `${t?.progress_pct ?? 0}%` }} />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sd-card p-5" data-testid="active-batch-card">
          <div className="flex items-center justify-between mb-4">
            <span className="sd-label">Active Batch</span>
            <Link to="/history" data-testid="active-batch-history-link" className="text-[10px] font-mono text-slate-500 hover:text-emerald-400 transition-colors">HISTORY →</Link>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white" data-testid="active-batch-product">{t?.active_batch?.product || "Vegetables"}</div>
              <div className="font-mono text-sm font-bold text-sky-400 mt-1" data-testid="active-batch-id">{t?.active_batch?.batch_id || "SDC-2026-090"}</div>
            </div>
            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${statusStyle[t?.active_batch?.status || "RUNNING"]}`} data-testid="active-batch-status">
              {t?.active_batch?.status || "RUNNING"}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Trays</div>
              <div className="font-mono text-sm text-slate-200 mt-0.5">{t?.active_batch?.tray_quantity || 24} / 24</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Operator</div>
              <div className="text-sm text-slate-200 mt-0.5 truncate">{t?.active_batch?.operator || "C. Eze"}</div>
            </div>
          </div>
        </div>

        <div className="sd-card p-5" data-testid="process-monitoring-card">
          <div className="sd-label mb-4">Process Monitoring</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-slate-500"><Thermometer className="w-3 h-3 text-emerald-400" /> Temp</div>
              <div className="font-mono text-lg lg:text-xl font-extrabold text-emerald-400 mt-1 whitespace-nowrap" data-testid="stat-temperature">{t ? t.temperature_c : "—"}<span className="text-[10px] text-slate-500 font-normal"> °C</span></div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-slate-500"><Weight className="w-3 h-3 text-amber-400" /> Weight</div>
              <div className="font-mono text-lg lg:text-xl font-extrabold text-amber-400 mt-1 whitespace-nowrap" data-testid="stat-weight">{t ? t.weight_kg : "—"}<span className="text-[10px] text-slate-500 font-normal"> kg</span></div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-slate-500"><Timer className="w-3 h-3 text-slate-300" /> Time</div>
              <div className="font-mono text-lg lg:text-xl font-extrabold text-slate-100 mt-1 whitespace-nowrap" data-testid="stat-drying-time">{t ? fmtElapsed(t.elapsed_min) : "—"}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0d1322] border border-white/[0.06] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500"><Droplets className="w-3 h-3 text-sky-400" /> HUMIDITY</span>
              <span className="font-mono text-[11px] font-bold text-sky-400 whitespace-nowrap" data-testid="stat-humidity">{t ? `${t.humidity_pct} %RH` : "—"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0d1322] border border-white/[0.06] px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500"><Flame className="w-3 h-3 text-emerald-400" /> GAS</span>
              <span className="font-mono text-[11px] font-bold text-emerald-400 whitespace-nowrap" data-testid="stat-gas">{t ? `${t.gas_ppm} PPM · ${t.gas_status}` : "—"}</span>
            </div>
          </div>
        </div>

        <div className="sd-card p-5 sm:col-span-2 lg:col-span-1" data-testid="energy-config-card">
          <div className="sd-label mb-4">Energy Configuration</div>
          <div className="space-y-2">
            {[
              { icon: Flame, label: "Thermal Source", value: t?.power.thermal_source || "LPG Hot-Air", tone: "text-amber-400" },
              { icon: Zap, label: "Electrical Source", value: t?.power.electrical_source || "Solar PV + Battery", tone: "text-sky-400" },
              { icon: PlugZap, label: "Grid", value: t?.power.grid_status || "OFF-GRID — NOT REQUIRED", tone: "text-slate-400" },
              { icon: Sun, label: "Solar", value: t ? `${t.power.solar_status} · ${t.power.solar_w} W` : "—", tone: "text-sky-400" },
              { icon: BatteryCharging, label: "Battery", value: t ? `${t.power.battery_status} · ${t.power.battery_pct}%` : "—", tone: "text-emerald-400" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg bg-[#0d1322] border border-white/[0.06] px-3 py-2">
                <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <r.icon className={`w-3.5 h-3.5 ${r.tone}`} /> {r.label}
                </span>
                <span className={`font-mono text-[11px] font-bold ${r.tone}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="connectivity-flow-widget">
          <div className="sd-label mb-4">Future Live-Data Architecture</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {[
              { icon: Cpu, title: "ESP32 + Sensors", sub: "Temp/RH · Load cell · Gas · OLED", color: "text-emerald-400 border-emerald-500/40 bg-emerald-600/10" },
              { icon: Cloud, title: "SmartDry Connect Cloud", sub: "IoT ingestion · Batch records", color: "text-sky-400 border-sky-500/40 bg-sky-600/10" },
              { icon: MonitorSmartphone, title: "Dashboard + QR Traceability", sub: "Monitoring · Analytics · Traceability", color: "text-emerald-400 border-emerald-500/40 bg-emerald-600/10" },
            ].map((n, i) => (
              <div key={n.title} className="flex items-center gap-3 flex-1">
                <div className={`flex-1 rounded-xl border p-4 ${n.color.split(" ").slice(1).join(" ")}`}>
                  <n.icon className={`w-5 h-5 ${n.color.split(" ")[0]}`} />
                  <div className="mt-2 text-sm font-semibold text-slate-100">{n.title}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{n.sub}</div>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-[#0d1322] border border-white/[0.06] py-2.5">
              <div className="font-mono text-lg font-bold text-sky-400">{t?.connectivity.latency_ms ?? "—"}<span className="text-[10px] text-slate-500"> ms</span></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Latency</div>
            </div>
            <div className="rounded-lg bg-[#0d1322] border border-white/[0.06] py-2.5">
              <div className="font-mono text-lg font-bold text-sky-400">{t?.connectivity.rssi_dbm ?? "—"}<span className="text-[10px] text-slate-500"> dBm</span></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Signal</div>
            </div>
            <div className="rounded-lg bg-[#0d1322] border border-white/[0.06] py-2.5">
              <div className="font-mono text-lg font-bold text-emerald-400">{t?.connectivity.packet_hz ?? "—"}<span className="text-[10px] text-slate-500"> Hz</span></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Telemetry Rate</div>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-mono text-slate-500 leading-relaxed">
            Current demo uses simulated data. Pilot integration will connect real sensor data. Latency, signal and telemetry-rate values shown are simulated demonstration values.
          </p>
        </div>

        <div className="sd-card p-5" data-testid="power-status-card">
          <div className="sd-label mb-4">Energy Architecture</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <Flame className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">LPG Thermal Source</div>
                <div className="text-[11px] text-slate-500">Primary thermal source for hot-air drying</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <Sun className="w-5 h-5 text-sky-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">Solar PV Array</div>
                <div className="text-[11px] text-slate-500">Electrical power for controls, sensors, ESP32 and communications</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <BatteryCharging className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">Battery Buffer</div>
                <div className="text-[11px] text-slate-500">Electrical/control backup for monitoring and control systems</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-mono text-slate-500 leading-relaxed">
            Hybrid LPG hot-air drying with solar/battery-powered electrical controls, designed for energy-efficient agricultural processing.
          </p>
        </div>
      </div>
    </div>
  );
}

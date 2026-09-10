import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Thermometer, Droplets, Weight, Flame, Timer, Zap, Activity, ArrowRight,
  Cpu, Cloud, MonitorSmartphone, Sun, BatteryCharging,
} from "lucide-react";
import { getTelemetry } from "@/lib/api";
import { StatCard, StatusLed } from "@/components/StatCard";

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
            Digital monitoring & traceability layer for the SmartDry™ hybrid LPG hot-air dryer.
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

      <div className="sd-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
            <Flame className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="sd-label">Dryer Status</div>
            <div className="flex items-center gap-3 mt-1">
              <span data-testid="dryer-status-badge" className={`px-3 py-1 rounded-full border text-sm font-mono font-bold tracking-wider ${statusStyle[t?.dryer_status] || statusStyle.IDLE}`}>
                {t?.dryer_status || "—"}
              </span>
              <StatusLed level="ok" label={t ? `Stage: ${t.drying_stage}` : "Connecting…"} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="sd-label">Active Batch</div>
          <div data-testid="active-batch-id" className="font-mono text-lg font-bold text-sky-400 mt-1">
            {t?.active_batch?.batch_id || "SDC-2026-090"}
          </div>
          <div className="text-[11px] font-mono text-slate-500">{t?.active_batch?.product || "Vegetables"} · {t?.active_batch?.tray_quantity || 24} trays</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard testId="stat-temperature" icon={Thermometer} label="Chamber Temp" value={t ? t.temperature_c : "—"} unit="°C" sub="LPG hot-air loop" accent="text-emerald-400" />
        <StatCard testId="stat-humidity" icon={Droplets} label="Humidity" value={t ? t.humidity_pct : "—"} unit="%RH" sub="Exhaust air" accent="text-sky-400" />
        <StatCard testId="stat-weight" icon={Weight} label="Product Weight" value={t ? t.weight_kg : "—"} unit="kg" sub="Load-cell array" accent="text-amber-400" />
        <StatCard testId="stat-drying-time" icon={Timer} label="Drying Time" value={t ? fmtElapsed(t.elapsed_min) : "—"} sub={`${t?.progress_pct ?? 0}% of cycle`} accent="text-slate-200" />
        <StatCard testId="stat-gas" icon={Flame} label="Gas Safety" value={t ? t.gas_ppm : "—"} unit="PPM" sub={t ? `Status: ${t.gas_status}` : ""} accent="text-emerald-400" />
        <StatCard testId="stat-power" icon={Zap} label="Control Power" value={t ? `${t.power.battery_pct}%` : "—"} unit="batt" sub={t ? `Solar ${t.power.solar_w}W · 12V bus` : ""} accent="text-sky-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="connectivity-flow-widget">
          <div className="sd-label mb-4">Future Connectivity Concept — Live Data Path</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {[
              { icon: Cpu, title: "ESP32 + Sensors", sub: "Temp/RH · Load cell · Gas · OLED", color: "text-emerald-400 border-emerald-500/40 bg-emerald-600/10" },
              { icon: Cloud, title: "SmartDry Connect Cloud", sub: "IoT ingestion · Batch records", color: "text-sky-400 border-sky-500/40 bg-sky-600/10" },
              { icon: MonitorSmartphone, title: "Dashboard & QR", sub: "Monitoring · Analytics · Traceability", color: "text-emerald-400 border-emerald-500/40 bg-emerald-600/10" },
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
        </div>

        <div className="sd-card p-5" data-testid="power-status-card">
          <div className="sd-label mb-4">Energy Architecture</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <Flame className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">LPG Thermal Source</div>
                <div className="text-[11px] text-slate-500">Hot-air generation for drying — the primary heat engine</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <Sun className="w-5 h-5 text-sky-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">Solar PV Array</div>
                <div className="text-[11px] text-slate-500">Powers controls, sensors, ESP32 & communications</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#0d1322] border border-white/[0.06] p-3">
              <BatteryCharging className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">Battery Buffer</div>
                <div className="text-[11px] text-slate-500">Keeps monitoring & safety systems running off-sun</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-mono text-slate-500 leading-relaxed">
            Not a conventional grid-electric dehydrator — designed for energy-efficient, off-grid-ready operation.
          </p>
        </div>
      </div>
    </div>
  );
}

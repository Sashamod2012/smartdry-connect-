import { useEffect, useRef, useState } from "react";
import {
  Wind, Cpu, Wifi, Cloud, MonitorSmartphone, ArrowDown, Flame, Sun, BatteryCharging, Thermometer, Scale, ShieldAlert,
} from "lucide-react";
import { getSystemStatus } from "@/lib/api";

const FLOW = [
  { icon: Wind, title: "Physical SmartDry Dryer", sub: "Hybrid LPG hot-air chamber · 24 trays", color: "text-amber-400 border-amber-500/30" },
  { icon: Cpu, title: "ESP32 + Sensors", sub: "Temp/RH · Load cell weight · Gas detection · OLED display", color: "text-emerald-400 border-emerald-500/30" },
  { icon: Wifi, title: "IoT Communication", sub: "Wireless telemetry uplink (simulated link)", color: "text-sky-400 border-sky-500/30" },
  { icon: Cloud, title: "SmartDry Connect Cloud", sub: "Data ingestion · Batch records · Analytics engine", color: "text-sky-400 border-sky-500/30" },
  { icon: MonitorSmartphone, title: "Monitoring + Analytics + QR Traceability", sub: "This dashboard — the professional digital layer", color: "text-emerald-400 border-emerald-500/30" },
];

const SENSOR_ICONS = { "ESP32 Controller": Cpu, "Temperature/Humidity Sensor": Thermometer, "Load Cell (Weight)": Scale, "Gas Detector": ShieldAlert, "OLED Local Display": MonitorSmartphone, "Cloud Uplink": Cloud, "LPG Thermal Source": Flame, "Solar/Battery Electrical": Sun };

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    getSystemStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const entry = {
        ts: new Date().toISOString().slice(11, 19),
        device: "esp32-smartdry-01",
        temp_c: +(57 + Math.random() * 7).toFixed(1),
        rh_pct: +(18 + Math.random() * 14).toFixed(1),
        weight_kg: +(52 + Math.random() * 4).toFixed(2),
        gas_ppm: Math.round(120 + Math.random() * 160),
        pwr: "solar/batt",
        sim: true,
      };
      setLog((l) => [...l.slice(-29), entry]);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  return (
    <div className="space-y-6 fade-up" data-testid="system-status-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">System Status</h1>
          <p className="text-sm text-slate-400 mt-1.5">IoT, sensor and power subsystem overview for the SmartDry prototype platform.</p>
        </div>
        <span data-testid="system-overall-status" className="px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold tracking-wider self-start">
          {status?.overall || "—"}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="sd-card p-6" data-testid="system-architecture-diagram">
          <div className="sd-label mb-5">Platform Architecture</div>
          <div className="space-y-0 max-w-md">
            {FLOW.map((n, i) => (
              <div key={n.title}>
                <div className={`rounded-xl border bg-[#0d1322] p-4 flex items-start gap-3 ${n.color.split(" ").slice(1).join(" ")}`}>
                  <n.icon className={`w-5 h-5 mt-0.5 ${n.color.split(" ")[0]}`} />
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{n.title}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{n.sub}</div>
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex justify-start pl-7 py-0.5">
                    <ArrowDown className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#0d1322] border border-amber-500/20 p-3 flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">LPG Thermal Source</div>
                <div className="text-[10px] font-mono text-slate-500">Hot-air generation</div>
              </div>
            </div>
            <div className="rounded-lg bg-[#0d1322] border border-sky-500/20 p-3 flex items-center gap-2.5">
              <BatteryCharging className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Solar/Battery Electrical</div>
                <div className="text-[10px] font-mono text-slate-500">Controls · sensors · comms</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sd-card p-5" data-testid="subsystem-health-matrix">
            <div className="sd-label mb-4">Subsystem Health Matrix</div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {(status?.components || []).map((c) => {
                const Icon = SENSOR_ICONS[c.name] || Cpu;
                return (
                  <div key={c.name} data-testid={`health-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="rounded-lg bg-[#0d1322] border border-white/[0.06] p-3 flex items-start gap-2.5">
                    <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.role}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 led-pulse text-emerald-400" />
                        <span className="text-[9px] font-mono text-emerald-400">{c.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sd-card p-5" data-testid="telemetry-stream-log">
            <div className="flex items-center justify-between mb-3">
              <span className="sd-label">ESP32 Telemetry Stream (Simulated)</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 led-pulse" /> STREAMING
              </span>
            </div>
            <div ref={logRef} className="h-52 overflow-y-auto rounded-lg bg-black/40 border border-white/[0.06] p-3 font-mono text-[10px] leading-relaxed">
              {log.map((e, i) => (
                <div key={i} className="text-slate-400">
                  <span className="text-slate-600">{e.ts}</span>{" "}
                  <span className="text-sky-400">{e.device}</span>{" "}
                  <span className="text-emerald-400">temp={e.temp_c} °C</span>{" "}
                  <span className="text-sky-300">rh={e.rh_pct}%</span>{" "}
                  <span className="text-amber-400">wt={e.weight_kg}kg</span>{" "}
                  <span className="text-slate-300">gas={e.gas_ppm}ppm</span>{" "}
                  <span className="text-slate-600">[{e.pwr}] sim</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

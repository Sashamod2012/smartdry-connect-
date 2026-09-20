import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Fan, Flame, Scale } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Gauge } from "@/components/Gauge";
import { toast } from "sonner";

const STAGES = [
  { name: "Pre-heating", to: 15 },
  { name: "Moisture Extraction", to: 45 },
  { name: "Constant Rate", to: 70 },
  { name: "Falling Rate", to: 90 },
  { name: "Cooling", to: 100 },
];
const START_WEIGHT = 85;

export default function LiveMonitor() {
  const [status, setStatus] = useState("IDLE");
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tele, setTele] = useState({ temp: 27.5, humidity: 62, weight: START_WEIGHT, gas: 95 });
  const [history, setHistory] = useState([]);
  const stateRef = useRef({ status });
  stateRef.current.status = status;

  useEffect(() => {
    const iv = setInterval(() => {
      if (stateRef.current.status !== "RUNNING") return;
      setElapsed((e) => e + 3);
      setProgress((p) => {
        const np = Math.min(100, p + 0.5);
        if (np >= 100) {
          setStatus("COMPLETE");
          toast.success("Drying cycle complete (simulated)");
        }
        return np;
      });
      setTele((prev) => {
        const p = Math.min(100, progress + 0.5);
        const targetTemp = p < 15 ? 62 : p < 90 ? 61 : 40;
        const next = {
          temp: prev.temp + (targetTemp - prev.temp) * 0.06 + (Math.random() - 0.5) * 0.7,
          humidity: Math.max(14, prev.humidity + (16 - prev.humidity) * 0.012 + (Math.random() - 0.5) * 0.8),
          weight: Math.max(START_WEIGHT * 0.3, prev.weight - START_WEIGHT * 0.7 * 0.005 + (Math.random() - 0.5) * 0.08),
          gas: Math.max(60, 170 + Math.sin(Date.now() / 9000) * 70 + (Math.random() - 0.5) * 30),
        };
        const pt = {
          t: `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`,
          temp: +next.temp.toFixed(1),
          humidity: +next.humidity.toFixed(1),
          weight: +next.weight.toFixed(1),
        };
        setHistory((h) => [...h.slice(-119), pt]);
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [elapsed, progress]);

  const start = () => {
    if (status === "COMPLETE" || status === "IDLE") {
      setElapsed(0); setProgress(0); setHistory([]);
      setTele({ temp: 27.5, humidity: 62, weight: START_WEIGHT, gas: 95 });
    }
    setStatus("RUNNING");
    toast.info("Drying cycle started (simulated)");
  };
  const pause = () => { setStatus("PAUSED"); toast.warning("Cycle paused (simulated)"); };
  const stop = () => { setStatus("IDLE"); setProgress(0); setElapsed(0); toast.error("Cycle stopped (simulated)"); };

  const stage = STAGES.find((s) => progress <= s.to) || STAGES[STAGES.length - 1];
  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const statusColors = { RUNNING: "text-emerald-600", PAUSED: "text-amber-600", IDLE: "text-slate-500", COMPLETE: "text-sky-600" };

  return (
    <div className="space-y-6 fade-up" data-testid="live-monitor-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Live Drying Monitor</h1>
          <p className="text-sm text-slate-500 mt-1.5">SCADA-style process view · batch <span className="font-mono text-sky-600">SDC-2026-090</span> (simulated)</p>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="start-drying-button" onClick={start} disabled={status === "RUNNING"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            <Play className="w-4 h-4" /> START
          </button>
          <button data-testid="pause-drying-button" onClick={pause} disabled={status !== "RUNNING"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            <Pause className="w-4 h-4" /> PAUSE
          </button>
          <button data-testid="stop-drying-button" onClick={stop} disabled={status === "IDLE"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            <Square className="w-4 h-4" /> STOP
          </button>
        </div>
      </div>

      <div className="sd-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="sd-label">Process Status</span>
            <span data-testid="process-status" className={`font-mono font-bold tracking-widest text-sm ${statusColors[status]}`}>{status}</span>
            <span className="text-[11px] font-mono text-slate-500">Stage: {status === "IDLE" ? "—" : stage.name}</span>
          </div>
          <span data-testid="drying-elapsed" className="font-mono text-sm text-slate-600">Elapsed {fmt(elapsed)}</span>
        </div>
        <div className="h-3 rounded-full bg-[#f1f5f9] border border-slate-200 overflow-hidden">
          <div data-testid="drying-progress-bar" className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-[width] duration-700"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {STAGES.map((s, i) => {
            const prev = i === 0 ? 0 : STAGES[i - 1].to;
            const activeStage = progress > prev && progress <= s.to && status !== "IDLE";
            const done = progress > s.to;
            return (
              <div key={s.name} className={`text-center text-[9px] sm:text-[10px] font-mono uppercase tracking-wide py-1.5 rounded ${activeStage ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : done ? "text-emerald-600" : "text-slate-600"}`}>
                {s.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sd-card p-5"><Gauge testId="temp-gauge" value={tele.temp} min={0} max={100} label="Chamber Temperature" unit="°C" warnAt={70} critAt={85} /></div>
        <div className="sd-card p-5"><Gauge testId="humidity-gauge" value={tele.humidity} min={0} max={100} label="Relative Humidity" unit="%RH" color="#38BDF8" /></div>
        <div className="sd-card p-5"><Gauge testId="gas-safety-gauge" value={tele.gas} min={0} max={1000} label="LPG Gas Detector" unit="PPM" warnAt={500} critAt={800} color="#F59E0B" /></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="telemetry-chart-card">
          <div className="flex items-center justify-between mb-4">
            <span className="sd-label">Telemetry — Temperature / Humidity / Weight</span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "RUNNING" ? "bg-emerald-400 led-pulse" : "bg-slate-600"}`} />
              {status === "RUNNING" ? "LIVE (SIMULATED)" : "STANDBY"}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "#f1f5f9", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="humidity" name="RH %" stroke="#38BDF8" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="weight" name="Weight kg" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {history.length === 0 && (
            <div className="text-center text-xs font-mono text-slate-500 -mt-40 pb-28 pointer-events-none">Press START to begin the simulated drying cycle</div>
          )}
        </div>

        <div className="sd-card p-5" data-testid="control-params-panel">
          <div className="sd-label mb-4">Control Parameters</div>
          <div className="space-y-3">
            {[
              { icon: Fan, label: "Hot-Air Blower", value: status === "RUNNING" ? "1,450 RPM" : "0 RPM", on: status === "RUNNING" },
              { icon: Flame, label: "LPG Valve Solenoid", value: status === "RUNNING" ? "OPEN" : "CLOSED", on: status === "RUNNING" },
              { icon: Scale, label: "Tray Load Balancer", value: status === "RUNNING" ? "BALANCED" : "STANDBY", on: status === "RUNNING" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-lg bg-[#f1f5f9] border border-slate-200 p-3">
                <div className="flex items-center gap-2.5">
                  <p.icon className={`w-4 h-4 ${p.on ? "text-emerald-600" : "text-slate-600"}`} />
                  <span className="text-xs text-slate-600">{p.label}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${p.on ? "text-emerald-600" : "text-slate-500"}`}>{p.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-[#f1f5f9] border border-slate-200 p-3">
            <div className="sd-label mb-2">Current Reading</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-500">Weight</div><div data-testid="monitor-weight" className="text-right text-amber-600 font-bold">{tele.weight.toFixed(1)} kg</div>
              <div className="text-slate-500">Gas</div><div data-testid="monitor-gas" className="text-right text-emerald-600 font-bold">{Math.round(tele.gas)} PPM · SAFE</div>
              <div className="text-slate-500">Setpoint</div><div className="text-right text-slate-600">62 °C</div>
              <div className="text-slate-500">Heat source</div><div className="text-right text-slate-600">LPG hot-air</div>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-mono text-slate-600 leading-relaxed">
            All values on this screen are SIMULATED / DEMO DATA — NOT PILOT RESULTS.
          </p>
        </div>
      </div>
    </div>
  );
}

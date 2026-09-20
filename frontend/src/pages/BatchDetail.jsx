import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Play, Pause, CheckCircle2, PlusCircle, QrCode, Package, Wheat,
  ClipboardList, Activity, MonitorCheck, Flag, Flame, Zap, PlugZap, Sun, BatteryCharging, FileText,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getBatch, setBatchStatus, addBatchEvent } from "@/lib/api";
import { toast } from "sonner";

const badge = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-300",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-300",
  PLANNED: "bg-slate-100 text-slate-600 border-slate-300",
};

const STAGES = [
  { label: "Raw Material", icon: Wheat },
  { label: "Batch Created", icon: ClipboardList },
  { label: "Processing", icon: Activity },
  { label: "Monitoring", icon: MonitorCheck },
  { label: "Batch Completed", icon: Flag },
  { label: "Packaging / Traceability", icon: Package },
];
const stageIndex = (s) => ({ PLANNED: 1, PROCESSING: 3, PAUSED: 3, COMPLETED: 5 }[s] ?? 1);

const EVENT_TYPES = ["Batch started", "Temperature changed", "Energy source changed", "Batch paused", "Batch resumed", "Batch completed", "Operator note"];

const fmtDT = (v) => (v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const fmtD = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const Field = ({ label, value, mono = true, testId }) => (
  <div>
    <div className="sd-label">{label}</div>
    <div className={`mt-1 text-sm text-slate-800 ${mono ? "font-mono" : "font-medium"}`} data-testid={testId}>{value ?? "—"}</div>
  </div>
);

export default function BatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);
  const [finalWeight, setFinalWeight] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[1]);
  const [eventDesc, setEventDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => getBatch(batchId).then(setBatch).catch(() => setError("Batch record not found"));
  useEffect(() => { load(); }, [batchId]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      const payload = { status };
      if (status === "COMPLETED" && finalWeight) payload.final_weight_kg = parseFloat(finalWeight);
      const updated = await setBatchStatus(batchId, payload);
      setBatch(updated);
      toast.success(`Batch ${status === "COMPLETED" ? "completed" : status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Status update failed");
    } finally {
      setBusy(false);
    }
  };

  const recordEvent = async (e) => {
    e.preventDefault();
    if (!eventDesc.trim()) { toast.error("Event description is required"); return; }
    setBusy(true);
    try {
      const updated = await addBatchEvent(batchId, { event_type: eventType, description: eventDesc.trim() });
      setBatch(updated);
      setEventDesc("");
      toast.success("Event recorded");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record event");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div data-testid="batch-detail-error" className="sd-card p-6 text-sm font-mono text-red-600">{error}</div>;
  if (!batch) return <div className="text-sm font-mono text-slate-500">Loading batch record…</div>;

  const stage = stageIndex(batch.status);
  const yieldPct = batch.final_weight_kg != null && batch.starting_weight_kg ? ((batch.final_weight_kg / batch.starting_weight_kg) * 100).toFixed(1) : null;
  const gridStatus = (batch.electrical_source || "").includes("Grid") ? "Grid connected (as configured)" : "Off-grid (as configured)";
  const solarStatus = (batch.electrical_source || "").includes("Solar") ? "Included in configuration" : "Not used";
  const batteryStatus = (batch.electrical_source || "").includes("Battery") ? "Included in configuration" : "Not used";

  return (
    <div className="space-y-6 fade-up" data-testid="batch-detail-page">
      <Link to="/history" data-testid="back-to-history" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Batch History
      </Link>

      <div className="sd-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <img src="/smartdry-logo.png" alt="SmartDry Connect™" className="h-12 w-auto mb-2.5" data-testid="batch-report-logo" />
          <div className="sd-label">Batch Record</div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="font-mono text-2xl font-extrabold text-slate-900" data-testid="detail-batch-id">{batch.batch_id}</span>
            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${badge[batch.status] || badge.PLANNED}`} data-testid="detail-status-badge">{batch.status}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">{batch.product} · Operator {batch.operator} · {fmtD(batch.start_datetime)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {batch.status === "PLANNED" && (
            <button data-testid="start-processing-btn" onClick={() => changeStatus("PROCESSING")} disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
              <Play className="w-3.5 h-3.5" /> Start Processing
            </button>
          )}
          {batch.status === "PROCESSING" && (
            <button data-testid="pause-batch-btn" onClick={() => changeStatus("PAUSED")} disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}
          {batch.status === "PAUSED" && (
            <button data-testid="resume-batch-btn" onClick={() => changeStatus("PROCESSING")} disabled={busy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
              <Play className="w-3.5 h-3.5" /> Resume
            </button>
          )}
          {(batch.status === "PROCESSING" || batch.status === "PAUSED") && (
            <div className="flex items-center gap-2">
              <input data-testid="final-weight-input" type="number" min="0" step="0.1" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)}
                placeholder="Final kg (optional)" className="sd-input w-36 py-2 text-xs font-mono" />
              <button data-testid="complete-batch-btn" onClick={() => changeStatus("COMPLETED")} disabled={busy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete Batch
              </button>
            </div>
          )}
          {batch.status === "COMPLETED" && (
            <>
              <Link to={`/report/${batch.batch_id}`} data-testid="view-report-link"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
                <FileText className="w-3.5 h-3.5" /> Batch Report
              </Link>
              <Link to={`/trace/${batch.batch_id}`} data-testid="view-passport-link"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:border-emerald-500/60 hover:text-emerald-600 text-slate-600 text-xs font-semibold transition-colors">
                <QrCode className="w-3.5 h-3.5" /> QR Passport
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="sd-card p-6" data-testid="traceability-timeline">
        <div className="sd-label mb-5">Traceability Timeline</div>
        <div className="flex items-start">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const current = i === stage && batch.status !== "COMPLETED";
            return (
              <div key={s.label} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center text-center w-full">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                    done ? "bg-emerald-600 border-emerald-600 text-white" : current ? "bg-white border-emerald-500 text-emerald-600 led-pulse" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`} data-testid={`timeline-node-${i}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className={`mt-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-wide leading-tight ${done || current ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
                    {s.label}
                  </div>
                </div>
                {i < STAGES.length - 1 && <div className={`h-0.5 flex-1 mt-4 -mx-1 rounded ${i < stage ? "bg-emerald-500" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="sd-card p-5" data-testid="section-identification">
          <div className="sd-label mb-4">Identification</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Batch ID" value={batch.batch_id} testId="id-batch-id" />
            <Field label="Product" value={batch.product} mono={false} testId="id-product" />
            <Field label="Date" value={fmtD(batch.start_datetime)} testId="id-date" />
            <Field label="Operator" value={batch.operator} mono={false} testId="id-operator" />
            <Field label="Status" value={batch.status} testId="id-status" />
            <Field label="Traceability" value={batch.traceability_status} testId="id-traceability" />
          </div>
        </div>
        <div className="sd-card p-5" data-testid="section-input">
          <div className="sd-label mb-4">Input</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Raw Material / Source" value={batch.raw_material_source || "Not specified"} mono={false} testId="input-source" />
            <Field label="Starting Weight" value={`${batch.starting_weight_kg} kg`} testId="input-weight" />
          </div>
          {batch.notes && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="sd-label">Notes</div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed" data-testid="input-notes">{batch.notes}</p>
            </div>
          )}
        </div>
        <div className="sd-card p-5" data-testid="section-energy">
          <div className="sd-label mb-4">Energy</div>
          <div className="space-y-2">
            {[
              { icon: Flame, label: "Thermal Source", value: batch.thermal_source || "Not specified", tone: "text-amber-600" },
              { icon: Zap, label: "Electrical Source", value: batch.electrical_source || "Not specified", tone: "text-sky-600" },
              { icon: PlugZap, label: "Grid Status", value: gridStatus, tone: "text-slate-500" },
              { icon: Sun, label: "Solar Status", value: solarStatus, tone: "text-sky-600" },
              { icon: BatteryCharging, label: "Battery Status", value: batteryStatus, tone: "text-emerald-600" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <r.icon className={`w-3.5 h-3.5 ${r.tone}`} /> {r.label}
                </span>
                <span className={`font-mono text-[11px] font-bold ${r.tone}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
            <Field label="LPG Consumption" value={batch.lpg_consumption_kg != null ? `${batch.lpg_consumption_kg} kg` : "—"} testId="energy-lpg" />
            <Field label="Electrical Energy" value={batch.electrical_energy_kwh != null ? `${batch.electrical_energy_kwh} kWh` : "—"} testId="energy-elec" />
          </div>
          <p className="mt-3 text-[9px] font-mono text-slate-400">Energy values are simulated estimates — not measured pilot data.</p>
        </div>
        <div className="sd-card p-5" data-testid="section-output">
          <div className="sd-label mb-4">Output</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Final Weight" value={batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "Pending completion"} testId="output-final-weight" />
            <Field label="Yield" value={yieldPct != null ? `${yieldPct}%` : "—"} testId="output-yield" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
            <Field label="Drying Method" value={batch.drying_method} mono={false} testId="output-method" />
            <Field label="Trays" value={`${batch.tray_quantity} / 24`} testId="output-trays" />
          </div>
        </div>
      </div>

      <div className="sd-card p-5" data-testid="section-processing">
        <div className="sd-label mb-4">Processing</div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Field label="Start Time" value={fmtDT(batch.start_datetime)} testId="proc-start" />
          <Field label="End Time" value={batch.end_datetime ? fmtDT(batch.end_datetime) : "In progress"} testId="proc-end" />
          <Field label="Duration" value={batch.duration_hours != null ? `${batch.duration_hours} h` : "—"} testId="proc-duration" />
        </div>
        {batch.temperature_history?.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Temperature History (°C) — simulated</div>
              <div className="h-48" data-testid="temp-history-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={batch.temperature_history} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Weight History (kg) — simulated</div>
              <div className="h-48" data-testid="weight-history-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={batch.weight_history} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="t" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-400" data-testid="no-history-note">Temperature and weight history will be recorded when the batch is completed (simulated demo data).</p>
        )}
      </div>

      <div className="sd-card p-5" data-testid="section-events">
        <div className="sd-label mb-4">Process Events</div>
        {batch.status !== "COMPLETED" && (
          <form onSubmit={recordEvent} className="flex flex-col sm:flex-row gap-2 mb-5" data-testid="event-form">
            <select data-testid="event-type-select" className="sd-input sm:w-56" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input data-testid="event-description-input" className="sd-input flex-1" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Event description — e.g. setpoint adjusted to 62 °C" />
            <button data-testid="record-event-btn" type="submit" disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors whitespace-nowrap">
              <PlusCircle className="w-3.5 h-3.5" /> Record Event
            </button>
          </form>
        )}
        <div className="space-y-2" data-testid="events-list">
          {[...(batch.events || [])].reverse().map((ev, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
              <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">{fmtDT(ev.timestamp)}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap w-fit">{ev.event_type}</span>
              <span className="text-xs text-slate-600">{ev.description}</span>
            </div>
          ))}
          {(!batch.events || batch.events.length === 0) && (
            <p className="text-xs font-mono text-slate-400">No events recorded yet.</p>
          )}
        </div>
        <p className="mt-5 text-[10px] font-mono text-amber-600 border-t border-slate-200 pt-4">
          SIMULATED / DEMO DATA — NOT PILOT RESULTS. This record demonstrates the traceability workflow; it is not a food-safety certification or regulatory record.
        </p>
      </div>
    </div>
  );
}

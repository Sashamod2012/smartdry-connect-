import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  ShieldCheck, Printer, Wheat, Activity, MonitorCheck, Flag, Package, Flame, Zap,
} from "lucide-react";
import { getBatch } from "@/lib/api";

const TIMELINE = [
  { label: "Raw Material", icon: Wheat },
  { label: "Processing", icon: Activity },
  { label: "Monitoring", icon: MonitorCheck },
  { label: "Completion", icon: Flag },
  { label: "Packaging / Batch Record", icon: Package },
];
const stageIndex = (s) => ({ PLANNED: 0, PROCESSING: 2, PAUSED: 2, COMPLETED: 4 }[s] ?? 0);

const badge = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-300",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-300",
  PLANNED: "bg-slate-100 text-slate-600 border-slate-300",
};

const fmtD = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—");

const Field = ({ label, value, testId, accent = "text-slate-800" }) => (
  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-3">
    <div className="sd-label">{label}</div>
    <div className={`mt-1 text-sm font-mono font-semibold ${accent}`} data-testid={testId}>{value ?? "—"}</div>
  </div>
);

export default function TraceRecord() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBatch(batchId).then(setBatch).catch(() => setError("Batch record not found"));
  }, [batchId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <div data-testid="trace-error" className="sd-card p-8 text-sm font-mono text-red-600 max-w-md text-center">{error}</div>
      </div>
    );
  }
  if (!batch) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <span className="text-xs font-mono text-slate-500 tracking-widest">LOADING BATCH RECORD…</span>
      </div>
    );
  }

  const stage = stageIndex(batch.status);
  const temps = (batch.temperature_history || []).map((p) => p.value);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-8 px-4" data-testid="trace-record-page">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="no-print flex justify-end">
          <button data-testid="print-passport-btn" onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </button>
        </div>

        <div className="sd-card overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-200 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <img src="/smartdry-logo.png" alt="SmartDry Connect™" className="h-16 w-auto" data-testid="passport-logo" />
              <div className="text-[10px] font-mono text-slate-500 mt-1.5">Batch Traceability Record · Adebobo Dynamic Resources</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0">
              <QRCode value={`${window.location.origin}/trace/${batch.batch_id}`} size={72} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-mono text-xl font-extrabold text-sky-600" data-testid="passport-batch-id">{batch.batch_id}</span>
              <span className={`ml-auto px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${badge[batch.status] || badge.PLANNED}`} data-testid="passport-status">
                {batch.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Product" value={batch.product} testId="passport-product" accent="text-slate-900" />
              <Field label="Processing Date" value={fmtD(batch.start_datetime)} testId="passport-date" />
              <Field label="Starting Weight" value={`${batch.starting_weight_kg} kg`} testId="passport-start-weight" />
              <Field label="Final Weight" value={batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "In progress"} testId="passport-final-weight" />
              <Field label="Processing Duration" value={batch.duration_hours != null ? `${batch.duration_hours} h` : "In progress"} testId="passport-duration" />
              <Field label="Batch Status" value={batch.status} testId="passport-status-field" accent="text-emerald-700" />
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-3">
                <div className="sd-label flex items-center gap-1.5"><Flame className="w-3 h-3 text-amber-600" /> Thermal Source</div>
                <div className="mt-1 text-sm font-mono font-semibold text-amber-700" data-testid="passport-thermal">{batch.thermal_source || "Not specified"}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-3">
                <div className="sd-label flex items-center gap-1.5"><Zap className="w-3 h-3 text-sky-600" /> Electrical Source</div>
                <div className="mt-1 text-sm font-mono font-semibold text-sky-700" data-testid="passport-electrical">{batch.electrical_source || "Not specified"}</div>
              </div>
              <Field label="Traceability" value={batch.traceability_status} testId="passport-traceability" accent="text-emerald-700" />
            </div>

            <div data-testid="passport-timeline">
              <div className="sd-label mb-4">Batch Journey</div>
              <div className="flex items-start">
                {TIMELINE.map((s, i) => {
                  const done = i <= stage;
                  return (
                    <div key={s.label} className="flex items-start flex-1 min-w-0">
                      <div className="flex flex-col items-center text-center w-full">
                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${
                          done ? "bg-emerald-600 border-emerald-600 text-white" : "bg-slate-50 border-slate-200 text-slate-400"
                        }`} data-testid={`passport-timeline-node-${i}`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        <div className={`mt-2 text-[8px] sm:text-[9px] font-mono uppercase tracking-wide leading-tight ${done ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
                          {s.label}
                        </div>
                      </div>
                      {i < TIMELINE.length - 1 && <div className={`h-0.5 flex-1 mt-4 -mx-1 rounded ${i < stage ? "bg-emerald-500" : "bg-slate-200"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4" data-testid="passport-monitoring">
              <div className="sd-label mb-2">Monitoring Information</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="font-mono text-sm font-bold text-emerald-700">{avgTemp != null ? `${avgTemp} °C` : "—"}</div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Avg Chamber Temp</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-sky-700">{temps.length || "—"}</div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Sensor Readings</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-slate-700">{(batch.events || []).length || "—"}</div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Logged Events</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
                Chamber temperature, product weight and gas safety were monitored throughout the cycle by the SmartDry Connect™
                ESP32 sensor layer on a hybrid LPG hot-air drying system with solar/battery-powered controls.
                This record links the physical product to its digital batch history.
              </p>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3" data-testid="passport-demo-notice">
              <p className="text-[10px] font-mono font-semibold tracking-wider text-amber-700 text-center">
                SIMULATED / DEMO DATA — NOT PILOT RESULTS
              </p>
              <p className="text-[9px] font-mono text-amber-600 text-center mt-1">
                Prototype traceability record. Awaiting connection to the SmartDry production database.
              </p>
            </div>

            <div className="text-center text-[9px] font-mono text-slate-400">
              SmartDry Connect™ — Monitor. Trace. Grow. · Powered by Adebobo Dynamic Resources
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

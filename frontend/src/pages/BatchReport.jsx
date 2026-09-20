import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { getBatch } from "@/lib/api";

const badge = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-300",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-300",
  PLANNED: "bg-slate-100 text-slate-600 border-slate-300",
};

const fmtD = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—");
const fmtDT = (v) => (v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

const Section = ({ num, title, children, testId }) => (
  <div data-testid={testId}>
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-5 h-5 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">{num}</span>
      <span className="sd-label">{title}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
    {children}
  </div>
);

const Row = ({ label, value, testId }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="font-mono text-xs font-bold text-slate-800 text-right" data-testid={testId}>{value ?? "—"}</span>
  </div>
);

export default function BatchReport() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBatch(batchId).then(setBatch).catch(() => setError("Batch record not found"));
  }, [batchId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <div data-testid="report-error" className="sd-card p-8 text-sm font-mono text-red-600">{error}</div>
      </div>
    );
  }
  if (!batch) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6">
        <span className="text-xs font-mono text-slate-500 tracking-widest">GENERATING BATCH REPORT…</span>
      </div>
    );
  }

  const temps = (batch.temperature_history || []).map((p) => p.value);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;
  const minTemp = temps.length ? Math.min(...temps).toFixed(1) : null;
  const maxTemp = temps.length ? Math.max(...temps).toFixed(1) : null;
  const yieldPct = batch.final_weight_kg != null && batch.starting_weight_kg ? ((batch.final_weight_kg / batch.starting_weight_kg) * 100).toFixed(1) : null;
  const moistureRemoved = batch.final_weight_kg != null ? (batch.starting_weight_kg - batch.final_weight_kg).toFixed(1) : null;
  const elec = batch.electrical_source || "";
  const solarStatus = elec.includes("Solar") ? "Included in configuration" : "Not used";
  const batteryStatus = elec.includes("Battery") ? "Included in configuration" : "Not used";
  const gridStatus = elec.includes("Grid") ? "Grid connected (as configured)" : "OFF";
  const totalKwh = batch.lpg_consumption_kg != null ? (batch.lpg_consumption_kg * 12.8 + (batch.electrical_energy_kwh || 0)) : null;
  const kwhPerKg = totalKwh != null && batch.final_weight_kg ? (totalKwh / batch.final_weight_kg).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-[#f4f6f8] py-8 px-4" data-testid="batch-report-page">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="no-print flex items-center justify-between">
          <Link to={`/batches/${batch.batch_id}`} data-testid="report-back-link"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Batch Record
          </Link>
          <button data-testid="report-print-btn" onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print / Download PDF
          </button>
        </div>

        <div className="sd-card overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-200 px-7 py-6 flex items-center justify-between gap-4">
            <div>
              <img src="/smartdry-logo.png" alt="SmartDry Connect™" className="h-16 w-auto" data-testid="report-logo" />
              <div className="mt-2 text-sm font-extrabold tracking-[0.2em] text-slate-800">DIGITAL BATCH RECORD</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Adebobo Dynamic Resources · Monitor. Trace. Grow.</div>
            </div>
            <div className="text-center shrink-0">
              <div className="bg-white p-2 rounded-lg border border-slate-200 inline-block">
                <QRCode value={`${window.location.origin}/trace/${batch.batch_id}`} size={80} />
              </div>
              <div className="text-[8px] font-mono text-slate-500 mt-1.5">SCAN FOR DIGITAL RECORD</div>
            </div>
          </div>

          <div className="px-7 py-6 space-y-7">
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-mono text-xl font-extrabold text-sky-600" data-testid="report-batch-id">{batch.batch_id}</span>
              <span className={`ml-auto px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${badge[batch.status] || badge.PLANNED}`} data-testid="report-status">
                {batch.status}
              </span>
            </div>

            <Section num="1" title="Batch Identification" testId="report-section-identification">
              <div className="grid sm:grid-cols-2 gap-x-8">
                <Row label="Batch ID" value={batch.batch_id} testId="report-id" />
                <Row label="Product" value={batch.product} testId="report-product" />
                <Row label="Processing Date" value={fmtD(batch.start_datetime)} testId="report-date" />
                <Row label="Operator" value={batch.operator} testId="report-operator" />
              </div>
            </Section>

            <Section num="2" title="Process Summary" testId="report-section-process">
              <div className="grid sm:grid-cols-2 gap-x-8">
                <Row label="Starting Weight" value={`${batch.starting_weight_kg} kg`} testId="report-start-weight" />
                <Row label="Final Weight" value={batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "In progress"} testId="report-final-weight" />
                <Row label="Processing Duration" value={batch.duration_hours != null ? `${batch.duration_hours} h` : "In progress"} testId="report-duration" />
                <Row label="Processing Window" value={`${fmtDT(batch.start_datetime)} → ${batch.end_datetime ? fmtDT(batch.end_datetime) : "—"}`} testId="report-window" />
              </div>
            </Section>

            <Section num="3" title="Energy Configuration & Consumption" testId="report-section-energy">
              <div className="grid sm:grid-cols-2 gap-x-8">
                <Row label="Thermal Source" value={batch.thermal_source || "Not specified"} testId="report-thermal" />
                <Row label="Electrical Source" value={batch.electrical_source || "Not specified"} testId="report-electrical" />
                <Row label="Solar Status" value={solarStatus} testId="report-solar" />
                <Row label="Battery Status" value={batteryStatus} testId="report-battery" />
                <Row label="Grid Status" value={gridStatus} testId="report-grid" />
                <Row label="LPG Consumption" value={batch.lpg_consumption_kg != null ? `${batch.lpg_consumption_kg} kg` : "—"} testId="report-lpg" />
                <Row label="Electrical Energy" value={batch.electrical_energy_kwh != null ? `${batch.electrical_energy_kwh} kWh` : "—"} testId="report-elec-kwh" />
                <Row label="Energy per kg Output" value={kwhPerKg != null ? `${kwhPerKg} kWh-eq/kg` : "Insufficient data"} testId="report-kwh-per-kg" />
              </div>
            </Section>

            <div className="grid sm:grid-cols-2 gap-7">
              <Section num="4" title="Temperature Summary" testId="report-section-temperature">
                <Row label="Average Chamber Temp" value={avgTemp != null ? `${avgTemp} °C` : "—"} testId="report-temp-avg" />
                <Row label="Minimum" value={minTemp != null ? `${minTemp} °C` : "—"} testId="report-temp-min" />
                <Row label="Maximum" value={maxTemp != null ? `${maxTemp} °C` : "—"} testId="report-temp-max" />
                <Row label="Sensor Readings" value={temps.length || "—"} testId="report-temp-readings" />
              </Section>
              <Section num="5" title="Weight Summary" testId="report-section-weight">
                <Row label="Starting Weight" value={`${batch.starting_weight_kg} kg`} testId="report-w-start" />
                <Row label="Final Weight" value={batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "—"} testId="report-w-final" />
                <Row label="Moisture Removed" value={moistureRemoved != null ? `${moistureRemoved} kg` : "—"} testId="report-moisture" />
                <Row label="Weight Readings" value={(batch.weight_history || []).length || "—"} testId="report-w-readings" />
              </Section>
            </div>

            <Section num="6" title="Processing Events" testId="report-section-events">
              <div className="space-y-1.5" data-testid="report-events-list">
                {(batch.events || []).map((ev, i) => (
                  <div key={i} className="flex items-baseline gap-3 text-xs">
                    <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">{fmtDT(ev.timestamp)}</span>
                    <span className="font-mono font-bold text-emerald-700 uppercase text-[9px] tracking-wider whitespace-nowrap">{ev.event_type}</span>
                    <span className="text-slate-600">{ev.description}</span>
                  </div>
                ))}
                {(!batch.events || batch.events.length === 0) && <p className="text-xs font-mono text-slate-400">No events recorded.</p>}
              </div>
            </Section>

            <Section num="7" title="Final Output / Yield" testId="report-section-output">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                  <div className="font-mono text-lg font-extrabold text-slate-800" data-testid="report-out-final">{batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "—"}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">Final Output</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                  <div className="font-mono text-lg font-extrabold text-emerald-700" data-testid="report-out-yield">{yieldPct != null ? `${yieldPct}%` : "—"}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">Product Yield</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                  <div className="font-mono text-lg font-extrabold text-sky-700" data-testid="report-out-trace">{batch.traceability_status}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">Traceability</div>
                </div>
              </div>
            </Section>

            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3" data-testid="report-demo-notice">
              <p className="text-[10px] font-mono font-semibold tracking-wider text-amber-700 text-center">
                SIMULATED / DEMO DATA — NOT PILOT RESULTS
              </p>
              <p className="text-[9px] font-mono text-amber-600 text-center mt-1 leading-relaxed">
                This document is a demonstration batch record generated by the SmartDry Connect™ platform.
                It is not a food-safety certification, regulatory document, or measured performance claim.
              </p>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-4">
              <span>SmartDry Connect™ — Monitor. Trace. Grow.</span>
              <span>Powered by Adebobo Dynamic Resources</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

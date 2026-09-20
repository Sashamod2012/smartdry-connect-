import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { ShieldCheck, ArrowLeft, Wind } from "lucide-react";
import { getBatch } from "@/lib/api";

export default function TraceRecord() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBatch(batchId).then(setBatch).catch(() => setError("Batch record not found"));
  }, [batchId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-up" data-testid="trace-record-page">
      <Link to="/traceability" data-testid="back-to-traceability" className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to QR Traceability
      </Link>

      {error && <div data-testid="trace-error" className="sd-card p-6 text-sm font-mono text-red-600">{error}</div>}

      {batch && (
        <div className="sd-card overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-slate-200 px-6 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900 tracking-tight">SmartDry Connect™ Batch Passport</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Digital provenance record · Adebobo Dynamic Resources</div>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <QRCode value={`${window.location.origin}/trace/${batch.batch_id}`} size={64} />
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-lg font-bold text-sky-600" data-testid="passport-batch-id">{batch.batch_id}</span>
              <span className="ml-auto px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-wider" data-testid="passport-status">
                {batch.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><div className="sd-label">Product</div><div className="text-slate-800 font-semibold mt-1" data-testid="passport-product">{batch.product}</div></div>
              <div><div className="sd-label">Processing Date</div><div className="font-mono text-slate-600 mt-1">{new Date(batch.start_datetime).toLocaleString("en-GB")}</div></div>
              <div><div className="sd-label">Starting Weight</div><div className="font-mono text-slate-600 mt-1">{batch.starting_weight_kg} kg</div></div>
              <div><div className="sd-label">Final Weight</div><div className="font-mono text-slate-600 mt-1">{batch.final_weight_kg != null ? `${batch.final_weight_kg} kg` : "In progress"}</div></div>
              <div><div className="sd-label">Drying Duration</div><div className="font-mono text-slate-600 mt-1">{batch.duration_hours != null ? `${batch.duration_hours} h` : "In progress"}</div></div>
              <div><div className="sd-label">Tray Quantity</div><div className="font-mono text-slate-600 mt-1">{batch.tray_quantity}</div></div>
              <div><div className="sd-label">Operator</div><div className="text-slate-600 mt-1">{batch.operator}</div></div>
              <div><div className="sd-label">Traceability Status</div><div className="font-mono text-emerald-600 mt-1">{batch.traceability_status}</div></div>
              <div className="col-span-2"><div className="sd-label">Processing Method</div><div className="text-slate-600 mt-1">{batch.drying_method}</div></div>
            </div>
            <div className="mt-6 rounded-lg bg-[#f1f5f9] border border-slate-200 p-4">
              <div className="sd-label mb-1.5">Traceability Information</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Processed with the SmartDry Connect™ hybrid LPG hot-air drying system. Chamber climate, product weight and gas safety
                were monitored throughout the cycle by the ESP32 sensor layer. This passport links the physical product to its
                digital batch record for quality assurance and buyer verification.
              </p>
            </div>
            <p className="mt-4 text-[10px] font-mono text-amber-600/80">
              PROTOTYPE / DEMO TRACEABILITY RECORD — SIMULATED DATA, NOT PILOT RESULTS. Awaiting connection to the production database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

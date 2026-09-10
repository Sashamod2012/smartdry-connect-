import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { Download, QrCode as QrIcon, ShieldCheck } from "lucide-react";
import { getBatches } from "@/lib/api";

export default function Traceability() {
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getBatches().then((b) => {
      setBatches(b);
      setSelected(b.find((x) => x.status === "COMPLETE") || b[0] || null);
    }).catch(() => {});
  }, []);

  const traceUrl = (id) => `${window.location.origin}/trace/${id}`;

  const downloadQR = () => {
    const svg = document.querySelector('[data-testid="qr-code-canvas"] svg');
    if (!svg || !selected) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 512;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.download = `${selected.batch_id}-traceability-qr.png`;
      a.href = c.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(data);
  };

  return (
    <div className="space-y-6 fade-up" data-testid="traceability-page">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">QR Traceability</h1>
        <p className="text-sm text-slate-400 mt-1.5 max-w-3xl">
          Every batch receives a unique, scannable QR passport linking to its digital provenance record.
          Prototype/demo traceability system — pending connection to the production database.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="sd-card p-5 lg:col-span-2" data-testid="qr-generator-card">
          <div className="sd-label mb-3">Select Batch</div>
          <select data-testid="trace-batch-select" className="sd-input font-mono mb-5"
            value={selected?.batch_id || ""} onChange={(e) => setSelected(batches.find((b) => b.batch_id === e.target.value))}>
            {batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_id} — {b.product}</option>)}
          </select>

          {selected && (
            <>
              <div className="flex justify-center">
                <div data-testid="qr-code-canvas" className="bg-white p-4 rounded-xl border-4 border-emerald-500/30">
                  <QRCode value={traceUrl(selected.batch_id)} size={180} />
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="font-mono font-bold text-sky-400">{selected.batch_id}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1 break-all">{traceUrl(selected.batch_id)}</div>
              </div>
              <div className="flex gap-2 mt-5">
                <button data-testid="download-qr-btn" onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download QR (PNG)
                </button>
                <Link to={`/trace/${selected.batch_id}`} data-testid="open-passport-btn"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 hover:border-sky-500/50 hover:text-sky-400 text-slate-300 text-xs font-semibold transition-colors">
                  <QrIcon className="w-3.5 h-3.5" /> Open Passport
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="sd-card p-5 lg:col-span-3" data-testid="trace-record-preview">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="sd-label">Traceability Record Preview</span>
          </div>
          {selected ? (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><div className="sd-label">Product</div><div className="text-slate-100 mt-1 font-semibold">{selected.product}</div></div>
              <div><div className="sd-label">Batch ID</div><div className="font-mono text-sky-400 mt-1 font-bold">{selected.batch_id}</div></div>
              <div><div className="sd-label">Processing Date</div><div className="font-mono text-slate-300 mt-1">{new Date(selected.start_datetime).toLocaleString("en-GB")}</div></div>
              <div><div className="sd-label">Processing Status</div><div className="font-mono text-emerald-400 mt-1">{selected.status}</div></div>
              <div><div className="sd-label">Starting Weight</div><div className="font-mono text-slate-300 mt-1">{selected.starting_weight_kg} kg</div></div>
              <div><div className="sd-label">Final Weight</div><div className="font-mono text-slate-300 mt-1">{selected.final_weight_kg != null ? `${selected.final_weight_kg} kg` : "In progress"}</div></div>
              <div><div className="sd-label">Drying Duration</div><div className="font-mono text-slate-300 mt-1">{selected.duration_hours != null ? `${selected.duration_hours} h` : "In progress"}</div></div>
              <div><div className="sd-label">Traceability</div><div className="font-mono text-emerald-400 mt-1">{selected.traceability_status}</div></div>
              <div className="sm:col-span-2"><div className="sd-label">Drying Method</div><div className="text-slate-300 mt-1">{selected.drying_method}</div></div>
            </div>
          ) : (
            <div className="text-sm font-mono text-slate-500">Loading batches…</div>
          )}
          <p className="mt-5 text-[10px] font-mono text-slate-600 leading-relaxed border-t border-white/[0.06] pt-4">
            Prototype/demo traceability system. Records will sync with the real SmartDry production database when the
            physical dryer fleet comes online.
          </p>
        </div>
      </div>

      <div className="sd-card p-5">
        <div className="sd-label mb-4">All Batch Passports</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {batches.map((b) => (
            <button key={b.batch_id} data-testid={`qr-card-${b.batch_id}`} onClick={() => setSelected(b)}
              className={`rounded-xl border p-3 text-left transition-[border-color,transform] duration-150 hover:-translate-y-0.5 ${
                selected?.batch_id === b.batch_id ? "border-emerald-500/50 bg-emerald-600/[0.08]" : "border-white/[0.08] bg-[#0d1322] hover:border-emerald-500/30"
              }`}>
              <div className="bg-white rounded-md p-1.5 flex justify-center">
                <QRCode value={traceUrl(b.batch_id)} size={72} />
              </div>
              <div className="mt-2 font-mono text-[11px] font-bold text-sky-400">{b.batch_id}</div>
              <div className="text-[10px] text-slate-500">{b.product} · {b.status}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

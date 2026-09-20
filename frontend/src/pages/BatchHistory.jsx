import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Search, FileText } from "lucide-react";
import { getBatches } from "@/lib/api";

const badge = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-300",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-300",
  PLANNED: "bg-slate-100 text-slate-600 border-slate-300",
  COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-300",
  RUNNING: "bg-sky-50 text-sky-700 border-sky-300",
};

export default function BatchHistory() {
  const [batches, setBatches] = useState([]);
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("All");

  useEffect(() => {
    getBatches().then(setBatches).catch(() => {});
  }, []);

  const products = useMemo(() => ["All", ...new Set(batches.map((b) => b.product))], [batches]);
  const filtered = batches.filter(
    (b) =>
      (productFilter === "All" || b.product === productFilter) &&
      (b.batch_id.toLowerCase().includes(query.toLowerCase()) || b.operator.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6 fade-up" data-testid="batch-history-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Batch History</h1>
          <p className="text-sm text-slate-500 mt-1.5">Historical drying records with traceability status. Demo dataset stored in the platform database.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input data-testid="history-search-input" className="sd-input pl-8 w-full sm:w-48" placeholder="Search batch / operator" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select data-testid="history-product-filter" className="sd-input flex-1 sm:flex-none sm:w-36" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            {products.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="sd-card overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="batch-history-table" className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                {["Batch ID", "Product", "Start Wt", "Final Wt", "Duration", "Status", "Date", "Traceability", ""].map((h) => (
                  <th key={h} className="px-4 py-3 sd-label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.batch_id} data-testid={`batch-row-${b.batch_id}`} className="border-b border-white/[0.04] hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-sky-600 whitespace-nowrap">{b.batch_id}</td>
                  <td className="px-4 py-3 text-slate-700">{b.product}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{b.starting_weight_kg} kg</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{b.final_weight_kg != null ? `${b.final_weight_kg} kg` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{b.duration_hours != null ? `${b.duration_hours} h` : "In progress"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${badge[b.status] || badge.PROCESSING}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{new Date(b.start_datetime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono font-bold ${b.traceability_status === "QR Issued" ? "text-emerald-600" : "text-amber-600"}`}>{b.traceability_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/batches/${b.batch_id}`} data-testid={`open-batch-${b.batch_id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Open
                      </Link>
                      <Link to={`/trace/${b.batch_id}`} data-testid={`view-qr-${b.batch_id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors">
                        <QrCode className="w-3.5 h-3.5" /> QR
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm font-mono text-slate-500">No batches match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] font-mono text-slate-600">All records shown are demo data for illustration — SIMULATED / DEMO DATA — NOT PILOT RESULTS.</p>
    </div>
  );
}

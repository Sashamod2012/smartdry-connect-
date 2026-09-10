import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { createBatch, getBatches } from "@/lib/api";
import { toast } from "sonner";

const PRODUCTS = ["Catfish", "Vegetables", "Fruits", "Ginger", "Pepper", "Tomatoes", "Herbs", "Grains"];
const METHODS = [
  "Hybrid LPG Hot-Air (Solar-Assist Controls)",
  "LPG Boost Mode",
  "Solar-Assist Eco Mode",
];

export default function NewBatch() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    batch_id: "",
    product: "Catfish",
    starting_weight_kg: "",
    tray_quantity: 24,
    operator: "",
    drying_method: METHODS[0],
    start_datetime: new Date().toISOString().slice(0, 16),
  });
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBatches().then((batches) => {
      const nums = batches.map((b) => parseInt(b.batch_id.split("-").pop(), 10)).filter(Number.isFinite);
      const next = (nums.length ? Math.max(...nums) : 90) + 1;
      setForm((f) => ({ ...f, batch_id: `SDC-2026-${String(next).padStart(3, "0")}` }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.operator.trim() || !form.starting_weight_kg) {
      toast.error("Operator and starting weight are required");
      return;
    }
    setSubmitting(true);
    try {
      const batch = await createBatch({
        batch_id: form.batch_id.trim() || undefined,
        product: form.product,
        starting_weight_kg: parseFloat(form.starting_weight_kg),
        tray_quantity: parseInt(form.tray_quantity, 10),
        operator: form.operator.trim(),
        drying_method: form.drying_method,
        start_datetime: new Date(form.start_datetime).toISOString(),
      });
      setCreated(batch);
      toast.success(`Batch ${batch.batch_id} registered & started`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-up max-w-3xl" data-testid="new-batch-page">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">New Batch Registration</h1>
        <p className="text-sm text-slate-400 mt-1.5">Register a drying batch. A traceable batch record is created and the cycle enters the live monitor.</p>
      </div>

      <form data-testid="new-batch-form" onSubmit={submit} className="sd-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="sd-label block mb-1.5">Batch ID</label>
            <input data-testid="batch-id-input" className="sd-input font-mono" value={form.batch_id} onChange={set("batch_id")} placeholder="SDC-2026-091" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Product</label>
            <select data-testid="product-select" className="sd-input" value={form.product} onChange={set("product")}>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="sd-label block mb-1.5">Starting Weight (kg)</label>
            <input data-testid="starting-weight-input" type="number" min="1" step="0.1" className="sd-input font-mono" value={form.starting_weight_kg} onChange={set("starting_weight_kg")} placeholder="e.g. 85" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Tray Quantity</label>
            <input data-testid="tray-quantity-input" type="number" min="1" max="24" className="sd-input font-mono" value={form.tray_quantity} onChange={set("tray_quantity")} />
            <p className="text-[10px] font-mono text-slate-600 mt-1">SmartDry commercial configuration: up to 24 trays</p>
          </div>
          <div>
            <label className="sd-label block mb-1.5">Operator</label>
            <input data-testid="operator-input" className="sd-input" value={form.operator} onChange={set("operator")} placeholder="e.g. A. Balogun" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Drying Method</label>
            <select data-testid="drying-method-select" className="sd-input" value={form.drying_method} onChange={set("drying_method")}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="sd-label block mb-1.5">Start Date / Time</label>
            <input data-testid="start-datetime-input" type="datetime-local" className="sd-input font-mono" value={form.start_datetime} onChange={set("start_datetime")} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button data-testid="new-batch-submit-btn" type="submit" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            <PlusCircle className="w-4 h-4" /> {submitting ? "Registering…" : "Register & Start Batch"}
          </button>
          <span className="text-[10px] font-mono text-slate-600">Demo environment — record stored in platform database</span>
        </div>
      </form>

      {created && (
        <div data-testid="batch-created-card" className="sd-card p-6 border-emerald-500/40 fade-up">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-4">
            <CheckCircle2 className="w-4 h-4" /> Batch record created
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><div className="sd-label">Batch ID</div><div className="font-mono font-bold text-sky-400 mt-1">{created.batch_id}</div></div>
            <div><div className="sd-label">Product</div><div className="text-slate-200 mt-1">{created.product}</div></div>
            <div><div className="sd-label">Starting Weight</div><div className="font-mono text-slate-200 mt-1">{created.starting_weight_kg} kg</div></div>
            <div><div className="sd-label">Trays</div><div className="font-mono text-slate-200 mt-1">{created.tray_quantity}</div></div>
            <div><div className="sd-label">Operator</div><div className="text-slate-200 mt-1">{created.operator}</div></div>
            <div><div className="sd-label">Status</div><div className="font-mono text-emerald-400 mt-1">{created.status}</div></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/monitor" data-testid="goto-monitor-after-create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
              Open Live Monitor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => navigate(`/trace/${created.batch_id}`)} data-testid="goto-trace-after-create"
              className="px-4 py-2 rounded-lg border border-white/15 hover:border-sky-500/50 hover:text-sky-400 text-slate-300 text-xs font-semibold transition-colors">
              View QR Traceability Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

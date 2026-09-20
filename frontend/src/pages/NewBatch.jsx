import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { createBatch, getBatches } from "@/lib/api";
import { toast } from "sonner";

const PRODUCTS = ["Catfish", "Vegetables", "Fruits", "Ginger", "Pepper", "Tomatoes", "Herbs", "Grains"];
const THERMAL_SOURCES = ["LPG", "Other", "Not specified"];
const ELECTRICAL_SOURCES = ["Solar + Battery", "Grid", "Solar + Battery + Grid", "Battery", "Not specified"];

export default function NewBatch() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    batch_id: "",
    product: "Catfish",
    raw_material_source: "",
    starting_weight_kg: "",
    start_datetime: new Date().toISOString().slice(0, 10),
    operator: "",
    thermal_source: "LPG",
    electrical_source: "Solar + Battery",
    notes: "",
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
        raw_material_source: form.raw_material_source.trim() || null,
        starting_weight_kg: parseFloat(form.starting_weight_kg),
        operator: form.operator.trim(),
        thermal_source: form.thermal_source,
        electrical_source: form.electrical_source,
        notes: form.notes.trim() || null,
        start_datetime: new Date(form.start_datetime).toISOString(),
      });
      setCreated(batch);
      toast.success(`Batch ${batch.batch_id} created — status PLANNED`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-up max-w-3xl" data-testid="new-batch-page">
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Create New Batch</h1>
        <p className="text-sm text-slate-500 mt-1.5">Register a dehydration batch. A digital traceability record is created with status PLANNED — open the batch record to start processing.</p>
      </div>

      <form data-testid="new-batch-form" onSubmit={submit} className="sd-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="sd-label block mb-1.5">Batch ID (auto-generated)</label>
            <div className="relative">
              <input data-testid="batch-id-input" className="sd-input font-mono pr-9 bg-slate-50" value={form.batch_id} readOnly />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="sd-label block mb-1.5">Product</label>
            <select data-testid="product-select" className="sd-input" value={form.product} onChange={set("product")}>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="sd-label block mb-1.5">Raw Material / Source</label>
            <input data-testid="raw-material-input" className="sd-input" value={form.raw_material_source} onChange={set("raw_material_source")} placeholder="e.g. Farm cluster, supplier or origin" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Starting Weight (kg)</label>
            <input data-testid="starting-weight-input" type="number" min="1" step="0.1" className="sd-input font-mono" value={form.starting_weight_kg} onChange={set("starting_weight_kg")} placeholder="e.g. 85" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Processing Date</label>
            <input data-testid="processing-date-input" type="date" className="sd-input font-mono" value={form.start_datetime} onChange={set("start_datetime")} />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Operator</label>
            <input data-testid="operator-input" className="sd-input" value={form.operator} onChange={set("operator")} placeholder="e.g. A. Balogun" />
          </div>
          <div>
            <label className="sd-label block mb-1.5">Thermal Source</label>
            <select data-testid="thermal-source-select" className="sd-input" value={form.thermal_source} onChange={set("thermal_source")}>
              {THERMAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="sd-label block mb-1.5">Electrical Source</label>
            <select data-testid="electrical-source-select" className="sd-input" value={form.electrical_source} onChange={set("electrical_source")}>
              {ELECTRICAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="sd-label block mb-1.5">Notes</label>
            <textarea data-testid="notes-input" rows={3} className="sd-input resize-none" value={form.notes} onChange={set("notes")} placeholder="Optional batch notes — moisture targets, quality observations, handling instructions" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button data-testid="new-batch-submit-btn" type="submit" disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            <PlusCircle className="w-4 h-4" /> {submitting ? "Creating…" : "Create Batch Record"}
          </button>
          <span className="text-[10px] font-mono text-slate-400">Record stored in platform database · demo environment</span>
        </div>
      </form>

      {created && (
        <div data-testid="batch-created-card" className="sd-card p-6 border-emerald-300 fade-up">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
            <CheckCircle2 className="w-4 h-4" /> Batch record created
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><div className="sd-label">Batch ID</div><div className="font-mono font-bold text-sky-600 mt-1">{created.batch_id}</div></div>
            <div><div className="sd-label">Product</div><div className="text-slate-700 mt-1">{created.product}</div></div>
            <div><div className="sd-label">Starting Weight</div><div className="font-mono text-slate-700 mt-1">{created.starting_weight_kg} kg</div></div>
            <div><div className="sd-label">Thermal Source</div><div className="text-slate-700 mt-1">{created.thermal_source}</div></div>
            <div><div className="sd-label">Electrical Source</div><div className="text-slate-700 mt-1">{created.electrical_source}</div></div>
            <div><div className="sd-label">Status</div><div className="font-mono text-slate-600 mt-1">{created.status}</div></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button onClick={() => navigate(`/batches/${created.batch_id}`)} data-testid="goto-batch-detail"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
              Open Batch Record <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

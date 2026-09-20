export const StatCard = ({ icon: Icon, label, value, unit, sub, accent = "text-emerald-600", testId }) => (
  <div data-testid={testId} className="sd-card sd-card-hover p-5 relative overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-50 ${accent.replace("text-", "bg-")}`} />
    <div className="flex items-center justify-between">
      <span className="sd-label">{label}</span>
      {Icon && (
        <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Icon className={`w-3.5 h-3.5 ${accent}`} />
        </div>
      )}
    </div>
    <div className="mt-3.5 flex items-baseline gap-1.5">
      <span className={`font-mono text-2xl lg:text-[28px] font-extrabold tracking-tight ${accent}`}>{value}</span>
      {unit && <span className="text-[11px] font-mono text-slate-500">{unit}</span>}
    </div>
    {sub && <div className="mt-1.5 text-[10px] font-mono text-slate-500 truncate">{sub}</div>}
  </div>
);

export const StatusLed = ({ level = "ok", label }) => {
  const colors = { ok: "bg-emerald-400 text-emerald-600", warn: "bg-amber-400 text-amber-600", alert: "bg-red-400 text-red-600", idle: "bg-slate-500 text-slate-500" };
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full led-pulse ${colors[level]}`} />
      <span className="text-xs font-mono text-slate-600">{label}</span>
    </span>
  );
};

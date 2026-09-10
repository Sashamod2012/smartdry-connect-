export const StatCard = ({ icon: Icon, label, value, unit, sub, accent = "text-emerald-400", testId }) => (
  <div data-testid={testId} className="sd-card sd-card-hover p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <span className="sd-label">{label}</span>
      {Icon && <Icon className={`w-4 h-4 ${accent}`} />}
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className={`font-mono text-2xl lg:text-3xl font-extrabold tracking-tight ${accent}`}>{value}</span>
      {unit && <span className="text-xs font-mono text-slate-500">{unit}</span>}
    </div>
    {sub && <div className="mt-1.5 text-[11px] font-mono text-slate-500">{sub}</div>}
  </div>
);

export const StatusLed = ({ level = "ok", label }) => {
  const colors = { ok: "bg-emerald-400 text-emerald-400", warn: "bg-amber-400 text-amber-400", alert: "bg-red-400 text-red-400", idle: "bg-slate-500 text-slate-500" };
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full led-pulse ${colors[level]}`} />
      <span className="text-xs font-mono text-slate-300">{label}</span>
    </span>
  );
};

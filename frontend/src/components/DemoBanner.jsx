import { AlertTriangle } from "lucide-react";

export const DemoBanner = () => (
  <div
    data-testid="demo-data-banner"
    className="demo-stripes sticky top-0 lg:top-0 z-30 bg-[#14100a]/95 backdrop-blur border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2"
  >
    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider text-amber-300 text-center">
      SIMULATED / DEMO DATA — NOT PILOT RESULTS
    </span>
  </div>
);

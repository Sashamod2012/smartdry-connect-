import { AlertTriangle } from "lucide-react";

export const DemoBanner = () => (
  <div
    data-testid="demo-data-banner"
    className="sticky top-0 z-30 bg-[#0b111d]/90 backdrop-blur border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2"
  >
    <AlertTriangle className="w-3 h-3 text-amber-400/70 shrink-0" />
    <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.14em] text-amber-300/80 text-center">
      SIMULATED / DEMO DATA — NOT PILOT RESULTS
    </span>
  </div>
);

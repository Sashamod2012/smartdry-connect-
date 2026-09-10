import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { DemoBanner } from "@/components/DemoBanner";
import Dashboard from "@/pages/Dashboard";
import LiveMonitor from "@/pages/LiveMonitor";
import NewBatch from "@/pages/NewBatch";
import BatchHistory from "@/pages/BatchHistory";
import EnergyAnalytics from "@/pages/EnergyAnalytics";
import Traceability from "@/pages/Traceability";
import TraceRecord from "@/pages/TraceRecord";
import SystemStatus from "@/pages/SystemStatus";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Sidebar />
        <div className="lg:ml-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
          <DemoBanner />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/monitor" element={<LiveMonitor />} />
              <Route path="/new-batch" element={<NewBatch />} />
              <Route path="/history" element={<BatchHistory />} />
              <Route path="/energy" element={<EnergyAnalytics />} />
              <Route path="/traceability" element={<Traceability />} />
              <Route path="/trace/:batchId" element={<TraceRecord />} />
              <Route path="/status" element={<SystemStatus />} />
            </Routes>
          </main>
          <footer className="px-6 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-400">SmartDry Connect™ — Monitor. Trace. Grow.</span>
            <span className="text-[10px] font-mono text-slate-600">Powered by Adebobo Dynamic Resources · Hybrid LPG hot-air dryer with solar/battery-powered controls · Demo MVP</span>
          </footer>
        </div>
        <Toaster theme="dark" richColors position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;

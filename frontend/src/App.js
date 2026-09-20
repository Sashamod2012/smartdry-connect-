import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Wind } from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { DemoBanner } from "@/components/DemoBanner";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LiveMonitor from "@/pages/LiveMonitor";
import NewBatch from "@/pages/NewBatch";
import BatchHistory from "@/pages/BatchHistory";
import EnergyAnalytics from "@/pages/EnergyAnalytics";
import Traceability from "@/pages/Traceability";
import TraceRecord from "@/pages/TraceRecord";
import BatchDetail from "@/pages/BatchDetail";
import SystemStatus from "@/pages/SystemStatus";

const AuthLoading = () => (
  <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center gap-4" data-testid="auth-loading">
    <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
      <Wind className="w-6 h-6 text-emerald-600 animate-pulse" />
    </div>
    <span className="text-xs font-mono text-slate-500 tracking-widest">SMARTDRY CONNECT™</span>
  </div>
);

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  if (user === undefined) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppShell = () => (
  <>
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
          <Route path="/batches/:batchId" element={<BatchDetail />} />
          <Route path="/status" element={<SystemStatus />} />
        </Routes>
      </main>
      <footer className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <span className="text-xs font-semibold text-slate-500">SmartDry Connect™ — Monitor. Trace. Grow.</span>
        <span className="text-[10px] font-mono text-slate-600">Powered by Adebobo Dynamic Resources · Hybrid LPG hot-air dryer with solar/battery-powered controls · Demo MVP</span>
      </footer>
    </div>
  </>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/trace/:batchId" element={<TraceRecord />} />
            <Route path="/*" element={<RequireAuth><AppShell /></RequireAuth>} />
          </Routes>
          <Toaster theme="light" richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

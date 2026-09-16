import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Activity, PlusCircle, History, Zap, QrCode, Cpu, Menu, X, Wind, LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard", end: true },
  { to: "/monitor", label: "Live Drying Monitor", icon: Activity, testId: "nav-live-monitor" },
  { to: "/new-batch", label: "New Batch", icon: PlusCircle, testId: "nav-new-batch" },
  { to: "/history", label: "Batch History", icon: History, testId: "nav-batch-history" },
  { to: "/energy", label: "Energy & Performance", icon: Zap, testId: "nav-energy-analytics" },
  { to: "/traceability", label: "QR Traceability", icon: QrCode, testId: "nav-qr-traceability" },
  { to: "/status", label: "System Status", icon: Cpu, testId: "nav-system-status" },
];

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color] duration-150 ${
    isActive
      ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30"
      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
  }`;

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d1322] border-b border-white/10 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm tracking-tight">SmartDry Connect<span className="text-emerald-400">™</span></span>
        </div>
        <button data-testid="mobile-menu-toggle" onClick={() => setOpen(!open)} className="p-2 text-slate-300 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-[#0d1322] border-b border-white/10 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={n.testId} className={linkCls} onClick={() => setOpen(false)}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
          <button data-testid="mobile-logout-button" onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 border border-transparent transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#0d1322] border-r border-white/[0.07] z-40">
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5" data-testid="sidebar-logo">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Wind className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-white leading-tight">SmartDry Connect<span className="text-emerald-400">™</span></div>
              <div className="text-[10px] font-mono text-slate-500 tracking-wide">by Adebobo Dynamic Resources</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 led-pulse text-emerald-400" /> ESP32 LINK: DEMO
            </span>
            <span data-testid="demo-data-badge" className="text-[10px] font-mono px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              SIMULATED DATA
            </span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={n.testId} className={linkCls}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-200 truncate" data-testid="sidebar-user-name">{user?.name || "Admin"}</div>
            <div className="text-[10px] font-mono text-slate-500 truncate" data-testid="sidebar-user-email">{user?.email}</div>
          </div>
          <button data-testid="logout-button" onClick={handleLogout} title="Sign out"
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-5 py-4 border-t border-white/[0.07]">
          <div className="text-xs font-semibold text-slate-300 tracking-wide">Monitor. Trace. Grow.</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Hybrid LPG dryer · solar/battery controls · Investor demo MVP</div>
        </div>
      </aside>
    </>
  );
};

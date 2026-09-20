import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle, Activity, BarChart3, QrCode, Cpu, Cloud, MonitorSmartphone,
} from "lucide-react";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";

const FEATURES = [
  { icon: Activity, title: "Live SCADA Monitoring", sub: "Temperature, humidity, weight & gas safety telemetry" },
  { icon: BarChart3, title: "Energy & Performance Analytics", sub: "LPG, solar and battery metrics ready for pilot validation" },
  { icon: QrCode, title: "QR Batch Traceability", sub: "Digital provenance passport for every dried batch" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#f4f6f8]" data-testid="login-page">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-white border-r border-slate-200">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative">
          <div>
            <img src="/smartdry-logo.png" alt="SmartDry Connect™" className="w-44 h-auto" data-testid="login-logo" />
            <div className="text-[10px] font-mono text-slate-500 tracking-wide mt-2">by Adebobo Dynamic Resources</div>
          </div>
          <h1 className="mt-12 text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-md">
            Industrial drying intelligence, <span className="text-emerald-600">built for African processors.</span>
          </h1>
          <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-md">
            The digital monitoring and traceability layer for the SmartDry Connect™ hybrid LPG hot-air dryer —
            with solar/battery-powered controls, sensors and communications.
          </p>
          <div className="mt-10 space-y-5 max-w-md">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{f.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[Cpu, Cloud, MonitorSmartphone].map((Icon, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                <Icon className="w-3 h-3 text-sky-600" /> {["ESP32 + Sensors", "SmartDry Connect Cloud", "Dashboard + QR"][i]}
                {i < 2 && <span className="text-slate-400 ml-1">→</span>}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-xs font-semibold text-slate-700 tracking-wide">Monitor. Trace. Grow.</span>
            <span className="text-[10px] font-mono text-amber-600">SIMULATED / DEMO DATA — NOT PILOT RESULTS</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl lg:hidden" />
        <div className="w-full max-w-md relative">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/smartdry-logo.png" alt="SmartDry Connect™" className="w-36 h-auto" data-testid="login-logo-mobile" />
          </div>
          <div className="sd-card p-8 shadow-lg shadow-slate-200">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Manager Login</h2>
            <p className="text-xs text-slate-500 mt-1.5">Sign in to access the SmartDry Connect™ operations platform.</p>
            <form onSubmit={submit} className="mt-7 space-y-4" data-testid="login-form">
              <div>
                <label className="sd-label block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input data-testid="login-email-input" type="email" required autoComplete="email"
                    className="sd-input pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="sd-label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input data-testid="login-password-input" type={showPw ? "text" : "password"} required autoComplete="current-password"
                    className="sd-input pl-9 pr-10" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" data-testid="toggle-password-visibility" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div data-testid="login-error" className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-red-600">{error}</span>
                </div>
              )}
              <button data-testid="login-form-submit-button" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold tracking-wide transition-colors">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in…" : "SIGN IN"}
              </button>
            </form>
            <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Demo Access</div>
              <div className="text-[11px] font-mono text-slate-600">folasade.amodu@gmail.com · SmartDry@2026</div>
            </div>
          </div>
          <p className="text-center text-[10px] font-mono text-slate-400 mt-6">
            SmartDry Connect™ — Monitor. Trace. Grow. · Powered by Adebobo Dynamic Resources
          </p>
        </div>
      </div>
    </div>
  );
}

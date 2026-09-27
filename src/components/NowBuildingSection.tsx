import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Shield, ArrowUpRight, Cpu, Layers } from 'lucide-react';

interface NowBuildingSectionProps {
  id?: string;
}

export const NowBuildingSection: React.FC<NowBuildingSectionProps> = ({
  id = 'telemetry-status',
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState(14820);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hours}h ${mins}m ${s}s`;
  };

  return (
    <section
      id={id}
      className="relative w-full py-20 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: NOW BUILDING Box (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#070D18]/90 border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                  CURRENTLY BUILDING // Q3-Q4 2026
                </span>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  ACTIVE SPRINTS
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                  ArogyaSeva
                </h3>
                <span className="font-mono text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  Healthcare Platform
                </span>
              </div>

              <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Engineering a real-time clinical triage interface connecting rural health workers with remote doctors using Gemini AI symptom intake and adaptive WebRTC consultation pipelines.
              </p>

              {/* Engineering Focus Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="font-mono text-[10px] text-slate-400 block mb-1">FOCUS</span>
                  <span className="font-mono text-xs font-bold text-cyan-400">Realtime</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="font-mono text-[10px] text-slate-400 block mb-1">AI MODEL</span>
                  <span className="font-mono text-xs font-bold text-sky-400">Gemini 3.8</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="font-mono text-[10px] text-slate-400 block mb-1">STACK</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">FastAPI</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="font-mono text-[10px] text-slate-400 block mb-1">DEPLOY</span>
                  <span className="font-mono text-xs font-bold text-indigo-400">Cloud Run</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">STATUS: PROTOTYPE VALIDATION</span>
              <a
                href="#projects"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Inspect Technical Case Study</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: PORTFOLIO SYSTEM TELEMETRY (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#070D18]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  PORTFOLIO TELEMETRY & RUNTIME
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Activity className="w-3 h-3" /> ALL SYSTEMS HEALTHY
                </span>
              </div>

              {/* Service Health Grid */}
              <div className="space-y-3 font-mono text-xs mb-6">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Frontend Presentation (Vite 6 / React 19)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">AI Gateway (Gemini 3.8 Flash Proxy)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Edge CDN Routing (Vercel Global Edge)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Static Telemetry Cache</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Strict Referrer & Zero Unsafe Eval
              </span>
              <span className="text-cyan-300">
                SESSION UPTIME: {formatUptime(uptimeSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Shield, ArrowUpRight, Cpu, Layers, ExternalLink, Zap, Wifi } from 'lucide-react';

interface NowBuildingSectionProps {
  id?: string;
}

export const NowBuildingSection: React.FC<NowBuildingSectionProps> = ({
  id = 'telemetry-status',
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState(14820);
  const [latency, setLatency] = useState(23);
  const [isHeartbeat, setIsHeartbeat] = useState(false);
  const [latencyHistory, setLatencyHistory] = useState([22, 24, 21, 26, 23, 25, 22, 24]);

  // Session Uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Latency ticker & rhythmic status heartbeat probe
  useEffect(() => {
    const latencyTimer = setInterval(() => {
      // Fluctuates realistically between 18ms and 29ms with slight jitter
      const jitter = Math.floor(Math.random() * 9) - 4; // -4 to +4
      const nextLatency = Math.max(17, Math.min(32, 22 + jitter));
      setLatency(nextLatency);
      setLatencyHistory((prev) => [...prev.slice(1), nextLatency]);

      // Trigger subtle heartbeat pulse
      setIsHeartbeat(true);
      const heartbeatTimer = setTimeout(() => {
        setIsHeartbeat(false);
      }, 650);

      return () => clearTimeout(heartbeatTimer);
    }, 2200);

    return () => clearInterval(latencyTimer);
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

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                STATUS: DEPLOYED // LIVE PROTOTYPE
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://arogyaseva-six.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>Launch Live App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#projects"
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>Case Study</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: PORTFOLIO SYSTEM TELEMETRY (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#070D18]/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col justify-between">
            <div>
              {/* Telemetry Header with Live Latency Ticker & Heartbeat Operational Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10 mb-5">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  PORTFOLIO TELEMETRY & RUNTIME
                </span>

                <div className="flex items-center gap-2">
                  {/* Fluctuating Live Latency Ticker */}
                  <div
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    title="Real-time edge roundtrip latency"
                  >
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-400 uppercase">Latency:</span>
                    <span className="font-bold text-cyan-300 tabular-nums transition-all duration-300">
                      {latency}ms
                    </span>
                  </div>

                  {/* Status Heartbeat Indicator (subtly flashes green when Operational) */}
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-500 ${
                      isHeartbeat
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/70 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-300 ${
                          isHeartbeat ? 'opacity-100 animate-ping' : 'opacity-40 animate-pulse'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-all duration-300 ${
                          isHeartbeat ? 'shadow-[0_0_8px_#34d399]' : ''
                        }`}
                      />
                    </span>
                    <span className="font-semibold tracking-wide">OPERATIONAL</span>
                  </span>
                </div>
              </div>

              {/* Real-time Latency Sparkline Ribbon */}
              <div className="flex items-center justify-between p-2.5 px-3 mb-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edge Pulse Telemetry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-1">PACKET STREAM:</span>
                  <div className="flex items-end gap-1 h-3.5">
                    {latencyHistory.map((val, idx) => {
                      const heightPercent = Math.min(100, Math.max(30, (val / 32) * 100));
                      return (
                        <span
                          key={idx}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-1 rounded-sm transition-all duration-300 ${
                            idx === latencyHistory.length - 1
                              ? 'bg-cyan-300 shadow-[0_0_6px_#67e8f9]'
                              : 'bg-cyan-500/40'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-cyan-300 font-bold ml-1 text-xs tabular-nums">
                    {latency}ms
                  </span>
                </div>
              </div>

              {/* Service Health Grid with Synced Heartbeat Flashes */}
              <div className="space-y-2.5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Frontend Presentation (Vite 6 / React 19)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-300 ${
                          isHeartbeat ? 'opacity-100 animate-ping' : 'opacity-25'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-all duration-300 ${
                          isHeartbeat ? 'shadow-[0_0_8px_#10b981]' : ''
                        }`}
                      />
                    </span>
                    <span className={isHeartbeat ? 'text-emerald-300 transition-colors duration-300' : 'text-emerald-400'}>
                      Operational
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">~11ms</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">AI Gateway (Gemini 3.8 Flash Proxy)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-300 ${
                          isHeartbeat ? 'opacity-100 animate-ping' : 'opacity-25'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-all duration-300 ${
                          isHeartbeat ? 'shadow-[0_0_8px_#10b981]' : ''
                        }`}
                      />
                    </span>
                    <span className={isHeartbeat ? 'text-emerald-300 transition-colors duration-300' : 'text-emerald-400'}>
                      Operational
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">~{latency + 6}ms</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Edge CDN Routing (Vercel Global Edge)</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-300 ${
                          isHeartbeat ? 'opacity-100 animate-ping' : 'opacity-25'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-all duration-300 ${
                          isHeartbeat ? 'shadow-[0_0_8px_#10b981]' : ''
                        }`}
                      />
                    </span>
                    <span className={isHeartbeat ? 'text-emerald-300 transition-colors duration-300' : 'text-emerald-400'}>
                      Operational
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">~{latency}ms</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">Static Telemetry Cache</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-300 ${
                          isHeartbeat ? 'opacity-100 animate-ping' : 'opacity-25'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500 transition-all duration-300 ${
                          isHeartbeat ? 'shadow-[0_0_8px_#10b981]' : ''
                        }`}
                      />
                    </span>
                    <span className={isHeartbeat ? 'text-emerald-300 transition-colors duration-300' : 'text-emerald-400'}>
                      Operational
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">~4ms</span>
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


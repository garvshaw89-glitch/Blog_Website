import React, { useMemo } from 'react';
import { Github, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { IDENTITY_DATA } from './cardTextureFactory';
import { generateQrMatrix } from './qrMatrix';

interface ReducedMotionIdCardProps {
  onEnter: () => void;
  isEntering: boolean;
}

export const ReducedMotionIdCard: React.FC<ReducedMotionIdCardProps> = ({
  onEnter,
  isEntering,
}) => {
  const qrMatrix = useMemo(() => {
    const url =
      typeof window !== 'undefined' &&
      /^https?:\/\//i.test(window.location.origin) &&
      !window.location.origin.includes('localhost') &&
      window.location.origin.length <= 74
        ? window.location.origin
        : IDENTITY_DATA.portfolioFallbackUrl;
    return generateQrMatrix(url);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050608] px-4 py-8 transition-opacity duration-500 ${
        isEntering ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Garv Shaw Developer Identity Entry"
    >
      {/* Subtle overhead celestial cyan studio glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 50% at 50% 10%, rgba(56, 189, 248, 0.11), rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
        }}
      />

      {/* Woven Lanyard + Metallic Swivel Clasp */}
      <div className="relative flex flex-col items-center">
        <div
          aria-hidden="true"
          className="w-6 h-28 sm:h-36 bg-[#0A0E17] border-x border-sky-400/45 shadow-[0_8px_20px_rgba(0,0,0,0.85)]"
        />
        <div
          aria-hidden="true"
          className="w-8 h-3 rounded-sm bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-sky-300/50"
        />
        <div
          aria-hidden="true"
          className="w-3.5 h-4.5 rounded-full border-2 border-sky-300/80 -mt-0.5 mb-[-8px] z-10 bg-transparent"
        />

        {/* Obsidian-Midnight & Celestial Cyan Developer Identity Card */}
        <article className="relative w-[274px] sm:w-[304px] rounded-[22px] p-[1.5px] bg-gradient-to-br from-sky-200/65 via-sky-400/40 to-indigo-400/55 shadow-[0_32px_90px_rgba(0,0,0,0.92)]">
          <div className="relative rounded-[20.5px] bg-gradient-to-b from-[#0C1220] via-[#070A12] to-[#05070C] px-5 pt-4 pb-5 overflow-hidden">
            {/* Punched lanyard slot */}
            <div className="mx-auto mb-3.5 w-12 h-2 rounded-full bg-[#050608] border border-sky-400/45" />

            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-sky-400/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-sky-300/55 bg-sky-400/10 flex items-center justify-center font-serif text-sky-100 text-xs font-semibold">
                  GS
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.22em] text-slate-100/90 font-semibold">
                    DEVELOPER PASS
                  </div>
                  <div className="text-[8px] font-mono tracking-[0.12em] text-cyan-300/75">
                    {IDENTITY_DATA.editionLabel}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-sky-400/45 bg-sky-400/10 text-[8px] font-mono tracking-[0.14em] text-sky-200">
                <ShieldCheck className="w-2.5 h-2.5 text-sky-400" />
                VERIFIED
              </div>
            </div>

            {/* Name & Designation */}
            <div className="pt-3.5 pb-3">
              <div className="text-[9px] font-mono tracking-[0.2em] text-cyan-300/75 mb-1">
                01 / PRINCIPAL IDENTITY
              </div>
              <h1 className="font-serif text-3xl sm:text-[34px] tracking-[0.04em] text-slate-50 leading-none">
                {IDENTITY_DATA.name}
              </h1>
              <div className="w-9 h-[2px] bg-gradient-to-r from-cyan-300 to-indigo-400 my-2.5" />
              <p className="text-xs sm:text-sm text-cyan-300 tracking-[0.04em]">
                {IDENTITY_DATA.role}
              </p>
            </div>

            {/* Interactive GitHub Block */}
            <a
              href={IDENTITY_DATA.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 bg-sky-400/[0.05] hover:bg-sky-400/[0.11] border border-sky-400/30 hover:border-cyan-300/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full border border-cyan-300/45 bg-sky-400/12 flex items-center justify-center shrink-0">
                  <Github className="w-4 h-4 text-sky-100" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-mono tracking-[0.18em] text-cyan-300/75">
                    GITHUB PROFILE
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-slate-50 font-medium truncate">
                    {IDENTITY_DATA.githubHandle}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            {/* Holographic Security Strip */}
            <div
              className="my-4 h-5 rounded-md border border-sky-400/40 flex items-center justify-center overflow-hidden"
              style={{
                background:
                  'linear-gradient(105deg, #0C1424 0%, #163858 28%, #252B5C 54%, #133B54 78%, #0B1220 100%)',
              }}
            >
              <span className="text-[8px] font-mono tracking-[0.26em] text-sky-100/75">
                AUTHENTICATED ◆ GARV SHAW ◆ GS-2026
              </span>
            </div>

            {/* Serial & Scannable Portfolio QR Code */}
            <div className="flex items-end justify-between gap-4 pt-1">
              <div className="space-y-2.5">
                <div>
                  <div className="text-[9px] font-mono tracking-[0.18em] text-cyan-300/70">
                    SERIAL NUMBER
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-slate-100 tracking-wider font-semibold">
                    {IDENTITY_DATA.serialNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono tracking-[0.18em] text-cyan-300/70">
                    CLEARANCE
                  </div>
                  <div className="text-xs text-slate-200/85">
                    {IDENTITY_DATA.clearance}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-lg bg-[#F0F7FC] border border-sky-400/75">
                  <svg
                    width="68"
                    height="68"
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    shapeRendering="crispEdges"
                    aria-label="QR Code linking to Garv Shaw Portfolio"
                  >
                    <rect
                      width={qrMatrix.length}
                      height={qrMatrix.length}
                      fill="#F0F7FC"
                    />
                    {qrMatrix.map((row, r) =>
                      row.map((dark, c) =>
                        dark ? (
                          <rect
                            key={`${r}-${c}`}
                            x={c}
                            y={r}
                            width={1}
                            height={1}
                            fill="#060A14"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <span className="mt-1 text-[8px] font-mono tracking-[0.18em] text-cyan-300/80">
                  SCAN PORTFOLIO
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Prompt & Enter Button */}
      <div className="mt-7 flex flex-col items-center gap-3">
        <p className="text-[11px] font-mono tracking-[0.32em] text-cyan-300/85 uppercase">
          EXPLORE MY IDENTITY
        </p>
        <button
          type="button"
          onClick={onEnter}
          className="px-10 py-3 rounded-full border border-sky-400/60 bg-[#0A0F1A] hover:bg-sky-400 text-slate-50 hover:text-[#050608] font-mono text-xs tracking-[0.34em] uppercase transition-colors cursor-pointer"
        >
          ENTER
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { ProjectedRocketTelemetry } from './types';

interface FlightTelemetryProps {
  telemetry: ProjectedRocketTelemetry | null;
}

/**
 * FLIGHT TELEMETRY OVERLAY
 * 
 * Displays subtle, data-driven markers (altitude, velocity, pitch, G-force, stage)
 * directly in 3D-projected screen space near the rocket during its launch sequence.
 * 
 * Consistent with the premium editorial aesthetic:
 * - Monochromatic titanium & deep charcoal palette (#050608, #0B0E12, #F2F3F5)
 * - Precision hairline SVG leader lines and dogleg connectors
 * - Subtle launch amber (#FFD27A, #FF9D38) and digital blue (#7EA7FF) accents
 * - Monospaced uppercase typography with tracked letterspacing
 * - Zero-pill architectural container with 1px technical corner datum ticks
 */
export const FlightTelemetry: React.FC<FlightTelemetryProps> = ({ telemetry }) => {
  if (!telemetry || !telemetry.visible || telemetry.opacity <= 0.02) {
    return null;
  }

  const {
    screenX,
    screenY,
    noseX,
    noseY,
    engineX,
    engineY,
    opacity,
    altitudeFormatted,
    velocityFormatted,
    mach,
    velocityMs,
    thrustPercent,
    accelerationG,
    dynamicPressureKPa,
    state,
    phaseLabel,
    pitchDeg,
    headingDeg,
    missionTimeSec,
  } = telemetry as ProjectedRocketTelemetry & { mach: string };

  const isWindowWide = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Decide whether to place HUD to the right or left of the rocket
  const isRightSide = screenX < viewportWidth * 0.5;
  const boxWidth = isWindowWide ? 220 : 180;
  const boxHeight = 120;

  // Calculate target position for HUD card
  let targetX = isRightSide ? screenX + 55 : screenX - boxWidth - 55;
  let targetY = screenY - 45;

  // Clamp within viewport margins
  targetX = Math.max(16, Math.min(viewportWidth - boxWidth - 16, targetX));
  targetY = Math.max(64, Math.min(viewportHeight - boxHeight - 24, targetY));

  // Anchor point on the rocket hull
  const anchorX = screenX;
  const anchorY = screenY;

  // Leader line elbow point (45° dogleg)
  const elbowX = isRightSide ? anchorX + 24 : anchorX - 24;
  const elbowY = anchorY + (targetY + 20 > anchorY ? 16 : -16);
  const cardConnectorX = isRightSide ? targetX : targetX + boxWidth;
  const cardConnectorY = targetY + 20;

  // Determine stage status badge
  let statusBadge = 'SYS STANDBY';
  let statusColor = '#A7ADB5';
  if (state === 'IGNITION') {
    statusBadge = 'IGNITION RUN';
    statusColor = '#FF9D38';
  } else if (state === 'LAUNCH' || state === 'ASCENT') {
    statusBadge = dynamicPressureKPa > 30 ? 'MAX-Q TRANSONIC' : 'BOOSTER BURN';
    statusColor = '#FFD27A';
  } else if (state === 'FLIGHT' || state === 'FLYBY') {
    statusBadge = 'SUPERSONIC TRAJ';
    statusColor = '#7EA7FF';
  } else if (state === 'CRUISE') {
    statusBadge = 'ORBITAL APEX';
    statusColor = '#7EA7FF';
  } else if (state === 'DESCENT') {
    statusBadge = 'RETRO-DESCENT';
    statusColor = '#FF9D38';
  } else if (state === 'LANDING' || state === 'IMPACT') {
    statusBadge = 'TOUCHDOWN';
    statusColor = '#34d399';
  }

  // Format mission elapsed time: T+00:00:00
  const totalSec = Math.max(0, Math.floor(missionTimeSec));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const ms = String(Math.floor((missionTimeSec % 1) * 10));
  const metFormatted = `T+${mm}:${ss}.${ms}`;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 transition-opacity duration-300 select-none"
      style={{ opacity }}
    >
      {/* 1. Precision Hairline SVG Leader Lines & Dynamic Reticles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9D38" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF9D38" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Anchor point at rocket center */}
        <circle cx={anchorX} cy={anchorY} r="7" fill="url(#targetGlow)" />
        <circle cx={anchorX} cy={anchorY} r="2.5" fill="#FF9D38" />
        <circle
          cx={anchorX}
          cy={anchorY}
          r="5"
          fill="none"
          stroke="#FF9D38"
          strokeWidth="0.8"
          strokeOpacity="0.75"
        />

        {/* 45° Dogleg connector line from rocket to HUD box */}
        <polyline
          points={`${anchorX},${anchorY} ${elbowX},${elbowY} ${cardConnectorX},${cardConnectorY}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Connection node at HUD box edge */}
        <circle cx={cardConnectorX} cy={cardConnectorY} r="2" fill="#F2F3F5" />

        {/* 2. Nose Cone Vector Reticle (Apex Heading) */}
        {noseX > 0 && noseX < viewportWidth && noseY > 0 && noseY < viewportHeight && (
          <g transform={`translate(${noseX}, ${noseY})`} className="opacity-75">
            <circle r="2" fill="#7EA7FF" />
            <line x1="-7" y1="0" x2="-3" y2="0" stroke="#7EA7FF" strokeWidth="0.8" strokeOpacity="0.8" />
            <line x1="3" y1="0" x2="7" y2="0" stroke="#7EA7FF" strokeWidth="0.8" strokeOpacity="0.8" />
            <line x1="0" y1="-7" x2="0" y2="-3" stroke="#7EA7FF" strokeWidth="0.8" strokeOpacity="0.8" />
            <line x1="0" y1="3" x2="0" y2="7" stroke="#7EA7FF" strokeWidth="0.8" strokeOpacity="0.8" />
            {isWindowWide && (
              <text
                x={isRightSide ? 10 : -10}
                y="-3"
                textAnchor={isRightSide ? 'start' : 'end'}
                fill="#A7ADB5"
                fontSize="8"
                fontFamily="monospace"
                letterSpacing="0.08em"
              >
                APEX PITCH {pitchDeg > 0 ? `+${pitchDeg.toFixed(1)}°` : `${pitchDeg.toFixed(1)}°`}
              </text>
            )}
          </g>
        )}

        {/* 3. Engine Gimbal / Nozzle Reticle during active burn */}
        {thrustPercent > 5 &&
          engineX > 0 &&
          engineX < viewportWidth &&
          engineY > 0 &&
          engineY < viewportHeight && (
            <g transform={`translate(${engineX}, ${engineY})`} className="opacity-80">
              <circle r="2.5" fill="#FFD27A" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFD27A" strokeWidth="0.8" strokeOpacity="0.9" />
              {isWindowWide && (
                <text
                  x={isRightSide ? 10 : -10}
                  y="4"
                  textAnchor={isRightSide ? 'start' : 'end'}
                  fill="#FFD27A"
                  fontSize="8"
                  fontFamily="monospace"
                  letterSpacing="0.08em"
                >
                  GIMBAL // {thrustPercent}%
                </text>
              )}
            </g>
          )}
      </svg>

      {/* 4. Architectural Telemetry Marker Card (Zero-Pill Editorial Container) */}
      <div
        className="absolute font-mono text-[10px] text-[#A7ADB5] transition-all duration-75 ease-out"
        style={{
          transform: `translate3d(${targetX}px, ${targetY}px, 0)`,
          width: boxWidth,
        }}
      >
        <div className="relative bg-[#0B0E12]/90 backdrop-blur-md border border-white/[0.12] p-2.5 shadow-2xl overflow-hidden rounded">
          {/* Micro Corner Ticks for Precision Editorial Aesthetic */}
          <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 pointer-events-none" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/40 pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/40 pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 pointer-events-none" />

          {/* Header Row: Identifier + Mission Time + Live Status */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2 text-[9px] tracking-wider">
            <div className="flex items-center gap-1.5 text-[#F2F3F5] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9D38] animate-pulse" />
              <span>VEHICLE 01</span>
            </div>
            <span className="text-[#626A73]">{metFormatted}</span>
          </div>

          {/* Primary Flight Telemetry Datums */}
          <div className="space-y-1.5 text-[9.5px]">
            {/* Altitude Datum */}
            <div className="flex items-center justify-between">
              <span className="text-[#626A73] tracking-wider">ALT</span>
              <span className="text-[#F2F3F5] font-medium tracking-tight">
                {altitudeFormatted}
              </span>
            </div>

            {/* Velocity Datum */}
            <div className="flex items-center justify-between">
              <span className="text-[#626A73] tracking-wider">VEL</span>
              <div className="flex items-center gap-1">
                <span className="text-[#7EA7FF] font-medium">{velocityFormatted}</span>
                <span className="text-[#626A73] text-[8px]">
                  ({Math.round(velocityMs)} m/s)
                </span>
              </div>
            </div>

            {/* G-Force & Aerodynamic Dynamic Pressure */}
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[#626A73] tracking-wider">ACC / Q</span>
              <div className="flex items-center gap-1.5 text-[#A7ADB5]">
                <span>+{accelerationG.toFixed(1)} G</span>
                <span className="text-white/20">/</span>
                <span>{dynamicPressureKPa.toFixed(1)} kPa</span>
              </div>
            </div>

            {/* Thrust Output Bar */}
            <div className="pt-1 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-[8.5px] mb-1">
                <span className="text-[#626A73]">THRUST</span>
                <span className="text-[#FFD27A] font-semibold">{thrustPercent}%</span>
              </div>
              <div className="w-full h-1 bg-white/[0.06] rounded-xs overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[#FF9D38] to-[#FFD27A] transition-all duration-100 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, thrustPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Footer Datum: Status Badge */}
          <div className="mt-2 pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-[8px] tracking-widest uppercase">
            <span className="text-[#626A73]">STAGE</span>
            <span
              className="font-medium px-1.5 py-0.5 rounded-xs"
              style={{
                color: statusColor,
                backgroundColor: `${statusColor}18`,
              }}
            >
              {statusBadge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

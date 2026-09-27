import React from 'react';
import { CursorTheme } from '../../context/CursorContext';

export interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

interface CursorTrailProps {
  points: TrailPoint[];
  speed: number;
  cursorTheme: CursorTheme;
  prefersReducedMotion: boolean;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({
  points,
  speed,
  cursorTheme,
  prefersReducedMotion,
}) => {
  if (prefersReducedMotion || points.length === 0) {
    return null;
  }

  // Only render trail if moving with brisk velocity (speed > 2.5px/frame)
  const isMovingFast = speed > 2.5;
  if (!isMovingFast) {
    return null;
  }

  const getParticleColor = () => {
    switch (cursorTheme) {
      case 'light':
        return 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]';
      case 'violet':
        return 'bg-indigo-300 shadow-[0_0_6px_rgba(129,140,248,0.8)]';
      case 'cyan':
      default:
        return 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]';
    }
  };

  // Particles decay in size and opacity the older they are
  const particleStyles = [
    { size: 3, opacity: 0.35 },
    { size: 2.5, opacity: 0.22 },
    { size: 2, opacity: 0.12 },
    { size: 1.5, opacity: 0.06 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {points.map((pt, idx) => {
        const style = particleStyles[idx] || particleStyles[particleStyles.length - 1];
        return (
          <div
            key={pt.id}
            className={`absolute rounded-full pointer-events-none transition-opacity duration-150 ${getParticleColor()}`}
            style={{
              left: pt.x,
              top: pt.y,
              width: `${style.size}px`,
              height: `${style.size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: style.opacity,
            }}
          />
        );
      })}
    </div>
  );
};

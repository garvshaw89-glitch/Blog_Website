import React from 'react';
import { CursorTheme } from '../../context/CursorContext';

export interface TrailPoint {
  x: number;
  y: number;
  id: number;
  size?: number;
  opacity?: number;
}

interface CursorTrailProps {
  points: TrailPoint[];
  speed: number;
  scrollSpeed?: number;
  cursorTheme: CursorTheme;
  prefersReducedMotion: boolean;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({
  points,
  speed,
  scrollSpeed = 0,
  cursorTheme,
  prefersReducedMotion,
}) => {
  if (prefersReducedMotion || points.length === 0) {
    return null;
  }

  // Active during brisk pointer movement or fast scrolling
  const isActive = speed > 2.0 || scrollSpeed > 2.0;
  if (!isActive) {
    return null;
  }

  const getParticleColor = () => {
    switch (cursorTheme) {
      case 'light':
        return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]';
      case 'violet':
        return 'bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.7)]';
      case 'cyan':
      default:
        return 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]';
    }
  };

  // 8 staggered trailing particles with gradual size & opacity reduction
  const particleStyles = [
    { size: 4, opacity: 0.35 },
    { size: 3.5, opacity: 0.28 },
    { size: 3, opacity: 0.22 },
    { size: 2.6, opacity: 0.17 },
    { size: 2.2, opacity: 0.12 },
    { size: 1.8, opacity: 0.08 },
    { size: 1.5, opacity: 0.05 },
    { size: 1.2, opacity: 0.03 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {points.map((pt, idx) => {
        const style = particleStyles[idx] || particleStyles[particleStyles.length - 1];
        return (
          <div
            key={pt.id}
            className={`absolute rounded-full pointer-events-none will-change-transform ${getParticleColor()}`}
            style={{
              transform: `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`,
              width: `${style.size}px`,
              height: `${style.size}px`,
              opacity: style.opacity,
              transition: 'opacity 0.18s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

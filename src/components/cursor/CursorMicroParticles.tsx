import React from 'react';
import { CursorTheme } from '../../context/CursorContext';

export interface MicroParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface CursorMicroParticlesProps {
  particles: MicroParticle[];
  cursorTheme: CursorTheme;
  prefersReducedMotion: boolean;
}

export const CursorMicroParticles: React.FC<CursorMicroParticlesProps> = ({
  particles,
  cursorTheme,
  prefersReducedMotion,
}) => {
  if (prefersReducedMotion || particles.length === 0) {
    return null;
  }

  const getParticleColor = () => {
    switch (cursorTheme) {
      case 'light':
        return 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]';
      case 'violet':
        return 'bg-indigo-300 shadow-[0_0_6px_rgba(129,140,248,0.9)]';
      case 'cyan':
      default:
        return 'bg-cyan-300 shadow-[0_0_6px_#22d3ee]';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full pointer-events-none will-change-transform ${getParticleColor()}`}
          style={{
            transform: `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            transition: 'opacity 0.15s ease-out',
          }}
        />
      ))}
    </div>
  );
};

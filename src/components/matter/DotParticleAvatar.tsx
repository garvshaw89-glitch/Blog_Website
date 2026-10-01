import React, { useRef, useEffect, useState } from 'react';
import { GITHUB_AVATAR_BASE64 } from './avatarBase64';

interface DotParticleAvatarProps {
  src?: string;
  size?: number; // Visual display size in pixels (e.g. 88, 100, 120)
  gridResolution?: number; // Number of dots across diameter (e.g. 28 - 36)
  interactive?: boolean;
  className?: string;
  showToggle?: boolean;
}

interface AvatarDot {
  origX: number;
  origY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  radius: number;
  baseRadius: number;
}

export const DotParticleAvatar: React.FC<DotParticleAvatarProps> = ({
  src = GITHUB_AVATAR_BASE64,
  size = 96,
  gridResolution = 30,
  interactive = true,
  className = '',
  showToggle = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'dots' | 'photo'>('dots');
  const [isLoaded, setIsLoaded] = useState(false);
  const dotsRef = useRef<AvatarDot[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -999,
    y: -999,
    active: false,
  });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (!isMounted) return;

      const sampleSize = 64;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = sampleSize;
      offCanvas.height = sampleSize;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imgData = offCtx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imgData.data;

      const dots: AvatarDot[] = [];
      const res = gridResolution;
      const step = size / res;
      const center = size / 2;
      const maxRadius = size / 2 - 1.5;

      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const posX = (x + 0.5) * step;
          const posY = (y + 0.5) * step;
          const dx = posX - center;
          const dy = posY - center;
          const dist = Math.hypot(dx, dy);

          // Circular avatar boundary
          if (dist > maxRadius) continue;

          // Sample pixel from source image
          const sampleX = Math.floor((posX / size) * sampleSize);
          const sampleY = Math.floor((posY / size) * sampleSize);
          const pIdx = (sampleY * sampleSize + sampleX) * 4;

          const rawR = data[pIdx] || 0;
          const rawG = data[pIdx + 1] || 0;
          const rawB = data[pIdx + 2] || 0;
          const a = (data[pIdx + 3] || 255) / 255;

          if (a < 0.1) continue;

          // Keep authentic colors with subtle luminance calibration
          const maxChannel = Math.max(rawR, rawG, rawB);
          let r = rawR;
          let g = rawG;
          let b = rawB;

          // Lift very dark pixels slightly so dots remain visible against dark UI
          if (maxChannel < 45) {
            const lift = Math.floor((45 - maxChannel) * 0.7);
            r = Math.min(255, rawR + lift);
            g = Math.min(255, rawG + lift);
            b = Math.min(255, rawB + lift + 4);
          } else {
            // Subtle vibrance boost preserving true chromaticity
            r = Math.min(255, Math.floor(Math.pow(rawR / 255, 0.94) * 260));
            g = Math.min(255, Math.floor(Math.pow(rawG / 255, 0.94) * 260));
            b = Math.min(255, Math.floor(Math.pow(rawB / 255, 0.94) * 260));
          }

          // Dot radius based on luminance & spacing
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const baseDotRadius = Math.max(0.9, (step * 0.42) * (0.85 + lum * 0.35));

          dots.push({
            origX: posX,
            origY: posY,
            x: posX,
            y: posY,
            vx: 0,
            vy: 0,
            r,
            g,
            b,
            radius: baseDotRadius,
            baseRadius: baseDotRadius,
          });
        }
      }

      dotsRef.current = dots;
      setIsLoaded(true);
    };

    img.src = src;

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [src, size, gridResolution]);

  // Canvas render & physics loop
  useEffect(() => {
    if (!isLoaded || viewMode !== 'dots') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, size, size);

      const mouse = mouseRef.current;
      const dots = dotsRef.current;
      const repelDist = 28;
      const repelDistSq = repelDist * repelDist;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        if (interactive && mouse.active) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < repelDistSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / repelDist) * 3.8;
            dot.vx += (dx / dist) * force;
            dot.vy += (dy / dist) * force;
          }
        }

        // Spring return to original position
        const returnForce = 0.12;
        const damping = 0.82;

        dot.vx += (dot.origX - dot.x) * returnForce;
        dot.vy += (dot.origY - dot.y) * returnForce;
        dot.vx *= damping;
        dot.vy *= damping;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw luminous dot with authentic color
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${dot.r}, ${dot.g}, ${dot.b})`;
        ctx.fill();

        // Specular core shine pinpoint on illuminated dots
        if (dot.radius > 1.0) {
          ctx.beginPath();
          ctx.arc(dot.x - dot.radius * 0.28, dot.y - dot.radius * 0.28, dot.radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLoaded, size, viewMode, interactive]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: size, height: size }}
        className="relative rounded-full overflow-hidden p-[2.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-400 shadow-[0_0_25px_rgba(34,211,238,0.45)] group cursor-pointer"
        title="Interactive Dot-Matrix Particle Avatar"
        onClick={() => {
          if (showToggle) {
            setViewMode((prev) => (prev === 'dots' ? 'photo' : 'dots'));
          }
        }}
      >
        <div className="w-full h-full rounded-full bg-[#06080B] flex items-center justify-center overflow-hidden">
          {viewMode === 'dots' ? (
            <canvas
              ref={canvasRef}
              style={{ width: size, height: size }}
              className="w-full h-full block"
            />
          ) : (
            <img
              src={src}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </div>

        {/* Ambient Cyan/Indigo Aura */}
        <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none group-hover:border-cyan-400/60 transition-colors" />
      </div>

      {showToggle && (
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'dots' ? 'photo' : 'dots'))}
          className="mt-2 text-[10px] font-mono tracking-wider text-neutral-400 hover:text-cyan-300 transition-colors"
        >
          {viewMode === 'dots' ? '[ SWITCH TO PHOTO ]' : '[ SWITCH TO DOT MATRIX ]'}
        </button>
      )}
    </div>
  );
};

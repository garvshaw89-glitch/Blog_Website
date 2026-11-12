import React, { useRef, useEffect } from 'react';

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  strength?: number;
  className?: string;
  id?: string;
}

export const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  strength = 2.4,
  className = '',
  id,
}) => {
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = magnetRef.current;
    if (!el) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    let lastTime = performance.now();
    let isRunning = false;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const factor = 1 - Math.exp(-14 * dt);
      currentX += (targetX - currentX) * factor;
      currentY += (targetY - currentY) * factor;

      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX;
        currentY = targetY;
        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
        isRunning = false;
        return;
      }

      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const isWithinBounds =
        e.clientX >= rect.left - padding &&
        e.clientX <= rect.right + padding &&
        e.clientY >= rect.top - padding &&
        e.clientY <= rect.bottom + padding;

      if (isWithinBounds) {
        targetX = (e.clientX - centerX) / strength;
        targetY = (e.clientY - centerY) / strength;
      } else {
        targetX = 0;
        targetY = 0;
      }
      startLoop();
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      startLoop();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [padding, strength]);

  return (
    <div
      ref={magnetRef}
      id={id}
      className={className}
      style={{
        transform: 'translate3d(0px, 0px, 0)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

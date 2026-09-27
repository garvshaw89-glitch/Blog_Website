import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MotionValue, useMotionValue, useSpring } from 'motion/react';
import { useCursor, CursorType, CursorTheme } from '../../context/CursorContext';
import { useReducedMotion } from '../../hooks/cursor/useReducedMotion';
import { TrailPoint } from './CursorTrail';
import { RippleEvent } from './CursorRipple';

interface InteractionManagerRenderProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  velocityScaleX: MotionValue<number>;
  velocityScaleY: MotionValue<number>;
  velocityAngle: MotionValue<number>;
  trailPoints: TrailPoint[];
  ripples: RippleEvent[];
  currentSpeed: number;
  onRippleComplete: (id: number) => void;
  prefersReducedMotion: boolean;
}

interface CursorInteractionManagerProps {
  children: (props: InteractionManagerRenderProps) => React.ReactNode;
}

export const CursorInteractionManager: React.FC<CursorInteractionManagerProps> = ({ children }) => {
  const {
    cursorType,
    cursorLabel,
    cursorTheme,
    isPointerDown,
    isIdle,
    isVisible,
    setCursorType,
    setCursorLabel,
    setCursorTheme,
    setIsPointerDown,
    setIsIdle,
    setIsVisible,
    setIsTouchDevice,
    resetCursor,
  } = useCursor();

  const prefersReducedMotion = useReducedMotion();

  // Instant pointer position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Outer ring spring: agile, controlled, no floaty lag
  const ringSpringConfig = { damping: 26, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, ringSpringConfig);
  const smoothY = useSpring(mouseY, ringSpringConfig);

  // Ambient glow spring: soft, delayed atmospheric follow
  const glowSpringConfig = { damping: 32, stiffness: 180, mass: 0.8 };
  const glowX = useSpring(mouseX, glowSpringConfig);
  const glowY = useSpring(mouseY, glowSpringConfig);

  // Velocity stretch values for the outer ring
  const velocityScaleX = useMotionValue(1);
  const velocityScaleY = useMotionValue(1);
  const velocityAngle = useMotionValue(0);

  // Subtle Trail buffer
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);
  const lastTrailSampleRef = useRef(0);

  // Click ripple queue
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const rippleIdRef = useRef(0);

  // Velocity state
  const prevPosRef = useRef({ x: -100, y: -100, time: 0 });
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Idle timer ref
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active magnetic element tracker
  const activeMagneticElRef = useRef<HTMLElement | null>(null);

  // Clean up ripples
  const handleRippleComplete = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 2400);
  }, [setIsIdle]);

  // Release currently displaced magnetic element
  const releaseMagneticElement = useCallback(() => {
    if (activeMagneticElRef.current) {
      activeMagneticElRef.current.style.transform = 'translate3d(0, 0, 0)';
      activeMagneticElRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      activeMagneticElRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Only enable custom cursor on fine pointer devices (desktops/laptops with mouse/trackpad)
    if (typeof window === 'undefined') return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const clientX = e.clientX;
      const clientY = e.clientY;

      mouseX.set(clientX);
      mouseY.set(clientY);

      if (!isVisible) {
        setIsVisible(true);
      }

      resetIdleTimer();

      // Velocity calculation
      const prev = prevPosRef.current;
      const dt = Math.max(now - prev.time, 16);
      const dx = clientX - prev.x;
      const dy = clientY - prev.y;
      const dist = Math.hypot(dx, dy);
      const speed = (dist / dt) * 16;
      setCurrentSpeed(speed);

      if (dist > 1 && !prefersReducedMotion) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const stretch = Math.min(speed * 0.05, 0.28);
        velocityAngle.set(angle);
        velocityScaleX.set(1 + stretch);
        velocityScaleY.set(Math.max(0.85, 1 - stretch * 0.4));
      } else {
        velocityScaleX.set(1);
        velocityScaleY.set(1);
      }

      prevPosRef.current = { x: clientX, y: clientY, time: now };

      // Sample trail point if moving with notable speed
      if (speed > 2.8 && !prefersReducedMotion && now - lastTrailSampleRef.current > 35) {
        lastTrailSampleRef.current = now;
        trailIdRef.current += 1;
        setTrailPoints((prevPts) => [
          { x: clientX, y: clientY, id: trailIdRef.current },
          ...prevPts.slice(0, 3),
        ]);
      } else if (speed < 1.5 && trailPoints.length > 0) {
        setTrailPoints([]);
      }

      // Check element under cursor for semantic cursor states
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Magnetic element check
      const magneticEl = target.closest('[data-magnetic]') as HTMLElement | null;
      if (magneticEl && !prefersReducedMotion) {
        activeMagneticElRef.current = magneticEl;
        const rect = magneticEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        const maxOffset = 8;
        const moveX = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.22));
        const moveY = Math.max(-maxOffset, Math.min(maxOffset, deltaY * 0.22));

        magneticEl.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        magneticEl.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)';
      } else {
        releaseMagneticElement();
      }

      // 2. Section Theme check
      const themedSection = target.closest('[data-cursor-theme]') as HTMLElement | null;
      if (themedSection) {
        const themeAttr = themedSection.getAttribute('data-cursor-theme') as CursorTheme;
        if (themeAttr && themeAttr !== cursorTheme) {
          setCursorTheme(themeAttr);
        }
      } else if (cursorTheme !== 'default') {
        setCursorTheme('default');
      }

      // 3. Semantic hover states
      const customCursorAttr = target.closest('[data-cursor]') as HTMLElement | null;
      const customLabelAttr = target.closest('[data-cursor-label]') as HTMLElement | null;
      const externalLink = target.closest('a[target="_blank"]') || target.closest('[data-cursor="external"]');
      const standardLink = target.closest('a');
      const interactiveBtn = target.closest('button, [role="button"], [data-cursor="button"]');
      const textElement = target.closest('p, h1, h2, h3, h4, h5, h6, input, textarea, code, pre, [data-cursor="text"]');

      if (customCursorAttr) {
        const declaredType = customCursorAttr.getAttribute('data-cursor') as CursorType;
        const declaredLabel = customLabelAttr?.getAttribute('data-cursor-label') || '';
        setCursorType(declaredType);
        setCursorLabel(declaredLabel);
      } else if (externalLink) {
        setCursorType('external');
        setCursorLabel('OPEN');
      } else if (interactiveBtn) {
        setCursorType('button');
        setCursorLabel('');
      } else if (standardLink) {
        setCursorType('link');
        setCursorLabel('OPEN');
      } else if (textElement && !target.closest('button, a')) {
        setCursorType('text');
        setCursorLabel('');
      } else {
        setCursorType('default');
        setCursorLabel('');
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      setIsPointerDown(true);
    };

    const handlePointerUp = (e: MouseEvent) => {
      setIsPointerDown(false);

      // Trigger subtle ripple
      if (!prefersReducedMotion) {
        rippleIdRef.current += 1;
        setRipples((prev) => [
          ...prev.slice(-2),
          { id: rippleIdRef.current, x: e.clientX, y: e.clientY },
        ]);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      releaseMagneticElement();
      setTrailPoints([]);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      releaseMagneticElement();
    };
  }, [
    isVisible,
    cursorTheme,
    prefersReducedMotion,
    mouseX,
    mouseY,
    velocityAngle,
    velocityScaleX,
    velocityScaleY,
    resetIdleTimer,
    releaseMagneticElement,
    setCursorType,
    setCursorLabel,
    setCursorTheme,
    setIsPointerDown,
    setIsVisible,
    setIsTouchDevice,
    trailPoints.length,
  ]);

  return (
    <>
      {children({
        mouseX,
        mouseY,
        smoothX,
        smoothY,
        glowX,
        glowY,
        velocityScaleX,
        velocityScaleY,
        velocityAngle,
        trailPoints,
        ripples,
        currentSpeed,
        onRippleComplete: handleRippleComplete,
        prefersReducedMotion,
      })}
    </>
  );
};

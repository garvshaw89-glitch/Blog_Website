import React, { useEffect, useRef, useState } from 'react';

interface GlitchHeadingProps {
  as?: 'h1' | 'h2';
  className?: string;
  children: React.ReactNode;
}

type GlitchVariant = 'a' | 'b' | null;

export const GlitchHeading: React.FC<GlitchHeadingProps> = ({
  as = 'h2',
  className = '',
  children,
}) => {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [inView, setInView] = useState(false);
  const [glitchVariant, setGlitchVariant] = useState<GlitchVariant>(null);

  // Track viewport visibility so only visible headings schedule random glitches
  useEffect(() => {
    const el = headingRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Schedule randomized, subtle digital glitch bursts while in viewport
  useEffect(() => {
    if (!inView) {
      setGlitchVariant(null);
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let triggerTimer: number | null = null;
    let clearTimer: number | null = null;
    let cancelled = false;

    const scheduleNext = (isFirst: boolean) => {
      if (cancelled) return;
      const delay = isFirst
        ? 900 + Math.random() * 2600
        : 3600 + Math.random() * 5400;

      triggerTimer = window.setTimeout(() => {
        if (cancelled) return;
        const variant: GlitchVariant = Math.random() > 0.45 ? 'a' : 'b';
        const duration = variant === 'a' ? 270 : 320;
        setGlitchVariant(variant);

        clearTimer = window.setTimeout(() => {
          if (cancelled) return;
          setGlitchVariant(null);
          scheduleNext(false);
        }, duration);
      }, delay);
    };

    scheduleNext(true);

    return () => {
      cancelled = true;
      if (triggerTimer !== null) window.clearTimeout(triggerTimer);
      if (clearTimer !== null) window.clearTimeout(clearTimer);
    };
  }, [inView]);

  const Tag = as;
  const glitchClass =
    glitchVariant === 'a'
      ? 'is-glitching-a'
      : glitchVariant === 'b'
      ? 'is-glitching-b'
      : '';

  return (
    <Tag
      ref={headingRef}
      className={`glitch-heading relative ${glitchClass} ${className}`.trim()}
    >
      <span className="glitch-base block relative z-[1]">{children}</span>

      {glitchVariant !== null && (
        <>
          <span
            aria-hidden="true"
            className="glitch-layer glitch-layer-cyan"
          >
            {children}
          </span>
          <span
            aria-hidden="true"
            className="glitch-layer glitch-layer-violet"
          >
            {children}
          </span>
          <span aria-hidden="true" className="glitch-scan-slice" />
        </>
      )}
    </Tag>
  );
};

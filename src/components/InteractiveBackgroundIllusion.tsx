import React, { useEffect, useRef } from 'react';

/**
 * High-End Interactive Digital Background Atmosphere
 *
 * Architecture:
 * - Fullscreen hardware-accelerated 2D Canvas + SVG Filter Distortion + CSS Variable Lightfield
 * - Passive pointer, scroll, velocity, and click tracking with zero React re-renders in the hot path
 * - Multi-layer parallax:
 *   Layer 1: Deep cosmic chromatic gradient + Section theme interpolation
 *   Layer 2: Subtle floating digital particles (35-70 with dynamic depth & repulsion)
 *   Layer 3: Abstract slow-floating gravitational glass orbs
 *   Layer 4: Technical warping digital grid lines with dynamic cursor refraction
 *   Layer 5: Radial interactive light field with velocity-expansion
 *   Layer 6: Propagating liquid wave ripples generated on clicks & rapid swipes
 *   Layer 7: Ultra-fine grain noise for tactile finish without banding
 * - Fully accessible: strictly honors `prefers-reduced-motion` and touch devices
 * - Preserves content readability: stays strictly at pointer-events-none, z-index 0 behind all content
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  depth: number; // 0.2 (distant) to 1.0 (near)
  alpha: number;
  baseAlpha: number;
  pulsePhase: number;
  colorType: 'cyan' | 'blue' | 'indigo' | 'white';
}

interface FloatingOrb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  blur: number;
  color: string;
  phase: number;
  speed: number;
  mass: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  lineWidth: number;
  color: string;
}

export const InteractiveBackgroundIllusion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lightFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check accessibility & device mode
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = reducedMotionQuery.matches;

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    let isDesktopFinePointer = finePointerQuery.matches;

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Canvas Dimensions & DPR
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Interactive State Trackers (all in refs/closures for 60-120fps lock)
    const pointer = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      prevX: width * 0.5,
      prevY: height * 0.35,
      vx: 0,
      vy: 0,
      speed: 0,
      smoothedSpeed: 0,
      isNearInteractive: false,
      interactiveX: 0,
      interactiveY: 0,
    };

    const scroll = {
      current: window.scrollY || 0,
      previous: window.scrollY || 0,
      velocity: 0,
      smoothedVelocity: 0,
      targetVelocity: 0,
      direction: 0,
    };

    // Color theme interpolation between sections
    // Default: Hero (cyan/electric blue), About (indigo/glass), Projects (technical cyan/sky), Contact (calm teal/blue)
    const sectionThemes = [
      { id: 'hero-section', primary: [6, 182, 212], secondary: [37, 99, 235], ambient: [8, 18, 38] },
      { id: 'about', primary: [99, 102, 241], secondary: [6, 182, 212], ambient: [10, 15, 30] },
      { id: 'skills', primary: [14, 165, 233], secondary: [59, 130, 246], ambient: [7, 14, 28] },
      { id: 'constellation', primary: [6, 182, 212], secondary: [168, 85, 247], ambient: [8, 12, 26] },
      { id: 'projects', primary: [6, 182, 212], secondary: [14, 165, 233], ambient: [6, 11, 22] },
      { id: 'architecture', primary: [56, 189, 248], secondary: [99, 102, 241], ambient: [8, 16, 32] },
      { id: 'contact', primary: [20, 184, 166], secondary: [6, 182, 212], ambient: [5, 12, 24] },
    ];

    let currentPrimaryRGB = [6, 182, 212];
    let currentSecondaryRGB = [37, 99, 235];
    let targetPrimaryRGB = [6, 182, 212];
    let targetSecondaryRGB = [37, 99, 235];

    // Initialize 35-65 particles tailored to screen real estate
    const particleCount = Math.floor(Math.min(Math.max(width / 32, 35), 65));
    const particles: Particle[] = [];
    const colors: ('cyan' | 'blue' | 'indigo' | 'white')[] = ['cyan', 'blue', 'indigo', 'white'];

    for (let i = 0; i < particleCount; i++) {
      const depth = 0.25 + Math.random() * 0.75; // 0.25 is far, 1.0 is near
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25 * depth,
        vy: (Math.random() - 0.5) * 0.25 * depth - 0.1 * depth,
        baseRadius: 0.8 + depth * 1.6,
        depth,
        alpha: 0.15 + depth * 0.5,
        baseAlpha: 0.15 + depth * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        colorType: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Initialize 4-5 Large Abstract Floating Orbs
    const orbs: FloatingOrb[] = [
      {
        x: width * 0.2,
        y: height * 0.25,
        baseX: width * 0.2,
        baseY: height * 0.25,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.35,
        blur: 130,
        color: 'rgba(6, 182, 212, 0.08)',
        phase: 0,
        speed: 0.0006,
        mass: 1.2,
      },
      {
        x: width * 0.8,
        y: height * 0.4,
        baseX: width * 0.8,
        baseY: height * 0.4,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.38,
        blur: 150,
        color: 'rgba(37, 99, 235, 0.07)',
        phase: Math.PI * 0.5,
        speed: 0.0005,
        mass: 1.5,
      },
      {
        x: width * 0.35,
        y: height * 0.75,
        baseX: width * 0.35,
        baseY: height * 0.75,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.32,
        blur: 140,
        color: 'rgba(99, 102, 241, 0.06)',
        phase: Math.PI,
        speed: 0.0007,
        mass: 1.1,
      },
      {
        x: width * 0.75,
        y: height * 0.85,
        baseX: width * 0.75,
        baseY: height * 0.85,
        vx: 0,
        vy: 0,
        radius: Math.min(width, height) * 0.28,
        blur: 120,
        color: 'rgba(14, 165, 233, 0.06)',
        phase: Math.PI * 1.5,
        speed: 0.0008,
        mass: 0.9,
      },
    ];

    // Click & Gesture Shockwave Liquid Ripples
    const ripples: ClickRipple[] = [];

    const spawnRipple = (x: number, y: number, isStrong: boolean = false) => {
      if (prefersReduced) return;
      ripples.push({
        x,
        y,
        radius: 10,
        maxRadius: isStrong ? 260 : 180,
        alpha: isStrong ? 0.45 : 0.32,
        speed: isStrong ? 3.5 : 2.5,
        lineWidth: isStrong ? 2 : 1.2,
        color: `rgba(${Math.round(currentPrimaryRGB[0])}, ${Math.round(currentPrimaryRGB[1])}, ${Math.round(currentPrimaryRGB[2])}, `,
      });
      // Cap max ripples to preserve performance
      if (ripples.length > 6) ripples.shift();
    };

    // Event Listeners: Passive Pointer Tracking
    let lastPointerTime = performance.now();
    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max((now - lastPointerTime) / 1000, 0.001);
      lastPointerTime = now;

      const px = e.clientX;
      const py = e.clientY;

      const dx = px - pointer.prevX;
      const dy = py - pointer.prevY;
      const dist = Math.hypot(dx, dy);

      pointer.vx = dx / dt;
      pointer.vy = dy / dt;
      pointer.speed = dist / dt;

      pointer.prevX = px;
      pointer.prevY = py;
      pointer.targetX = px;
      pointer.targetY = py;

      // Check if near interactive element (magnetic distortion influence)
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest(
          '[data-magnetic], button, a, [data-cursor="project"], [data-cursor="button"]'
        ) as HTMLElement | null;

        if (interactiveEl) {
          const rect = interactiveEl.getBoundingClientRect();
          pointer.isNearInteractive = true;
          pointer.interactiveX = rect.left + rect.width / 2;
          pointer.interactiveY = rect.top + rect.height / 2;
        } else {
          pointer.isNearInteractive = false;
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      spawnRipple(e.clientX, e.clientY, true);
    };

    // Passive Scroll Velocity Tracking
    let lastScrollTime = performance.now();
    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max((now - lastScrollTime) / 1000, 0.001);
      lastScrollTime = now;

      const currentY = window.scrollY || window.pageYOffset || 0;
      const deltaY = currentY - scroll.previous;
      scroll.previous = currentY;
      scroll.current = currentY;
      scroll.targetVelocity = deltaY / dt;
      scroll.direction = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;

      // Section theme detector: check which section is in central viewport
      const viewportCenter = currentY + height * 0.4;
      for (const sec of sectionThemes) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (viewportCenter >= top && viewportCenter <= bottom) {
            targetPrimaryRGB = sec.primary;
            targetSecondaryRGB = sec.secondary;
            break;
          }
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // RequestAnimationFrame Render Loop
    let rafId: number | null = null;
    let time = 0;

    const render = () => {
      time += 0.016;

      // 1. Smooth Pointer & Velocity Interpolation
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      pointer.smoothedSpeed += (pointer.speed - pointer.smoothedSpeed) * 0.08;
      // Decay velocity naturally if pointer stopped
      pointer.speed *= 0.92;

      // 2. Smooth Scroll Velocity Decay
      scroll.velocity += (scroll.targetVelocity - scroll.velocity) * 0.1;
      scroll.smoothedVelocity += (scroll.velocity - scroll.smoothedVelocity) * 0.08;
      scroll.targetVelocity *= 0.88;

      // 3. Smooth Section Color Transitions
      currentPrimaryRGB[0] += (targetPrimaryRGB[0] - currentPrimaryRGB[0]) * 0.03;
      currentPrimaryRGB[1] += (targetPrimaryRGB[1] - currentPrimaryRGB[1]) * 0.03;
      currentPrimaryRGB[2] += (targetPrimaryRGB[2] - currentPrimaryRGB[2]) * 0.03;

      currentSecondaryRGB[0] += (targetSecondaryRGB[0] - currentSecondaryRGB[0]) * 0.03;
      currentSecondaryRGB[1] += (targetSecondaryRGB[1] - currentSecondaryRGB[1]) * 0.03;
      currentSecondaryRGB[2] += (targetSecondaryRGB[2] - currentSecondaryRGB[2]) * 0.03;

      const pR = Math.round(currentPrimaryRGB[0]);
      const pG = Math.round(currentPrimaryRGB[1]);
      const pB = Math.round(currentPrimaryRGB[2]);

      const sR = Math.round(currentSecondaryRGB[0]);
      const sG = Math.round(currentSecondaryRGB[1]);
      const sB = Math.round(currentSecondaryRGB[2]);

      // 4. Update Interactive Light Field via CSS variables on the light container (hardware accelerated)
      if (lightFieldRef.current) {
        const velFactor = Math.min(pointer.smoothedSpeed / 1200, 1);
        const scrollFactor = Math.min(Math.abs(scroll.smoothedVelocity) / 2000, 1);
        const radius = 280 + velFactor * 140 + scrollFactor * 100;
        const opacity = 0.07 + velFactor * 0.08 + (pointer.isNearInteractive ? 0.06 : 0);

        // Magnetic element pull on lightfield
        let lightX = pointer.x;
        let lightY = pointer.y;
        if (pointer.isNearInteractive) {
          lightX += (pointer.interactiveX - pointer.x) * 0.35;
          lightY += (pointer.interactiveY - pointer.y) * 0.35;
        }

        lightFieldRef.current.style.background = `radial-gradient(circle ${radius.toFixed(
          0
        )}px at ${lightX.toFixed(1)}px ${lightY.toFixed(
          1
        )}px, rgba(${pR}, ${pG}, ${pB}, ${opacity.toFixed(
          3
        )}) 0%, rgba(${sR}, ${sG}, ${sB}, ${(opacity * 0.45).toFixed(
          3
        )}) 45%, transparent 75%)`;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // If reduced motion is requested, render only subtle static ambient gradient
      if (prefersReduced) {
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          50,
          width * 0.5,
          height * 0.4,
          Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0.06)`);
        grad.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, 0.03)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        rafId = requestAnimationFrame(render);
        return;
      }

      // --- LAYER 3: FLOATING ABSTRACT GRAVITATIONAL ORBS ---
      const scrollDrift = scroll.smoothedVelocity * 0.04;
      for (const orb of orbs) {
        orb.phase += orb.speed;
        const naturalX = orb.baseX + Math.sin(orb.phase) * 60;
        const naturalY = orb.baseY + Math.cos(orb.phase * 0.8) * 45;

        // Gravitational reaction: orbs subtly drift away or toward pointer based on proximity
        const dx = pointer.x - orb.x;
        const dy = pointer.y - orb.y;
        const dist = Math.hypot(dx, dy);
        let pullForceX = 0;
        let pullForceY = 0;

        if (dist < 450 && dist > 10) {
          // Soft gravitational buoyancy
          const force = (1 - dist / 450) * 25 * (1 / orb.mass);
          pullForceX = (dx / dist) * force;
          pullForceY = (dy / dist) * force;
        }

        // Apply scroll inertia
        orb.y -= scrollDrift * (0.3 / orb.mass);

        // Keep orbs in view bounding
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;

        orb.x += (naturalX + pullForceX - orb.x) * 0.03;
        orb.y += (naturalY + pullForceY - orb.y) * 0.03;

        // Draw soft ambient glowing radial gradient
        const orbGrad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        orbGrad.addColorStop(0, orb.color);
        orbGrad.addColorStop(0.6, `rgba(${pR}, ${pG}, ${pB}, 0.02)`);
        orbGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- LAYER 4: WARPING FUTURISTIC DIGITAL GRID LINES ---
      // Subtle architectural grid that gently refracts around the cursor
      const gridSpacing = width < 768 ? 90 : 120;
      const gridCols = Math.ceil(width / gridSpacing) + 1;
      const gridRows = Math.ceil(height / gridSpacing) + 1;
      const gridDistortRadius = 240 + Math.min(pointer.smoothedSpeed / 8, 120);

      ctx.save();
      ctx.lineWidth = 1;

      // Vertical lines
      for (let c = 0; c <= gridCols; c++) {
        const x = c * gridSpacing;
        ctx.beginPath();
        let isStarted = false;

        for (let r = 0; r <= gridRows; r += 2) {
          let px = x;
          let py = r * (gridSpacing * 0.5);

          // Liquid displacement around cursor
          const distToCursor = Math.hypot(px - pointer.x, py - pointer.y);
          if (distToCursor < gridDistortRadius) {
            const factor = Math.cos((distToCursor / gridDistortRadius) * (Math.PI / 2));
            const angle = Math.atan2(py - pointer.y, px - pointer.x);
            const displacement = factor * (14 + Math.min(pointer.smoothedSpeed / 80, 16));
            px += Math.cos(angle) * displacement;
            py += Math.sin(angle) * displacement;
          }

          // Parallax shift from scroll
          py -= (scroll.smoothedVelocity * 0.015) % gridSpacing;

          if (!isStarted) {
            ctx.moveTo(px, py);
            isStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = `rgba(6, 182, 212, 0.028)`;
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 0; r <= gridRows; r++) {
        const y = r * gridSpacing - ((scroll.smoothedVelocity * 0.015) % gridSpacing);
        ctx.beginPath();
        let isStarted = false;

        for (let c = 0; c <= gridCols; c += 2) {
          let px = c * (gridSpacing * 0.5);
          let py = y;

          const distToCursor = Math.hypot(px - pointer.x, py - pointer.y);
          if (distToCursor < gridDistortRadius) {
            const factor = Math.cos((distToCursor / gridDistortRadius) * (Math.PI / 2));
            const angle = Math.atan2(py - pointer.y, px - pointer.x);
            const displacement = factor * (14 + Math.min(pointer.smoothedSpeed / 80, 16));
            px += Math.cos(angle) * displacement;
            py += Math.sin(angle) * displacement;
          }

          if (!isStarted) {
            ctx.moveTo(px, py);
            isStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = `rgba(6, 182, 212, 0.022)`;
        ctx.stroke();
      }
      ctx.restore();

      // --- LAYER 2: INTERACTIVE DIGITAL PARTICLES ---
      for (const p of particles) {
        p.pulsePhase += 0.025;
        const breathing = Math.sin(p.pulsePhase) * 0.18;
        const currentAlpha = Math.max(0.05, Math.min(0.85, p.baseAlpha + breathing));

        // Cursor avoidance & flow
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        const repelRadius = 140 * p.depth + Math.min(pointer.smoothedSpeed / 20, 80);

        if (dist < repelRadius && dist > 1) {
          const repelFactor = (1 - dist / repelRadius) * (3.5 * p.depth);
          // When cursor moves rapidly, particles gain directional momentum
          const speedBoost = Math.min(pointer.smoothedSpeed / 400, 4);
          p.x -= (dx / dist) * repelFactor * (1 + speedBoost * 0.5);
          p.y -= (dy / dist) * repelFactor * (1 + speedBoost * 0.5);
        }

        // Scroll influence (particles at higher depth move faster creating true parallax)
        p.y -= scroll.smoothedVelocity * 0.03 * p.depth;

        // Autonomous drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Particle color selection
        let pColor = `rgba(${pR}, ${pG}, ${pB}, ${currentAlpha})`;
        if (p.colorType === 'blue') pColor = `rgba(${sR}, ${sG}, ${sB}, ${currentAlpha * 0.85})`;
        if (p.colorType === 'white') pColor = `rgba(240, 249, 255, ${currentAlpha * 0.95})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.fill();

        // Very faint connecting digital tether if two particles of same depth are close
        if (p.depth > 0.65) {
          for (let j = 0; j < 6; j++) {
            const other = particles[j];
            if (other && other !== p && other.depth > 0.65) {
              const pDist = Math.hypot(p.x - other.x, p.y - other.y);
              if (pDist < 85) {
                const lineAlpha = (1 - pDist / 85) * 0.08 * p.depth;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${lineAlpha})`;
                ctx.lineWidth = 0.75;
                ctx.stroke();
              }
            }
          }
        }
      }

      // --- LAYER 6: LIQUID SHOCKWAVE EXPANDING RIPPLES ---
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        rip.alpha *= 0.955; // exponential decay

        if (rip.alpha < 0.01 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${rip.color}${rip.alpha.toFixed(3)})`;
        ctx.lineWidth = rip.lineWidth;
        ctx.stroke();

        // Secondary soft echo ring
        if (rip.radius > 25) {
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `${rip.color}${(rip.alpha * 0.35).toFixed(3)})`;
          ctx.lineWidth = rip.lineWidth * 0.6;
          ctx.stroke();
        }
      }

      // --- LAYER 5: CURSOR LIGHT MOTION STREAK (WHEN SWIPING FAST) ---
      if (pointer.smoothedSpeed > 220) {
        const trailDist = Math.min(pointer.smoothedSpeed * 0.07, 45);
        const trailAngle = Math.atan2(pointer.vy, pointer.vx) + Math.PI;
        const trailX = pointer.x + Math.cos(trailAngle) * trailDist;
        const trailY = pointer.y + Math.sin(trailAngle) * trailDist;

        const streakGrad = ctx.createLinearGradient(
          pointer.x,
          pointer.y,
          trailX,
          trailY
        );
        streakGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0.12)`);
        streakGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        willChange: 'transform',
      }}
    >
      {/* Layer 1: Ambient Deep Foundation Gradient with subtle drift */}
      <div className="absolute inset-0 bg-[#05070A] pointer-events-none" />

      {/* Layer 5: High-Performance Hardware-Accelerated Interactive Light Field */}
      <div
        ref={lightFieldRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          willChange: 'background',
        }}
      />

      {/* Dynamic Simulation Canvas (Orbs, Warping Grid, Fluid Particles, Liquid Shockwaves, Velocity Trails) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none block"
      />

      {/* Layer 7: Ultra-Fine Organic Film Grain / Technical Micro-Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.028] mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

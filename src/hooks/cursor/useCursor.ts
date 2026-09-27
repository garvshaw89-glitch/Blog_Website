export { useCursor } from '../../context/CursorContext';
export type { CursorType, CursorTheme, CursorState, CursorContextValue } from '../../context/CursorContext';
export { useCursorInterpolation } from './useCursorInterpolation';
export type { CursorInterpolationConfig, UseCursorInterpolationReturn } from './useCursorInterpolation';

/**
 * Spring physics configuration for magnetic element interactions.
 */
export interface SpringPhysicsConfig {
  /**
   * Spring stiffness coefficient (Hooke's constant).
   * Higher values pull faster towards the pointer; lower values feel looser.
   * Recommended range: 120 - 320. Default: 220.
   */
  stiffness?: number;
  /**
   * Damping coefficient to dissipate kinetic energy.
   * Prevents oscillation, ringing, and harsh snapping.
   * Recommended range: 16 - 32. Default: 22.
   */
  damping?: number;
  /**
   * Mass of the magnetic element in arbitrary physics units.
   * Default: 1.
   */
  mass?: number;
  /**
   * Velocity & displacement threshold to consider the spring at rest.
   * Default: 0.005.
   */
  restThreshold?: number;
}

export interface MagneticVectorOptions extends SpringPhysicsConfig {
  /** Magnetic pull coefficient (typically 0.15 - 0.30, default 0.22) */
  strength?: number;
  /** Maximum displacement clamp in pixels (default 8px) */
  maxDisplacement?: number;
  /** Custom detection radius/range in pixels (overrides default bounding calculation) */
  range?: number;
  /** Fallback CSS transition curve (if spring physics animation loop is bypassed) */
  transition?: string;
  /** Whether to apply visual feedback classes (scale-105 / scale-110 / ring-1) when near */
  enableVisualFeedback?: boolean;
}

export interface MagneticVectorResult {
  x: number;
  y: number;
  distance: number;
  angle: number;
  range: number;
  isWithinThreshold: boolean;
}

export interface SpringState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Pure spring physics function computing single-step position and velocity integration
 * using a damped harmonic oscillator model (semi-implicit Euler).
 *
 * F_spring = -stiffness * (current - target)
 * F_damping = -damping * velocity
 * a = (F_spring + F_damping) / mass
 */
export function calculateSpringPhysics(
  current: SpringState,
  target: { x: number; y: number },
  config: SpringPhysicsConfig = {},
  dt: number = 0.016
): SpringState {
  const stiffness = config.stiffness ?? 220;
  const damping = config.damping ?? 22;
  const mass = config.mass ?? 1;

  // Clamp dt to protect against huge jumps if tab was backgrounded (1ms to 64ms)
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.064);

  // Hooke's law + viscous damping
  const forceX = -stiffness * (current.x - target.x) - damping * current.vx;
  const forceY = -stiffness * (current.y - target.y) - damping * current.vy;

  const ax = forceX / mass;
  const ay = forceY / mass;

  const nextVx = current.vx + ax * clampedDt;
  const nextVy = current.vy + ay * clampedDt;

  const nextX = current.x + nextVx * clampedDt;
  const nextY = current.y + nextVy * clampedDt;

  return {
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: nextVy,
  };
}

/**
 * Calculates target attraction displacement (x, y) relative to cursor and element center.
 */
export function calculateMagneticVector(
  element: HTMLElement,
  cursorX: number,
  cursorY: number,
  options: MagneticVectorOptions = {}
): MagneticVectorResult {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = cursorX - centerX;
  const deltaY = cursorY - centerY;
  const distance = Math.hypot(deltaX, deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  // Allow per-element custom detection radius via 'data-magnetic-range' attribute
  const elementRangeAttr = element.getAttribute('data-magnetic-range');
  const parsedRange = elementRangeAttr ? parseFloat(elementRangeAttr) : NaN;
  const effectiveRange = !isNaN(parsedRange)
    ? parsedRange
    : options.range !== undefined
    ? options.range
    : Math.max(rect.width, rect.height) * 0.9;

  // Allow per-element overrides via data attributes
  const elementStrengthAttr = element.getAttribute('data-magnetic-strength');
  const parsedStrength = elementStrengthAttr ? parseFloat(elementStrengthAttr) : NaN;
  const effectiveStrength = !isNaN(parsedStrength)
    ? parsedStrength
    : (options.strength ?? 0.22);

  const elementMaxAttr = element.getAttribute('data-magnetic-max');
  const parsedMax = elementMaxAttr ? parseFloat(elementMaxAttr) : NaN;
  const maxOffset = !isNaN(parsedMax) ? parsedMax : (options.maxDisplacement ?? 8);

  const isWithinThreshold = distance <= effectiveRange;

  // Calculate falloff so attraction scales smoothly as cursor approaches the element
  let pullFactor = effectiveStrength;
  if (effectiveRange > 0 && distance > 0) {
    // Proximity factor: 1 at center, tapering smoothly to 0 at the threshold boundary
    const proximity = Math.max(0, 1 - distance / effectiveRange);
    pullFactor = effectiveStrength * (0.4 + 0.6 * proximity);
  }

  const moveX = isWithinThreshold
    ? Math.max(-maxOffset, Math.min(maxOffset, deltaX * pullFactor))
    : 0;
  const moveY = isWithinThreshold
    ? Math.max(-maxOffset, Math.min(maxOffset, deltaY * pullFactor))
    : 0;

  return {
    x: moveX,
    y: moveY,
    distance,
    angle,
    range: effectiveRange,
    isWithinThreshold,
  };
}

interface ElementSpringSession {
  state: SpringState;
  target: { x: number; y: number };
  config: SpringPhysicsConfig;
  lastTime: number;
  rafId: number | null;
}

// Track running spring physics animations per HTMLElement without memory leaks
const springSessions = new WeakMap<HTMLElement, ElementSpringSession>();

/**
 * Runs the animation loop using calculateSpringPhysics to smoothly translate
 * the element to its target position without snapping.
 */
function startSpringLoop(element: HTMLElement, session: ElementSpringSession) {
  if (session.rafId !== null) return;

  const restThreshold = session.config.restThreshold ?? 0.008;

  const tick = (now: number) => {
    const dt = session.lastTime > 0 ? (now - session.lastTime) / 1000 : 0.016;
    session.lastTime = now;

    session.state = calculateSpringPhysics(
      session.state,
      session.target,
      session.config,
      dt
    );

    element.style.transform = `translate3d(${session.state.x.toFixed(2)}px, ${session.state.y.toFixed(2)}px, 0)`;

    const distFromTarget = Math.hypot(
      session.state.x - session.target.x,
      session.state.y - session.target.y
    );
    const speed = Math.hypot(session.state.vx, session.state.vy);

    // Continue running until velocity and position settle at the target
    if (distFromTarget < restThreshold && speed < restThreshold * 2) {
      // Snap to exact target when settled
      session.state.x = session.target.x;
      session.state.y = session.target.y;
      session.state.vx = 0;
      session.state.vy = 0;

      if (session.target.x === 0 && session.target.y === 0) {
        element.style.transform = '';
      } else {
        element.style.transform = `translate3d(${session.target.x.toFixed(2)}px, ${session.target.y.toFixed(2)}px, 0)`;
      }

      session.rafId = null;
      session.lastTime = 0;
      return;
    }

    session.rafId = requestAnimationFrame(tick);
  };

  session.rafId = requestAnimationFrame(tick);
}

/**
 * Calculates and applies spring-based magnetic attraction vectors for an element with
 * a 'data-magnetic' attribute (or interactive buttons), smoothly offsetting it toward the cursor.
 * Uses real-time spring physics (damping + stiffness) for fluid non-snapping movement.
 */
export function applyMagneticAttraction(
  element: HTMLElement,
  cursorX: number,
  cursorY: number,
  options: MagneticVectorOptions = {}
): MagneticVectorResult {
  const vector = calculateMagneticVector(element, cursorX, cursorY, options);

  // Per-element configurable stiffness and damping via attributes
  const attrStiffness = element.getAttribute('data-magnetic-stiffness');
  const parsedStiffness = attrStiffness ? parseFloat(attrStiffness) : NaN;
  const effectiveStiffness = !isNaN(parsedStiffness)
    ? parsedStiffness
    : (options.stiffness ?? 220);

  const attrDamping = element.getAttribute('data-magnetic-damping');
  const parsedDamping = attrDamping ? parseFloat(attrDamping) : NaN;
  const effectiveDamping = !isNaN(parsedDamping)
    ? parsedDamping
    : (options.damping ?? 22);

  const attrMass = element.getAttribute('data-magnetic-mass');
  const parsedMass = attrMass ? parseFloat(attrMass) : NaN;
  const effectiveMass = !isNaN(parsedMass)
    ? parsedMass
    : (options.mass ?? 1);

  const springConfig: SpringPhysicsConfig = {
    stiffness: effectiveStiffness,
    damping: effectiveDamping,
    mass: effectiveMass,
    restThreshold: options.restThreshold ?? 0.008,
  };

  let session = springSessions.get(element);
  if (!session) {
    session = {
      state: { x: 0, y: 0, vx: 0, vy: 0 },
      target: { x: vector.x, y: vector.y },
      config: springConfig,
      lastTime: 0,
      rafId: null,
    };
    springSessions.set(element, session);
  } else {
    session.target.x = vector.x;
    session.target.y = vector.y;
    session.config = springConfig;
  }

  // Remove any conflicting CSS transitions while physics engine is running
  element.style.transition = 'none';

  // Apply subtle visual feedback classes when within magnetic range
  const shouldApplyVisualFeedback = options.enableVisualFeedback !== false;
  if (shouldApplyVisualFeedback) {
    if (vector.isWithinThreshold) {
      if (!element.classList.contains('magnetic-active')) {
        element.classList.add('magnetic-active');
      }
      // Add ring-1 and subtle scale if not present or as requested
      if (!element.classList.contains('ring-1')) {
        element.classList.add('ring-1', 'ring-cyan-400/60');
      }
      // Add subtle scale feedback for elements indicating active magnetic pull
      if (element.getAttribute('data-magnetic-scale') !== 'false' && !element.classList.contains('scale-[1.04]')) {
        element.classList.add('scale-[1.04]');
      }
    } else {
      removeMagneticVisualFeedback(element);
    }
  }

  startSpringLoop(element, session);

  return vector;
}

/**
 * Removes active magnetic visual feedback classes from an element.
 */
export function removeMagneticVisualFeedback(element: HTMLElement | null): void {
  if (!element) return;
  element.classList.remove(
    'magnetic-active',
    'ring-1',
    'ring-cyan-400/60',
    'scale-[1.04]',
    'scale-105',
    'scale-110'
  );
}

/**
 * Resets the magnetic displacement on an element with smooth spring-like recovery
 * using the configured damping and stiffness, preventing abrupt snapping back to origin.
 */
export function resetMagneticElement(
  element: HTMLElement | null,
  config?: SpringPhysicsConfig
): void {
  if (!element) return;

  removeMagneticVisualFeedback(element);

  const session = springSessions.get(element);
  if (session) {
    // Direct current spring to return smoothly to origin (0, 0)
    session.target.x = 0;
    session.target.y = 0;
    if (config) {
      session.config = { ...session.config, ...config };
    }
    element.style.transition = 'none';
    startSpringLoop(element, session);
  } else {
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
  }
}

/**
 * Cleanly cancels any ongoing magnetic spring animation for an element (e.g., on unmount).
 */
export function stopMagneticSpring(element: HTMLElement | null): void {
  if (!element) return;
  removeMagneticVisualFeedback(element);
  const session = springSessions.get(element);
  if (session && session.rafId !== null) {
    cancelAnimationFrame(session.rafId);
    session.rafId = null;
  }
  springSessions.delete(element);
}

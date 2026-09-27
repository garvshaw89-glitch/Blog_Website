export { useCursor } from '../../context/CursorContext';
export type { CursorType, CursorTheme, CursorState, CursorContextValue } from '../../context/CursorContext';

export interface MagneticVectorOptions {
  /** Magnetic pull coefficient (typically 0.15 - 0.30, default 0.22) */
  strength?: number;
  /** Maximum displacement clamp in pixels (default 8px) */
  maxDisplacement?: number;
  /** CSS transition curve for spring-like responsiveness */
  transition?: string;
}

export interface MagneticVectorResult {
  x: number;
  y: number;
  distance: number;
  angle: number;
  isWithinThreshold: boolean;
}

/**
 * Calculates spring-based magnetic attraction vectors for elements.
 * Returns displacement (x, y), Euclidean distance, angle, and threshold status.
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

  // Allow per-element override via data-magnetic-strength attribute
  const elementStrengthAttr = element.getAttribute('data-magnetic-strength');
  const parsedAttr = elementStrengthAttr ? parseFloat(elementStrengthAttr) : NaN;
  const effectiveStrength = !isNaN(parsedAttr)
    ? parsedAttr
    : (options.strength ?? 0.22);

  const maxOffset = options.maxDisplacement ?? 8;
  const moveX = Math.max(-maxOffset, Math.min(maxOffset, deltaX * effectiveStrength));
  const moveY = Math.max(-maxOffset, Math.min(maxOffset, deltaY * effectiveStrength));

  // Determine if pointer is within the interactive bounding radius (threshold)
  const threshold = Math.max(rect.width, rect.height) * 0.9;
  const isWithinThreshold = distance <= threshold;

  return {
    x: moveX,
    y: moveY,
    distance,
    angle,
    isWithinThreshold,
  };
}

/**
 * Calculates and applies spring-based magnetic attraction vectors for an element with
 * a 'data-magnetic' attribute (or interactive buttons), smoothly offsetting it toward the cursor.
 */
export function applyMagneticAttraction(
  element: HTMLElement,
  cursorX: number,
  cursorY: number,
  options: MagneticVectorOptions = {}
): MagneticVectorResult {
  const vector = calculateMagneticVector(element, cursorX, cursorY, options);

  const transitionString =
    options.transition || 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)';

  element.style.transform = `translate3d(${vector.x}px, ${vector.y}px, 0)`;
  element.style.transition = transitionString;

  return vector;
}

/**
 * Resets the magnetic displacement on an element with smooth spring-like recovery.
 */
export function resetMagneticElement(
  element: HTMLElement | null,
  transition: string = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
): void {
  if (!element) return;
  element.style.transform = 'translate3d(0, 0, 0)';
  element.style.transition = transition;
}

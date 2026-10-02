/**
 * Configuration parameters for the Unified Digital Universe Particle Environment.
 * Fully modular and calibrated for high-fidelity 60-120 FPS performance.
 */
export const UNIVERSE_CONFIG = {
  // Device Particle Budgets (Intelligently layered for deep 3D volume)
  particles: {
    desktopHigh: 7500,     // 6,000–9,000 particles
    desktopStandard: 6000, // 5,000–7,000 particles
    tablet: 4200,          // 3,500–5,000 particles
    mobile: 2500,          // 2,000–3,000 particles
    lowPower: 1800,        // 1,500–2,000 particles
  },

  // Color Palette (Sophisticated, restrained hierarchy with rare jewel highlights)
  colors: {
    bg: '#050505',
    farDust: { r: 0.18, g: 0.20, b: 0.25, a: 0.22 },     // Deep background atmospheric dust
    midMatter: { r: 0.45, g: 0.48, b: 0.56, a: 0.45 },   // Midground digital matter
    foreground: { r: 0.88, g: 0.92, b: 1.00, a: 0.85 },  // Foreground highlight stars
    accentCyan: { r: 0.15, g: 0.85, b: 1.00, a: 0.90 },  // Restrained aerospace cyan
    accentAmber: { r: 1.00, g: 0.55, b: 0.08, a: 0.95 }, // Rocket flame ignition amber
    accentWhite: { r: 1.00, g: 1.00, b: 1.00, a: 1.00 }, // Supersonic shock diamond core
  },

  // Content Readability Protected Zone:
  // Automatically deflects and attenuates ambient particles in the central viewport
  // so headings, paragraphs, and CTA buttons have 100% crystal-clear legibility!
  readabilityZone: {
    halfWidth: 14.5,
    halfHeight: 9.0,
    deflectionStrength: 0.035,
    centerAlphaFactor: 0.32,
  },

  // Interactive Liquid Ripples
  ripple: {
    maxRipples: 8,
    maxRadius: 6.5,
    expansionSpeed: 2.8,
    decay: 0.94,
    strength: 1.0,
  },

  // Physics & Forces (Gentle, fluid, luxury response without chaotic scatter)
  physics: {
    repulsionRadius: 135, // px screen-space radius around cursor
    repulsionForce: 0.78, // gentle, elegant movement, not explosive
    wakeAttractionForce: 0.18,
    fluidCurlScale: 0.048,
    fluidSpeed: 0.00038,
    damping: 0.92,
    returnSpringStrength: 0.038,
    maxVelocity: 2.8,
  },

  // Multi-Stage Cinematic Story Sequence Timing (seconds)
  timing: {
    freeFlowDuration: 14.0,
    rockFormDuration: 10.0,
    globeFormDuration: 30.0,
    waveFormDuration: 12.0,
    morphTransitionSpeed: 0.045,
    initialAmbientDuration: 1.5, // Initial sparse starry void
    profileRevealDuration: 2.8,  // Particles converge into authentic portrait (2.8s)
    profileHoldDuration: 4.5,    // Stabilized breathing portrait (4.5s)
    profileDissolveDuration: 2.0,// Particles loosen and drift into ambient field (2.0s)
    rocketFormDuration: 2.2,     // Rocket geometry gathers on right side (2.2s)
    rocketIgnitionDuration: 1.8, // Engine glow, sparks, micro-vibration (1.8s)
    rocketLiftoffDuration: 2.4,  // Slow lift with eased acceleration (2.4s)
    rocketAscentDuration: 3.5,   // Supersonic acceleration and exhaust plume (3.5s)
    ambientHoldDuration: 12.0,   // Serene ambient digital universe (12.0s)
  },
};

export const MATTER_CONFIG = UNIVERSE_CONFIG; // Backward compatibility

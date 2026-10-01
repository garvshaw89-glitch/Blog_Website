/**
 * Configuration parameters for the Living Digital Matter Particle Environment.
 * Fully modular and calibrated for high-fidelity 60-120 FPS performance.
 */
export const MATTER_CONFIG = {
  // Device Particle Budgets (Intelligently sparse, cinematic atmospheric distribution)
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
    baseWhiteLow: { r: 0.18, g: 0.19, b: 0.22, a: 0.22 },  // Background atmospheric dust
    baseWhiteMid: { r: 0.38, g: 0.40, b: 0.46, a: 0.42 },  // Midground digital matter
    baseWhiteHigh: { r: 0.82, g: 0.86, b: 0.94, a: 0.75 }, // Foreground highlights
    accentBlue: { r: 0.32, g: 0.52, b: 0.95, a: 0.85 },    // Rare highlight
    accentPurple: { r: 0.48, g: 0.36, b: 0.92, a: 0.85 },  // Rare accent
    accentCyan: { r: 0.15, g: 0.82, b: 0.92, a: 0.90 },    // Rare electric highlight
  },

  // Physics & Forces (Gentle, fluid, luxury response without chaotic scatter)
  physics: {
    repulsionRadius: 135, // px screen-space radius around cursor
    repulsionForce: 0.82, // gentle, elegant movement, not explosive
    wakeAttractionForce: 0.22,
    fluidCurlScale: 0.055,
    fluidSpeed: 0.00045,
    damping: 0.91,
    returnSpringStrength: 0.034,
    maxVelocity: 3.2,
  },

  // Water Ripple Wave Dynamics
  ripple: {
    maxRipples: 3,
    expansionSpeed: 0.26,
    maxRadius: 14.0,
    strength: 0.85,
    decay: 0.94,
  },

  // Form Cycle Timing (seconds)
  // Continuous recurring sequence: FREE_FLOW -> ROCK -> GLOBE -> WAVE -> ROCKET_LAUNCH_REVEAL -> repeat
  timing: {
    freeFlowDuration: 14.0,  // Fluid matter flow
    rockFormDuration: 8.0,   // Floating asteroid formation
    globeFormDuration: 14.0, // Majestic Earth globe with rich biomes
    waveFormDuration: 9.0,   // Oceanic wave
    morphTransitionSpeed: 0.028,
  },
};

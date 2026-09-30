/**
 * Configuration parameters for the Living Digital Matter Particle Environment.
 * Fully modular and calibrated for high-fidelity 60-120 FPS performance.
 */
export const MATTER_CONFIG = {
  // Device Particle Budgets
  particles: {
    desktopHigh: 3800,
    desktopStandard: 2600,
    tablet: 1400,
    mobile: 650,
    lowPower: 450,
  },

  // Color Palette (Subtle monochrome with rare electric accents on high kinetic energy)
  colors: {
    bg: '#050505',
    baseWhiteLow: { r: 1.0, g: 1.0, b: 1.0, a: 0.12 },
    baseWhiteMid: { r: 1.0, g: 1.0, b: 1.0, a: 0.24 },
    baseWhiteHigh: { r: 1.0, g: 1.0, b: 1.0, a: 0.42 },
    accentBlue: { r: 0.357, g: 0.549, b: 1.0, a: 0.8 }, // #5B8CFF
    accentPurple: { r: 0.475, g: 0.361, b: 1.0, a: 0.8 }, // #795CFF
    accentCyan: { r: 0.133, g: 0.827, b: 0.933, a: 0.8 }, // #22D3EE
  },

  // Physics & Forces
  physics: {
    repulsionRadius: 180, // px screen-space radius around cursor
    repulsionForce: 1.45,
    wakeAttractionForce: 0.35,
    fluidCurlScale: 0.08,
    fluidSpeed: 0.00065,
    damping: 0.89,
    returnSpringStrength: 0.038,
    maxVelocity: 4.8,
  },

  // Water Ripple Wave Dynamics
  ripple: {
    maxRipples: 4,
    expansionSpeed: 0.32,
    maxRadius: 16.0,
    strength: 1.25,
    decay: 0.945,
  },

  // Form Cycle Timing (seconds)
  // Continuous recurring sequence: FREE_FLOW -> ROCK -> GLOBE -> WAVE -> ROCKET_LAUNCH_REVEAL -> repeat
  timing: {
    freeFlowDuration: 13.0,  // Fluid matter flow
    rockFormDuration: 8.0,   // Floating asteroid formation
    globeFormDuration: 14.0, // Majestic Earth globe with rich biomes
    waveFormDuration: 9.0,   // Oceanic wave
    morphTransitionSpeed: 0.028,
  },
};

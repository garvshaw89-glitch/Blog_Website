import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

/**
 * MASTER CINEMATIC PARTICLE UNIVERSE
 * 
 * An art-directed, luxury digital-experience particle background designed
 * to match the reference composition:
 * 
 * 1. LEFT RIBBON (Formation A):
 *    A flowing, curved stream of tiny silver dots entering from the lower-left / mid-left
 *    and sweeping diagonally upward toward the upper-middle region.
 * 
 * 2. UPPER-RIGHT SPIRAL (Formation B):
 *    A celestial logarithmic vortex in the upper-right quadrant. Discrete orbital filaments
 *    swirl around a concentrated nucleus with a warm-orange / amber core glint.
 *    Outer arms sweep downward to connect with the lower field.
 * 
 * 3. LOWER WAVE (Formation C):
 *    A broad, undulating multi-layered wave ribbon spanning the bottom of the viewport.
 *    Dips gracefully beneath the hero typography and "SCROLL DOWN" indicator, with
 *    subtle crests featuring sparse warm-orange glints.
 * 
 * 4. CENTRAL NEGATIVE SPACE:
 *    Natural routing of formations around the center, plus shader-level attenuation
 *    behind the hero headline ("AI TO INNOVATION.") for pristine text readability.
 * 
 * 5. SPARSE WARM-ORANGE ACCENTS:
 *    ~6% of particles carry muted warm-amber / golden-orange hues, concentrated at the
 *    spiral nucleus and sprinkled along the lower wave crests and left ribbon.
 * 
 * 6. PRECISE PARTICLE SIZING & OPACITY:
 *    - ~70% Fine particles: 0.8–1.1 CSS px (effective alpha: 0.18–0.32)
 *    - ~25% Main particles: 1.1–1.6 CSS px (effective alpha: 0.35–0.58)
 *    - ~5% Highlights: 1.6–2.2 CSS px (effective alpha: 0.55–0.78)
 *    - Circular anti-aliased fragment discipline, needle specular core, zero bubbles.
 */

export interface MotionParticleWorldProps {
  opacity?: number;
  sizeVariation?: number;
  glowIntensity?: number;
  className?: string;
}

const PARTICLE_COUNT = 14500;

const vertexShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;          // Normalized [-1, 1] screen coordinates
  uniform vec2 uPointerVel;       // Cursor velocity vector
  uniform float uPointerRadius;   // Influence radius (~125px)
  uniform float uPointerForce;    // Gentle localized repulsion force
  uniform float uPointerActive;   // Smooth fade factor [0..1] for cursor presence
  uniform float uScrollOffset;    // Smooth vertical scroll parallax
  uniform float uScrollVel;       // Scroll momentum impulse
  uniform float uScrollProgress;  // Normalized scroll progression [0.0 to 1.0]
  uniform float uScrollSpeedNorm; // Normalized scroll speed [0.0 to 1.0+]
  uniform float uShockTime;       // Click shockwave time elapsed
  uniform vec2 uShockOrigin;      // Click origin in NDC
  uniform float uRocketTime;      // Elapsed seconds since rocket liftoff (-1 = inactive)
  uniform vec2 uRocketOrigin;     // Rocket launch origin in NDC
  uniform float uRocketActive;    // 1.0 if rocket is currently firing
  uniform float uPixelRatio;      // Device pixel ratio (1x, 2x, 3x)
  uniform vec3 uThemeColor;       // Subtly blended ambient section tone
  uniform float uOpacity;         // Global opacity uniform
  uniform float uSizeVariation;   // Global size variation uniform
  uniform float uGlowIntensity;   // Radial falloff and luminous glow intensity uniform

  attribute float aSize;          // Pre-calibrated CSS pixel diameter (2.1 to 5.4)
  attribute float aLayer;         // 0 = DISTANT, 1 = MAIN, 2 = HIGHLIGHT
  attribute vec3 aSeed;           // Deterministic unique particle seeds
  attribute float aAlpha;         // Base target alpha
  attribute float aFormationId;   // 0 = Left Ribbon, 1 = Spiral, 2 = Lower Wave, 3 = Ambient
  attribute float aIsOrange;      // 1.0 = Orange accent, 0.0 = Silver-white

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vIsOrange;
  varying float vDofBlur;
  varying float vRocketFlame;

  // 3D Simplex noise helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Curl-like derivative approximation for organic laminar micro-currents
  vec3 curlNoise(vec3 p, float t) {
    float e = 0.08;
    float n1 = snoise(p + vec3(0.0, e, 0.0) + t);
    float n2 = snoise(p - vec3(0.0, e, 0.0) + t);
    float n3 = snoise(p + vec3(e, 0.0, 0.0) + t);
    float n4 = snoise(p - vec3(e, 0.0, 0.0) + t);
    float n5 = snoise(p + vec3(0.0, 0.0, e) + t);
    float n6 = snoise(p - vec3(0.0, 0.0, e) + t);

    float x = (n1 - n2) - (n5 - n6);
    float y = (n5 - n6) - (n3 - n4);
    float z = (n3 - n4) - (n1 - n2);
    return vec3(x, y, z) * 0.35;
  }

  // =========================================================================
  // FORMATION A: LEFT RIBBON (DIAGONAL FLOWING STREAM)
  // Enters from the left edge and arches diagonally toward the upper-middle region.
  // Stretches into a wider curve as user scrolls.
  // =========================================================================
  vec3 getLeftRibbon(vec3 seed, float t) {
    float flowSpeed = 0.038 * (0.85 + seed.z * 0.30);
    float u = fract(seed.x + t * flowSpeed); // Parametric progression [0..1]
    float v = (seed.y - 0.5) * 2.0;          // Transverse ribbon coordinate [-1..1]

    // Diagonal trajectory: from left edge (-62, -22) curving up toward (-8, 26)
    float startX = -62.0;
    float endX   = -8.0;
    float startY = -22.0;
    float endY   = 26.0;

    // Scroll stretches the ribbon into a wider, more expansive curve
    float scrollStretch = uScrollProgress * 8.5 * sin(u * 3.14159);
    float posX = mix(startX, endX, u) + sin(u * 3.14159) * 5.5 + scrollStretch;
    float posY = mix(startY, endY, pow(u, 0.92)) + sin(u * 2.6) * 4.0;
    float posZ = -12.0 + sin(u * 3.14159) * 16.0;

    // Ribbon width expands subtly on scroll
    float ribbonWidth = (14.0 + sin(u * 3.0) * 5.0) * (1.0 + uScrollProgress * 0.40);
    float twistAngle  = 0.55 + u * 1.35 + uScrollProgress * 0.50;

    // Transverse offset along ribbon plane
    float normalX = -sin(twistAngle) * 0.6;
    float normalY = cos(twistAngle);
    float normalZ = sin(twistAngle * 1.4);

    posX += v * ribbonWidth * normalX;
    posY += v * ribbonWidth * normalY;
    posZ += v * ribbonWidth * normalZ;

    // Subtle laminar curl breathing
    vec3 curl = curlNoise(vec3(u * 2.2, v * 1.2, t * 0.04), t * 0.015);
    return vec3(posX + curl.x * 2.2, posY + curl.y * 2.5, posZ + curl.z * 2.0);
  }

  // =========================================================================
  // FORMATION B: UPPER-RIGHT SPIRAL (CELESTIAL LOGARITHMIC VORTEX)
  // Delicate golden-ratio spiral of fine discrete orbital filaments.
  // Nucleus has a warm-orange focal glint; rotates and unfolds subtly on scroll.
  // =========================================================================
  vec3 getUpperRightSpiral(vec3 seed, float t) {
    // Spiral center in 3D space (upper right quadrant, matching reference)
    vec2 center = vec2(36.0, 18.0);

    // Orbital parameters
    float armCount = 4.0;
    float armIndex = floor(seed.x * armCount);
    float armOffset = armIndex * (6.283185 / armCount);

    // Theta: windings from inner core (~1.2 rad) to outer rim (~12.8 rad)
    float tProgress = seed.y;
    float theta = 1.2 + tProgress * 11.6;

    // Differential Keplerian rotation + scroll-driven subtle orbital rotation
    float orbitalSpeed = 0.040 / (0.45 + tProgress * 0.95);
    float scrollRotation = uScrollProgress * 1.6;
    float currentAngle = theta + armOffset + t * orbitalSpeed + scrollRotation;

    // Logarithmic radial curve + scroll unfolding
    float scrollUnfold = 1.0 + uScrollProgress * 0.32;
    float radius = 2.4 * pow(theta, 1.22) * scrollUnfold;

    // Transverse filament spread across orbital arm
    float filamentSpread = (seed.z - 0.5) * (1.2 + radius * 0.08);

    float posX = center.x + radius * cos(currentAngle) + filamentSpread * cos(currentAngle + 1.5708);
    float posY = center.y + radius * sin(currentAngle) * 0.88 + filamentSpread * sin(currentAngle + 1.5708);
    float posZ = -6.0 - radius * 0.18 + sin(theta * 1.8) * 3.5;

    // Subtle gravitational turbulence near core
    float coreProximity = 1.0 - smoothstep(1.5, 6.0, radius);
    vec3 curl = curlNoise(vec3(posX * 0.05, posY * 0.05, t * 0.03), t * 0.02);

    return vec3(posX + curl.x * (1.5 + coreProximity * 2.0),
                 posY + curl.y * (1.5 + coreProximity * 2.0),
                 posZ + curl.z * 1.5);
  }

  // =========================================================================
  // FORMATION C: LOWER WAVE (BROAD FLOWING WAVE CURVING UPWARD RIGHT)
  // Sweeps across bottom edge, dips under center hero text & scroll indicator,
  // and gradually curves upward toward the right edge.
  // =========================================================================
  vec3 getLowerWave(vec3 seed, float t) {
    float waveSpeed = 0.028 * (0.85 + seed.z * 0.30);
    float u = fract(seed.x + t * waveSpeed) * 2.0 - 1.0; // [-1.0 .. 1.0] across viewport
    float v = (seed.y - 0.5) * 2.0;                      // [-1.0 .. 1.0] transverse

    float posX = u * 68.0;

    // Natural dip in center (u ~ 0) to clear hero text & scroll indicator
    float centerDip = -6.5 * exp(-u * u * 4.2);
    // Signature upward right sweep: u * 5.2 elevates the wave by ~10 units toward the right
    float upwardRightSweep = u * 5.2;

    // Dynamic curvature variation with scroll progress
    float scrollWaveMod = sin(u * 3.2 + uScrollProgress * 3.14159) * (3.0 * uScrollProgress);
    float waveY = -24.0 + upwardRightSweep + sin(u * 2.6 - 0.4) * 6.5 + cos(u * 4.8) * 3.2 + centerDip + scrollWaveMod;

    // Ribbon thickness and stratification
    float width = (11.5 + cos(u * 2.2) * 4.0) * (1.0 + uScrollProgress * 0.25);
    float posY = waveY + v * width * 0.75 + sin(u * 3.5 + t * 0.35) * 1.8;
    float posZ = cos(u * 2.2) * 12.0 + (seed.z - 0.5) * 12.0 - 10.0 + sin(u * 2.5 + uScrollProgress * 2.0) * 4.0;

    vec3 curl = curlNoise(vec3(u * 2.0, v * 1.5, t * 0.03), t * 0.015);
    return vec3(posX + curl.x * 2.0, posY + curl.y * 2.2, posZ + curl.z * 2.0);
  }

  // =========================================================================
  // FORMATION D: AMBIENT DRIFTING SPACE POINTS
  // Sparse, serene dust floating between primary formations in deep space.
  // =========================================================================
  vec3 getAmbientField(vec3 seed, float t) {
    float ambX = (seed.x - 0.5) * 140.0;
    float ambY = (seed.y - 0.5) * 85.0;
    float ambZ = (seed.z - 0.5) * 45.0 - 16.0;

    vec3 curl = curlNoise(vec3(seed.x * 2.0, seed.y * 2.0, t * 0.02), t * 0.01);
    return vec3(ambX + curl.x * 4.0, ambY + curl.y * 4.0, ambZ + curl.z * 3.0);
  }

  // =========================================================================
  // STATE 0: MASTER HERO CINEMATIC COMPOSITION
  // Assembles Formation A (Left Ribbon), B (Upper-Right Spiral), C (Lower Wave),
  // and D (Ambient Space) into one unified coordinate system.
  // =========================================================================
  vec3 getMasterHeroComposition(vec3 seed, float formationId, float t) {
    if (formationId < 0.5) {
      return getLeftRibbon(seed, t);
    } else if (formationId < 1.5) {
      return getUpperRightSpiral(seed, t);
    } else if (formationId < 2.5) {
      return getLowerWave(seed, t);
    } else {
      return getAmbientField(seed, t);
    }
  }

  // =========================================================================
  // SCROLL STATES 1-4: CONTINUOUS REVERSIBLE TRANSITIONS
  // =========================================================================

  // STATE 1: Flowing Harmonized Waves (About & Capabilities)
  vec3 getFlowingWaves(vec3 seed, float t) {
    float waveX = (seed.x - 0.5) * 145.0;
    float waveFreq1 = 0.032;
    float waveFreq2 = 0.064;
    float waveY = sin(waveX * waveFreq1 + t * 0.45 + seed.z * 2.2) * 12.0 
                + sin(waveX * waveFreq2 - t * 0.30) * 4.5 
                + (seed.y - 0.5) * 26.0;
    float waveZ = cos(waveX * waveFreq1 + t * 0.40 + seed.y * 2.2) * 10.0 
                + (seed.z - 0.5) * 14.0 - 12.0;
    return vec3(waveX, waveY, waveZ);
  }

  // STATE 2: 3D Spatial Constellation Spirals (Work & Projects)
  vec3 getSpatialSpirals(vec3 seed, float t) {
    float ringIndex = floor(seed.x * 4.0);
    float baseR = 16.0 + ringIndex * 9.0 + seed.y * 5.0;
    float direction = (seed.z > 0.5) ? 1.0 : -0.8;
    float speed = (0.20 / (1.0 + ringIndex * 0.20)) * direction;
    float theta = seed.y * 6.283185 + t * speed;
    float tilt = 0.25 * (ringIndex - 1.5);

    float orbX = baseR * cos(theta);
    float orbY = baseR * sin(theta) * cos(tilt) + (seed.z - 0.5) * 6.0;
    float orbZ = baseR * sin(theta) * sin(tilt) - 12.0;
    return vec3(orbX, orbY, orbZ);
  }

  // STATE 3: Loosened Celestial Filaments (Writing & Lab)
  vec3 getLoosenedFilaments(vec3 seed, float t) {
    float angle = seed.x * 6.283185;
    float radius = 18.0 + seed.y * 25.0;
    float tunnelLength = 100.0;
    float tunnelZ = mod((seed.z - 0.5) * tunnelLength + t * 10.0, tunnelLength) - (tunnelLength * 0.5);
    float twist = tunnelZ * 0.015;
    float tunnelX = radius * cos(angle + twist);
    float tunnelY = radius * sin(angle + twist) * 0.75;
    return vec3(tunnelX, tunnelY, tunnelZ);
  }

  // STATE 4: Quiet Atmospheric Dispersal (Contact & Footer)
  vec3 getQuietField(vec3 seed, float t) {
    float expansion = 1.0 + (seed.x + seed.y) * 0.35;
    float dissX = (seed.x - 0.5) * 155.0 * expansion + sin(t * 0.12 + seed.z * 4.0) * 5.0;
    float dissY = (seed.y - 0.5) * 110.0 * expansion + cos(t * 0.10 + seed.x * 4.0) * 5.0;
    float dissZ = (seed.z - 0.5) * 60.0 - 16.0;
    return vec3(dissX, dissY, dissZ);
  }

  void main() {
    vLayer = aLayer;
    vIsOrange = aIsOrange;
    float effectiveTime = uTime;

    // 1. CALCULATE 5 CONTINUOUS STATES
    vec3 pos0 = getMasterHeroComposition(aSeed, aFormationId, effectiveTime);
    vec3 pos1 = getFlowingWaves(aSeed, effectiveTime);
    vec3 pos2 = getSpatialSpirals(aSeed, effectiveTime);
    vec3 pos3 = getLoosenedFilaments(aSeed, effectiveTime);
    vec3 pos4 = getQuietField(aSeed, effectiveTime);

    // 2. SMOOTH C-INFINITY MORPHING ACROSS SCROLL PROGRESS
    // State 0: Hero Master Composition (Left Ribbon + Right Spiral + Lower Wave + Orange)
    // States 1-4: Smoothly morph into calmer section configurations
    float p = clamp(uScrollProgress, 0.0, 1.0);
    float dist0 = abs(p - 0.03);
    float dist1 = abs(p - 0.28);
    float dist2 = abs(p - 0.52);
    float dist3 = abs(p - 0.76);
    float dist4 = abs(p - 0.98);

    float w0 = exp(-dist0 * dist0 * 36.0);
    float w1 = exp(-dist1 * dist1 * 36.0);
    float w2 = exp(-dist2 * dist2 * 36.0);
    float w3 = exp(-dist3 * dist3 * 36.0);
    float w4 = exp(-dist4 * dist4 * 36.0);

    float totalW = w0 + w1 + w2 + w3 + w4 + 0.0001;
    w0 /= totalW;
    w1 /= totalW;
    w2 /= totalW;
    w3 /= totalW;
    w4 /= totalW;

    vec3 pos = pos0 * w0 + pos1 * w1 + pos2 * w2 + pos3 * w3 + pos4 * w4;

    // Vertical scroll parallax & momentum impulse
    pos.y += uScrollOffset * (0.024 + aLayer * 0.032);
    pos.y += uScrollVel * (0.040 + aLayer * 0.055);

    // =========================================================================
    // 2B. ROCKET LAUNCH EFFECT (CINEMATIC ASCENT & FLUID THRUSTER EXHAUST PLUME)
    // =========================================================================
    float rocketFlame = 0.0;
    if (uRocketTime >= 0.0 && uRocketTime < 4.8) {
      float tLaunch = uRocketTime;
      // Pad origin in 3D world space
      vec3 padPos = vec3(uRocketOrigin.x * 48.0, -28.0 + uRocketOrigin.y * 12.0, -5.0);

      // Rocket physics trajectory:
      // [0.0..0.40]: Ignition spool-up & pad vibration
      // [0.40..4.8]: Liftoff & vertical supersonic acceleration
      float tFlight = max(0.0, tLaunch - 0.40);
      float rocketY = padPos.y + tFlight * 16.5 + tFlight * tFlight * 10.2;
      float rocketX = padPos.x + sin(tFlight * 1.5) * 2.2;
      float rocketZ = padPos.z + cos(tFlight * 1.1) * 2.5;
      vec3 rocketPos = vec3(rocketX, rocketY, rocketZ);

      // Pad ignition rumble
      if (tLaunch < 0.40) {
        float rumble = sin(tLaunch * 80.0) * 0.7;
        rocketPos.x += rumble;
        rocketPos.y += cos(tLaunch * 70.0) * 0.5;
      }

      // 1. DEDICATED ROCKET VESSEL & THRUSTER EXHAUST PLUME (~18% of particles)
      if (aSeed.x < 0.18) {
        float rocketFrac = aSeed.x / 0.18; // [0.0 .. 1.0]

        if (rocketFrac < 0.12) {
          // A. ROCKET NOSE CONE & AERODYNAMIC HULL
          float coneT = rocketFrac / 0.12; // 0 at tip, 1 at nozzle
          float coneHeight = 4.2;
          float coneRadius = (1.0 - coneT * 0.65) * 1.1;
          float coneAngle = aSeed.y * 6.283185 + effectiveTime * 8.0;

          pos.x = rocketX + cos(coneAngle) * coneRadius;
          pos.y = rocketY + (1.0 - coneT) * coneHeight - 0.5;
          pos.z = rocketZ + sin(coneAngle) * coneRadius * 0.9;
          rocketFlame = 0.35; // Pure white crystalline needle tip
        } else {
          // B. SUPERHEATED THRUSTER EXHAUST PLUME & SUPERSONIC MACH DIAMONDS
          float plumeFrac = (rocketFrac - 0.12) / 0.88; // 0..1 along plume length
          float plumeDist = plumeFrac * 50.0; // Trails 50 units downward

          // Aerodynamic nozzle expansion
          float plumeRadius = 0.60 + plumeDist * 0.18 + sin(plumeDist * 3.0 - effectiveTime * 28.0) * 0.35;

          // Mach diamond periodic pressure nodes
          float machPulse = 1.0 + 0.45 * sin(plumeDist * 2.2 - effectiveTime * 32.0);
          float plumeAngle = aSeed.y * 6.283185 + effectiveTime * 38.0;

          float pX = rocketX + cos(plumeAngle) * plumeRadius * machPulse + (aSeed.z - 0.5) * 1.5;
          float pY = rocketY - 1.2 - plumeDist;
          float pZ = rocketZ + sin(plumeAngle) * plumeRadius * 0.9;

          pos = vec3(pX, pY, pZ);
          // Flame intensity fades from blinding white at nozzle to amber smoke
          rocketFlame = clamp(1.0 - (plumeDist / 46.0), 0.0, 1.0) * 2.2;
        }
      } else {
        // 2. LAUNCH PAD BLAST WAVE & BILLOWING SMOKE (tLaunch < 2.2)
        if (tLaunch < 2.2 && pos.y < (padPos.y + 16.0)) {
          float padDist = length(pos.xy - padPos.xy);
          float padBlast = smoothstep(24.0, 0.0, padDist) * (1.0 - tLaunch / 2.2);
          vec2 blastDir = normalize(pos.xy - padPos.xy + vec2(0.001, -2.0));
          pos.xy += blastDir * (padBlast * 14.0 * sin(tLaunch * 3.14159));
          rocketFlame = max(rocketFlame, padBlast * 0.75);
        }

        // 3. SUPERSONIC MACH CONE & AERODYNAMIC BOW SHOCKWAVE ACROSS THE UNIVERSE
        vec3 deltaRocket = pos - rocketPos;
        float trailDistY = rocketPos.y - pos.y;
        if (trailDistY > 0.0 && trailDistY < 60.0) {
          float radialDist = length(deltaRocket.xz);
          float machConeRadius = trailDistY * 0.70; // Mach cone angle
          float coneDist = abs(radialDist - machConeRadius);
          if (coneDist < 9.5) {
            float shockStrength = (1.0 - coneDist / 9.5) * smoothstep(60.0, 6.0, trailDistY);
            vec3 shockPush = normalize(vec3(deltaRocket.x, 0.0, deltaRocket.z) + vec3(0.001));
            pos += shockPush * (shockStrength * 4.5);
            rocketFlame = max(rocketFlame, shockStrength * 0.65);
          }
        }
      }
    }
    vRocketFlame = rocketFlame;

    // Screen-space NDC projection
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndc = projected.xy / projected.w;

    // =========================================================================
    // 3. CENTRAL NEGATIVE SPACE & HERO TEXT PROTECTION
    // Keeps the region behind the hero title ("AI TO INNOVATION.") dark and uncluttered.
    // =========================================================================
    vec2 heroCenter = vec2(0.0, 0.04);
    vec2 heroDelta = (ndc - heroCenter) / vec2(0.56, 0.28);
    float heroDist = length(heroDelta);
    // Soft, localized attenuation (0.50 directly behind letters, 1.0 outside)
    float heroClearance = smoothstep(0.32, 1.15, heroDist);
    float heroScrollWeight = 1.0 - smoothstep(0.0, 0.20, uScrollProgress);
    float heroAttenuation = mix(1.0, mix(0.50, 1.0, heroClearance), heroScrollWeight);

    // =========================================================================
    // 4. FLUID CURSOR INTERACTION (LOCALIZED STREAMLINE BENDING)
    // Particles deflect gently around the pointer like a smooth physical medium.
    // =========================================================================
    vec2 aspectVec = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 pointerDiff = (ndc - uPointer) * aspectVec;
    float distToPointer = length(pointerDiff);

    float radius = uPointerRadius; // Controlled radius (~125px)
    float cursorGlow = 0.0;

    if (distToPointer < radius && distToPointer > 0.0001 && uPointerActive > 0.001) {
      float tDist = 1.0 - (distToPointer / radius);
      // Cubic Hermite smoothstep for gentle fluid touch
      float falloff = tDist * tDist * (3.0 - 2.0 * tDist) * uPointerActive;

      vec2 repulseDir = normalize(pointerDiff);
      float depthFactor = (0.35 + aLayer * 0.45);

      // Localized radial deflection
      vec2 repulseDisp = repulseDir * (falloff * uPointerForce * depthFactor);

      // Tangential streamline curvature: current bends around the pointer
      vec2 tangent = vec2(-repulseDir.y, repulseDir.x) * sign(uPointerVel.x + 0.001);
      vec2 streamCurve = tangent * (falloff * 0.07 * depthFactor);

      // Directional velocity wake
      float velMag = length(uPointerVel);
      vec2 velDir = velMag > 0.001 ? normalize(uPointerVel) : vec2(0.0);
      vec2 velWake = velDir * (falloff * clamp(velMag * 0.20, 0.0, 0.12) * depthFactor);

      // Apply displacement in projected world coordinates
      pos.xy += (repulseDisp + streamCurve + velWake) * (projected.w * 0.32);
      pos.z -= falloff * 4.0 * depthFactor;

      cursorGlow = falloff * 0.20;
    }

    // Click shockwave pulse
    if (uShockTime > 0.0 && uShockTime < 1.0) {
      vec2 shockDiff = (ndc - uShockOrigin) * aspectVec;
      float shockDist = length(shockDiff);
      float waveRadius = uShockTime * 0.85;
      float waveThickness = 0.12;
      float waveDelta = abs(shockDist - waveRadius);
      if (waveDelta < waveThickness) {
        float waveStrength = (1.0 - waveDelta / waveThickness) * (1.0 - uShockTime / 1.0);
        vec2 waveDir = normalize(shockDiff + 0.0001);
        pos.xy += waveDir * (waveStrength * 4.0 * (0.50 + aLayer * 0.35));
        cursorGlow += waveStrength * 0.30;
      }
    }

    // Recalculate MVP position after physical displacements
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // =========================================================================
    // 5. DEPTH-OF-FIELD (DoF) & SCROLL PROGRESS MODULATION
    // Dynamically modulates point size and opacity based on vertical scroll
    // progress, creating a shifting cinematic focal plane where particles appear
    // more distant or tightly clustered depending on viewport position.
    // =========================================================================
    float distanceCam = -mvPosition.z;

    // Dynamic focal plane: sweeps through 3D depth strata based on vertical scroll
    // - Hero (0.0): focal plane locked at ~67.0 (hero ribbons & spiral in sharp focus)
    // - Mid-scroll (0.5): sweeps toward ~83.0 (sharpening deep constellation clusters)
    // - Footer (1.0): settles to ~73.0 (broad ambient starlight)
    float focalPlane = 67.0 + sin(uScrollProgress * 3.14159) * 16.0 + uScrollProgress * 6.0;
    float depthDelta = abs(distanceCam - focalPlane);
    float dofBlurFactor = clamp(depthDelta / 34.0, 0.0, 1.0);
    vDofBlur = dofBlurFactor;

    // DoF Size Modulation:
    // In-focus particles stay crisp and pinpoint; out-of-focus background particles scale down slightly
    float dofSizeMod = 1.0 - dofBlurFactor * 0.18 + (1.0 - dofBlurFactor) * 0.10 * aLayer;
    // Micro clustering pulsation across scroll progress
    float clusterMod = 1.0 + 0.08 * sin(uScrollProgress * 6.28318 + aSeed.z * 5.0) * (1.0 - dofBlurFactor);

    float perspectiveScale = clamp(68.0 / max(distanceCam, 10.0), 0.78, 1.22);
    float speedSizeBoost = 1.0 + clamp(uScrollSpeedNorm * 0.06, 0.0, 0.10);

    float cssDiameter = aSize * perspectiveScale * uSizeVariation * speedSizeBoost * dofSizeMod * clusterMod;
    cssDiameter *= (1.0 + rocketFlame * 0.55);
    cssDiameter = clamp(cssDiameter, 1.95, 6.00);

    float physicalSize = cssDiameter * uPixelRatio;
    // Guaranteed crisp rendering with +50% size presence: clamped between 2.55px physical and 6.00 * uPixelRatio
    gl_PointSize = clamp(physicalSize, 2.55, 6.00 * uPixelRatio * uSizeVariation);

    // =========================================================================
    // 6. RADIANT OPACITY & SCINTILLATING SHINE (ENHANCED SPECULAR GLINT)
    // =========================================================================
    float twinklePhase = effectiveTime * (2.2 + aSeed.y * 3.4) + aSeed.x * 62.83;
    float twinkle = pow(max(0.0, sin(twinklePhase)), 4.0);
    vTwinkle = twinkle * (0.85 + aSeed.z * 0.45);

    float depthAlpha = 0.78 + 0.22 * smoothstep(-110.0, -30.0, mvPosition.z);
    float pulse = 0.94 + 0.06 * sin(effectiveTime * 0.65 + aSeed.z * 10.0);

    // DoF Alpha modulation: in-focus particles are luminous; defocused particles soften
    float dofAlphaMod = mix(1.12, 0.78, smoothstep(0.12, 0.85, dofBlurFactor));
    // Content section attenuation: subtle reduction while reading project/article cards
    float scrollDofFade = 1.0 - smoothstep(0.15, 0.85, uScrollProgress) * 0.14;

    vAlpha = clamp((aAlpha * depthAlpha * pulse + cursorGlow * 1.25 + vTwinkle * 0.45 + rocketFlame * 0.70) * uOpacity * heroAttenuation * dofAlphaMod * scrollDofFade, 0.0, 1.0);

    // =========================================================================
    // 7. COLOR PALETTE: MONOCHROME SILVER + SPARSE WARM-ORANGE ACCENTS
    // =========================================================================
    vec3 silverGrey   = vec3(0.68, 0.72, 0.80);  // Crisp cool silver-grey
    vec3 platinumMid  = vec3(0.88, 0.91, 0.96);  // Radiant silk platinum
    vec3 pureWhite    = vec3(1.00, 1.00, 1.00);  // Pure crystalline white

    vec3 baseSilver;
    if (aLayer < 0.5) {
      baseSilver = silverGrey;
    } else if (aLayer < 1.5) {
      baseSilver = mix(silverGrey, platinumMid, 0.75);
    } else {
      baseSilver = mix(platinumMid, pureWhite, 0.85);
    }

    if (aIsOrange > 0.5) {
      // Warm orange / amber palette matching reference screenshot
      vec3 amberOrange = vec3(1.00, 0.48, 0.10); // Vibrant warm amber orange
      vec3 goldenWarm  = vec3(1.00, 0.65, 0.22); // Radiant golden accent
      vec3 deepFlame   = vec3(0.96, 0.38, 0.06); // Deep rich amber
      vec3 orangeCol = mix(deepFlame, amberOrange, aSeed.x);
      if (aLayer > 1.5) {
        orangeCol = mix(amberOrange, goldenWarm, 0.80);
      }
      vColor = orangeCol;
    } else {
      vColor = mix(baseSilver, uThemeColor, 0.04);
    }
  }
`;

const fragmentShader = `
  uniform float uOpacity;
  uniform float uGlowIntensity;

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vIsOrange;
  varying float vDofBlur;
  varying float vRocketFlame;

  void main() {
    // Coordinate normalized to [-0.5, 0.5] from center of point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    // Strict circular discard
    if (dist > 0.5) {
      discard;
    }

    // =========================================================================
    // REFINED CIRCULAR FRAGMENT DISCIPLINE WITH INTENSE SPECULAR SHINE
    // =========================================================================
    // 1. Sub-pixel anti-aliased edge mask for clean circular discipline
    float edgeMask = smoothstep(0.50, 0.25, dist);

    // 2. Needle-point specular core (instantaneous falloff, brilliant diamond center)
    float coreSharpness = mix(9.2, 6.8, vDofBlur);
    float core = exp(-dist * coreSharpness) * mix(1.85, 1.35, vDofBlur);

    // 3. Subtle radial falloff glow halo (controlled luminous warmth and ethereal shine)
    float radialFalloff = exp(-dist * 4.2) * (mix(0.72, 0.88, vDofBlur) * uGlowIntensity);
    float glowAura = pow(max(0.0, 1.0 - dist * 2.0), 2.0) * (0.45 * uGlowIntensity);
    float totalRadialGlow = radialFalloff + glowAura;

    // 4. Optical 4-point diamond star cross rays (scintillation glint)
    float rayH = exp(-abs(coord.y) * 20.0) * max(0.0, 1.0 - abs(coord.x) * 2.0);
    float rayV = exp(-abs(coord.x) * 20.0) * max(0.0, 1.0 - abs(coord.y) * 2.0);
    float starFlare = (rayH + rayV) * 0.52;

    // 5. Faceted diagonal glint (crystalline facet)
    vec2 diag = vec2(coord.x + coord.y, coord.x - coord.y) * 0.7071;
    float diagRay1 = exp(-abs(diag.y) * 24.0) * max(0.0, 1.0 - abs(diag.x) * 2.2);
    float diagRay2 = exp(-abs(diag.x) * 24.0) * max(0.0, 1.0 - abs(diag.y) * 2.2);
    float diamondGlint = (diagRay1 + diagRay2) * 0.30;

    // 6. Total combined radiant luminous intensity (extra shiner)
    float luminousIntensity = core 
                            + totalRadialGlow 
                            + (starFlare + diamondGlint) * (0.85 + vTwinkle * 1.65);

    // 7. Core whiteness: pure white needle center for brilliant specular shine
    vec3 pureWhite = vec3(1.0, 1.0, 1.0);
    float coreWhiteness = clamp(core * 0.75 + vTwinkle * 0.70, 0.0, 1.0);
    vec3 finalColor = mix(vColor, pureWhite, coreWhiteness * 0.88);

    // 8. Incandescent rocket propulsion fire colors
    if (vRocketFlame > 0.01) {
      vec3 flameCore = vec3(1.0, 1.0, 1.0);       // Superheated blinding white nozzle
      vec3 flameGold = vec3(1.0, 0.88, 0.28);     // Radiant golden plasma
      vec3 flameAmber = vec3(1.0, 0.44, 0.06);    // Rich amber rocket flame
      vec3 flameSmoke = vec3(0.90, 0.35, 0.05);   // Incandescent flame trail

      vec3 flameCol = mix(flameSmoke, flameAmber, clamp(vRocketFlame * 0.8, 0.0, 1.0));
      if (vRocketFlame > 0.8) {
        flameCol = mix(flameAmber, flameGold, clamp((vRocketFlame - 0.8) * 1.2, 0.0, 1.0));
      }
      if (vRocketFlame > 1.5) {
        flameCol = mix(flameGold, flameCore, clamp((vRocketFlame - 1.5) * 1.4, 0.0, 1.0));
      }
      finalColor = mix(finalColor, flameCol, clamp(vRocketFlame * 1.2, 0.0, 1.0));
    }

    float finalAlpha = clamp(vAlpha * (luminousIntensity * 0.75 + edgeMask * 0.40) * uOpacity, 0.0, 1.0);

    if (finalAlpha < 0.005) {
      discard;
    }

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export const MotionParticleWorld: React.FC<MotionParticleWorldProps> = ({
  opacity = 1.0,
  sizeVariation = 1.0,
  glowIntensity = 1.0,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;
  const sizeVariationRef = useRef(sizeVariation);
  sizeVariationRef.current = sizeVariation;
  const glowIntensityRef = useRef(glowIntensity);
  glowIntensityRef.current = glowIntensity;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    // WebGL support verification
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) return;
    } catch {
      return;
    }

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(46, width / height, 1, 300);
    camera.position.set(0, 0, 70);

    // 2. High-Performance WebGL Renderer Setup (antialias: false for optimal PointSprite fillrate)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0); // 100% transparent clear color
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const domCanvas = renderer.domElement;
    domCanvas.style.position = 'absolute';
    domCanvas.style.top = '0';
    domCanvas.style.left = '0';
    domCanvas.style.width = '100%';
    domCanvas.style.height = '100%';
    domCanvas.style.pointerEvents = 'none';
    container.appendChild(domCanvas);

    // =========================================================================
    // 3. GENERATIVE BUFFERGEOMETRY: STRUCTURED CINEMATIC FORMATIONS
    // =========================================================================
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const layers = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT * 3);
    const alphas = new Float32Array(PARTICLE_COUNT);
    const formationIds = new Float32Array(PARTICLE_COUNT);
    const isOranges = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const seedVal = Math.random();

      // Formation Assignment:
      // ~30% Left Ribbon (0)
      // ~35% Upper-Right Spiral (1)
      // ~25% Lower Wave (2)
      // ~10% Ambient Space Field (3)
      let formationId = 0;
      if (seedVal > 0.90) {
        formationId = 3; // Ambient
      } else if (seedVal > 0.65) {
        formationId = 2; // Lower Wave
      } else if (seedVal > 0.30) {
        formationId = 1; // Upper-Right Spiral
      } else {
        formationId = 0; // Left Ribbon
      }

      // Layer Distribution (+50% Scaled Presence):
      // - Distant / Ambient (~65%): 2.16–2.78 CSS px, Alpha: 0.28–0.40
      // - Main Ribbon Spine (~27%): 2.91–3.86 CSS px, Alpha: 0.46–0.66
      // - Highlight Stars & Nucleus (~8%): 4.04–5.36 CSS px, Alpha: 0.72–0.92
      let layer = 0;
      let cssSize = 2.16 + Math.random() * 0.62;   // 2.16 – 2.78 CSS px (+50%)
      let alphaBase = 0.28 + Math.random() * 0.12; // 0.28 – 0.40 opacity

      if (seedVal > 0.92) {
        // HIGHLIGHT STAR & RADIANT NUCLEUS (~8%)
        layer = 2;
        cssSize = 4.04 + Math.random() * 1.32;     // 4.04 – 5.36 CSS px (+50%)
        alphaBase = 0.72 + Math.random() * 0.20;   // 0.72 – 0.92 opacity
      } else if (seedVal > 0.65) {
        // MAIN RIBBON SPINE & ORBITAL ARMS (~27%)
        layer = 1;
        cssSize = 2.91 + Math.random() * 0.95;     // 2.91 – 3.86 CSS px (+50%)
        alphaBase = 0.46 + Math.random() * 0.20;   // 0.46 – 0.66 opacity
      }

      // Initial parametric base seeds
      const seedX = Math.random(); // Longitudinal / orbital parameter
      const seedY = Math.random(); // Transverse / radial parameter
      const seedZ = Math.random(); // Speed & phase variance

      // Warm-orange accent determination (~6% of total particles):
      // 1. Spiral core nucleus (tight inner windings where seedY < 0.22)
      // 2. Lower wave crest accents (seedX crest regions)
      // 3. Rare Left Ribbon accents
      let isOrange = 0.0;
      if (formationId === 1 && seedY < 0.22 && Math.random() < 0.75) {
        isOrange = 1.0; // Radiant golden spiral nucleus
      } else if (formationId === 2 && Math.sin(seedX * 6.28) > 0.55 && Math.random() < 0.12) {
        isOrange = 1.0; // Lower wave crest sparks
      } else if (formationId === 0 && Math.random() < 0.03) {
        isOrange = 1.0; // Left ribbon golden accent
      }

      seeds[i3] = seedX;
      seeds[i3 + 1] = seedY;
      seeds[i3 + 2] = seedZ;

      // Base initial positions
      positions[i3] = (seedX - 0.5) * 160.0;
      positions[i3 + 1] = (seedY - 0.5) * 80.0;
      positions[i3 + 2] = (seedZ - 0.5) * 50.0 - 15.0;

      layers[i] = layer;
      sizes[i] = cssSize;
      alphas[i] = alphaBase;
      formationIds[i] = formationId;
      isOranges[i] = isOrange;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute('aFormationId', new THREE.BufferAttribute(formationIds, 1));
    geometry.setAttribute('aIsOrange', new THREE.BufferAttribute(isOranges, 1));

    // 4. Custom Shader Material with Additive Blending
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerVel: { value: new THREE.Vector2(0, 0) },
      uPointerRadius: { value: 0.18 },     // Smooth localized force field (~125px)
      uPointerForce: { value: 0.12 },      // Gentle, restrained localized push
      uPointerActive: { value: 0.0 },      // Smooth fade for enter/leave
      uScrollOffset: { value: 0 },
      uScrollVel: { value: 0 },
      uScrollProgress: { value: 0 },
      uScrollSpeedNorm: { value: 0 },
      uShockTime: { value: -1 },
      uShockOrigin: { value: new THREE.Vector2(0, 0) },
      uRocketTime: { value: -1.0 },
      uRocketOrigin: { value: new THREE.Vector2(0, -0.92) },
      uRocketActive: { value: 0.0 },
      uPixelRatio: { value: pixelRatio },  // DPR calibrated
      uThemeColor: { value: new THREE.Color(0xbcc5d2) }, // Radiant platinum
      uOpacity: { value: opacityRef.current },
      uSizeVariation: { value: sizeVariationRef.current },
      uGlowIntensity: { value: glowIntensityRef.current },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 5. Physics & Dynamic State Interpolators
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let pointerVelX = 0;
    let pointerVelY = 0;

    let targetPointerActive = 0.0;
    let smoothPointerActive = 0.0;

    let targetScrollY = 0;
    let smoothScrollY = 0;
    let targetScrollProgress = 0;
    let smoothScrollProgress = 0;
    let scrollVel = 0;
    let rawScrollSpeed = 0;
    let smoothScrollSpeedNorm = 0;

    let shockStartTime = -1;
    let rocketStartTime = -1;
    const targetColor = new THREE.Color(0xbcc5d2);

    // Window pointer activity listeners
    const onPointerEnter = () => {
      targetPointerActive = 1.0;
    };
    const onPointerLeave = () => {
      targetPointerActive = 0.0;
    };
    const onPointerMoveWindow = () => {
      targetPointerActive = 1.0;
    };

    window.addEventListener('pointerenter', onPointerEnter, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('pointermove', onPointerMoveWindow, { passive: true });

    // Listen to SingularityInteractionEngine
    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPointerX = state.ndcX;
      targetPointerY = state.ndcY;
      targetScrollY = state.scrollY;
      targetScrollProgress = state.scrollProgress;
      rawScrollSpeed = Math.abs(state.scrollVelocity || state.smoothedScrollVelocity || 0);

      targetPointerActive = 1.0;

      if (state.lastClickTime > 0) {
        shockStartTime = state.lastClickTime / 1000;
        uniforms.uShockOrigin.value.set(state.ndcX, state.ndcY);
      }

      if (state.lastRocketLaunchTime > 0) {
        rocketStartTime = state.lastRocketLaunchTime / 1000;
        uniforms.uRocketOrigin.value.set(
          state.rocketLaunchOrigin.ndcX,
          state.rocketLaunchOrigin.ndcY
        );
      }

      // Restrained section theme adaptation (subtle titanium/silver nuances)
      const secName = state.sectionTheme?.name || 'hero';
      if (secName === 'hero') {
        targetColor.setHex(0xbcc5d2); // Titanium platinum
      } else if (secName === 'about') {
        targetColor.setHex(0xa3abb8); // Cool graphite
      } else if (secName === 'projects' || secName === 'capabilities') {
        targetColor.setHex(0xabb2bf); // Slate titanium
      } else if (secName === 'engineering') {
        targetColor.setHex(0xc4ccdc); // Arctic platinum
      } else if (secName === 'constellation' || secName === 'digital-dna') {
        targetColor.setHex(0xcad2e2); // Brilliant silver
      } else if (secName === 'writing') {
        targetColor.setHex(0x9fa6b2); // Quiet steel
      } else if (secName === 'contact') {
        targetColor.setHex(0xd2dae8); // Pearl silver
      }
    });

    // 6. Handle Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      uniforms.uResolution.value.set(w, h);
      uniforms.uPixelRatio.value = pr;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // WebGL Context Recovery
    let rafId: number;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(rafId);
    };

    const handleContextRestored = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      rafId = requestAnimationFrame(animate);
    };

    domCanvas.addEventListener('webglcontextlost', handleContextLost, false);
    domCanvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 7. Animation Loop (Delta-Time Based)
    let prevTime = performance.now();

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);

      const dt = Math.min(Math.max((time - prevTime) / 1000, 0.001), 0.08);
      prevTime = time;

      const seconds = time * 0.001;
      uniforms.uTime.value = seconds;

      uniforms.uOpacity.value = opacityRef.current;
      uniforms.uSizeVariation.value = sizeVariationRef.current;
      uniforms.uGlowIntensity.value = glowIntensityRef.current;

      // Smooth pointer presence
      smoothPointerActive += (targetPointerActive - smoothPointerActive) * (dt * 7.5);
      uniforms.uPointerActive.value = smoothPointerActive;

      // Pointer interpolation
      const oldX = smoothPointerX;
      const oldY = smoothPointerY;
      smoothPointerX += (targetPointerX - smoothPointerX) * 0.12;
      smoothPointerY += (targetPointerY - smoothPointerY) * 0.12;

      pointerVelX = (smoothPointerX - oldX) / dt;
      pointerVelY = (smoothPointerY - oldY) / dt;

      uniforms.uPointer.value.set(smoothPointerX, smoothPointerY);
      uniforms.uPointerVel.value.set(pointerVelX * 0.012, pointerVelY * 0.012);

      // Scroll interpolation
      const oldScroll = smoothScrollY;
      smoothScrollY += (targetScrollY - smoothScrollY) * 0.10;
      scrollVel = (smoothScrollY - oldScroll) * 0.018;

      // Dynamic velocity calculation
      const deltaScrollSpeed = Math.abs(smoothScrollY - oldScroll) / dt;
      const combinedScrollSpeed = Math.max(deltaScrollSpeed, rawScrollSpeed * 60.0);
      const targetSpeedNorm = Math.min(combinedScrollSpeed / 1200.0, 1.5);
      smoothScrollSpeedNorm += (targetSpeedNorm - smoothScrollSpeedNorm) * 0.10;
      uniforms.uScrollSpeedNorm.value = smoothScrollSpeedNorm;

      // Viewport scroll progress fallback
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const directProgress = Math.min(Math.max((window.scrollY || 0) / docHeight, 0), 1);
      const activeProgressTarget = targetScrollProgress > 0 ? targetScrollProgress : directProgress;
      smoothScrollProgress += (activeProgressTarget - smoothScrollProgress) * 0.08;

      uniforms.uScrollOffset.value = -smoothScrollY * 0.010;
      uniforms.uScrollVel.value = -scrollVel;
      uniforms.uScrollProgress.value = smoothScrollProgress;

      // Shockwave timing
      if (shockStartTime > 0) {
        const shockElapsed = seconds - shockStartTime;
        if (shockElapsed > 1.2) {
          uniforms.uShockTime.value = -1;
        } else {
          uniforms.uShockTime.value = shockElapsed;
        }
      }

      // Rocket launch timing
      if (rocketStartTime > 0) {
        const rocketElapsed = seconds - rocketStartTime;
        if (rocketElapsed > 4.8) {
          uniforms.uRocketTime.value = -1.0;
          uniforms.uRocketActive.value = 0.0;
        } else {
          uniforms.uRocketTime.value = rocketElapsed;
          uniforms.uRocketActive.value = 1.0;
        }
      }

      uniforms.uThemeColor.value.lerp(targetColor, 0.03);

      // Subtle scene camera breathing
      camera.position.x += (smoothPointerX * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (smoothPointerY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('resize', handleResize);
      domCanvas.removeEventListener('webglcontextlost', handleContextLost);
      domCanvas.removeEventListener('webglcontextrestored', handleContextRestored);
      cancelAnimationFrame(rafId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(domCanvas)) {
        container.removeChild(domCanvas);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={mountRef}
      className={`MotionParticleWorld fixed inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden ${className}`.trim()}
      style={{
        contain: 'strict',
      }}
    />
  );
};

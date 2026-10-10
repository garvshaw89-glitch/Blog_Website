import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

/**
 * SIGNATURE DIAGONAL PARTICLE CURRENTS — DIGITAL SILK
 * 
 * An original, luxury generative particle environment inspired by fine digital silk
 * flowing diagonally through deep black space.
 * 
 * Visual Architecture:
 * 1. Layered Diagonal Silk Currents:
 *    - Primary Flowing Current: Wide, undulating ribbon of fine silver points with
 *      3D twisting folds, sweeping from mid-left down under the hero and arching into
 *      a majestic crest on the right.
 *    - Secondary Braided Currents: Delicate upper and lower filaments intertwining
 *      along the main body with subtle phase offsets and parabolic curves.
 *    - Ambient Drifting Points: Sparse, fine particles drifting between currents into
 *      deep negative space.
 * 2. Precise Micro-Particle Sizing (Target Calibrations):
 *    - Fine particles (~78%): 0.8–1.2 CSS pixels (main silk texture)
 *    - Secondary particles (~18%): 1.2–1.7 CSS pixels (ribbon spines & depth)
 *    - Highlight stars (~4%): 1.7–2.2 CSS pixels (rare crystalline accents)
 *    - Physical pixel clamp ensuring crisp rasterization on all displays.
 * 3. Hero Text Protection:
 *    - Spatially varying reduction around the central headline text
 *    - Natural ribbon dip below the typography
 *    - Concentrated brighter formations toward the outer flanks (asymmetrical crest on the right)
 * 4. Fluid Cursor Disturbance:
 *    - Gentle localized bending, tangential streamline curvature, and directional wake
 *    - Smooth damped recovery back to original trajectories (no permanent drift, no size increase)
 * 5. Continuous Scroll-Driven Morphing:
 *    - Diagonal currents -> flowing waves -> 3D spirals -> loosened starlight -> new curved currents
 *    - Fully reversible on scroll up, synchronized with native scrolling.
 */

export interface MotionParticleWorldProps {
  opacity?: number;
  sizeVariation?: number;
  glowIntensity?: number;
  className?: string;
}

const PARTICLE_COUNT = 7500;

const vertexShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;          // Normalized [-1, 1] screen coordinates
  uniform vec2 uPointerVel;       // Cursor velocity vector
  uniform float uPointerRadius;   // Influence radius (~125px)
  uniform float uPointerForce;    // Gentle repulsion force
  uniform float uPointerActive;   // Smooth fade factor [0..1] for cursor presence
  uniform float uScrollOffset;    // Smooth vertical scroll parallax
  uniform float uScrollVel;       // Scroll momentum impulse
  uniform float uScrollProgress;  // Normalized scroll progression [0.0 to 1.0]
  uniform float uScrollSpeedNorm; // Normalized scroll speed [0.0 to 1.0+]
  uniform float uShockTime;       // Click shockwave time elapsed
  uniform vec2 uShockOrigin;      // Click origin in NDC
  uniform float uPixelRatio;      // Device pixel ratio (1x, 2x, 3x)
  uniform vec3 uThemeColor;       // Subtly blended ambient section tone
  uniform float uOpacity;         // Global opacity uniform
  uniform float uSizeVariation;   // Global size variation uniform
  uniform float uGlowIntensity;   // Radial falloff and luminous glow intensity uniform

  attribute float aSize;          // Pre-calibrated CSS pixel diameter (0.8 to 2.2)
  attribute float aLayer;         // 0 = DISTANT, 1 = MAIN, 2 = HIGHLIGHT
  attribute vec3 aSeed;           // Deterministic unique particle seeds
  attribute float aAlpha;         // Base target alpha (0.35 to 0.88)
  attribute float aCurrentId;     // 0 = Primary Ribbon, 1 = Upper Wisp, 2 = Lower Wisp, 3 = Ambient

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;

  // 3D Simplex-like noise helper for smooth organic currents
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
  // STATE 0: SIGNATURE DIAGONAL PARTICLE CURRENTS (DIGITAL SILK)
  // Formed from a parametric 3D space ribbon with undulating folds & twists
  // =========================================================================
  vec3 getDiagonalSilkCurrent(vec3 baseSeed, float currentId, float t) {
    // Flow speed along the diagonal trajectory
    float speed = (0.045 + aLayer * 0.025) * (0.85 + baseSeed.z * 0.30);
    // u: longitudinal parameter along diagonal path [-1.0, 1.0]
    float u = fract(baseSeed.x + t * speed) * 2.0 - 1.0;
    // v: transverse coordinate across ribbon width [-1.0, 1.0]
    float v = (baseSeed.y - 0.5) * 2.0;

    float spreadX = 92.0;
    float posX = u * spreadX;

    // 1. PRIMARY FLOWING SILK CURRENT (currentId < 0.5)
    if (currentId < 0.5) {
      // Base diagonal spine with undulating crests:
      // Ascends on the left, dips smoothly under the center hero headline, arches high on right
      float spineY = 12.0 * u + sin(u * 2.6 - 0.3) * 11.0 + cos(u * 4.2) * 4.5 - 4.5 * exp(-u * u * 8.0);
      float spineZ = cos(u * 2.2) * 14.0 + sin(u * 4.8) * 5.0 - 12.0;

      // Ribbon width varies across the stream: broader flanks, sleeker center
      float ribbonWidth = 14.0 + sin(u * 2.0 + 1.2) * 6.5 + cos(u * 3.4) * 4.0;
      // 3D twist angle of the silk ribbon
      float twist = 0.80 * u + sin(u * 2.8) * 0.65;

      // Harmonic folds (simulates draped silk sheets)
      float fold1 = sin(v * 3.14159 + u * 3.5) * 4.0;
      float fold2 = cos(v * 6.28318 + u * 5.5) * 2.0;
      float totalFold = fold1 + fold2;

      float posY = spineY + v * ribbonWidth * cos(twist) - totalFold * sin(twist);
      float posZ = spineZ + v * ribbonWidth * sin(twist) + totalFold * cos(twist);

      // Micro laminar drift along the silk threads
      vec3 curl = curlNoise(vec3(u * 2.5, v * 1.5, t * 0.05), t * 0.02);
      return vec3(posX + curl.x * 2.5, posY + curl.y * 3.0, posZ + curl.z * 2.5);
    }
    // 2. SECONDARY UPPER BRAIDED FILAMENT (currentId < 1.5)
    else if (currentId < 1.5) {
      float spineY = 15.0 * u + sin(u * 2.4 + 1.2) * 13.0 + cos(u * 5.0) * 4.0 + 6.0;
      float spineZ = sin(u * 2.5) * 12.0 - 8.0;
      float width = 8.5 + sin(u * 3.0) * 3.0;
      float twist = 1.1 * u + 0.5;

      float posY = spineY + v * width * cos(twist);
      float posZ = spineZ + v * width * sin(twist);
      return vec3(posX, posY, posZ);
    }
    // 3. SECONDARY LOWER PEELING WISP (currentId < 2.5)
    else if (currentId < 2.5) {
      float spineY = 10.0 * u + sin(u * 3.2 - 0.8) * 9.0 - 10.0;
      float spineZ = cos(u * 2.0) * 10.0 - 18.0;
      float width = 7.0 + cos(u * 2.5) * 2.5;

      float posY = spineY + v * width * 0.8;
      float posZ = spineZ + v * width * 0.6;
      return vec3(posX, posY, posZ);
    }
    // 4. AMBIENT DRIFTING PARTICLES (currentId >= 2.5)
    else {
      float ambX = u * spreadX;
      float ambY = (baseSeed.y - 0.5) * 65.0 + sin(u * 1.8 + t * 0.1) * 6.0;
      float ambZ = (baseSeed.z - 0.5) * 40.0 - 16.0;
      vec3 curl = curlNoise(vec3(u * 1.8, baseSeed.y * 2.0, t * 0.04), t * 0.015);
      return vec3(ambX + curl.x * 4.0, ambY + curl.y * 4.0, ambZ + curl.z * 3.0);
    }
  }

  // =========================================================================
  // SCROLL STATES 1-4: CONTINUOUS MORPHING FLOWS
  // =========================================================================

  // STATE 1: Flowing Waves (Undulating harmonic contours)
  vec3 getFlowingWaves(vec3 seed, float t) {
    float waveX = (seed.x - 0.5) * 140.0;
    float waveFreq1 = 0.032;
    float waveFreq2 = 0.064;
    float waveY = sin(waveX * waveFreq1 + t * 0.50 + seed.z * 2.2) * 13.0 
                + sin(waveX * waveFreq2 - t * 0.35) * 5.0 
                + (seed.y - 0.5) * 24.0;
    float waveZ = cos(waveX * waveFreq1 + t * 0.45 + seed.y * 2.2) * 11.0 
                + (seed.z - 0.5) * 14.0 - 12.0;
    return vec3(waveX, waveY, waveZ);
  }

  // STATE 2: 3D Spatial Spirals (Waves gain depth and form spiral ribbons)
  vec3 getSpatialSpirals(vec3 seed, float t) {
    float ringIndex = floor(seed.x * 4.0);
    float baseR = 15.0 + ringIndex * 8.5 + seed.y * 5.0;
    float direction = (seed.z > 0.5) ? 1.0 : -0.8;
    float speed = (0.22 / (1.0 + ringIndex * 0.20)) * direction;
    float theta = seed.y * 6.283185 + t * speed;
    float tilt = 0.26 * (ringIndex - 1.5);

    float orbX = baseR * cos(theta);
    float orbY = baseR * sin(theta) * cos(tilt) + (seed.z - 0.5) * 6.0;
    float orbZ = baseR * sin(theta) * sin(tilt) - 12.0;
    return vec3(orbX, orbY, orbZ);
  }

  // STATE 3: Loosened Starlight & Fine Celestial Filaments
  vec3 getLoosenedFilaments(vec3 seed, float t) {
    float angle = seed.x * 6.283185;
    float radius = 18.0 + seed.y * 24.0;
    float tunnelLength = 100.0;
    float tunnelZ = mod((seed.z - 0.5) * tunnelLength + t * 12.0, tunnelLength) - (tunnelLength * 0.5);
    float twist = tunnelZ * 0.016;
    float tunnelX = radius * cos(angle + twist);
    float tunnelY = radius * sin(angle + twist) * 0.72;
    return vec3(tunnelX, tunnelY, tunnelZ);
  }

  // STATE 4: Reorganized Curved Currents (Atmospheric regrouping)
  vec3 getCurvedCurrents(vec3 seed, float t) {
    float expansion = 1.0 + (seed.x + seed.y) * 0.32;
    float dissX = (seed.x - 0.5) * 150.0 * expansion + sin(t * 0.15 + seed.z * 4.0) * 6.0;
    float dissY = (seed.y - 0.5) * 105.0 * expansion + cos(t * 0.13 + seed.x * 4.0) * 6.0;
    float dissZ = (seed.z - 0.5) * 60.0 - 14.0;
    return vec3(dissX, dissY, dissZ);
  }

  void main() {
    vLayer = aLayer;
    float effectiveTime = uTime;

    // 1. CALCULATE 5 CONTINUOUS STATES
    vec3 pos0 = getDiagonalSilkCurrent(aSeed, aCurrentId, effectiveTime);
    vec3 pos1 = getFlowingWaves(aSeed, effectiveTime);
    vec3 pos2 = getSpatialSpirals(aSeed, effectiveTime);
    vec3 pos3 = getLoosenedFilaments(aSeed, effectiveTime);
    vec3 pos4 = getCurvedCurrents(aSeed, effectiveTime);

    // 2. SMOOTH C-INFINITY MORPHING ACROSS SCROLL PROGRESS
    // State 0: 0.00 - 0.20 (Hero Signature Diagonal Currents)
    // State 1: 0.35 (About & Capabilities Waves)
    // State 2: 0.55 (Work & Projects Spirals)
    // State 3: 0.75 (Writing & Constellation Filaments)
    // State 4: 0.95 (Lab & Contact Currents)
    float p = clamp(uScrollProgress, 0.0, 1.0);
    float dist0 = abs(p - 0.04);
    float dist1 = abs(p - 0.30);
    float dist2 = abs(p - 0.55);
    float dist3 = abs(p - 0.78);
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
    pos.y += uScrollOffset * (0.026 + aLayer * 0.035);
    pos.y += uScrollVel * (0.045 + aLayer * 0.060);

    // Screen-space NDC projection
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndc = projected.xy / projected.w;

    // =========================================================================
    // 3. HERO HEADLINE PROTECTION & ASYMMETRICAL FLANK LUMINANCE
    // Sized to softly attenuate particles directly behind headline typography
    // while keeping outer left and right flanks bright and sparkling!
    // =========================================================================
    vec2 heroCenter = vec2(0.0, 0.06);
    vec2 heroDelta = (ndc - heroCenter) / vec2(0.58, 0.28);
    float heroDist = length(heroDelta);
    // Soft, localized reduction (0.64 directly behind letters, 1.0 outside)
    float heroClearance = smoothstep(0.30, 1.20, heroDist);
    float heroScrollWeight = 1.0 - smoothstep(0.0, 0.20, uScrollProgress);
    float heroAttenuation = mix(1.0, mix(0.64, 1.0, heroClearance), heroScrollWeight);

    // Asymmetrical flank emphasis: right wave crest is slightly brighter
    float flankBoost = (ndc.x > 0.35) ? 1.15 : ((ndc.x < -0.35) ? 1.05 : 1.0);

    // =========================================================================
    // 4. FLUID CURSOR INTERACTION (LOCALIZED STREAMLINE BENDING)
    // Cursor acts like an aerodynamic obstacle: streamlines bend smoothly around it
    // with a subtle directional wake, returning gracefully without permanent drift.
    // =========================================================================
    vec2 aspectVec = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 pointerDiff = (ndc - uPointer) * aspectVec;
    float distToPointer = length(pointerDiff);

    float radius = uPointerRadius; // Controlled localized radius (~125px)
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
      vec2 streamCurve = tangent * (falloff * 0.08 * depthFactor);

      // Directional velocity wake
      float velMag = length(uPointerVel);
      vec2 velDir = velMag > 0.001 ? normalize(uPointerVel) : vec2(0.0);
      vec2 velWake = velDir * (falloff * clamp(velMag * 0.22, 0.0, 0.14) * depthFactor);

      // Apply in projected world coordinates (no particle size increase!)
      pos.xy += (repulseDisp + streamCurve + velWake) * (projected.w * 0.34);
      pos.z -= falloff * 4.5 * depthFactor;

      cursorGlow = falloff * 0.22;
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
        pos.xy += waveDir * (waveStrength * 4.5 * (0.50 + aLayer * 0.35));
        cursorGlow += waveStrength * 0.35;
      }
    }

    // Recalculate MVP position after physical displacements
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // =========================================================================
    // 5. PRECISE PARTICLE APPEARANCE (SECTION 2 SPECIFICATIONS)
    // - Most particles (~78%): 0.8–1.2 CSS px
    // - Secondary particles (~18%): 1.2–1.7 CSS px
    // - Rare highlights (~4%): 1.7–2.2 CSS px
    // - Strict physical clamp (>= 1.0 physical pixel on 1x, capped <= 2.25 CSS px)
    // =========================================================================
    float distanceCam = -mvPosition.z;
    float perspectiveScale = clamp(68.0 / max(distanceCam, 10.0), 0.75, 1.25);
    float speedSizeBoost = 1.0 + clamp(uScrollSpeedNorm * 0.08, 0.0, 0.12);

    float cssDiameter = aSize * perspectiveScale * uSizeVariation * speedSizeBoost;
    // Minimal subtle size calibration (0.90 to 2.50 CSS px)
    cssDiameter = clamp(cssDiameter, 0.90, 2.50);

    float physicalSize = cssDiameter * uPixelRatio;
    // Guaranteed crisp rendering: clamp between 1.2px physical and 2.55 * uPixelRatio
    gl_PointSize = clamp(physicalSize, 1.2, 2.55 * uPixelRatio * uSizeVariation);

    // =========================================================================
    // 6. RADIANT SILVER OPACITY & SCINTILLATION (ENHANCED SHINE)
    // =========================================================================
    float twinklePhase = effectiveTime * (2.0 + aSeed.y * 3.2) + aSeed.x * 62.83;
    float twinkle = pow(max(0.0, sin(twinklePhase)), 6.0);
    vTwinkle = twinkle * (0.65 + aSeed.z * 0.45);

    float depthAlpha = 0.72 + 0.28 * smoothstep(-110.0, -30.0, mvPosition.z);
    float pulse = 0.94 + 0.06 * sin(effectiveTime * 0.55 + aSeed.z * 10.0);

    vAlpha = clamp((aAlpha * depthAlpha * pulse + cursorGlow + vTwinkle * 0.35) * uOpacity * heroAttenuation * flankBoost, 0.0, 1.0);

    // =========================================================================
    // 7. MONOCHROME SILVER-WHITE & TITANIUM PALETTE
    // Fine digital silk aesthetic: muted silver-grey, radiant platinum, diamond white
    // =========================================================================
    vec3 silverGrey   = vec3(0.65, 0.70, 0.78);  // Crisp cool silver-grey
    vec3 platinumMid  = vec3(0.85, 0.89, 0.96);  // Radiant silk platinum
    vec3 pureWhite    = vec3(0.99, 1.00, 1.00);  // Pure crystalline white highlight

    vec3 baseCol;
    if (aLayer < 0.5) {
      baseCol = silverGrey;
    } else if (aLayer < 1.5) {
      baseCol = mix(silverGrey, platinumMid, 0.75);
    } else {
      baseCol = mix(platinumMid, pureWhite, 0.85);
    }

    vColor = mix(baseCol, uThemeColor, 0.05);
  }
`;

const fragmentShader = `
  uniform float uOpacity;
  uniform float uGlowIntensity; // Radial falloff and luminous glow intensity uniform

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Coordinate normalized to [-0.5, 0.5] from center of point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    // Strict circular discard
    if (dist > 0.5) {
      discard;
    }

    // =========================================================================
    // LUMINOUS DIGITAL SILK SHADER (SUBTLE RADIAL FALLOFF & RADIANT GLOW)
    // Anti-aliased circular disc + needle specular core + soft radial falloff glow
    // =========================================================================
    // 1. Sub-pixel anti-aliased edge mask for clean circular discipline
    float edgeMask = smoothstep(0.50, 0.22, dist);

    // 2. Needle-point specular core (instantaneous falloff, brilliant center)
    float core = exp(-dist * 8.5) * 1.45;

    // 3. Subtle radial falloff glow halo (exponential-gaussian luminous aura)
    // Infuses the particle with authentic luminous warmth and ethereal presence
    float radialFalloff = exp(-dist * 4.6) * (0.62 * uGlowIntensity);
    float glowAura = pow(max(0.0, 1.0 - dist * 2.0), 2.2) * (0.38 * uGlowIntensity);
    float totalRadialGlow = radialFalloff + glowAura;

    // 4. Optical 4-point diamond star cross rays (crystalline glint & shine)
    float rayH = exp(-abs(coord.y) * 22.0) * max(0.0, 1.0 - abs(coord.x) * 2.2);
    float rayV = exp(-abs(coord.x) * 22.0) * max(0.0, 1.0 - abs(coord.y) * 2.2);
    float starFlare = (rayH + rayV) * 0.40;

    // 5. Faceted diagonal glint (scintillation facet)
    vec2 diag = vec2(coord.x + coord.y, coord.x - coord.y) * 0.7071;
    float diagRay1 = exp(-abs(diag.y) * 26.0) * max(0.0, 1.0 - abs(diag.x) * 2.4);
    float diagRay2 = exp(-abs(diag.x) * 26.0) * max(0.0, 1.0 - abs(diag.y) * 2.4);
    float diamondGlint = (diagRay1 + diagRay2) * 0.22;

    // 6. Total combined radiant luminous intensity
    float luminousIntensity = core 
                            + totalRadialGlow 
                            + (starFlare + diamondGlint) * (0.65 + vTwinkle * 1.35);

    // 7. Brilliant pure white diamond center fading into luminous silver aura
    vec3 pureWhite = vec3(1.0, 1.0, 1.0);
    float coreWhiteness = clamp(core * 0.72 + vTwinkle * 0.65, 0.0, 1.0);
    vec3 finalColor = mix(vColor, pureWhite, coreWhiteness);

    float finalAlpha = clamp(vAlpha * (luminousIntensity * 0.72 + edgeMask * 0.32) * uOpacity, 0.0, 1.0);

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
  const sizeVariationRef = useRef(sizeVariation);
  const glowIntensityRef = useRef(glowIntensity);

  useEffect(() => {
    opacityRef.current = opacity;
    sizeVariationRef.current = sizeVariation;
    glowIntensityRef.current = glowIntensity;
  }, [opacity, sizeVariation, glowIntensity]);

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

    // 2. Crisp WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
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
    // 3. GENERATIVE BUFFERGEOMETRY: STRUCTURED DIAGONAL SILK CURRENTS
    // =========================================================================
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const layers = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT * 3);
    const alphas = new Float32Array(PARTICLE_COUNT);
    const currentIds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const seedVal = Math.random();

      // Current Stream Assignment:
      // ~55% Primary Ribbon (0)
      // ~20% Upper Intertwined Wisp (1)
      // ~15% Lower Peeling Wisp (2)
      // ~10% Ambient Drifting Constellation (3)
      let currentId = 0;
      if (seedVal > 0.90) {
        currentId = 3; // Ambient
      } else if (seedVal > 0.75) {
        currentId = 2; // Lower wisp
      } else if (seedVal > 0.55) {
        currentId = 1; // Upper wisp
      }

      // Layer Distribution (Minimal Subtle Size Increase for Luminous Radial Falloff):
      // - Distant / Ambient (~78%): 0.98–1.36 CSS px, Alpha: 0.42–0.58
      // - Main Ribbon Spine (~18%): 1.42–1.88 CSS px, Alpha: 0.65–0.83
      // - Highlight Star (~4%): 1.95–2.45 CSS px, Alpha: 0.85–0.97
      let layer = 0;
      let cssSize = 0.98 + Math.random() * 0.38;   // 0.98 – 1.36 CSS px
      let alphaBase = 0.42 + Math.random() * 0.16; // 0.42 – 0.58 opacity

      if (seedVal > 0.96) {
        // HIGHLIGHT STAR (4%)
        layer = 2;
        cssSize = 1.95 + Math.random() * 0.50;     // 1.95 – 2.45 CSS px
        alphaBase = 0.85 + Math.random() * 0.12;   // 0.85 – 0.97 opacity
      } else if (seedVal > 0.78) {
        // MAIN RIBBON SPINE (18%)
        layer = 1;
        cssSize = 1.42 + Math.random() * 0.46;     // 1.42 – 1.88 CSS px
        alphaBase = 0.65 + Math.random() * 0.18;   // 0.65 – 0.83 opacity
      }

      // Initial parametric base seeds
      const seedX = Math.random(); // Longitudinal position parameter
      const seedY = Math.random(); // Transverse ribbon coordinate
      const seedZ = Math.random(); // Speed & phase variance

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
      currentIds[i] = currentId;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geometry.setAttribute('aCurrentId', new THREE.BufferAttribute(currentIds, 1));

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

    // 5. Interaction Tracking & Physics State
    let targetPointerX = 0;
    let targetPointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
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

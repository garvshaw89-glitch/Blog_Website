import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { interactionEngine } from '../../context/SingularityInteractionEngine';
import { MATTER_CONFIG } from './matterConfig';
import {
  getCurlNoise,
  generateRockPosition,
  generateWavePosition,
  generateArchitecturePosition,
  generateConvergencePosition,
  generateSpherePosition,
  generateRingPosition,
  generateOrbitPosition,
  generateBlueprintPosition,
  precomputeGlobeData,
  GlobePrecomputedData,
} from './matterFormGeometry';
import {
  generateRocketPosition,
} from './matterRocketGeometry';
import {
  sampleProfileImage,
  getImmediateProfilePoints,
  ProfileSamplePoint,
} from './matterProfileSampler';
import { GITHUB_AVATAR_BASE64 } from './avatarBase64';
import {
  rocketCinematicManager,
  CinematicStage,
} from './rocketCinematicManager';

/**
 * HIGH-END LIVING DIGITAL MATTER SYSTEM WITH CONTINUOUS CYCLIC SEQUENCING:
 * Flow -> Rock Formation -> 3D Earth Globe -> Oceanic Wave -> Rocket Launch & Impact -> Glowing GitHub Profile -> Dissolution -> Repeat
 *
 * Visual Improvements:
 * - Dynamic Profile Spotlight & High-Luminance Boost:
 *   When the GitHub avatar arrives, a dedicated high-intensity warm-white & cyan spotlight
 *   illuminates the profile from Z: +3.5, and particle sizes expand to 0.52 for crisp portrait clarity.
 * - UnrealBloomPass strength automatically elevates from 0.40 to 0.78 during the profile reveal,
 *   creating radiant speculars on glasses, hair edges, and facial contours without washing out text.
 * - Seamless automatic repetition: rocket & profile reveal sequence runs periodically like the rock, globe, and wave.
 */

type AmbientMatterState = 'FREE_FLOW' | 'ROCK' | 'GLOBE' | 'WAVE';

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  strength: number;
}

export const LivingMatterBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    // Detect hardware tier and screen size
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Adaptive particle count based on device capability
    let particleCount = MATTER_CONFIG.particles.desktopStandard;
    if (isMobile) {
      particleCount = MATTER_CONFIG.particles.mobile;
    } else if (isTablet) {
      particleCount = MATTER_CONFIG.particles.tablet;
    } else if (hardwareConcurrency >= 8) {
      particleCount = MATTER_CONFIG.particles.desktopHigh;
    }

    if (prefersReducedMotion) {
      particleCount = MATTER_CONFIG.particles.lowPower;
    }

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.0075);

    const fov = 50;
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    const cameraBaseZ = 22;
    camera.position.set(0, 0, cameraBaseZ);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isMobile,
        alpha: true,
        stencil: false,
        depth: true,
      });
    } catch (err) {
      console.warn('WebGL initialization failed, falling back to static visual foundation:', err);
      return;
    }

    const maxDpr = isMobile ? 1.0 : isTablet ? 1.3 : 1.75;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 2. Post-Processing Pipeline (Bloom Effect via EffectComposer for Brightest Particles)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    const renderScale = isMobile ? 0.5 : isTablet ? 0.75 : 1.0;

    if (!prefersReducedMotion) {
      try {
        const renderResolution = new THREE.Vector2(
          Math.floor(window.innerWidth * renderScale),
          Math.floor(window.innerHeight * renderScale)
        );

        composer = new EffectComposer(renderer);
        composer.setPixelRatio(dpr);
        composer.setSize(window.innerWidth, window.innerHeight);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // UnrealBloomPass calibrated for refined, luxurious shine:
        // - threshold: 0.82 (bloom selectively captures brightest highlight particles, ocean specular glints, auroras, and cursor flare; normal background dust remains sharp with zero haze)
        // - strength: 0.30 (controlled, luminous optical radiance)
        // - radius: 0.24 (tight, elegant optical dispersion)
        bloomPass = new UnrealBloomPass(renderResolution, 0.30, 0.24, 0.82);
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);
      } catch (err) {
        console.warn('Fallback to direct hardware renderer:', err);
        composer = null;
        bloomPass = null;
      }
    }

    // 3. Cinematic Ambient, Spotlight & Dynamic Lighting (Subtle, non-overexposed)
    const ambientLight = new THREE.AmbientLight(0x0a0c10, 1.2);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0xffffff, 1.2, 16, 1.8);
    cursorLight.position.set(0, 0, 5);
    scene.add(cursorLight);

    const rocketEngineLight = new THREE.PointLight(0x22d3ee, 0, 16, 2.0);
    scene.add(rocketEngineLight);

    // Dedicated Planetary Globe Radiance Lights (gentle, atmospheric illumination)
    const globeSunLight = new THREE.PointLight(0xa5f3fc, 0, 36, 1.4);
    globeSunLight.position.set(10, 6, 12);
    scene.add(globeSunLight);

    const globeRimLight = new THREE.PointLight(0x38bdf8, 0, 28, 1.6);
    globeRimLight.position.set(-8, -5, -4);
    scene.add(globeRimLight);

    // Dedicated GitHub Profile Radiance Spotlight (Turns on during profile reveal)
    const profileRadianceLight = new THREE.PointLight(0xffffff, 0, 24, 1.6);
    profileRadianceLight.position.set(0, 0, 4.0);
    scene.add(profileRadianceLight);

    const profileCyanFill = new THREE.PointLight(0x06b6d4, 0, 18, 1.8);
    profileCyanFill.position.set(0, -1.0, 3.0);
    scene.add(profileCyanFill);

    // 4. Procedural Clean Micro-Point Particle Texture (Sharp diamond core, luminous center, zero bleeding halo)
    const particleTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const cx = 32;
        const cy = 32;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');     // Pure sharp diamond pinpoint core
        grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.90)'); // High-specular luminous inner center
        grad.addColorStop(0.48, 'rgba(255, 255, 255, 0.25)'); // Short subtle optical falloff
        grad.addColorStop(0.68, 'rgba(255, 255, 255, 0.0)');  // Clean zero boundary - zero halo bleeding outside sphere
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    })();

    // 5. Living Matter Particle System (Typed Arrays for High GPU Throughput)
    const particleGeometry = new THREE.BufferGeometry();

    const pPositions = new Float32Array(particleCount * 3);
    const pOriginalHome = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pBaseColors = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount); // Physical collision radius for each particle
    const pTiers = new Uint8Array(particleCount);

    // Physics-Based Collision Spatial Partitioning Grid (O(N) zero-allocation lookup)
    const COLLISION_CELL_SIZE = 0.85;
    const INV_CELL_SIZE = 1.0 / COLLISION_CELL_SIZE;
    const HASH_SIZE = 4096; // Power of two for fast bitwise masking
    const gridHead = new Int32Array(HASH_SIZE);
    const gridNext = new Int32Array(particleCount);

    // Profile Targets Storage - initialized immediately with fallback so never empty
    let profilePoints: ProfileSamplePoint[] = getImmediateProfilePoints(particleCount);
    sampleProfileImage(GITHUB_AVATAR_BASE64, particleCount).then((pts) => {
      if (pts && pts.length > 0) {
        profilePoints = pts;
      }
    });

    // 6. Explicit 3D Globe Center & Dynamic Frustum Sizing (100% Contained, Zero Clipping)
    const globeCenter = new THREE.Vector3(0, 0, 0);

    // Dynamic Safe Camera Distance & Globe Sizing:
    // Calculates exact camera distance based on globeRadius, FOV (50 deg), and aspect ratio
    // so the globe is 100% contained within the camera frustum with calibrated luxury margins.
    const tanFovHalf = Math.tan(((fov * Math.PI) / 180) / 2); // tan(25 deg) ~ 0.4663

    const getGlobeConfig = (w: number, h: number) => {
      const aspect = Math.max(0.1, w / h);
      const isNarrowMobile = w < 480;
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1024;

      // Base globe radius calibrated for comfortable viewport containment:
      const radius = isNarrowMobile ? 2.8 : isMobile ? 3.1 : isTablet ? 3.6 : 3.9;

      // Desired maximum coverage of the limiting viewport dimension:
      // Narrow mobile: 58% of screen width (leaves 21% margin left and right)
      // Mobile: 58% of screen width (leaves 21% margin each side)
      // Tablet: 52% of limiting dimension
      // Desktop: 48% of height (leaves 26% margin top and bottom)
      const maxCoverage = isNarrowMobile ? 0.58 : isMobile ? 0.58 : isTablet ? 0.52 : 0.48;

      // Limiting visible half-dimension factor per unit distance:
      const minDimensionFactor = tanFovHalf * Math.min(1.0, aspect);

      // Safe camera distance ensuring: (radius + tolerance) / (distance * minDimensionFactor) <= maxCoverage
      const safeDistance = (radius + 0.12) / (maxCoverage * minDimensionFactor);

      return {
        radius,
        safeDistance,
        aspect,
      };
    };

    let currentGlobeConfig = getGlobeConfig(window.innerWidth, window.innerHeight);
    let globeRadius = currentGlobeConfig.radius;
    let safeGlobeCameraZ = currentGlobeConfig.safeDistance;
    const globeData: GlobePrecomputedData = precomputeGlobeData(particleCount);

    // Calibrated luminance tiers & visual hierarchy (Intelligently sparse, non-distracting atmospheric depth):
    // - 75% Tier 2 (Background dust): depth -18 to -5, size 0.16–0.22, subtle muted gray/slate (opacity ~0.18-0.28)
    // - 20% Tier 1 (Midground matter): depth -5 to +1.5, size 0.24–0.30, crisp clean silver/white (opacity ~0.38-0.48)
    // - 4.2% Tier 0 (Foreground highlights): depth 1 to 4.5, size 0.34–0.42, luminous white (opacity ~0.70-0.85)
    // - 0.8% Rare Accents: depth 2 to 5.5, size 0.40–0.48, electric cyan/purple catching subtle bloom
    const colDust = { r: 0.20, g: 0.22, b: 0.26 };
    const colMid = { r: 0.42, g: 0.45, b: 0.52 };
    const colBright = { r: 0.88, g: 0.92, b: 1.00 };
    const colAccentCyan = { r: 0.25, g: 0.92, b: 1.05 };
    const colAccentPurple = { r: 0.65, g: 0.48, b: 1.05 };

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const rand = Math.random();

      let tier = 2;
      let depthZ = -18.0 + Math.random() * 13.0;
      let baseSize = 0.20;
      let collisionRadius = 0.10;
      let col = colDust;

      if (rand < 0.75) {
        // 75% Background atmospheric dust (subtle, clean, non-distracting)
        tier = 2;
        depthZ = -18.0 + Math.random() * 13.0;
        baseSize = 0.18 + Math.random() * 0.06;
        collisionRadius = 0.10;
        col = colDust;
      } else if (rand < 0.95) {
        // 20% Midground subtle digital matter
        tier = 1;
        depthZ = -5.0 + Math.random() * 6.5;
        baseSize = 0.26 + Math.random() * 0.06;
        collisionRadius = 0.16;
        col = colMid;
      } else if (rand < 0.992) {
        // 4.2% Foreground highlights (rare bright sparkles)
        tier = 0;
        depthZ = 1.0 + Math.random() * 3.5;
        baseSize = 0.36 + Math.random() * 0.08;
        collisionRadius = 0.22;
        col = colBright;
      } else {
        // 0.8% Rare special accent particles (cyan/purple celestial energy)
        tier = 0;
        depthZ = 2.0 + Math.random() * 3.5;
        baseSize = 0.42 + Math.random() * 0.08;
        collisionRadius = 0.24;
        col = rand > 0.996 ? colAccentPurple : colAccentCyan;
      }

      pTiers[i] = tier;
      pSizes[i] = baseSize;
      pRadii[i] = collisionRadius;

      // Intelligent spatial distribution with natural negative space
      const spreadX = tier === 2 ? 48 : tier === 1 ? 36 : 28;
      const spreadY = tier === 2 ? 36 : tier === 1 ? 28 : 22;

      const px = (Math.random() - 0.5) * spreadX;
      const py = (Math.random() - 0.5) * spreadY;

      pPositions[idx] = px;
      pPositions[idx + 1] = py;
      pPositions[idx + 2] = depthZ;

      pOriginalHome[idx] = px;
      pOriginalHome[idx + 1] = py;
      pOriginalHome[idx + 2] = depthZ;

      pVelocities[idx] = (Math.random() - 0.5) * 0.012;
      pVelocities[idx + 1] = (Math.random() - 0.5) * 0.012;
      pVelocities[idx + 2] = (Math.random() - 0.5) * 0.006;

      pColors[idx] = col.r;
      pColors[idx + 1] = col.g;
      pColors[idx + 2] = col.b;

      pBaseColors[idx] = col.r;
      pBaseColors[idx + 1] = col.g;
      pBaseColors[idx + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.32, // Calibrated point size for crisp jewel-like shine
      map: particleTexture,
      transparent: true,
      opacity: 0.92,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    // Explicitly disable frustum culling so Three.js never clips particles
    particleSystem.frustumCulled = false;
    particleGeometry.boundingSphere = new THREE.Sphere(globeCenter, 120);
    scene.add(particleSystem);

    // 6. Water Ripple Waves
    const ripples: RippleWave[] = [];

    const triggerRipple = (wx: number, wy: number, forceMult = 1.0) => {
      if (prefersReducedMotion) return;
      if (ripples.length >= MATTER_CONFIG.ripple.maxRipples) {
        ripples.shift();
      }
      ripples.push({
        x: wx,
        y: wy,
        radius: 0.4,
        maxRadius: MATTER_CONFIG.ripple.maxRadius * forceMult,
        speed: MATTER_CONFIG.ripple.expansionSpeed * (0.8 + forceMult * 0.3),
        strength: MATTER_CONFIG.ripple.strength * forceMult,
      });
    };

    // 7. Raycasting: World Mouse coordinates at Z = 0
    const raycaster = new THREE.Raycaster();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersection = new THREE.Vector3();
    const prevCursorWorld = new THREE.Vector3();
    const cursorVelocityWorld = new THREE.Vector3();

    const updateWorldMouse = () => {
      raycaster.setFromCamera(
        new THREE.Vector2(interactionEngine.state.ndcX, interactionEngine.state.ndcY),
        camera
      );
      raycaster.ray.intersectPlane(planeZ0, planeIntersection);
      if (planeIntersection) {
        cursorVelocityWorld.x = (planeIntersection.x - prevCursorWorld.x) * 0.4;
        cursorVelocityWorld.y = (planeIntersection.y - prevCursorWorld.y) * 0.4;
        cursorVelocityWorld.z = 0;

        prevCursorWorld.copy(planeIntersection);

        cursorLight.position.x = planeIntersection.x;
        cursorLight.position.y = planeIntersection.y;
        cursorLight.position.z =
          4.5 + Math.min(interactionEngine.state.normalizedEnergy * 3.0, 3.5);
      }
    };

    let lastObservedClick = 0;
    const unsubInteraction = interactionEngine.subscribe((state) => {
      if (state.lastClickTime > lastObservedClick) {
        lastObservedClick = state.lastClickTime;
        triggerRipple(planeIntersection.x, planeIntersection.y);
      }
    });

    // 8. Cinematic Sequence State
    let currentCinematicStage: CinematicStage = 'IDLE';
    let cinematicStageTimer = 0;
    let rocketY = 0;
    let rocketVelocityY = 0;
    let cameraShake = 0;

    const unsubCinematic = rocketCinematicManager.subscribe((cState) => {
      currentCinematicStage = cState.stage;
    });

    // 9. Ambient State Machine (FREE_FLOW -> ROCK -> GLOBE -> WAVE -> ROCKET_LAUNCH -> Repeat)
    let ambientState: AmbientMatterState = 'FREE_FLOW';
    let isUserPinnedAmbient = false;
    let ambientTime = 0;
    let targetMorphBlend = 0;
    let currentMorphBlend = 0;
    let globeRotationY = 0;
    let globeRotationVelocity = 0;

    // Dynamic Performance Monitor (Monitors FPS over rolling 1-second cycles)
    let perfFrameCount = 0;
    let lastFpsCheckTime = performance.now();
    let measuredFps = 60;
    let qualityLevel: 'high' | 'medium' | 'low' = 'high';
    let lowFpsStreak = 0;
    let highFpsStreak = 0;

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      currentGlobeConfig = getGlobeConfig(w, h);
      globeRadius = currentGlobeConfig.radius;
      safeGlobeCameraZ = currentGlobeConfig.safeDistance;

      const newDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(newDpr);
      renderer.setSize(w, h);

      if (composer) {
        composer.setPixelRatio(newDpr);
        composer.setSize(w, h);
        if (bloomPass) {
          bloomPass.setSize(Math.floor(w * renderScale), Math.floor(h * renderScale));
        }
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    // Run initial sync to guarantee safe camera distance & projection matrix match window
    onResize();

    // 10. Visibility API Optimization for Battery & Idle Tabs
    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 11. Main 60-120 FPS Physics & Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();
      cinematicStageTimer += delta;

      // Dynamic Performance Monitor & Adaptive Quality Adjustment
      perfFrameCount++;
      const now = performance.now();
      if (now - lastFpsCheckTime >= 1000) {
        measuredFps = (perfFrameCount * 1000) / (now - lastFpsCheckTime);
        perfFrameCount = 0;
        lastFpsCheckTime = now;

        if (measuredFps < 38) {
          lowFpsStreak++;
          highFpsStreak = 0;
          if (lowFpsStreak >= 2) {
            if (qualityLevel === 'high') {
              qualityLevel = 'medium';
              particleGeometry.setDrawRange(0, Math.floor(particleCount * 0.75));
            } else if (qualityLevel === 'medium') {
              qualityLevel = 'low';
              particleGeometry.setDrawRange(0, Math.floor(particleCount * 0.50));
            }
          }
        } else if (measuredFps >= 56) {
          highFpsStreak++;
          lowFpsStreak = 0;
          if (highFpsStreak >= 4 && qualityLevel !== 'high') {
            if (qualityLevel === 'low') {
              qualityLevel = 'medium';
              particleGeometry.setDrawRange(0, Math.floor(particleCount * 0.75));
            } else if (qualityLevel === 'medium') {
              qualityLevel = 'high';
              particleGeometry.setDrawRange(0, particleCount);
            }
          }
        }
      }

      const {
        ndcX,
        ndcY,
        scrollProgress,
        scrollVelocity,
        sectionTheme,
        prefersReduced,
      } = interactionEngine.state;

      updateWorldMouse();

      // Frame-rate independent globe rotation with smooth cursor inertia drag
      const safeDelta = Math.min(delta, 0.05);
      // Frame-rate independent exponential inertia decay
      globeRotationVelocity *= Math.exp(-3.2 * safeDelta);
      if (ambientState === 'GLOBE') {
        const cursorDistToCenter = Math.hypot(planeIntersection.x, planeIntersection.y);
        if (cursorDistToCenter < globeRadius * 1.5) {
          globeRotationVelocity = THREE.MathUtils.clamp(
            globeRotationVelocity + cursorVelocityWorld.x * 0.012,
            -0.25,
            0.25
          );
        }
        globeRotationY += (0.12 + globeRotationVelocity) * safeDelta;
      }

      // ==========================================
      // CINEMATIC STAGE MACHINE
      // ==========================================
      const inCinematicSequence = currentCinematicStage !== 'IDLE';

      // Check for user manual ambient triggers (Earth / Flow)
      const requestedAmbient = rocketCinematicManager.consumeAmbientRequest();
      if (requestedAmbient === 'GLOBE') {
        ambientState = 'GLOBE';
        ambientTime = 0;
        targetMorphBlend = 1;
        isUserPinnedAmbient = true;
      } else if (requestedAmbient === 'FLOW') {
        ambientState = 'FREE_FLOW';
        ambientTime = 0;
        targetMorphBlend = 0;
        isUserPinnedAmbient = false;
      }

      if (inCinematicSequence && !prefersReduced) {
        if (currentCinematicStage === 'GATHER') {
          // Particles converge to form realistic heavy aerospace rocket shape
          rocketY = -1.5;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.44, 0.05);
          rocketCinematicManager.update({
            rocketAltitudeMeters: 0,
            rocketVelocityKmh: 0,
            ambientState,
          });
          if (cinematicStageTimer > 2.8) {
            rocketCinematicManager.setStage('ROCKET_FORMED');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'ROCKET_FORMED') {
          // Micro vibration & stabilization
          cameraShake = 0.04;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.44, 0.05);
          rocketCinematicManager.update({
            rocketAltitudeMeters: 12,
            rocketVelocityKmh: 0,
            ambientState,
          });
          if (cinematicStageTimer > 1.2) {
            rocketCinematicManager.setStage('IGNITION');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'IGNITION') {
          // Engine sparks buildup & supersonic downward particle velocity
          cameraShake = 0.08 + cinematicStageTimer * 0.12;
          rocketEngineLight.intensity = Math.min(3.2, cinematicStageTimer * 3.0);
          rocketEngineLight.position.set(0, rocketY - 4.5, -2.0);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.32, 0.05);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.45, 0.05);
          }
          rocketCinematicManager.update({
            rocketAltitudeMeters: Math.round(cinematicStageTimer * 65),
            rocketVelocityKmh: Math.round(cinematicStageTimer * 120),
            ambientState,
          });

          if (cinematicStageTimer > 1.6) {
            rocketVelocityY = 0.05;
            rocketCinematicManager.setStage('LAUNCH');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'LAUNCH') {
          // Rapid upward supersonic acceleration
          rocketVelocityY += delta * 18.0;
          rocketY += rocketVelocityY * delta;
          cameraShake = 0.15;
          rocketEngineLight.position.set(0, rocketY - 4.5, -2.0);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.34, 0.05);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.52, 0.05);
          }
          const altM = Math.round(250 + Math.pow(Math.max(0, rocketY + 2.5), 2.2) * 95);
          const velKmh = Math.round(rocketVelocityY * 580);
          rocketCinematicManager.update({
            rocketAltitudeMeters: altM,
            rocketVelocityKmh: velKmh,
            ambientState,
          });

          if (rocketY > 24) {
            rocketCinematicManager.setStage('FLIGHT');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'FLIGHT') {
          // Rocket travels through deep environment & loops toward descent
          cameraShake = 0.02;
          rocketEngineLight.intensity = Math.max(0, rocketEngineLight.intensity - delta * 2.0);
          rocketCinematicManager.update({
            rocketAltitudeMeters: 48000 + Math.round(cinematicStageTimer * 6500),
            rocketVelocityKmh: 18500,
            ambientState,
          });
          if (cinematicStageTimer > 1.8) {
            rocketY = 22;
            rocketVelocityY = -6.0;
            rocketCinematicManager.setStage('DESCENT');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'DESCENT') {
          // Controlled deceleration toward ground
          rocketVelocityY += delta * 4.2;
          rocketVelocityY = Math.min(-0.8, rocketVelocityY);
          rocketY += rocketVelocityY * delta;
          cameraShake = 0.03;

          if (rocketY <= -2.5) {
            rocketY = -2.5;
            // IMPACT!
            triggerRipple(0, -2.5, 2.4);
            cameraShake = 0.45;
            rocketCinematicManager.setStage('LANDING_IMPACT');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'LANDING_IMPACT') {
          // Impact shockwave, particles break apart
          cameraShake = Math.max(0, 0.45 - cinematicStageTimer * 0.8);
          rocketEngineLight.intensity = Math.max(0, 3.0 - cinematicStageTimer * 4.0);

          if (cinematicStageTimer > 0.8) {
            // Transition to PARTICLE_CLOUD at ~12.4s
            rocketCinematicManager.setStage('PARTICLE_CLOUD');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PARTICLE_CLOUD') {
          // 12.40s - 13.00s (0.6s): Rocket particles become a floating orbital cloud
          cameraShake = 0;
          if (cinematicStageTimer > 0.6) {
            // Transition to PROFILE_FORMING at 13.00s
            rocketCinematicManager.setStage('PROFILE_FORMING');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_FORMING') {
          // 13.00s - 14.20s (1.2s): Profile image begins forming (circular silhouette, hair, face)
          const progress = Math.min(1.0, cinematicStageTimer / 1.2);
          rocketCinematicManager.update({
            stageProgress: progress,
            reconstructionPhase: Math.floor(progress * 2.99), // phases 0, 1, 2
          });

          profileRadianceLight.intensity = THREE.MathUtils.lerp(profileRadianceLight.intensity, 1.2, 0.05);
          profileCyanFill.intensity = THREE.MathUtils.lerp(profileCyanFill.intensity, 0.6, 0.05);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.28, 0.05);

          if (cinematicStageTimer >= 1.2) {
            // Transition to PROFILE_RECOGNIZABLE at 14.20s
            rocketCinematicManager.setStage('PROFILE_RECOGNIZABLE');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_RECOGNIZABLE') {
          // 14.20s - 15.40s (1.2s): Face, hair and glasses become recognizable
          const progress = Math.min(1.0, cinematicStageTimer / 1.2);
          rocketCinematicManager.update({
            stageProgress: progress,
            reconstructionPhase: 3 + Math.floor(progress * 1.99), // phases 3, 4
          });

          profileRadianceLight.intensity = THREE.MathUtils.lerp(profileRadianceLight.intensity, 1.3, 0.06);
          profileCyanFill.intensity = THREE.MathUtils.lerp(profileCyanFill.intensity, 0.7, 0.06);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.29, 0.05);

          if (cinematicStageTimer >= 1.2) {
            // Transition to PROFILE_LOCKING at 15.40s
            rocketCinematicManager.setStage('PROFILE_LOCKING');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_LOCKING') {
          // Fine image details stabilize, target attraction increases
          const progress = Math.min(1.0, cinematicStageTimer / 0.8);
          rocketCinematicManager.update({
            stageProgress: progress,
            reconstructionPhase: 5, // All phases active (0 through 5)
          });

          profileRadianceLight.intensity = 1.4;
          profileCyanFill.intensity = 0.8;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.30, 0.08);

          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.38, 0.06);
          }

          if (cinematicStageTimer >= 0.8) {
            // Transition to PROFILE_COMPLETE
            rocketCinematicManager.setStage('PROFILE_COMPLETE');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_COMPLETE') {
          // Instantaneous state marker that rolls into PROFILE_HOLD
          rocketCinematicManager.setStage('PROFILE_HOLD');
          cinematicStageTimer = 0;
        } else if (currentCinematicStage === 'PROFILE_HOLD') {
          // Luminous colorful profile hold
          profileRadianceLight.intensity = 1.5;
          profileCyanFill.intensity = 0.9;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.30, 0.08);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.38, 0.06);
          }

          // If explicitly triggered by user via PROFILE button, hold continuously until user clicks something else!
          const isUserExplicitProfile = rocketCinematicManager.state.isTriggeredByUser && rocketCinematicManager.state.rocketAltitudeMeters === 0;
          if (!isUserExplicitProfile && cinematicStageTimer >= 6.0) {
            // Transition to TEXT_PREPARE after 6s in automatic sequence
            rocketCinematicManager.setStage('TEXT_PREPARE');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'TEXT_PREPARE') {
          // 17.50s - 17.70s (0.2s): Profile remains stable, prepare typography layer
          if (cinematicStageTimer >= 0.2) {
            // Transition to NAME_REVEAL at 17.70s
            rocketCinematicManager.setStage('NAME_REVEAL');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'NAME_REVEAL') {
          // 17.70s - 18.10s (0.4s): "Garv Shaw" begins appearing
          if (cinematicStageTimer >= 0.4) {
            // Transition to TAGLINE_REVEAL at 18.10s
            rocketCinematicManager.setStage('TAGLINE_REVEAL');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'TAGLINE_REVEAL') {
          // 18.10s - 18.70s (0.6s): "Turning AI Into Innovation" appears
          if (cinematicStageTimer >= 0.6) {
            // Transition to IDENTITY_COMPLETE at 18.70s
            rocketCinematicManager.setStage('IDENTITY_COMPLETE');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'IDENTITY_COMPLETE') {
          // 18.70s - 19.50s (0.8s): Full identity composition held together
          if (cinematicStageTimer >= 0.8) {
            // Transition to RETURN_TO_WORLD at 19.50s
            rocketCinematicManager.setStage('RETURN_TO_WORLD');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'RETURN_TO_WORLD') {
          // 19.50s+: Particles slowly return to ambient state
          profileRadianceLight.intensity = THREE.MathUtils.lerp(
            profileRadianceLight.intensity,
            0,
            0.06
          );
          profileCyanFill.intensity = THREE.MathUtils.lerp(
            profileCyanFill.intensity,
            0,
            0.06
          );
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.24, 0.05);

          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.30, 0.05);
          }

          if (cinematicStageTimer > 2.8) {
            rocketCinematicManager.setStage('IDLE');
            cinematicStageTimer = 0;
            // Reset ambient sequence to Free Flow after cinematic finish
            ambientState = 'FREE_FLOW';
            ambientTime = 0;
          }
        }
      }

      // Dynamic Globe Sunlight & Rim Shine intensity ramping (Gentle, elegant illumination)
      const isGlobeActiveNow = ambientState === 'GLOBE';
      globeSunLight.intensity = THREE.MathUtils.lerp(
        globeSunLight.intensity,
        isGlobeActiveNow ? 1.4 : 0,
        0.06
      );
      globeRimLight.intensity = THREE.MathUtils.lerp(
        globeRimLight.intensity,
        isGlobeActiveNow ? 0.9 : 0,
        0.06
      );

      // ==========================================
      // AMBIENT FORM TIMELINE & CONTINUOUS REPETITION
      // ==========================================
      // Cycles continuously:
      // FREE_FLOW -> ROCK -> GLOBE -> WAVE -> TRIGGER ROCKET SEQUENCE -> repeat
      if (!inCinematicSequence && !prefersReduced) {
        ambientTime += delta;
        if (ambientState === 'FREE_FLOW') {
          targetMorphBlend = 0;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.32, 0.04);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.38, 0.04);
          }
          if (ambientTime > MATTER_CONFIG.timing.freeFlowDuration) {
            ambientState = 'ROCK';
            ambientTime = 0;
          }
        } else if (ambientState === 'ROCK') {
          targetMorphBlend = 1;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.34, 0.04);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.42, 0.04);
          }
          if (ambientTime > MATTER_CONFIG.timing.rockFormDuration) {
            ambientState = 'GLOBE';
            ambientTime = 0;
          }
        } else if (ambientState === 'GLOBE') {
          targetMorphBlend = 1;
          // Calibrated crisp micro-point size so particles remain strictly inside spherical perimeter
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.22, 0.05);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.32, 0.05);
          }
          if (ambientTime > MATTER_CONFIG.timing.globeFormDuration && !isUserPinnedAmbient) {
            ambientState = 'WAVE';
            ambientTime = 0;
          }
        } else if (ambientState === 'WAVE') {
          targetMorphBlend = 1;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.34, 0.04);
          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.42, 0.04);
          }
          if (ambientTime > MATTER_CONFIG.timing.waveFormDuration) {
            // AUTOMATIC REPEAT: After Wave completes, trigger the Rocket & Profile sequence!
            ambientTime = 0;
            targetMorphBlend = 0;
            rocketCinematicManager.triggerSequence();
          }
        }
        currentMorphBlend +=
          (targetMorphBlend - currentMorphBlend) * MATTER_CONFIG.timing.morphTransitionSpeed;
      }

      // Camera Parallax & Frame-Safe Positioning (Ensures complete globe remains visible across all screens)
      if (!prefersReduced) {
        const shakeX = (Math.random() - 0.5) * cameraShake;
        const shakeY = (Math.random() - 0.5) * cameraShake;

        if (ambientState === 'GLOBE') {
          // Strictly frame the globe inside the camera frustum with safe camera distance centered on globeCenter
          const targetCamX = ndcX * 0.18 + shakeX * 0.02;
          const targetCamY = ndcY * 0.10 + shakeY * 0.02;
          const targetCamZ = safeGlobeCameraZ;

          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.08);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
          camera.lookAt(globeCenter.x, globeCenter.y, globeCenter.z);
        } else if (!inCinematicSequence) {
          const targetCamX = ndcX * 0.75 + shakeX;
          const targetCamY = ndcY * 0.5 - scrollProgress * 6.0 + shakeY;
          const targetCamZ = cameraBaseZ - scrollProgress * 4.0;

          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.07);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.07);
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.07);
          camera.rotation.y = -ndcX * 0.035 + shakeX * 0.05;
          camera.rotation.x = ndcY * 0.025 + shakeY * 0.05;
        }
      }

      // Update Water Ripples
      for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx--) {
        const rip = ripples[rIdx];
        rip.radius += rip.speed;
        rip.strength *= MATTER_CONFIG.ripple.decay;
        if (rip.strength < 0.02 || rip.radius >= rip.maxRadius) {
          ripples.splice(rIdx, 1);
        }
      }

      const cursorX = planeIntersection.x;
      const cursorY = planeIntersection.y;
      const vFovRad = (fov * Math.PI) / 180;
      const viewH = window.innerHeight || 1;

      const positions = particleGeometry.attributes.position.array as Float32Array;
      const colors = particleGeometry.attributes.color.array as Float32Array;
      const currentSection = sectionTheme?.name || 'hero';

      // Precomputed Planetary Sun, Specular & Axial Tilt vectors (reused per frame with zero GC allocation)
      const sunDirX = 0.56;
      const sunDirY = 0.38;
      const sunDirZ = 0.73;
      const halfX = 0.308;
      const halfY = 0.209;
      const halfZ = 0.928;
      const cosTilt = 0.9174; // Math.cos(0.4091 rad ~ 23.44° planetary axial tilt)
      const sinTilt = 0.3979; // Math.sin(0.4091 rad ~ 23.44° planetary axial tilt)

      // ==========================================
      // UNIFIED PARTICLE PHYSICS PASS
      // ==========================================
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const px = positions[idx];
        const py = positions[idx + 1];
        const pz = positions[idx + 2];

        const ox = pOriginalHome[idx];
        const oy = pOriginalHome[idx + 1];
        const oz = pOriginalHome[idx + 2];
        const tier = pTiers[i];

        let formTargetX = ox;
        let formTargetY = oy;
        let formTargetZ = oz;

        // 1. Organic Curl Noise (Watery Base Current) - ONLY during free flow/waves, not on rigid planetary sphere
        if (ambientState !== 'GLOBE') {
          const curl = getCurlNoise(
            px * MATTER_CONFIG.physics.fluidCurlScale,
            py * MATTER_CONFIG.physics.fluidCurlScale,
            elapsedTime * 0.12
          );
          pVelocities[idx] += curl.x * MATTER_CONFIG.physics.fluidSpeed;
          pVelocities[idx + 1] += curl.y * MATTER_CONFIG.physics.fluidSpeed;
          pVelocities[idx + 2] += curl.z * (MATTER_CONFIG.physics.fluidSpeed * 0.5);
        }

        // 2. Target Attraction Vectors (Rocket, Flight, Profile or Ambient)
        if (inCinematicSequence) {
          if (
            currentCinematicStage === 'GATHER' ||
            currentCinematicStage === 'ROCKET_FORMED' ||
            currentCinematicStage === 'IGNITION' ||
            currentCinematicStage === 'LAUNCH' ||
            currentCinematicStage === 'DESCENT'
          ) {
            // Morph into Real Heavy Aerospace Rocket coordinates
            const vibration =
              currentCinematicStage === 'IGNITION' ? 0.35 : currentCinematicStage === 'ROCKET_FORMED' ? 0.08 : 0;
            const rocketData = generateRocketPosition(
              i,
              particleCount,
              rocketY,
              vibration
            );

            // Engine ignition particles downward stream
            if (rocketData.isEngine && (currentCinematicStage === 'IGNITION' || currentCinematicStage === 'LAUNCH')) {
              pVelocities[idx + 1] -= (0.45 + Math.random() * 0.7);
              // Supersonic shock diamonds and hypergolic fiery exhaust
              colors[idx] = rocketData.color.r;
              colors[idx + 1] = rocketData.color.g;
              colors[idx + 2] = rocketData.color.b;
            } else {
              const pullStrength = currentCinematicStage === 'GATHER' ? 0.045 : 0.095;
              pVelocities[idx] += (rocketData.pos.x - px) * pullStrength;
              pVelocities[idx + 1] += (rocketData.pos.y - py) * pullStrength;
              pVelocities[idx + 2] += (rocketData.pos.z - pz) * pullStrength;

              // Authentic aerospace vehicle livery: aerospace white, carbon black belly,
              // telemetry racing red & cobalt bands, scorched titanium grid fins,
              // glowing copper engine bells, and navigation strobe lights!
              colors[idx] = THREE.MathUtils.lerp(colors[idx], rocketData.color.r, 0.08);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], rocketData.color.g, 0.08);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], rocketData.color.b, 0.08);
            }
          } else if (currentCinematicStage === 'FLIGHT') {
            // Stretch into flowing cosmic trail
            pVelocities[idx + 1] -= 0.15;
            pVelocities[idx] += Math.sin(py * 0.2 + elapsedTime * 2) * 0.08;
          } else if (currentCinematicStage === 'LANDING_IMPACT') {
            // Rapid radial dispersion on impact
            const angle = Math.atan2(py - (-2.5), px);
            const dist = Math.hypot(px, py - (-2.5));
            const push = Math.max(0, 1.0 - dist / 12) * 0.7;
            pVelocities[idx] += Math.cos(angle) * push;
            pVelocities[idx + 1] += Math.sin(angle) * push + 0.2;
          } else if (currentCinematicStage === 'PARTICLE_CLOUD') {
            // Orbiting floating cloud of digital matter (12.40s)
            const angle = (i / particleCount) * Math.PI * 8 + elapsedTime * 1.5;
            const orbitR = 4.5 + Math.sin(i * 0.5) * 2.5;
            const targetX = Math.cos(angle) * orbitR;
            const targetY = Math.sin(angle) * orbitR * 0.75;
            pVelocities[idx] += (targetX - px) * 0.04;
            pVelocities[idx + 1] += (targetY - py) * 0.04;
          } else if (
            currentCinematicStage === 'PROFILE_FORMING' ||
            currentCinematicStage === 'PROFILE_RECOGNIZABLE' ||
            currentCinematicStage === 'PROFILE_LOCKING' ||
            currentCinematicStage === 'PROFILE_COMPLETE' ||
            currentCinematicStage === 'PROFILE_HOLD' ||
            currentCinematicStage === 'TEXT_PREPARE' ||
            currentCinematicStage === 'NAME_REVEAL' ||
            currentCinematicStage === 'TAGLINE_REVEAL' ||
            currentCinematicStage === 'IDENTITY_COMPLETE'
          ) {
            // Target coordinates from real GitHub profile sampling
            if (profilePoints.length > 0) {
              const pt = profilePoints[i % profilePoints.length];
              const phaseGate = rocketCinematicManager.state.reconstructionPhase;

              const isLockedOrHold =
                currentCinematicStage === 'PROFILE_LOCKING' ||
                currentCinematicStage === 'PROFILE_COMPLETE' ||
                currentCinematicStage === 'PROFILE_HOLD' ||
                currentCinematicStage === 'TEXT_PREPARE' ||
                currentCinematicStage === 'NAME_REVEAL' ||
                currentCinematicStage === 'TAGLINE_REVEAL' ||
                currentCinematicStage === 'IDENTITY_COMPLETE';

              // Progressive reveal by feature phase
              if (pt.phase <= phaseGate || isLockedOrHold) {
                // Gentle organic breathing alive effect during hold
                const breath =
                  currentCinematicStage === 'PROFILE_HOLD' ||
                  currentCinematicStage === 'IDENTITY_COMPLETE'
                    ? Math.sin(elapsedTime * 1.5 + px * 0.25) * 0.025
                    : 0;

                const targetX = pt.x;
                const targetY = pt.y + breath;
                const targetZ = pt.z;

                // Strong target attraction so all 6,000 dots snap crisply into the authentic portrait
                const formPull = isLockedOrHold ? 0.14 : 0.09;
                pVelocities[idx] += (targetX - px) * formPull;
                pVelocities[idx + 1] += (targetY - py) * formPull;
                pVelocities[idx + 2] += (targetZ - pz) * formPull;

                // Sync authentic photographic RGB colors with subtle cybernetic holographic scanline sheen
                const scanline = 0.08 * Math.sin(py * 3.5 - elapsedTime * 4.0);
                const pr = Math.min(1.4, pt.r * 1.12 + scanline);
                const pg = Math.min(1.4, pt.g * 1.12 + scanline);
                const pb = Math.min(1.5, pt.b * 1.22 + scanline * 1.4);
                colors[idx] = THREE.MathUtils.lerp(colors[idx], pr, 0.16);
                colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pg, 0.16);
                colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pb, 0.16);
              } else {
                // Particles awaiting phase activation converge into outer halo
                const targetX = pt.x * 1.15;
                const targetY = pt.y * 1.15;
                const targetZ = pt.z;
                pVelocities[idx] += (targetX - px) * 0.05;
                pVelocities[idx + 1] += (targetY - py) * 0.05;
                pVelocities[idx + 2] += (targetZ - pz) * 0.05;
                colors[idx] = THREE.MathUtils.lerp(colors[idx], pt.r * 0.7, 0.08);
                colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pt.g * 0.7, 0.08);
                colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pt.b * 0.7, 0.08);
              }
            }
          } else if (currentCinematicStage === 'RETURN_TO_WORLD') {
            // Gently dissolve back to original ambient home
            pVelocities[idx] += (ox - px) * 0.035;
            pVelocities[idx + 1] += (oy - py) * 0.035;
            pVelocities[idx + 2] += (oz - pz) * 0.035;
            colors[idx] = THREE.MathUtils.lerp(colors[idx], pBaseColors[idx], 0.03);
            colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pBaseColors[idx + 1], 0.03);
            colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pBaseColors[idx + 2], 0.03);
          }
        } else {
          // Standard Ambient Mode (Rock, Globe, Wave, Free Flow, Section-Aware)
          if (currentMorphBlend > 0.01) {
            formTargetX = ox;
            formTargetY = oy;
            formTargetZ = oz;

            if (ambientState === 'ROCK') {
              const rockPos = generateRockPosition(i, particleCount, elapsedTime);
              formTargetX = rockPos.x;
              formTargetY = rockPos.y;
              formTargetZ = rockPos.z;

              // Crystalline mineral sparkle
              const rockGlint = (i % 7 === 0) ? 0.30 * (Math.sin(elapsedTime * 2.2 + i) * 0.5 + 0.5) : 0;
              const rTarget = Math.min(1.25, pBaseColors[idx] + rockGlint);
              const gTarget = Math.min(1.25, pBaseColors[idx + 1] + rockGlint);
              const bTarget = Math.min(1.35, pBaseColors[idx + 2] + rockGlint * 1.2);
              colors[idx] = THREE.MathUtils.lerp(colors[idx], rTarget, 0.06);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], gTarget, 0.06);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], bTarget, 0.06);
            } else if (ambientState === 'GLOBE') {
              // 1. Precise Fibonacci Spherical Coordinates relative to explicit globeCenter
              const baseR = globeRadius + globeData.radiusOffset[i];
              const rotLon = globeData.lonRad[i] + globeRotationY;
              const cosLon = Math.cos(rotLon);
              const sinLon = Math.sin(rotLon);
              const cosLat = globeData.cosLat[i];
              const sinLat = globeData.sinLat[i];

              // Unrotated position on 3D sphere relative to globeCenter
              const x0 = baseR * cosLat * sinLon;
              const y0 = baseR * sinLat;
              const z0 = baseR * cosLat * cosLon;

              // Apply Earth's 23.44° axial tilt relative to globeCenter
              formTargetX = globeCenter.x + (x0 * cosTilt - y0 * sinTilt);
              formTargetY = globeCenter.y + (x0 * sinTilt + y0 * cosTilt);
              formTargetZ = globeCenter.z + z0;

              // 2. Surface normal & View-Space vector (camera looks towards origin along +Z)
              const invR = 1.0 / baseR;
              const nx = (formTargetX - globeCenter.x) * invR;
              const ny = (formTargetY - globeCenter.y) * invR;
              const nz = (formTargetZ - globeCenter.z) * invR;

              // View-space relationship between particle surface normal and camera direction
              const toCamX = camera.position.x - formTargetX;
              const toCamY = camera.position.y - formTargetY;
              const toCamZ = camera.position.z - formTargetZ;
              const camDist = Math.hypot(toCamX, toCamY, toCamZ);
              const invCamDist = camDist > 0.001 ? 1.0 / camDist : 1.0;
              const viewDot = (nx * toCamX + ny * toCamY + nz * toCamZ) * invCamDist;

              // 3. Directional Solar Illumination & Specular Glint
              const NdotL = nx * sunDirX + ny * sunDirY + nz * sunDirZ;
              const dayLight = Math.max(0.14, Math.min(1.0, NdotL * 0.85 + 0.44));

              // Blinn-Phong specular glint (ocean, glaciers, mountain snow)
              const NdotH = Math.max(0, nx * halfX + ny * halfY + nz * halfZ);
              const specularGlint = Math.pow(NdotH, 24.0);

              // Atmospheric Rayleigh rim scattering (ethereal blue/cyan edge glow on the planetary limb)
              const horizonTerm = 1.0 - Math.min(1.0, Math.abs(nz));
              const atmosphericRim = Math.pow(horizonTerm, 2.8) * 0.45;

              // Base biome color from precomputed data
              const feat = globeData.featureType[i];
              const isLand = globeData.isLand[i];
              let r = globeData.baseColorR[i] * dayLight;
              let g = globeData.baseColorG[i] * dayLight;
              let b = globeData.baseColorB[i] * dayLight;

              if (feat === 0 || feat === 1) {
                // Oceans & Coastal shelves:
                // Sun specular glint on water + turquoise shallow reef highlights
                const waterGlint = specularGlint * (feat === 1 ? 1.45 : 1.25);
                r += waterGlint * 0.85 + atmosphericRim * 0.12;
                g += waterGlint * 0.95 + atmosphericRim * 0.35;
                b += waterGlint * 1.15 + atmosphericRim * 0.70;
              } else if (feat === 6 || feat === 3) {
                // Polar Ice Caps & Alpine Mountain snowcaps
                const snowGlint = specularGlint * 1.50;
                r += snowGlint * 0.95 + atmosphericRim * 0.18;
                g += snowGlint * 0.98 + atmosphericRim * 0.32;
                b += snowGlint * 1.10 + atmosphericRim * 0.48;
              } else if (feat === 7) {
                // High-altitude floating cloud fronts
                const cloudPulse = 0.08 * Math.sin(elapsedTime * 2.0 + i * 0.2);
                r = Math.min(1.4, (globeData.baseColorR[i] + cloudPulse) * (dayLight * 0.95 + 0.25));
                g = Math.min(1.4, (globeData.baseColorG[i] + cloudPulse) * (dayLight * 0.95 + 0.25));
                b = Math.min(1.5, (globeData.baseColorB[i] + cloudPulse) * (dayLight * 0.95 + 0.25));
              } else if (feat === 8) {
                // Dancing electromagnetic polar ribbons
                const auroraWave = 0.35 * Math.sin(elapsedTime * 3.5 + i * 0.35);
                r = globeData.baseColorR[i] * (1.1 + auroraWave);
                g = globeData.baseColorG[i] * (1.1 + auroraWave);
                b = globeData.baseColorB[i] * (1.1 + auroraWave);
              } else if (isLand === 1 && NdotL < -0.05) {
                // Nocturnal golden city lights twinkling on the dark hemisphere of continents!
                const nightShadow = Math.min(1.0, -NdotL * 1.8);
                const cityTwinkle = 0.65 + 0.35 * Math.sin(elapsedTime * 2.5 + i * 1.6);
                r += nightShadow * 0.85 * cityTwinkle;
                g += nightShadow * 0.58 * cityTwinkle;
                b += nightShadow * 0.20 * cityTwinkle;
              } else {
                r += atmosphericRim * 0.14;
                g += atmosphericRim * 0.28;
                b += atmosphericRim * 0.38;
              }

              // 4. True 3D Spherical Depth & Back-Facing Opacity / Visibility Hierarchy (Item 6):
              // Front: high visibility (viewDot >= 0.10)
              // Side: medium visibility (-0.08 <= viewDot < 0.10) with atmospheric Rayleigh rim
              // Back: deeply occluded (viewDot < -0.08) so the globe reads as a solid 3D sphere
              let visibilityFactor: number;
              if (viewDot >= 0.10) {
                // Front hemisphere: rich clarity and high detail
                visibilityFactor = 0.82 + 0.28 * Math.min(1.0, (viewDot - 0.10) / 0.90);
              } else if (viewDot >= -0.08) {
                // Side horizon: medium visibility with atmospheric edge glow
                const edgeT = (viewDot + 0.08) / 0.18;
                visibilityFactor = 0.25 + 0.57 * edgeT;
              } else {
                // Back hemisphere: deeply occluded so back continents do not shine through
                const backDepth = Math.min(1.0, (-viewDot - 0.08) / 0.45);
                visibilityFactor = 0.03 * (1.0 - backDepth);
              }

              r *= visibilityFactor;
              g *= visibilityFactor;
              b *= visibilityFactor;

              colors[idx] = THREE.MathUtils.lerp(colors[idx], r, 0.12);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], g, 0.12);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], b, 0.12);
            } else if (ambientState === 'WAVE') {
              const wavePos = generateWavePosition(i, particleCount, elapsedTime);
              formTargetX = wavePos.x;
              formTargetY = wavePos.y;
              formTargetZ = wavePos.z;

              // Cresting fluid wave luminescence & foam sparkle
              const waveHeight = (formTargetY + 3.0) / 6.0;
              const crestShine = Math.pow(Math.max(0, waveHeight), 2.2) * 0.50;
              const rTarget = 0.14 + crestShine * 0.55;
              const gTarget = 0.60 + crestShine * 0.75;
              const bTarget = 1.02 + crestShine * 0.95;
              colors[idx] = THREE.MathUtils.lerp(colors[idx], rTarget, 0.06);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], gTarget, 0.06);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], bTarget, 0.06);
            }

            // Strong form attraction when in GLOBE mode so all particles lock crisply onto the sphere
            let formForce = 0.035 * currentMorphBlend;
            if (ambientState === 'GLOBE') {
              formForce = 0.095 * currentMorphBlend;
            }

            pVelocities[idx] += (formTargetX - px) * formForce;
            pVelocities[idx + 1] += (formTargetY - py) * formForce;
            pVelocities[idx + 2] += (formTargetZ - pz) * formForce;
          } else {
            let targetX = ox;
            let targetY = oy;
            let targetZ = oz;

            if (currentSection === 'projects') {
              const arch = generateArchitecturePosition(i, particleCount);
              targetX = THREE.MathUtils.lerp(ox, arch.x, 0.25);
              targetY = THREE.MathUtils.lerp(oy, arch.y, 0.25);
              targetZ = THREE.MathUtils.lerp(oz, arch.z, 0.25);
            } else if (currentSection === 'contact') {
              const conv = generateConvergencePosition(i, particleCount, elapsedTime);
              targetX = THREE.MathUtils.lerp(ox, conv.x, 0.2);
              targetY = THREE.MathUtils.lerp(oy, conv.y, 0.2);
              targetZ = THREE.MathUtils.lerp(oz, conv.z, 0.2);
            }

            const returnSpring = tier === 2 ? 0.015 : 0.035;
            pVelocities[idx] += (targetX - px) * returnSpring;
            pVelocities[idx + 1] += (targetY - py) * returnSpring;
            pVelocities[idx + 2] += (targetZ - pz) * returnSpring;

            // Natural multi-phase shimmer for highlights & ambient digital matter
            let baseR = pBaseColors[idx];
            let baseG = pBaseColors[idx + 1];
            let baseB = pBaseColors[idx + 2];

            if (tier === 0) {
              // Highlight particles (~5%): Slow, irregular jewel-like shimmer
              const shimmerSpeed = 1.1 + ((i * 13) % 7) * 0.18;
              const shimmerPhase = (i * 2.37) % (Math.PI * 2);
              const shm = Math.sin(elapsedTime * shimmerSpeed + shimmerPhase);
              if (shm > 0.30) {
                const shine = ((shm - 0.30) / 0.70) * 0.42;
                baseR = Math.min(1.35, baseR + shine);
                baseG = Math.min(1.35, baseG + shine);
                baseB = Math.min(1.45, baseB + shine * 1.15);
              }
            } else if (tier === 1) {
              // Midground matter (20%): subtle micro-luminance modulation
              const midPulse = 0.06 * Math.sin(elapsedTime * 0.9 + i * 1.4);
              baseR = Math.max(0.2, baseR + midPulse);
              baseG = Math.max(0.2, baseG + midPulse);
              baseB = Math.max(0.25, baseB + midPulse);
            }

            colors[idx] = THREE.MathUtils.lerp(colors[idx], baseR, 0.04);
            colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], baseG, 0.04);
            colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], baseB, 0.04);
          }
        }

        // 3. CURSOR REPULSION & WATER WAKE (Core Interaction)
        const distToCursorZ = Math.abs(camera.position.z - pz);
        const frustumHeightAtZ = 2 * distToCursorZ * Math.tan(vFovRad / 2);
        const unitsPerPixel = frustumHeightAtZ / viewH;
        const repulsionRadiusWorld = MATTER_CONFIG.physics.repulsionRadius * unitsPerPixel;

        const dx = px - cursorX;
        const dy = py - cursorY;
        const distFromCursor = Math.hypot(dx, dy);

        if (distFromCursor < repulsionRadiusWorld && distFromCursor > 0.01) {
          const normalizedDist = distFromCursor / repulsionRadiusWorld;
          let pushMagnitude =
            (1.0 - normalizedDist) * (1.0 - normalizedDist) * MATTER_CONFIG.physics.repulsionForce;

          // When in GLOBE mode: gentle elastic surface response so the globe remains a pristine 3D sphere
          if (ambientState === 'GLOBE') {
            pushMagnitude *= 0.22;
          }

          const nx = dx / distFromCursor;
          const ny = dy / distFromCursor;

          pVelocities[idx] += nx * pushMagnitude;
          pVelocities[idx + 1] += ny * pushMagnitude;
          pVelocities[idx + 2] += (Math.random() - 0.5) * pushMagnitude * (ambientState === 'GLOBE' ? 0.2 : 0.4);

          const wakeAttract = ambientState === 'GLOBE' ? 0.06 : MATTER_CONFIG.physics.wakeAttractionForce;
          pVelocities[idx] += cursorVelocityWorld.x * wakeAttract;
          pVelocities[idx + 1] += cursorVelocityWorld.y * wakeAttract;
        }

        // Interactive Cursor Specular Flare / Atmospheric Illumination
        const cursorFlareRadius = repulsionRadiusWorld * 1.35;
        if (distFromCursor < cursorFlareRadius && distFromCursor > 0.01) {
          const cursorFactor = 1.0 - distFromCursor / cursorFlareRadius;
          const cursorGleam = cursorFactor * cursorFactor * 0.48;
          colors[idx] = Math.min(1.4, colors[idx] + cursorGleam * 0.85);
          colors[idx + 1] = Math.min(1.4, colors[idx + 1] + cursorGleam * 0.95);
          colors[idx + 2] = Math.min(1.5, colors[idx + 2] + cursorGleam * 1.15);
        }

        // 4. WATER RIPPLE WAVE DISPLACEMENT (Skipped in GLOBE mode to preserve sphere stability)
        if (ambientState !== 'GLOBE') {
          for (let rIdx = 0; rIdx < ripples.length; rIdx++) {
            const rip = ripples[rIdx];
            const distToRip = Math.hypot(px - rip.x, py - rip.y);
            const waveDelta = Math.abs(distToRip - rip.radius);

            if (waveDelta < 1.8) {
              const waveStrength =
                (1.0 - waveDelta / 1.8) * rip.strength * 0.45;
              const ripAngle = Math.atan2(py - rip.y, px - rip.x);
              pVelocities[idx] += Math.cos(ripAngle) * waveStrength;
              pVelocities[idx + 1] += Math.sin(ripAngle) * waveStrength;
              pVelocities[idx + 2] += Math.sin(elapsedTime * 8) * waveStrength * 0.5;
            }
          }

          // 5. Scroll Velocity Reaction (Smoothly Clamped, skipped in GLOBE mode)
          if (Math.abs(scrollVelocity) > 0.01) {
            const scrollPush = Math.max(-0.12, Math.min(0.12, scrollVelocity * 0.0015));
            pVelocities[idx + 1] += scrollPush * (tier === 0 ? 1.2 : tier === 1 ? 0.75 : 0.35);
          }
        }

        // 6. Velocity Clamping & Fluid Damping
        const maxVel = ambientState === 'GLOBE' ? 0.45 : 0.85;
        pVelocities[idx] = Math.max(-maxVel, Math.min(maxVel, pVelocities[idx] * MATTER_CONFIG.physics.damping));
        pVelocities[idx + 1] = Math.max(-maxVel, Math.min(maxVel, pVelocities[idx + 1] * MATTER_CONFIG.physics.damping));
        pVelocities[idx + 2] = Math.max(-maxVel, Math.min(maxVel, pVelocities[idx + 2] * MATTER_CONFIG.physics.damping));

        positions[idx] += pVelocities[idx];
        positions[idx + 1] += pVelocities[idx + 1];
        positions[idx + 2] += pVelocities[idx + 2];

        // STRICT SPHERICAL RADIUS CONSTRAINT FOR GLOBE (Items 1, 13, 14):
        // Guarantees all particles remain mathematically bounded to the sphere.
        // Surface particles: distanceFromCenter ≈ globeRadius
        // Atmospheric particles: distanceFromCenter <= globeRadius + small tolerance
        if (ambientState === 'GLOBE') {
          const blend = currentMorphBlend;
          if (blend > 0.1) {
            const snapSpeed = (blend >= 0.8 ? 0.24 : 0.16) * blend;
            positions[idx] = THREE.MathUtils.lerp(positions[idx], formTargetX, snapSpeed);
            positions[idx + 1] = THREE.MathUtils.lerp(positions[idx + 1], formTargetY, snapSpeed);
            positions[idx + 2] = THREE.MathUtils.lerp(positions[idx + 2], formTargetZ, snapSpeed);
          }

          const relX = positions[idx] - globeCenter.x;
          const relY = positions[idx + 1] - globeCenter.y;
          const relZ = positions[idx + 2] - globeCenter.z;
          const curDist = Math.hypot(relX, relY, relZ);

          if (curDist > 0.0001) {
            const feat = globeData.featureType[i];
            const maxTolerance = feat === 8 ? 0.06 : feat === 7 ? 0.04 : 0.015;
            const maxAllowed = globeRadius + maxTolerance;
            const minAllowed = globeRadius - 0.02;

            if (curDist > maxAllowed) {
              const s = maxAllowed / curDist;
              positions[idx] = globeCenter.x + relX * s;
              positions[idx + 1] = globeCenter.y + relY * s;
              positions[idx + 2] = globeCenter.z + relZ * s;
              pVelocities[idx] *= 0.2;
              pVelocities[idx + 1] *= 0.2;
              pVelocities[idx + 2] *= 0.2;
            } else if (curDist < minAllowed) {
              const s = minAllowed / curDist;
              positions[idx] = globeCenter.x + relX * s;
              positions[idx + 1] = globeCenter.y + relY * s;
              positions[idx + 2] = globeCenter.z + relZ * s;
            }

            // Remove any outward radial velocity component so particles never drift off the sphere
            const invCur = 1.0 / Math.max(0.001, curDist);
            const snx = relX * invCur;
            const sny = relY * invCur;
            const snz = relZ * invCur;
            const vRadial = pVelocities[idx] * snx + pVelocities[idx + 1] * sny + pVelocities[idx + 2] * snz;
            if (vRadial > 0) {
              pVelocities[idx] -= snx * vRadial;
              pVelocities[idx + 1] -= sny * vRadial;
              pVelocities[idx + 2] -= snz * vRadial;
            }
          }
        }
      }

      // ==========================================
      // PHYSICS-BASED PARTICLE-PARTICLE COLLISION DETECTION & IMPULSE PASS
      // O(N) Spatial Hash Grid - High Performance 60-120 FPS
      // Particles react physically to each other with elastic momentum exchange, non-penetration separation,
      // and kinetic energy flashes that feed directly into the UnrealBloomPass!
      // ==========================================
      const isProfileFormingOrHeld =
        currentCinematicStage === 'PROFILE_FORMING' ||
        currentCinematicStage === 'PROFILE_RECOGNIZABLE' ||
        currentCinematicStage === 'PROFILE_LOCKING' ||
        currentCinematicStage === 'PROFILE_COMPLETE' ||
        currentCinematicStage === 'PROFILE_HOLD';

      const isGlobeActive = ambientState === 'GLOBE';

      if (!prefersReduced && !isProfileFormingOrHeld && !isGlobeActive) {
        gridHead.fill(-1);

        // 1. Bin particles into 3D spatial hash grid
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const px = positions[i3];
          const py = positions[i3 + 1];
          const pz = positions[i3 + 2];

          const cx = Math.floor(px * INV_CELL_SIZE);
          const cy = Math.floor(py * INV_CELL_SIZE);
          const cz = Math.floor(pz * INV_CELL_SIZE);

          let h =
            ((cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791)) &
            (HASH_SIZE - 1);
          if (h < 0) h = (h + HASH_SIZE) & (HASH_SIZE - 1);

          gridNext[i] = gridHead[h];
          gridHead[h] = i;
        }

        // 2. Collision Detection, Separation & Momentum Exchange
        const restitution = 0.65; // Luxury fluid cushioning
        const separationStiffness = 0.52; // Elastic non-penetration

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const px = positions[i3];
          const py = positions[i3 + 1];
          const pz = positions[i3 + 2];
          const rA = pRadii[i];

          const cx = Math.floor(px * INV_CELL_SIZE);
          const cy = Math.floor(py * INV_CELL_SIZE);
          const cz = Math.floor(pz * INV_CELL_SIZE);

          // Check 3x3x3 neighborhood (27 cells)
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              for (let oz = -1; oz <= 1; oz++) {
                let nh =
                  (((cx + ox) * 73856093) ^
                    ((cy + oy) * 19349663) ^
                    ((cz + oz) * 83492791)) &
                  (HASH_SIZE - 1);
                if (nh < 0) nh = (nh + HASH_SIZE) & (HASH_SIZE - 1);

                let j = gridHead[nh];
                while (j !== -1) {
                  if (j > i) {
                    const j3 = j * 3;
                    const dx = px - positions[j3];
                    const dy = py - positions[j3 + 1];
                    const dz = pz - positions[j3 + 2];
                    const distSq = dx * dx + dy * dy + dz * dz;
                    const rSum = rA + pRadii[j];

                    if (distSq < rSum * rSum && distSq > 0.00001) {
                      const dist = Math.sqrt(distSq);
                      const overlap = rSum - dist;

                      const nx = dx / dist;
                      const ny = dy / dist;
                      const nz = dz / dist;

                      // Non-penetration positional push
                      const sep = overlap * 0.5 * separationStiffness;
                      positions[i3] += nx * sep;
                      positions[i3 + 1] += ny * sep;
                      positions[i3 + 2] += nz * sep;

                      positions[j3] -= nx * sep;
                      positions[j3 + 1] -= ny * sep;
                      positions[j3 + 2] -= nz * sep;

                      // Relative velocity and momentum impulse
                      const rvx = pVelocities[i3] - pVelocities[j3];
                      const rvy = pVelocities[i3 + 1] - pVelocities[j3 + 1];
                      const rvz = pVelocities[i3 + 2] - pVelocities[j3 + 2];
                      const vNorm = rvx * nx + rvy * ny + rvz * nz;

                      if (vNorm < 0) {
                        const impulse = -(1.0 + restitution) * vNorm * 0.5;

                        pVelocities[i3] += nx * impulse;
                        pVelocities[i3 + 1] += ny * impulse;
                        pVelocities[i3 + 2] += nz * impulse;

                        pVelocities[j3] -= nx * impulse;
                        pVelocities[j3 + 1] -= ny * impulse;
                        pVelocities[j3 + 2] -= nz * impulse;

                        // Tangential micro-deflection
                        const tx = rvx - nx * vNorm;
                        const ty = rvy - ny * vNorm;
                        const tz = rvz - nz * vNorm;
                        pVelocities[i3] -= tx * 0.04;
                        pVelocities[i3 + 1] -= ty * 0.04;
                        pVelocities[i3 + 2] -= tz * 0.04;
                        pVelocities[j3] += tx * 0.04;
                        pVelocities[j3 + 1] += ty * 0.04;
                        pVelocities[j3] += tz * 0.04;

                        // Kinetic collision glow flash (exceeds bloom threshold 0.70 to trigger subtle light-glow)
                        const impact = -vNorm;
                        if (impact > 0.035) {
                          const flash = Math.min(0.55, impact * 0.45);
                          colors[i3] = Math.min(1.4, colors[i3] + flash);
                          colors[i3 + 1] = Math.min(1.4, colors[i3 + 1] + flash);
                          colors[i3 + 2] = Math.min(1.5, colors[i3 + 2] + flash * 1.2);

                          colors[j3] = Math.min(1.4, colors[j3] + flash);
                          colors[j3 + 1] = Math.min(1.4, colors[j3 + 1] + flash);
                          colors[j3 + 2] = Math.min(1.5, colors[j3 + 2] + flash * 1.2);
                        }
                      }
                    }
                  }
                  j = gridNext[j];
                }
              }
            }
          }
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      unsubInteraction();
      unsubCinematic();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animId);

      if (composer) {
        composer.dispose();
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#050505]"
      style={{
        willChange: 'transform',
      }}
    >
      {/* Deep foundation chromatic vignette - calibrated to never clip the globe */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 68%, rgba(5, 5, 5, 0.85) 100%)',
        }}
      />

      {/* Tactile micro-grain filter preventing digital color banding */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

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
  generateGlobePosition,
  generateWavePosition,
  generateArchitecturePosition,
  generateConvergencePosition,
  generateSpherePosition,
  generateRingPosition,
  generateOrbitPosition,
  generateBlueprintPosition,
} from './matterFormGeometry';
import {
  generateRocketPosition,
} from './matterRocketGeometry';
import {
  sampleProfileImage,
  ProfileSamplePoint,
} from './matterProfileSampler';
import {
  rocketCinematicManager,
  CinematicStage,
} from './rocketCinematicManager';
import {
  entrySequenceManager,
  EntryStage,
} from './entrySequenceManager';

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

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
      stencil: false,
      depth: true,
    });

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

    // 2. Post-Processing Pipeline
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;

    if (!isMobile && !prefersReducedMotion) {
      try {
        const renderResolution = new THREE.Vector2(
          window.innerWidth * (isTablet ? 0.75 : 1.0),
          window.innerHeight * (isTablet ? 0.75 : 1.0)
        );

        composer = new EffectComposer(renderer);
        composer.setPixelRatio(dpr);
        composer.setSize(window.innerWidth, window.innerHeight);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        bloomPass = new UnrealBloomPass(renderResolution, 0.42, 0.35, 0.26);
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);
      } catch (err) {
        console.warn('Fallback to direct hardware renderer:', err);
        composer = null;
        bloomPass = null;
      }
    }

    // 3. Cinematic Ambient, Spotlight & Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0c10, 1.8);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0xffffff, 2.2, 28, 1.6);
    cursorLight.position.set(0, 0, 5);
    scene.add(cursorLight);

    const rocketEngineLight = new THREE.PointLight(0x22d3ee, 0, 20, 2.0);
    scene.add(rocketEngineLight);

    // Dedicated GitHub Profile Radiance Spotlight (Turns on during profile reveal)
    const profileRadianceLight = new THREE.PointLight(0xffffff, 0, 32, 1.4);
    profileRadianceLight.position.set(0, 0, 4.0);
    scene.add(profileRadianceLight);

    const profileCyanFill = new THREE.PointLight(0x06b6d4, 0, 24, 1.8);
    profileCyanFill.position.set(0, -1.0, 3.0);
    scene.add(profileCyanFill);

    // 4. Procedural Soft Particle Texture
    const particleTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.28)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(cvs);
    })();

    // 5. Living Matter Particle System (Typed Arrays for High GPU Throughput)
    const particleGeometry = new THREE.BufferGeometry();

    const pPositions = new Float32Array(particleCount * 3);
    const pOriginalHome = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pBaseColors = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    const pTiers = new Uint8Array(particleCount);

    // Profile Targets Storage
    let profilePoints: ProfileSamplePoint[] = [];
    sampleProfileImage('/github_avatar.png', particleCount).then((pts) => {
      profilePoints = pts;
    });

    const colWhiteLow = MATTER_CONFIG.colors.baseWhiteLow;
    const colWhiteMid = MATTER_CONFIG.colors.baseWhiteMid;
    const colWhiteHigh = MATTER_CONFIG.colors.baseWhiteHigh;
    const colAccentBlue = MATTER_CONFIG.colors.accentBlue;
    const colAccentPurple = MATTER_CONFIG.colors.accentPurple;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const rand = Math.random();

      let tier = 1;
      let depthZ = -4.0 + Math.random() * 8.0;
      let baseSize = 0.32;
      let col = colWhiteMid;

      if (rand < 0.25) {
        tier = 0;
        depthZ = 1.0 + Math.random() * 5.0;
        baseSize = 0.42 + Math.random() * 0.18;
        col = rand < 0.04 ? colAccentBlue : colWhiteHigh;
      } else if (rand > 0.75) {
        tier = 2;
        depthZ = -16.0 + Math.random() * 8.0;
        baseSize = 0.22 + Math.random() * 0.1;
        col = rand > 0.96 ? colAccentPurple : colWhiteLow;
      }

      pTiers[i] = tier;
      pSizes[i] = baseSize;

      const spreadX = tier === 2 ? 46 : tier === 1 ? 34 : 26;
      const spreadY = tier === 2 ? 34 : tier === 1 ? 26 : 20;

      const px = (Math.random() - 0.5) * spreadX;
      const py = (Math.random() - 0.5) * spreadY;

      pPositions[idx] = px;
      pPositions[idx + 1] = py;
      pPositions[idx + 2] = depthZ;

      pOriginalHome[idx] = px;
      pOriginalHome[idx + 1] = py;
      pOriginalHome[idx + 2] = depthZ;

      pVelocities[idx] = (Math.random() - 0.5) * 0.02;
      pVelocities[idx + 1] = (Math.random() - 0.5) * 0.02;
      pVelocities[idx + 2] = (Math.random() - 0.5) * 0.01;

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
      size: 0.38,
      map: particleTexture,
      transparent: true,
      opacity: 0.92,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
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
    let ambientTime = 0;
    let targetMorphBlend = 0;
    let currentMorphBlend = 0;
    let globeRotationY = 0;

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const newDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(newDpr);
      renderer.setSize(w, h);

      if (composer) {
        composer.setPixelRatio(newDpr);
        composer.setSize(w, h);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });

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

      const {
        ndcX,
        ndcY,
        scrollProgress,
        scrollVelocity,
        sectionTheme,
        prefersReduced,
      } = interactionEngine.state;

      updateWorldMouse();

      // ==========================================
      // CINEMATIC STAGE MACHINE
      // ==========================================
      const inCinematicSequence = currentCinematicStage !== 'IDLE';

      if (inCinematicSequence && !prefersReduced) {
        if (currentCinematicStage === 'GATHER') {
          // Particles converge to form rocket shape
          rocketY = -1.5;
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.40, 0.05);
          if (cinematicStageTimer > 2.8) {
            rocketCinematicManager.setStage('ROCKET_FORMED');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'ROCKET_FORMED') {
          // Micro vibration & stabilization
          cameraShake = 0.04;
          if (cinematicStageTimer > 1.2) {
            rocketCinematicManager.setStage('IGNITION');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'IGNITION') {
          // Engine sparks buildup & downward particle velocity
          cameraShake = 0.08 + cinematicStageTimer * 0.12;
          rocketEngineLight.intensity = Math.min(4.5, cinematicStageTimer * 4.0);
          rocketEngineLight.position.set(0, rocketY - 4.5, -2.0);

          if (cinematicStageTimer > 1.6) {
            rocketVelocityY = 0.05;
            rocketCinematicManager.setStage('LAUNCH');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'LAUNCH') {
          // Rapid upward acceleration
          rocketVelocityY += delta * 18.0;
          rocketY += rocketVelocityY * delta;
          cameraShake = 0.15;
          rocketEngineLight.position.set(0, rocketY - 4.5, -2.0);

          if (rocketY > 24) {
            rocketCinematicManager.setStage('FLIGHT');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'FLIGHT') {
          // Rocket travels through deep environment & loops toward descent
          cameraShake = 0.02;
          rocketEngineLight.intensity = Math.max(0, rocketEngineLight.intensity - delta * 2.0);
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

          profileRadianceLight.intensity = THREE.MathUtils.lerp(profileRadianceLight.intensity, 1.4, 0.05);
          profileCyanFill.intensity = THREE.MathUtils.lerp(profileCyanFill.intensity, 0.8, 0.05);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.43, 0.05);

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

          profileRadianceLight.intensity = THREE.MathUtils.lerp(profileRadianceLight.intensity, 1.6, 0.06);
          profileCyanFill.intensity = THREE.MathUtils.lerp(profileCyanFill.intensity, 1.0, 0.06);
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.44, 0.05);

          if (cinematicStageTimer >= 1.2) {
            // Transition to PROFILE_LOCKING at 15.40s
            rocketCinematicManager.setStage('PROFILE_LOCKING');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_LOCKING') {
          // 15.40s - 16.20s (0.8s): Fine image details stabilize, target attraction increases
          const progress = Math.min(1.0, cinematicStageTimer / 0.8);
          rocketCinematicManager.update({
            stageProgress: progress,
            reconstructionPhase: 5, // All phases active (0 through 5)
          });

          profileRadianceLight.intensity = 1.6;
          profileCyanFill.intensity = 1.0;
          particleMaterial.size = 0.44;

          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.48, 0.05);
          }

          if (cinematicStageTimer >= 0.8) {
            // Transition to PROFILE_COMPLETE at 16.20s
            rocketCinematicManager.setStage('PROFILE_COMPLETE');
            cinematicStageTimer = 0;
          }
        } else if (currentCinematicStage === 'PROFILE_COMPLETE') {
          // 16.20s: Instantaneous state marker that rolls into PROFILE_HOLD
          rocketCinematicManager.setStage('PROFILE_HOLD');
          cinematicStageTimer = 0;
        } else if (currentCinematicStage === 'PROFILE_HOLD') {
          // 16.20s - 17.50s (1.3s pause): PROFILE IMAGE ONLY — NO TEXT
          profileRadianceLight.intensity = 1.6;
          profileCyanFill.intensity = 1.0;
          particleMaterial.size = 0.44;

          if (cinematicStageTimer >= 1.3) {
            // Transition to TEXT_PREPARE at 17.50s
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
          particleMaterial.size = THREE.MathUtils.lerp(particleMaterial.size, 0.38, 0.05);

          if (bloomPass) {
            bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 0.42, 0.05);
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

      // ==========================================
      // AMBIENT FORM TIMELINE & CONTINUOUS REPETITION
      // ==========================================
      // Cycles continuously:
      // FREE_FLOW -> ROCK -> GLOBE -> WAVE -> TRIGGER ROCKET SEQUENCE -> repeat
      if (!inCinematicSequence && !prefersReduced) {
        ambientTime += delta;
        if (ambientState === 'FREE_FLOW') {
          targetMorphBlend = 0;
          if (ambientTime > MATTER_CONFIG.timing.freeFlowDuration) {
            ambientState = 'ROCK';
            ambientTime = 0;
          }
        } else if (ambientState === 'ROCK') {
          targetMorphBlend = 1;
          if (ambientTime > MATTER_CONFIG.timing.rockFormDuration) {
            ambientState = 'GLOBE';
            ambientTime = 0;
          }
        } else if (ambientState === 'GLOBE') {
          targetMorphBlend = 1;
          globeRotationY += delta * 0.25;
          if (ambientTime > MATTER_CONFIG.timing.globeFormDuration) {
            ambientState = 'WAVE';
            ambientTime = 0;
          }
        } else if (ambientState === 'WAVE') {
          targetMorphBlend = 1;
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

      // Camera Parallax & Subtle Shake Response
      if (!prefersReduced) {
        const shakeX = (Math.random() - 0.5) * cameraShake;
        const shakeY = (Math.random() - 0.5) * cameraShake;

        camera.rotation.y = -ndcX * 0.035 + shakeX * 0.05;
        camera.rotation.x = ndcY * 0.025 + shakeY * 0.05;
        camera.position.x = ndcX * 0.75 + shakeX;
        camera.position.y = ndcY * 0.5 - scrollProgress * 6.0 + shakeY;
        camera.position.z = cameraBaseZ - scrollProgress * 4.0;
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

        // 1. Organic Curl Noise (Watery Base Current)
        const curl = getCurlNoise(
          px * MATTER_CONFIG.physics.fluidCurlScale,
          py * MATTER_CONFIG.physics.fluidCurlScale,
          elapsedTime * 0.12
        );
        pVelocities[idx] += curl.x * MATTER_CONFIG.physics.fluidSpeed;
        pVelocities[idx + 1] += curl.y * MATTER_CONFIG.physics.fluidSpeed;
        pVelocities[idx + 2] += curl.z * (MATTER_CONFIG.physics.fluidSpeed * 0.5);

        // 2. Target Attraction Vectors (Rocket, Flight, Profile or Ambient)
        if (inCinematicSequence) {
          if (
            currentCinematicStage === 'GATHER' ||
            currentCinematicStage === 'ROCKET_FORMED' ||
            currentCinematicStage === 'IGNITION' ||
            currentCinematicStage === 'LAUNCH' ||
            currentCinematicStage === 'DESCENT'
          ) {
            // Morph into Rocket coordinates
            const vibration =
              currentCinematicStage === 'IGNITION' ? 0.35 : currentCinematicStage === 'ROCKET_FORMED' ? 0.08 : 0;
            const { pos: rocketTarget, isEngine } = generateRocketPosition(
              i,
              particleCount,
              rocketY,
              vibration
            );

            // Engine ignition particles downward stream
            if (isEngine && (currentCinematicStage === 'IGNITION' || currentCinematicStage === 'LAUNCH')) {
              pVelocities[idx + 1] -= (0.4 + Math.random() * 0.6);
              colors[idx] = 0.2;
              colors[idx + 1] = 0.9;
              colors[idx + 2] = 1.0;
            } else {
              const pullStrength = currentCinematicStage === 'GATHER' ? 0.038 : 0.085;
              pVelocities[idx] += (rocketTarget.x - px) * pullStrength;
              pVelocities[idx + 1] += (rocketTarget.y - py) * pullStrength;
              pVelocities[idx + 2] += (rocketTarget.z - pz) * pullStrength;

              // Rocket body sleek titanium / electric blue styling
              colors[idx] = THREE.MathUtils.lerp(colors[idx], 0.9, 0.04);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], 0.95, 0.04);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], 1.0, 0.04);
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
                // Micro-breathing alive effect during hold & reveal
                const breath =
                  currentCinematicStage === 'PROFILE_HOLD' ||
                  currentCinematicStage === 'IDENTITY_COMPLETE'
                    ? Math.sin(elapsedTime * 2.0 + px * 0.5) * 0.04
                    : 0;

                const targetX = pt.x;
                const targetY = pt.y + breath;
                const targetZ = pt.z;

                // Stronger target attraction as profile locks into place
                const formPull = isLockedOrHold ? 0.092 : 0.065;
                pVelocities[idx] += (targetX - px) * formPull;
                pVelocities[idx + 1] += (targetY - py) * formPull;
                pVelocities[idx + 2] += (targetZ - pz) * formPull;

                // Sync authentic image pixel colors with enhanced HDR luminance
                colors[idx] = THREE.MathUtils.lerp(colors[idx], pt.r, 0.08);
                colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pt.g, 0.08);
                colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pt.b, 0.08);
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
            let formTarget = new THREE.Vector3(ox, oy, oz);

            if (ambientState === 'ROCK') {
              formTarget = generateRockPosition(i, particleCount, elapsedTime);
            } else if (ambientState === 'GLOBE') {
              const { pos: globePos, isLand } = generateGlobePosition(
                i,
                particleCount,
                globeRotationY
              );
              formTarget = globePos;

              if (isLand) {
                colors[idx] = THREE.MathUtils.lerp(colors[idx], colAccentBlue.r, 0.04);
                colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], colAccentBlue.g, 0.04);
                colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], colAccentBlue.b, 0.04);
              }
            } else if (ambientState === 'WAVE') {
              formTarget = generateWavePosition(i, particleCount, elapsedTime);
            }

            const formForce = 0.035 * currentMorphBlend;
            pVelocities[idx] += (formTarget.x - px) * formForce;
            pVelocities[idx + 1] += (formTarget.y - py) * formForce;
            pVelocities[idx + 2] += (formTarget.z - pz) * formForce;
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

            colors[idx] = THREE.MathUtils.lerp(colors[idx], pBaseColors[idx], 0.02);
            colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pBaseColors[idx + 1], 0.02);
            colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pBaseColors[idx + 2], 0.02);
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
          const pushMagnitude =
            (1.0 - normalizedDist) * (1.0 - normalizedDist) * MATTER_CONFIG.physics.repulsionForce;

          const nx = dx / distFromCursor;
          const ny = dy / distFromCursor;

          pVelocities[idx] += nx * pushMagnitude;
          pVelocities[idx + 1] += ny * pushMagnitude;
          pVelocities[idx + 2] += (Math.random() - 0.5) * pushMagnitude * 0.4;

          pVelocities[idx] += cursorVelocityWorld.x * MATTER_CONFIG.physics.wakeAttractionForce;
          pVelocities[idx + 1] += cursorVelocityWorld.y * MATTER_CONFIG.physics.wakeAttractionForce;
        }

        // 4. WATER RIPPLE WAVE DISPLACEMENT
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

        // 5. Scroll Velocity Reaction
        if (Math.abs(scrollVelocity) > 0.01) {
          const scrollPush = scrollVelocity * 0.003;
          pVelocities[idx + 1] += scrollPush * (tier === 0 ? 1.5 : tier === 1 ? 0.9 : 0.4);
        }

        // 6. Velocity Clamping & Fluid Damping
        pVelocities[idx] *= MATTER_CONFIG.physics.damping;
        pVelocities[idx + 1] *= MATTER_CONFIG.physics.damping;
        pVelocities[idx + 2] *= MATTER_CONFIG.physics.damping;

        positions[idx] += pVelocities[idx];
        positions[idx + 1] += pVelocities[idx + 1];
        positions[idx + 2] += pVelocities[idx + 2];
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
      {/* Deep foundation chromatic vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, transparent 35%, rgba(5, 5, 5, 0.92) 88%)',
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

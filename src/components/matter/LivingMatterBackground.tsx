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
} from './matterFormGeometry';

/**
 * HIGH-END LIVING DIGITAL MATTER SYSTEM
 *
 * Core Concept:
 * - BLACK VOID + FLOATING PARTICLES + LIQUID MOVEMENT + DEPTH + GRAVITY + INTERACTION + 3D FORMS
 * - Cursor acts as a physical force inside the particle field.
 * - Thousands of particles behaving like intelligent fluid digital matter.
 *
 * Physics & Lifecycle:
 * - Smooth quadratic cursor repulsion (particles smoothly move away like water).
 * - Watery fluid wake trailing the cursor.
 * - Click ripples expanding outward as physical waves.
 * - Procedural 3D form cycles: Matter -> Floating Rock -> 3D Earth Globe -> Oceanic Wave -> Dissolution.
 * - Section-aware adaptation (Projects: Architecture matrix; Contact: Convergence).
 * - 60-120 FPS GPU-accelerated Points system, zero UI interference (z-index: 0, pointer-events: none).
 */

type MatterState = 'FREE_FLOW' | 'ROCK' | 'GLOBE' | 'WAVE';

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
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 2. Post-Processing Pipeline (Soft bloom on desktop fine-pointer devices)
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

        bloomPass = new UnrealBloomPass(renderResolution, 0.4, 0.35, 0.28);
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);
      } catch (err) {
        console.warn('Fallback to direct hardware renderer:', err);
        composer = null;
        bloomPass = null;
      }
    }

    // 3. Cinematic Ambient Lighting (Soft, invisible light follows cursor)
    const ambientLight = new THREE.AmbientLight(0x0a0c10, 1.8);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0xffffff, 2.2, 28, 1.6);
    cursorLight.position.set(0, 0, 5);
    scene.add(cursorLight);

    const accentLight = new THREE.PointLight(0x5b8cff, 1.4, 35, 2.0);
    accentLight.position.set(-12, -10, -5);
    scene.add(accentLight);

    // 4. Procedural Soft Particle Texture
    const particleTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.22)');
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
    const pTiers = new Uint8Array(particleCount); // 0: near interactive, 1: mid, 2: deep background

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
        tier = 0; // Near / interactive layer
        depthZ = 1.0 + Math.random() * 5.0;
        baseSize = 0.42 + Math.random() * 0.18;
        col = rand < 0.04 ? colAccentBlue : colWhiteHigh;
      } else if (rand > 0.75) {
        tier = 2; // Deep space layer
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
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 6. Water Ripple Waves
    const ripples: RippleWave[] = [];

    const triggerRipple = (wx: number, wy: number) => {
      if (prefersReducedMotion) return;
      if (ripples.length >= MATTER_CONFIG.ripple.maxRipples) {
        ripples.shift();
      }
      ripples.push({
        x: wx,
        y: wy,
        radius: 0.4,
        maxRadius: MATTER_CONFIG.ripple.maxRadius,
        speed: MATTER_CONFIG.ripple.expansionSpeed,
        strength: MATTER_CONFIG.ripple.strength,
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

    // 8. Form State Machine (FREE_FLOW -> ROCK -> GLOBE -> WAVE -> FREE_FLOW)
    let matterState: MatterState = 'FREE_FLOW';
    let stateTime = 0;
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

    // 9. Visibility API Optimization for Battery & Idle Tabs
    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 10. Main 60-120 FPS Physics & Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();
      stateTime += delta;

      const {
        ndcX,
        ndcY,
        scrollProgress,
        scrollVelocity,
        sectionTheme,
        prefersReduced,
      } = interactionEngine.state;

      updateWorldMouse();

      // State Transition Timeline
      if (!prefersReduced) {
        if (matterState === 'FREE_FLOW') {
          targetMorphBlend = 0;
          if (stateTime > MATTER_CONFIG.timing.freeFlowDuration) {
            matterState = 'ROCK';
            stateTime = 0;
          }
        } else if (matterState === 'ROCK') {
          targetMorphBlend = 1;
          if (stateTime > MATTER_CONFIG.timing.rockFormDuration) {
            matterState = 'GLOBE';
            stateTime = 0;
          }
        } else if (matterState === 'GLOBE') {
          targetMorphBlend = 1;
          globeRotationY += delta * 0.25;
          if (stateTime > MATTER_CONFIG.timing.globeFormDuration) {
            matterState = 'WAVE';
            stateTime = 0;
          }
        } else if (matterState === 'WAVE') {
          targetMorphBlend = 1;
          if (stateTime > MATTER_CONFIG.timing.waveFormDuration) {
            matterState = 'FREE_FLOW';
            stateTime = 0;
          }
        }
      }

      currentMorphBlend += (targetMorphBlend - currentMorphBlend) * MATTER_CONFIG.timing.morphTransitionSpeed;

      // Parallax Camera movement
      if (!prefersReduced) {
        camera.rotation.y = -ndcX * 0.035;
        camera.rotation.x = ndcY * 0.025;
        camera.position.x = ndcX * 0.75;
        camera.position.y = ndcY * 0.5 - scrollProgress * 6.0;
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

      // Check current section for contextual structural influences
      const currentSection = sectionTheme?.name || 'hero';

      // Physics Simulation Pass for every particle
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const px = positions[idx];
        const py = positions[idx + 1];
        const pz = positions[idx + 2];

        const ox = pOriginalHome[idx];
        const oy = pOriginalHome[idx + 1];
        const oz = pOriginalHome[idx + 2];
        const tier = pTiers[i];

        // 1. Organic Curl Noise Vector (Simulating underwater invisible currents)
        const curl = getCurlNoise(
          px * MATTER_CONFIG.physics.fluidCurlScale,
          py * MATTER_CONFIG.physics.fluidCurlScale,
          elapsedTime * 0.12
        );

        pVelocities[idx] += curl.x * MATTER_CONFIG.physics.fluidSpeed;
        pVelocities[idx + 1] += curl.y * MATTER_CONFIG.physics.fluidSpeed;
        pVelocities[idx + 2] += curl.z * (MATTER_CONFIG.physics.fluidSpeed * 0.5);

        // 2. 3D Form Target (Matter -> Rock -> Globe -> Wave -> Dissolution)
        if (currentMorphBlend > 0.01) {
          let formTarget = new THREE.Vector3(ox, oy, oz);

          if (matterState === 'ROCK') {
            formTarget = generateRockPosition(i, particleCount, elapsedTime);
          } else if (matterState === 'GLOBE') {
            const { pos: globePos, isLand } = generateGlobePosition(
              i,
              particleCount,
              globeRotationY
            );
            formTarget = globePos;

            // Continents receive subtle radiant blue/cyan luminescence
            if (isLand) {
              colors[idx] = THREE.MathUtils.lerp(colors[idx], colAccentBlue.r, 0.04);
              colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], colAccentBlue.g, 0.04);
              colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], colAccentBlue.b, 0.04);
            }
          } else if (matterState === 'WAVE') {
            formTarget = generateWavePosition(i, particleCount, elapsedTime);
          }

          const formForce = 0.035 * currentMorphBlend;
          pVelocities[idx] += (formTarget.x - px) * formForce;
          pVelocities[idx + 1] += (formTarget.y - py) * formForce;
          pVelocities[idx + 2] += (formTarget.z - pz) * formForce;
        } else {
          // Section-aware gentle structural tendencies
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

          // Return spring to original home field
          const returnSpring = tier === 2 ? 0.015 : 0.035;
          pVelocities[idx] += (targetX - px) * returnSpring;
          pVelocities[idx + 1] += (targetY - py) * returnSpring;
          pVelocities[idx + 2] += (targetZ - pz) * returnSpring;

          // Revert colors to base monochrome values
          colors[idx] = THREE.MathUtils.lerp(colors[idx], pBaseColors[idx], 0.02);
          colors[idx + 1] = THREE.MathUtils.lerp(colors[idx + 1], pBaseColors[idx + 1], 0.02);
          colors[idx + 2] = THREE.MathUtils.lerp(colors[idx + 2], pBaseColors[idx + 2], 0.02);
        }

        // 3. CURSOR REPULSION & WATER WAKE (Core Interaction)
        // Particles smoothly accelerate away like liquid responding to physical force
        const distToCursorZ = Math.abs(camera.position.z - pz);
        const frustumHeightAtZ = 2 * distToCursorZ * Math.tan(vFovRad / 2);
        const unitsPerPixel = frustumHeightAtZ / viewH;
        const repulsionRadiusWorld = MATTER_CONFIG.physics.repulsionRadius * unitsPerPixel;

        const dx = px - cursorX;
        const dy = py - cursorY;
        const distFromCursor = Math.hypot(dx, dy);

        if (distFromCursor < repulsionRadiusWorld && distFromCursor > 0.01) {
          // Quadratic physical push falloff: stronger closer to cursor center
          const normalizedDist = distFromCursor / repulsionRadiusWorld;
          const pushMagnitude =
            (1.0 - normalizedDist) * (1.0 - normalizedDist) * MATTER_CONFIG.physics.repulsionForce;

          const nx = dx / distFromCursor;
          const ny = dy / distFromCursor;

          pVelocities[idx] += nx * pushMagnitude;
          pVelocities[idx + 1] += ny * pushMagnitude;
          pVelocities[idx + 2] += (Math.random() - 0.5) * pushMagnitude * 0.4;

          // Watery wake: drag particles lightly along cursor velocity
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

      // Render through post-processing pipeline or fallback renderer
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      unsubInteraction();
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

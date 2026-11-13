import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { UniverseScene } from './UniverseScene';
import { RocketModel } from './RocketModel';
import { RocketEngineEffects } from './RocketEngineEffects';
import { LandingImpact } from './LandingImpact';
import { CameraShake } from './CameraShake';
import { RocketParticleMorph } from './RocketParticleMorph';
import { interactionEngine } from '../../../context/SingularityInteractionEngine';

export interface RocketFlightAnimationProps {
  onCenterImpact?: () => void;
  onBecomeCursor: () => void;
  onFinished: () => void;
  onWebGLError?: () => void;
  prefersReducedMotion: boolean;
}

/**
 * RocketFlightAnimation:
 * Full 5-Scene WebGL Three.js + GSAP Cinematic Sequence ("FROM THE UNIVERSE TO YOUR CURSOR"):
 * - Scene 01: Deep Space Universe (stars, blue/purple nebula, cosmic dust, slow camera push)
 * - Scene 02: Distant Bright Emergence -> 3D PBR Rocket reveals out of deep space
 * - Scene 03: Supersonic Flight Approach with Mach core exhaust, orange secondary fire, heat & banking
 * - Scene 04: Landing Leg Deployment, Retro-Burn Touchdown, Ground Impact, Dust Ring & Camera Shake
 * - Scene 05: Landed Rocket Dissolves into Thousands of Particles -> Miniature Cursor Morph
 */
export const RocketFlightAnimation: React.FC<RocketFlightAnimationProps> = ({
  onCenterImpact,
  onBecomeCursor,
  onFinished,
  onWebGLError,
  prefersReducedMotion,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onCenterImpactRef = useRef(onCenterImpact);
  const onBecomeCursorRef = useRef(onBecomeCursor);
  const onFinishedRef = useRef(onFinished);
  const onWebGLErrorRef = useRef(onWebGLError);

  useEffect(() => {
    onCenterImpactRef.current = onCenterImpact;
  }, [onCenterImpact]);

  useEffect(() => {
    onBecomeCursorRef.current = onBecomeCursor;
  }, [onBecomeCursor]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    onWebGLErrorRef.current = onWebGLError;
  }, [onWebGLError]);

  useEffect(() => {
    if (prefersReducedMotion) {
      onBecomeCursorRef.current();
      const t = window.setTimeout(() => onFinishedRef.current(), 120);
      return () => window.clearTimeout(t);
    }

    const container = mountRef.current;
    if (!container) return;

    // 1. Probe WebGL & Software WebGL Guard (SwiftShader / llvmpipe / headless)
    let isSoftwareGl = false;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) {
        onWebGLErrorRef.current?.();
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      onWebGLErrorRef.current?.();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const isTablet = vw >= 640 && vw < 1024;
    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2);

    // 2. Three.js Renderer, Camera & Studio Environment Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isSoftwareGl && !isMobile,
        alpha: true,
        stencil: false,
        depth: true,
      });
    } catch {
      onWebGLErrorRef.current?.();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(dpr);
    renderer.setSize(vw, vh);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.011);

    const baseFov = isMobile ? 54 : 44;
    const camera = new THREE.PerspectiveCamera(baseFov, vw / vh, 0.1, 220);
    const camBasePos = new THREE.Vector3(0, 0.25, 13.5);
    camera.position.copy(camBasePos);

    // Studio Reflection Environment (mandatory for crisp PBR metals & canopy glass)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3. Balanced Warm/Cool Three-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.6);
    keyLight.position.set(7, 10, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.9);
    rimLight.position.set(-7, 4, -8);
    scene.add(rimLight);

    // 4. Instantiate Modular Scenes & Subsystems (scaled responsively for device capability)
    const starCount = isMobile ? 700 : isTablet ? 1200 : 2000;
    const dustCount = isMobile ? 120 : isTablet ? 200 : 320;
    const trailCount = isMobile ? 160 : isTablet ? 240 : 340;
    const impactCount = isMobile ? 110 : isTablet ? 160 : 240;
    const morphCount = isMobile ? 900 : isTablet ? 1600 : 2600;

    const universe = new UniverseScene({ starCount, dustCount });
    scene.add(universe.group);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const rocketModel = new RocketModel(maxAniso, isSoftwareGl);
    const landedScale = isMobile ? 0.88 : isTablet ? 1.02 : 1.15;
    rocketModel.group.scale.setScalar(0.15);
    rocketModel.group.position.set(0, 0.2, -46);
    scene.add(rocketModel.group);

    const engineEffects = new RocketEngineEffects(trailCount);
    engineEffects.nozzleGroup.position.copy(rocketModel.nozzlePositionLocal);
    rocketModel.group.add(engineEffects.nozzleGroup);
    scene.add(engineEffects.worldGroup);

    const groundY = -1.65;
    const landingImpact = new LandingImpact(impactCount);
    landingImpact.group.position.set(0, groundY, 1.1);
    scene.add(landingImpact.group);

    const cameraShake = new CameraShake();

    const surfaceSamples = rocketModel.sampleSurfacePoints(morphCount);
    const particleMorph = new RocketParticleMorph(surfaceSamples);
    scene.add(particleMorph.points);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5. GSAP Master 5-Scene Animation State & Timeline
    const animState = {
      universeOpacity: 0,
      universeWarp: 0,
      camZ: 13.5,
      camY: 0.25,
      camFov: baseFov,
      rocketX: 0,
      rocketY: 0.25,
      rocketZ: -44,
      rocketScale: 0.16,
      rocketRotX: 0.28,
      rocketRotY: -0.65,
      rocketRotZ: -0.25,
      thrust: 0.3,
      gearDeploy: 0,
      bodyOpacity: 1,
      slideProgress: 0,
      morphProgress: 0,
    };

    let touchdownFired = false;
    let morphCaptured = false;
    let handoffFired = false;
    let finishFired = false;

    const tl = gsap.timeline({
      onComplete: () => {
        if (!handoffFired) {
          handoffFired = true;
          onBecomeCursorRef.current();
        }
        window.setTimeout(() => {
          if (!finishFired) {
            finishFired = true;
            onFinishedRef.current();
          }
        }, 320);
      },
    });

    // SCENE 01 (0.0 -> 0.95s): Deep Universe Awakens + Slow Forward Camera Push
    tl.to(
      animState,
      {
        universeOpacity: 1,
        camZ: 11.4,
        duration: 0.95,
        ease: 'power2.out',
      },
      0
    );

    // SCENE 02 (0.7 -> 2.05s): Distant Ignition Flash & Sweeping Aerospace Climb From Deep Space
    tl.to(
      animState,
      {
        universeWarp: 1,
        rocketX: isMobile ? -1.45 : -2.55,
        rocketY: -0.45,
        rocketZ: -8.5,
        rocketScale: 0.72,
        rocketRotX: 0.42,
        rocketRotY: 0.65,
        rocketRotZ: -0.58,
        thrust: 1.25,
        duration: 1.35,
        ease: 'power2.inOut',
      },
      0.7
    );

    // SCENE 03 (2.05 -> 3.35s): High-Speed Banking Flyby Across Sky -> Flip Over Landing Pad
    tl.to(
      animState,
      {
        rocketX: isMobile ? 1.35 : 2.35,
        rocketY: 1.95,
        rocketZ: 0.65,
        rocketScale: landedScale * 1.05,
        rocketRotX: 0.12,
        rocketRotY: 1.15,
        rocketRotZ: 0.44,
        camFov: baseFov + 5.5,
        thrust: 1.55,
        duration: 1.3,
        ease: 'power2.inOut',
      },
      2.05
    );

    // SCENE 04 (3.35 -> 4.65s): Retro-Propulsive Braking, Landing Gear Deploy, Center Touchdown & Impact
    const landedCenterY = groundY - rocketModel.baseFootLocalY * landedScale;
    tl.to(
      animState,
      {
        rocketX: 0,
        rocketY: landedCenterY + 1.55,
        rocketZ: 1.1,
        rocketScale: landedScale,
        rocketRotX: 0.03,
        rocketRotY: 0.08,
        rocketRotZ: 0,
        camFov: baseFov,
        camZ: 10.6,
        gearDeploy: 1,
        thrust: 1.75,
        duration: 0.78,
        ease: 'power2.out',
      },
      3.35
    );

    tl.to(
      animState,
      {
        rocketY: landedCenterY,
        rocketRotX: 0,
        rocketRotY: 0,
        thrust: 0.9,
        duration: 0.48,
        ease: 'power3.in',
        onComplete: () => {
          if (!touchdownFired) {
            touchdownFired = true;
            cameraShake.trigger(isMobile ? 0.16 : 0.26, 0.72);
            landingImpact.trigger(groundY, 1.1);
            onCenterImpactRef.current?.();
          }
        },
      },
      4.13
    );

    // Brief Landed Hero Hold + Retract Landing Legs Ready for Cursor Conversion (4.61 -> 5.15s)
    tl.to(
      animState,
      {
        thrust: 0.32,
        gearDeploy: 0,
        universeWarp: 0,
        duration: 0.54,
        ease: 'power2.inOut',
      },
      4.61
    );

    // SCENE 05 (5.15 -> 6.65s): Real Rocket Shrinks Small & Slides Smoothly Right Onto Cursor Position
    tl.to(
      animState,
      {
        slideProgress: 1,
        morphProgress: 1,
        universeOpacity: 0,
        thrust: 0.52,
        duration: 1.5,
        ease: 'power2.inOut',
        onStart: () => {
          if (!morphCaptured) {
            morphCaptured = true;
            particleMorph.captureLandedPose(rocketModel.group);
          }
        },
      },
      5.15
    );

    // 6. Responsive Resize & Pointer Tracking
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointer.y = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const curDpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, w < 640 ? 1.35 : 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(curDpr);
      renderer.setSize(w, h);
      universe.setPixelRatio(curDpr);
      engineEffects.setPixelRatio(curDpr);
      landingImpact.setPixelRatio(curDpr);
      particleMorph.setPixelRatio(curDpr);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // 7. Continuous Animation & Software-WebGL Pacing Loop
    let rafId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();
    const _ndcTarget = new THREE.Vector3();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(rafId);
      clearTimeout(rafId);
    };

    const handleContextRestored = () => {
      if (!isDisposed) {
        rafId = requestAnimationFrame(tick);
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        rafId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          rafId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          rafId = window.setTimeout(cb, 80);
        }
      };
      rafId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (isDisposed) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Advance impact camera shake & camera parallax
      cameraShake.update(delta);
      if (camera.fov !== animState.camFov) {
        camera.fov = animState.camFov;
        camera.updateProjectionMatrix();
      }
      camera.position.set(
        pointer.x * 0.22 + cameraShake.offset.x,
        animState.camY + pointer.y * 0.14 + cameraShake.offset.y,
        animState.camZ + cameraShake.offset.z
      );
      camera.rotation.set(
        cameraShake.rotX,
        -pointer.x * 0.025,
        cameraShake.rotZ
      );

      // Apply subtle supersonic fuselage vibration during fast flight
      const flightVibe =
        animState.slideProgress < 0.01 && animState.thrust > 0.6
          ? Math.sin(elapsed * 55) * 0.012 * animState.thrust
          : 0;

      // Compute exact world target & cursor scale when sliding to visitor's default cursor
      const slideP = animState.slideProgress;
      const curVw = window.innerWidth || 1;
      const curVh = window.innerHeight || 1;
      const eng = interactionEngine.state;
      const validPtr =
        !isMobile &&
        eng.clientX > 0 &&
        eng.clientY > 0 &&
        eng.clientX < curVw &&
        eng.clientY < curVh;
      const targetClientX = validPtr ? eng.clientX : curVw * 0.5;
      const targetClientY = validPtr ? eng.clientY : curVh * 0.5;

      let posX = animState.rocketX + flightVibe;
      let posY = animState.rocketY;
      let posZ = animState.rocketZ;
      let sc = animState.rocketScale;
      let rotX = animState.rocketRotX;
      let rotY = animState.rocketRotY;
      let rotZ = animState.rocketRotZ;
      let bodyAlpha = 1;

      if (slideP > 0.001) {
        const targetZ = 4.2;
        const ndcX = (targetClientX / curVw) * 2 - 1;
        const ndcY = -(targetClientY / curVh) * 2 + 1;
        _ndcTarget.set(ndcX, ndcY, 0.5).unproject(camera);
        const dir = _ndcTarget.sub(camera.position).normalize();
        const tPlane = (targetZ - camera.position.z) / dir.z;
        const tipWorldX = camera.position.x + dir.x * tPlane;
        const tipWorldY = camera.position.y + dir.y * tPlane;

        const distToPlane = Math.abs(camera.position.z - targetZ);
        const visibleHeightWorld =
          2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distToPlane;
        const worldPerPx = visibleHeightWorld / curVh;

        // Match ~38px length of RocketCursor (local height ~5.04 -> scale such that nose-to-nozzle ~ 38px)
        const targetCursorScale = Math.max(0.044, (38 * worldPerPx) / 5.04);
        const targetRotZ = THREE.MathUtils.degToRad(28); // Tilts nose upper-left (-28deg CSS) matching RocketCursor

        // Offset rocket center so its nose tip (local y = +2.62) rests precisely at (tipWorldX, tipWorldY)
        const centerOffsetWorld = 2.62 * targetCursorScale;
        const endCenterX = tipWorldX + Math.sin(targetRotZ) * centerOffsetWorld;
        const endCenterY = tipWorldY - Math.cos(targetRotZ) * centerOffsetWorld;

        // Smooth curved flight arc sliding right into pointer cursor
        const sCurve = slideP * slideP * (3 - 2 * slideP);
        const arcLiftY = Math.sin(slideP * Math.PI) * (isMobile ? 0.55 : 0.85);
        posX = THREE.MathUtils.lerp(0, endCenterX, sCurve);
        posY = THREE.MathUtils.lerp(landedCenterY, endCenterY, sCurve) + arcLiftY * (1 - sCurve * 0.65);
        posZ = THREE.MathUtils.lerp(1.1, targetZ, sCurve);

        // Shrink smoothly using exponential scale interpolation so visual shrinking speed feels uniform
        sc = landedScale * Math.pow(targetCursorScale / landedScale, sCurve);

        rotX = THREE.MathUtils.lerp(0, 0.08, sCurve);
        rotY = THREE.MathUtils.lerp(0, -0.25, sCurve);
        rotZ = THREE.MathUtils.lerp(0, targetRotZ, sCurve);

        // Crossfade smoothly over final 8% directly into crisp miniature RocketCursor
        bodyAlpha = slideP > 0.92 ? Math.max(0, 1 - (slideP - 0.92) / 0.08) : 1;

        if (!handoffFired && slideP >= 0.94) {
          handoffFired = true;
          onBecomeCursorRef.current();
        }
      }

      // Update PBR 3D RocketModel transforms, gear & opacity
      rocketModel.group.position.set(posX, posY, posZ);
      rocketModel.group.scale.setScalar(sc);
      rocketModel.group.rotation.set(rotX, rotY, rotZ);
      rocketModel.setLandingGearDeploy(animState.gearDeploy);
      rocketModel.setEngineGlow(0.25 + animState.thrust * 0.65);
      rocketModel.setBodyOpacity(bodyAlpha);
      rocketModel.group.visible = bodyAlpha > 0.01;

      // Update deep-space universe, rocket plume, ground impact & subtle orbital wake
      universe.update(
        elapsed,
        animState.universeOpacity,
        animState.universeWarp,
        pointer.x,
        pointer.y
      );

      engineEffects.update(
        elapsed,
        delta,
        animState.thrust * (1 - slideP * 0.65),
        rocketModel.group,
        rocketModel.nozzlePositionLocal
      );

      if (!touchdownFired && animState.rocketZ > -3) {
        const proximity = Math.max(0, 1 - Math.abs(animState.rocketY - landedCenterY) / 3.5);
        landingImpact.setHoverIllumination(groundY, proximity * animState.thrust);
      }
      landingImpact.update(delta);

      if (animState.morphProgress > 0.001) {
        // Gentle subtle energy trail accompanying the shrinking rocket rather than obscuring it
        particleMorph.update(
          animState.morphProgress,
          elapsed,
          targetClientX,
          targetClientY,
          camera
        );
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      tl.kill();
      cancelAnimationFrame(rafId);
      clearTimeout(rafId);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      universe.dispose();
      rocketModel.dispose();
      engineEffects.dispose();
      landingImpact.dispose();
      particleMorph.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[7] overflow-hidden"
    />
  );
};

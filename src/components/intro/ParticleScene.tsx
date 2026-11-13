import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AtmosphericDust } from './AtmosphericDust';
import { SandParticleSystem, DeviceTier } from './SandParticleSystem';

interface ParticleSceneProps {
  timelineSecRef: React.RefObject<number>;
  isExitingRef: React.RefObject<boolean>;
  exitProgressRef: React.RefObject<number>;
  isHoveringEnterRef: React.RefObject<boolean>;
  prefersReducedMotion: boolean;
  onWebGLError: () => void;
}

const resolveDeviceTier = (width: number): DeviceTier => {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const ParticleScene: React.FC<ParticleSceneProps> = ({
  timelineSecRef,
  isExitingRef,
  exitProgressRef,
  isHoveringEnterRef,
  prefersReducedMotion,
  onWebGLError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl =
        probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) {
        onWebGLError();
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
        gpu
      );
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      onWebGLError();
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    let deviceTier = resolveDeviceTier(width);
    const maxDpr = deviceTier === 'mobile' ? 1.5 : 2;
    let dpr = isSoftwareGl
      ? 1
      : Math.min(window.devicePixelRatio || 1, maxDpr);

    const scene = new THREE.Scene();

    const camZ = deviceTier === 'mobile' ? 8.2 : deviceTier === 'tablet' ? 7.4 : 6.8;
    const camera = new THREE.PerspectiveCamera(42, width / Math.max(height, 1), 0.1, 60);
    camera.position.set(0, 0, camZ);

    const computeVisibleWorld = (cam: THREE.PerspectiveCamera) => {
      const vFovRad = THREE.MathUtils.degToRad(cam.fov);
      const visibleH = 2 * Math.tan(vFovRad * 0.5) * cam.position.z;
      const visibleW = visibleH * cam.aspect;
      return { visibleW, visibleH };
    };

    let { visibleW, visibleH } = computeVisibleWorld(camera);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isSoftwareGl && deviceTier !== 'mobile',
        alpha: true,
        stencil: false,
        depth: false,
      });
    } catch {
      onWebGLError();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const atmosphericDust = new AtmosphericDust(deviceTier, dpr);
    scene.add(atmosphericDust.group);

    const sandSystem = new SandParticleSystem(deviceTier, dpr, visibleW, visibleH);
    scene.add(sandSystem.points);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Re-sample typography clouds once Cormorant Garamond is loaded cleanly
    let isDisposed = false;
    const syncFonts = async () => {
      try {
        if (document.fonts?.load) {
          await Promise.race([
            document.fonts.load('400 96px "Cormorant Garamond"'),
            new Promise((r) => setTimeout(r, 900)),
          ]);
        } else if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Proceed cleanly with current fallback serif
      }
      if (isDisposed) return;
      const dims = computeVisibleWorld(camera);
      sandSystem.rebuildTargets(dims.visibleW, dims.visibleH, deviceTier);
      if (prefersReducedMotion) {
        sandSystem.snapToFinalComposition();
        renderer.render(scene, camera);
      }
    };
    void syncFonts();

    if (prefersReducedMotion) {
      sandSystem.snapToFinalComposition();
      atmosphericDust.update(0, 9.0, 0, 0, 0, 0);
      renderer.render(scene, camera);
    }

    // Smooth mouse & touch pointer state (zero GC allocations)
    const pointer = {
      ndcX: 0,
      ndcY: 0,
      targetNdcX: 0,
      targetNdcY: 0,
      worldX: 0,
      worldY: 0,
      prevWorldX: 0,
      prevWorldY: 0,
      speed: 0,
      active: false,
      lastMoveAt: 0,
    };

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pointer.targetNdcX = (clientX / w) * 2 - 1;
      pointer.targetNdcY = -(clientY / h) * 2 + 1;
      pointer.active = true;
      pointer.lastMoveAt = performance.now();
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointerFromClient(e.clientX, e.clientY);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      pointer.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    let resizeTimer = 0;
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;

      deviceTier = resolveDeviceTier(w);
      dpr = isSoftwareGl
        ? 1
        : Math.min(window.devicePixelRatio || 1, deviceTier === 'mobile' ? 1.5 : 2);

      camera.aspect = w / h;
      camera.position.z =
        deviceTier === 'mobile' ? 8.2 : deviceTier === 'tablet' ? 7.4 : 6.8;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);
      sandSystem.setPixelRatio(dpr);
      atmosphericDust.setPixelRatio(dpr);

      const dims = computeVisibleWorld(camera);
      visibleW = dims.visibleW;
      visibleH = dims.visibleH;

      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (isDisposed) return;
        sandSystem.rebuildTargets(visibleW, visibleH, deviceTier);
        if (prefersReducedMotion) {
          sandSystem.snapToFinalComposition();
          renderer.render(scene, camera);
        }
      }, 90);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    let animId = 0;
    let windAccum = 0;
    const clock = new THREE.Clock();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animId);
      clearTimeout(animId);
    };

    const handleContextRestored = () => {
      renderer.setSize(
        container.clientWidth || window.innerWidth,
        container.clientHeight || window.innerHeight
      );
      if (!isDisposed && !prefersReducedMotion) {
        animId = requestAnimationFrame(animate);
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        animId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          animId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          animId = window.setTimeout(cb, 80);
        }
      };
      animId = window.setTimeout(poll, 5);
    };

    const animate = () => {
      if (isDisposed) return;

      const delta = Math.min(clock.getDelta(), 0.045);
      const elapsed = clock.getElapsedTime();
      const timelineSec = timelineSecRef.current;
      const exitProg = exitProgressRef.current;

      // Damped mouse tracking
      pointer.ndcX = THREE.MathUtils.damp(pointer.ndcX, pointer.targetNdcX, 7.5, delta);
      pointer.ndcY = THREE.MathUtils.damp(pointer.ndcY, pointer.targetNdcY, 7.5, delta);

      pointer.worldX = pointer.ndcX * (visibleW * 0.5);
      pointer.worldY = pointer.ndcY * (visibleH * 0.5);

      const dx = pointer.worldX - pointer.prevWorldX;
      const dy = pointer.worldY - pointer.prevWorldY;
      const instSpeed = Math.sqrt(dx * dx + dy * dy) / Math.max(delta, 0.008);
      pointer.speed = THREE.MathUtils.damp(pointer.speed, Math.min(instSpeed, 8), 8.0, delta);
      pointer.prevWorldX = pointer.worldX;
      pointer.prevWorldY = pointer.worldY;

      // Gently decay pointer idle disturbance after 1.4s of stillness
      const isRecentlyMoved =
        pointer.active && performance.now() - pointer.lastMoveAt < 1400;

      // Subtle atmospheric wind accumulation ramping up in Scene 01
      const windSpeedFactor =
        0.12 + 0.35 * THREE.MathUtils.smoothstep(timelineSec, 0.75, 2.5);
      windAccum += delta * windSpeedFactor;

      // Subtle camera micro-parallax & gentle breathing forward push during Scene 01->05
      const baseCamZ =
        deviceTier === 'mobile' ? 8.2 : deviceTier === 'tablet' ? 7.4 : 6.8;
      const targetCamX = pointer.ndcX * 0.14;
      const targetCamY = pointer.ndcY * 0.09;
      const targetCamZ =
        baseCamZ -
        THREE.MathUtils.smoothstep(timelineSec, 0.5, 9.5) * 0.25 -
        (isExitingRef.current ? exitProg * 1.1 : 0);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.5, delta);
      camera.lookAt(0, 0, 0);

      sandSystem.setEnterButtonHover(isHoveringEnterRef.current, delta);

      if (!prefersReducedMotion) {
        sandSystem.update(
          elapsed,
          delta,
          timelineSec,
          pointer.worldX,
          pointer.worldY,
          pointer.speed,
          isRecentlyMoved,
          exitProg
        );
      }

      atmosphericDust.update(
        elapsed,
        timelineSec,
        windAccum,
        pointer.ndcX,
        pointer.ndcY,
        exitProg
      );

      renderer.render(scene, camera);

      if (prefersReducedMotion && !isExitingRef.current) {
        return;
      }

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animId = requestAnimationFrame(animate);
      }
    };

    if (!prefersReducedMotion) {
      animId = requestAnimationFrame(animate);
    }

    return () => {
      isDisposed = true;
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
      clearTimeout(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      sandSystem.dispose();
      atmosphericDust.dispose();
      renderer.dispose();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [
    timelineSecRef,
    isExitingRef,
    exitProgressRef,
    isHoveringEnterRef,
    prefersReducedMotion,
    onWebGLError,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-[3] overflow-hidden"
    />
  );
};

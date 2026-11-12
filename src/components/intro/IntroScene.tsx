import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleField } from './ParticleField';

interface IntroSceneProps {
  elapsedTimeRef: React.RefObject<number>;
  scrollProgressRef: React.RefObject<number>;
  isTransitioningRef: React.RefObject<boolean>;
  onWebGLError: () => void;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  elapsedTimeRef,
  scrollProgressRef,
  isTransitioningRef,
  onWebGLError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) {
        onWebGLError();
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      onWebGLError();
      return;
    }

    const isMobile = window.innerWidth < 768;
    const dpr = isSoftwareGl
      ? 1
      : Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.036);

    const baseZ = isMobile ? 8.0 : 6.7;
    const startZ = isMobile ? 10.2 : 8.8;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, startZ);

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
      onWebGLError();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const particleField = new ParticleField(isMobile);
    scene.add(particleField.points);
    particleField.setTargetOpacity(0.5);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let animId = 0;
    let isDisposed = false;
    let currentCamZ = startZ;
    const clock = new THREE.Clock();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animId);
      clearTimeout(animId);
    };

    const handleContextRestored = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (!isDisposed) {
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

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      const t = elapsedTimeRef.current;
      const scrollP = scrollProgressRef.current;
      const isTrans = isTransitioningRef.current;

      mouseRef.current.x = THREE.MathUtils.damp(mouseRef.current.x, mouseRef.current.targetX, 4.5, delta);
      mouseRef.current.y = THREE.MathUtils.damp(mouseRef.current.y, mouseRef.current.targetY, 4.5, delta);

      if (!isTrans) {
        const p = THREE.MathUtils.clamp(t / 2.2, 0, 1);
        const ease = 1 - Math.pow(1 - p, 3);

        const targetCamZ = (startZ - ease * (startZ - baseZ)) - scrollP * 1.25;
        const targetParticleOpacity = 0.45 + ease * 0.25 + scrollP * 0.22;

        currentCamZ = THREE.MathUtils.damp(currentCamZ, targetCamZ, 4.2, delta);
        particleField.setTargetOpacity(targetParticleOpacity);

        const targetFov = 45 + scrollP * 7;
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.0, delta);
        camera.updateProjectionMatrix();

        const targetCamX = mouseRef.current.x * 0.3;
        const targetCamY = mouseRef.current.y * 0.22;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4.2, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4.2, delta);
        camera.position.z = currentCamZ;

        camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, -mouseRef.current.x * 0.03, 4.5, delta);
        camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, mouseRef.current.y * 0.022, 4.5, delta);
      } else {
        // Slowly dim the ambient particle light before and during the screen flip
        particleField.setTargetOpacity(0.04);
      }

      particleField.update(
        time,
        delta,
        mouseRef.current.x,
        mouseRef.current.y,
        isTrans
      );

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      clearTimeout(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      particleField.dispose();
      renderer.dispose();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [elapsedTimeRef, scrollProgressRef, isTransitioningRef, onWebGLError]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[2] overflow-hidden"
    />
  );
};

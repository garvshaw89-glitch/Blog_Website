import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DigitalCore } from './DigitalCore';
import { ParticleField } from './ParticleField';

interface IntroSceneProps {
  elapsedTime: number;
  isTransitioning: boolean;
  onWebGLError: () => void;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  elapsedTime,
  isTransitioning,
  onWebGLError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const digitalCoreRef = useRef<DigitalCore | null>(null);
  const particleFieldRef = useRef<ParticleField | null>(null);
  const isTransitioningRef = useRef(isTransitioning);
  const elapsedTimeRef = useRef(elapsedTime);

  // Keep refs in sync for the animation loop
  isTransitioningRef.current = isTransitioning;
  elapsedTimeRef.current = elapsedTime;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const checkWebGL = () => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      onWebGLError();
      return;
    }

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : isTablet ? 1.4 : 1.6);

    // 1. Three.js Scene with deep luxury atmosphere fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.045);

    // 2. Camera Setup (Perspective camera with luxury cinematic framing)
    const baseZ = isMobile ? 7.8 : 6.2;
    const startZ = isMobile ? 12.0 : 10.8;

    const camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, startZ);

    // 3. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isMobile,
        alpha: true,
        stencil: false,
        depth: true,
      });
    } catch {
      onWebGLError();
      return;
    }

    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 4. Lighting Rig
    // A: Low-intensity environment ambient light
    const ambientLight = new THREE.AmbientLight(0x0e1118, 0.1);
    scene.add(ambientLight);

    // B: Soft key light (warm champagne tone)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 0.05);
    keyLight.position.set(3.8, 5.2, 4.0);
    scene.add(keyLight);

    // C: Subtle rim light (cool titanium highlight)
    const rimLight = new THREE.DirectionalLight(0xa5b4fc, 0.05);
    rimLight.position.set(-4.2, -2.8, -3.2);
    scene.add(rimLight);

    // D: Delicate glint accent light from top-rear
    const accentLight = new THREE.DirectionalLight(0x7dd3fc, 0.05);
    accentLight.position.set(0, 3.5, -2.5);
    scene.add(accentLight);

    // 5. Digital Core & Ambient Particle Field
    const digitalCore = new DigitalCore();
    digitalCoreRef.current = digitalCore;
    scene.add(digitalCore.group);

    const particleField = new ParticleField(isMobile);
    particleFieldRef.current = particleField;
    scene.add(particleField.points);
    particleField.setOpacity(0);

    // 6. Smooth Mouse Parallax Tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 8. Animation & Timeline Progression Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      const t = elapsedTimeRef.current;
      const isTrans = isTransitioningRef.current;

      // Mouse smoothing interpolation (damped luxury lerp)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.045;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.045;

      // ----------------------------------------------------
      // CINEMATIC TIMELINE LIGHTING & CAMERA PROGRESSION
      // ----------------------------------------------------
      if (!isTrans) {
        if (t < 1.5) {
          // Stage 1 (0 – 1.5s): Deep darkness, faint silhouette, subtle ambient glow
          const p = Math.max(0, (t - 0.2) / 1.3);
          ambientLight.intensity = 0.1 + p * 0.1;
          keyLight.intensity = 0.05 + p * 0.35;
          rimLight.intensity = 0.05 + p * 0.25;
          accentLight.intensity = 0.02 + p * 0.15;
          camera.position.z = startZ - p * 0.8;
          particleField.setOpacity(0);
        } else if (t < 3.5) {
          // Stage 2 (1.5 – 3.5s): Key light & rim light slowly increase, camera glides forward
          const p = (t - 1.5) / 2.0;
          // Smooth cosine easing for luxury reveal
          const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);

          ambientLight.intensity = 0.2 + ease * 0.25;
          keyLight.intensity = 0.4 + ease * 1.35;
          rimLight.intensity = 0.3 + ease * 0.95;
          accentLight.intensity = 0.17 + ease * 0.45;

          const currentStartZ = startZ - 0.8;
          camera.position.z = currentStartZ - ease * (currentStartZ - baseZ);
          particleField.setOpacity(ease * 0.35);
        } else if (t < 5.0) {
          // Stage 3 (3.5 – 5.0s): Typography reveals, particle field gently fades into view
          const p = (t - 3.5) / 1.5;
          ambientLight.intensity = 0.45;
          keyLight.intensity = 1.75;
          rimLight.intensity = 1.25;
          accentLight.intensity = 0.62;
          camera.position.z = baseZ;
          particleField.setOpacity(0.35 + p * 0.4);
        } else {
          // Stage 4 (5.0s onward): Interactive idle state, calibrated luxury lighting
          ambientLight.intensity = 0.45;
          keyLight.intensity = 1.75;
          rimLight.intensity = 1.25;
          accentLight.intensity = 0.62;
          camera.position.z = baseZ;
          particleField.setOpacity(0.75);
        }

        // Camera subtle mouse parallax
        const targetCamX = mouseRef.current.x * 0.35;
        const targetCamY = mouseRef.current.y * 0.25;
        camera.position.x += (targetCamX - camera.position.x) * 0.04;
        camera.position.y += (targetCamY - camera.position.y) * 0.04;
        camera.rotation.y = -mouseRef.current.x * 0.035;
        camera.rotation.x = mouseRef.current.y * 0.025;
      } else {
        // Portal Transition: Rapid forward rush into the core
        camera.position.z = Math.max(0.4, camera.position.z - delta * 15.0);
        keyLight.intensity += delta * 6.0;
        rimLight.intensity += delta * 4.0;
      }

      // Update 3D systems
      digitalCore.update(
        time,
        delta,
        mouseRef.current.x,
        mouseRef.current.y,
        isTrans
      );
      particleField.update(
        time,
        mouseRef.current.x,
        mouseRef.current.y,
        isTrans
      );

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      digitalCore.dispose();
      particleField.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onWebGLError]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};

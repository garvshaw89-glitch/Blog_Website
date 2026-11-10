import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LiquidChromeCore } from './LiquidChromeCore';
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
  const liquidChromeRef = useRef<LiquidChromeCore | null>(null);
  const particleFieldRef = useRef<ParticleField | null>(null);
  const isTransitioningRef = useRef(isTransitioning);
  const elapsedTimeRef = useRef(elapsedTime);

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
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : isTablet ? 1.3 : 1.5);

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.038);

    // 2. Camera Setup
    const baseZ = isMobile ? 8.2 : 6.8;
    const startZ = isMobile ? 12.0 : 10.2;

    const camera = new THREE.PerspectiveCamera(
      45,
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
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 4. Lighting Rig tailored for Liquid Mercury
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x080c14, 0.2);
    scene.add(ambientLight);

    // Cool Key Light
    const keyLight = new THREE.DirectionalLight(0xf8fafc, 0.2);
    keyLight.position.set(5.0, 6.0, 5.0);
    scene.add(keyLight);

    // Electric Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.2);
    rimLight.position.set(-5.5, -3.0, -4.0);
    scene.add(rimLight);

    // Top Specular Accent
    const accentLight = new THREE.DirectionalLight(0xe0f2fe, 0.1);
    accentLight.position.set(0, 5.0, -2.5);
    scene.add(accentLight);

    // 5. 3D Systems
    const liquidChrome = new LiquidChromeCore();
    liquidChromeRef.current = liquidChrome;
    scene.add(liquidChrome.group);

    const particleField = new ParticleField(isMobile);
    particleFieldRef.current = particleField;
    scene.add(particleField.points);
    particleField.setOpacity(0.35);

    // 6. Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Resize Handling
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 8. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      const t = elapsedTimeRef.current;
      const isTrans = isTransitioningRef.current;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.045;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.045;

      // Camera & Lighting timeline progression
      if (!isTrans) {
        if (t < 2.8) {
          // Scene 01: Typography takeover
          ambientLight.intensity = 0.15;
          keyLight.intensity = 0.2;
          rimLight.intensity = 0.2;
          accentLight.intensity = 0.1;
          camera.position.z = startZ;
          particleField.setOpacity(0.4);
        } else if (t < 5.8) {
          // Scene 02: Transformation into Liquid Chrome
          const p = (t - 2.8) / 3.0;
          const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);
          ambientLight.intensity = 0.2 + ease * 0.35;
          keyLight.intensity = 0.3 + ease * 2.2;
          rimLight.intensity = 0.25 + ease * 1.8;
          accentLight.intensity = 0.15 + ease * 0.8;
          camera.position.z = startZ - ease * (startZ - baseZ);
          particleField.setOpacity(0.5 + ease * 0.3);
        } else if (t < 8.8) {
          // Scene 03: Identity composition
          ambientLight.intensity = 0.55;
          keyLight.intensity = 2.4;
          rimLight.intensity = 1.9;
          accentLight.intensity = 0.95;
          camera.position.z = baseZ;
          particleField.setOpacity(0.75);

          // Subtle right-hand offset for asymmetric balance matching editorial text on left
          if (!isMobile) {
            liquidChrome.group.position.x = 0.8;
          }
        } else {
          // Scene 04: Enter stage
          ambientLight.intensity = 0.6;
          keyLight.intensity = 2.5;
          rimLight.intensity = 2.0;
          accentLight.intensity = 1.0;
          camera.position.z = baseZ;
          particleField.setOpacity(0.8);
          if (!isMobile) {
            liquidChrome.group.position.x = 0.6;
          }
        }

        // Camera Parallax
        const targetCamX = mouseRef.current.x * 0.3;
        const targetCamY = mouseRef.current.y * 0.2;
        camera.position.x += (targetCamX - camera.position.x) * 0.04;
        camera.position.y += (targetCamY - camera.position.y) * 0.04;
        camera.rotation.y = -mouseRef.current.x * 0.03;
        camera.rotation.x = mouseRef.current.y * 0.02;
      } else {
        // Scene 05: Transition
        camera.position.z = Math.max(0.4, camera.position.z - delta * 16.0);
        keyLight.intensity += delta * 8.0;
        rimLight.intensity += delta * 6.0;
      }

      // Update liquid chrome sculpture & particles
      liquidChrome.update(
        time,
        delta,
        t,
        mouseRef.current.x,
        mouseRef.current.y,
        isTrans
      );
      particleField.update(
        time,
        delta,
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

      liquidChrome.dispose();
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

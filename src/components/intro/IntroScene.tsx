import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { IntroStageId } from './types';
import { CinematicParticleSystem } from './CinematicParticleSystem';
import { MetropolisWireframe } from './MetropolisWireframe';
import { CrossedOrbitalRings } from './CrossedOrbitalRings';

interface IntroSceneProps {
  currentStage: IntroStageId;
  elapsedTime: number;
  isTransitioning: boolean;
  onWebGLError: () => void;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  currentStage,
  elapsedTime,
  isTransitioning,
  onWebGLError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const particleSysRef = useRef<CinematicParticleSystem | null>(null);
  const metropolisRef = useRef<MetropolisWireframe | null>(null);
  const ringsRef = useRef<CrossedOrbitalRings | null>(null);

  // When stage changes, update particle targets and wireframes
  useEffect(() => {
    if (particleSysRef.current) {
      particleSysRef.current.setStage(currentStage, performance.now() / 1000);
    }

    if (metropolisRef.current) {
      metropolisRef.current.setVisibleTarget(currentStage === 'METROPOLIS');
    }

    if (ringsRef.current) {
      ringsRef.current.setVisibleTarget(currentStage === 'QUANTUM_ORB');
    }
  }, [currentStage]);

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
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : isTablet ? 1.4 : 1.75);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.045);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 0, 8.5);

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
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0c0f17, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    keyLight.position.set(4.0, 6.0, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    rimLight.position.set(-4.0, -2.0, -3.0);
    scene.add(rimLight);

    // 3. 3D Elements
    const particleSystem = new CinematicParticleSystem(isMobile);
    particleSysRef.current = particleSystem;
    scene.add(particleSystem.points);

    const metropolis = new MetropolisWireframe();
    metropolisRef.current = metropolis;
    scene.add(metropolis.group);

    const rings = new CrossedOrbitalRings();
    ringsRef.current = rings;
    scene.add(rings.group);

    // Initial stage setup
    particleSystem.setStage(currentStage, 0);
    metropolis.setVisibleTarget(currentStage === 'METROPOLIS');
    rings.setVisibleTarget(currentStage === 'QUANTUM_ORB');

    // 4. Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. Window Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 6. Camera Targets per Stage
    const stageCameraMap: Record<IntroStageId, { y: number; z: number; rx: number }> = {
      VOID: { y: 0, z: 8.5, rx: 0 },
      TERRAIN: { y: 1.6, z: 8.8, rx: -0.15 },
      METROPOLIS: { y: 1.2, z: 7.2, rx: -0.08 },
      QUANTUM_ORB: { y: 0, z: 6.2, rx: 0 },
      PORTAL: { y: 0, z: 0.6, rx: 0 },
    };

    // 7. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Smooth camera interpolation based on stage
      const targetCam = stageCameraMap[currentStage] || stageCameraMap.VOID;
      const camLerp = isTransitioning ? 0.09 : 0.045;

      camera.position.y += (targetCam.y + mouseRef.current.y * 0.25 - camera.position.y) * camLerp;
      camera.position.z += (targetCam.z - camera.position.z) * camLerp;
      camera.position.x += (mouseRef.current.x * 0.35 - camera.position.x) * camLerp;

      camera.rotation.y = -mouseRef.current.x * 0.04;
      camera.rotation.x += (targetCam.rx + mouseRef.current.y * 0.03 - camera.rotation.x) * camLerp;

      // Lighting modulation
      if (currentStage === 'METROPOLIS') {
        keyLight.color.setHex(0xfbbf24); // Warm gold
        rimLight.color.setHex(0x67e8f9); // Cyan runway glow
      } else if (currentStage === 'QUANTUM_ORB') {
        keyLight.color.setHex(0xc084fc); // Radiant violet
        rimLight.color.setHex(0x38bdf8); // Sky blue
      } else {
        keyLight.color.setHex(0xfff5ea);
        rimLight.color.setHex(0x7dd3fc);
      }

      // Update 3D systems
      particleSystem.update(
        time,
        delta,
        currentStage,
        mouseRef.current.x,
        mouseRef.current.y,
        isTransitioning
      );
      metropolis.update(time, delta, isTransitioning);
      rings.update(time, delta, isTransitioning);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      particleSystem.dispose();
      metropolis.dispose();
      rings.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onWebGLError, isTransitioning]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rocket3DModel } from './Rocket3DModel';
import { LandingPlatform3D } from './LandingPlatform3D';
import { RocketPhysicsSimulator } from './RocketPhysicsSimulator';
import { CameraPhysics } from './CameraPhysics';
import { CinematicFlightState, ProjectedRocketTelemetry } from './types';
import { FlightTelemetry } from './FlightTelemetry';
import { Play, Pause, RotateCcw, Rocket } from 'lucide-react';

/**
 * CINEMATIC ROCKET UNIVERSE
 * 
 * Signature Experience:
 * REALISTIC 3D ROCKET LAUNCH + PHYSICAL FLIGHT DYNAMICS + CINEMATIC CAMERA CHOREOGRAPHY
 * + SCREEN BREAKTHROUGH FLY-BY + TOUCHDOWN SETTLING (Clean, particle-free environment)
 */
export const CinematicRocketUniverse: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // HUD & Telemetry State
  const [flightState, setFlightState] = useState<CinematicFlightState>('IDLE');
  const [projectedTelemetry, setProjectedTelemetry] = useState<ProjectedRocketTelemetry | null>(null);
  const [telemetry, setTelemetry] = useState({
    phaseLabel: '01 / 04 // STANDBY & IGNITION',
    mach: '0.0',
    thrustPercent: 0,
    altitude: 'PAD 39A',
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);

  // References for render loop
  const autoPlayRef = useRef(false);
  autoPlayRef.current = isAutoPlaying;

  const autoProgressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect mobile device & reduced motion
    const isMobile = window.innerWidth < 768;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener('change', onMotionChange);

    // ==========================================
    // 1. THREE.JS SCENE SETUP
    // ==========================================
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050608, 0.0075);

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 450);
    camera.position.set(0, -12, 16);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x050608, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // ==========================================
    // 2. CINEMATIC LIGHTING
    // ==========================================
    // Soft atmospheric ambient light
    const ambientLight = new THREE.AmbientLight(0x404856, 1.2);
    scene.add(ambientLight);

    // Primary directional key light (Sun/Sky illumination)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.8);
    keyLight.position.set(24, 38, 22);
    scene.add(keyLight);

    // Cool fill light from space horizon
    const fillLight = new THREE.DirectionalLight(0x64748b, 1.4);
    fillLight.position.set(-20, -10, -25);
    scene.add(fillLight);

    // Subtle blue rim light from nadir
    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.9);
    rimLight.position.set(0, -30, 15);
    scene.add(rimLight);

    // ==========================================
    // 3. SUBSYSTEMS INSTANTIATION
    // ==========================================
    const platform = new LandingPlatform3D();
    platform.group.position.set(0, -18, -12);
    scene.add(platform.group);

    const rocket = new Rocket3DModel();
    scene.add(rocket.group);

    const physicsSim = new RocketPhysicsSimulator();
    const cameraPhysics = new CameraPhysics();

    // ==========================================
    // 4. INTERACTION & SCROLL TIMELINE
    // ==========================================
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;
    let lastScrollY = window.scrollY || 0;
    let scrollVelocity = 0;

    const mousePos = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      mousePos.targetX = (clientX / window.innerWidth) * 2 - 1;
      mousePos.targetY = -(clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    const onScroll = () => {
      if (autoPlayRef.current) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetScrollProgress = THREE.MathUtils.clamp(scrollY / maxScroll, 0, 1);

      scrollVelocity = (scrollY - lastScrollY) * 0.05;
      lastScrollY = scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Page visibility handling
    let isVisible = !document.hidden;
    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Custom event to trigger cinematic flyover sequence on demand
    const onTriggerCinematic = () => {
      autoProgressRef.current = 0.08;
      setIsAutoPlaying(true);
    };
    window.addEventListener('trigger-rocket-cinematic', onTriggerCinematic);

    // ==========================================
    // 5. MASTER RENDER LOOP
    // ==========================================
    let animId: number;
    let lastTime = performance.now();
    let totalTime = 0;
    let telemetryThrottle = 0;

    const prevRocketPos = new THREE.Vector3();
    const rocketVel = new THREE.Vector3();
    const projCoreVec = new THREE.Vector3();
    const projNoseVec = new THREE.Vector3();
    const projEngineVec = new THREE.Vector3();
    const rocketForwardVec = new THREE.Vector3();
    let prevLandingImpact = 0;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) * 0.001, 0.064);
      lastTime = now;
      totalTime += dt;

      // Mouse smooth interpolation
      mousePos.x += (mousePos.targetX - mousePos.x) * 0.05;
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.05;

      // Decay scroll velocity
      scrollVelocity *= 0.92;

      // Determine timeline progress:
      // Either driven by auto-play or synchronized with scroll position
      let progress = 0;
      if (autoPlayRef.current) {
        autoProgressRef.current = (autoProgressRef.current + dt * 0.038) % 1.0;
        progress = autoProgressRef.current;
        currentScrollProgress = progress;
      } else {
        currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.06;
        progress = currentScrollProgress;
      }

      // Sample physical motion from RocketPhysicsSimulator (Sections 01-11)
      const flight = physicsSim.evaluate(progress, scrollVelocity, totalTime);

      // Rocket velocity vector
      rocketVel.copy(flight.rocketPos).sub(prevRocketPos).divideScalar(Math.max(dt, 0.001));
      prevRocketPos.copy(flight.rocketPos);

      // Update Rocket Model
      rocket.group.position.copy(flight.rocketPos);
      rocket.group.rotation.copy(flight.rocketRot);

      // Vibration before liftoff
      const vibStrength = (flight.state === 'IGNITION' ? 0.08 : 0.0) * (prefersReducedMotion ? 0.2 : 1.0);
      rocket.setThrust(flight.engineThrust, flight.engineFlameLength, vibStrength);

      // Deploy landing legs during descent and landing
      const legDeployProgress = flight.state === 'DESCENT' ? flight.stateProgress : flight.state === 'LANDING' || flight.state === 'IMPACT' ? 1.0 : 0.0;
      rocket.setLandingLegs(legDeployProgress);

      rocket.update(totalTime);

      // Update Landing Platform
      platform.update(totalTime);

      // Landing touchdown camera impulse
      if (flight.landingImpact > 0.05 && prevLandingImpact <= 0.05) {
        cameraPhysics.addImpulse(flight.landingImpact * 0.45);
      }
      prevLandingImpact = flight.landingImpact;

      // 5. Physics-Based Camera Update (Sections 29, 44: Inertia, Spring-Damper & Impulse Shake)
      camera.fov = flight.cameraFov;
      camera.updateProjectionMatrix();

      const camUpdate = cameraPhysics.update(
        dt,
        flight.cameraPos,
        flight.cameraLookAt,
        mousePos,
        prefersReducedMotion ? 0 : flight.screenShake,
        prefersReducedMotion
      );

      camera.position.copy(camUpdate.position);
      camera.lookAt(camUpdate.lookAt);

      renderer.render(scene, camera);

      // Throttle React state updates to ~30fps for smooth marker tracking
      telemetryThrottle += dt;
      if (telemetryThrottle > 0.033) {
        telemetryThrottle = 0;
        setFlightState(flight.state);

        // Project 3D points on rocket hull into 2D viewport coordinates
        rocketForwardVec.set(0, 1, 0).applyEuler(flight.rocketRot).normalize();

        projCoreVec.copy(flight.rocketPos).project(camera);
        projNoseVec.copy(flight.rocketPos).addScaledVector(rocketForwardVec, 3.8).project(camera);
        projEngineVec.copy(flight.rocketPos).addScaledVector(rocketForwardVec, -4.8).project(camera);

        const screenX = (projCoreVec.x * 0.5 + 0.5) * width;
        const screenY = (-(projCoreVec.y * 0.5) + 0.5) * height;
        const noseX = (projNoseVec.x * 0.5 + 0.5) * width;
        const noseY = (-(projNoseVec.y * 0.5) + 0.5) * height;
        const engineX = (projEngineVec.x * 0.5 + 0.5) * width;
        const engineY = (-(projEngineVec.y * 0.5) + 0.5) * height;

        const inFront = projCoreVec.z < 1.0 && projCoreVec.z > -1.0;
        const visible = inFront && screenX >= -80 && screenX <= width + 80 && screenY >= -80 && screenY <= height + 80;

        let hudOpacity = 1.0;
        if (flight.state === 'FLYBY') {
          hudOpacity = 0.25; // Subtle fade so screen breakthrough silhouette is dramatic
        } else if (flight.state === 'IDLE' && progress < 0.03) {
          hudOpacity = 0.85;
        }

        let altitudeMeters = 0;
        let altitudeFormatted = '0.0 M [PAD 39A]';
        let velocityMach = 0;
        let velocityMs = 0;
        let dynamicPressureKPa = 0;
        let accelerationG = 1.0;
        let phaseLabel = '01 / 04 // STANDBY & IGNITION';

        if (progress < 0.20) {
          phaseLabel = '01 / 04 // STANDBY & IGNITION';
          altitudeMeters = 0;
          altitudeFormatted = '0.0 M [PAD 39A]';
          velocityMach = Number((flight.engineThrust * 0.2).toFixed(1));
          velocityMs = Math.round(velocityMach * 340.3);
          accelerationG = 1.0 + flight.engineThrust * 0.5;
          dynamicPressureKPa = 0.0;
        } else if (progress < 0.65) {
          phaseLabel = '02 / 04 // SUPERSONIC ASCENT & FLIGHT';
          const normP = (progress - 0.20) / 0.45;
          altitudeMeters = Math.round(Math.pow(normP, 1.7) * 58000);
          altitudeFormatted =
            altitudeMeters < 10000
              ? `+${altitudeMeters.toLocaleString()} M`
              : `+${(altitudeMeters / 1000).toFixed(1)} KM`;
          velocityMach = Number((1.2 + normP * 8.6).toFixed(1));
          velocityMs = Math.round(velocityMach * 340.3);
          accelerationG = Number((1.8 + normP * 2.8).toFixed(1));
          const qFactor = Math.sin(normP * Math.PI);
          dynamicPressureKPa = Number((qFactor * 36.8).toFixed(1));
        } else if (progress < 0.75) {
          phaseLabel = '03 / 04 // SCREEN BREAKTHROUGH';
          altitudeMeters = 84500;
          altitudeFormatted = '+84.5 KM [APEX]';
          velocityMach = 8.4;
          velocityMs = 2858;
          accelerationG = 0.2;
          dynamicPressureKPa = 1.2;
        } else if (progress < 0.85) {
          phaseLabel = '03 / 04 // ORBITAL TRANSIT';
          altitudeMeters = 68000;
          altitudeFormatted = '+68.0 KM';
          velocityMach = 4.2;
          velocityMs = 1429;
          accelerationG = 0.4;
          dynamicPressureKPa = 3.8;
        } else {
          phaseLabel = '04 / 04 // DESCENT & TOUCHDOWN';
          const descNorm = Math.max(0, 1.0 - (progress - 0.85) / 0.15);
          altitudeMeters = Math.round(descNorm * 18000);
          altitudeFormatted =
            altitudeMeters <= 50 ? '0.0 M [TOUCHDOWN]' : `+${altitudeMeters.toLocaleString()} M [RADAR]`;
          velocityMs = Math.round(Math.max(4, descNorm * 220));
          velocityMach = Number((velocityMs / 340.3).toFixed(2));
          accelerationG =
            flight.landingImpact > 0.1 ? Number((1.0 + flight.landingImpact * 4.5).toFixed(1)) : 1.2;
          dynamicPressureKPa = Number((descNorm * 14.2).toFixed(1));
        }

        const pitchDeg = Math.asin(THREE.MathUtils.clamp(rocketForwardVec.y, -1, 1)) * (180 / Math.PI);
        const headingDeg = Math.atan2(rocketForwardVec.x, rocketForwardVec.z) * (180 / Math.PI);
        const missionTimeSec = progress * 142;

        setProjectedTelemetry({
          screenX,
          screenY,
          noseX,
          noseY,
          engineX,
          engineY,
          visible,
          opacity: visible ? hudOpacity : 0,
          altitudeMeters,
          altitudeFormatted,
          velocityMach,
          velocityFormatted: `MACH ${velocityMach.toFixed(1)}`,
          velocityMs,
          thrustPercent: Math.round(flight.engineThrust * 100),
          accelerationG,
          dynamicPressureKPa,
          state: flight.state,
          stateProgress: flight.stateProgress,
          phaseLabel,
          headingDeg,
          pitchDeg,
          missionTimeSec,
        });

        setTelemetry({
          phaseLabel,
          mach: `Mach ${velocityMach.toFixed(1)}`,
          thrustPercent: Math.round(flight.engineThrust * 100),
          altitude: altitudeFormatted,
        });
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('trigger-rocket-cinematic', onTriggerCinematic);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener('change', onMotionChange);

      rocket.dispose();
      platform.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050608]"
    >
      {/* 3D WebGL Canvas for Physical Rocket and Launch Platform */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Subtle Spatial Vignette Gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5, 6, 8, 0.55) 85%, rgba(5, 6, 8, 0.94) 100%)',
        }}
      />

      {/* Screen-Space Flight Telemetry Overlay (Anchored to Rocket in 3D-projected space) */}
      <FlightTelemetry telemetry={projectedTelemetry} />

      {/* Minimalist Floating Mission Telemetry HUD (Section 23 Zero-Pill Architecture) */}
      {isHudVisible && (
        <aside
          aria-label="Mission Telemetry"
          className="fixed bottom-6 right-6 z-30 pointer-events-auto flex flex-col items-end gap-2 text-right select-none font-mono text-[11px] text-[#A7ADB5]"
        >
          {/* Main Telemetry Readout */}
          <div className="bg-[#11151A]/85 backdrop-blur-md border border-white/[0.08] px-3.5 py-2.5 rounded-lg flex flex-col items-end gap-1.5 shadow-2xl">
            <div className="flex items-center gap-2 text-[#FF9D38] font-semibold tracking-wider text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9D38] animate-pulse" />
              <span>{telemetry.phaseLabel}</span>
            </div>

            <div className="flex items-center gap-3 text-[#A7ADB5] text-[10px]">
              <span>ALT: <span className="text-[#F2F3F5] font-medium">{telemetry.altitude}</span></span>
              <span className="text-white/20">/</span>
              <span>VEL: <span className="text-[#F2F3F5] font-medium">{telemetry.mach}</span></span>
              <span className="text-white/20">/</span>
              <span>THRUST: <span className="text-[#FFD27A] font-medium">{telemetry.thrustPercent}%</span></span>
            </div>

            {/* Interactive Flight Controls */}
            <div className="flex items-center gap-2 pt-1.5 border-t border-white/[0.08] w-full justify-between">
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="flex items-center gap-1.5 text-[10px] text-[#A7ADB5] hover:text-[#F2F3F5] transition-colors cursor-pointer"
                title={isAutoPlaying ? 'Pause cinematic auto-flight' : 'Start automated cinematic flyover'}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-[#FF9D38]" />
                    <span>PAUSE FLYOVER</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-[#7EA7FF]" />
                    <span>AUTO CINEMATIC</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  autoProgressRef.current = 0;
                }}
                className="flex items-center gap-1 text-[10px] text-[#626A73] hover:text-[#A7ADB5] transition-colors cursor-pointer"
                title="Reset rocket to launch pad"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>PAD RESET</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

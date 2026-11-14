import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { interactionEngine } from '../../../context/SingularityInteractionEngine';
import { CameraShake } from '../rocket/CameraShake';
import { UniverseScene } from '../rocket/UniverseScene';
import { buildCraggyAsteroidGeometry, createAsteroidTextures } from './AsteroidModel';
import { AsteroidImpact } from './AsteroidImpact';

export interface AsteroidFlightAnimationProps {
  onCenterImpact?: () => void;
  onBecomeCursor?: () => void;
  onFinished: () => void;
  onWebGLError?: () => void;
  prefersReducedMotion?: boolean;
}

interface PassingAsteroidItem {
  mesh: THREE.Mesh;
  startX: number;
  startY: number;
  startZ: number;
  velX: number;
  velY: number;
  velZ: number;
  delay: number;
  duration: number;
  baseScale: number;
  spin: THREE.Vector3;
}

function easeOutCubic(t: number): number {
  const u = 1 - Math.max(0, Math.min(1, t));
  return 1 - u * u * u;
}

function easeInQuad(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c;
}

function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/**
 * AsteroidFlightAnimation:
 * Full 3D WebGL Three.js asteroid belt crossing + center screen impact + shrink-to-cursor sequence:
 * 1) Multiple realistic sculpted PBR asteroids stream across from the sides of the Milky Way.
 * 2) One hero cratered asteroid breaks out with incandescent re-entry fissures & glowing coma trail,
 *    hurtling straight into screen center and crashing with shockwaves, rock shards, flash & camera shake.
 * 3) The crashed hero asteroid cools, shrinks smoothly down to cursor scale, and glides onto the
 *    visitor's live pointer coordinates, handing off cleanly to the custom Asteroid Cursor.
 */
export const AsteroidFlightAnimation: React.FC<AsteroidFlightAnimationProps> = ({
  onCenterImpact,
  onBecomeCursor,
  onFinished,
  onWebGLError,
  prefersReducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
    const container = containerRef.current;
    if (!container) return;

    if (prefersReducedMotion) {
      const t1 = window.setTimeout(() => onBecomeCursorRef.current?.(), 160);
      const t2 = window.setTimeout(() => onFinishedRef.current(), 320);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const canvas = document.createElement('canvas');
    const glCheck =
      canvas.getContext('webgl2', { alpha: true }) ||
      canvas.getContext('webgl', { alpha: true });

    if (!glCheck) {
      onWebGLErrorRef.current?.();
      return;
    }

    let isSoftwareGl = false;
    try {
      const debugInfo = glCheck.getExtension('WEBGL_debug_renderer_info');
      const glRenderer = debugInfo
        ? String(glCheck.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
        : '';
      isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(glRenderer);
    } catch {
      isSoftwareGl = false;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onWebGLErrorRef.current?.();
      return;
    }

    const maxDpr = isSoftwareGl ? 1 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // PMREM metallic/silicate mineral reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const fov = 45;
    const baseCamPos = new THREE.Vector3(0, 0, 10.5);
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      160
    );
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0, 0);

    // Three-point celestial asteroid lighting (warm solar key + Milky Way cyan rim + dim bounce)
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.45);
    scene.add(ambientLight);

    const solarKey = new THREE.DirectionalLight(0xfff4e0, 2.8);
    solarKey.position.set(-7.5, 6.2, 8.5);
    scene.add(solarKey);

    const milkyWayRim = new THREE.DirectionalLight(0x38bdf8, 1.45);
    milkyWayRim.position.set(8.0, -4.5, -6.5);
    scene.add(milkyWayRim);

    const rearHighlight = new THREE.PointLight(0xfb923c, 0.8, 22);
    rearHighlight.position.set(0, 0, 4.5);
    scene.add(rearHighlight);

    const isMobile = window.innerWidth < 768;
    const isLowPower = isMobile || isSoftwareGl;
    const universe = new UniverseScene({
      starCount: isLowPower ? 650 : 1200,
      dustCount: isLowPower ? 80 : 160,
    });
    universe.setPixelRatio(dpr);
    scene.add(universe.group);

    // Shared procedural PBR asteroid textures + geometries
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createAsteroidTextures(maxAniso);

    const rockMat = new THREE.MeshStandardMaterial({
      map: textures.albedoMap,
      bumpMap: textures.bumpMap,
      bumpScale: 0.065,
      roughnessMap: textures.roughnessMap,
      roughness: 0.88,
      metalness: 0.14,
      vertexColors: true,
    });

    const heroRockMat = new THREE.MeshStandardMaterial({
      map: textures.albedoMap,
      bumpMap: textures.bumpMap,
      bumpScale: 0.085,
      roughnessMap: textures.roughnessMap,
      roughness: 0.84,
      metalness: 0.18,
      vertexColors: true,
      emissiveMap: textures.emissiveMap,
      emissive: new THREE.Color(0xff6b1a),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 1,
    });

    const variantGeos = [
      buildCraggyAsteroidGeometry(101, isLowPower ? 2 : 3, 7),
      buildCraggyAsteroidGeometry(209, isLowPower ? 2 : 3, 8),
      buildCraggyAsteroidGeometry(317, isLowPower ? 2 : 3, 6),
      buildCraggyAsteroidGeometry(433, isLowPower ? 2 : 3, 9),
      buildCraggyAsteroidGeometry(547, isLowPower ? 2 : 3, 7),
    ];
    const heroGeo = buildCraggyAsteroidGeometry(773, isLowPower ? 3 : 4, 12);

    // 1. Passing Asteroid Swarm streaking from side of the Milky Way
    const swarmCount = isLowPower ? 20 : 34;
    const passingAsteroids: PassingAsteroidItem[] = [];
    const swarmGroup = new THREE.Group();
    scene.add(swarmGroup);

    for (let i = 0; i < swarmCount; i++) {
      const geo = variantGeos[i % variantGeos.length];
      const mesh = new THREE.Mesh(geo, rockMat);
      mesh.visible = false;
      swarmGroup.add(mesh);

      // Primarily enter from the left/upper-left side of the Milky Way & pass diagonally across
      const fromRight = i % 7 === 0;
      const zDepth = -22 + Math.random() * 23.5; // -22 .. +1.5
      const speedMult = 1.0 + Math.random() * 0.75;
      const startX = fromRight ? 11.5 + Math.random() * 5.0 : -11.5 - Math.random() * 5.5;
      const startY = (Math.random() - 0.35) * 9.5 + (fromRight ? 1.5 : 2.2);

      // Move diagonally across frame & slightly toward viewer
      const velX = (fromRight ? -1 : 1) * (6.8 + Math.random() * 6.2) * speedMult;
      const velY = (-1.6 + (Math.random() - 0.5) * 2.4) * speedMult;
      const velZ = (1.2 + Math.random() * 3.8) * speedMult;

      // Spread departures across 0.0s .. 2.75s so continuous real asteroid belt traffic passes
      const delay = i < 6 ? i * 0.08 : 0.25 + ((i - 6) / (swarmCount - 6)) * 2.55;
      const duration = 2.1 + Math.random() * 1.45;

      // Varied boulder sizes (huge close silhouette passers -> tiny distant space pebbles)
      const baseScale =
        i % 8 === 0
          ? 0.48 + Math.random() * 0.32
          : i % 3 === 0
            ? 0.22 + Math.random() * 0.22
            : 0.08 + Math.random() * 0.14;

      passingAsteroids.push({
        mesh,
        startX,
        startY,
        startZ: zDepth,
        velX,
        velY,
        velZ,
        delay,
        duration,
        baseScale,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 3.4,
          (Math.random() - 0.5) * 3.8,
          (Math.random() - 0.5) * 2.9
        ),
      });
    }

    // 2. Hero Crashing Asteroid + Molten Coma Trail Particles
    const heroPivot = new THREE.Group();
    const heroMesh = new THREE.Mesh(heroGeo, heroRockMat);
    heroPivot.add(heroMesh);
    heroPivot.visible = false;
    scene.add(heroPivot);

    const trailCount = isLowPower ? 70 : 140;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailVelocities = new Float32Array(trailCount * 3);
    const trailLife = new Float32Array(trailCount);
    const trailMaxLife = new Float32Array(trailCount);
    const trailSize = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) {
      trailLife[i] = 999;
      trailMaxLife[i] = 1;
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('aLife', new THREE.BufferAttribute(trailLife, 1));
    trailGeo.setAttribute('aMaxLife', new THREE.BufferAttribute(trailMaxLife, 1));
    trailGeo.setAttribute('aSize', new THREE.BufferAttribute(trailSize, 1));

    const trailMat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: dpr },
      },
      vertexShader: `
        attribute float aLife;
        attribute float aMaxLife;
        attribute float aSize;
        uniform float uPixelRatio;
        varying float vProg;
        void main() {
          vProg = clamp(aLife / max(0.001, aMaxLife), 0.0, 1.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (1.0 - vProg * 0.45) * uPixelRatio * (38.0 / max(1.2, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vProg;
        void main() {
          if (vProg >= 0.995) discard;
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = pow(smoothstep(0.5, 0.0, d), 1.6);
          vec3 col = mix(vec3(1.0, 0.92, 0.72), vec3(0.95, 0.42, 0.12), vProg);
          gl_FragColor = vec4(col, glow * (1.0 - vProg) * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    trailPoints.frustumCulled = false;
    scene.add(trailPoints);

    let trailCursor = 0;
    const spawnTrailEmber = (pos: THREE.Vector3, heat: number) => {
      const i = trailCursor;
      trailCursor = (trailCursor + 1) % trailCount;
      const i3 = i * 3;
      trailPositions[i3] = pos.x + (Math.random() - 0.5) * 0.42;
      trailPositions[i3 + 1] = pos.y + (Math.random() - 0.5) * 0.42;
      trailPositions[i3 + 2] = pos.z + (Math.random() - 0.5) * 0.35;

      trailVelocities[i3] = (Math.random() - 0.5) * 1.4 - 0.35;
      trailVelocities[i3 + 1] = (Math.random() - 0.5) * 1.4 + 0.25;
      trailVelocities[i3 + 2] = -(1.2 + Math.random() * 2.2);

      trailLife[i] = 0;
      trailMaxLife[i] = 0.28 + Math.random() * 0.32;
      trailSize[i] = (1.1 + Math.random() * 1.5) * (0.65 + heat * 0.75);
    };

    // 3. Impact Controller & Camera Shake
    const cameraShake = new CameraShake();
    const asteroidImpact = new AsteroidImpact(
      isLowPower ? 90 : 170,
      isLowPower ? 10 : 18,
      heroRockMat
    );
    asteroidImpact.setPixelRatio(dpr);
    scene.add(asteroidImpact.group);

    // Master Timeline Constants
    const HERO_ENTER_SEC = 0.65;
    const IMPACT_TIME_SEC = 2.25;
    const SHRINK_START_SEC = 2.75;
    const BECOME_CURSOR_SEC = 3.92;
    const FINISH_SEC = 4.24;

    const screenToWorldAtZ = (clientX: number, clientY: number, zPlane: number, out: THREE.Vector3) => {
      const ndcX = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ndcY = -(clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      const dist = baseCamPos.z - zPlane;
      const halfH = Math.tan(THREE.MathUtils.degToRad(fov * 0.5)) * dist;
      const halfW = halfH * camera.aspect;
      out.set(ndcX * halfW, ndcY * halfH, zPlane);
    };

    const handleResize = () => {
      const curDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(curDpr);
      renderer.setSize(window.innerWidth, window.innerHeight);
      universe.setPixelRatio(curDpr);
      asteroidImpact.setPixelRatio(curDpr);
      trailMat.uniforms.uPixelRatio.value = curDpr;
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let yieldTimeoutId = 0;
    let isDisposed = false;
    let startTimeMs: number | null = null;
    let prevTimeMs = performance.now();
    let impactTriggered = false;
    let cursorActivated = false;
    let finishedCalled = false;
    let emitAccum = 0;

    const heroTargetCursorPos = new THREE.Vector3();
    const impactPos = new THREE.Vector3(0, 0, 3.45);
    const shrinkStartPos = new THREE.Vector3();

    const animate = (nowMs: number) => {
      if (isDisposed) return;
      if (startTimeMs === null) startTimeMs = nowMs;

      const elapsed = (nowMs - startTimeMs) / 1000;
      const dt = Math.min((nowMs - prevTimeMs) / 1000, 0.05);
      prevTimeMs = nowMs;

      // Background universe subtle glow fade-in/out
      const envFade =
        elapsed < 0.45
          ? easeOutCubic(elapsed / 0.45)
          : elapsed > 3.65
            ? Math.max(0, 1 - (elapsed - 3.65) / 0.55)
            : 1;
      const eng = interactionEngine.state;
      universe.update(elapsed, envFade * 0.48, elapsed < IMPACT_TIME_SEC ? 0.65 : 0.15, eng.ndcX, eng.ndcY);

      // Update passing Milky Way asteroid belt stream
      for (let i = 0; i < passingAsteroids.length; i++) {
        const p = passingAsteroids[i];
        const localT = elapsed - p.delay;
        if (localT < 0 || localT > p.duration) {
          p.mesh.visible = false;
          continue;
        }
        p.mesh.visible = true;
        const tNorm = localT / p.duration;
        p.mesh.position.set(
          p.startX + p.velX * localT,
          p.startY + p.velY * localT - 0.35 * localT * localT,
          p.startZ + p.velZ * localT
        );
        p.mesh.rotation.set(
          p.spin.x * localT,
          p.spin.y * localT,
          p.spin.z * localT
        );
        // Scale envelope softly fades at edges
        const edgeEnv = tNorm < 0.1 ? tNorm / 0.1 : tNorm > 0.85 ? (1 - tNorm) / 0.15 : 1;
        p.mesh.scale.setScalar(p.baseScale * Math.max(0.01, edgeEnv));
      }

      // Hero Asteroid Approach -> Screen Crash -> Cool & Shrink to Cursor
      if (elapsed >= HERO_ENTER_SEC && elapsed < FINISH_SEC) {
        heroPivot.visible = true;

        if (elapsed < IMPACT_TIME_SEC) {
          // Streaking from left flank of Milky Way directly into screen center!
          const p = (elapsed - HERO_ENTER_SEC) / (IMPACT_TIME_SEC - HERO_ENTER_SEC);
          const curve = easeInQuad(p * 0.85 + 0.15) * 0.92 + p * 0.08;
          const x = THREE.MathUtils.lerp(-11.8, impactPos.x, easeOutCubic(p * 1.15));
          const y = THREE.MathUtils.lerp(4.4, impactPos.y, easeOutCubic(p * 1.1)) + Math.sin(p * Math.PI) * 0.65;
          const z = THREE.MathUtils.lerp(-24.0, impactPos.z, curve);

          heroPivot.position.set(x, y, z);
          heroPivot.scale.setScalar(THREE.MathUtils.lerp(0.68, 1.38, p));
          heroMesh.rotation.set(elapsed * 2.8, elapsed * 3.6, elapsed * 2.1);

          // Ablation fissures heat up rapidly before screen impact
          const heat = 0.25 + p * 1.85;
          heroRockMat.emissiveIntensity = heat;
          heroRockMat.opacity = 1;

          // Spawn blazing coma / ember trail behind fast-approaching hero asteroid
          emitAccum += dt * (isLowPower ? 32 : 58);
          while (emitAccum >= 1) {
            emitAccum -= 1;
            spawnTrailEmber(heroPivot.position, Math.min(1.5, p * 1.4));
          }
        } else {
          // Trigger crash effects at exact center impact instant
          if (!impactTriggered) {
            impactTriggered = true;
            cameraShake.trigger(0.32, 0.88);
            asteroidImpact.trigger(impactPos.x, impactPos.y, impactPos.z - 0.18);
            onCenterImpactRef.current?.();
          }

          if (elapsed < SHRINK_START_SEC) {
            // Dramatic crash recoil & glowing fracture cooling right on screen
            const postT = (elapsed - IMPACT_TIME_SEC) / (SHRINK_START_SEC - IMPACT_TIME_SEC);
            const recoilZ = THREE.MathUtils.lerp(impactPos.z, 2.0, easeOutCubic(postT));
            heroPivot.position.set(0, 0, recoilZ);
            heroPivot.scale.setScalar(THREE.MathUtils.lerp(1.46, 1.05, easeOutCubic(postT)));
            heroMesh.rotation.x += dt * (2.6 * (1 - postT * 0.7));
            heroMesh.rotation.y += dt * (3.1 * (1 - postT * 0.7));
            heroMesh.rotation.z += dt * (1.8 * (1 - postT * 0.7));

            heroRockMat.emissiveIntensity = Math.max(0.18, 2.35 * Math.exp(-postT * 2.8));
            heroRockMat.opacity = 1;
            shrinkStartPos.copy(heroPivot.position);
          } else {
            // Shrink smoothly down to miniature Asteroid Cursor size & glide onto visitor's cursor
            const shrinkT = Math.min(1, (elapsed - SHRINK_START_SEC) / (BECOME_CURSOR_SEC - SHRINK_START_SEC));
            const smooth = easeInOutCubic(shrinkT);

            const hasPointer =
              eng.clientX > 0 &&
              eng.clientY > 0 &&
              eng.clientX < window.innerWidth &&
              eng.clientY < window.innerHeight;
            const targetClientX = hasPointer ? eng.clientX : window.innerWidth * 0.5;
            const targetClientY = hasPointer ? eng.clientY : window.innerHeight * 0.5;

            const destZ = 2.6;
            screenToWorldAtZ(targetClientX, targetClientY, destZ, heroTargetCursorPos);
            // Offset boulder mass ~11px down-right matching drawRealAsteroid tip at (0,0)
            const distToCam = baseCamPos.z - destZ;
            const worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(fov * 0.5)) * distToCam) / Math.max(1, window.innerHeight);
            heroTargetCursorPos.x += 12 * worldPerPx;
            heroTargetCursorPos.y -= 12 * worldPerPx;

            heroPivot.position.lerpVectors(shrinkStartPos, heroTargetCursorPos, smooth);
            // Arc upward slightly on glide toward cursor
            heroPivot.position.y += Math.sin(shrinkT * Math.PI) * 0.45 * (1 - shrinkT);

            // Shrink smoothly down to ~30px visual width to match custom Asteroid Cursor
            const targetWorldScale = Math.max(0.06, 14.5 * worldPerPx);
            const curScale = THREE.MathUtils.lerp(1.05, targetWorldScale, smooth);
            heroPivot.scale.setScalar(curScale);

            // Decelerate spin as asteroid settles into pointer orientation
            const spinDamp = Math.max(0, 1 - shrinkT);
            heroMesh.rotation.x += dt * 1.4 * spinDamp;
            heroMesh.rotation.y += dt * 1.8 * spinDamp;
            heroMesh.rotation.z += dt * 0.9 * spinDamp;

            heroRockMat.emissiveIntensity = Math.max(0.04, 0.25 * (1 - shrinkT));

            if (elapsed >= BECOME_CURSOR_SEC) {
              if (!cursorActivated) {
                cursorActivated = true;
                onBecomeCursorRef.current?.();
              }
              // Crisp crossfade over final ~0.28s directly into canvas AsteroidCursor
              const fadeP = Math.min(1, (elapsed - BECOME_CURSOR_SEC) / (FINISH_SEC - BECOME_CURSOR_SEC));
              heroRockMat.opacity = Math.max(0, 1 - fadeP);
            } else {
              heroRockMat.opacity = 1;
            }
          }
        }
      } else {
        heroPivot.visible = false;
      }

      // Update ember trail particles
      let trailDirty = false;
      for (let i = 0; i < trailCount; i++) {
        if (trailLife[i] >= trailMaxLife[i]) continue;
        trailDirty = true;
        trailLife[i] += dt;
        const i3 = i * 3;
        trailPositions[i3] += trailVelocities[i3] * dt;
        trailPositions[i3 + 1] += trailVelocities[i3 + 1] * dt;
        trailPositions[i3 + 2] += trailVelocities[i3 + 2] * dt;
      }
      if (trailDirty) {
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.aLife.needsUpdate = true;
      }

      // Update crash shockwave, shards & camera tremor
      asteroidImpact.update(dt);
      cameraShake.update(dt);
      camera.position.copy(baseCamPos).add(cameraShake.offset);
      camera.lookAt(0, 0, 0);
      camera.rotation.z += cameraShake.rotZ;
      camera.rotation.x += cameraShake.rotX;

      renderer.render(scene, camera);

      if (elapsed >= FINISH_SEC && !finishedCalled) {
        finishedCalled = true;
        onFinishedRef.current();
        return;
      }

      if (isSoftwareGl) {
        yieldTimeoutId = window.setTimeout(() => {
          if (!isDisposed) rafId = requestAnimationFrame(animate);
        }, 16);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      window.clearTimeout(yieldTimeoutId);

      for (const g of variantGeos) g.dispose();
      heroGeo.dispose();
      rockMat.dispose();
      heroRockMat.dispose();
      textures.dispose();
      trailGeo.dispose();
      trailMat.dispose();
      universe.dispose();
      asteroidImpact.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-[7] pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

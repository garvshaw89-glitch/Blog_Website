import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { interactionEngine } from '../context/SingularityInteractionEngine';

/**
 * DIGITAL SINGULARITY 3D INTERACTIVE ENVIRONMENT
 *
 * UnrealBloomPass Post-Processing Architecture:
 * - RenderPass: Captures the primary scene graph and camera perspective.
 * - UnrealBloomPass: Configured with soft, elegant luminosity thresholds and radii:
 *     * Threshold: ~0.24 (selectively isolates emissive neural filaments, energy particles & specular glass rims)
 *     * Strength: ~0.45 - 0.70 (calm soft glow, expanding with cursor velocity energy)
 *     * Radius: ~0.42 (diffused, creamy optical bloom without blinding halos)
 * - OutputPass: Applies ACESFilmic tone mapping and sRGB color space conversion.
 *
 * Performance Budget & Adaptive Device Scaling:
 * - On low-end / mobile / battery-constrained devices or reduced-motion mode:
 *     * Automatically disables or bypasses the multi-pass bloom composer to save fillrate,
 *       falling back seamlessly to direct hardware renderer.render(scene, camera).
 *     * On mid-tier / tablet: scales down bloom render target resolution to 0.7x for sustained 60 FPS.
 *     * On desktop fine-pointer: runs full-fidelity bloom with dynamic energy responsiveness.
 */

export const InteractiveBackgroundIllusion: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect hardware tier (logical cores / memory hints if available)
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowEndDevice = isMobile || hardwareConcurrency < 4 || prefersReducedMotion;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.007);

    const fov = 52;
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      160
    );
    const cameraBaseZ = 20;
    camera.position.set(0, 0, cameraBaseZ);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile && !isLowEndDevice,
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

    // 2. Post-Processing Chain (EffectComposer + UnrealBloomPass + OutputPass)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;

    // Only instantiate bloom post-processing on capable devices within performance budget
    if (!isLowEndDevice) {
      try {
        const renderTargetResolution = new THREE.Vector2(
          window.innerWidth * (isTablet ? 0.75 : 1.0),
          window.innerHeight * (isTablet ? 0.75 : 1.0)
        );

        composer = new EffectComposer(renderer);
        composer.setPixelRatio(dpr);
        composer.setSize(window.innerWidth, window.innerHeight);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Soft, balanced bloom parameters:
        // - resolution: Vector2
        // - strength: 0.52 (soft and luminous, not blinding)
        // - radius: 0.38 (creamy, tight diffusion)
        // - threshold: 0.22 (captures luminous filaments, particles, and glints)
        bloomPass = new UnrealBloomPass(
          renderTargetResolution,
          0.52,
          0.38,
          0.22
        );
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);
      } catch (err) {
        console.warn('Post-processing bloom fallback to native renderer:', err);
        composer = null;
        bloomPass = null;
      }
    }

    // 3. Volumetric Lights & Cursor Point Source
    const ambientLight = new THREE.AmbientLight(0x081524, 1.9);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0x06b6d4, 3.4, 25, 1.5);
    cursorLight.position.set(0, 0, 7);
    scene.add(cursorLight);

    const rimLight = new THREE.PointLight(0x3b82f6, 2.2, 32, 1.8);
    rimLight.position.set(-8, -10, 4);
    scene.add(rimLight);

    const deepLight = new THREE.PointLight(0x6366f1, 1.8, 40, 2.0);
    deepLight.position.set(9, 12, -12);
    scene.add(deepLight);

    // -------------------------------------------------------------
    // LAYERED 3D DEPTH GROUPS (Foreground, Midground, Background)
    // -------------------------------------------------------------
    const foregroundGroup = new THREE.Group();
    const midgroundGroup = new THREE.Group();
    const backgroundGroup = new THREE.Group();

    scene.add(backgroundGroup);
    scene.add(midgroundGroup);
    scene.add(foregroundGroup);

    // 4. Holographic 3D Warp Grid (Midground)
    const gridCols = isMobile ? 24 : 48;
    const gridRows = isMobile ? 18 : 36;
    const gridGeo = new THREE.PlaneGeometry(38, 30, gridCols, gridRows);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.085,
      blending: THREE.AdditiveBlending,
    });
    const warpGrid = new THREE.Mesh(gridGeo, gridMat);
    warpGrid.position.set(0, 0, -4);
    midgroundGroup.add(warpGrid);

    const originalGridPositions = gridGeo.attributes.position.clone();

    // 5. Multi-Tier Particles with Planetary Orbital Physics
    const particleCount = isMobile ? 180 : isTablet ? 340 : 580;
    const particleGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pOriginals = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pTiers = new Uint8Array(particleCount);

    const pOrbitAngle = new Float32Array(particleCount);
    const pOrbitSpeed = new Float32Array(particleCount);
    const pOrbitRadius = new Float32Array(particleCount);
    const pOrbitTilt = new Float32Array(particleCount);
    const pCaptureWeight = new Float32Array(particleCount);

    const colCyan = new THREE.Color(0x06b6d4);
    const colSky = new THREE.Color(0x38bdf8);
    const colBlue = new THREE.Color(0x3b82f6);
    const colViolet = new THREE.Color(0x818cf8);
    const colWhite = new THREE.Color(0xf8fafc);
    const colGold = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const tierRand = Math.random();
      let tier = 1;
      let depthZ = -2;

      if (tierRand < 0.22) {
        tier = 0;
        depthZ = 1.5 + Math.random() * 6.5;
      } else if (tierRand < 0.72) {
        tier = 1;
        depthZ = -6 + Math.random() * 6;
      } else {
        tier = 2;
        depthZ = -18 + Math.random() * 9;
      }

      pTiers[i] = tier;

      const spreadX = tier === 2 ? 46 : tier === 1 ? 34 : 26;
      const spreadY = tier === 2 ? 36 : tier === 1 ? 26 : 20;

      const px = (Math.random() - 0.5) * spreadX;
      const py = (Math.random() - 0.5) * spreadY;

      pPositions[idx] = px;
      pPositions[idx + 1] = py;
      pPositions[idx + 2] = depthZ;

      pOriginals[idx] = px;
      pOriginals[idx + 1] = py;
      pOriginals[idx + 2] = depthZ;

      pVelocities[idx] = 0;
      pVelocities[idx + 1] = 0;
      pVelocities[idx + 2] = 0;

      const orbitR = 0.8 + Math.random() * 3.8;
      pOrbitRadius[i] = orbitR;
      pOrbitAngle[i] = Math.random() * Math.PI * 2;
      const dir = Math.random() > 0.35 ? 1 : -1;
      pOrbitSpeed[i] = dir * (0.028 + (1.2 / (orbitR + 0.5)) * 0.035);
      pOrbitTilt[i] = (Math.random() - 0.5) * 0.85;
      pCaptureWeight[i] = 0;

      let col = colCyan;
      if (tier === 0) col = Math.random() > 0.4 ? colWhite : colSky;
      else if (tier === 1) col = Math.random() > 0.5 ? colCyan : colGold;
      else col = Math.random() > 0.5 ? colBlue : colViolet;

      pColors[idx] = col.r;
      pColors[idx + 1] = col.g;
      pColors[idx + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particleTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(34, 211, 238, 0.95)');
        grad.addColorStop(0.65, 'rgba(6, 182, 212, 0.28)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(cvs);
    })();

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.42,
      map: particleTexture,
      transparent: true,
      opacity: 0.88,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 6. Floating Glass Objects Distributed into Depth Layers
    const glassFragments: {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      vel: THREE.Vector3;
      rotVel: THREE.Vector3;
      mass: number;
      tier: number;
    }[] = [];

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd7e2ea,
      emissive: 0x081726,
      emissiveIntensity: 0.25,
      metalness: 0.12,
      roughness: 0.1,
      transmission: 0.86,
      thickness: 0.6,
      ior: 1.52,
      transparent: true,
      opacity: 0.45,
      reflectivity: 0.92,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });

    const geometries = [
      new THREE.IcosahedronGeometry(0.75, 0),
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.TetrahedronGeometry(0.95, 0),
      new THREE.CylinderGeometry(0.65, 0.65, 0.08, 6),
      new THREE.BoxGeometry(0.8, 1.2, 0.08),
    ];

    const glassCount = isMobile ? 8 : 20;
    for (let i = 0; i < glassCount; i++) {
      const geom = geometries[i % geometries.length];
      const mesh = new THREE.Mesh(geom, glassMat);

      const wireGeo = new THREE.WireframeGeometry(geom);
      const wire = new THREE.LineSegments(wireGeo, edgeMat);
      mesh.add(wire);

      const isForeground = i % 4 === 0;
      const tier = isForeground ? 0 : 1;

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * (isForeground ? 20 : 26),
        (Math.random() - 0.5) * (isForeground ? 16 : 20),
        isForeground ? 2 + Math.random() * 4 : -4 + Math.random() * 6
      );
      mesh.position.copy(basePos);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      if (isForeground) {
        foregroundGroup.add(mesh);
      } else {
        midgroundGroup.add(mesh);
      }

      glassFragments.push({
        mesh,
        basePos: basePos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.007,
          (Math.random() - 0.5) * 0.005
        ),
        mass: 0.8 + Math.random() * 0.8,
        tier,
      });
    }

    // 7. Deep Space Holographic Rings (Background Layer)
    const ringCount = isMobile ? 3 : 5;
    const deepRings: { mesh: THREE.Mesh; rx: number; ry: number; rz: number }[] = [];
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x044759,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });

    for (let i = 0; i < ringCount; i++) {
      const rGeom = new THREE.TorusGeometry(3.2 + i * 1.8, 0.018, 16, 64);
      const rMesh = new THREE.Mesh(rGeom, ringMat);
      rMesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        -10 - i * 3.5
      );
      backgroundGroup.add(rMesh);
      deepRings.push({
        mesh: rMesh,
        rx: (Math.random() - 0.5) * 0.002,
        ry: (Math.random() - 0.5) * 0.003,
        rz: (Math.random() - 0.5) * 0.002,
      });
    }

    // 8. Neural Energy Filaments (Midground Layer)
    const filCount = isMobile ? 4 : 8;
    const filamentLines: {
      line: THREE.Line;
      curve: THREE.CatmullRomCurve3;
      basePoints: THREE.Vector3[];
      currentPoints: THREE.Vector3[];
      phase: number;
      speed: number;
    }[] = [];

    const filMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < filCount; i++) {
      const pts: THREE.Vector3[] = [];
      const startX = -18 + (i / filCount) * 36;
      const depthZ = -5 + (i % 3) * 3;

      for (let j = 0; j < 6; j++) {
        pts.push(
          new THREE.Vector3(
            startX + (Math.random() - 0.5) * 5,
            -14 + j * 5.5 + (Math.random() - 0.5) * 3,
            depthZ + (Math.random() - 0.5) * 3
          )
        );
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const cGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
      const line = new THREE.Line(cGeo, filMat);
      midgroundGroup.add(line);

      filamentLines.push({
        line,
        curve,
        basePoints: pts.map((p) => p.clone()),
        currentPoints: pts.map((p) => p.clone()),
        phase: Math.random() * Math.PI * 2,
        speed: 0.007 + Math.random() * 0.01,
      });
    }

    // 9. Click Shockwave System
    interface ActiveShockwave {
      mesh: THREE.Mesh;
      radius: number;
      maxRadius: number;
      speed: number;
      opacity: number;
    }
    const shockwaves: ActiveShockwave[] = [];
    const shockwaveRingGeo = new THREE.RingGeometry(0.2, 0.5, 48);

    const triggerWorldShockwave = (wx: number, wy: number) => {
      if (interactionEngine.state.prefersReduced) return;

      const swMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(shockwaveRingGeo, swMat);
      mesh.position.set(wx, wy, 0.5);
      scene.add(mesh);

      shockwaves.push({
        mesh,
        radius: 0.2,
        maxRadius: 12,
        speed: 0.32,
        opacity: 0.9,
      });

      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const dist = Math.hypot(
          positions[idx] - wx,
          positions[idx + 1] - wy,
          positions[idx + 2] - 0.5
        );
        if (dist < 10) {
          const push = (1 - dist / 10) * 0.7;
          const angle = Math.atan2(positions[idx + 1] - wy, positions[idx] - wx);
          pVelocities[idx] += Math.cos(angle) * push;
          pVelocities[idx + 1] += Math.sin(angle) * push;
          pVelocities[idx + 2] += (Math.random() - 0.5) * push * 0.5;
          pCaptureWeight[i] = Math.max(0, pCaptureWeight[i] - 0.5);
        }
      }

      for (const frag of glassFragments) {
        const dist = frag.mesh.position.distanceTo(mesh.position);
        if (dist < 9) {
          const pushDir = frag.mesh.position.clone().sub(mesh.position).normalize();
          frag.vel.add(pushDir.multiplyScalar(0.45 * (1 - dist / 9)));
          frag.rotVel.add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.05,
              (Math.random() - 0.5) * 0.05,
              (Math.random() - 0.5) * 0.05
            )
          );
        }
      }
    };

    // 10. Raycasting: project mouse coordinates to 3D world plane at Z = 0
    const raycaster = new THREE.Raycaster();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersection = new THREE.Vector3();

    const updateWorldMouse = () => {
      raycaster.setFromCamera(
        new THREE.Vector2(interactionEngine.state.ndcX, interactionEngine.state.ndcY),
        camera
      );
      raycaster.ray.intersectPlane(planeZ0, planeIntersection);
      if (planeIntersection) {
        interactionEngine.state.worldPos.copy(planeIntersection);
        cursorLight.position.x = planeIntersection.x;
        cursorLight.position.y = planeIntersection.y;
        cursorLight.position.z =
          4.0 + Math.min(interactionEngine.state.normalizedEnergy * 3.5, 4.0);
      }
    };

    let lastObservedClick = 0;
    const unsubInteraction = interactionEngine.subscribe((state) => {
      if (state.lastClickTime > lastObservedClick) {
        lastObservedClick = state.lastClickTime;
        triggerWorldShockwave(state.worldPos.x, state.worldPos.y);
      }
    });

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

    // 11. Unified 60-120 FPS Main Render Loop
    let animId: number;
    let targetPrimaryCol = new THREE.Color(0x06b6d4);
    let targetSecondaryCol = new THREE.Color(0x3b82f6);

    let fgScrollY = 0;
    let mgScrollY = 0;
    let bgScrollY = 0;

    const animate = () => {
      const {
        ndcX,
        ndcY,
        worldPos,
        normalizedEnergy,
        scrollProgress,
        scrollVelocity,
        smoothedScrollVelocity,
        edgePullX,
        edgePullY,
        sectionTheme,
        prefersReduced,
      } = interactionEngine.state;

      updateWorldMouse();

      // Independent Layer Displacement based on scroll velocity
      const fgVelocityFactor = prefersReduced ? 0 : 2.4;
      const mgVelocityFactor = prefersReduced ? 0 : 1.0;
      const bgVelocityFactor = prefersReduced ? 0 : 0.35;

      fgScrollY += (scrollVelocity * fgVelocityFactor * 0.012 - fgScrollY) * 0.1;
      mgScrollY += (scrollVelocity * mgVelocityFactor * 0.008 - mgScrollY) * 0.1;
      bgScrollY += (scrollVelocity * bgVelocityFactor * 0.004 - bgScrollY) * 0.1;

      foregroundGroup.position.y = -fgScrollY - scrollProgress * 12.0;
      midgroundGroup.position.y = -mgScrollY - scrollProgress * 6.0;
      backgroundGroup.position.y = -bgScrollY - scrollProgress * 2.5;

      // Camera 3D Parallax Tilt
      if (!prefersReduced) {
        camera.rotation.y = -ndcX * 0.045 - edgePullX * 0.015;
        camera.rotation.x = ndcY * 0.035 + edgePullY * 0.012;

        const scrollZ = scrollProgress * -7.0;
        const scrollInertia = smoothedScrollVelocity * 0.007;

        camera.position.x = ndcX * 0.9;
        camera.position.y = ndcY * 0.7 - scrollInertia;
        camera.position.z = cameraBaseZ + scrollZ;
      }

      // Smooth section color grading
      targetPrimaryCol.setHex(sectionTheme.primary);
      targetSecondaryCol.setHex(sectionTheme.secondary);
      cursorLight.color.lerp(targetPrimaryCol, 0.04);
      rimLight.color.lerp(targetSecondaryCol, 0.04);
      cursorLight.intensity = 2.8 + normalizedEnergy * 1.2;

      // Dynamic Bloom Modulation based on environmental energy
      if (bloomPass) {
        // Base soft bloom intensity 0.48, naturally rising to 0.72 on high-energy sweeps
        bloomPass.strength = THREE.MathUtils.lerp(
          bloomPass.strength,
          0.48 + normalizedEnergy * 0.24,
          0.05
        );
      }

      const cursorX = worldPos.x;
      const cursorY = worldPos.y;

      const vFovRad = (fov * Math.PI) / 180;
      const viewH = window.innerHeight || 1;

      // 1. Warp Grid Deformation within EXACT 200px Radius
      const distToGridPlane = Math.abs(camera.position.z - (warpGrid.position.z + midgroundGroup.position.z));
      const frustumHeightGrid = 2 * distToGridPlane * Math.tan(vFovRad / 2);
      const unitsPerPixelGrid = frustumHeightGrid / viewH;
      const gridWarpRadius = 200 * unitsPerPixelGrid * (1 + normalizedEnergy * 0.2);

      const gridPos = gridGeo.attributes.position.array as Float32Array;
      const origGridPos = originalGridPositions.array as Float32Array;

      const localCursorX = cursorX - midgroundGroup.position.x;
      const localCursorY = cursorY - midgroundGroup.position.y;

      for (let i = 0; i < gridPos.length; i += 3) {
        const ox = origGridPos[i];
        const oy = origGridPos[i + 1];
        const oz = origGridPos[i + 2];

        const dist = Math.hypot(ox - localCursorX, oy - localCursorY);
        let targetZ = oz;
        let targetX = ox;
        let targetY = oy;

        if (dist < gridWarpRadius) {
          const factor = 1 - dist / gridWarpRadius;
          targetZ = oz - factor * (2.2 + normalizedEnergy * 1.5);
          const angle = Math.atan2(oy - localCursorY, ox - localCursorX);
          targetX = ox + Math.cos(angle) * (factor * 0.45);
          targetY = oy + Math.sin(angle) * (factor * 0.45);
        }

        gridPos[i] += (targetX - gridPos[i]) * 0.09;
        gridPos[i + 1] += (targetY - gridPos[i + 1]) * 0.09;
        gridPos[i + 2] += (targetZ - gridPos[i + 2]) * 0.09;
      }
      gridGeo.attributes.position.needsUpdate = true;

      // 2. PLANETARY ORBITAL PARTICLE SYSTEM
      const pos = particleGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const px = pos[idx];
        const py = pos[idx + 1];
        const pz = pos[idx + 2];

        const ox = pOriginals[idx];
        const oy = pOriginals[idx + 1];
        const oz = pOriginals[idx + 2];

        const tier = pTiers[i];

        const distToParticleZ = Math.abs(camera.position.z - pz);
        const frustumHeightAtZ = 2 * distToParticleZ * Math.tan(vFovRad / 2);
        const particleWarpRadius = 200 * (frustumHeightAtZ / viewH) * (1 + normalizedEnergy * 0.18);

        let tierScrollOffset = 0;
        if (tier === 0) tierScrollOffset = -fgScrollY * 0.4;
        else if (tier === 1) tierScrollOffset = -mgScrollY * 0.25;
        else tierScrollOffset = -bgScrollY * 0.1;

        const homeX = ox;
        const homeY = oy + tierScrollOffset;
        const homeZ = oz;

        const distFromHome = Math.hypot(cursorX - homeX, cursorY - homeY);

        if (distFromHome < particleWarpRadius) {
          const proximity = 1 - distFromHome / particleWarpRadius;
          pCaptureWeight[i] = Math.min(1.0, pCaptureWeight[i] + 0.08 * (0.5 + proximity));
          pOrbitAngle[i] += pOrbitSpeed[i] * (1 + normalizedEnergy * 1.4);
        } else {
          pCaptureWeight[i] = Math.max(0.0, pCaptureWeight[i] - 0.06);
        }

        const capture = pCaptureWeight[i];

        if (capture > 0.001) {
          const r = pOrbitRadius[i];
          const theta = pOrbitAngle[i];
          const tilt = pOrbitTilt[i];

          const orbitX = cursorX + Math.cos(theta) * r;
          const orbitY = cursorY + Math.sin(theta) * (r * 0.88);
          const orbitZ = (Math.sin(theta) * Math.sin(tilt) * r * 0.6);

          const targetX = THREE.MathUtils.lerp(homeX, orbitX, capture);
          const targetY = THREE.MathUtils.lerp(homeY, orbitY, capture);
          const targetZ = THREE.MathUtils.lerp(homeZ, orbitZ, capture);

          const followSpeed = 0.1 + capture * 0.08;
          pVelocities[idx] += (targetX - px) * followSpeed;
          pVelocities[idx + 1] += (targetY - py) * followSpeed;
          pVelocities[idx + 2] += (targetZ - pz) * followSpeed;
        } else {
          const returnSpring = tier === 2 ? 0.04 : 0.065;
          pVelocities[idx] += (homeX - px) * returnSpring;
          pVelocities[idx + 1] += (homeY - py) * returnSpring;
          pVelocities[idx + 2] += (homeZ - pz) * returnSpring;
        }

        const dampening = capture > 0.001 ? 0.88 : 0.82;
        pVelocities[idx] *= dampening;
        pVelocities[idx + 1] *= dampening;
        pVelocities[idx + 2] *= dampening;

        pos[idx] += pVelocities[idx];
        pos[idx + 1] += pVelocities[idx + 1];
        pos[idx + 2] += pVelocities[idx + 2];
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 3. Floating Glass Geometry Physics & Specular Highlights
      for (const frag of glassFragments) {
        frag.mesh.rotation.x += frag.rotVel.x * (1 + normalizedEnergy);
        frag.mesh.rotation.y += frag.rotVel.y * (1 + normalizedEnergy);
        frag.mesh.rotation.z += frag.rotVel.z * (1 + normalizedEnergy);

        const distToCursor = frag.mesh.position.distanceTo(worldPos);
        const glassWarpRadius = 6.5;

        if (distToCursor < glassWarpRadius && distToCursor > 0.1) {
          const force = (1 - distToCursor / glassWarpRadius) * (0.05 / frag.mass);
          const dir = frag.mesh.position.clone().sub(worldPos).normalize();
          frag.vel.add(dir.multiplyScalar(force));

          frag.rotVel.x += (Math.random() - 0.5) * 0.002;
          frag.rotVel.y += (Math.random() - 0.5) * 0.002;
        }

        const returnForce = frag.basePos.clone().sub(frag.mesh.position).multiplyScalar(0.015);
        frag.vel.add(returnForce);
        frag.vel.multiplyScalar(0.92);

        frag.mesh.position.add(frag.vel);
      }

      // 4. Energy Filaments Neural Wave Bending
      for (const fil of filamentLines) {
        fil.phase += fil.speed * (1 + normalizedEnergy);
        const curPts: THREE.Vector3[] = [];

        for (let j = 0; j < fil.basePoints.length; j++) {
          const bp = fil.basePoints[j];
          const cp = fil.currentPoints[j];

          const wave = Math.sin(fil.phase + j * 0.8) * 0.45;
          let targetX = bp.x + wave;
          let targetY = bp.y + Math.cos(fil.phase + j * 0.6) * 0.35;
          let targetZ = bp.z;

          const dist = Math.hypot(cursorX - bp.x, cursorY - bp.y);
          if (dist < 6.5) {
            const pull = (1 - dist / 6.5) * 1.8;
            targetX += (cursorX - bp.x) * pull * 0.25;
            targetY += (cursorY - bp.y) * pull * 0.25;
          }

          cp.x += (targetX - cp.x) * 0.06;
          cp.y += (targetY - cp.y) * 0.06;
          cp.z += (targetZ - cp.z) * 0.06;
          curPts.push(cp);
        }

        fil.curve.points = curPts;
        fil.line.geometry.setFromPoints(fil.curve.getPoints(50));
      }

      // 5. Deep Space Holographic Rings (Background)
      for (const r of deepRings) {
        r.mesh.rotation.x += r.rx;
        r.mesh.rotation.y += r.ry;
        r.mesh.rotation.z += r.rz;
      }

      // 6. Active Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.opacity *= 0.94;
        sw.mesh.scale.set(sw.radius, sw.radius, 1);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = sw.opacity;

        if (sw.opacity < 0.01 || sw.radius >= sw.maxRadius) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.Material).dispose();
          shockwaves.splice(i, 1);
        }
      }

      // Render through Post-Processing Composer if available, otherwise direct render
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      unsubInteraction();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);

      if (composer) {
        composer.dispose();
      }
      renderer.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      glassMat.dispose();
      ringMat.dispose();
      filMat.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#05070A]"
      style={{
        willChange: 'transform',
      }}
    >
      {/* Deep foundation chromatic vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, transparent 40%, rgba(5, 7, 10, 0.85) 90%)',
        }}
      />

      {/* Tactile micro-grain filter preventing digital color banding */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

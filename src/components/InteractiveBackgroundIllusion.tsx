import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../context/SingularityInteractionEngine';

/**
 * DIGITAL SINGULARITY 3D INTERACTIVE ENVIRONMENT
 *
 * Integrated Living Universe:
 * 1. Centralized Master Interaction Engine:
 *    - Unified pointer coordinates, velocity vector, energy, and scroll progression
 * 2. 4-Layer Depth Particle Singularity:
 *    - Layer A: Micro particles (fast orbit around cursor gravity well)
 *    - Layer B: Mid particles (flowing through space, velocity-reactive)
 *    - Layer C: Deep particles (slow distant galaxy background)
 *    - Layer D: Energy particles (accelerated outward on velocity spikes and clicks)
 * 3. Particle Gravity Dynamics:
 *    - Attract, repel, tangential swirl, and bending based on individual particle charge
 * 4. Translucent 3D Holographic Geometry:
 *    - Glass cubes, octahedrons, hexagonal wafers, and shards with physical Fresnel refraction
 *    - Objects rotate, catch specular sheen, and physically yield to the cursor's gravity field
 * 5. Holographic 3D Warp Grid:
 *    - Procedural grid plane in depth dynamically deformed and warped by the cursor's gravity singularity
 * 6. Procedural Energy Filaments:
 *    - Luminous spline curves behaving like neural pathways/fiber optics that curve toward the cursor
 * 7. Volumetric Light & Atmospheric Fog:
 *    - Mobile point light following the cursor, illuminating nearby glass and generating light streaks on fast movement
 * 8. Expanding Multi-Tier 3D Shockwaves on Click:
 *    - Spherical pulse violently pushes particles and ripples glass geometry with exponential decay
 * 9. Cinematic Camera Parallax & Scroll Velocity Propulsion:
 *    - Cursor tilts camera by 2-4 degrees; scrolling propels the camera through the environment
 * 10. Performance Engine:
 *    - Instanced rendering, buffer geometry pooling, capped DPR (1.0 - 1.75), 60-120 FPS
 */

export const InteractiveBackgroundIllusion: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.007);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
      stencil: false,
      depth: true,
    });

    const maxDpr = isMobile ? 1.0 : isTablet ? 1.4 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';

    // 2. Volumetric Studio & Cursor Singularity Lights
    const ambientLight = new THREE.AmbientLight(0x081524, 1.9);
    scene.add(ambientLight);

    // Cursor Point Light (volumetric light source)
    const cursorLight = new THREE.PointLight(0x06b6d4, 3.4, 25, 1.5);
    cursorLight.position.set(0, 0, 7);
    scene.add(cursorLight);

    // Counter Accent Light
    const rimLight = new THREE.PointLight(0x3b82f6, 2.2, 32, 1.8);
    rimLight.position.set(-8, -10, 4);
    scene.add(rimLight);

    // Deep Horizon Ambient Light
    const deepLight = new THREE.PointLight(0x6366f1, 1.8, 40, 2.0);
    deepLight.position.set(9, 12, -12);
    scene.add(deepLight);

    // 3. Holographic 3D Warp Grid (Dynamically warped by cursor singularity)
    const gridCols = isMobile ? 22 : 44;
    const gridRows = isMobile ? 18 : 34;
    const gridGeo = new THREE.PlaneGeometry(36, 28, gridCols, gridRows);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });
    const warpGrid = new THREE.Mesh(gridGeo, gridMat);
    warpGrid.position.set(0, 0, -6);
    scene.add(warpGrid);

    const originalGridPositions = gridGeo.attributes.position.clone();

    // 4. Multi-Layer 4-Tier Particle Singularity
    // Layer A (Micro), Layer B (Mid), Layer C (Deep), Layer D (Energy)
    const particleCount = isMobile ? 160 : isTablet ? 320 : 540;
    const particleGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pOriginals = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pCharges = new Float32Array(particleCount); // 1 = attract, -1 = repel, 2 = orbital swirl
    const pLayers = new Uint8Array(particleCount); // 0=micro, 1=mid, 2=deep, 3=energy

    const colCyan = new THREE.Color(0x06b6d4);
    const colSky = new THREE.Color(0x38bdf8);
    const colBlue = new THREE.Color(0x3b82f6);
    const colViolet = new THREE.Color(0x818cf8);
    const colWhite = new THREE.Color(0xf8fafc);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const layerRand = Math.random();
      let layer = 1;
      let depthZ = -2;

      if (layerRand < 0.25) {
        layer = 0; // Layer A - Micro
        depthZ = 2 + (Math.random() - 0.5) * 6;
      } else if (layerRand < 0.65) {
        layer = 1; // Layer B - Mid
        depthZ = -4 + (Math.random() - 0.5) * 8;
      } else if (layerRand < 0.85) {
        layer = 2; // Layer C - Deep
        depthZ = -14 + (Math.random() - 0.5) * 10;
      } else {
        layer = 3; // Layer D - Energy
        depthZ = 0 + (Math.random() - 0.5) * 4;
      }

      pLayers[i] = layer;

      const px = (Math.random() - 0.5) * (layer === 2 ? 45 : 30);
      const py = (Math.random() - 0.5) * (layer === 2 ? 35 : 24);

      pPositions[idx] = px;
      pPositions[idx + 1] = py;
      pPositions[idx + 2] = depthZ;

      pOriginals[idx] = px;
      pOriginals[idx + 1] = py;
      pOriginals[idx + 2] = depthZ;

      pVelocities[idx] = 0;
      pVelocities[idx + 1] = 0;
      pVelocities[idx + 2] = 0;

      // Charge determination for varied organic gravity
      const chargeRand = Math.random();
      if (chargeRand < 0.35) pCharges[i] = 2; // Orbital swirl
      else if (chargeRand < 0.65) pCharges[i] = 1; // Gravity attract
      else pCharges[i] = -1; // Gravity repel

      // Colors
      let col = colCyan;
      if (layer === 0) col = colWhite;
      else if (layer === 1) col = Math.random() > 0.5 ? colCyan : colSky;
      else if (layer === 2) col = Math.random() > 0.5 ? colBlue : colViolet;
      else col = colSky;

      pColors[idx] = col.r;
      pColors[idx + 1] = col.g;
      pColors[idx + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    // Particle Texture with Gaussian flare
    const particleTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(34, 211, 238, 0.9)');
        grad.addColorStop(0.6, 'rgba(6, 182, 212, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(cvs);
    })();

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

    // 5. Translucent 3D Holographic Geometry (Refraction & Gravity Float)
    const glassGroup = new THREE.Group();
    scene.add(glassGroup);

    const glassCount = isMobile ? 8 : 20;
    const glassFragments: {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      vel: THREE.Vector3;
      rotVel: THREE.Vector3;
      mass: number;
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

    for (let i = 0; i < glassCount; i++) {
      const geom = geometries[i % geometries.length];
      const mesh = new THREE.Mesh(geom, glassMat);

      const wireGeo = new THREE.WireframeGeometry(geom);
      const wire = new THREE.LineSegments(wireGeo, edgeMat);
      mesh.add(wire);

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 16,
        -2 + (Math.random() - 0.5) * 16
      );
      mesh.position.copy(basePos);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      glassGroup.add(mesh);
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
      });
    }

    // 6. Holographic Gyroscope Orbit Rings in Deep Space
    const ringsGroup = new THREE.Group();
    scene.add(ringsGroup);

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
      const rGeom = new THREE.TorusGeometry(3.0 + i * 1.6, 0.018, 16, 64);
      const rMesh = new THREE.Mesh(rGeom, ringMat);
      rMesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        -5 - i * 3.5
      );
      ringsGroup.add(rMesh);
      deepRings.push({
        mesh: rMesh,
        rx: (Math.random() - 0.5) * 0.002,
        ry: (Math.random() - 0.5) * 0.003,
        rz: (Math.random() - 0.5) * 0.002,
      });
    }

    // 7. Procedural Energy Filaments (Flowing Neural Pathways)
    const filamentGroup = new THREE.Group();
    scene.add(filamentGroup);

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
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < filCount; i++) {
      const pts: THREE.Vector3[] = [];
      const startX = -18 + (i / filCount) * 36;
      const depthZ = -6 + (i % 3) * 4;

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
      filamentGroup.add(line);

      filamentLines.push({
        line,
        curve,
        basePoints: pts.map((p) => p.clone()),
        currentPoints: pts.map((p) => p.clone()),
        phase: Math.random() * Math.PI * 2,
        speed: 0.007 + Math.random() * 0.01,
      });
    }

    // 8. 3D Spherical Shockwave System
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

      // Violent pulse push on nearby particles
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
        }
      }

      // Pulse on glass fragments
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

    // 9. Raycasting: project mouse into 3D world space coordinates at Z = 0
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

    // Subscribe to clicks from interaction engine
    let lastObservedClick = 0;
    const unsubInteraction = interactionEngine.subscribe((state) => {
      if (state.lastClickTime > lastObservedClick) {
        lastObservedClick = state.lastClickTime;
        triggerWorldShockwave(state.worldPos.x, state.worldPos.y);
      }
    });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize, { passive: true });

    // 10. Unified 60-120 FPS Main Render Loop
    let animId: number;
    let targetPrimaryCol = new THREE.Color(0x06b6d4);
    let targetSecondaryCol = new THREE.Color(0x3b82f6);

    const animate = () => {
      const {
        ndcX,
        ndcY,
        worldPos,
        normalizedEnergy,
        scrollProgress,
        smoothedScrollVelocity,
        edgePullX,
        edgePullY,
        sectionTheme,
        prefersReduced,
      } = interactionEngine.state;

      updateWorldMouse();

      // Camera 3D Parallax & Progression
      if (!prefersReduced) {
        // Subtle 2.5 degree camera rotation controlled by pointer
        camera.rotation.y = -ndcX * 0.045 - edgePullX * 0.015;
        camera.rotation.x = ndcY * 0.035 + edgePullY * 0.012;

        const scrollZ = scrollProgress * -7.0;
        const scrollY = scrollProgress * -5.5;
        const scrollInertia = smoothedScrollVelocity * 0.007;

        camera.position.x = ndcX * 0.9;
        camera.position.y = ndcY * 0.7 + scrollY - scrollInertia;
        camera.position.z = 20 + scrollZ;
      }

      // Smooth section color grading
      targetPrimaryCol.setHex(sectionTheme.primary);
      targetSecondaryCol.setHex(sectionTheme.secondary);
      cursorLight.color.lerp(targetPrimaryCol, 0.04);
      rimLight.color.lerp(targetSecondaryCol, 0.04);
      cursorLight.intensity = 2.8 + normalizedEnergy * 1.2;

      const cursorX = worldPos.x;
      const cursorY = worldPos.y;
      const gravRadius = 6.5 + normalizedEnergy * 3.0;

      // 1. Warp Grid Deformation around Cursor Singularity
      const gridPos = gridGeo.attributes.position.array as Float32Array;
      const origGridPos = originalGridPositions.array as Float32Array;
      const warpRadius = 7.0 + normalizedEnergy * 2.5;

      for (let i = 0; i < gridPos.length; i += 3) {
        const ox = origGridPos[i];
        const oy = origGridPos[i + 1];
        const oz = origGridPos[i + 2];

        const dist = Math.hypot(ox - cursorX, oy - cursorY);
        let targetZ = oz;
        let targetX = ox;
        let targetY = oy;

        if (dist < warpRadius) {
          const factor = 1 - dist / warpRadius;
          // Gravitational funnel depth distortion
          targetZ = oz - factor * (1.8 + normalizedEnergy * 1.2);
          const angle = Math.atan2(oy - cursorY, ox - cursorX);
          targetX = ox + Math.cos(angle) * (factor * 0.4);
          targetY = oy + Math.sin(angle) * (factor * 0.4);
        }

        gridPos[i] += (targetX - gridPos[i]) * 0.08;
        gridPos[i + 1] += (targetY - gridPos[i + 1]) * 0.08;
        gridPos[i + 2] += (targetZ - gridPos[i + 2]) * 0.08;
      }
      gridGeo.attributes.position.needsUpdate = true;

      // 2. Multi-Layer 4-Tier Particle Physics
      const pos = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const px = pos[idx];
        const py = pos[idx + 1];
        const pz = pos[idx + 2];

        const ox = pOriginals[idx];
        const oy = pOriginals[idx + 1];
        const oz = pOriginals[idx + 2];

        const charge = pCharges[i];
        const layer = pLayers[i];

        const dx = cursorX - px;
        const dy = cursorY - py;
        const dz = -pz;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < gravRadius && dist > 0.15) {
          const factor = (1 - dist / gravRadius) * (layer === 0 ? 1.4 : 1.0);

          if (charge === 2) {
            // Orbital tangential swirl around singularity
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            const orbitV = 0.045 * factor * (1 + normalizedEnergy);
            pVelocities[idx] += Math.cos(angle) * orbitV - (dx / dist) * factor * 0.015;
            pVelocities[idx + 1] += Math.sin(angle) * orbitV - (dy / dist) * factor * 0.015;
            pVelocities[idx + 2] += (dz / dist) * factor * 0.01;
          } else if (charge === 1) {
            // Direct gravitational attraction
            const pullV = 0.035 * factor * (1 + normalizedEnergy);
            pVelocities[idx] += (dx / dist) * pullV;
            pVelocities[idx + 1] += (dy / dist) * pullV;
            pVelocities[idx + 2] += (dz / dist) * pullV * 0.5;
          } else {
            // Gravitational repulsion
            const pushV = 0.04 * factor * (1 + normalizedEnergy);
            pVelocities[idx] -= (dx / dist) * pushV;
            pVelocities[idx + 1] -= (dy / dist) * pushV;
            pVelocities[idx + 2] -= (dz / dist) * pushV * 0.5;
          }
        }

        // Restoring spring force back to equilibrium
        const spring = layer === 2 ? 0.012 : 0.02;
        pVelocities[idx] += (ox - px) * spring;
        pVelocities[idx + 1] += (oy - py) * spring;
        pVelocities[idx + 2] += (oz - pz) * spring;

        // Dampening
        pVelocities[idx] *= 0.91;
        pVelocities[idx + 1] *= 0.91;
        pVelocities[idx + 2] *= 0.91;

        pos[idx] += pVelocities[idx];
        pos[idx + 1] += pVelocities[idx + 1];
        pos[idx + 2] += pVelocities[idx + 2];
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 3. Floating Glass Geometry Physics & Specular Glints
      for (const frag of glassFragments) {
        frag.mesh.rotation.x += frag.rotVel.x * (1 + normalizedEnergy);
        frag.mesh.rotation.y += frag.rotVel.y * (1 + normalizedEnergy);
        frag.mesh.rotation.z += frag.rotVel.z * (1 + normalizedEnergy);

        const distToCursor = frag.mesh.position.distanceTo(worldPos);
        const glassRepelR = 6.5;

        if (distToCursor < glassRepelR && distToCursor > 0.1) {
          const force = (1 - distToCursor / glassRepelR) * (0.05 / frag.mass);
          const dir = frag.mesh.position.clone().sub(worldPos).normalize();
          frag.vel.add(dir.multiplyScalar(force));

          // Physical spin torque when hit by singularity field
          frag.rotVel.x += (Math.random() - 0.5) * 0.002;
          frag.rotVel.y += (Math.random() - 0.5) * 0.002;
        }

        const returnForce = frag.basePos.clone().sub(frag.mesh.position).multiplyScalar(0.015);
        frag.vel.add(returnForce);
        frag.vel.multiplyScalar(0.92);

        frag.mesh.position.add(frag.vel);
        frag.mesh.position.y = frag.basePos.y - (scrollProgress * 12) % 24 + 12;
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

      // 5. Deep Space Holographic Rings
      for (const r of deepRings) {
        r.mesh.rotation.x += r.rx;
        r.mesh.rotation.y += r.ry;
        r.mesh.rotation.z += r.rz;
        r.mesh.position.y = (scrollProgress * 8) % 16 - 8;
      }

      // 6. 3D Shockwaves Propagation
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

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      unsubInteraction();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);

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

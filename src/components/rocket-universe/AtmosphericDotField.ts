import * as THREE from 'three';

/**
 * LIVING DOT ATMOSPHERE SYSTEM
 * 
 * 4-Layer Stratified GPU Dot Environment:
 * - Layer 01: Very close particles (responsive, rich parallax)
 * - Layer 02: Medium-distance particles (soft glow, ambient dust)
 * - Layer 03: Far particles (atmospheric depth)
 * - Layer 04: Ultra-distant micro points (subtle deep-space grid)
 * 
 * Behaviors:
 * - Multi-frequency 3D drift and orbital float
 * - Cursor parallax and soft repulsion
 * - Rocket bow-wave hull deflection
 * - Exhaust plume turbulence and push
 * - Screen fly-by camera warp rush
 * - Touchdown landing radial shockwave with friction settling
 */
export class AtmosphericDotField {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private totalCount: number;

  // Typed attribute buffers
  private basePositions: Float32Array;
  private currentPositions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private layers: Float32Array;
  private phases: Float32Array;

  constructor(isMobile: boolean = false) {
    this.totalCount = isMobile ? 2200 : 4800;

    this.basePositions = new Float32Array(this.totalCount * 3);
    this.currentPositions = new Float32Array(this.totalCount * 3);
    this.velocities = new Float32Array(this.totalCount * 3);
    this.colors = new Float32Array(this.totalCount * 3);
    this.sizes = new Float32Array(this.totalCount);
    this.layers = new Float32Array(this.totalCount);
    this.phases = new Float32Array(this.totalCount);

    // Layer particle distribution (Intelligent clustering & editorial depth):
    // Layer 01 (Near): 15% (2–4px, low opacity)
    // Layer 02 (Mid): 35% (1–2px, moderate density)
    // Layer 03 (Far): 30% (0.5–1px, very subtle)
    // Layer 04 (Micro Dust): 20% (tiny points, almost invisible)
    for (let i = 0; i < this.totalCount; i++) {
      const p = i / this.totalCount;
      let layer = 1;
      let z = 0;
      let size = 1.5;

      if (p < 0.15) {
        layer = 1;
        z = THREE.MathUtils.randFloat(-10, 22);
        size = THREE.MathUtils.randFloat(2.0, 3.8);
      } else if (p < 0.50) {
        layer = 2;
        z = THREE.MathUtils.randFloat(-35, -10);
        size = THREE.MathUtils.randFloat(1.1, 2.0);
      } else if (p < 0.80) {
        layer = 3;
        z = THREE.MathUtils.randFloat(-85, -35);
        size = THREE.MathUtils.randFloat(0.6, 1.1);
      } else {
        layer = 4;
        z = THREE.MathUtils.randFloat(-160, -85);
        size = THREE.MathUtils.randFloat(0.4, 0.7);
      }

      // Clustered & Variable Density Distribution (Section 11):
      // Non-uniform starfield: uses subtle cluster attractors to create organic galactic dust
      // and keeps central reading axis slightly less dense so text stays 100% legible.
      const clusterAngle = Math.random() * Math.PI * 2;
      const clusterDist = Math.pow(Math.random(), 0.65) * 55;
      const spreadX = 40 + Math.abs(z) * 0.85;
      const spreadY = 32 + Math.abs(z) * 0.7;

      let x = Math.cos(clusterAngle) * clusterDist;
      let y = Math.sin(clusterAngle) * clusterDist * 0.75;

      // Add peripheral expansion
      if (Math.random() < 0.35) {
        x = THREE.MathUtils.randFloatSpread(spreadX * 2);
        y = THREE.MathUtils.randFloatSpread(spreadY * 2);
      }

      // Push particles slightly away from direct center reading corridor (|x| < 12)
      if (Math.abs(x) < 14 && Math.random() < 0.45) {
        x += Math.sign(x || 1) * THREE.MathUtils.randFloat(12, 24);
      }

      const idx3 = i * 3;
      this.basePositions[idx3] = x;
      this.basePositions[idx3 + 1] = y;
      this.basePositions[idx3 + 2] = z;

      this.currentPositions[idx3] = x;
      this.currentPositions[idx3 + 1] = y;
      this.currentPositions[idx3 + 2] = z;

      this.velocities[idx3] = 0;
      this.velocities[idx3 + 1] = 0;
      this.velocities[idx3 + 2] = 0;

      this.layers[i] = layer;
      this.sizes[i] = size;
      this.phases[i] = Math.random() * Math.PI * 2;

      // Color System (Section 02 & 03):
      // Primary: #F2F3F5 (soft white), Secondary: #A7ADB5 (slate), Muted: #626A73, Launch Amber: #FFD27A
      const colorType = Math.random();
      if (colorType < 0.50) {
        // High-contrast editorial white (#F2F3F5)
        this.colors[idx3] = 0.95;
        this.colors[idx3 + 1] = 0.95;
        this.colors[idx3 + 2] = 0.96;
      } else if (colorType < 0.80) {
        // Secondary slate titanium (#A7ADB5)
        this.colors[idx3] = 0.65;
        this.colors[idx3 + 1] = 0.68;
        this.colors[idx3 + 2] = 0.71;
      } else if (colorType < 0.94) {
        // Muted deep space dust (#626A73)
        this.colors[idx3] = 0.38;
        this.colors[idx3 + 1] = 0.42;
        this.colors[idx3 + 2] = 0.45;
      } else {
        // Warm launch amber micro-accent (#FFD27A)
        this.colors[idx3] = 1.0;
        this.colors[idx3 + 1] = 0.82;
        this.colors[idx3 + 2] = 0.48;
      }
    }

    // Geometry & Attributes
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Crisp circular dot texture with anti-aliasing
    const texture = this.createDotTexture();

    this.material = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'AtmosphericDotField';
  }

  private createDotTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.65, 'rgba(240, 245, 255, 0.45)');
    grad.addColorStop(1.0, 'rgba(200, 220, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  /**
   * Main Physical Animation & Environmental Interaction Pass
   */
  public update(
    time: number,
    rocketPos: THREE.Vector3,
    rocketDir: THREE.Vector3,
    engineThrust: number,
    warpSpeed: number,
    landingImpact: number,
    mousePos: { x: number; y: number }
  ): void {
    const pos = this.currentPositions;
    const base = this.basePositions;
    const vel = this.velocities;

    const isWarping = warpSpeed > 0.02;
    const isImpacting = landingImpact > 0.02;
    const landingPadPos = new THREE.Vector3(0, -18, -12);

    for (let i = 0; i < this.totalCount; i++) {
      const idx3 = i * 3;
      const layer = this.layers[i];
      const phase = this.phases[i];

      // Multi-layer speed factor
      const layerFactor = 1.0 / layer;

      // 1. Natural multi-harmonic ambient drift
      const driftX = Math.sin(time * 0.35 * layerFactor + phase) * (0.8 * layerFactor);
      const driftY = Math.cos(time * 0.28 * layerFactor + phase * 1.3) * (0.6 * layerFactor);
      const driftZ = Math.sin(time * 0.22 * layerFactor + phase * 0.8) * (0.5 * layerFactor);

      // 2. Cursor subtle parallax
      const cursorX = mousePos.x * 3.5 * layerFactor;
      const cursorY = -mousePos.y * 3.0 * layerFactor;

      let targetX = base[idx3] + driftX + cursorX;
      let targetY = base[idx3 + 1] + driftY + cursorY;
      let targetZ = base[idx3 + 2] + driftZ;

      // 3. Rocket Bow-Wave Repulsion
      const dx = pos[idx3] - rocketPos.x;
      const dy = pos[idx3 + 1] - rocketPos.y;
      const dz = pos[idx3 + 2] - rocketPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const bowRadius = 5.5;

      if (distSq < bowRadius * bowRadius && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const push = (1.0 - dist / bowRadius) * 0.45;
        vel[idx3] += (dx / dist) * push;
        vel[idx3 + 1] += (dy / dist) * push;
        vel[idx3 + 2] += (dz / dist) * push;
      }

      // 4. Engine Exhaust Wake (turbulent downward push)
      if (engineThrust > 0.05) {
        // Point behind rocket along opposite direction
        const exhaustOriginX = rocketPos.x - rocketDir.x * 4.5;
        const exhaustOriginY = rocketPos.y - rocketDir.y * 4.5;
        const exhaustOriginZ = rocketPos.z - rocketDir.z * 4.5;

        const exDx = pos[idx3] - exhaustOriginX;
        const exDy = pos[idx3 + 1] - exhaustOriginY;
        const exDz = pos[idx3 + 2] - exhaustOriginZ;
        const exDistSq = exDx * exDx + exDy * exDy + exDz * exDz;
        const exRadius = 8.5 * engineThrust;

        if (exDistSq < exRadius * exRadius && exDistSq > 0.001) {
          const exDist = Math.sqrt(exDistSq);
          const exhaustForce = (1.0 - exDist / exRadius) * 0.85 * engineThrust;
          vel[idx3] += (-rocketDir.x + (Math.random() - 0.5) * 0.4) * exhaustForce;
          vel[idx3 + 1] += (-rocketDir.y + (Math.random() - 0.5) * 0.4) * exhaustForce;
          vel[idx3 + 2] += (-rocketDir.z + (Math.random() - 0.5) * 0.4) * exhaustForce;
        }
      }

      // 5. SCREEN FLY-BY WARP RUSH (Particles streak radially outward from screen center)
      if (isWarping && (layer === 1 || layer === 2)) {
        const radialX = pos[idx3];
        const radialY = pos[idx3 + 1];
        const radDist = Math.sqrt(radialX * radialX + radialY * radialY) + 0.1;
        const warpForce = warpSpeed * (layer === 1 ? 2.8 : 1.4);
        vel[idx3] += (radialX / radDist) * warpForce;
        vel[idx3 + 1] += (radialY / radDist) * warpForce;
        vel[idx3 + 2] += warpForce * 2.2; // Toward camera
      }

      // 6. LANDING IMPACT RADIAL SHOCKWAVE
      if (isImpacting) {
        const ldx = pos[idx3] - landingPadPos.x;
        const ldy = pos[idx3 + 1] - landingPadPos.y;
        const ldz = pos[idx3 + 2] - landingPadPos.z;
        const lDistSq = ldx * ldx + ldy * ldy + ldz * ldz;
        const shockRadius = 38.0;

        if (lDistSq < shockRadius * shockRadius && lDistSq > 0.001) {
          const lDist = Math.sqrt(lDistSq);
          const shockForce = (1.0 - lDist / shockRadius) * landingImpact * 2.6;
          vel[idx3] += (ldx / lDist) * shockForce;
          vel[idx3 + 1] += Math.max(0.2, ldy / lDist) * shockForce * 1.2; // Blast upward
          vel[idx3 + 2] += (ldz / lDist) * shockForce;
        }
      }

      // Integrate velocities with air friction
      vel[idx3] *= 0.92;
      vel[idx3 + 1] *= 0.92;
      vel[idx3 + 2] *= 0.92;

      // Spring attraction back toward home target position
      const springK = 0.035;
      pos[idx3] += (targetX - pos[idx3]) * springK + vel[idx3];
      pos[idx3 + 1] += (targetY - pos[idx3 + 1]) * springK + vel[idx3 + 1];
      pos[idx3 + 2] += (targetZ - pos[idx3 + 2]) * springK + vel[idx3 + 2];
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

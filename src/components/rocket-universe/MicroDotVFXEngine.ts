import * as THREE from 'three';

export type VFXParticleType =
  | 'HOT_CORE'
  | 'EXHAUST_DOT'
  | 'SMOKE_DOT'
  | 'SPARK'
  | 'LAUNCH_DUST'
  | 'LANDING_SHOCKWAVE'
  | 'SPEED_STREAK';

interface DotParticle {
  active: boolean;
  type: VFXParticleType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  baseSize: number;
  temperature: number; // 1.0 (white hot) -> 0.0 (dissipated)
  r: number;
  g: number;
  b: number;
  alpha: number;
  mass: number;
  drag: number;
}

/**
 * CENTRAL MICRO-DOT PARTICLE ENGINE (Sections 12-22, 36-42)
 * 
 * Replaces generic smoke textures/sprites with thousands of individual,
 * physically simulated micro-dot particles:
 * - 90% micro-dots (0.8 - 1.5px)
 * - 8% small dots (1.8 - 2.8px)
 * - 2% bright spark highlights
 * - Temperature-driven color transitions: White-Hot -> Launch Amber -> Orange -> Slate Charcoal
 * - Procedural curl noise turbulence
 * - Launch ground displacement dust
 * - Touchdown radial shockwave with gravity settling
 */
export class MicroDotVFXEngine {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private maxParticles: number;
  private pool: DotParticle[] = [];
  private activeCount: number = 0;

  // Typed attribute buffers
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  // Working vectors
  private _tempPos = new THREE.Vector3();
  private _tempDir = new THREE.Vector3();

  constructor(maxParticles: number = 2800) {
    this.maxParticles = maxParticles;

    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    // Initialize particle pool (Sections 14 & 41)
    for (let i = 0; i < maxParticles; i++) {
      // 90% micro-dots, 8% small dots, 2% bright highlights
      const pTypeRand = Math.random();
      let baseSize = 1.2;
      let mass = 0.05;

      if (pTypeRand < 0.90) {
        baseSize = THREE.MathUtils.randFloat(0.8, 1.6); // Micro-dot
        mass = 0.02;
      } else if (pTypeRand < 0.98) {
        baseSize = THREE.MathUtils.randFloat(1.8, 2.6); // Small dot
        mass = 0.08;
      } else {
        baseSize = THREE.MathUtils.randFloat(3.2, 4.2); // Bright highlight spark
        mass = 0.01;
      }

      this.pool.push({
        active: false,
        type: 'EXHAUST_DOT',
        x: 0,
        y: -9999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        size: baseSize,
        baseSize,
        temperature: 1.0,
        r: 1.0,
        g: 0.95,
        b: 0.85,
        alpha: 0,
        mass,
        drag: 0.93,
      });

      const idx3 = i * 3;
      this.positions[idx3] = 0;
      this.positions[idx3 + 1] = -9999;
      this.positions[idx3 + 2] = 0;

      this.colors[idx3] = 1.0;
      this.colors[idx3 + 1] = 0.8;
      this.colors[idx3 + 2] = 0.4;

      this.sizes[i] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Crisp micro-dot texture
    const texture = this.createMicroDotTexture();

    this.material = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'MicroDotVFXEngine';
  }

  private createMicroDotTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.92)');
    grad.addColorStop(0.7, 'rgba(240, 245, 255, 0.35)');
    grad.addColorStop(1.0, 'rgba(200, 220, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  /**
   * Spawns exhaust micro-dots along the nozzle exit cone (Sections 16-19)
   */
  public emitExhaust(
    nozzlePos: THREE.Vector3,
    exhaustDir: THREE.Vector3,
    thrust: number,
    rocketVelocity: THREE.Vector3,
    count: number = 8
  ): void {
    if (thrust < 0.02) return;

    for (let c = 0; c < count; c++) {
      const p = this.findAvailableParticle();
      if (!p) break;

      // Exhaust cone radius: tightly focused at nozzle rim (0.35m)
      const angle = Math.random() * Math.PI * 2;
      const nozzleRadius = Math.random() * 0.45;
      const spreadX = Math.cos(angle) * nozzleRadius;
      const spreadZ = Math.sin(angle) * nozzleRadius;

      p.active = true;
      p.type = Math.random() < 0.15 ? 'SPARK' : 'EXHAUST_DOT';

      p.x = nozzlePos.x + spreadX;
      p.y = nozzlePos.y;
      p.z = nozzlePos.z + spreadZ;

      // Supersonic exhaust speed proportional to thrust (18 to 42 m/s)
      const speed = THREE.MathUtils.randFloat(18.0, 36.0) * thrust;
      const coneDivergence = 0.18; // Slight radial expansion

      p.vx = exhaustDir.x * speed + (Math.random() - 0.5) * speed * coneDivergence + rocketVelocity.x * 0.35;
      p.vy = exhaustDir.y * speed + (Math.random() - 0.5) * speed * coneDivergence + rocketVelocity.y * 0.35;
      p.vz = exhaustDir.z * speed + (Math.random() - 0.5) * speed * coneDivergence + rocketVelocity.z * 0.35;

      p.life = 0;
      p.maxLife = p.type === 'SPARK' ? THREE.MathUtils.randFloat(0.12, 0.32) : THREE.MathUtils.randFloat(0.45, 0.95);
      p.temperature = 1.0; // Starts white-hot
      p.drag = 0.92;
    }
  }

  /**
   * Spawns ground dust micro-dots displaced by engine downwash (Sections 21 & 22)
   */
  public emitLaunchDust(
    rocketPos: THREE.Vector3,
    padY: number,
    thrust: number,
    count: number = 14
  ): void {
    const distToGround = rocketPos.y - padY;
    if (distToGround > 14.0 || thrust < 0.08) return;

    // Ground pressure strength diminishes with height
    const groundPressure = (1.0 - distToGround / 14.0) * thrust;

    for (let c = 0; c < count; c++) {
      const p = this.findAvailableParticle();
      if (!p) break;

      p.active = true;
      p.type = 'LAUNCH_DUST';

      // Displace radially from impact center beneath rocket
      const angle = Math.random() * Math.PI * 2;
      const startRadius = THREE.MathUtils.randFloat(0.6, 2.5);
      p.x = rocketPos.x + Math.cos(angle) * startRadius;
      p.y = padY + 0.08 + Math.random() * 0.15;
      p.z = rocketPos.z + Math.sin(angle) * startRadius;

      // Radial outward blast speed with upward curl
      const blastSpeed = THREE.MathUtils.randFloat(6.0, 16.0) * groundPressure;
      p.vx = Math.cos(angle) * blastSpeed;
      p.vy = THREE.MathUtils.randFloat(1.2, 5.0) * groundPressure; // Upward billow
      p.vz = Math.sin(angle) * blastSpeed;

      p.life = 0;
      p.maxLife = THREE.MathUtils.randFloat(0.8, 1.8);
      p.temperature = 0.45; // Warm dust illuminated by exhaust
      p.drag = 0.89; // Decelerates rapidly against air
    }
  }

  /**
   * Triggers radial touchdown impact shockwave made of micro-dots (Sections 36-39)
   */
  public triggerLandingShockwave(
    padCenter: THREE.Vector3,
    impactStrength: number,
    count: number = 180
  ): void {
    const totalToEmit = Math.min(count, Math.round(count * impactStrength));

    for (let c = 0; c < totalToEmit; c++) {
      const p = this.findAvailableParticle();
      if (!p) break;

      p.active = true;
      p.type = 'LANDING_SHOCKWAVE';

      const angle = Math.random() * Math.PI * 2;
      const startRadius = THREE.MathUtils.randFloat(0.4, 1.8);

      p.x = padCenter.x + Math.cos(angle) * startRadius;
      p.y = padCenter.y + 0.1;
      p.z = padCenter.z + Math.sin(angle) * startRadius;

      // Fast expanding ground shock ring
      const shockSpeed = THREE.MathUtils.randFloat(12.0, 28.0) * impactStrength;
      p.vx = Math.cos(angle) * shockSpeed;
      p.vy = THREE.MathUtils.randFloat(0.8, 3.8) * impactStrength; // Low angle rise
      p.vz = Math.sin(angle) * shockSpeed;

      p.life = 0;
      p.maxLife = THREE.MathUtils.randFloat(0.7, 1.9);
      p.temperature = 0.65; // Warm impact dust
      p.drag = 0.88;
    }
  }

  /**
   * Physical Particle Integration Pass
   * Integrates velocity, procedural turbulence, temperature decay, gravity, and drag
   */
  public update(dt: number, totalTime: number): void {
    const pos = this.positions;
    const col = this.colors;
    const siz = this.sizes;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      const idx3 = i * 3;

      if (!p.active) {
        siz[i] = 0;
        pos[idx3 + 1] = -9999;
        continue;
      }

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        siz[i] = 0;
        pos[idx3 + 1] = -9999;
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // 1. Procedural turbulence: curled 3D noise (Section 18)
      const noiseFreq = 0.85;
      const noiseTime = totalTime * 3.5;
      const turbX = Math.sin(p.y * noiseFreq + noiseTime) * 0.45;
      const turbZ = Math.cos(p.x * noiseFreq + noiseTime * 1.1) * 0.45;

      p.vx += turbX * dt;
      p.vz += turbZ * dt;

      // 2. Gravity on cooling dust & ground shockwave (Section 39)
      if (p.type === 'LAUNCH_DUST' || p.type === 'LANDING_SHOCKWAVE' || p.type === 'SMOKE_DOT') {
        p.vy -= 9.81 * dt * 0.4; // Controlled gentle downward settling
      }

      // 3. Air Drag Deceleration
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vz *= p.drag;

      // 4. Position Integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Clamp ground collision
      if (p.y < -18.0) {
        p.y = -18.0;
        p.vy = 0;
        p.vx *= 0.82;
        p.vz *= 0.82;
      }

      // 5. Temperature & Color Decay (Sections 16, 17, 48)
      p.temperature = Math.max(0, 1.0 - lifeRatio);

      // Temperature Color Transitions:
      // T >= 0.75: White-hot core (#FFF4D6 / #FFFFFF)
      // 0.45 <= T < 0.75: Warm launch amber (#FFD27A / #FF9D38)
      // 0.20 <= T < 0.45: Deep orange / titanium (#B45309)
      // T < 0.20: Cooling charcoal smoke (#475569 -> #1E293B)
      let r = 1.0;
      let g = 0.95;
      let b = 0.85;

      if (p.type === 'SPARK') {
        r = 1.0;
        g = 0.88;
        b = 0.45;
        p.alpha = (1.0 - lifeRatio) * (Math.random() > 0.15 ? 1.0 : 0.2); // Flickering
      } else if (p.temperature >= 0.75) {
        // Hot Core
        r = 1.0;
        g = 0.92;
        b = 0.8;
        p.alpha = 1.0 - lifeRatio * 0.4;
      } else if (p.temperature >= 0.45) {
        // Amber flame
        const tNorm = (p.temperature - 0.45) / 0.3;
        r = 1.0;
        g = 0.55 + tNorm * 0.35;
        b = 0.18 + tNorm * 0.5;
        p.alpha = 0.85 - lifeRatio * 0.5;
      } else if (p.temperature >= 0.20) {
        // Orange to warm gray
        const tNorm = (p.temperature - 0.20) / 0.25;
        r = 0.65 + tNorm * 0.35;
        g = 0.35 + tNorm * 0.2;
        b = 0.15 + tNorm * 0.1;
        p.alpha = 0.55 * (1.0 - lifeRatio);
      } else {
        // Cooling charcoal dust
        r = 0.28;
        g = 0.32;
        b = 0.38;
        p.alpha = 0.28 * (1.0 - lifeRatio);
      }

      // Expansion of exhaust dots away from engine (Section 19)
      const expansionFactor = 1.0 + lifeRatio * 1.8;
      const currentSize = p.baseSize * expansionFactor * p.alpha;

      pos[idx3] = p.x;
      pos[idx3 + 1] = p.y;
      pos[idx3 + 2] = p.z;

      col[idx3] = r * p.alpha;
      col[idx3 + 1] = g * p.alpha;
      col[idx3 + 2] = b * p.alpha;

      siz[i] = currentSize;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  private findAvailableParticle(): DotParticle | null {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

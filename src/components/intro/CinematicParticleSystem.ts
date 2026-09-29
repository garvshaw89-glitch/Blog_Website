import * as THREE from 'three';
import { IntroStageId } from './types';

/**
 * CINEMATIC LIVING PARTICLE SYSTEM
 * 
 * Recreates the exact visual trajectory from the reference video:
 * 1. VOID: Floating depth bokeh particles
 * 2. TERRAIN: Undulating wave mesh landscape with glowing central light avenue
 * 3. METROPOLIS: Digital ground grid & floating overhead particle canopy
 * 4. QUANTUM_ORB: Swirling spherical vortex filaments
 * 5. PORTAL: Dimensional warp iris expansion towards camera
 */
export class CinematicParticleSystem {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.CanvasTexture;

  private count: number;
  private positions: Float32Array;
  private colors: Float32Array;
  private velocities: Float32Array;
  private targetPositions: Float32Array;
  private baseColors: Float32Array;
  private targetColors: Float32Array;

  // Grid coordinates for terrain mapping
  private gridCoords: Float32Array;

  constructor(isMobile: boolean = false) {
    this.count = isMobile ? 2200 : 4200;

    this.positions = new Float32Array(this.count * 3);
    this.targetPositions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.baseColors = new Float32Array(this.count * 3);
    this.targetColors = new Float32Array(this.count * 3);
    this.gridCoords = new Float32Array(this.count * 2);

    // Procedural soft glowing bokeh circle sprite
    this.texture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(245, 248, 255, 0.9)');
        grad.addColorStop(0.55, 'rgba(180, 210, 255, 0.28)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(cvs);
    })();

    // Initialize initial random void positions
    const sqrtCount = Math.floor(Math.sqrt(this.count));
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Deep void distribution
      const r = 2.0 + Math.pow(Math.random(), 0.5) * 14.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const px = r * Math.sin(phi) * Math.cos(theta);
      const py = r * Math.sin(phi) * Math.sin(theta);
      const pz = r * Math.cos(phi);

      this.positions[i3] = px;
      this.positions[i3 + 1] = py;
      this.positions[i3 + 2] = pz;

      this.targetPositions[i3] = px;
      this.targetPositions[i3 + 1] = py;
      this.targetPositions[i3 + 2] = pz;

      // Color: soft monochrome with rare cyan/gold accents
      const isAccent = Math.random() < 0.08;
      const cr = isAccent ? 0.95 : 0.85 + Math.random() * 0.15;
      const cg = isAccent ? 0.88 : 0.88 + Math.random() * 0.12;
      const cb = isAccent ? 0.65 : 0.95 + Math.random() * 0.05;

      this.colors[i3] = cr;
      this.colors[i3 + 1] = cg;
      this.colors[i3 + 2] = cb;

      this.baseColors[i3] = cr;
      this.baseColors[i3 + 1] = cg;
      this.baseColors[i3 + 2] = cb;

      this.targetColors[i3] = cr;
      this.targetColors[i3 + 1] = cg;
      this.targetColors[i3 + 2] = cb;

      // Pre-compute 2D grid index for wave terrain
      const gx = (i % sqrtCount) / sqrtCount;
      const gz = Math.floor(i / sqrtCount) / sqrtCount;
      this.gridCoords[i * 2] = gx;
      this.gridCoords[i * 2 + 1] = gz;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.14,
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  public setStage(stage: IntroStageId, time: number) {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      const gx = this.gridCoords[i2];
      const gz = this.gridCoords[i2 + 1];

      if (stage === 'VOID') {
        // Form 1: Deep cosmic void field
        const r = 2.5 + Math.pow(Math.random(), 0.6) * 12.0;
        const theta = (i / this.count) * Math.PI * 2 * 17;
        const phi = Math.acos(2 * (i / this.count) - 1);

        this.targetPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        this.targetPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        this.targetPositions[i3 + 2] = r * Math.cos(phi);

        this.targetColors[i3] = 0.9;
        this.targetColors[i3 + 1] = 0.92;
        this.targetColors[i3 + 2] = 1.0;
      } else if (stage === 'TERRAIN' || stage === 'METROPOLIS') {
        // Form 2 & 3: Undulating Mountain Wave Terrain with Central Light Runway
        const isCanopy = stage === 'METROPOLIS' && i < this.count * 0.22;

        if (isCanopy) {
          // Floating Circular Disc Canopy above the metropolis (00:03 - 00:04)
          const angle = (i / (this.count * 0.22)) * Math.PI * 2 * 6;
          const radius = 1.2 + Math.sqrt(Math.random()) * 3.4;
          this.targetPositions[i3] = Math.cos(angle) * radius;
          this.targetPositions[i3 + 1] = 3.6 + (Math.random() - 0.5) * 0.4;
          this.targetPositions[i3 + 2] = -1.0 + Math.sin(angle) * radius * 0.7;

          // Warm gold / champagne canopy
          this.targetColors[i3] = 1.0;
          this.targetColors[i3 + 1] = 0.88;
          this.targetColors[i3 + 2] = 0.55;
        } else {
          // Continuous 3D Wave Terrain Grid
          const worldX = (gx - 0.5) * 28.0;
          const worldZ = (gz - 0.5) * 24.0 - 1.0;

          // Central illuminated highway:
          const distFromCenter = Math.abs(worldX);
          const isRoad = distFromCenter < 2.0;

          let elev = -1.8;
          if (isRoad) {
            // Flat smooth runway
            elev = -1.7 + Math.sin(worldZ * 0.4 - time * 1.5) * 0.12;
            this.targetColors[i3] = 0.95;
            this.targetColors[i3 + 1] = 0.98;
            this.targetColors[i3 + 2] = 1.2; // Glowing cyan-white runway
          } else {
            // Left & Right Mountain Wave Ridges
            const ridgeFactor = Math.min(3.5, (distFromCenter - 1.8) * 0.65);
            const wave1 = Math.sin(worldX * 0.35 + worldZ * 0.25 - time * 1.2);
            const wave2 = Math.cos(worldX * 0.5 - worldZ * 0.4 + time * 0.8);
            elev = -1.8 + ridgeFactor * (1.1 + wave1 * 0.6 + wave2 * 0.4);

            // Crests are brighter silver-white, valleys are deeper twilight slate
            const brightness = Math.max(0.2, (elev + 1.8) / 3.0);
            this.targetColors[i3] = 0.4 + brightness * 0.55;
            this.targetColors[i3 + 1] = 0.5 + brightness * 0.5;
            this.targetColors[i3 + 2] = 0.7 + brightness * 0.4;
          }

          this.targetPositions[i3] = worldX;
          this.targetPositions[i3 + 1] = elev;
          this.targetPositions[i3 + 2] = worldZ;
        }
      } else if (stage === 'QUANTUM_ORB') {
        // Form 4: Pulsating Energy Sphere with Swirling Vortex Filaments (00:05 - 00:06)
        const u = i / this.count;
        const phi = Math.acos(2 * u - 1);
        const theta = Math.sqrt(this.count * Math.PI) * phi * 2.5 + time * 0.8;

        // Spherical surface with harmonic standing wave displacement
        const wave =
          Math.sin(phi * 6.0 + theta * 3.0 + time * 2.0) * 0.28 +
          Math.cos(phi * 4.0 - time * 1.5) * 0.15;
        const baseRadius = 2.4 + wave;

        this.targetPositions[i3] = baseRadius * Math.sin(phi) * Math.cos(theta);
        this.targetPositions[i3 + 1] = baseRadius * Math.sin(phi) * Math.sin(theta);
        this.targetPositions[i3 + 2] = baseRadius * Math.cos(phi);

        // Radiant crystalline white core with violet/cyan aura
        const isCore = Math.sin(phi * 8) > 0.4;
        this.targetColors[i3] = isCore ? 1.0 : 0.75;
        this.targetColors[i3 + 1] = isCore ? 0.98 : 0.82;
        this.targetColors[i3 + 2] = isCore ? 1.3 : 1.25;
      } else if (stage === 'PORTAL') {
        // Form 5: Dimensional Warp Iris Expansion (00:07)
        // Particles blast outward radially past camera
        const angle = Math.random() * Math.PI * 2;
        const spreadR = 2.5 + Math.random() * 12.0;

        this.targetPositions[i3] = Math.cos(angle) * spreadR;
        this.targetPositions[i3 + 1] = Math.sin(angle) * spreadR;
        this.targetPositions[i3 + 2] = 15.0 + Math.random() * 20.0; // Fly past camera

        this.targetColors[i3] = 1.0;
        this.targetColors[i3 + 1] = 1.0;
        this.targetColors[i3 + 2] = 1.5;
      }
    }
  }

  public update(
    time: number,
    delta: number,
    stage: IntroStageId,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const col = this.geometry.attributes.color.array as Float32Array;

    // Dynamically recalculate wave motion if in TERRAIN or METROPOLIS stage
    if (stage === 'TERRAIN' || stage === 'METROPOLIS') {
      const sqrtCount = Math.floor(Math.sqrt(this.count));
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const isCanopy = stage === 'METROPOLIS' && i < this.count * 0.22;

        if (isCanopy) {
          // Rotate canopy softly
          const angle = (i / (this.count * 0.22)) * Math.PI * 2 * 6 + time * 0.25;
          const radius = 1.2 + Math.sqrt((i % 100) / 100) * 3.4;
          this.targetPositions[i3] = Math.cos(angle) * radius;
          this.targetPositions[i3 + 2] = -1.0 + Math.sin(angle) * radius * 0.7;
        } else {
          const gx = this.gridCoords[i * 2];
          const gz = this.gridCoords[i * 2 + 1];
          const worldX = (gx - 0.5) * 28.0;
          const worldZ = (gz - 0.5) * 24.0 - 1.0;

          const distFromCenter = Math.abs(worldX);
          const isRoad = distFromCenter < 2.0;

          if (isRoad) {
            this.targetPositions[i3 + 1] = -1.7 + Math.sin(worldZ * 0.4 - time * 2.0) * 0.12;
          } else {
            const ridgeFactor = Math.min(3.5, (distFromCenter - 1.8) * 0.65);
            const wave1 = Math.sin(worldX * 0.35 + worldZ * 0.25 - time * 1.4);
            const wave2 = Math.cos(worldX * 0.5 - worldZ * 0.4 + time * 1.0);
            this.targetPositions[i3 + 1] = -1.8 + ridgeFactor * (1.1 + wave1 * 0.6 + wave2 * 0.4);
          }
        }
      }
    } else if (stage === 'QUANTUM_ORB') {
      // Rotate and pulsate the orb filaments
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const u = i / this.count;
        const phi = Math.acos(2 * u - 1);
        const theta = Math.sqrt(this.count * Math.PI) * phi * 2.5 + time * 1.2;

        const wave =
          Math.sin(phi * 6.0 + theta * 3.0 + time * 2.2) * 0.28 +
          Math.cos(phi * 4.0 - time * 1.8) * 0.15;
        const baseRadius = 2.4 + wave;

        this.targetPositions[i3] = baseRadius * Math.sin(phi) * Math.cos(theta);
        this.targetPositions[i3 + 1] = baseRadius * Math.sin(phi) * Math.sin(theta);
        this.targetPositions[i3 + 2] = baseRadius * Math.cos(phi);
      }
    }

    // Physical spring & morph interpolation to targets
    const morphSpeed = stage === 'PORTAL' || isTransitioning ? 0.12 : 0.055;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const tx = this.targetPositions[i3] - mouseX * 0.4;
      const ty = this.targetPositions[i3 + 1] + mouseY * 0.3;
      const tz = this.targetPositions[i3 + 2];

      if (stage === 'PORTAL' || isTransitioning) {
        // Warp acceleration towards camera
        pos[i3] += (pos[i3] * 0.08);
        pos[i3 + 1] += (pos[i3 + 1] * 0.08);
        pos[i3 + 2] += 0.8 + Math.random() * 0.6;
      } else {
        pos[i3] += (tx - pos[i3]) * morphSpeed;
        pos[i3 + 1] += (ty - pos[i3 + 1]) * morphSpeed;
        pos[i3 + 2] += (tz - pos[i3 + 2]) * morphSpeed;
      }

      // Smooth color morphing
      col[i3] += (this.targetColors[i3] - col[i3]) * 0.06;
      col[i3 + 1] += (this.targetColors[i3 + 1] - col[i3 + 1]) * 0.06;
      col[i3 + 2] += (this.targetColors[i3 + 2] - col[i3 + 2]) * 0.06;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

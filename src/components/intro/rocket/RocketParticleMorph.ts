import * as THREE from 'three';
import { buildRocketParticleBlueprint } from '../../cursor/rocketBlueprint';
import { RocketSurfaceSample } from './RocketModel';

const _worldPt = new THREE.Vector3();
const _ndcVec = new THREE.Vector3();

function smootherstep(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * RocketParticleMorph (Scene 05):
 * Continuous visual transformation from the landed full-size 3D PBR RocketModel
 * into thousands of luminous particles that break apart, swirl across the canvas,
 * and reassemble into the exact miniature cursor rocket positioned over the user's pointer.
 */
export class RocketParticleMorph {
  public readonly points: THREE.Points;

  private count: number;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;

  private startWorld: Float32Array;
  private scatterPos: Float32Array;
  private targetLocalCursorPx: Float32Array; // Local offset in px relative to pointer (0, 0) nose tip
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private seeds: Float32Array;

  private initializedStart = false;

  constructor(samples: RocketSurfaceSample[]) {
    this.count = samples.length;
    const cursorBlueprint = buildRocketParticleBlueprint();

    this.geometry = new THREE.BufferGeometry();
    this.startWorld = new Float32Array(this.count * 3);
    this.scatterPos = new Float32Array(this.count * 3);
    this.targetLocalCursorPx = new Float32Array(this.count * 2);
    this.positions = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);
    this.seeds = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      const s = samples[i];

      // Store local sample position temporarily until captureLandedPose() converts to world
      this.startWorld[i3] = s.position.x;
      this.startWorld[i3 + 1] = s.position.y;
      this.startWorld[i3 + 2] = s.position.z;

      this.colors[i3] = s.color.r;
      this.colors[i3 + 1] = s.color.g;
      this.colors[i3 + 2] = s.color.b;

      this.sizes[i] = s.size;
      this.seeds[i] = Math.random() * Math.PI * 2;

      // Map each particle deterministically to a target point on the miniature cursor rocket (scale=1.0)
      const bp = cursorBlueprint[i % cursorBlueprint.length];
      this.targetLocalCursorPx[i2] = bp.lx + (Math.random() - 0.5) * 0.45;
      this.targetLocalCursorPx[i2 + 1] = bp.ly + (Math.random() - 0.5) * 0.45;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uShrink: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        uniform float uPixelRatio;
        uniform float uShrink;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float baseScale = mix(1.45, 0.72, uShrink);
          gl_PointSize = aSize * baseScale * uPixelRatio * (34.0 / max(2.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.05, d);
          float alpha = pow(core, 1.35) * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    this.points.frustumCulled = false;
  }

  public setPixelRatio(dpr: number): void {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  /**
   * Captures the exact landed 3D rocket world matrix so particle dispersion starts
   * millimeter-accurately from the physical 3D hull surface.
   */
  public captureLandedPose(rocketGroup: THREE.Group): void {
    if (this.initializedStart) return;
    this.initializedStart = true;
    rocketGroup.updateMatrixWorld(true);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      _worldPt.set(
        this.startWorld[i3],
        this.startWorld[i3 + 1],
        this.startWorld[i3 + 2]
      );
      _worldPt.applyMatrix4(rocketGroup.matrixWorld);

      this.startWorld[i3] = _worldPt.x;
      this.startWorld[i3 + 1] = _worldPt.y;
      this.startWorld[i3 + 2] = _worldPt.z;

      this.positions[i3] = _worldPt.x;
      this.positions[i3 + 1] = _worldPt.y;
      this.positions[i3 + 2] = _worldPt.z;

      // Controlled swirling break-apart scatter position in world space
      const theta = Math.atan2(_worldPt.z, _worldPt.x) + (Math.random() - 0.5) * 1.4;
      const radialBurst = 1.15 + Math.random() * 2.2;
      this.scatterPos[i3] = _worldPt.x + Math.cos(theta) * radialBurst;
      this.scatterPos[i3 + 1] = _worldPt.y + (Math.random() - 0.35) * 2.1;
      this.scatterPos[i3 + 2] = _worldPt.z + Math.sin(theta) * radialBurst * 0.65;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Advances the break-apart -> swirl -> miniature cursor convergence animation.
   * @param progress Normalized morph progress [0..1]
   * @param pointerX Target CSS clientX (pointer hotspot)
   * @param pointerY Target CSS clientY (pointer hotspot)
   * @param camera Active Three.js PerspectiveCamera used for exact screen-to-world projection
   */
  public update(
    progress: number,
    elapsed: number,
    pointerX: number,
    pointerY: number,
    camera: THREE.PerspectiveCamera
  ): void {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    if (p <= 0.001) {
      this.points.visible = false;
      return;
    }

    this.points.visible = true;
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;

    // Subtle shimmering orbital slipstream accompanying the shrinking rocket, clearing cleanly before handoff
    const fadeIn = Math.min(1, p / 0.14);
    const fadeOut = p > 0.72 ? Math.max(0, 1 - (p - 0.72) / 0.24) : 1;
    this.material.uniforms.uOpacity.value = fadeIn * fadeOut * 0.38;

    // Project pointer pixel coordinates into world space on z = 4.2 (near foreground plane)
    const targetZ = 4.2;
    const ndcX = (pointerX / vw) * 2 - 1;
    const ndcY = -(pointerY / vh) * 2 + 1;
    _ndcVec.set(ndcX, ndcY, 0.5).unproject(camera);
    const dir = _ndcVec.sub(camera.position).normalize();
    const tPlane = (targetZ - camera.position.z) / dir.z;
    const targetCenterWorldX = camera.position.x + dir.x * tPlane;
    const targetCenterWorldY = camera.position.y + dir.y * tPlane;

    // World units per CSS pixel at z = targetZ
    const distToPlane = Math.abs(camera.position.z - targetZ);
    const visibleHeightWorld = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distToPlane;
    const worldPerPx = visibleHeightWorld / vh;

    // 0.00 -> 0.36: Break apart into controlled glowing swirl
    // 0.36 -> 1.00: Converge tightly into miniature rocket at live cursor coordinates
    const breakPhase = smootherstep(Math.min(1, p / 0.36));
    const convergePhase = smootherstep(Math.max(0, (p - 0.3) / 0.7));
    this.material.uniforms.uShrink.value = convergePhase;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const i2 = i * 2;
      const seed = this.seeds[i];

      // Break-apart position from landed 3D surface
      const sx = THREE.MathUtils.lerp(this.startWorld[i3], this.scatterPos[i3], breakPhase);
      const sy = THREE.MathUtils.lerp(this.startWorld[i3 + 1], this.scatterPos[i3 + 1], breakPhase);
      const sz = THREE.MathUtils.lerp(this.startWorld[i3 + 2], this.scatterPos[i3 + 2], breakPhase);

      // Gentle orbital swirl during mid-transition
      const swirlAmp = Math.sin(p * Math.PI) * 0.35 * (1 - convergePhase * 0.85);
      const swX = Math.cos(elapsed * 4.5 + seed) * swirlAmp;
      const swY = Math.sin(elapsed * 3.8 + seed) * swirlAmp;

      // Exact screen-aligned miniature cursor rocket target (flip Y since CSS +Y is down, Three.js +Y is up)
      const tx = targetCenterWorldX + this.targetLocalCursorPx[i2] * worldPerPx;
      const ty = targetCenterWorldY - this.targetLocalCursorPx[i2 + 1] * worldPerPx;
      const tz = targetZ;

      this.positions[i3] = THREE.MathUtils.lerp(sx + swX, tx, convergePhase);
      this.positions[i3 + 1] = THREE.MathUtils.lerp(sy + swY, ty, convergePhase);
      this.positions[i3 + 2] = THREE.MathUtils.lerp(sz, tz, convergePhase);
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

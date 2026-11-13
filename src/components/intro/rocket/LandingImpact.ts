import * as THREE from 'three';

function createGroundGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 232, 188, 0.95)');
  grad.addColorStop(0.28, 'rgba(125, 211, 252, 0.55)');
  grad.addColorStop(0.65, 'rgba(56, 189, 248, 0.16)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * LandingImpact:
 * Heavy cinematic center touchdown effects:
 * - Expanding ground shockwave distortion ring
 * - Subtle illuminated ground plane beneath rocket legs
 * - Outward-billowing base smoke & glowing dust spark particles
 */
export class LandingImpact {
  public readonly group = new THREE.Group();

  private groundGlowGeo: THREE.PlaneGeometry;
  private groundGlowMat: THREE.MeshBasicMaterial;
  private groundGlowTex: THREE.CanvasTexture;
  private groundGlowMesh: THREE.Mesh;

  private shockGeo: THREE.PlaneGeometry;
  private shockMat: THREE.ShaderMaterial;
  private shockMesh: THREE.Mesh;

  private count: number;
  private burstGeo: THREE.BufferGeometry;
  private burstMat: THREE.ShaderMaterial;
  private positions: Float32Array;
  private velocities: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private size: Float32Array;
  private kind: Float32Array; // 0 = expanding smoke, 1 = glowing ground spark

  private triggered = false;
  private age = 0;

  constructor(particleCount: number) {
    this.count = particleCount;

    // 1. Ground Illumination Plane
    this.groundGlowTex = createGroundGlowTexture();
    this.groundGlowGeo = new THREE.PlaneGeometry(7.5, 7.5);
    this.groundGlowMat = new THREE.MeshBasicMaterial({
      map: this.groundGlowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.groundGlowMesh = new THREE.Mesh(this.groundGlowGeo, this.groundGlowMat);
    this.groundGlowMesh.rotation.x = -Math.PI / 2;
    this.groundGlowMesh.position.y = 0.01;
    this.group.add(this.groundGlowMesh);

    // 2. Expanding Shockwave Distortion & Dust Ring Shader
    this.shockGeo = new THREE.PlaneGeometry(14, 14);
    this.shockMat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uProgress;
        uniform float uOpacity;

        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float ringPos = 0.08 + uProgress * 0.85;
          float ring = exp(-pow((dist - ringPos) * 16.0, 2.0));
          float secondaryRing = exp(-pow((dist - ringPos * 0.72) * 12.0, 2.0)) * 0.45;
          float rimFade = smoothstep(1.0, 0.75, dist);

          vec3 col = mix(vec3(0.55, 0.85, 1.0), vec3(1.0, 0.95, 0.88), ring);
          float alpha = (ring + secondaryRing) * rimFade * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shockMesh = new THREE.Mesh(this.shockGeo, this.shockMat);
    this.shockMesh.rotation.x = -Math.PI / 2;
    this.shockMesh.position.y = 0.025;
    this.group.add(this.shockMesh);

    // 3. Radial Expanding Smoke & Dust Spark Particles
    this.burstGeo = new THREE.BufferGeometry();
    this.positions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.life = new Float32Array(particleCount);
    this.maxLife = new Float32Array(particleCount);
    this.size = new Float32Array(particleCount);
    this.kind = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      this.life[i] = 999;
      this.maxLife[i] = 1;
    }

    this.burstGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.burstGeo.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1));
    this.burstGeo.setAttribute('aMaxLife', new THREE.BufferAttribute(this.maxLife, 1));
    this.burstGeo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.burstGeo.setAttribute('aKind', new THREE.BufferAttribute(this.kind, 1));

    this.burstMat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aLife;
        attribute float aMaxLife;
        attribute float aSize;
        attribute float aKind;
        uniform float uPixelRatio;
        varying float vProg;
        varying float vKind;

        void main() {
          vProg = clamp(aLife / max(0.001, aMaxLife), 0.0, 1.0);
          vKind = aKind;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float expand = mix(1.0, aKind < 0.5 ? 2.6 : 0.4, vProg);
          gl_PointSize = aSize * expand * uPixelRatio * (46.0 / max(1.5, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vProg;
        varying float vKind;

        void main() {
          if (vProg >= 0.995) discard;
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          if (vKind > 0.5) {
            float glow = pow(smoothstep(0.5, 0.0, d), 1.7);
            vec3 c = mix(vec3(1.0, 0.92, 0.72), vec3(0.45, 0.85, 1.0), vProg);
            gl_FragColor = vec4(c, glow * (1.0 - vProg) * 0.95);
          } else {
            float cloud = smoothstep(0.5, 0.05, d);
            vec3 smoke = mix(vec3(0.84, 0.88, 0.95), vec3(0.35, 0.42, 0.52), vProg);
            gl_FragColor = vec4(smoke, cloud * (1.0 - vProg) * (1.0 - vProg) * 0.34);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(this.burstGeo, this.burstMat);
    points.frustumCulled = false;
    this.group.add(points);
  }

  public setPixelRatio(dpr: number): void {
    this.burstMat.uniforms.uPixelRatio.value = dpr;
  }

  public trigger(groundY: number, groundZ = 1.1): void {
    this.group.position.set(0, groundY, groundZ);
    this.triggered = true;
    this.age = 0;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const theta = (i / this.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const isSpark = i % 3 === 0;
      const radialSpeed = isSpark ? 3.5 + Math.random() * 5.2 : 1.6 + Math.random() * 3.4;

      this.positions[i3] = Math.cos(theta) * (0.25 + Math.random() * 0.45);
      this.positions[i3 + 1] = 0.05 + Math.random() * 0.25;
      this.positions[i3 + 2] = Math.sin(theta) * (0.25 + Math.random() * 0.45);

      this.velocities[i3] = Math.cos(theta) * radialSpeed;
      this.velocities[i3 + 1] = isSpark ? 0.8 + Math.random() * 2.2 : 0.25 + Math.random() * 0.9;
      this.velocities[i3 + 2] = Math.sin(theta) * radialSpeed;

      this.life[i] = 0;
      this.maxLife[i] = isSpark ? 0.65 + Math.random() * 0.45 : 1.15 + Math.random() * 0.65;
      this.size[i] = isSpark ? 1.1 + Math.random() * 1.1 : 3.2 + Math.random() * 2.8;
      this.kind[i] = isSpark ? 1 : 0;
    }

    this.burstGeo.attributes.position.needsUpdate = true;
    this.burstGeo.attributes.aLife.needsUpdate = true;
    this.burstGeo.attributes.aMaxLife.needsUpdate = true;
    this.burstGeo.attributes.aSize.needsUpdate = true;
    this.burstGeo.attributes.aKind.needsUpdate = true;
  }

  public setHoverIllumination(groundY: number, intensity: number): void {
    this.group.position.y = groundY;
    if (!this.triggered) {
      this.groundGlowMat.opacity = Math.min(0.65, intensity * 0.45);
      const s = 0.7 + intensity * 0.35;
      this.groundGlowMesh.scale.set(s, s, 1);
    }
  }

  public update(delta: number): void {
    if (!this.triggered) return;
    this.age += delta;

    // Ground glow surge + calm shutdown fade
    const glowEnv = Math.exp(-this.age * 1.65);
    this.groundGlowMat.opacity = 0.82 * glowEnv;
    const gs = 1.0 + Math.min(1, this.age * 1.8) * 0.55;
    this.groundGlowMesh.scale.set(gs, gs, 1);

    // Expanding shockwave ring (0 -> 0.95s)
    const shockP = Math.min(1, this.age / 0.95);
    this.shockMat.uniforms.uProgress.value = shockP;
    this.shockMat.uniforms.uOpacity.value = Math.pow(1 - shockP, 1.6) * 0.9;

    let anyUpdated = false;
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] >= this.maxLife[i]) continue;
      anyUpdated = true;
      this.life[i] += delta;
      const i3 = i * 3;
      this.positions[i3] += this.velocities[i3] * delta;
      this.positions[i3 + 1] = Math.max(0.02, this.positions[i3 + 1] + this.velocities[i3 + 1] * delta);
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

      if (this.kind[i] > 0.5) {
        this.velocities[i3 + 1] -= 3.8 * delta; // Gravity on ground sparks
      }
      this.velocities[i3] *= 0.95;
      this.velocities[i3 + 2] *= 0.95;
    }

    if (anyUpdated) {
      this.burstGeo.attributes.position.needsUpdate = true;
      this.burstGeo.attributes.aLife.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.groundGlowGeo.dispose();
    this.groundGlowMat.dispose();
    this.groundGlowTex.dispose();
    this.shockGeo.dispose();
    this.shockMat.dispose();
    this.burstGeo.dispose();
    this.burstMat.dispose();
  }
}

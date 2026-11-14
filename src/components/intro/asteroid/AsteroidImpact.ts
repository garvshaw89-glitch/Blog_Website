import * as THREE from 'three';

function createImpactCoreTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 2, 128, 128, 128);
  grad.addColorStop(0.0, 'rgba(255, 251, 235, 1)');
  grad.addColorStop(0.22, 'rgba(253, 186, 116, 0.85)');
  grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.35)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface RockShard {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  baseScale: number;
  maxLife: number;
}

/**
 * Screen-facing asteroid crash impact controller:
 * - Double expanding atmospheric shockwave & luminous fracture filaments facing +Z camera
 * - Incandescent impact core flash halo
 * - 3D tumbling rock-shard splinters & radial pulverized cosmic regolith / spark ejecta
 */
export class AsteroidImpact {
  public readonly group = new THREE.Group();

  private coreGeo: THREE.PlaneGeometry;
  private coreMat: THREE.MeshBasicMaterial;
  private coreTex: THREE.CanvasTexture;
  private coreMesh: THREE.Mesh;

  private shockGeo: THREE.PlaneGeometry;
  private shockMat: THREE.ShaderMaterial;
  private shockMesh: THREE.Mesh;

  private shardGeo: THREE.DodecahedronGeometry;
  private shardMat: THREE.MeshStandardMaterial;
  private shards: RockShard[] = [];

  private count: number;
  private burstGeo: THREE.BufferGeometry;
  private burstMat: THREE.ShaderMaterial;
  private positions: Float32Array;
  private velocities: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private size: Float32Array;
  private kind: Float32Array; // 0 = dust puff, 1 = fiery spark

  private triggered = false;
  private age = 0;

  constructor(particleCount: number, shardCount: number, materialTemplate: THREE.MeshStandardMaterial) {
    this.count = particleCount;

    // 1. Central Impact Core Flash Halo (faces +Z toward viewer)
    this.coreTex = createImpactCoreTexture();
    this.coreGeo = new THREE.PlaneGeometry(7.2, 7.2);
    this.coreMat = new THREE.MeshBasicMaterial({
      map: this.coreTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.group.add(this.coreMesh);

    // 2. Screen-Facing Double Shockwave & Impact Fracture Filaments Shader
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
          vec2 p = (vUv - vec2(0.5)) * 2.0;
          float dist = length(p);
          float ang = atan(p.y, p.x);

          float ringPos = 0.06 + uProgress * 0.88;
          float primaryRing = exp(-pow((dist - ringPos) * 18.0, 2.0));
          float secondaryRing = exp(-pow((dist - ringPos * 0.68) * 14.0, 2.0)) * 0.52;

          // Subtle luminous fracture rays radiating from center impact point
          float rays = pow(abs(sin(ang * 9.0 + sin(ang * 4.0) * 1.4)), 14.0);
          float rayEnv = smoothstep(0.02, 0.14, dist) * smoothstep(ringPos + 0.08, 0.05, dist) * (1.0 - uProgress * 0.85);
          float rimFade = smoothstep(1.0, 0.72, dist);

          vec3 col = mix(vec3(1.0, 0.62, 0.24), vec3(0.75, 0.92, 1.0), secondaryRing * 0.85);
          col = mix(col, vec3(1.0, 0.96, 0.86), rays * rayEnv);

          float alpha = (primaryRing * 0.95 + secondaryRing + rays * rayEnv * 0.65) * rimFade * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shockMesh = new THREE.Mesh(this.shockGeo, this.shockMat);
    this.shockMesh.position.z = 0.02;
    this.group.add(this.shockMesh);

    // 3. 3D Fractured Rock Shards flying outward on impact
    this.shardGeo = new THREE.DodecahedronGeometry(0.11, 0);
    this.shardMat = materialTemplate.clone();
    this.shardMat.emissive.set(0xf97316);
    this.shardMat.emissiveIntensity = 0.75;
    for (let i = 0; i < shardCount; i++) {
      const m = new THREE.Mesh(this.shardGeo, this.shardMat);
      m.visible = false;
      this.group.add(m);
      this.shards.push({
        mesh: m,
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        baseScale: 0.45 + Math.random() * 0.95,
        maxLife: 1.0 + Math.random() * 0.5,
      });
    }

    // 4. Radial Regolith Dust & Incandescent Ember Sparks
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
          float expand = mix(1.0, aKind < 0.5 ? 2.4 : 0.35, vProg);
          gl_PointSize = aSize * expand * uPixelRatio * (44.0 / max(1.5, -mvPosition.z));
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
            float glow = pow(smoothstep(0.5, 0.0, d), 1.65);
            vec3 c = mix(vec3(1.0, 0.88, 0.62), vec3(0.98, 0.45, 0.14), vProg);
            gl_FragColor = vec4(c, glow * (1.0 - vProg) * 0.98);
          } else {
            float cloud = smoothstep(0.5, 0.06, d);
            vec3 smoke = mix(vec3(0.74, 0.72, 0.68), vec3(0.28, 0.27, 0.26), vProg);
            gl_FragColor = vec4(smoke, cloud * (1.0 - vProg) * (1.0 - vProg) * 0.38);
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

  public trigger(impactX = 0, impactY = 0, impactZ = 3.2): void {
    this.group.position.set(impactX, impactY, impactZ);
    this.triggered = true;
    this.age = 0;

    for (let i = 0; i < this.shards.length; i++) {
      const sh = this.shards[i];
      const theta = (i / this.shards.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const spd = 3.2 + Math.random() * 4.8;
      sh.mesh.visible = true;
      sh.mesh.position.set(Math.cos(theta) * 0.18, Math.sin(theta) * 0.18, 0);
      sh.mesh.scale.set(
        sh.baseScale * (0.7 + Math.random() * 0.6),
        sh.baseScale * (0.6 + Math.random() * 0.5),
        sh.baseScale * (0.7 + Math.random() * 0.6)
      );
      sh.vel.set(Math.cos(theta) * spd, Math.sin(theta) * spd, (Math.random() - 0.35) * 2.4);
      sh.spin.set(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );
    }

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const theta = (i / this.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.42;
      const isSpark = i % 2 === 0;
      const radialSpeed = isSpark ? 3.8 + Math.random() * 6.4 : 1.8 + Math.random() * 3.8;

      this.positions[i3] = Math.cos(theta) * (0.12 + Math.random() * 0.35);
      this.positions[i3 + 1] = Math.sin(theta) * (0.12 + Math.random() * 0.35);
      this.positions[i3 + 2] = (Math.random() - 0.5) * 0.3;

      this.velocities[i3] = Math.cos(theta) * radialSpeed;
      this.velocities[i3 + 1] = Math.sin(theta) * radialSpeed;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 1.8;

      this.life[i] = 0;
      this.maxLife[i] = isSpark ? 0.62 + Math.random() * 0.48 : 0.95 + Math.random() * 0.65;
      this.size[i] = isSpark ? 1.15 + Math.random() * 1.35 : 2.8 + Math.random() * 2.8;
      this.kind[i] = isSpark ? 1 : 0;
    }

    this.burstGeo.attributes.position.needsUpdate = true;
    this.burstGeo.attributes.aLife.needsUpdate = true;
    this.burstGeo.attributes.aMaxLife.needsUpdate = true;
    this.burstGeo.attributes.aSize.needsUpdate = true;
    this.burstGeo.attributes.aKind.needsUpdate = true;
  }

  public update(delta: number): void {
    if (!this.triggered) return;
    this.age += delta;

    // 1. Core Impact Flash Halo
    const flashEnv = Math.exp(-this.age * 3.2);
    this.coreMat.opacity = 0.95 * flashEnv;
    const cs = 0.6 + Math.min(1.5, this.age * 3.6);
    this.coreMesh.scale.set(cs, cs, 1);

    // 2. Shockwave & Fracture Rays
    const shockP = Math.min(1, this.age / 0.85);
    this.shockMat.uniforms.uProgress.value = shockP;
    this.shockMat.uniforms.uOpacity.value = Math.pow(1 - shockP, 1.45) * 0.92;

    // 3. Tumbling Rock Shards cooling & flying outward
    this.shardMat.emissiveIntensity = Math.max(0.05, 0.75 * Math.exp(-this.age * 2.2));
    for (let i = 0; i < this.shards.length; i++) {
      const sh = this.shards[i];
      if (!sh.mesh.visible) continue;
      const p = this.age / sh.maxLife;
      if (p >= 1) {
        sh.mesh.visible = false;
        continue;
      }
      sh.mesh.position.addScaledVector(sh.vel, delta);
      sh.vel.multiplyScalar(Math.pow(0.28, delta));
      sh.mesh.rotation.x += sh.spin.x * delta;
      sh.mesh.rotation.y += sh.spin.y * delta;
      sh.mesh.rotation.z += sh.spin.z * delta;
      const fadeScale = Math.max(0.01, (1 - p * 0.85) * sh.baseScale);
      sh.mesh.scale.setScalar(fadeScale);
    }

    // 4. Regolith Dust & Fiery Ember Sparks
    let anyUpdated = false;
    for (let i = 0; i < this.count; i++) {
      if (this.life[i] >= this.maxLife[i]) continue;
      anyUpdated = true;
      this.life[i] += delta;
      const i3 = i * 3;
      this.positions[i3] += this.velocities[i3] * delta;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

      this.velocities[i3] *= 0.94;
      this.velocities[i3 + 1] *= 0.94;
      this.velocities[i3 + 2] *= 0.94;
    }

    if (anyUpdated) {
      this.burstGeo.attributes.position.needsUpdate = true;
      this.burstGeo.attributes.aLife.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.coreGeo.dispose();
    this.coreMat.dispose();
    this.coreTex.dispose();
    this.shockGeo.dispose();
    this.shockMat.dispose();
    this.shardGeo.dispose();
    this.shardMat.dispose();
    this.burstGeo.dispose();
    this.burstMat.dispose();
  }
}

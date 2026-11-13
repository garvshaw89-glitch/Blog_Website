import * as THREE from 'three';

const _nozzleWorld = new THREE.Vector3();
const _tailDir = new THREE.Vector3();
const _quat = new THREE.Quaternion();

/**
 * RocketEngineEffects:
 * - Blue-white central Mach exhaust cone with animated shock diamonds (custom GLSL)
 * - Orange-yellow turbulent secondary flame with distortion shader
 * - Heat-distortion shimmer halo behind engine
 * - World-space GPU smoke & ember particle trail + dynamic engine PointLight
 */
export class RocketEngineEffects {
  public readonly nozzleGroup = new THREE.Group();
  public readonly worldGroup = new THREE.Group();
  public readonly engineLight: THREE.PointLight;

  private coreGeo: THREE.ConeGeometry;
  private coreMat: THREE.ShaderMaterial;
  private outerGeo: THREE.ConeGeometry;
  private outerMat: THREE.ShaderMaterial;
  private heatGeo: THREE.PlaneGeometry;
  private heatMat: THREE.ShaderMaterial;

  private trailCount: number;
  private trailGeo: THREE.BufferGeometry;
  private trailMat: THREE.ShaderMaterial;
  private trailPositions: Float32Array;
  private trailVelocities: Float32Array;
  private trailLife: Float32Array;
  private trailMaxLife: Float32Array;
  private trailSize: Float32Array;
  private trailKind: Float32Array; // 0 = volumetric smoke, 1 = glowing ember
  private emitCursor = 0;

  constructor(trailCount: number) {
    this.trailCount = trailCount;

    // 1. Dynamic Engine Illumination Light attached at nozzle throat
    this.engineLight = new THREE.PointLight(0xffb45c, 4.5, 16, 1.8);
    this.engineLight.position.set(0, -0.5, 0.25);
    this.nozzleGroup.add(this.engineLight);

    // 2. Blue-White Central Exhaust Plume + Standing Mach Diamonds (Custom GLSL)
    this.coreGeo = new THREE.ConeGeometry(0.32, 3.2, 24, 16, true);
    this.coreGeo.translate(0, -1.6, 0);
    this.coreGeo.rotateX(Math.PI); // Tip points downward (-Y)
    // Wait: cone tip is at top (+Y) before rotateX(PI), so rotating X by PI puts base at Y=0 and tip at Y=-3.2!
    // Re-orient cleanly: unrotated ConeGeometry has base at -h/2, tip at +h/2.
    this.coreGeo.dispose();
    this.coreGeo = new THREE.ConeGeometry(0.31, 3.2, 24, 16, true);
    this.coreGeo.rotateX(Math.PI); // Now base is at +1.6, tip at -1.6
    this.coreGeo.translate(0, -1.6, 0); // Base cleanly at y=0, tip extends to y=-3.2

    this.coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uThrust: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDist;
        varying vec3 vNormalView;
        uniform float uTime;
        uniform float uThrust;

        void main() {
          vUv = uv;
          vec3 p = position;
          float distFromNozzle = clamp(-p.y / 3.2, 0.0, 1.0);
          vDist = distFromNozzle;
          p.y *= (0.45 + 0.85 * uThrust);
          float wobble = sin(uTime * 34.0 - distFromNozzle * 14.0) * 0.045 * distFromNozzle * uThrust;
          p.x += wobble;
          p.z += cos(uTime * 29.0 - distFromNozzle * 12.0) * 0.045 * distFromNozzle * uThrust;
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vDist;
        varying vec3 vNormalView;
        uniform float uTime;
        uniform float uThrust;

        void main() {
          float mach = pow(0.5 + 0.5 * sin((vDist * 20.0) - uTime * 28.0), 3.0);
          float edgeFade = pow(abs(vNormalView.z), 0.75);
          float axialMask = smoothstep(0.0, 0.08, vDist) * pow(1.0 - vDist, 1.15);

          vec3 whiteHot = vec3(1.0, 0.99, 0.96);
          vec3 machCyan = vec3(0.45, 0.84, 1.0);
          vec3 col = mix(machCyan, whiteHot, 0.45 + 0.55 * mach);

          float alpha = clamp(axialMask * 1.35 * edgeFade * clamp(uThrust, 0.0, 1.25), 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.nozzleGroup.add(coreMesh);

    // 3. Orange-Yellow Turbulent Secondary Flame Cone
    this.outerGeo = new THREE.ConeGeometry(0.52, 4.6, 26, 20, true);
    this.outerGeo.rotateX(Math.PI);
    this.outerGeo.translate(0, -2.3, 0);

    this.outerMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uThrust: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDist;
        varying vec3 vNormalView;
        uniform float uTime;
        uniform float uThrust;

        void main() {
          vUv = uv;
          vec3 p = position;
          float d = clamp(-p.y / 4.6, 0.0, 1.0);
          vDist = d;
          p.y *= (0.4 + 0.95 * uThrust);
          float turb = sin(uTime * 26.0 + d * 18.0 + p.x * 6.0) * 0.11 * d * uThrust;
          p.x += turb;
          p.z += cos(uTime * 24.0 + d * 15.0 + p.z * 6.0) * 0.11 * d * uThrust;
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vDist;
        varying vec3 vNormalView;
        uniform float uTime;
        uniform float uThrust;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          float n = noise(vec2(vUv.x * 8.0, vDist * 10.0 - uTime * 9.0));
          float n2 = noise(vec2(vUv.x * 16.0, vDist * 18.0 - uTime * 15.0));
          float fire = n * 0.65 + n2 * 0.35;

          float radial = pow(abs(vNormalView.z), 0.9);
          float axialMask = smoothstep(0.0, 0.06, vDist) * pow(1.0 - vDist, 1.25);

          vec3 amber = vec3(1.0, 0.72, 0.24);
          vec3 deepOrange = vec3(0.95, 0.34, 0.08);
          vec3 col = mix(deepOrange, amber, fire);

          float alpha = axialMask * (0.45 + 0.55 * fire) * radial * 0.9 * clamp(uThrust, 0.0, 1.3);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const outerMesh = new THREE.Mesh(this.outerGeo, this.outerMat);
    this.nozzleGroup.add(outerMesh);

    // 4. Heat Distortion Aura Billboard behind engine nozzle
    this.heatGeo = new THREE.PlaneGeometry(2.6, 5.2);
    this.heatGeo.translate(0, -2.5, 0);
    this.heatMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uThrust: { value: 1 },
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
        uniform float uTime;
        uniform float uThrust;

        void main() {
          vec2 c = vUv - vec2(0.5, 0.52);
          float d = length(c * vec2(2.2, 1.0));
          float wave = 0.5 + 0.5 * sin(vUv.y * 28.0 - uTime * 22.0 + sin(vUv.x * 12.0));
          float glow = exp(-d * 4.5) * wave * 0.18 * clamp(uThrust, 0.0, 1.2);
          gl_FragColor = vec4(0.75, 0.86, 1.0, glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const heatMesh = new THREE.Mesh(this.heatGeo, this.heatMat);
    this.nozzleGroup.add(heatMesh);

    // 5. World-Space Volumetric Smoke + Incandescent Ember GPU Particle Pool
    this.trailGeo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(trailCount * 3);
    this.trailVelocities = new Float32Array(trailCount * 3);
    this.trailLife = new Float32Array(trailCount);
    this.trailMaxLife = new Float32Array(trailCount);
    this.trailSize = new Float32Array(trailCount);
    this.trailKind = new Float32Array(trailCount);

    for (let i = 0; i < trailCount; i++) {
      this.trailLife[i] = 999;
      this.trailMaxLife[i] = 1;
      this.trailPositions[i * 3 + 2] = -999;
    }

    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeo.setAttribute('aLife', new THREE.BufferAttribute(this.trailLife, 1));
    this.trailGeo.setAttribute('aMaxLife', new THREE.BufferAttribute(this.trailMaxLife, 1));
    this.trailGeo.setAttribute('aSize', new THREE.BufferAttribute(this.trailSize, 1));
    this.trailGeo.setAttribute('aKind', new THREE.BufferAttribute(this.trailKind, 1));

    this.trailMat = new THREE.ShaderMaterial({
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
          float expand = mix(1.0, aKind < 0.5 ? 2.8 : 0.35, vProg);
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
            // Incandescent ember / cyan plasma spark
            float glow = pow(smoothstep(0.5, 0.0, d), 1.6);
            vec3 c = mix(vec3(0.55, 0.88, 1.0), vec3(1.0, 0.72, 0.28), smoothstep(0.15, 0.7, vProg));
            float alpha = glow * (1.0 - vProg) * 0.9;
            gl_FragColor = vec4(c, alpha);
          } else {
            // Soft volumetric exhaust smoke cloud
            float puff = smoothstep(0.5, 0.05, d);
            vec3 smokeCol = mix(vec3(0.75, 0.82, 0.92), vec3(0.32, 0.38, 0.48), vProg);
            float alpha = puff * (1.0 - vProg) * (1.0 - vProg) * 0.24;
            gl_FragColor = vec4(smokeCol, alpha);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const trailPoints = new THREE.Points(this.trailGeo, this.trailMat);
    trailPoints.frustumCulled = false;
    this.worldGroup.add(trailPoints);
  }

  public setPixelRatio(dpr: number): void {
    this.trailMat.uniforms.uPixelRatio.value = dpr;
  }

  private emitTrailParticle(
    origin: THREE.Vector3,
    tailDir: THREE.Vector3,
    rocketScale: number,
    thrust: number,
    isEmber: boolean
  ): void {
    const idx = this.emitCursor;
    this.emitCursor = (this.emitCursor + 1) % this.trailCount;
    const i3 = idx * 3;

    const jitter = (isEmber ? 0.16 : 0.28) * rocketScale;
    this.trailPositions[i3] = origin.x + (Math.random() - 0.5) * jitter;
    this.trailPositions[i3 + 1] = origin.y + (Math.random() - 0.5) * jitter;
    this.trailPositions[i3 + 2] = origin.z + (Math.random() - 0.5) * jitter;

    const speed = (isEmber ? 7.5 : 3.2) * (0.5 + thrust * 0.65);
    const spread = isEmber ? 1.4 : 2.1;
    this.trailVelocities[i3] = tailDir.x * speed + (Math.random() - 0.5) * spread;
    this.trailVelocities[i3 + 1] = tailDir.y * speed + (Math.random() - 0.5) * spread;
    this.trailVelocities[i3 + 2] = tailDir.z * speed + (Math.random() - 0.5) * spread;

    this.trailLife[idx] = 0;
    this.trailMaxLife[idx] = isEmber ? 0.38 + Math.random() * 0.28 : 0.8 + Math.random() * 0.65;
    this.trailSize[idx] = isEmber ? 0.9 + Math.random() * 0.9 : 2.4 + Math.random() * 2.2;
    this.trailKind[idx] = isEmber ? 1 : 0;
  }

  public update(
    elapsed: number,
    delta: number,
    thrust: number,
    rocketGroup: THREE.Group,
    nozzleLocalPos: THREE.Vector3
  ): void {
    this.coreMat.uniforms.uTime.value = elapsed;
    this.coreMat.uniforms.uThrust.value = thrust;
    this.outerMat.uniforms.uTime.value = elapsed;
    this.outerMat.uniforms.uThrust.value = thrust;
    this.heatMat.uniforms.uTime.value = elapsed;
    this.heatMat.uniforms.uThrust.value = thrust;

    this.nozzleGroup.visible = thrust > 0.015;
    this.engineLight.intensity = thrust * 6.5 * (0.9 + 0.12 * Math.sin(elapsed * 32));

    if (thrust > 0.08) {
      rocketGroup.updateMatrixWorld();
      _nozzleWorld.copy(nozzleLocalPos).applyMatrix4(rocketGroup.matrixWorld);
      rocketGroup.getWorldQuaternion(_quat);
      _tailDir.set(0, -1, 0).applyQuaternion(_quat).normalize();

      const scale = rocketGroup.scale.x;
      const emitCount = Math.min(8, Math.ceil(thrust * 5));
      for (let i = 0; i < emitCount; i++) {
        this.emitTrailParticle(_nozzleWorld, _tailDir, scale, thrust, i % 2 === 0);
      }
    }

    // Advance trail pool physics
    for (let i = 0; i < this.trailCount; i++) {
      if (this.trailLife[i] >= this.trailMaxLife[i]) continue;
      this.trailLife[i] += delta;
      const i3 = i * 3;
      this.trailPositions[i3] += this.trailVelocities[i3] * delta;
      this.trailPositions[i3 + 1] += this.trailVelocities[i3 + 1] * delta;
      this.trailPositions[i3 + 2] += this.trailVelocities[i3 + 2] * delta;
      this.trailVelocities[i3] *= 0.96;
      this.trailVelocities[i3 + 1] *= 0.96;
      this.trailVelocities[i3 + 2] *= 0.96;
    }

    this.trailGeo.attributes.position.needsUpdate = true;
    this.trailGeo.attributes.aLife.needsUpdate = true;
    this.trailGeo.attributes.aMaxLife.needsUpdate = true;
    this.trailGeo.attributes.aSize.needsUpdate = true;
    this.trailGeo.attributes.aKind.needsUpdate = true;
  }

  public dispose(): void {
    this.coreGeo.dispose();
    this.coreMat.dispose();
    this.outerGeo.dispose();
    this.outerMat.dispose();
    this.heatGeo.dispose();
    this.heatMat.dispose();
    this.trailGeo.dispose();
    this.trailMat.dispose();
  }
}

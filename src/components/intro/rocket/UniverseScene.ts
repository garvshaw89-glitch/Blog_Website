import * as THREE from 'three';

export interface UniverseSceneOptions {
  starCount: number;
  dustCount: number;
}

/**
 * Deep-space atmospheric backdrop for the rocket emergence:
 * - Thousands of multi-spectral stars with depth-based twinkle & parallax
 * - Deep blue & purple procedural nebula clouds & distant galaxy cores
 * - Slowly drifting foreground cosmic dust
 */
export class UniverseScene {
  public readonly group = new THREE.Group();

  private starGeo: THREE.BufferGeometry;
  private starMat: THREE.ShaderMaterial;
  private starPoints: THREE.Points;

  private dustGeo: THREE.BufferGeometry;
  private dustMat: THREE.ShaderMaterial;
  private dustPoints: THREE.Points;

  private nebulaGeo: THREE.PlaneGeometry;
  private nebulaMat: THREE.ShaderMaterial;
  private nebulaMesh: THREE.Mesh;

  private opacity = 0;

  constructor({ starCount, dustCount }: UniverseSceneOptions) {
    // 1. Deep Nebula & Distant Galaxy Backdrop Dome Plane
    this.nebulaGeo = new THREE.PlaneGeometry(140, 90, 1, 1);
    this.nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uWarp: { value: 0 },
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
        uniform float uOpacity;
        uniform float uWarp;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.05;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 centered = vUv - vec2(0.5);
          float dist = length(centered * vec2(1.35, 1.0));

          float n1 = fbm(vUv * 3.4 + vec2(uTime * 0.02, -uTime * 0.015));
          float n2 = fbm(vUv * 6.2 - vec2(uTime * 0.025, uTime * 0.01));

          // Deep indigo/blue and subtle violet nebula filaments
          vec3 deepBlue = vec3(0.05, 0.14, 0.34);
          vec3 cosmosViolet = vec3(0.18, 0.08, 0.32);
          vec3 coreGlow = vec3(0.45, 0.72, 0.98);

          float radialMask = smoothstep(0.72, 0.05, dist);
          float cloud = smoothstep(0.28, 0.78, n1 * 0.65 + n2 * 0.35);

          vec3 col = mix(deepBlue, cosmosViolet, n2) * cloud * radialMask * 1.15;

          // Subtle central emergence beacon in deep universe
          float coreBeacon = exp(-dist * (9.5 - uWarp * 3.0)) * (0.45 + 0.55 * uWarp);
          col += coreGlow * coreBeacon * 0.9;

          // Distant subtle galaxy wisps
          float galaxyArm = exp(-length((vUv - vec2(0.28, 0.68)) * vec2(3.5, 6.0)) * 3.2);
          float galaxyArm2 = exp(-length((vUv - vec2(0.74, 0.34)) * vec2(4.0, 6.5)) * 3.5);
          col += vec3(0.26, 0.32, 0.56) * (galaxyArm + galaxyArm2) * 0.28;

          float alpha = clamp((cloud * radialMask * 0.62 + coreBeacon * 0.75 + (galaxyArm + galaxyArm2) * 0.25), 0.0, 1.0) * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.nebulaMesh = new THREE.Mesh(this.nebulaGeo, this.nebulaMat);
    this.nebulaMesh.position.set(0, 0, -56);
    this.group.add(this.nebulaMesh);

    // 2. Thousands of Multi-Spectral Deep-Space Stars
    this.starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColor = new Float32Array(starCount * 3);
    const starSize = new Float32Array(starCount);
    const starPhase = new Float32Array(starCount);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xcbd5e1),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0xc4b5fd),
      new THREE.Color(0xfef3c7),
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const spreadX = 68;
      const spreadY = 46;
      starPos[i3] = (Math.random() - 0.5) * spreadX * 2;
      starPos[i3 + 1] = (Math.random() - 0.5) * spreadY * 2;
      starPos[i3 + 2] = -6 - Math.random() * 82;

      const c = palette[Math.floor(Math.random() * palette.length)];
      starColor[i3] = c.r;
      starColor[i3 + 1] = c.g;
      starColor[i3 + 2] = c.b;

      starSize[i] = 0.8 + Math.pow(Math.random(), 2.2) * 2.6;
      starPhase[i] = Math.random() * Math.PI * 2;
    }

    this.starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3));
    this.starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
    this.starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1));

    this.starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 color;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;
          vTwinkle = 0.65 + 0.35 * sin(uTime * 2.1 + aPhase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (46.0 / max(8.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.04, d);
          float alpha = pow(core, 1.6) * vTwinkle * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.starPoints = new THREE.Points(this.starGeo, this.starMat);
    this.group.add(this.starPoints);

    // 3. Slowly Moving Foreground Cosmic Dust
    this.dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustSize = new Float32Array(dustCount);
    const dustPhase = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      dustPos[i3] = (Math.random() - 0.5) * 28;
      dustPos[i3 + 1] = (Math.random() - 0.5) * 18;
      dustPos[i3 + 2] = -2 - Math.random() * 24;
      dustSize[i] = 1.1 + Math.random() * 2.2;
      dustPhase[i] = Math.random() * Math.PI * 2;
    }

    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    this.dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1));

    this.dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.35 + aPhase) * 0.45;
          p.y += cos(uTime * 0.28 + aPhase * 1.3) * 0.35;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * uPixelRatio * (28.0 / max(4.0, -mvPosition.z));
          vAlpha = 0.25 + 0.25 * sin(uTime * 1.4 + aPhase);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float falloff = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(0.68, 0.84, 1.0, falloff * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dustPoints = new THREE.Points(this.dustGeo, this.dustMat);
    this.group.add(this.dustPoints);
  }

  public setPixelRatio(dpr: number): void {
    this.starMat.uniforms.uPixelRatio.value = dpr;
    this.dustMat.uniforms.uPixelRatio.value = dpr;
  }

  public update(
    elapsed: number,
    opacity: number,
    warpFactor: number,
    pointerX: number,
    pointerY: number
  ): void {
    this.opacity = opacity;
    this.nebulaMat.uniforms.uTime.value = elapsed;
    this.nebulaMat.uniforms.uOpacity.value = this.opacity;
    this.nebulaMat.uniforms.uWarp.value = warpFactor;

    this.starMat.uniforms.uTime.value = elapsed;
    this.starMat.uniforms.uOpacity.value = this.opacity;

    this.dustMat.uniforms.uTime.value = elapsed;
    this.dustMat.uniforms.uOpacity.value = this.opacity;

    // Gentle deep-space parallax drift
    this.group.rotation.y = pointerX * 0.035;
    this.group.rotation.x = -pointerY * 0.025;
  }

  public dispose(): void {
    this.starGeo.dispose();
    this.starMat.dispose();
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.nebulaGeo.dispose();
    this.nebulaMat.dispose();
  }
}

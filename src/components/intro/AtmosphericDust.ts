import * as THREE from 'three';

/**
 * ATMOSPHERIC DUST & GOLDEN AMBIENT GLOW
 *
 * Renders:
 * 1) Faint warm champagne-gold radial illumination behind center (emerges smoothly 0-2s)
 * 2) Thousands of drifting microscopic dust particles with organic wind currents
 */
export class AtmosphericDust {
  public group: THREE.Group;

  private dustGeometry: THREE.BufferGeometry;
  private dustMaterial: THREE.ShaderMaterial;
  private dustPoints: THREE.Points;

  private glowGeometry: THREE.PlaneGeometry;
  private glowMaterial: THREE.ShaderMaterial;
  private glowMesh: THREE.Mesh;

  private count: number;

  constructor(deviceTier: 'mobile' | 'tablet' | 'desktop', dpr: number) {
    this.group = new THREE.Group();
    this.count = deviceTier === 'mobile' ? 1100 : deviceTier === 'tablet' ? 1800 : 2800;

    // 1. Faint warm central golden aura plane (pure background atmosphere, zero harsh gradients)
    this.glowGeometry = new THREE.PlaneGeometry(18, 11);
    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uMouse;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv - 0.5 - uMouse * 0.03;
          p.x *= 1.45;
          float dist = length(p);
          float breath = 0.92 + 0.08 * sin(uTime * 0.7);
          float core = exp(-dist * dist * 6.5) * breath;
          float halo = exp(-dist * dist * 2.2) * 0.42;

          vec3 pureWhite = vec3(0.95, 0.97, 1.0);
          vec3 mistWhite = vec3(0.68, 0.75, 0.84);
          vec3 col = mix(mistWhite, pureWhite, smoothstep(0.45, 0.0, dist));

          float alpha = (core * 0.075 + halo * 0.032) * uIntensity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
    this.glowMesh.position.set(0, 0, -3.2);
    this.group.add(this.glowMesh);

    // 2. Microscopic floating dust buffer geometry
    const positions = new Float32Array(this.count * 3);
    const seeds = new Float32Array(this.count);
    const sizes = new Float32Array(this.count);
    const depths = new Float32Array(this.count);

    let rng = 94821;
    const rand = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return rng / 4294967296;
    };

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      positions[i3] = (rand() - 0.5) * 18.0;
      positions[i3 + 1] = (rand() - 0.5) * 10.5;
      positions[i3 + 2] = (rand() - 0.5) * 7.5 - 0.8;

      seeds[i] = rand();
      // Mostly tiny dust, occasional slightly brighter drifting motes
      sizes[i] = rand() < 0.86 ? 0.8 + rand() * 1.6 : 2.2 + rand() * 1.9;
      depths[i] = rand();
    }

    this.dustGeometry = new THREE.BufferGeometry();
    this.dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.dustGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.dustGeometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));

    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uVisibility: { value: 0 },
        uWindOffset: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float aSeed;
        attribute float aSize;
        attribute float aDepth;

        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uWindOffset;
        uniform vec2 uMouse;

        varying float vAlpha;
        varying float vWarmth;
        varying float vSeed;

        void main() {
          vec3 pos = position;

          // Gentle continuous wind drift from left -> right with seamless wrap
          float windSpeed = 0.25 + aDepth * 0.55;
          pos.x = mod(pos.x + uWindOffset * windSpeed + 9.0, 18.0) - 9.0;

          // Slow harmonic organic Brownian suspension
          float t = uTime * (0.28 + aSeed * 0.35) + aSeed * 62.831;
          pos.y += sin(t) * (0.14 + aDepth * 0.16);
          pos.z += cos(t * 0.72) * 0.18;

          // Subtle parallax response to cursor
          pos.x -= uMouse.x * (0.18 + aDepth * 0.32);
          pos.y += uMouse.y * (0.12 + aDepth * 0.24);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 1.8) + aSeed * 31.4);
          vAlpha = (0.12 + 0.42 * aDepth) * twinkle;
          vWarmth = aSeed;
          vSeed = aSeed;

          float distScale = 7.2 / max(-mvPosition.z, 1.5);
          gl_PointSize = clamp(aSize * uPixelRatio * distScale, 1.0, 12.0);
        }
      `,
      fragmentShader: `
        uniform float uVisibility;

        varying float vAlpha;
        varying float vWarmth;
        varying float vSeed;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r2 = dot(cxy, cxy);
          if (r2 > 1.0) discard;

          float falloff = exp(-r2 * 3.6);
          vec3 pureWhiteDust = vec3(1.0, 1.0, 1.0);
          vec3 quartzDust = vec3(0.92, 0.94, 0.97);
          vec3 silverDust = vec3(0.78, 0.84, 0.92);

          vec3 col = mix(pureWhiteDust, quartzDust, smoothstep(0.15, 0.75, vWarmth));
          col = mix(col, silverDust, step(0.86, vSeed) * 0.4);

          gl_FragColor = vec4(col, falloff * vAlpha * uVisibility);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dustPoints = new THREE.Points(this.dustGeometry, this.dustMaterial);
    this.dustPoints.frustumCulled = false;
    this.group.add(this.dustPoints);
  }

  public update(
    time: number,
    timelineSec: number,
    windAccum: number,
    mouseX: number,
    mouseY: number,
    exitFade: number
  ) {
    // Scene 01 (0-2s): Dust fades in subtly from complete darkness; glow emerges near center
    const dustReveal = THREE.MathUtils.smoothstep(timelineSec, 0.15, 1.95);
    const glowReveal = THREE.MathUtils.smoothstep(timelineSec, 0.45, 2.2);
    const exitMult = 1 - exitFade;

    this.dustMaterial.uniforms.uTime.value = time;
    this.dustMaterial.uniforms.uWindOffset.value = windAccum;
    this.dustMaterial.uniforms.uVisibility.value = dustReveal * exitMult;
    this.dustMaterial.uniforms.uMouse.value.set(mouseX, mouseY);

    this.glowMaterial.uniforms.uTime.value = time;
    this.glowMaterial.uniforms.uIntensity.value = glowReveal * exitMult;
    this.glowMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
  }

  public setPixelRatio(dpr: number) {
    this.dustMaterial.uniforms.uPixelRatio.value = dpr;
  }

  public dispose() {
    this.dustGeometry.dispose();
    this.dustMaterial.dispose();
    this.glowGeometry.dispose();
    this.glowMaterial.dispose();
  }
}

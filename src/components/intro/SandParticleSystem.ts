import * as THREE from 'three';
import { TextParticleFormation, WordTargetCloud } from './TextParticleFormation';

export type DeviceTier = 'mobile' | 'tablet' | 'desktop';

/**
 * SAND PARTICLE SYSTEM (Three.js BufferGeometry + Custom GLSL Shader + Spring Physics)
 *
 * Simulates thousands of physical champagne-gold sand grains, glowing micro-dust, and
 * fine crystalline fragments through Scenes 01-05:
 *   - 0-2s: Darkness awakening & gentle left-to-right wind
 *   - 2-4s: THINK. formation with progressive letter arrival & subtle underdamped overshoot
 *   - 4-6s: Horizontal wave dissolution -> flowing sand stream -> CREATE. + gold light sweep
 *   - 6-8s: Outward expansion wave -> dramatic convergence onto DISCOVER. + subtle burst
 *   - 8-10s+: Sharp, calm settled typography with localized mouse/touch disturbance
 */
export class SandParticleSystem {
  public points: THREE.Points;
  public readonly count: number;

  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private sampler: TextParticleFormation;

  private positions: Float32Array;
  private velocities: Float32Array;
  private restPositions: Float32Array;

  private seeds: Float32Array;
  private phases: Float32Array;
  private sizes: Float32Array;
  private colorMix: Float32Array;
  private alphas: Float32Array;
  private charAttr: Float32Array;
  private edgeAttr: Float32Array;
  private kineticAttr: Float32Array;

  private thinkCloud!: WordTargetCloud;
  private createCloud!: WordTargetCloud;
  private discoverCloud!: WordTargetCloud;

  // One-shot transition triggers for Scenes 03, 04, and Enter dispersion
  private dissolveTriggered = false;
  private expandTriggered = false;
  private enterBurstTriggered = false;
  private activeCloudTag: 'none' | 'think' | 'create' | 'discover' = 'none';

  private visibleWorldWidth = 10;
  private visibleWorldHeight = 6;
  private hoverBoost = 0;

  constructor(
    deviceTier: DeviceTier,
    dpr: number,
    visibleWorldWidth: number,
    visibleWorldHeight: number
  ) {
    this.count =
      deviceTier === 'mobile' ? 6800 : deviceTier === 'tablet' ? 11500 : 18000;

    this.visibleWorldWidth = visibleWorldWidth;
    this.visibleWorldHeight = visibleWorldHeight;

    this.sampler = new TextParticleFormation();

    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.restPositions = new Float32Array(this.count * 3);

    this.seeds = new Float32Array(this.count);
    this.phases = new Float32Array(this.count);
    this.sizes = new Float32Array(this.count);
    this.colorMix = new Float32Array(this.count);
    this.alphas = new Float32Array(this.count);
    this.charAttr = new Float32Array(this.count);
    this.edgeAttr = new Float32Array(this.count);
    this.kineticAttr = new Float32Array(this.count);

    let rng = 42197;
    const rand = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return rng / 4294967296;
    };

    const spreadW = visibleWorldWidth * 1.18;
    const spreadH = visibleWorldHeight * 1.08;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const rx = (rand() - 0.5) * spreadW;
      const ry = (rand() - 0.5) * spreadH;
      const rz = (rand() - 0.5) * 3.8;

      this.restPositions[i3] = rx;
      this.restPositions[i3 + 1] = ry;
      this.restPositions[i3 + 2] = rz;

      this.positions[i3] = rx;
      this.positions[i3 + 1] = ry;
      this.positions[i3 + 2] = rz;

      this.seeds[i] = rand();
      this.phases[i] = rand() * Math.PI * 2;

      // Mixture:
      // 70% tiny crisp sand grains, 23% fine glowing dust, 7% slightly larger shimmering fragments
      const roleRoll = rand();
      if (roleRoll < 0.7) {
        this.sizes[i] = 1.05 + rand() * 0.95;
        this.alphas[i] = 0.72 + rand() * 0.28;
      } else if (roleRoll < 0.93) {
        this.sizes[i] = 1.85 + rand() * 1.25;
        this.alphas[i] = 0.38 + rand() * 0.34;
      } else {
        this.sizes[i] = 2.85 + rand() * 1.65;
        this.alphas[i] = 0.65 + rand() * 0.35;
      }

      this.colorMix[i] = rand();
      this.charAttr[i] = rand();
      this.edgeAttr[i] = 0.5;
      this.kineticAttr[i] = 0;
    }

    this.rebuildTargets(visibleWorldWidth, visibleWorldHeight, deviceTier);

    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', posAttr);
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(this.phases, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aColorMix', new THREE.BufferAttribute(this.colorMix, 1));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));

    const charBuf = new THREE.BufferAttribute(this.charAttr, 1);
    charBuf.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('aCharT', charBuf);

    const edgeBuf = new THREE.BufferAttribute(this.edgeAttr, 1);
    edgeBuf.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('aEdge', edgeBuf);

    const kineticBuf = new THREE.BufferAttribute(this.kineticAttr, 1);
    kineticBuf.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('aKinetic', kineticBuf);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uGlobalOpacity: { value: 0 },
        uLightSweep: { value: -1.0 },
        uBurstGlow: { value: 0 },
        uSettleSharpen: { value: 0 },
      },
      vertexShader: `
        attribute float aSeed;
        attribute float aPhase;
        attribute float aSize;
        attribute float aColorMix;
        attribute float aAlpha;
        attribute float aCharT;
        attribute float aEdge;
        attribute float aKinetic;

        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uLightSweep;
        uniform float uBurstGlow;
        uniform float uSettleSharpen;

        varying float vAlpha;
        varying float vColorMix;
        varying float vSweep;
        varying float vBurst;
        varying float vKinetic;
        varying float vSizeTier;
        varying float vEdge;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Subtle luminous sparkle modulation
          float shimmer = 0.84 + 0.16 * sin(uTime * (2.1 + aSeed * 2.8) + aPhase);
          vAlpha = aAlpha * shimmer;
          vColorMix = aColorMix;
          vKinetic = clamp(aKinetic, 0.0, 1.0);
          vSizeTier = aSize;
          vEdge = aEdge;

          // Champagne-gold traveling light wave across CREATE. (Scene 03)
          float sweepDist = abs(aCharT - uLightSweep);
          vSweep = smoothstep(0.24, 0.0, sweepDist) * step(-0.2, uLightSweep);

          // Subtle golden radiance around DISCOVER. on convergence (Scene 04)
          vBurst = uBurstGlow * (0.45 + 0.55 * aSeed);

          float distScale = 7.4 / max(-mvPosition.z, 1.2);
          float tighten = mix(1.0, 0.86, uSettleSharpen * aEdge);
          float motionExpand = 1.0 + vKinetic * 0.28 + vSweep * 0.25 + vBurst * 0.22;

          gl_PointSize = clamp(aSize * tighten * motionExpand * uPixelRatio * distScale, 1.15, 18.0);
        }
      `,
      fragmentShader: `
        uniform float uGlobalOpacity;

        varying float vAlpha;
        varying float vColorMix;
        varying float vSweep;
        varying float vBurst;
        varying float vKinetic;
        varying float vSizeTier;
        varying float vEdge;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r2 = dot(cxy, cxy);
          if (r2 > 1.0) discard;

          // Sand grains (smaller) are crisper; dust particles (larger) have a softer glow
          float isDust = smoothstep(1.9, 3.0, vSizeTier);
          float sharpCore = exp(-r2 * mix(4.6, 2.7, isDust));
          float softHalo = exp(-r2 * 1.8) * mix(0.24, 0.55, isDust);
          float shape = mix(sharpCore, sharpCore * 0.72 + softHalo, 0.65);

          // Crisp white sand palette: pure white -> alabaster quartz -> soft silver -> luminous pearl
          vec3 pureWhite = vec3(1.0, 1.0, 1.0);
          vec3 quartzWhite = vec3(0.955, 0.962, 0.975);
          vec3 silverSand = vec3(0.83, 0.865, 0.915);
          vec3 luminousPearl = vec3(1.0, 1.0, 1.0);

          vec3 baseCol = mix(pureWhite, quartzWhite, smoothstep(0.0, 0.62, vColorMix));
          baseCol = mix(baseCol, silverSand, smoothstep(0.62, 1.0, vColorMix));

          // Edges/contours brightest pure white so editorial serifs stay razor-sharp & legible
          baseCol = mix(baseCol, pureWhite, vEdge * 0.52);

          // Traveling white-light beam (Scene 03) + bright kinetic sparkle
          vec3 whiteFlash = mix(quartzWhite, luminousPearl, 0.85);
          baseCol = mix(baseCol, whiteFlash, clamp(vSweep * 0.85 + vBurst * 0.55 + vKinetic * 0.22, 0.0, 0.95));

          float alpha = shape * vAlpha * uGlobalOpacity * (1.0 + vSweep * 0.55 + vBurst * 0.35);
          gl_FragColor = vec4(baseCol, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public rebuildTargets(
    visibleWorldWidth: number,
    visibleWorldHeight: number,
    deviceTier: DeviceTier
  ) {
    this.visibleWorldWidth = visibleWorldWidth;
    this.visibleWorldHeight = visibleWorldHeight;

    // Desktop headline occupies ~74-82% of viewport width; mobile/tablet cleanly padded inside bounds
    const thinkFill = deviceTier === 'mobile' ? 0.8 : deviceTier === 'tablet' ? 0.76 : 0.73;
    const createFill = deviceTier === 'mobile' ? 0.84 : deviceTier === 'tablet' ? 0.8 : 0.77;
    const discoverFill = deviceTier === 'mobile' ? 0.88 : deviceTier === 'tablet' ? 0.83 : 0.81;

    // Center DISCOVER. cleanly in viewport now that Scene 05 supporting text is removed
    const discoverY = 0.02;

    this.thinkCloud = this.sampler.sampleWord(
      'THINK.',
      this.count,
      visibleWorldWidth,
      visibleWorldHeight,
      {
        widthFillRatio: thinkFill,
        maxHeightRatio: 0.23,
        centerYWorld: 0.02,
        depthSpread: 0.14,
        seedOffset: 11,
      }
    );

    this.createCloud = this.sampler.sampleWord(
      'CREATE.',
      this.count,
      visibleWorldWidth,
      visibleWorldHeight,
      {
        widthFillRatio: createFill,
        maxHeightRatio: 0.23,
        centerYWorld: 0.02,
        depthSpread: 0.15,
        seedOffset: 29,
      }
    );

    this.discoverCloud = this.sampler.sampleWord(
      'DISCOVER.',
      this.count,
      visibleWorldWidth,
      visibleWorldHeight,
      {
        widthFillRatio: discoverFill,
        maxHeightRatio: 0.24,
        centerYWorld: discoverY,
        depthSpread: 0.12,
        seedOffset: 53,
      }
    );

    // Refresh attributes immediately if currently locked on a cloud
    if (this.activeCloudTag === 'think') this.syncCloudAttributes(this.thinkCloud);
    else if (this.activeCloudTag === 'create') this.syncCloudAttributes(this.createCloud);
    else if (this.activeCloudTag === 'discover') this.syncCloudAttributes(this.discoverCloud);
  }

  private syncCloudAttributes(cloud: WordTargetCloud) {
    this.charAttr.set(cloud.charProgress);
    this.edgeAttr.set(cloud.edgeWeights);
    (this.geometry.attributes.aCharT as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aEdge as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Immediately snaps particles into settled Scene 05 DISCOVER. state for reduced-motion preference.
   */
  public snapToFinalComposition() {
    this.syncCloudAttributes(this.discoverCloud);
    this.activeCloudTag = 'discover';
    this.positions.set(this.discoverCloud.positions);
    this.velocities.fill(0);
    this.kineticAttr.fill(0);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aKinetic as THREE.BufferAttribute).needsUpdate = true;
    this.material.uniforms.uGlobalOpacity.value = 1.0;
    this.material.uniforms.uSettleSharpen.value = 1.0;
    this.material.uniforms.uLightSweep.value = -1.0;
    this.material.uniforms.uBurstGlow.value = 0.0;
  }

  public setEnterButtonHover(isHovering: boolean, delta: number) {
    const target = isHovering ? 1 : 0;
    this.hoverBoost = THREE.MathUtils.damp(this.hoverBoost, target, 6.0, delta);
  }

  public resetTimeline() {
    this.dissolveTriggered = false;
    this.expandTriggered = false;
    this.enterBurstTriggered = false;
    this.activeCloudTag = 'none';
    this.positions.set(this.restPositions);
    this.velocities.fill(0);
    this.kineticAttr.fill(0);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aKinetic as THREE.BufferAttribute).needsUpdate = true;
  }

  public update(
    time: number,
    delta: number,
    timelineSec: number,
    mouseWorldX: number,
    mouseWorldY: number,
    mouseSpeed: number,
    mouseActive: boolean,
    exitProgress: number
  ) {
    const clampedDt = Math.min(delta, 0.033);
    const subSteps = 2;
    const stepDt = clampedDt / subSteps;

    // Determine active phase and trigger physical impulse events once
    // Scene 01: 0.0 - 2.0
    // Scene 02: 2.0 - 4.0 (THINK.)
    // Scene 03: 4.0 - 6.0 (CREATE.)
    // Scene 04: 6.0 - 8.0 (DISCOVER.)
    // Scene 05: 8.0 - 10.0+ (Settled + Support Copy)

    if (timelineSec >= 1.9 && this.activeCloudTag === 'none') {
      this.activeCloudTag = 'think';
      this.syncCloudAttributes(this.thinkCloud);
    }

    if (timelineSec >= 4.0 && !this.dissolveTriggered) {
      this.dissolveTriggered = true;
      // Inject gentle initial rightward slip along left-to-right sweep
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const s = this.seeds[i];
        this.velocities[i3] += 0.65 + s * 0.9;
        this.velocities[i3 + 1] += (s - 0.5) * 0.45;
      }
    }

    if (timelineSec >= 4.38 && this.activeCloudTag === 'think') {
      this.activeCloudTag = 'create';
      this.syncCloudAttributes(this.createCloud);
    }

    if (timelineSec >= 6.0 && !this.expandTriggered) {
      this.expandTriggered = true;
      // Outward flowing sand burst expansion before converging on DISCOVER.
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const px = this.positions[i3];
        const py = this.positions[i3 + 1];
        const dist = Math.sqrt(px * px + py * py) + 0.25;
        const s = this.seeds[i];
        const nx = px / dist;
        const ny = py / dist;
        const burst = 2.8 + s * 3.8;
        this.velocities[i3] += nx * burst + 0.95;
        this.velocities[i3 + 1] += ny * burst * 0.72 + (s - 0.5) * 1.1;
        this.velocities[i3 + 2] += (s - 0.5) * 2.4;
      }
    }

    if (timelineSec >= 6.42 && this.activeCloudTag === 'create') {
      this.activeCloudTag = 'discover';
      this.syncCloudAttributes(this.discoverCloud);
    }

    if (exitProgress > 0.01 && !this.enterBurstTriggered) {
      this.enterBurstTriggered = true;
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const s = this.seeds[i];
        const angle = this.phases[i];
        this.velocities[i3] += Math.cos(angle) * (1.8 + s * 2.5) + 1.4;
        this.velocities[i3 + 1] += Math.sin(angle) * (1.3 + s * 1.8) + 0.3;
        this.velocities[i3 + 2] += (s - 0.35) * 3.2;
      }
    }

    // Shader uniforms for lighting & readability
    this.material.uniforms.uTime.value = time;

    // Fade in smoothly from darkness (Scene 01: 0.12s -> 1.85s)
    const scene01Fade = THREE.MathUtils.smoothstep(timelineSec, 0.12, 1.85);
    const baseVis = 0.42 + 0.58 * THREE.MathUtils.smoothstep(timelineSec, 1.75, 2.85);
    const exitFade = 1.0 - THREE.MathUtils.smoothstep(exitProgress, 0.08, 0.96);
    this.material.uniforms.uGlobalOpacity.value = scene01Fade * baseVis * exitFade;

    // Scene 03 champagne-gold light ribbon traveling through CREATE. (4.95s -> 5.95s)
    if (timelineSec >= 4.92 && timelineSec <= 6.02) {
      const p = (timelineSec - 4.92) / 1.05;
      this.material.uniforms.uLightSweep.value = -0.22 + p * 1.44;
    } else {
      this.material.uniforms.uLightSweep.value = -1.0;
    }

    // Scene 04 golden convergence burst around DISCOVER. (7.38s -> 8.45s)
    let burstGlow = 0;
    if (timelineSec >= 7.35 && timelineSec <= 8.55) {
      const b = (timelineSec - 7.35) / 1.2;
      burstGlow = Math.sin(b * Math.PI) * Math.pow(1.0 - b * 0.4, 1.2) * 0.85;
    }
    this.material.uniforms.uBurstGlow.value = burstGlow;

    // Sharpen glyphs slightly once DISCOVER. is formed
    const sharpen = THREE.MathUtils.smoothstep(timelineSec, 7.6, 8.6);
    this.material.uniforms.uSettleSharpen.value = sharpen;

    // Choose target buffers based on scene timeline
    const targetBuf =
      timelineSec < 4.38
        ? this.thinkCloud.positions
        : timelineSec < 6.42
        ? this.createCloud.positions
        : this.discoverCloud.positions;

    const charProgressBuf =
      timelineSec < 4.38
        ? this.thinkCloud.charProgress
        : timelineSec < 6.42
        ? this.createCloud.charProgress
        : this.discoverCloud.charProgress;

    // Mouse interaction parameters (gentle disturbance without breaking typography)
    const interactRadius = Math.min(this.visibleWorldWidth * 0.16, 1.15);
    const interactRadiusSq = interactRadius * interactRadius;
    const isSettledInteractive = timelineSec >= 7.75 && exitProgress < 0.05;
    const pointerForceBoost = mouseActive
      ? Math.min(1.6, 0.45 + mouseSpeed * 0.35)
      : 0;

    // Precompute phase wind & wave progress
    const waveDissolve3 =
      timelineSec >= 4.0 && timelineSec < 4.48
        ? (timelineSec - 4.0) / 0.45
        : -1;
    const isExpanding4 = timelineSec >= 6.0 && timelineSec < 6.46;
    const discoverLockFactor = THREE.MathUtils.smoothstep(timelineSec, 6.46, 7.82);

    const posArr = this.positions;
    const velArr = this.velocities;
    const restArr = this.restPositions;
    const seeds = this.seeds;
    const phases = this.phases;
    const kineticArr = this.kineticAttr;

    const halfW = this.visibleWorldWidth * 0.65;

    for (let step = 0; step < subSteps; step++) {
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const s = seeds[i];
        const ph = phases[i];
        const charT = charProgressBuf[i];

        let px = posArr[i3];
        let py = posArr[i3 + 1];
        let pz = posArr[i3 + 2];

        let vx = velArr[i3];
        let vy = velArr[i3 + 1];
        let vz = velArr[i3 + 2];

        let tx = restArr[i3];
        let ty = restArr[i3 + 1];
        let tz = restArr[i3 + 2];

        let stiffness = 0;
        let damping = 1.6;
        let turbAmp = 0.45;
        let windX = 0;

        if (exitProgress > 0.02) {
          // Final "ENTER EXPERIENCE" dispersion exhale
          stiffness = 0;
          damping = 1.1;
          windX = 2.6 + s * 2.2;
          turbAmp = 1.25;
        } else if (timelineSec < 2.0) {
          // SCENE 01 (0-2s): Darkness awakening + gentle wind from the left
          const windBuild = THREE.MathUtils.smoothstep(timelineSec, 0.75, 2.0);
          windX = windBuild * (0.65 + s * 0.85);
          turbAmp = 0.55;
          stiffness = 0;
          damping = 1.9;

          // Subtle convergence hint right before 2.0s
          if (timelineSec > 1.78) {
            const prePull = THREE.MathUtils.smoothstep(timelineSec, 1.78, 2.0);
            const arriveThreshold = charT * 0.65 + s * 0.25;
            if (prePull > arriveThreshold * 0.5) {
              tx = targetBuf[i3];
              ty = targetBuf[i3 + 1];
              tz = targetBuf[i3 + 2];
              stiffness = 7.5 * prePull;
              damping = 3.2;
            }
          }
        } else if (timelineSec < 4.0) {
          // SCENE 02 (2-4s): THINK. sand formation with progressive letter assembly + slight overshoot
          const isAmbientFloat = s > 0.958;
          if (!isAmbientFloat) {
            const letterDelay = charT * 0.72 + (s - 0.5) * 0.24;
            const localProgress = THREE.MathUtils.clamp((timelineSec - 1.92 - letterDelay) / 0.9, 0, 1);

            if (localProgress > 0.01) {
              tx = targetBuf[i3];
              ty = targetBuf[i3 + 1];
              tz = targetBuf[i3 + 2];
              // Underdamped spring ratio (damping < 2*sqrt(k)) produces realistic subtle overshoot!
              stiffness = 14.0 + localProgress * 18.0;
              damping = 5.1 + (1.0 - s) * 0.7;
              turbAmp = (1.0 - localProgress) * 1.15 + 0.04;
            } else {
              windX = 0.7;
              turbAmp = 0.6;
            }
          } else {
            // Subtle floating companion motes near THINK.
            windX = 0.22;
            turbAmp = 0.42;
            damping = 2.0;
          }
        } else if (timelineSec < 6.0) {
          // SCENE 03 (4-6s): Controlled wave dissolution of THINK. -> horizontal stream -> CREATE.
          if (waveDissolve3 >= 0) {
            const waveFront = waveDissolve3 * 1.35 - 0.1;
            const hit = THREE.MathUtils.clamp((waveFront - charT) * 4.0, 0, 1);
            if (hit > 0.05) {
              stiffness = 0;
              damping = 1.4;
              windX = 4.2 + s * 3.1;
              turbAmp = 1.35;
              vy += Math.sin(charT * 12.0 + s * 6.28) * 0.55 * stepDt;
            } else {
              tx = this.thinkCloud.positions[i3];
              ty = this.thinkCloud.positions[i3 + 1];
              tz = this.thinkCloud.positions[i3 + 2];
              stiffness = 18.0;
              damping = 5.4;
              turbAmp = 0.12;
            }
          } else {
            const isDrifter = s > 0.915;
            if (!isDrifter) {
              const letterDelay = charT * 0.62 + (s - 0.5) * 0.22;
              const localProgress = THREE.MathUtils.clamp((timelineSec - 4.42 - letterDelay) / 0.85, 0, 1);
              tx = targetBuf[i3];
              ty = targetBuf[i3 + 1];
              tz = targetBuf[i3 + 2];
              stiffness = 11.0 + localProgress * 22.0;
              damping = 5.2 + s * 0.8;
              turbAmp = (1.0 - localProgress) * 1.2 + 0.045;
              windX = (1.0 - localProgress) * 1.15;
            } else {
              // Some particles drift away organically from CREATE.
              windX = 0.48 + s * 0.35;
              turbAmp = 0.52;
              damping = 1.8;
              vy += 0.18 * stepDt;
            }
          }
        } else if (timelineSec < 8.0) {
          // SCENE 04 (6-8s): Outward expansion -> flowing sand wave -> impressive DISCOVER.
          if (isExpanding4) {
            stiffness = 0;
            damping = 1.45;
            windX = 1.6 + Math.sin(timelineSec * 4.0 + s * 6.28) * 1.2;
            turbAmp = 1.65;
          } else {
            const isHaloDust = s > 0.962;
            if (!isHaloDust) {
              const centerBias = Math.abs(charT - 0.5) * 0.48;
              const localProgress = THREE.MathUtils.clamp(
                (timelineSec - 6.44 - centerBias - (s - 0.5) * 0.2) / 0.86,
                0,
                1
              );
              tx = targetBuf[i3];
              ty = targetBuf[i3 + 1];
              tz = targetBuf[i3 + 2];
              stiffness = 14.0 + localProgress * 25.0 * discoverLockFactor;
              damping = 5.4 + localProgress * 1.5;
              turbAmp = (1.0 - localProgress) * 1.1 + 0.03;
            } else {
              // Subtle halo dust orbiting DISCOVER.
              windX = 0.16;
              turbAmp = 0.45;
              damping = 2.1;
            }
          }
        } else {
          // SCENE 05 (8-10s+): Crisp, sharp settled DISCOVER. + subtle interactive hover shimmer
          const isHaloDust = s > 0.962;
          if (!isHaloDust) {
            tx = targetBuf[i3];
            ty = targetBuf[i3 + 1];
            tz = targetBuf[i3 + 2];
            // Soft controlled ripple when hovering ENTER EXPERIENCE ↗
            const rippleOffset =
              this.hoverBoost *
              0.045 *
              Math.sin(time * 5.2 + px * 2.4 + s * 6.28);
            ty += rippleOffset;
            tx += this.hoverBoost * 0.03 * Math.cos(time * 4.1 + py * 3.0);

            stiffness = 34.0;
            damping = 7.8;
            turbAmp = 0.028 + this.hoverBoost * 0.06;
          } else {
            windX = 0.18 + this.hoverBoost * 0.45;
            turbAmp = 0.35;
            damping = 2.0;
          }
        }

        // Organic curl turbulence (3-frequency smooth trig field, zero allocations)
        const nPhase = ph + time * 1.45;
        const fx =
          Math.sin(py * 1.7 + nPhase) * turbAmp +
          Math.cos(pz * 2.1 - time * 0.9) * turbAmp * 0.5;
        const fy =
          Math.cos(px * 1.5 - nPhase * 0.85) * turbAmp +
          Math.sin(px * 2.4 + time * 1.1) * turbAmp * 0.35;
        const fz = Math.sin(px * 1.2 + py * 1.4 + nPhase * 0.7) * turbAmp * 0.55;

        let ax = fx + windX;
        let ay = fy;
        let az = fz;

        if (stiffness > 0) {
          ax += (tx - px) * stiffness;
          ay += (ty - py) * stiffness;
          az += (tz - pz) * stiffness;
        }

        // Localized mouse/touch atmospheric disturbance (gentle deflection, never breaks legibility)
        if (isSettledInteractive && mouseActive) {
          const dx = px - mouseWorldX;
          const dy = py - mouseWorldY;
          const distSq = dx * dx + dy * dy;
          if (distSq < interactRadiusSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const falloff = (1.0 - dist / interactRadius);
            const smoothFall = falloff * falloff;
            const invD = 1.0 / dist;
            // Radial puff + soft tangential swirl
            const repel = smoothFall * (4.2 + pointerForceBoost * 4.5);
            const swirl = smoothFall * 2.4;
            ax += dx * invD * repel - dy * invD * swirl;
            ay += dy * invD * repel + dx * invD * swirl;
            az += smoothFall * (s - 0.45) * 2.2;
          }
        }

        // Semi-implicit Euler integration with exponential velocity damping
        vx += ax * stepDt;
        vy += ay * stepDt;
        vz += az * stepDt;

        const dampScale = Math.exp(-damping * stepDt);
        vx *= dampScale;
        vy *= dampScale;
        vz *= dampScale;

        px += vx * stepDt;
        py += vy * stepDt;
        pz += vz * stepDt;

        // Wrap free-drifting Scene 01 dust cleanly across viewport width
        if (stiffness === 0 && exitProgress < 0.02 && timelineSec < 2.0) {
          if (px > halfW) px = -halfW;
          else if (px < -halfW) px = halfW;
        }

        posArr[i3] = px;
        posArr[i3 + 1] = py;
        posArr[i3 + 2] = pz;

        velArr[i3] = vx;
        velArr[i3 + 1] = vy;
        velArr[i3 + 2] = vz;

        if (step === subSteps - 1) {
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
          kineticArr[i] = Math.min(1, speed * 0.28);
        }
      }
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aKinetic as THREE.BufferAttribute).needsUpdate = true;
  }

  public setPixelRatio(dpr: number) {
    this.material.uniforms.uPixelRatio.value = dpr;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DigitalDnaThreeCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeAccent: string;
  reducedMotion?: boolean;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

const DNA_PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMouseActive;
  uniform float uReducedMotion;
  uniform vec3 uMouse3D;
  uniform vec3 uAccentColor;

  attribute float aSize;
  attribute float aPhase;
  attribute float aKind; // 0.0 = strand A, 1.0 = strand B, 2.0 = base-pair bridge, 3.0 = bio-ambient
  attribute vec3 aBaseColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vExcite;

  void main() {
    float motion = mix(1.0, 0.12, uReducedMotion);
    float t = uTime * motion;

    // Gentle rotational breathing around the diagonal DNA axis
    vec3 pos = position;

    // Slow helical twist & organic cellular respiration
    float twist = t * 0.42;
    float wave = sin(pos.x * 0.48 - t * 1.45 + aPhase) * 0.14;
    pos.y += wave;
    pos.z += cos(pos.x * 0.42 + t * 1.15 + aPhase) * 0.12;

    if (aKind < 2.5) {
      // Rotate helix cross-section around its longitudinal X axis
      float c = cos(twist);
      float s = sin(twist);
      float ry = pos.y * c - pos.z * s;
      float rz = pos.y * s + pos.z * c;
      pos.y = ry;
      pos.z = rz;
    } else {
      // Ambient bio-spores gently drift in 3D space
      pos.x += sin(t * 0.45 + aPhase * 6.283) * 0.25;
      pos.y += cos(t * 0.38 + aPhase * 4.12) * 0.28;
      pos.z += sin(t * 0.32 + aPhase * 5.31) * 0.22;
    }

    // Subtle organic tilt matching editorial composition
    float tiltAngle = 0.26;
    float ct = cos(tiltAngle);
    float st = sin(tiltAngle);
    vec3 tilted = vec3(
      pos.x * ct - pos.y * st,
      pos.x * st + pos.y * ct,
      pos.z
    );

    // Mouse proximity displacement (fluid bio-wake repulsion + tangential swirl)
    vec3 toParticle = tilted - uMouse3D;
    float dist = length(toParticle);
    float influenceRadius = 2.65;
    float prox = (1.0 - smoothstep(0.0, influenceRadius, dist)) * uMouseActive;

    if (prox > 0.001) {
      vec3 dir = normalize(toParticle + vec3(0.0001, 0.0002, 0.0001));
      // Swirl tangent vector perpendicular to view Z
      vec3 swirl = normalize(vec3(-dir.y, dir.x, dir.z * 0.35) + vec3(0.0001));
      float pulse = sin(aPhase * 12.0 + t * 4.0) * 0.18 + 1.0;
      tilted += dir * (prox * prox * 1.25 * pulse);
      tilted += swirl * (prox * 0.45 * sin(t * 2.2 + aPhase * 6.28));
    }

    vec4 mvPosition = modelViewMatrix * vec4(tilted, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float depthAtten = 28.0 / max(1.0, -mvPosition.z);
    float exciteScale = 1.0 + prox * 1.35;
    float kindScale = aKind > 2.5 ? 0.72 : 1.0;

    gl_PointSize = clamp(aSize * uPixelRatio * depthAtten * exciteScale * kindScale, 1.5, 42.0);

    // Chromatic blend between biological structure palette, active node accent & white-cyan excitation
    vec3 strandColor = mix(aBaseColor, uAccentColor, aKind < 1.5 ? 0.42 : 0.25);
    vec3 excitedColor = mix(strandColor, vec3(0.86, 0.97, 1.0), prox * 0.85);

    vColor = excitedColor;
    vExcite = prox;
    float baseAlpha = aKind > 2.5 ? 0.34 : (aKind > 1.5 ? 0.62 : 0.9);
    vAlpha = clamp(baseAlpha + prox * 0.45, 0.0, 1.0);
  }
`;

const DNA_PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vExcite;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    // Crisp bioluminescent core + soft outer membrane halo
    float core = exp(-d * d * 26.0);
    float halo = smoothstep(0.5, 0.06, d) * 0.48;
    float intensity = core + halo + vExcite * core * 0.45;

    gl_FragColor = vec4(vColor * (0.95 + vExcite * 0.45), intensity * vAlpha);
  }
`;

const HELIX_LINE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uReducedMotion;
  uniform vec3 uMouse3D;
  uniform float uMouseActive;

  attribute float aPhase;
  varying float vExcite;

  void main() {
    float motion = mix(1.0, 0.12, uReducedMotion);
    float t = uTime * motion;

    vec3 pos = position;
    float twist = t * 0.42;
    float c = cos(twist);
    float s = sin(twist);
    float ry = pos.y * c - pos.z * s;
    float rz = pos.y * s + pos.z * c;
    pos.y = ry;
    pos.z = rz;

    float tiltAngle = 0.26;
    float ct = cos(tiltAngle);
    float st = sin(tiltAngle);
    vec3 tilted = vec3(
      pos.x * ct - pos.y * st,
      pos.x * st + pos.y * ct,
      pos.z
    );

    float dist = length(tilted - uMouse3D);
    float prox = (1.0 - smoothstep(0.0, 2.65, dist)) * uMouseActive;
    if (prox > 0.001) {
      vec3 dir = normalize(tilted - uMouse3D + vec3(0.0001));
      tilted += dir * (prox * prox * 0.72);
    }

    vExcite = prox;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(tilted, 1.0);
  }
`;

const HELIX_LINE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uAccentColor;
  varying float vExcite;

  void main() {
    vec3 col = mix(vec3(0.28, 0.58, 0.92), uAccentColor, 0.55);
    col = mix(col, vec3(0.85, 0.96, 1.0), vExcite * 0.65);
    gl_FragColor = vec4(col, 0.16 + vExcite * 0.36);
  }
`;

export const DigitalDnaThreeCanvas: React.FC<DigitalDnaThreeCanvasProps> = ({
  containerRef,
  activeAccent,
  reducedMotion = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const accentColorRef = useRef<THREE.Color>(new THREE.Color(activeAccent));
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  useEffect(() => {
    accentColorRef.current.set(activeAccent);
  }, [activeAccent]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container || !hasWebGLSupport()) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const initialRect = container.getBoundingClientRect();
    const initW = Math.max(320, initialRect.width);
    const initH = Math.max(280, initialRect.height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 60);
    camera.position.set(0, 0, 9.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(initW, initH);
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // Build 3D Double-Helix Nucleotide & Bio-Ambient Particle BufferGeometry
    // -------------------------------------------------------------------------
    const helixSpan = 11.4;
    const helixTurns = 3.1;
    const helixRadius = 1.65;
    const backboneParticlesPerStrand = 720;
    const rungCount = 30;
    const particlesPerRung = 26;
    const ambientCount = 460;

    const totalParticles =
      backboneParticlesPerStrand * 2 + rungCount * particlesPerRung + ambientCount;

    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const phases = new Float32Array(totalParticles);
    const kinds = new Float32Array(totalParticles);
    const baseColors = new Float32Array(totalParticles * 3);

    const colorStrandA = new THREE.Color('#22d3ee');
    const colorStrandB = new THREE.Color('#818cf8');
    const colorRung = new THREE.Color('#60a5fa');
    const colorAmbient = new THREE.Color('#38bdf8');
    const tempColor = new THREE.Color();

    let ptr = 0;
    const writeParticle = (
      x: number,
      y: number,
      z: number,
      size: number,
      phase: number,
      kind: number,
      col: THREE.Color
    ) => {
      positions[ptr * 3] = x;
      positions[ptr * 3 + 1] = y;
      positions[ptr * 3 + 2] = z;
      sizes[ptr] = size;
      phases[ptr] = phase;
      kinds[ptr] = kind;
      baseColors[ptr * 3] = col.r;
      baseColors[ptr * 3 + 1] = col.g;
      baseColors[ptr * 3 + 2] = col.b;
      ptr++;
    };

    // Deterministic pseudo-random helper so geometry builds reproducibly
    const rand = (seed: number) => {
      const x = Math.sin(seed * 91.3458) * 47453.5453;
      return x - Math.floor(x);
    };

    // 1. Strand A & Strand B Double Helix Ribbons (clustered tubular organic feel)
    for (let strand = 0; strand < 2; strand++) {
      const phaseOffset = strand * Math.PI;
      const col = strand === 0 ? colorStrandA : colorStrandB;

      for (let i = 0; i < backboneParticlesPerStrand; i++) {
        const t = i / (backboneParticlesPerStrand - 1);
        const angle = t * Math.PI * 2 * helixTurns + phaseOffset;
        const x = (t - 0.5) * helixSpan;

        // Organic micro-scatter around exact helix backbone curve
        const jitterR = (rand(i * 3.1 + strand * 71) - 0.5) * 0.24;
        const jitterAngle = (rand(i * 5.7 + strand * 19) - 0.5) * 0.16;
        const r = helixRadius + jitterR;

        const y = Math.sin(angle + jitterAngle) * r;
        const z = Math.cos(angle + jitterAngle) * r;

        tempColor.copy(col).offsetHSL((rand(i + strand * 13) - 0.5) * 0.04, 0, (rand(i * 2) - 0.5) * 0.12);
        const size = 1.65 + rand(i * 7.3 + strand) * 2.1;

        writeParticle(x, y, z, size, t * 6.28, strand, tempColor);
      }
    }

    // 2. Hydrogen-Bond Base-Pair Rung Bridges + Line Segments Geometry
    const lineVerts: number[] = [];
    const linePhases: number[] = [];

    for (let r = 0; r < rungCount; r++) {
      const t = (r + 0.5) / rungCount;
      const angle = t * Math.PI * 2 * helixTurns;
      const x = (t - 0.5) * helixSpan;

      const y1 = Math.sin(angle) * helixRadius;
      const z1 = Math.cos(angle) * helixRadius;
      const y2 = Math.sin(angle + Math.PI) * helixRadius;
      const z2 = Math.cos(angle + Math.PI) * helixRadius;

      lineVerts.push(x, y1, z1, x, y2, z2);
      linePhases.push(t, t);

      for (let p = 0; p < particlesPerRung; p++) {
        const u = p / (particlesPerRung - 1);
        const px = x + (rand(r * 31 + p) - 0.5) * 0.08;
        const py = THREE.MathUtils.lerp(y1, y2, u) + (rand(r * 17 + p * 3) - 0.5) * 0.08;
        const pz = THREE.MathUtils.lerp(z1, z2, u) + (rand(r * 23 + p * 5) - 0.5) * 0.08;

        tempColor.copy(colorStrandA).lerp(colorStrandB, u);
        if (Math.abs(u - 0.5) < 0.18) {
          tempColor.lerp(colorRung, 0.5);
        }

        const size = 1.25 + (1.0 - Math.abs(u - 0.5) * 1.4) * 1.1;
        writeParticle(px, py, pz, size, t * 6.28 + u, 2.0, tempColor);
      }
    }

    // Also add subtle backbone segments along Strand A & Strand B for crisp biological scaffolding
    const spineSteps = 120;
    for (let strand = 0; strand < 2; strand++) {
      const phaseOffset = strand * Math.PI;
      for (let i = 0; i < spineSteps; i++) {
        const t0 = i / spineSteps;
        const t1 = (i + 1) / spineSteps;
        const a0 = t0 * Math.PI * 2 * helixTurns + phaseOffset;
        const a1 = t1 * Math.PI * 2 * helixTurns + phaseOffset;
        lineVerts.push(
          (t0 - 0.5) * helixSpan,
          Math.sin(a0) * helixRadius,
          Math.cos(a0) * helixRadius,
          (t1 - 0.5) * helixSpan,
          Math.sin(a1) * helixRadius,
          Math.cos(a1) * helixRadius
        );
        linePhases.push(t0, t1);
      }
    }

    // 3. Ambient Bio-Cellular Micro-Particles Floating Around Helix
    for (let i = 0; i < ambientCount; i++) {
      const x = (rand(i * 11.1 + 3) - 0.5) * 13.5;
      const y = (rand(i * 19.7 + 7) - 0.5) * 7.2;
      const z = (rand(i * 29.3 + 11) - 0.5) * 5.0;
      tempColor.copy(colorAmbient).lerp(colorStrandB, rand(i * 4.3));
      writeParticle(x, y, z, 1.0 + rand(i * 8.9) * 1.4, rand(i * 3.7), 3.0, tempColor);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    particleGeometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    particleGeometry.setAttribute('aBaseColor', new THREE.BufferAttribute(baseColors, 3));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uMouseActive: { value: 0 },
        uReducedMotion: { value: reducedMotionRef.current ? 1 : 0 },
        uMouse3D: { value: new THREE.Vector3(0, 0, 0) },
        uAccentColor: { value: accentColorRef.current.clone() },
      },
      vertexShader: DNA_PARTICLE_VERTEX_SHADER,
      fragmentShader: DNA_PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(lineVerts), 3)
    );
    lineGeometry.setAttribute(
      'aPhase',
      new THREE.BufferAttribute(new Float32Array(linePhases), 1)
    );

    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReducedMotion: { value: reducedMotionRef.current ? 1 : 0 },
        uMouse3D: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0 },
        uAccentColor: { value: accentColorRef.current.clone() },
      },
      vertexShader: HELIX_LINE_VERTEX_SHADER,
      fragmentShader: HELIX_LINE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const helixLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(helixLines);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------------------
    // Pre-allocated Interaction & Loop Helpers (Zero GC inside tick)
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    const targetMouse3D = new THREE.Vector3(0, 0, 0);
    const currentMouse3D = new THREE.Vector3(0, 0, 0);
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const _hit = new THREE.Vector3();

    let pointerInside = false;
    let targetActive = 0;
    let currentActive = 0;
    let isVisible = true;
    let disposed = false;
    let frameId = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(interactionPlane, _hit)) {
        targetMouse3D.copy(_hit);
      }
      pointerInside = true;
      targetActive = 1;
    };

    const handlePointerLeave = () => {
      pointerInside = false;
      targetActive = 0;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(320, entry.contentRect.width);
        const h = Math.max(280, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;
        }
      },
      { threshold: 0.02 }
    );
    intersectionObserver.observe(container);

    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl && gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (sync) {
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      if (isVisible) {
        const isReduced = reducedMotionRef.current;

        // Smooth exponential damping for fluid biological cursor wake & camera parallax
        currentMouse3D.x = THREE.MathUtils.damp(currentMouse3D.x, targetMouse3D.x, 8.5, delta);
        currentMouse3D.y = THREE.MathUtils.damp(currentMouse3D.y, targetMouse3D.y, 8.5, delta);
        currentMouse3D.z = THREE.MathUtils.damp(currentMouse3D.z, targetMouse3D.z, 8.5, delta);
        currentActive = THREE.MathUtils.damp(currentActive, targetActive, 6.0, delta);

        const targetCamX = pointerInside && !isReduced ? pointerNdc.x * 0.45 : 0;
        const targetCamY = pointerInside && !isReduced ? pointerNdc.y * 0.3 : 0;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 4.5, delta);
        camera.lookAt(0, 0, 0);

        // Smoothly damp chromatic accent infusion from active DNA discipline
        particleMaterial.uniforms.uAccentColor.value.lerp(
          accentColorRef.current,
          1 - Math.exp(-5.0 * delta)
        );
        lineMaterial.uniforms.uAccentColor.value.copy(
          particleMaterial.uniforms.uAccentColor.value
        );

        particleMaterial.uniforms.uTime.value = elapsed;
        particleMaterial.uniforms.uMouse3D.value.copy(currentMouse3D);
        particleMaterial.uniforms.uMouseActive.value = currentActive;
        particleMaterial.uniforms.uReducedMotion.value = isReduced ? 1 : 0;

        lineMaterial.uniforms.uTime.value = elapsed;
        lineMaterial.uniforms.uMouse3D.value.copy(currentMouse3D);
        lineMaterial.uniforms.uMouseActive.value = currentActive;
        lineMaterial.uniforms.uReducedMotion.value = isReduced ? 1 : 0;

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      scene.remove(points);
      scene.remove(helixLines);
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    />
  );
};

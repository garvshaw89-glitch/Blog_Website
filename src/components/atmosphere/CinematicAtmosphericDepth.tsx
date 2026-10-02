import React, { useEffect, useRef, useState } from 'react';

/**
 * CINEMATIC ATMOSPHERIC DEPTH SYSTEM
 * 
 * Replaces old particle systems with a signature, editorial visual identity.
 * An environment, not an object.
 * 
 * Architecture:
 * 01 — Atmospheric Base (Deep spatial gradient + analog micro-dither, zero banding)
 * 02 — Soft Environmental Light (Large diffuse physical lighting outside viewport)
 * 03 — Architectural Depth (Subtle editorial datum guides & coordinate registers)
 * 04 — Slow Fluid Motion (Continuous volumetric laminar flow, zero particles)
 * 05 — Cursor Light Interaction (Physically grounded soft architectural spotlight)
 * 06 — Scroll Response (Multi-plane parallax across depth layers)
 * 07 — Content-Aware Focus (Calm center reading channel for text clarity)
 */

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_active;
uniform float u_scroll;
uniform float u_dpr;
uniform float u_reduced_motion;

// Simplex-inspired procedural noise functions for continuous fluid atmosphere (zero particles)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 3-octave Fractional Brownian Motion for silky laminar fluid atmosphere
float fbm(vec2 p) {
  float total = 0.0;
  float amp = 0.52;
  float freq = 1.0;
  for (int i = 0; i < 3; i++) {
    total += snoise(p * freq) * amp;
    freq *= 2.05;
    amp *= 0.48;
  }
  return total;
}

void main() {
  // Screen UV space with aspect correction
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 uv = vec2(st.x, 1.0 - st.y);
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 aspectVec = vec2(aspect, 1.0);

  // Time evolution (calibrated to slow, meditative glacial pace)
  float t = (u_reduced_motion > 0.5) ? 0.0 : u_time * 0.024;

  // Normalized scroll parallax offsets for depth stratification
  float scrollBase = u_scroll * 0.00015;
  float scrollFluid = u_scroll * 0.00035;
  float scrollArch = u_scroll * 0.00055;

  // =========================================================================
  // LAYER 01 — ATMOSPHERIC BASE
  // Deep spatial gradient: Graphite -> Charcoal -> Near-Black -> Midnight
  // =========================================================================
  vec2 baseUv = uv + vec2(0.0, scrollBase * 0.1);
  vec3 c0 = vec3(0.035, 0.043, 0.051); // Top: Deep graphite (#090b0d)
  vec3 c1 = vec3(0.043, 0.051, 0.063); // Upper-mid: Charcoal (#0b0d10)
  vec3 c2 = vec3(0.020, 0.024, 0.029); // Center: Near-black (#050607)
  vec3 c3 = vec3(0.027, 0.035, 0.047); // Lower-mid: Soft midnight tone (#07090c)
  vec3 c4 = vec3(0.016, 0.020, 0.025); // Bottom: Abyssal baseline

  float y = baseUv.y;
  vec3 color = mix(c0, c1, smoothstep(0.0, 0.28, y));
  color = mix(color, c2, smoothstep(0.28, 0.58, y));
  color = mix(color, c3, smoothstep(0.58, 0.86, y));
  color = mix(color, c4, smoothstep(0.86, 1.0, y));

  // Analog micro-dither grain to prevent 8-bit digital banding on OLED/HDR
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (1.6 / 255.0);
  color += dither;

  // =========================================================================
  // LAYER 02 — SOFT ENVIRONMENTAL LIGHT
  // Extremely large, soft architectural light sources outside viewport
  // =========================================================================
  // Primary soft light: High outside top-left, entering diagonally
  vec2 lightPos1 = vec2(-0.25, -0.15) + vec2(cos(t * 0.45) * 0.08, sin(t * 0.32) * 0.05);
  float dist1 = length((uv - lightPos1) * aspectVec);
  float envLight1 = pow(clamp(1.0 - dist1 * 0.42, 0.0, 1.0), 2.2);
  vec3 envColor1 = vec3(0.72, 0.78, 0.85); // Soft limestone zinc

  // Secondary soft light: Low outside bottom-right
  vec2 lightPos2 = vec2(1.22, 1.12) + vec2(sin(t * 0.38) * 0.07, cos(t * 0.25) * 0.06);
  float dist2 = length((uv - lightPos2) * aspectVec);
  float envLight2 = pow(clamp(1.0 - dist2 * 0.46, 0.0, 1.0), 2.5);
  vec3 envColor2 = vec3(0.58, 0.68, 0.80); // Cool slate

  // Slow harmonic breathing (35-50 second cycle)
  float breath = 1.0 + 0.12 * sin(t * 0.85);
  color += envColor1 * (envLight1 * 0.048 * breath);
  color += envColor2 * (envLight2 * 0.036 * breath);

  // =========================================================================
  // LAYER 04 — SLOW FLUID MOTION
  // Continuous volumetric laminar atmospheric drift (Zero particles)
  // =========================================================================
  vec2 fluidCoord = (uv + vec2(0.0, scrollFluid)) * vec2(1.4 * aspect, 1.4);
  
  // Smooth dual-pass domain warping for silk-like organic fluid current
  vec2 q = vec2(
    fbm(fluidCoord + vec2(0.0, 0.0) + vec2(t * 0.35, t * 0.18)),
    fbm(fluidCoord + vec2(5.2, 1.3) + vec2(-t * 0.22, t * 0.28))
  );
  vec2 r = vec2(
    fbm(fluidCoord + 2.4 * q + vec2(1.7, 9.2) + vec2(t * 0.15, -t * 0.12)),
    fbm(fluidCoord + 2.4 * q + vec2(8.3, 2.8) + vec2(-t * 0.18, t * 0.16))
  );
  float fluidDensity = fbm(fluidCoord + 2.8 * r);
  fluidDensity = clamp(fluidDensity * 0.5 + 0.5, 0.0, 1.0);
  
  // Very soft volumetric light tint
  vec3 mistColor = vec3(0.60, 0.70, 0.82);
  float mistIntensity = pow(fluidDensity, 2.0) * 0.028;
  color += mistColor * mistIntensity;

  // =========================================================================
  // LAYER 03 — ARCHITECTURAL DEPTH
  // Subtle editorial datum guides, column markers, and registration coordinates
  // =========================================================================
  vec2 archUv = uv + vec2(0.0, scrollArch);
  float pxSize = 1.0 / max(u_resolution.y, 1.0);

  // 12-Column Editorial Grid Guide Lines (ultra-low hairline opacity)
  float colCount = 12.0;
  float colX = archUv.x * colCount;
  float colDist = abs(fract(colX) - 0.5);
  float colLine = smoothstep(pxSize * colCount * 0.85, 0.0, abs(colDist - 0.5));
  
  // Margin bounds: fade out grid at outer margins
  float colFade = smoothstep(0.06, 0.15, archUv.x) * smoothstep(0.94, 0.85, archUv.x);
  
  // Golden-ratio & editorial datum horizontal lines
  float datumY1 = smoothstep(pxSize * 1.2, 0.0, abs(fract(archUv.y * 3.0 + 0.18) - 0.5));
  float datumY2 = smoothstep(pxSize * 1.5, 0.0, abs(fract(archUv.y * 5.0 + 0.62) - 0.5));
  
  float archGuides = (colLine * 0.5 + datumY1 * 0.35 + datumY2 * 0.25) * colFade;

  // Subtle registration crosshair ticks at column intersections
  float crossSize = pxSize * 8.0;
  float crossDistX = abs(fract(colX) - 0.5);
  float crossDistY = abs(fract(archUv.y * 6.0) - 0.5);
  float crosshair = (smoothstep(crossSize, 0.0, crossDistX) * smoothstep(pxSize * 2.0, 0.0, crossDistY)) +
                    (smoothstep(crossSize, 0.0, crossDistY) * smoothstep(pxSize * 2.0, 0.0, crossDistX));
  crosshair = clamp(crosshair, 0.0, 1.0) * colFade;

  vec3 archColor = vec3(0.70, 0.78, 0.88);
  float archAlpha = (archGuides * 0.032 + crosshair * 0.055);

  // =========================================================================
  // LAYER 05 — CURSOR LIGHT INTERACTION
  // Physically grounded soft architectural spotlight with smooth cubic falloff
  // =========================================================================
  vec2 mouseUv = vec2(u_mouse.x / u_resolution.x, 1.0 - u_mouse.y / u_resolution.y);
  float mouseDist = length((uv - mouseUv) * aspectVec);
  
  // Large diffuse radius ~450px
  float mouseRadius = 0.42;
  float cursorLight = pow(clamp(1.0 - mouseDist / mouseRadius, 0.0, 1.0), 2.6);
  cursorLight *= u_mouse_active;

  vec3 cursorColor = vec3(0.82, 0.88, 0.96); // Platinum architectural highlight
  color += cursorColor * (cursorLight * 0.046);

  // Cursor illuminates nearby architectural datum lines
  archAlpha += archGuides * (cursorLight * 0.055);
  color += archColor * archAlpha;

  // =========================================================================
  // LAYER 07 — CONTENT-AWARE FOCUS
  // Soft central reading channel mask for crystal-clear text readability
  // =========================================================================
  // Center reading column receives calm contrast boost; margins retain soft depth
  float centerDistX = abs(uv.x - 0.5) * 2.0;
  float edgeVignette = smoothstep(0.40, 1.15, length((uv - vec2(0.5, 0.5)) * aspectVec));
  
  // Subtly deepen edges to direct eye toward typography
  color *= (1.0 - edgeVignette * 0.16);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const CinematicAtmosphericDepth: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Initialize WebGL
    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setHasError(true);
      return;
    }

    // Compile helper
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    if (!vertShader || !fragShader) {
      setHasError(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasError(true);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link failed:', gl.getProgramInfoLog(program));
      setHasError(true);
      return;
    }

    gl.useProgram(program);

    // Full screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPositionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseActive = gl.getUniformLocation(program, 'u_mouse_active');
    const uScroll = gl.getUniformLocation(program, 'u_scroll');
    const uDpr = gl.getUniformLocation(program, 'u_dpr');
    const uReducedMotion = gl.getUniformLocation(program, 'u_reduced_motion');

    // State tracking with smooth damping (lerp)
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Clamped for performance & battery life

    let targetMouseX = width * 0.5;
    let targetMouseY = height * 0.35;
    let currentMouseX = targetMouseX;
    let currentMouseY = targetMouseY;
    let mouseActive = 0.0;
    let targetMouseActive = 0.0;

    let targetScroll = window.scrollY || 0;
    let currentScroll = targetScroll;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Pointer tracking with luxury inertia
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      targetMouseActive = 1.0;
      if ('touches' in e && e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
      }
    };

    const onPointerLeave = () => {
      targetMouseActive = 0.0;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave, { passive: true });

    // Scroll tracking
    const onScroll = () => {
      targetScroll = window.scrollY || document.documentElement.scrollTop || 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Render loop
    let animId: number;
    let startTime = performance.now();
    let isVisible = !document.hidden;

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      if (!isVisible) return;

      const elapsed = (now - startTime) * 0.001;

      // Smooth lerp updates
      const mouseLerp = 0.048;
      currentMouseX += (targetMouseX - currentMouseX) * mouseLerp;
      currentMouseY += (targetMouseY - currentMouseY) * mouseLerp;
      mouseActive += (targetMouseActive - mouseActive) * 0.04;

      const scrollLerp = 0.06;
      currentScroll += (targetScroll - currentScroll) * scrollLerp;

      gl.useProgram(program);

      // Upload uniforms
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, currentMouseX * dpr, currentMouseY * dpr);
      gl.uniform1f(uMouseActive, mouseActive);
      gl.uniform1f(uScroll, currentScroll);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uReducedMotion, prefersReducedMotion ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);

      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  if (hasError) {
    // Pure CSS/SVG graceful architectural depth fallback
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #090b0d 0%, #0b0d10 25%, #050607 55%, #07090c 85%, #050607 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #708090 1px, transparent 1px), linear-gradient(to bottom, #708090 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full blur-[140px] opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #b0c4de 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.035] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #778899 0%, transparent 70%)' }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#050607]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

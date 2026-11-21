import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createCardPbrTextures,
  GITHUB_REGION_UV,
  HOLO_STRIP_UV,
  NAME_REGION_UV,
  CardPbrTextureSet,
} from './cardTextureFactory';

export interface NameScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HangingIdCardSceneProps {
  isEntering?: boolean;
  transparent?: boolean;
  heroDropMode?: boolean;
  isDocked?: boolean;
  isExtractingName?: boolean;
  isRetracting?: boolean;
  externalImpulseRef?: React.MutableRefObject<{
    velZ: number;
    velY: number;
    velX: number;
  }>;
  onCardHoverChange?: (hovering: boolean) => void;
  onGitHubHoverChange?: (hovering: boolean) => void;
  onGitHubClick?: () => void;
  onCardBodyClick?: () => void;
  onNameScreenRect?: (rect: NameScreenRect) => void;
  onDropSettled?: () => void;
  onRetractComplete?: () => void;
  onEnterProgress?: (progress: number) => void;
  onEnterComplete?: () => void;
  onWebGLError: () => void;
}

const CARD_W = 1.66;
const CARD_H = 2.60;
const CARD_DEPTH = 0.048;
const CORNER_R = 0.12;
const SLOT_W = 0.34;
const SLOT_H = 0.068;
const SLOT_Y = CARD_H / 2 - 0.16;
const PIVOT_Y = 5.4;
const STRAP_BOTTOM_Y = -4.22; // places clasp around y = +1.18 and card center around y = -0.54 for a long visible strap

function detectSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
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

function createRoundedRectShape(
  w: number,
  h: number,
  r: number,
  withSlot: boolean
): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  if (withSlot) {
    const sw = SLOT_W / 2;
    const sh = SLOT_H / 2;
    const sr = sh;
    const hole = new THREE.Path();
    hole.moveTo(-sw + sr, SLOT_Y - sh);
    hole.lineTo(sw - sr, SLOT_Y - sh);
    hole.absarc(sw - sr, SLOT_Y, sr, -Math.PI / 2, Math.PI / 2, false);
    hole.lineTo(-sw + sr, SLOT_Y + sh);
    hole.absarc(-sw + sr, SLOT_Y, sr, Math.PI / 2, (Math.PI * 3) / 2, false);
    shape.holes.push(hole);
  }

  return shape;
}

function normalizeShapeUvs(geo: THREE.BufferGeometry, w: number, h: number) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv[i * 2] = (x + w / 2) / w;
    uv[i * 2 + 1] = (y + h / 2) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function buildStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x05070c);

  // Overhead crisp ice-white studio softbox
  const topBox = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.15, 2.35, 2.55), side: THREE.DoubleSide })
  );
  topBox.position.set(0, 7.5, 2.5);
  topBox.rotation.x = Math.PI / 2.2;
  envScene.add(topBox);

  // Left luminous cyan-sky vertical studio strip light (matches main page cyan accent)
  const leftStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 2.05, 2.65), side: THREE.DoubleSide })
  );
  leftStrip.position.set(-8.5, 1.2, 4.0);
  leftStrip.lookAt(0, 0, 0);
  envScene.add(leftStrip);

  // Right sapphire-indigo vertical studio strip light (matches Milky Way deep-blue/violet)
  const rightStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.48, 2.55), side: THREE.DoubleSide })
  );
  rightStrip.position.set(8.5, 0.8, 3.8);
  rightStrip.lookAt(0, 0, 0);
  envScene.add(rightStrip);

  // Subtle front-low cool slate bounce fill card
  const lowBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.28, 0.36, 0.48), side: THREE.DoubleSide })
  );
  lowBounce.position.set(0, -6.8, 4.5);
  lowBounce.lookAt(0, 0, 0);
  envScene.add(lowBounce);

  const envRT = pmrem.fromScene(envScene, 0.045);

  // Dispose temporary env scene geometries & materials
  envScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
  pmrem.dispose();

  return envRT;
}

// Restrained thin-film holographic security strip GLSL shader
const HOLO_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const HOLO_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uPointer;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vWorldNormal);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);

    // Subtle fine micro-prism grating angle
    float angleShift = (1.0 - ndotv) * 4.4 + vUv.x * 2.2 + uPointer.x * 0.75 + sin(uTime * 0.65) * 0.12;
    float microLine = 0.5 + 0.5 * sin((vUv.x * 165.0 + vUv.y * 42.0) + angleShift * 3.0);
    float waveBand = exp(-pow((vUv.x - (0.5 + uPointer.x * 0.42 + sin(uTime * 0.75) * 0.14)) * 3.4, 2.0));

    // Main-page cosmic holographic spectrum: ice-platinum -> electric cyan -> sapphire -> subtle violet
    vec3 iceCyan    = vec3(0.32, 0.82, 0.99);
    vec3 pearl      = vec3(0.90, 0.96, 1.00);
    vec3 sapphire   = vec3(0.28, 0.56, 0.98);
    vec3 prismIndigo = vec3(0.58, 0.44, 0.98);

    float ph = fract(angleShift * 0.42);
    vec3 spec = ph < 0.33
      ? mix(iceCyan, pearl, smoothstep(0.0, 0.33, ph))
      : ph < 0.66
        ? mix(pearl, sapphire, smoothstep(0.33, 0.66, ph))
        : mix(sapphire, prismIndigo, smoothstep(0.66, 1.0, ph));

    vec3 finalCol = mix(iceCyan * 0.82, spec, 0.72) * (0.68 + 0.32 * microLine);
    finalCol += pearl * waveBand * (0.28 + 0.25 * uHover);

    // Soft edge feather so strip sits flush inside recessed slot
    float edgeX = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);
    float edgeY = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
    float alpha = (0.30 + waveBand * 0.36 + uHover * 0.10) * edgeX * edgeY;

    gl_FragColor = vec4(finalCol, clamp(alpha, 0.0, 0.78));
  }
`;

export const HangingIdCardScene: React.FC<HangingIdCardSceneProps> = ({
  isEntering = false,
  transparent = false,
  heroDropMode = false,
  isDocked = false,
  isExtractingName = false,
  isRetracting = false,
  externalImpulseRef,
  onCardHoverChange,
  onGitHubHoverChange,
  onGitHubClick,
  onCardBodyClick,
  onNameScreenRect,
  onDropSettled,
  onRetractComplete,
  onEnterProgress,
  onEnterComplete,
  onWebGLError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isEnteringRef = useRef<boolean>(isEntering);
  const isDockedRef = useRef<boolean>(isDocked);
  const isExtractingNameRef = useRef<boolean>(isExtractingName);
  const isRetractingRef = useRef<boolean>(isRetracting);
  const callbacksRef = useRef({
    onCardHoverChange,
    onGitHubHoverChange,
    onGitHubClick,
    onCardBodyClick,
    onNameScreenRect,
    onDropSettled,
    onRetractComplete,
    onEnterProgress,
    onEnterComplete,
    onWebGLError,
  });

  useEffect(() => {
    isEnteringRef.current = isEntering;
  }, [isEntering]);

  useEffect(() => {
    isDockedRef.current = isDocked;
  }, [isDocked]);

  useEffect(() => {
    isExtractingNameRef.current = isExtractingName;
  }, [isExtractingName]);

  useEffect(() => {
    isRetractingRef.current = isRetracting;
  }, [isRetracting]);

  useEffect(() => {
    callbacksRef.current = {
      onCardHoverChange,
      onGitHubHoverChange,
      onGitHubClick,
      onCardBodyClick,
      onNameScreenRect,
      onDropSettled,
      onRetractComplete,
      onEnterProgress,
      onEnterComplete,
      onWebGLError,
    };
  }, [
    onCardHoverChange,
    onGitHubHoverChange,
    onGitHubClick,
    onCardBodyClick,
    onNameScreenRect,
    onDropSettled,
    onRetractComplete,
    onEnterProgress,
    onEnterComplete,
    onWebGLError,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: transparent,
        powerPreference: 'high-performance',
      });
    } catch {
      callbacksRef.current.onWebGLError();
      return;
    }

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;
    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl && !transparent;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x050608, transparent ? 0 : 1);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    if (!transparent) {
      scene.background = new THREE.Color(0x050608);
      scene.fog = new THREE.FogExp2(0x050608, 0.045);
    }

    const envRT = buildStudioEnvironment(renderer);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 45);
    const computeBaseCamZ = (w: number, h: number) => {
      const aspect = w / Math.max(h, 1);
      if (heroDropMode) {
        // Bold, big commanding presence over the live Milky Way while keeping long strap visible above clasp
        if (aspect < 0.62) return 8.35;
        if (aspect < 0.85) return 7.1;
        if (aspect < 1.15) return 6.45;
        return 5.85;
      }
      if (transparent) {
        return Math.max(7.9, 5.2 / Math.max(aspect, 0.42));
      }
      if (aspect < 0.62) return 10.6;
      if (aspect < 0.85) return 9.2;
      if (aspect < 1.15) return 8.3;
      return 7.75;
    };
    let baseCamZ = computeBaseCamZ(width, height);
    camera.position.set(0, -0.08, baseCamZ);
    camera.lookAt(0, -0.34, 0);

    // ------------------------------------------------------------------------
    // CINEMATIC STUDIO LIGHTING & SOFT SHADOW RECEIVER BACKDROP (Main Page Palette)
    // ------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x1b273e, transparent ? 0.85 : 0.62);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0xeef8ff, 46, 24, Math.PI / 4.2, 0.72, 1.5);
    keySpot.position.set(2.4, 5.4, 6.2);
    keySpot.target.position.set(0, -0.2, 0);
    if (!isSoftwareGl && !transparent) {
      keySpot.castShadow = true;
      keySpot.shadow.mapSize.width = 1024;
      keySpot.shadow.mapSize.height = 1024;
      keySpot.shadow.bias = -0.0005;
      keySpot.shadow.normalBias = 0.015;
      keySpot.shadow.radius = 4;
    }
    scene.add(keySpot);
    scene.add(keySpot.target);

    // Celestial cyan-sapphire rim light tracing the metallic bevel edges
    const rimCyanLight = new THREE.DirectionalLight(0x56c8ff, 2.2);
    rimCyanLight.position.set(4.5, 2.2, -2.5);
    scene.add(rimCyanLight);

    // Subtle cosmic indigo fill light on opposite side for editorial depth
    const fillIndigoLight = new THREE.DirectionalLight(0x818cf8, 1.15);
    fillIndigoLight.position.set(-5.0, 1.4, 3.6);
    scene.add(fillIndigoLight);

    // Dynamic cursor reflection point light (ice-cyan specular sweep on hover)
    const cursorLight = new THREE.PointLight(0x9ce2ff, 0.0, 6.5, 1.7);
    cursorLight.position.set(0, 0.2, 2.2);
    scene.add(cursorLight);

    // Subtle matte obsidian-midnight studio backdrop (only in full-screen opaque studio mode)
    if (!transparent) {
      const backdropGeo = new THREE.PlaneGeometry(24, 18);
      const backdropMat = new THREE.MeshStandardMaterial({
        color: 0x06080d,
        roughness: 0.94,
        metalness: 0.06,
      });
      const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
      backdropMesh.position.set(0, 0, -2.35);
      backdropMesh.receiveShadow = !isSoftwareGl;
      scene.add(backdropMesh);
    }

    // ------------------------------------------------------------------------
    // PBR TEXTURES & MATERIALS
    // ------------------------------------------------------------------------
    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy() || 4, 8);
    let textures: CardPbrTextureSet = createCardPbrTextures(maxAniso);

    const champagneMetalMat = new THREE.MeshPhysicalMaterial({
      color: 0x8eb8dc,
      metalness: 0.94,
      roughness: 0.20,
      clearcoat: 0.48,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.7,
    });

    const brushedGunmetalMat = new THREE.MeshPhysicalMaterial({
      color: 0x182132,
      metalness: 0.9,
      roughness: 0.26,
      clearcoat: 0.34,
      envMapIntensity: 1.45,
    });

    const frontFaceMat = new THREE.MeshPhysicalMaterial({
      map: textures.frontMap,
      roughnessMap: textures.frontRoughnessMap,
      roughness: 0.88,
      metalnessMap: textures.frontMetalnessMap,
      metalness: 0.82,
      bumpMap: textures.frontBumpMap,
      bumpScale: 0.0028,
      clearcoat: 0.78,
      clearcoatRoughness: 0.16,
      reflectivity: 0.88,
      envMapIntensity: 1.25,
    });

    const backFaceMat = new THREE.MeshPhysicalMaterial({
      map: textures.backMap,
      roughnessMap: textures.backRoughnessMap,
      roughness: 0.85,
      metalness: 0.24,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.05,
    });

    textures.lanyardMap.repeat.set(1, 2.4);
    textures.lanyardBumpMap.repeat.set(1, 2.4);

    const lanyardMat = new THREE.MeshStandardMaterial({
      map: textures.lanyardMap,
      bumpMap: textures.lanyardBumpMap,
      bumpScale: 0.009,
      roughness: 0.82,
      metalness: 0.08,
      side: THREE.DoubleSide,
      envMapIntensity: 0.6,
    });

    // Re-render card textures once web fonts (Cormorant Garamond, Space Grotesk, JetBrains Mono) finish loading
    let disposed = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (disposed) return;
        const fresh = createCardPbrTextures(maxAniso);
        fresh.lanyardMap.repeat.set(1, 2.4);
        fresh.lanyardBumpMap.repeat.set(1, 2.4);

        frontFaceMat.map = fresh.frontMap;
        frontFaceMat.roughnessMap = fresh.frontRoughnessMap;
        frontFaceMat.metalnessMap = fresh.frontMetalnessMap;
        frontFaceMat.bumpMap = fresh.frontBumpMap;
        frontFaceMat.needsUpdate = true;

        backFaceMat.map = fresh.backMap;
        backFaceMat.roughnessMap = fresh.backRoughnessMap;
        backFaceMat.needsUpdate = true;

        lanyardMat.map = fresh.lanyardMap;
        lanyardMat.bumpMap = fresh.lanyardBumpMap;
        lanyardMat.needsUpdate = true;

        textures.dispose();
        textures = fresh;
      });
    }

    // ------------------------------------------------------------------------
    // RIG HIERARCHY: DROP GROUP -> PENDULUM PIVOT -> LANYARD + CLASP + CARD
    // ------------------------------------------------------------------------
    const dropGroup = new THREE.Group();
    dropGroup.position.set(0, 6.8, 0); // Starts above screen for cinematic descent
    scene.add(dropGroup);

    const pendulumPivot = new THREE.Group();
    pendulumPivot.position.set(0, PIVOT_Y, 0);
    dropGroup.add(pendulumPivot);

    // Long flexible woven lanyard double-strap mesh (dynamically flexed along Bezier curve)
    const strapTopY = 3.2; // extends well past top viewport edge even during full descent
    const strapBottomY = STRAP_BOTTOM_Y;
    const strapSpan = strapTopY - strapBottomY;
    const strapSegmentsY = 28;
    const strapGeo = new THREE.PlaneGeometry(0.28, strapSpan, 4, strapSegmentsY);
    // Keep a rest copy of vertices so we can smoothly bend the ribbon in real time
    const strapBasePos = new Float32Array(strapGeo.attributes.position.array);
    const strapMesh = new THREE.Mesh(strapGeo, lanyardMat);
    strapMesh.position.set(0, strapBottomY + strapSpan / 2, -0.014);
    strapMesh.castShadow = !isSoftwareGl;
    pendulumPivot.add(strapMesh);

    // Second back fold of lanyard ribbon for realistic 3D textile thickness
    const strapBackGeo = new THREE.PlaneGeometry(0.28, strapSpan, 4, strapSegmentsY);
    const strapBackBasePos = new Float32Array(strapBackGeo.attributes.position.array);
    const strapBackMesh = new THREE.Mesh(strapBackGeo, lanyardMat);
    strapBackMesh.position.set(0, strapBottomY + strapSpan / 2, -0.052);
    strapBackMesh.rotation.y = Math.PI;
    pendulumPivot.add(strapBackMesh);

    // Hardware & Card sub-hinge positioned at bottom of lanyard
    const hardwareGroup = new THREE.Group();
    hardwareGroup.position.set(0, strapBottomY, 0);
    pendulumPivot.add(hardwareGroup);

    // 1) Brushed Gunmetal Strap Crimp Collar
    const crimpGeo = new THREE.BoxGeometry(0.33, 0.20, 0.088);
    const crimpMesh = new THREE.Mesh(crimpGeo, brushedGunmetalMat);
    crimpMesh.position.set(0, 0.02, -0.02);
    crimpMesh.castShadow = !isSoftwareGl;
    hardwareGroup.add(crimpMesh);

    // Brushed titanium-cyan trim band on crimp collar
    const crimpTrimGeo = new THREE.BoxGeometry(0.342, 0.036, 0.095);
    const crimpTrimMesh = new THREE.Mesh(crimpTrimGeo, champagneMetalMat);
    crimpTrimMesh.position.set(0, -0.068, -0.02);
    hardwareGroup.add(crimpTrimMesh);

    // 2) Swivel Barrel & Collar Rings
    const swivelStemGeo = new THREE.CylinderGeometry(0.052, 0.064, 0.16, 20);
    const swivelStem = new THREE.Mesh(swivelStemGeo, champagneMetalMat);
    swivelStem.position.set(0, -0.16, -0.01);
    swivelStem.castShadow = !isSoftwareGl;
    hardwareGroup.add(swivelStem);

    const swivelCollarGeo = new THREE.TorusGeometry(0.068, 0.016, 12, 24);
    const swivelCollar = new THREE.Mesh(swivelCollarGeo, brushedGunmetalMat);
    swivelCollar.rotation.x = Math.PI / 2;
    swivelCollar.position.set(0, -0.22, -0.01);
    hardwareGroup.add(swivelCollar);

    // 3) Sculpted Metallic Swivel Clasp / Carabiner Hook
    const claspRingGeo = new THREE.TorusGeometry(0.115, 0.024, 14, 28);
    const claspRing = new THREE.Mesh(claspRingGeo, champagneMetalMat);
    claspRing.position.set(0, -0.35, -0.005);
    claspRing.scale.set(0.84, 1.18, 1.0);
    claspRing.castShadow = !isSoftwareGl;
    hardwareGroup.add(claspRing);

    // Inner metallic clasp gate pin
    const claspGateGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.14, 12);
    const claspGate = new THREE.Mesh(claspGateGeo, brushedGunmetalMat);
    claspGate.position.set(0.088, -0.34, -0.005);
    claspGate.rotation.z = -0.14;
    hardwareGroup.add(claspGate);

    // Secondary Card Hinge Group (pivots right where clasp hooks the card slot!)
    const cardHinge = new THREE.Group();
    cardHinge.position.set(0, -0.45, 0);
    hardwareGroup.add(cardHinge);

    // Small linking loop passing perpendicular through the card's punched slot
    const linkLoopGeo = new THREE.TorusGeometry(0.085, 0.017, 12, 24);
    const linkLoop = new THREE.Mesh(linkLoopGeo, champagneMetalMat);
    linkLoop.rotation.y = Math.PI / 2;
    linkLoop.position.set(0, -0.075, 0);
    cardHinge.add(linkLoop);

    // Card assembly positioned so SLOT_Y aligns directly with linkLoop
    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, -0.13 - SLOT_Y, 0);
    cardHinge.add(cardGroup);

    // ------------------------------------------------------------------------
    // THICK ROUNDED-EDGE BEVELED 3D DEVELOPER ID CARD
    // ------------------------------------------------------------------------
    const cardBodyShape = createRoundedRectShape(CARD_W, CARD_H, CORNER_R, true);
    const cardBodyGeo = new THREE.ExtrudeGeometry(cardBodyShape, {
      depth: CARD_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 5,
      curveSegments: 24,
    });
    cardBodyGeo.translate(0, 0, -CARD_DEPTH / 2);
    const cardBodyMesh = new THREE.Mesh(cardBodyGeo, champagneMetalMat);
    cardBodyMesh.castShadow = !isSoftwareGl;
    cardBodyMesh.receiveShadow = !isSoftwareGl;
    cardGroup.add(cardBodyMesh);

    // Recessed Front & Back Luxury Dark Acrylic + Clearcoat Glass Plates
    const faceInset = 0.022;
    const faceShape = createRoundedRectShape(
      CARD_W - faceInset,
      CARD_H - faceInset,
      CORNER_R - 0.01,
      true
    );
    const frontFaceGeo = new THREE.ShapeGeometry(faceShape, 24);
    normalizeShapeUvs(frontFaceGeo, CARD_W, CARD_H);
    const frontFaceMesh = new THREE.Mesh(frontFaceGeo, frontFaceMat);
    frontFaceMesh.position.z = CARD_DEPTH / 2 + 0.019;
    frontFaceMesh.receiveShadow = !isSoftwareGl;
    cardGroup.add(frontFaceMesh);

    const backFaceGeo = new THREE.ShapeGeometry(faceShape, 24);
    normalizeShapeUvs(backFaceGeo, CARD_W, CARD_H);
    const backFaceMesh = new THREE.Mesh(backFaceGeo, backFaceMat);
    backFaceMesh.position.z = -(CARD_DEPTH / 2 + 0.019);
    backFaceMesh.rotation.y = Math.PI;
    cardGroup.add(backFaceMesh);

    // Metallic Slot Grommet Collar around punched top slot
    const grommetOuter = createRoundedRectShape(SLOT_W + 0.06, SLOT_H + 0.05, SLOT_H / 2 + 0.022, false);
    const grommetHole = new THREE.Path();
    const gsw = SLOT_W / 2;
    const gsh = SLOT_H / 2;
    grommetHole.moveTo(-gsw + gsh, -gsh);
    grommetHole.lineTo(gsw - gsh, -gsh);
    grommetHole.absarc(gsw - gsh, 0, gsh, -Math.PI / 2, Math.PI / 2, false);
    grommetHole.lineTo(-gsw + gsh, gsh);
    grommetHole.absarc(-gsw + gsh, 0, gsh, Math.PI / 2, (Math.PI * 3) / 2, false);
    grommetOuter.holes.push(grommetHole);
    const grommetGeo = new THREE.ExtrudeGeometry(grommetOuter, {
      depth: CARD_DEPTH + 0.042,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 18,
    });
    grommetGeo.translate(0, SLOT_Y, -(CARD_DEPTH + 0.042) / 2);
    const grommetMesh = new THREE.Mesh(grommetGeo, champagneMetalMat);
    cardGroup.add(grommetMesh);

    // Iridescent Holographic Security Strip Overlay Mesh (aligned to HOLO_STRIP_UV)
    const holoW = HOLO_STRIP_UV.w * CARD_W;
    const holoH = HOLO_STRIP_UV.h * CARD_H;
    const holoCenterX = (HOLO_STRIP_UV.x + HOLO_STRIP_UV.w / 2 - 0.5) * CARD_W;
    const holoCenterY = (0.5 - (HOLO_STRIP_UV.y + HOLO_STRIP_UV.h / 2)) * CARD_H;
    const holoGeo = new THREE.PlaneGeometry(holoW, holoH);
    const holoMat = new THREE.ShaderMaterial({
      vertexShader: HOLO_VERTEX_SHADER,
      fragmentShader: HOLO_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
    });
    const holoMesh = new THREE.Mesh(holoGeo, holoMat);
    holoMesh.position.set(holoCenterX, holoCenterY, CARD_DEPTH / 2 + 0.022);
    cardGroup.add(holoMesh);

    // Interactive GitHub Section Champagne-Gold Highlight Frame (lights up smoothly on hover)
    const ghW = GITHUB_REGION_UV.w * CARD_W;
    const ghH = GITHUB_REGION_UV.h * CARD_H;
    const ghCenterX = (GITHUB_REGION_UV.x + GITHUB_REGION_UV.w / 2 - 0.5) * CARD_W;
    const ghCenterY = (0.5 - (GITHUB_REGION_UV.y + GITHUB_REGION_UV.h / 2)) * CARD_H;
    const ghGlowGeo = new THREE.PlaneGeometry(ghW + 0.02, ghH + 0.02);
    const ghGlowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 d = abs(vUv - 0.5) * 2.0;
          float border = smoothstep(0.91, 0.99, max(d.x, d.y));
          float sheen = exp(-pow((vUv.x - fract(uTime * 0.42)) * 4.5, 2.0)) * 0.24;
          vec3 cyanGlow = vec3(0.32, 0.80, 1.0);
          float alpha = (border * 0.78 + sheen + 0.08) * uOpacity;
          if (alpha < 0.005) discard;
          gl_FragColor = vec4(cyanGlow, alpha);
        }
      `,
    });
    const ghGlowMesh = new THREE.Mesh(ghGlowGeo, ghGlowMat);
    ghGlowMesh.position.set(ghCenterX, ghCenterY, CARD_DEPTH / 2 + 0.023);
    cardGroup.add(ghGlowMesh);

    // Name Extraction Cover & Cyan Energy Pulse Mesh (aligned to GARV SHAW on card face)
    // Smoothly masks GARV SHAW into a recessed dark-obsidian slot with a cyan flash as the name peels off the card!
    const nameW = NAME_REGION_UV.w * CARD_W;
    const nameH = NAME_REGION_UV.h * CARD_H;
    const nameCenterX = (NAME_REGION_UV.x + NAME_REGION_UV.w / 2 - 0.5) * CARD_W;
    const nameCenterY = (0.5 - (NAME_REGION_UV.y + NAME_REGION_UV.h / 2)) * CARD_H;
    const nameMaskGeo = new THREE.PlaneGeometry(nameW + 0.03, nameH + 0.03);
    const nameMaskMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uExtract: { value: 0 },
        uFlash: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uExtract;
        uniform float uFlash;
        varying vec2 vUv;
        void main() {
          if (uExtract <= 0.004 && uFlash <= 0.004) discard;
          float featherX = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          float featherY = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
          float mask = featherX * featherY;

          // Match card obsidian-midnight substrate so GARV SHAW cleanly leaves an empty recessed space
          vec3 recessCol = mix(vec3(0.035, 0.052, 0.095), vec3(0.048, 0.068, 0.115), vUv.x);
          // Luminous cyan-platinum extraction pulse sweeping across the detached name slot
          float sweep = exp(-pow((vUv.x - (1.0 - uFlash)) * 4.5, 2.0));
          vec3 glowCol = vec3(0.38, 0.86, 1.0) * (uFlash * 0.85 + sweep * uFlash * 0.95);

          vec3 col = recessCol + glowCol;
          float alpha = clamp(uExtract * 0.96 + uFlash * 0.55, 0.0, 1.0) * mask;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const nameMaskMesh = new THREE.Mesh(nameMaskGeo, nameMaskMat);
    nameMaskMesh.position.set(nameCenterX, nameCenterY, CARD_DEPTH / 2 + 0.024);
    cardGroup.add(nameMaskMesh);

    // Pre-allocated vectors for projecting exact GARV SHAW 3D bounds to viewport CSS pixels (zero GC)
    const _nameTopLeft = new THREE.Vector3();
    const _nameBottomRight = new THREE.Vector3();
    const projectNameScreenRect = (): NameScreenRect => {
      cardGroup.updateWorldMatrix(true, false);
      camera.updateMatrixWorld();
      const rect = canvas.getBoundingClientRect();
      _nameTopLeft.set(
        nameCenterX - nameW * 0.5,
        nameCenterY + nameH * 0.5,
        CARD_DEPTH / 2 + 0.025
      );
      _nameBottomRight.set(
        nameCenterX + nameW * 0.5,
        nameCenterY - nameH * 0.5,
        CARD_DEPTH / 2 + 0.025
      );
      cardGroup.localToWorld(_nameTopLeft);
      cardGroup.localToWorld(_nameBottomRight);
      _nameTopLeft.project(camera);
      _nameBottomRight.project(camera);

      const x1 = rect.left + (_nameTopLeft.x * 0.5 + 0.5) * rect.width;
      const y1 = rect.top + (-_nameTopLeft.y * 0.5 + 0.5) * rect.height;
      const x2 = rect.left + (_nameBottomRight.x * 0.5 + 0.5) * rect.width;
      const y2 = rect.top + (-_nameBottomRight.y * 0.5 + 0.5) * rect.height;

      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      return {
        left,
        top,
        width: Math.max(40, Math.abs(x2 - x1)),
        height: Math.max(16, Math.abs(y2 - y1)),
      };
    };

    // ------------------------------------------------------------------------
    // RAYCASTER & POINTER INTERACTION
    // ------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(0, 0);
    let smoothPtrX = 0;
    let smoothPtrY = 0;
    let prevPtrX = 0;
    let prevPtrY = 0;
    let isPointerInside = false;
    let pointerDirty = false;
    let isHoveringCard = false;
    let isHoveringGitHub = false;
    let hoverBlend = 0;
    let ghHoverBlend = 0;

    // ------------------------------------------------------------------------
    // SPRING-PENDULUM PHYSICS STATE
    // ------------------------------------------------------------------------
    let dropY = 6.2;
    let dropVel = 0;
    let dropStarted = false;
    let dropSettled = false;

    let swingZ = 0.20; // initial release angle for authentic pendulum swing
    let velZ = -0.72;
    let swingX = -0.12;
    let velX = 0.38;
    let twistY = -0.36; // subtle twist as it drops into frame
    let velY = 1.15;

    let cardLagRoll = 0;
    let cardLagRollVel = 0;
    let cardLagPitch = 0;
    let cardLagPitchVel = 0;

    let enterTriggered = false;
    let enterProgress = 0;
    let enterCompleted = false;
    let extractTriggered = false;
    let extractProgress = 0;
    let retractTriggered = false;
    let retractElapsed = 0;
    let retractCompleted = false;
    let retractStartY = 0;

    const updateHoverStates = () => {
      if (!isPointerInside || isEnteringRef.current) {
        if (isHoveringCard) {
          isHoveringCard = false;
          callbacksRef.current.onCardHoverChange?.(false);
        }
        if (isHoveringGitHub) {
          isHoveringGitHub = false;
          callbacksRef.current.onGitHubHoverChange?.(false);
        }
        return;
      }

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(frontFaceMesh, false);

      if (hits.length > 0 && hits[0].uv) {
        if (!isHoveringCard) {
          isHoveringCard = true;
          callbacksRef.current.onCardHoverChange?.(true);
        }
        if (isDockedRef.current) {
          if (isHoveringGitHub) {
            isHoveringGitHub = false;
            callbacksRef.current.onGitHubHoverChange?.(false);
          }
          return;
        }
        const uv = hits[0].uv;
        const canvasX = uv.x;
        const canvasY = 1.0 - uv.y;
        const overGh =
          canvasX >= GITHUB_REGION_UV.x &&
          canvasX <= GITHUB_REGION_UV.x + GITHUB_REGION_UV.w &&
          canvasY >= GITHUB_REGION_UV.y &&
          canvasY <= GITHUB_REGION_UV.y + GITHUB_REGION_UV.h;

        if (overGh !== isHoveringGitHub) {
          isHoveringGitHub = overGh;
          callbacksRef.current.onGitHubHoverChange?.(overGh);
        }
      } else {
        if (isHoveringCard) {
          isHoveringCard = false;
          callbacksRef.current.onCardHoverChange?.(false);
        }
        if (isHoveringGitHub) {
          isHoveringGitHub = false;
          callbacksRef.current.onGitHubHoverChange?.(false);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const dx = nx - prevPtrX;
      const dy = ny - prevPtrY;
      prevPtrX = nx;
      prevPtrY = ny;
      pointerNdc.set(nx, ny);
      isPointerInside = true;
      pointerDirty = true;

      // Impart subtle tactile pendulum impulse when gliding over/near the card
      if (!isEnteringRef.current && dropStarted && Math.abs(dropY) < 0.8) {
        const dockedDamp = isDockedRef.current ? 0.55 : 1.0;
        const proximity = (isHoveringCard ? 1.0 : 0.28) * dockedDamp;
        velZ += THREE.MathUtils.clamp(dx * 0.42 * proximity, -0.09, 0.09);
        velY += THREE.MathUtils.clamp(dx * 0.65 * proximity, -0.14, 0.14);
        velX += THREE.MathUtils.clamp(-dy * 0.35 * proximity, -0.08, 0.08);
      }
    };

    const handlePointerLeave = () => {
      isPointerInside = false;
      pointerDirty = true;
      pointerNdc.set(0, 0);
    };

    const handleClick = (e: MouseEvent) => {
      if (isEnteringRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerNdc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(frontFaceMesh, false);
      if (hits.length > 0 && hits[0].uv) {
        if (isDockedRef.current && callbacksRef.current.onCardBodyClick) {
          velZ -= 0.42;
          velY += 0.65;
          callbacksRef.current.onCardBodyClick();
          return;
        }
        const uv = hits[0].uv;
        const cx = uv.x;
        const cy = 1.0 - uv.y;
        const overGh =
          cx >= GITHUB_REGION_UV.x &&
          cx <= GITHUB_REGION_UV.x + GITHUB_REGION_UV.w &&
          cy >= GITHUB_REGION_UV.y &&
          cy <= GITHUB_REGION_UV.y + GITHUB_REGION_UV.h;
        if (overGh && callbacksRef.current.onGitHubClick) {
          // Subtle tactile recoil on click
          velX -= 0.48;
          callbacksRef.current.onGitHubClick();
        } else {
          // Clicking elsewhere on the card gives a satisfying gentle physical nudge!
          const hitOffsetX = (cx - 0.5) * 2;
          velY += hitOffsetX * 1.15;
          velZ -= hitOffsetX * 0.32;
          velX -= 0.36;
          callbacksRef.current.onCardBodyClick?.();
        }
      }
    };

    const handleResize = () => {
      if (disposed || !container) return;
      const w = container.clientWidth || window.innerWidth || 1280;
      const h = container.clientHeight || window.innerHeight || 720;
      camera.aspect = w / h;
      baseCamZ = computeBaseCamZ(w, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => handleResize())
        : null;
    resizeObserver?.observe(container);

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    canvas.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize, { passive: true });

    // ------------------------------------------------------------------------
    // MAIN 60FPS PHYSICS & STUDIO RENDER LOOP
    // ------------------------------------------------------------------------
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let isTabHidden = typeof document !== 'undefined' ? document.hidden : false;
    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      if (!isTabHidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const flexRibbon = (
      geo: THREE.BufferGeometry,
      base: Float32Array,
      bendX: number,
      bendZ: number
    ) => {
      const pos = geo.attributes.position;
      const count = pos.count;
      const halfSpan = strapSpan / 2;
      for (let i = 0; i < count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];
        // Normalized 0 at top anchor -> 1 at clasp
        const t = THREE.MathUtils.clamp((halfSpan - by) / strapSpan, 0, 1);
        const curve = t * (1 - t) * 4.0; // smooth belly flex peaking mid-ribbon
        pos.setXYZ(i, bx + bendX * curve * 0.14, by, bz + bendZ * curve * 0.12);
      }
      pos.needsUpdate = true;
    };

    const tick = (now: number) => {
      if (disposed) return;

      if (isTabHidden) {
        lastTime = now;
        rafId = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      elapsed += dt;

      // 1. Trigger weighty lanyard descent after brief opening beat, or retract back up where it came from
      if (!dropStarted && elapsed >= (heroDropMode ? 0.04 : 0.12)) {
        dropStarted = true;
      }

      if (isRetractingRef.current) {
        if (!retractTriggered) {
          retractTriggered = true;
          retractStartY = dropY;
          retractElapsed = 0;
          velZ -= 0.42;
          velX += 0.28;
          velY -= 0.35;
        }
        retractElapsed += dt;
        const p = Math.min(1, retractElapsed / 1.12);
        const easeUp =
          p < 0.45
            ? 2.2 * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const targetRetractY = 7.4;
        dropY = THREE.MathUtils.lerp(retractStartY, targetRetractY, Math.min(1, easeUp));
        dropGroup.position.y = dropY;

        if (p >= 1 && !retractCompleted) {
          retractCompleted = true;
          callbacksRef.current.onRetractComplete?.();
          return;
        }
      } else if (dropStarted) {
        // Gravity-weighted spring descent (smoothly settles into hanging position in ~0.95s)
        const dropK = heroDropMode ? 22.0 : 14.5;
        const dropC = heroDropMode ? 7.2 : 5.6;
        const dropForce = -dropK * dropY - dropC * dropVel;
        dropVel += dropForce * dt;
        dropY += dropVel * dt;
        dropGroup.position.y = dropY;

        if (
          !dropSettled &&
          ((Math.abs(dropY) < 0.09 && Math.abs(dropVel) < 0.20) || elapsed >= 1.15)
        ) {
          dropSettled = true;
          callbacksRef.current.onDropSettled?.();
        }
      }

      // 1b. Name extraction off the front face of the ID card
      if (isExtractingNameRef.current && !extractTriggered) {
        extractTriggered = true;
        // Subtle tactile recoil as "GARV SHAW" detaches from the card surface
        velX -= 0.38;
        velZ += 0.24;
        velY += 0.22;
        callbacksRef.current.onNameScreenRect?.(projectNameScreenRect());
      }

      if (extractTriggered) {
        extractProgress = Math.min(1, extractProgress + dt / 0.42);
        const smoothExt = extractProgress * extractProgress * (3 - 2 * extractProgress);
        const flashCurve = Math.sin(Math.min(1, extractProgress * 1.15) * Math.PI);
        nameMaskMat.uniforms.uExtract.value = smoothExt;
        nameMaskMat.uniforms.uFlash.value = Math.max(0, flashCurve);
      }

      // 2. Smooth pointer tracking
      const ptrDamp = 1 - Math.exp(-7.5 * dt);
      smoothPtrX += (pointerNdc.x - smoothPtrX) * ptrDamp;
      smoothPtrY += (pointerNdc.y - smoothPtrY) * ptrDamp;

      // 3. Enter transition impulse & dolly progress
      if (isEnteringRef.current && !enterTriggered) {
        enterTriggered = true;
        // Intentional gentle physical swing on ENTER click
        velZ += 0.34;
        velX -= 0.45;
        velY += 0.55;
      }

      if (enterTriggered && !enterCompleted) {
        enterProgress = Math.min(1, enterProgress + dt / 1.25);
        callbacksRef.current.onEnterProgress?.(enterProgress);
        if (enterProgress >= 1) {
          enterCompleted = true;
          callbacksRef.current.onEnterComplete?.();
          return;
        }
      }

      // Consume any external slide/docking inertia impulses for realistic horizontal pendulum swing
      if (externalImpulseRef?.current) {
        const imp = externalImpulseRef.current;
        if (imp.velZ !== 0 || imp.velY !== 0 || imp.velX !== 0) {
          velZ += imp.velZ;
          velY += imp.velY;
          velX += imp.velX;
          imp.velZ = 0;
          imp.velY = 0;
          imp.velX = 0;
        }
      }

      // 4. Raycast hover detection only when pointer moved or during early drop settle
      if (pointerDirty || !dropSettled) {
        pointerDirty = false;
        updateHoverStates();
      }
      const targetHover = isHoveringCard && !enterTriggered ? 1 : 0;
      const targetGhHover = isHoveringGitHub && !enterTriggered ? 1 : 0;
      hoverBlend += (targetHover - hoverBlend) * (1 - Math.exp(-9.0 * dt));
      ghHoverBlend += (targetGhHover - ghHoverBlend) * (1 - Math.exp(-11.0 * dt));

      // 5. Coupled 3-Axis Pendulum + Torsion Spring Solver
      const ambientRoll = Math.sin(elapsed * 0.82) * 0.016;
      const ambientYaw = Math.sin(elapsed * 0.54 + 0.7) * 0.038;
      const ambientPitch = Math.cos(elapsed * 0.68) * 0.008;

      const interactScale = enterTriggered
        ? 0
        : isDockedRef.current
          ? isHoveringCard
            ? 0.6
            : 0
          : isHoveringCard
            ? 1.0
            : 0.42;
      const targetZ = ambientRoll - smoothPtrX * 0.045 * interactScale;
      const targetX = ambientPitch + smoothPtrY * 0.055 * interactScale;
      const targetY =
        enterTriggered
          ? 0
          : ambientYaw + smoothPtrX * 0.25 * interactScale;

      // Spring stiffness & viscous air damping
      const kRoll = 12.0;
      const dRoll = 2.6;
      velZ += ((targetZ - swingZ) * kRoll - velZ * dRoll) * dt;
      swingZ += velZ * dt;

      const kPitch = 14.0;
      const dPitch = 3.2;
      velX += ((targetX - swingX) * kPitch - velX * dPitch) * dt;
      swingX += velX * dt;

      const kYaw = enterTriggered ? 20.0 : 10.5;
      const dYaw = enterTriggered ? 5.8 : 2.9;
      velY += ((targetY - twistY) * kYaw - velY * dYaw) * dt;
      twistY += velY * dt;

      // Secondary swivel-ring hinge inertia for the card body itself
      const targetLagRoll = -velZ * 0.14 - smoothPtrX * 0.04 * hoverBlend;
      const targetLagPitch = -velX * 0.16 - smoothPtrY * 0.10 * hoverBlend;
      cardLagRollVel += ((targetLagRoll - cardLagRoll) * 26.0 - cardLagRollVel * 5.8) * dt;
      cardLagRoll += cardLagRollVel * dt;
      cardLagPitchVel += ((targetLagPitch - cardLagPitch) * 26.0 - cardLagPitchVel * 5.8) * dt;
      cardLagPitch += cardLagPitchVel * dt;

      pendulumPivot.rotation.set(swingX, twistY, swingZ);
      cardHinge.rotation.set(cardLagPitch, 0, cardLagRoll);

      // Subtle dynamic woven lanyard flex when oscillating
      if (Math.abs(velZ) + Math.abs(velX) > 0.004) {
        flexRibbon(strapGeo, strapBasePos, velZ, velX);
        flexRibbon(strapBackGeo, strapBackBasePos, velZ, velX);
      }

      // 6. Cursor-reactive specular light reflections & holographic shimmer
      cursorLight.position.set(smoothPtrX * 2.2, smoothPtrY * 1.9 - 0.1, 2.35);
      cursorLight.intensity = 2.2 + hoverBlend * 7.8;

      holoMat.uniforms.uTime.value = elapsed;
      holoMat.uniforms.uHover.value = hoverBlend;
      holoMat.uniforms.uPointer.value.set(smoothPtrX, smoothPtrY);

      ghGlowMat.uniforms.uOpacity.value = ghHoverBlend;
      ghGlowMat.uniforms.uTime.value = elapsed;

      // 7. Gentle cinematic camera breathing + smooth ENTER zoom-in choreography
      const easeInOutCubic = (x: number) =>
        x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const zEase = easeInOutCubic(enterProgress);

      const breathMult = isDockedRef.current ? 0.18 : 1.0;
      const camBreathX =
        Math.sin(elapsed * 0.36) * 0.08 * breathMult +
        smoothPtrX * 0.16 * (1 - zEase) * (isDockedRef.current ? 0.15 : 1);
      const camBreathY =
        Math.cos(elapsed * 0.28) * 0.05 * breathMult +
        smoothPtrY * 0.11 * (1 - zEase) * (isDockedRef.current ? 0.15 : 1);
      const currentCamZ = THREE.MathUtils.lerp(baseCamZ, 1.45, zEase);
      const currentCamY = THREE.MathUtils.lerp(-0.08, -0.46, zEase) + camBreathY * (1 - zEase * 0.85);
      const currentCamX = camBreathX * (1 - zEase * 0.9);

      camera.position.set(currentCamX, currentCamY, currentCamZ);
      camera.lookAt(0, THREE.MathUtils.lerp(heroDropMode ? -0.34 : -0.28, -0.48, zEase), 0);

      // Subtle studio light fade-in on open + soft exposure lift on zoom
      const openLight = transparent
        ? THREE.MathUtils.smoothstep(elapsed, 0.0, 0.45)
        : THREE.MathUtils.smoothstep(elapsed, 0.0, 1.15);
      renderer.toneMappingExposure =
        THREE.MathUtils.lerp(transparent ? 0.72 : 0.28, 1.16, openLight) + zEase * 0.35;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);

      textures.dispose();
      envRT.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, [transparent, heroDropMode, externalImpulseRef]);

  return (
    <div
      ref={mountRef}
      className={transparent ? 'relative w-full h-full' : 'fixed inset-0 w-full h-full'}
      aria-hidden="true"
    />
  );
};

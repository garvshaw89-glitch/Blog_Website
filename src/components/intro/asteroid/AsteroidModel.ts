import * as THREE from 'three';

/**
 * Deterministic 3D hash + value noise / FBM + spherical impact-crater
 * sculpting for photorealistic PBR asteroids with zero external texture fetches.
 */

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash3(x: number, y: number, z: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
}

function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;

  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;

  return nxy0 + (nxy1 - nxy0) * uz;
}

function fbm3(x: number, y: number, z: number, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * (noise3(x * freq, y * freq, z * freq) * 2 - 1);
    freq *= 2.07;
    amp *= 0.48;
  }
  return value;
}

interface CraterSpec {
  dir: THREE.Vector3;
  radius: number;
  depth: number;
}

function seededRand(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  if (s <= 0) s += 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Sculpt a realistic jagged, cratered asteroid BufferGeometry from a subdivided icosphere.
 */
export function buildCraggyAsteroidGeometry(
  seed: number,
  detail: number,
  craterCount: number
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const rand = seededRand(seed);

  // Asymmetric tri-axial asteroid proportions (like 433 Eros / Bennu / Vesta)
  const stretchX = 0.88 + rand() * 0.48;
  const stretchY = 0.72 + rand() * 0.36;
  const stretchZ = 0.82 + rand() * 0.42;
  const offsetSeed = new THREE.Vector3(rand() * 31, rand() * 31, rand() * 31);

  const craters: CraterSpec[] = [];
  for (let i = 0; i < craterCount; i++) {
    const theta = rand() * Math.PI * 2;
    const u = rand() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const dir = new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta)).normalize();
    const radius = 0.16 + Math.pow(rand(), 1.45) * 0.34;
    const depth = radius * (0.36 + rand() * 0.24);
    craters.push({ dir, radius, depth });
  }

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    n.copy(v);

    // Large geological lobes + ridged fracture strata
    const macro = fbm3(
      n.x * 1.45 + offsetSeed.x,
      n.y * 1.45 + offsetSeed.y,
      n.z * 1.45 + offsetSeed.z,
      3
    );
    const ridgeRaw = 1 - Math.abs(
      fbm3(
        n.x * 3.1 + offsetSeed.y,
        n.y * 3.1 + offsetSeed.z,
        n.z * 3.1 + offsetSeed.x,
        3
      )
    );
    const ridges = Math.pow(Math.max(0, ridgeRaw), 2.1) * 0.16;
    const micro = fbm3(n.x * 7.5 + seed, n.y * 7.5 - seed, n.z * 7.5, 2) * 0.045;

    let radius = 1.0 + macro * 0.22 + ridges + micro;
    let craterTint = 1.0;

    // Carve concave spherical impact bowls with raised ejecta rims
    for (let c = 0; c < craters.length; c++) {
      const cr = craters[c];
      const dist = n.distanceTo(cr.dir);
      if (dist < cr.radius * 1.32) {
        const q = dist / cr.radius;
        if (q < 1.0) {
          // Concave crater bowl
          const bowl = Math.cos(q * Math.PI * 0.5);
          radius -= Math.pow(bowl, 1.35) * cr.depth;
          craterTint = Math.min(craterTint, 0.62 + 0.38 * q);
        } else {
          // Subtle raised crater rim
          const rimT = (q - 1.0) / 0.32;
          const rim = Math.sin((1 - rimT) * Math.PI);
          radius += rim * cr.depth * 0.28;
          craterTint = Math.max(craterTint, 1.08);
        }
      }
    }

    pos.setXYZ(
      i,
      n.x * radius * stretchX,
      n.y * radius * stretchY,
      n.z * radius * stretchZ
    );

    // Vertex ambient-occlusion / mineral tint (darkened inside craters, brighter on ridges)
    const ao = Math.min(1.12, Math.max(0.42, craterTint * (0.85 + ridges * 1.1)));
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao * 0.98;
    colors[i * 3 + 2] = ao * 0.95;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export interface AsteroidTextureBundle {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates procedural 512x512 carbonaceous/silicate rocky asteroid PBR textures:
 * albedo (SRGBColorSpace), bump, roughness, and molten re-entry fissure emissive map.
 */
export function createAsteroidTextures(maxAnisotropy: number): AsteroidTextureBundle {
  const size = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const eCtx = emissiveCanvas.getContext('2d')!;

  // Base regolith slate/brown-grey albedo + high matte roughness + mid bump
  aCtx.fillStyle = '#6c665f';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#d8d8d8';
  rCtx.fillRect(0, 0, size, size);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  const rand = seededRand(4219);

  // Layer stony silicate splotches & iron mineral patches
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 34;
    const bright = rand();

    const grad = aCtx.createRadialGradient(x, y, 0, x, y, r);
    if (bright > 0.62) {
      grad.addColorStop(0, 'rgba(176, 170, 162, 0.24)');
      grad.addColorStop(1, 'rgba(176, 170, 162, 0)');
    } else if (bright > 0.28) {
      grad.addColorStop(0, 'rgba(92, 85, 78, 0.28)');
      grad.addColorStop(1, 'rgba(92, 85, 78, 0)');
    } else {
      grad.addColorStop(0, 'rgba(38, 34, 31, 0.34)');
      grad.addColorStop(1, 'rgba(38, 34, 31, 0)');
    }
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    const bVal = Math.floor(70 + bright * 145);
    const bGrad = bCtx.createRadialGradient(x, y, 0, x, y, r);
    bGrad.addColorStop(0, `rgba(${bVal}, ${bVal}, ${bVal}, 0.26)`);
    bGrad.addColorStop(1, `rgba(${bVal}, ${bVal}, ${bVal}, 0)`);
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Paint micro-craters onto maps for crisp up-close detail
  for (let i = 0; i < 85; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 16;

    // Dark crater pit on albedo & bump
    const cg = aCtx.createRadialGradient(x, y, r * 0.15, x, y, r);
    cg.addColorStop(0, 'rgba(34, 31, 29, 0.55)');
    cg.addColorStop(0.7, 'rgba(68, 63, 59, 0.35)');
    cg.addColorStop(0.9, 'rgba(195, 189, 180, 0.28)');
    cg.addColorStop(1, 'rgba(195, 189, 180, 0)');
    aCtx.fillStyle = cg;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    const bg = bCtx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, 'rgba(24, 24, 24, 0.72)');
    bg.addColorStop(0.75, 'rgba(72, 72, 72, 0.35)');
    bg.addColorStop(0.92, 'rgba(225, 225, 225, 0.45)');
    bg.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();

    // Slightly smoother exposed bedrock rim on roughness map
    rCtx.strokeStyle = 'rgba(140, 140, 140, 0.35)';
    rCtx.lineWidth = 1.4;
    rCtx.beginPath();
    rCtx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    rCtx.stroke();
  }

  // Fine geological crack network + glowing magma fissures for hero re-entry
  for (let f = 0; f < 22; f++) {
    let px = rand() * size;
    let py = rand() * size;
    let dir = rand() * Math.PI * 2;
    const segs = 6 + Math.floor(rand() * 7);

    aCtx.strokeStyle = 'rgba(22, 20, 19, 0.45)';
    aCtx.lineWidth = 1.1;
    bCtx.strokeStyle = 'rgba(20, 20, 20, 0.65)';
    bCtx.lineWidth = 1.6;
    eCtx.strokeStyle = f % 3 === 0 ? 'rgba(255, 175, 72, 0.95)' : 'rgba(249, 115, 22, 0.75)';
    eCtx.lineWidth = f % 3 === 0 ? 1.8 : 1.1;

    aCtx.beginPath();
    bCtx.beginPath();
    eCtx.beginPath();
    aCtx.moveTo(px, py);
    bCtx.moveTo(px, py);
    eCtx.moveTo(px, py);

    for (let s = 0; s < segs; s++) {
      dir += (rand() - 0.5) * 1.15;
      const len = 10 + rand() * 18;
      px += Math.cos(dir) * len;
      py += Math.sin(dir) * len;
      aCtx.lineTo(px, py);
      bCtx.lineTo(px, py);
      eCtx.lineTo(px, py);
    }

    aCtx.stroke();
    bCtx.stroke();
    eCtx.stroke();
  }

  // Mineral grit noise
  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 0.8 + rand() * 1.6;
    aCtx.fillStyle = rand() > 0.5 ? 'rgba(225, 220, 212, 0.22)' : 'rgba(20, 18, 17, 0.28)';
    aCtx.fillRect(x, y, s, s);
    bCtx.fillStyle = rand() > 0.5 ? 'rgba(235, 235, 235, 0.25)' : 'rgba(30, 30, 30, 0.25)';
    bCtx.fillRect(x, y, s, s);
  }

  const configureTex = (canvas: HTMLCanvasElement, isColor: boolean): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, Math.max(1, maxAnisotropy));
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.needsUpdate = true;
    return tex;
  };

  const albedoMap = configureTex(albedoCanvas, true);
  const bumpMap = configureTex(bumpCanvas, false);
  const roughnessMap = configureTex(roughCanvas, false);
  const emissiveMap = configureTex(emissiveCanvas, true);

  return {
    albedoMap,
    bumpMap,
    roughnessMap,
    emissiveMap,
    dispose: () => {
      albedoMap.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
      emissiveMap.dispose();
    },
  };
}

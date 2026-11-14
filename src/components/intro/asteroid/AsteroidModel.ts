import * as THREE from 'three';

/**
 * Photorealistic procedural 3D asteroid sculpter & PBR texture bundle.
 * Combines angular Voronoi boulder planes, ridged multifractal strata,
 * multi-scale spherical craters with crisp raised ejecta rims, and high-contrast
 * carbonaceous regolith / silicate PBR textures with zero external asset fetches.
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

function fbm3(x: number, y: number, z: number, octaves = 5): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * (noise3(x * freq, y * freq, z * freq) * 2 - 1);
    freq *= 2.09;
    amp *= 0.49;
  }
  return value;
}

interface CraterSpec {
  dir: THREE.Vector3;
  radius: number;
  depth: number;
}

interface BoulderPlane {
  normal: THREE.Vector3;
  cut: number;
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
 * Sculpt an irregular, angular, deeply cratered rocky asteroid BufferGeometry.
 */
export function buildCraggyAsteroidGeometry(
  seed: number,
  detail: number,
  craterCount: number
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const rand = seededRand(seed);

  // Asymmetric bilobed / elongated asteroid axes
  const stretchX = 0.85 + rand() * 0.55;
  const stretchY = 0.68 + rand() * 0.38;
  const stretchZ = 0.78 + rand() * 0.45;
  const offsetSeed = new THREE.Vector3(rand() * 41, rand() * 41, rand() * 41);

  // Subtle planar cleavage planes that give real fractured rock silhouettes
  const planes: BoulderPlane[] = [];
  for (let p = 0; p < 5; p++) {
    const theta = rand() * Math.PI * 2;
    const u = rand() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    planes.push({
      normal: new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta)).normalize(),
      cut: 0.72 + rand() * 0.22,
    });
  }

  // Multi-scale impact craters (2-3 large basin craters + several crisp mid/small craters)
  const craters: CraterSpec[] = [];
  for (let i = 0; i < craterCount; i++) {
    const theta = rand() * Math.PI * 2;
    const u = rand() * 2 - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const dir = new THREE.Vector3(s * Math.cos(theta), u, s * Math.sin(theta)).normalize();
    const isBasin = i < 3;
    const radius = isBasin ? 0.34 + rand() * 0.2 : 0.11 + Math.pow(rand(), 1.35) * 0.24;
    const depth = radius * (isBasin ? 0.42 : 0.38 + rand() * 0.24);
    craters.push({ dir, radius, depth });
  }

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    n.copy(v);

    // Large rocky lobes + sharp fractured ridges + gritty boulder micro-bump
    const macro = fbm3(
      n.x * 1.35 + offsetSeed.x,
      n.y * 1.35 + offsetSeed.y,
      n.z * 1.35 + offsetSeed.z,
      4
    );
    const ridgeRaw =
      1 -
      Math.abs(
        fbm3(
          n.x * 2.8 + offsetSeed.y,
          n.y * 2.8 + offsetSeed.z,
          n.z * 2.8 + offsetSeed.x,
          4
        )
      );
    const ridges = Math.pow(Math.max(0, ridgeRaw), 2.35) * 0.22;
    const microBoulders = fbm3(n.x * 8.5 + seed, n.y * 8.5 - seed, n.z * 8.5, 3) * 0.055;

    let radius = 1.0 + macro * 0.26 + ridges + microBoulders;

    // Soft rock cleavage facet flattening
    for (let p = 0; p < planes.length; p++) {
      const pl = planes[p];
      const dot = n.dot(pl.normal);
      if (dot > pl.cut) {
        radius -= (dot - pl.cut) * 0.48;
      }
    }

    let craterTint = 1.0;

    // Carve concave spherical impact bowls with raised rocky ejecta rims
    for (let c = 0; c < craters.length; c++) {
      const cr = craters[c];
      const dist = n.distanceTo(cr.dir);
      if (dist < cr.radius * 1.35) {
        const q = dist / cr.radius;
        if (q < 1.0) {
          const bowl = Math.cos(q * Math.PI * 0.5);
          radius -= Math.pow(bowl, 1.45) * cr.depth;
          craterTint = Math.min(craterTint, 0.48 + 0.52 * q);
        } else {
          const rimT = (q - 1.0) / 0.35;
          const rim = Math.sin((1 - rimT) * Math.PI);
          radius += rim * cr.depth * 0.32;
          craterTint = Math.max(craterTint, 1.14);
        }
      }
    }

    pos.setXYZ(
      i,
      n.x * radius * stretchX,
      n.y * radius * stretchY,
      n.z * radius * stretchZ
    );

    // Rich dark carbonaceous regolith variation (warm grey-brown ridges, darker crater floors)
    const ao = Math.min(1.18, Math.max(0.32, craterTint * (0.78 + ridges * 1.15)));
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao * 0.96;
    colors[i * 3 + 2] = ao * 0.91;
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
 * Generates high-detail 512x512 real carbonaceous/silicate asteroid PBR maps:
 * dark charcoal regolith, dusty grey ejecta, deep micro-craters, sharp mineral fissures,
 * high matte roughness contrast, and glowing ablation cracks on the hero asteroid.
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

  // Richer, darker asteroid slate/basalt base so sunlight creates real space contrast
  aCtx.fillStyle = '#4e4a44';
  aCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#787878';
  bCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#e0e0e0';
  rCtx.fillRect(0, 0, size, size);
  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  const rand = seededRand(8471);

  // Layer stony silicate patches & iron-rich basalt strata
  for (let i = 0; i < 480; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 5 + rand() * 32;
    const bright = rand();

    const grad = aCtx.createRadialGradient(x, y, 0, x, y, r);
    if (bright > 0.68) {
      grad.addColorStop(0, 'rgba(154, 148, 138, 0.28)');
      grad.addColorStop(1, 'rgba(154, 148, 138, 0)');
    } else if (bright > 0.3) {
      grad.addColorStop(0, 'rgba(66, 61, 56, 0.32)');
      grad.addColorStop(1, 'rgba(66, 61, 56, 0)');
    } else {
      grad.addColorStop(0, 'rgba(26, 23, 21, 0.38)');
      grad.addColorStop(1, 'rgba(26, 23, 21, 0)');
    }
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    const bVal = Math.floor(45 + bright * 185);
    const bGrad = bCtx.createRadialGradient(x, y, 0, x, y, r);
    bGrad.addColorStop(0, `rgba(${bVal}, ${bVal}, ${bVal}, 0.32)`);
    bGrad.addColorStop(1, `rgba(${bVal}, ${bVal}, ${bVal}, 0)`);
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Dense micro-cratering with dark pit centers & dusty bright rims
  for (let i = 0; i < 120; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2.5 + rand() * 15;

    const cg = aCtx.createRadialGradient(x, y, r * 0.1, x, y, r);
    cg.addColorStop(0, 'rgba(20, 18, 17, 0.68)');
    cg.addColorStop(0.65, 'rgba(54, 50, 46, 0.42)');
    cg.addColorStop(0.88, 'rgba(178, 172, 162, 0.32)');
    cg.addColorStop(1, 'rgba(178, 172, 162, 0)');
    aCtx.fillStyle = cg;
    aCtx.beginPath();
    aCtx.arc(x, y, r, 0, Math.PI * 2);
    aCtx.fill();

    const bg = bCtx.createRadialGradient(x, y, 0, x, y, r);
    bg.addColorStop(0, 'rgba(12, 12, 12, 0.85)');
    bg.addColorStop(0.72, 'rgba(62, 62, 62, 0.42)');
    bg.addColorStop(0.91, 'rgba(242, 242, 242, 0.58)');
    bg.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();

    rCtx.strokeStyle = 'rgba(148, 148, 148, 0.38)';
    rCtx.lineWidth = 1.3;
    rCtx.beginPath();
    rCtx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    rCtx.stroke();
  }

  // Sharp rocky fault cracks & hot glowing magma veins
  for (let f = 0; f < 28; f++) {
    let px = rand() * size;
    let py = rand() * size;
    let dir = rand() * Math.PI * 2;
    const segs = 6 + Math.floor(rand() * 8);

    aCtx.strokeStyle = 'rgba(15, 13, 12, 0.55)';
    aCtx.lineWidth = 1.25;
    bCtx.strokeStyle = 'rgba(12, 12, 12, 0.82)';
    bCtx.lineWidth = 1.9;
    eCtx.strokeStyle =
      f % 3 === 0 ? 'rgba(255, 185, 78, 0.96)' : 'rgba(249, 115, 22, 0.78)';
    eCtx.lineWidth = f % 3 === 0 ? 1.9 : 1.15;

    aCtx.beginPath();
    bCtx.beginPath();
    eCtx.beginPath();
    aCtx.moveTo(px, py);
    bCtx.moveTo(px, py);
    eCtx.moveTo(px, py);

    for (let s = 0; s < segs; s++) {
      dir += (rand() - 0.5) * 1.25;
      const len = 8 + rand() * 17;
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

  // Regolith gravel & mineral grit noise
  for (let i = 0; i < 2400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 0.7 + rand() * 1.8;
    aCtx.fillStyle = rand() > 0.45 ? 'rgba(205, 200, 190, 0.24)' : 'rgba(15, 13, 12, 0.34)';
    aCtx.fillRect(x, y, s, s);
    bCtx.fillStyle = rand() > 0.5 ? 'rgba(245, 245, 245, 0.34)' : 'rgba(18, 18, 18, 0.34)';
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

import * as THREE from 'three';
import { GITHUB_AVATAR_BASE64 } from './avatarBase64';

export interface ProfileSamplePoint {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
  phase: number; // 0: outer silhouette, 1: hair, 2: face, 3: glasses/eyes, 4: clothes, 5: fine details
}

/**
 * Helper to compute vibrant multi-colored rainbow halo colors
 */
function getRainbowColor(angle: number): { r: number; g: number; b: number } {
  const norm = (angle / (Math.PI * 2) + 1.0) % 1.0;
  // 6-step vibrant rainbow: cyan -> blue -> violet -> magenta -> gold -> emerald
  const h = norm * 6;
  const i = Math.floor(h);
  const f = h - i;
  switch (i % 6) {
    case 0: return { r: 0.1, g: 0.9, b: 1.0 }; // Electric cyan
    case 1: return { r: 0.3, g: 0.4, b: 1.0 }; // Royal blue
    case 2: return { r: 0.7, g: 0.25, b: 1.0 }; // Vivid violet
    case 3: return { r: 1.0, g: 0.25, b: 0.75 }; // Hot magenta
    case 4: return { r: 1.0, g: 0.8, b: 0.15 }; // Solar gold
    default: return { r: 0.15, g: 0.95, b: 0.55 }; // Radiant emerald
  }
}

/**
 * Procedural initial fallback profile points so particles always have a recognizable,
 * vibrant, large, and colorful portrait target instantly.
 */
export function getImmediateProfilePoints(targetCount: number = 6000): ProfileSamplePoint[] {
  const points: ProfileSamplePoint[] = [];
  // Large scale (18.0) to match the majestic Earth globe!
  const worldScale = 18.0;

  for (let i = 0; i < targetCount; i++) {
    const angle = i * 2.39996;
    const r = Math.sqrt((i + 1) / targetCount) * 0.94;
    const nx = Math.cos(angle) * r;
    const ny = Math.sin(angle) * r;

    const wx = nx * (worldScale * 0.5);
    const wy = ny * (worldScale * 0.5);
    // Positioned forward at z = 0.5 for immediate prominence
    const wz = 0.5 + (Math.random() - 0.5) * 0.35;

    let phase = 0;
    let red = 1.0;
    let green = 1.0;
    let blue = 1.0;

    // Outer perimeter: Vibrant rainbow halo ring
    if (r > 0.82) {
      phase = 0;
      const rainbow = getRainbowColor(angle);
      red = rainbow.r;
      green = rainbow.g;
      blue = rainbow.b;
    }
    // Hair at top: Luminous royal sapphire with violet sheen
    else if (ny > 0.22 && Math.abs(nx) < 0.68) {
      phase = 1;
      const isVioletStrand = (i % 2 === 0);
      if (isVioletStrand) {
        red = 0.75;
        green = 0.35;
        blue = 1.0; // Glowing violet
      } else {
        red = 0.25;
        green = 0.65;
        blue = 1.0; // Electric cyber-blue
      }
    }
    // Glasses / eyes line: Brilliant neon cyan & mint starlight
    else if (Math.abs(ny - 0.04) < 0.14 && Math.abs(nx) < 0.55) {
      phase = 3;
      red = 0.10;
      green = 0.95;
      blue = 1.0; // Blinding starlight cyan
    }
    // Face & skin tone: Warm radiant peach, champagne & amber glow
    else if (ny < 0.22 && ny > -0.34 && Math.abs(nx) < 0.58) {
      phase = 2;
      red = 1.0;
      green = 0.84;
      blue = 0.65; // Warm sunlit peach
    }
    // Clothing & shoulders: Rich royal indigo & magenta
    else if (ny <= -0.34) {
      phase = 4;
      red = 0.35;
      green = 0.45;
      blue = 1.0; // Royal cobalt
    }
    // Face contours & cheekbones
    else {
      phase = 5;
      red = 0.95;
      green = 0.75;
      blue = 0.85; // Rose champagne
    }

    points.push({
      x: wx,
      y: wy,
      z: wz,
      r: red,
      g: green,
      b: blue,
      a: 1.0,
      phase,
    });
  }

  return points;
}

/**
 * Loads and rasterizes the uploaded GitHub profile image onto a dense virtual particle grid.
 * Applies high-end digital color grading, saturation boost, and dynamic halo synthesis
 * so the portrait is exceptionally VISIBLE, VIBRANT, and COLORFUL.
 */
export async function sampleProfileImage(
  imageSrc: string = GITHUB_AVATAR_BASE64,
  targetSampleCount: number = 6000
): Promise<ProfileSamplePoint[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(getImmediateProfilePoints(targetSampleCount));
      return;
    }

    const img = new Image();

    if (imageSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleRes = 96; // 96x96 dense candidate grid
        canvas.width = sampleRes;
        canvas.height = sampleRes;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getImmediateProfilePoints(targetSampleCount));
          return;
        }

        ctx.drawImage(img, 0, 0, sampleRes, sampleRes);
        const imgData = ctx.getImageData(0, 0, sampleRes, sampleRes);
        const data = imgData.data;

        const candidates: ProfileSamplePoint[] = [];
        const worldScale = 18.0; // Large, magnificent scale

        for (let y = 0; y < sampleRes; y++) {
          for (let x = 0; x < sampleRes; x++) {
            const pixelIndex = (y * sampleRes + x) * 4;
            let r = data[pixelIndex] / 255;
            let g = data[pixelIndex + 1] / 255;
            let b = data[pixelIndex + 2] / 255;
            const a = data[pixelIndex + 3] / 255;

            if (a < 0.08) continue;

            // Normalized coordinates around center (0, 0)
            const nx = (x / sampleRes - 0.5) * 2;
            const ny = (1 - y / sampleRes - 0.5) * 2;
            const radiusFromCenter = Math.hypot(nx, ny);

            if (radiusFromCenter > 0.985) continue;

            const wx = nx * (worldScale * 0.5);
            const wy = ny * (worldScale * 0.5);
            const wz = 0.5 + (Math.random() - 0.5) * 0.35;

            let phase = 0;
            const rawLuminance = 0.299 * r + 0.587 * g + 0.114 * b;

            // Outer perimeter: Vibrant rainbow halo ring
            if (radiusFromCenter > 0.85) {
              phase = 0;
              const angle = Math.atan2(ny, nx);
              const rainbow = getRainbowColor(angle);
              r = rainbow.r;
              g = rainbow.g;
              b = rainbow.b;
            } else if (ny < -0.36) {
              phase = 4; // Clothing
              // Boost clothing into vivid cobalt and violet
              r = Math.max(r * 1.3, 0.25);
              g = Math.max(g * 1.2, 0.35);
              b = Math.max(b * 1.5, 0.85);
            } else if (ny > 0.20 && rawLuminance < 0.35) {
              phase = 1; // Hair
              // Infuse dark hair with glowing electric cyan & violet sheen
              const isSheen = (x + y) % 3 === 0;
              if (isSheen) {
                r = 0.65; g = 0.30; b = 1.0; // Violet highlights
              } else {
                r = 0.25; g = 0.65; b = 0.95; // Cyan cyber strands
              }
            } else if (ny >= -0.15 && ny <= 0.20 && rawLuminance < 0.30) {
              phase = 3; // Glasses / eyes
              // Electric cyan starlight glasses
              r = 0.15; g = 0.95; b = 1.0;
            } else if (ny >= -0.36 && ny <= 0.36) {
              phase = 2; // Face
              // Warm radiant skin tones with golden glow
              r = Math.min(1.0, Math.max(r * 1.25, 0.92));
              g = Math.min(1.0, Math.max(g * 1.15, 0.78));
              b = Math.min(1.0, Math.max(b * 1.05, 0.58));
            } else {
              phase = 5; // Details
              r = Math.min(1.0, r * 1.2 + 0.1);
              g = Math.min(1.0, g * 1.2 + 0.1);
              b = Math.min(1.0, b * 1.3 + 0.15);
            }

            candidates.push({
              x: wx,
              y: wy,
              z: wz,
              r,
              g,
              b,
              a: 1.0,
              phase,
            });
          }
        }

        if (candidates.length === 0) {
          resolve(getImmediateProfilePoints(targetSampleCount));
          return;
        }

        const finalPoints: ProfileSamplePoint[] = [];
        for (let i = 0; i < targetSampleCount; i++) {
          const candidate = candidates[i % candidates.length];
          finalPoints.push({
            x: candidate.x + (Math.random() - 0.5) * 0.08,
            y: candidate.y + (Math.random() - 0.5) * 0.08,
            z: candidate.z + (Math.random() - 0.5) * 0.12,
            r: candidate.r,
            g: candidate.g,
            b: candidate.b,
            a: 1.0,
            phase: candidate.phase,
          });
        }

        resolve(finalPoints);
      } catch (err) {
        console.warn('Canvas rasterization exception caught, using fallback points:', err);
        resolve(getImmediateProfilePoints(targetSampleCount));
      }
    };

    img.onerror = () => {
      console.warn('Profile image failed to load, using immediate fallback points');
      resolve(getImmediateProfilePoints(targetSampleCount));
    };

    img.src = imageSrc;
  });
}

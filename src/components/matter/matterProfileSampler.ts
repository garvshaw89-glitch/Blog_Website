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
 * Procedural initial fallback profile points so particles always have a recognizable
 * high-contrast portrait target instantly, even before asynchronous image decoding finishes.
 */
export function getImmediateProfilePoints(targetCount: number = 6000): ProfileSamplePoint[] {
  const points: ProfileSamplePoint[] = [];
  const worldScale = 13.5;

  for (let i = 0; i < targetCount; i++) {
    const u = i / targetCount;
    // Circular portrait bounds
    const angle = i * 2.39996;
    const r = Math.sqrt(Math.random()) * 0.92;
    const nx = Math.cos(angle) * r;
    const ny = Math.sin(angle) * r;

    const wx = nx * (worldScale * 0.5);
    const wy = ny * (worldScale * 0.5);
    const wz = -1.6 + (Math.random() - 0.5) * 0.25;

    let phase = 0;
    let red = 0.85;
    let green = 0.90;
    let blue = 0.98;

    // Hair at top
    if (ny > 0.25 && Math.abs(nx) < 0.65) {
      phase = 1;
      red = 0.22;
      green = 0.28;
      blue = 0.38;
    }
    // Glasses / eyes line
    else if (Math.abs(ny - 0.05) < 0.12 && Math.abs(nx) < 0.5) {
      phase = 3;
      red = 0.18;
      green = 0.85;
      blue = 0.98;
    }
    // Face skin tone
    else if (ny < 0.25 && ny > -0.32 && Math.abs(nx) < 0.55) {
      phase = 2;
      red = 0.92;
      green = 0.82;
      blue = 0.75;
    }
    // Clothing shoulders
    else if (ny <= -0.32) {
      phase = 4;
      red = 0.20;
      green = 0.35;
      blue = 0.65;
    }
    // Outer perimeter
    else {
      phase = 0;
      red = 0.40;
      green = 0.65;
      blue = 0.95;
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
 * Uses embedded GITHUB_AVATAR_BASE64 by default for zero-network, zero-CORS reliability.
 */
export async function sampleProfileImage(
  imageSrc: string = GITHUB_AVATAR_BASE64,
  targetSampleCount: number = 6000
): Promise<ProfileSamplePoint[]> {
  return new Promise((resolve) => {
    // If not in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(getImmediateProfilePoints(targetSampleCount));
      return;
    }

    const img = new Image();

    // Only set crossOrigin for remote http/https URLs, never for data URIs
    if (imageSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleRes = 96; // 96x96 dense grid for 6000+ particle high-resolution portrait
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
        const worldScale = 13.5;

        for (let y = 0; y < sampleRes; y++) {
          for (let x = 0; x < sampleRes; x++) {
            const pixelIndex = (y * sampleRes + x) * 4;
            let r = data[pixelIndex] / 255;
            let g = data[pixelIndex + 1] / 255;
            let b = data[pixelIndex + 2] / 255;
            const a = data[pixelIndex + 3] / 255;

            if (a < 0.12) continue;

            // Normalize coordinates around center (0, 0)
            const nx = (x / sampleRes - 0.5) * 2;
            const ny = (1 - y / sampleRes - 0.5) * 2;
            const radiusFromCenter = Math.hypot(nx, ny);

            // Circular avatar framing
            if (radiusFromCenter > 0.985) continue;

            const wx = nx * (worldScale * 0.5);
            const wy = ny * (worldScale * 0.5);
            const wz = -1.6 + (Math.random() - 0.5) * 0.35;

            // Categorize progressive reconstruction phases:
            // 0: CIRCULAR SILHOUETTE
            // 1: HAIR
            // 2: FACE
            // 3: GLASSES / EYES
            // 4: CLOTHING
            // 5: DETAILS
            let phase = 0;
            const rawLuminance = 0.299 * r + 0.587 * g + 0.114 * b;

            if (ny < -0.38) {
              phase = 4; // Clothing
            } else if (ny > 0.22 && rawLuminance < 0.32) {
              phase = 1; // Hair
            } else if (ny >= -0.15 && ny <= 0.22 && rawLuminance < 0.28) {
              phase = 3; // Glasses / eyes
            } else if (ny >= -0.38 && ny <= 0.38) {
              phase = 2; // Face
            } else if (radiusFromCenter > 0.88) {
              phase = 0; // Outer silhouette
            } else {
              phase = 5; // Image details
            }

            // High-end digital exposure lift:
            // Boost dark tones so hair and glasses are crisp and distinct against the deep black void
            if (rawLuminance < 0.22) {
              r = Math.max(r, 0.18);
              g = Math.max(g, 0.22);
              b = Math.max(b, 0.35); // Luminous deep cyan-slate for hair & glasses
            }

            // Natural contrast curve for vivid skin tones and highlights
            r = Math.min(1.0, Math.pow(r, 0.92) * 1.12);
            g = Math.min(1.0, Math.pow(g, 0.92) * 1.10);
            b = Math.min(1.0, Math.pow(b, 0.92) * 1.15);

            candidates.push({
              x: wx,
              y: wy,
              z: wz,
              r,
              g,
              b,
              a,
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
            x: candidate.x + (Math.random() - 0.5) * 0.06,
            y: candidate.y + (Math.random() - 0.5) * 0.06,
            z: candidate.z + (Math.random() - 0.5) * 0.10,
            r: candidate.r,
            g: candidate.g,
            b: candidate.b,
            a: candidate.a,
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

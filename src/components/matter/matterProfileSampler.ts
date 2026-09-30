import { GITHUB_AVATAR_BASE64 } from './avatarBase64';

export interface ProfileSamplePoint {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
  phase: number; // 0: core face, 1: eyes/glasses, 2: hair, 3: clothes, 4: ambient perimeter
}

/**
 * Immediate procedural portrait fallback with authentic human skin, hair, and clothing tones,
 * ensuring particles never display artificial rainbow/neon colors.
 */
export function getImmediateProfilePoints(targetCount: number = 6000): ProfileSamplePoint[] {
  const points: ProfileSamplePoint[] = [];
  const worldScale = 14.8;

  for (let i = 0; i < targetCount; i++) {
    // Vogel spiral for uniform density distribution
    const rNorm = Math.sqrt((i + 0.5) / targetCount) * 0.96;
    const theta = i * 2.399963229728653; // Golden angle

    const nx = Math.cos(theta) * rNorm;
    const ny = Math.sin(theta) * rNorm;

    const wx = nx * (worldScale * 0.5);
    const wy = ny * (worldScale * 0.5);

    let phase = 0;
    let r = 0.92;
    let g = 0.76;
    let b = 0.62;
    let wz = 0.4;

    // Face / skin tones (center)
    if (ny < 0.22 && ny > -0.32 && Math.abs(nx) < 0.52) {
      phase = 0;
      r = 0.94;
      g = 0.78;
      b = 0.64; // Authentic warm skin
      wz = 0.55;
    }
    // Eyes & facial features
    else if (Math.abs(ny - 0.02) < 0.12 && Math.abs(nx) < 0.48) {
      phase = 1;
      r = 0.32;
      g = 0.28;
      b = 0.30; // Eyes / glasses
      wz = 0.60;
    }
    // Hair at top
    else if (ny >= 0.22 && Math.abs(nx) < 0.65) {
      phase = 2;
      r = 0.24;
      g = 0.22;
      b = 0.26; // Natural dark hair
      wz = 0.40;
    }
    // Clothing & shoulders at bottom
    else if (ny <= -0.32) {
      phase = 3;
      r = 0.22;
      g = 0.26;
      b = 0.35; // Natural dark jacket / navy
      wz = 0.30;
    }
    // Perimeter background
    else {
      phase = 4;
      r = 0.28;
      g = 0.34;
      b = 0.42; // Cool ambient background
      wz = 0.20;
    }

    points.push({
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

  return points;
}

/**
 * Loads and rasterizes the uploaded GitHub profile image onto a dense virtual particle grid.
 * Uses the ACTUAL, AUTHENTIC RGB colors from Garv Shaw's GitHub avatar photo!
 * Preserves true skin tones, real hair color, real clothing, and real background,
 * enhanced with high-definition luminous contrast so each particle is a bright, clear dot.
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
        const sampleRes = 100; // 100x100 resolution for sharp sampling
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

        const points: ProfileSamplePoint[] = [];
        const worldScale = 14.8; // Calibrated for full viewport framing

        // Vogel golden-angle spiral distribution across the circular portrait
        for (let i = 0; i < targetSampleCount; i++) {
          const rNorm = Math.sqrt((i + 0.5) / targetSampleCount) * 0.96;
          const theta = i * 2.399963229728653; // Golden angle

          const nx = Math.cos(theta) * rNorm;
          const ny = Math.sin(theta) * rNorm;

          // Convert normalized coordinates (-1 to 1) to image UV coordinates (0 to 1)
          const u = Math.max(0, Math.min(1, (nx + 1) * 0.5));
          const v = Math.max(0, Math.min(1, (1 - ny) * 0.5)); // Y is inverted in canvas

          const px = Math.floor(u * (sampleRes - 1));
          const py = Math.floor(v * (sampleRes - 1));
          const pixelIndex = (py * sampleRes + px) * 4;

          const rawR = (data[pixelIndex] || 0) / 255;
          const rawG = (data[pixelIndex + 1] || 0) / 255;
          const rawB = (data[pixelIndex + 2] || 0) / 255;
          const rawA = (data[pixelIndex + 3] || 255) / 255;

          if (rawA < 0.08) continue;

          // Preserve authentic photographic color with calibrated luminescence
          const maxChannel = Math.max(rawR, rawG, rawB);
          let r = rawR;
          let g = rawG;
          let b = rawB;

          // Lift very dark pixels slightly so all 6,000 dots remain visible against dark background
          if (maxChannel < 0.16) {
            const lift = (0.16 - maxChannel) * 0.82;
            r = Math.min(1.0, rawR + lift);
            g = Math.min(1.0, rawG + lift);
            b = Math.min(1.0, rawB + lift + 0.02);
          } else {
            // Slight contrast/vibrancy boost while strictly preserving true photographic chromaticity
            r = Math.min(1.0, Math.pow(rawR, 0.94) * 1.12);
            g = Math.min(1.0, Math.pow(rawG, 0.94) * 1.12);
            b = Math.min(1.0, Math.pow(rawB, 0.94) * 1.12);
          }

          // Compute 3D holographic depth relief based on luminance
          const luminance = 0.299 * rawR + 0.587 * rawG + 0.114 * rawB;
          const wz = 0.35 + (luminance - 0.5) * 0.75;

          const wx = nx * (worldScale * 0.5);
          const wy = ny * (worldScale * 0.5);

          // Assign feature phase for progressive reconstruction
          let phase = 0;
          if (rNorm < 0.30) {
            phase = 0; // Inner facial core
          } else if (rNorm < 0.52) {
            phase = 1; // Facial contours & eyes
          } else if (rNorm < 0.72) {
            phase = 2; // Hair & head silhouette
          } else if (rNorm < 0.88) {
            phase = 3; // Shoulders & clothing
          } else {
            phase = 4; // Perimeter halo
          }

          points.push({
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

        if (points.length < targetSampleCount) {
          // Fill any remainder
          const existingCount = points.length;
          for (let i = existingCount; i < targetSampleCount; i++) {
            const srcPt = points[i % existingCount];
            points.push({
              ...srcPt,
              x: srcPt.x + (Math.random() - 0.5) * 0.05,
              y: srcPt.y + (Math.random() - 0.5) * 0.05,
            });
          }
        }

        resolve(points);
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

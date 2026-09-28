import * as THREE from 'three';

export interface ProfileSamplePoint {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
  phase: number; // 0: outer silhouette, 1: hair, 2: face, 3: glasses/features, 4: clothes
}

/**
 * Loads and rasterizes the uploaded GitHub profile image onto a virtual particle grid.
 * Calibrated with balanced contrast and crisp natural exposure so the portrait is
 * clearly visible and recognizable without blowing out into an over-bright white blur.
 */
export async function sampleProfileImage(
  imageSrc: string = '/github_avatar.png',
  targetSampleCount: number = 3000
): Promise<ProfileSamplePoint[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sampleRes = 84; // 84x84 candidate grid for dense portrait definition
      canvas.width = sampleRes;
      canvas.height = sampleRes;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(generateFallbackProfile(targetSampleCount));
        return;
      }

      ctx.drawImage(img, 0, 0, sampleRes, sampleRes);
      const imgData = ctx.getImageData(0, 0, sampleRes, sampleRes);
      const data = imgData.data;

      const candidates: ProfileSamplePoint[] = [];
      const worldScale = 12.0;

      for (let y = 0; y < sampleRes; y++) {
        for (let x = 0; x < sampleRes; x++) {
          const pixelIndex = (y * sampleRes + x) * 4;
          let r = data[pixelIndex] / 255;
          let g = data[pixelIndex + 1] / 255;
          let b = data[pixelIndex + 2] / 255;
          const a = data[pixelIndex + 3] / 255;

          if (a < 0.15) continue;

          // Normalize coordinates around center (0, 0)
          const nx = (x / sampleRes - 0.5) * 2;
          const ny = (1 - y / sampleRes - 0.5) * 2;
          const radiusFromCenter = Math.hypot(nx, ny);

          if (radiusFromCenter > 0.985) continue;

          const wx = nx * (worldScale * 0.5);
          const wy = ny * (worldScale * 0.5);
          const wz = -1.6 + (Math.random() - 0.5) * 0.35;

          // Categorize progressive reconstruction phases:
          // Formation order:
          // 0: CIRCULAR SILHOUETTE
          // 1: HAIR
          // 2: FACE
          // 3: GLASSES
          // 4: CLOTHING
          // 5: IMAGE DETAILS
          let phase = 0;
          const rawLuminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (ny < -0.35) {
            phase = 4; // Clothing
          } else if (ny > 0.2 && rawLuminance < 0.25) {
            phase = 1; // Hair
          } else if (ny >= -0.2 && ny <= 0.25 && rawLuminance < 0.22) {
            phase = 3; // Glasses
          } else if (ny >= -0.35 && ny <= 0.35) {
            phase = 2; // Face
          } else if (radiusFromCenter > 0.85) {
            phase = 0; // Circular silhouette
          } else {
            phase = 5; // Image details
          }

          // NATURAL VIVID EXPOSURE (Well-balanced so face, glasses & hair are crisp):
          // Avoid over-amplification that washes out the image into pure white glare.
          // Gently lift dark regions so hair & glasses are clearly distinct from the black void.
          const minDarkLum = 0.18;
          if (r < minDarkLum && g < minDarkLum && b < minDarkLum) {
            r = Math.max(r, 0.15);
            g = Math.max(g, 0.18);
            b = Math.max(b, 0.26); // Luminous deep cyan-slate for hair & glasses
          }

          // Subtle natural contrast curve
          r = Math.min(1.0, Math.pow(r, 0.95) * 1.08);
          g = Math.min(1.0, Math.pow(g, 0.95) * 1.08);
          b = Math.min(1.0, Math.pow(b, 0.95) * 1.12);

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
        resolve(generateFallbackProfile(targetSampleCount));
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
          a: candidate.a,
          phase: candidate.phase,
        });
      }

      resolve(finalPoints);
    };

    img.onerror = () => {
      resolve(generateFallbackProfile(targetSampleCount));
    };

    img.src = imageSrc;
  });
}

function generateFallbackProfile(count: number): ProfileSamplePoint[] {
  const points: ProfileSamplePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 5.2;
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: -1.6,
      r: 0.9,
      g: 0.95,
      b: 1.0,
      a: 1.0,
      phase: i % 5,
    });
  }
  return points;
}

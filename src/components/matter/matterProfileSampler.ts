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
 * Boosts luminance and contrast to ensure vivid, crystalline clarity in the dark void.
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
      const sampleRes = 84; // 84x84 candidate grid = 7056 points for dense portrait resolution
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
      const worldScale = 12.0; // Scaled comfortably in 3D world space

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
          const ny = (1 - y / sampleRes - 0.5) * 2; // Invert Y for WebGL world space
          const radiusFromCenter = Math.hypot(nx, ny);

          // Only keep within circular avatar boundary
          if (radiusFromCenter > 0.985) continue;

          const wx = nx * (worldScale * 0.5);
          const wy = ny * (worldScale * 0.5);
          const wz = -1.6 + (Math.random() - 0.5) * 0.35; // Closer to camera plane for greater pop

          // Categorize progressive reconstruction phases:
          // Phase 0: Outer border / background
          // Phase 1: Hair (dark top pixels)
          // Phase 2: Face skin tones
          // Phase 3: Glasses / eyes / dark facial accents
          // Phase 4: Torso / clothing
          let phase = 0;
          const rawLuminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (ny < -0.35) {
            phase = 4; // Clothing
          } else if (ny > 0.2 && rawLuminance < 0.25) {
            phase = 1; // Hair
          } else if (ny >= -0.2 && ny <= 0.25 && rawLuminance < 0.2) {
            phase = 3; // Glasses / facial features
          } else if (ny >= -0.35 && ny <= 0.35) {
            phase = 2; // Face
          } else {
            phase = 0; // Outer / background
          }

          // LUMINANCE BOOST & CONTRAST ENHANCEMENT:
          // Increase color vibrance and floor brightness so dark regions (hair, glasses, suit)
          // remain crisp and visible against the #050505 void while bright skin and speculars glow.
          const gamma = 0.85; // Lighten midtones
          r = Math.pow(r, gamma) * 1.35;
          g = Math.pow(g, gamma) * 1.35;
          b = Math.pow(b, gamma) * 1.45; // Subtle cyan-cool tint boost

          // Ensure minimum baseline visibility for dark hair / glasses frames
          const minLum = 0.24;
          if (r < minLum && g < minLum && b < minLum) {
            r = Math.max(r, 0.18);
            g = Math.max(g, 0.22);
            b = Math.max(b, 0.32); // Deep glowing navy/cyan for hair & glasses instead of pitch black
          }

          candidates.push({
            x: wx,
            y: wy,
            z: wz,
            r: Math.min(1.5, r), // Allow HDR values > 1.0 for UnrealBloom radiance
            g: Math.min(1.5, g),
            b: Math.min(1.6, b),
            a,
            phase,
          });
        }
      }

      if (candidates.length === 0) {
        resolve(generateFallbackProfile(targetSampleCount));
        return;
      }

      // Re-sample candidates to populate full particle buffer
      const finalPoints: ProfileSamplePoint[] = [];
      for (let i = 0; i < targetSampleCount; i++) {
        const candidate = candidates[i % candidates.length];
        finalPoints.push({
          x: candidate.x + (Math.random() - 0.5) * 0.1,
          y: candidate.y + (Math.random() - 0.5) * 0.1,
          z: candidate.z + (Math.random() - 0.5) * 0.15,
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

/**
 * Fallback procedural silhouette generator if avatar image cannot be loaded
 */
function generateFallbackProfile(count: number): ProfileSamplePoint[] {
  const points: ProfileSamplePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 5.2;
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: -1.6,
      r: 1.2,
      g: 1.3,
      b: 1.5,
      a: 1.0,
      phase: i % 5,
    });
  }
  return points;
}

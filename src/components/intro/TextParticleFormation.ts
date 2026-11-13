export interface WordTargetCloud {
  word: string;
  /** Interleaved world-space target coordinates [x0, y0, z0, x1, y1, z1, ...] */
  positions: Float32Array;
  /** Per-particle normalized character progression along the word [0..1] */
  charProgress: Float32Array;
  /** Per-particle contour/edge sharpness weight [0..1] (1 = crisp serif edge) */
  edgeWeights: Float32Array;
  /** Normalized bounding box in world units */
  bounds: {
    width: number;
    height: number;
    centerY: number;
  };
}

/**
 * TEXT PARTICLE FORMATION ENGINE
 *
 * Renders high-resolution editorial serif typography ("THINK.", "CREATE.", "DISCOVER.")
 * onto an offscreen 2D canvas, detects both crisp hairline serif contours and interior
 * glyph mass, and distributes `particleCount` targets organically in Three.js world space.
 */
export class TextParticleFormation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1800;
    this.canvas.height = 520;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Could not initialize 2D canvas for typography sampling');
    }
    this.ctx = context;
  }

  public sampleWord(
    word: string,
    particleCount: number,
    visibleWorldWidth: number,
    visibleWorldHeight: number,
    options?: {
      widthFillRatio?: number;
      maxHeightRatio?: number;
      centerYWorld?: number;
      depthSpread?: number;
      seedOffset?: number;
    }
  ): WordTargetCloud {
    const {
      widthFillRatio = 0.78,
      maxHeightRatio = 0.24,
      centerYWorld = 0,
      depthSpread = 0.14,
      seedOffset = 101,
    } = options ?? {};

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, cw, ch);

    // Measure font size so the word sits cleanly with generous editorial letter-spacing
    const baseFontSize = 230;
    const fontFamily = `"Cormorant Garamond", "Bodoni Moda", "Playfair Display", Georgia, serif`;
    ctx.font = `400 ${baseFontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const chars = Array.from(word);
    const trackingPx = baseFontSize * 0.145; // Generous luxury editorial tracking

    const charWidths: number[] = [];
    let totalRawWidth = 0;
    for (let i = 0; i < chars.length; i++) {
      const w = ctx.measureText(chars[i]).width;
      charWidths.push(w);
      totalRawWidth += w;
      if (i < chars.length - 1) {
        totalRawWidth += trackingPx;
      }
    }

    // Fit nicely inside offscreen canvas with horizontal margin
    const maxCanvasTextWidth = cw * 0.88;
    const scaleFit = Math.min(1.18, maxCanvasTextWidth / Math.max(totalRawWidth, 1));
    const fontSize = Math.round(baseFontSize * scaleFit);
    const scaledTracking = fontSize * 0.145;

    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    let totalWidth = 0;
    const finalCharWidths: number[] = [];
    for (let i = 0; i < chars.length; i++) {
      const w = ctx.measureText(chars[i]).width;
      finalCharWidths.push(w);
      totalWidth += w;
      if (i < chars.length - 1) totalWidth += scaledTracking;
    }

    const startX = (cw - totalWidth) * 0.5;
    const centerY = ch * 0.5;

    // Render crisp white glyphs onto black/transparent canvas & track exact letter intervals
    ctx.fillStyle = '#ffffff';
    const charRanges: Array<{ minX: number; maxX: number; index: number }> = [];
    let cursorX = startX;
    for (let i = 0; i < chars.length; i++) {
      const w = finalCharWidths[i];
      ctx.fillText(chars[i], cursorX, centerY);
      charRanges.push({
        minX: cursorX - scaledTracking * 0.25,
        maxX: cursorX + w + scaledTracking * 0.25,
        index: i,
      });
      cursorX += w + scaledTracking;
    }

    const imgData = ctx.getImageData(0, 0, cw, ch).data;

    // Scan alpha mask to collect edge samples & interior samples with tight bounding box
    const edgeSamples: Array<{ x: number; y: number; charT: number }> = [];
    const fillSamples: Array<{ x: number; y: number; charT: number }> = [];

    let minPxX = cw;
    let maxPxX = 0;
    let minPxY = ch;
    let maxPxY = 0;

    // Adaptive scan stride for fast sampling across all screen resolutions
    const step = 1;
    const charCountDenom = Math.max(chars.length - 1, 1);

    const resolveCharT = (px: number): number => {
      for (let i = 0; i < charRanges.length; i++) {
        if (px >= charRanges[i].minX && px <= charRanges[i].maxX) {
          return i / charCountDenom;
        }
      }
      return Math.min(Math.max((px - startX) / Math.max(totalWidth, 1), 0), 1);
    };

    for (let y = 2; y < ch - 2; y += step) {
      const rowOffset = y * cw;
      for (let x = 2; x < cw - 2; x += step) {
        const a = imgData[(rowOffset + x) * 4 + 3];
        if (a < 42) continue;

        if (x < minPxX) minPxX = x;
        if (x > maxPxX) maxPxX = x;
        if (y < minPxY) minPxY = y;
        if (y > maxPxY) maxPxY = y;

        // 4-neighbor edge check for crisp editorial serifs & stroke borders
        const aLeft = imgData[(rowOffset + (x - 2)) * 4 + 3];
        const aRight = imgData[(rowOffset + (x + 2)) * 4 + 3];
        const aUp = imgData[((y - 2) * cw + x) * 4 + 3];
        const aDown = imgData[((y + 2) * cw + x) * 4 + 3];

        const isEdge = aLeft < 110 || aRight < 110 || aUp < 110 || aDown < 110;
        const charT = resolveCharT(x);

        if (isEdge) {
          edgeSamples.push({ x, y, charT });
        } else if (a > 120) {
          fillSamples.push({ x, y, charT });
        }
      }
    }

    const pxBoxW = Math.max(maxPxX - minPxX, 1);
    const pxBoxH = Math.max(maxPxY - minPxY, 1);
    const pxCenterX = (minPxX + maxPxX) * 0.5;
    const pxCenterY = (minPxY + maxPxY) * 0.5;

    // Map pixel width to target fraction of visible world viewport width
    const desiredWorldW = visibleWorldWidth * widthFillRatio;
    const maxWorldH = visibleWorldHeight * maxHeightRatio;
    const worldPerPx = Math.min(desiredWorldW / pxBoxW, maxWorldH / pxBoxH);

    const worldWidth = pxBoxW * worldPerPx;
    const worldHeight = pxBoxH * worldPerPx;

    const positions = new Float32Array(particleCount * 3);
    const charProgress = new Float32Array(particleCount);
    const edgeWeights = new Float32Array(particleCount);

    // Deterministic PRNG for zero flicker across resizes & clean reproducibility
    let seed = (seedOffset * 73856093) ^ (word.length * 19349663);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const hasEdge = edgeSamples.length > 0;
    const hasFill = fillSamples.length > 0;

    // Reserve ~44% of particles for crisp letter contours and ~56% for lush sand interior
    for (let i = 0; i < particleCount; i++) {
      const idx3 = i * 3;
      const pickEdge = (i % 100) < 44 && hasEdge;
      const pool = pickEdge ? edgeSamples : hasFill ? fillSamples : edgeSamples;

      if (pool.length === 0) {
        positions[idx3] = (rand() - 0.5) * 2.0;
        positions[idx3 + 1] = centerYWorld + (rand() - 0.5) * 0.5;
        positions[idx3 + 2] = 0;
        charProgress[i] = rand();
        edgeWeights[i] = 0.5;
        continue;
      }

      // Stratified quasi-random selection covers the entire glyph uniformly without gaps
      const baseIndex = Math.floor(((i / particleCount) + rand() * 0.08) * pool.length) % pool.length;
      const sample = pool[baseIndex];

      // Sub-pixel organic sand jitter prevents artificial lattice lines
      const subJitterX = (rand() - 0.5) * (pickEdge ? 0.8 : 1.45);
      const subJitterY = (rand() - 0.5) * (pickEdge ? 0.8 : 1.45);

      const wx = (sample.x + subJitterX - pxCenterX) * worldPerPx;
      const wy = centerYWorld - (sample.y + subJitterY - pxCenterY) * worldPerPx;
      const wz = (rand() - 0.5) * depthSpread * (pickEdge ? 0.45 : 1.0);

      positions[idx3] = wx;
      positions[idx3 + 1] = wy;
      positions[idx3 + 2] = wz;
      charProgress[i] = sample.charT;
      edgeWeights[i] = pickEdge ? 1.0 : 0.25 + rand() * 0.45;
    }

    return {
      word,
      positions,
      charProgress,
      edgeWeights,
      bounds: {
        width: worldWidth,
        height: worldHeight,
        centerY: centerYWorld,
      },
    };
  }
}

/**
 * Self-contained ISO/IEC 18004 QR Code Version 4-L (33x33, up to 78 UTF-8 bytes)
 * Produces a genuinely scannable QR matrix with zero external dependencies.
 */

const QR_SIZE = 33;
const DATA_CODEWORDS = 80;
const EC_CODEWORDS = 20;
// Format info for Error Correction Level L (01) + Mask 0 (000): 111011111000100
const FORMAT_BITS_L_MASK0 = 0b111011111000100;

// GF(256) tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function computeRsEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = buildRsGenerator(ecCount);
  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  let bytes = encoder.encode(text);
  if (bytes.length > DATA_CODEWORDS - 2) {
    bytes = bytes.slice(0, DATA_CODEWORDS - 2);
  }

  // Pack bit stream: Byte mode (0100) + 8-bit length + payload + terminator + padding
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }
  const maxDataBits = DATA_CODEWORDS * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataWords = new Uint8Array(DATA_CODEWORDS);
  const writtenBytes = bits.length / 8;
  for (let i = 0; i < writtenBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataWords[i] = b;
  }
  for (let i = writtenBytes, p = 0; i < DATA_CODEWORDS; i++, p++) {
    dataWords[i] = p % 2 === 0 ? 0xec : 0x11;
  }

  const ecWords = computeRsEc(dataWords, EC_CODEWORDS);
  const allCodewords = new Uint8Array(DATA_CODEWORDS + EC_CODEWORDS);
  allCodewords.set(dataWords, 0);
  allCodewords.set(ecWords, DATA_CODEWORDS);

  // Build 33x33 grid & reserved function map
  const modules: boolean[][] = Array.from({ length: QR_SIZE }, () =>
    Array<boolean>(QR_SIZE).fill(false)
  );
  const isFunc: boolean[][] = Array.from({ length: QR_SIZE }, () =>
    Array<boolean>(QR_SIZE).fill(false)
  );

  const setFunc = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= QR_SIZE || c < 0 || c >= QR_SIZE) return;
    modules[r][c] = dark;
    isFunc[r][c] = true;
  };

  // Finder patterns + 1px white separators
  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= QR_SIZE || c < 0 || c >= QR_SIZE) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r, c, inOuter && (onBorder || inCore));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, QR_SIZE - 7);
  drawFinder(QR_SIZE - 7, 0);

  // Version 4 alignment pattern at (26, 26)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      setFunc(26 + dr, 26 + dc, dark);
    }
  }

  // Timing patterns
  for (let i = 8; i < QR_SIZE - 8; i++) {
    const dark = i % 2 === 0;
    if (!isFunc[6][i]) setFunc(6, i, dark);
    if (!isFunc[i][6]) setFunc(i, 6, dark);
  }

  // Dark module at (4*version + 9, 8) = (25, 8)
  setFunc(25, 8, true);

  // Reserve format info strips and write FORMAT_BITS_L_MASK0
  for (let i = 0; i <= 5; i++) {
    const bit = ((FORMAT_BITS_L_MASK0 >> (14 - i)) & 1) === 1;
    setFunc(8, i, bit);
    setFunc(QR_SIZE - 1 - i, 8, bit);
  }
  const b6 = ((FORMAT_BITS_L_MASK0 >> 8) & 1) === 1;
  setFunc(8, 7, b6);
  setFunc(QR_SIZE - 7, 8, b6);

  const b7 = ((FORMAT_BITS_L_MASK0 >> 7) & 1) === 1;
  setFunc(8, 8, b7);
  setFunc(8, QR_SIZE - 8, b7);

  const b8 = ((FORMAT_BITS_L_MASK0 >> 6) & 1) === 1;
  setFunc(7, 8, b8);
  setFunc(8, QR_SIZE - 7, b8);

  for (let i = 9; i < 15; i++) {
    const bit = ((FORMAT_BITS_L_MASK0 >> (14 - i)) & 1) === 1;
    setFunc(14 - i, 8, bit);
    setFunc(8, QR_SIZE - 15 + i, bit);
  }

  // Zigzag upward/downward bit placement with Mask 0: (r + c) % 2 === 0
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let upward = true;

  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip vertical timing column
    for (let step = 0; step < QR_SIZE; step++) {
      const r = upward ? QR_SIZE - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = right - dx;
        if (isFunc[r][c]) continue;
        let dark = false;
        if (bitIdx < totalBits) {
          const word = allCodewords[bitIdx >> 3];
          dark = ((word >> (7 - (bitIdx & 7))) & 1) === 1;
          bitIdx++;
        }
        if ((r + c) % 2 === 0) dark = !dark;
        modules[r][c] = dark;
      }
    }
    upward = !upward;
  }

  return modules;
}

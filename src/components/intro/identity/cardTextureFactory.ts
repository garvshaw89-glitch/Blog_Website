import * as THREE from 'three';
import { generateQrMatrix } from './qrMatrix';

export const IDENTITY_DATA = {
  name: 'GARV SHAW',
  role: 'Developer / Creative Designer',
  githubHandle: '@garvshaw89-glitch',
  githubUrl: 'https://github.com/garvshaw89-glitch',
  portfolioFallbackUrl: 'https://portfoliowebsite-7tvxld4nh-garvshaw.vercel.app/',
  verificationLabel: 'IDENTITY VERIFIED',
  serialNumber: 'GS-2026-0894-A1',
  editionLabel: 'STUDIO CREDENTIAL · ED. 04',
  clearance: 'CREATIVE ARCHITECT',
};

/**
 * Normalized UV region (0..1 from top-left) of the GARV SHAW primary name on the front face.
 */
export const NAME_REGION_UV = {
  x: 0.074,
  y: 0.232,
  w: 0.65,
  h: 0.074,
};

/**
 * Normalized UV region (0..1 from top-left) of the interactive GitHub inset on the front face.
 * Used both for painting the canvas and for 3D raycast hover/click detection.
 */
export const GITHUB_REGION_UV = {
  x: 0.085,
  y: 0.455,
  w: 0.83,
  h: 0.125,
};

/**
 * Normalized UV region (0..1 from top-left) of the holographic security strip band.
 */
export const HOLO_STRIP_UV = {
  x: 0.065,
  y: 0.625,
  w: 0.87,
  h: 0.056,
};

export interface CardPbrTextureSet {
  frontMap: THREE.CanvasTexture;
  frontRoughnessMap: THREE.CanvasTexture;
  frontMetalnessMap: THREE.CanvasTexture;
  frontBumpMap: THREE.CanvasTexture;
  backMap: THREE.CanvasTexture;
  backRoughnessMap: THREE.CanvasTexture;
  lanyardMap: THREE.CanvasTexture;
  lanyardBumpMap: THREE.CanvasTexture;
  dispose: () => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGitHubOctocat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx - radius, cy - radius);
  const scale = (radius * 2) / 24;
  ctx.scale(scale, scale);
  const path = new Path2D(
    'M12 0.5C5.37 0.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.82.58C20.57 22.3 24 17.8 24 12.5 24 5.87 18.63 0.5 12 0.5z'
  );
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

function createBrushedGrainCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  // Fine horizontal anisotropic brushed-metal & micro-acrylic grain
  let seed = 42193;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < h; y += 2) {
    const v = 114 + Math.floor(rand() * 28);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, w, 1 + (rand() > 0.72 ? 1 : 0));
  }
  for (let i = 0; i < 650; i++) {
    const sx = rand() * w;
    const sy = rand() * h;
    const sw = 40 + rand() * 240;
    const alpha = 0.04 + rand() * 0.07;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(sx, sy, sw, 1);
  }
  return c;
}

function getPortfolioUrlForQr(): string {
  if (typeof window !== 'undefined') {
    const href = window.location.origin;
    if (href && /^https?:\/\//i.test(href) && !href.includes('localhost') && href.length <= 74) {
      return href;
    }
  }
  return IDENTITY_DATA.portfolioFallbackUrl;
}

export function createCardPbrTextures(maxAnisotropy = 8): CardPbrTextureSet {
  const W = 1024;
  const H = 1600;

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = W;
  frontCanvas.height = H;
  const fCtx = frontCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = W;
  roughCanvas.height = H;
  const rCtx = roughCanvas.getContext('2d')!;

  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = W;
  metalCanvas.height = H;
  const mCtx = metalCanvas.getContext('2d')!;

  const bumpCanvas = createBrushedGrainCanvas(W, H);
  const bCtx = bumpCanvas.getContext('2d')!;

  // --------------------------------------------------------------------------
  // 1. BASE OBSIDIAN-MIDNIGHT ANODIZED / BRUSHED ACRYLIC SUBSTRATE (Main Page Match)
  // --------------------------------------------------------------------------
  const bgGrad = fCtx.createLinearGradient(0, 0, W * 0.85, H);
  bgGrad.addColorStop(0, '#0C1220');
  bgGrad.addColorStop(0.34, '#070A12');
  bgGrad.addColorStop(0.68, '#0B111E');
  bgGrad.addColorStop(1, '#05070C');
  fCtx.fillStyle = bgGrad;
  fCtx.fillRect(0, 0, W, H);

  // Subtle celestial cyan & indigo studio depth luminescence (matching main page hero atmosphere)
  const radGlow = fCtx.createRadialGradient(W * 0.5, H * 0.25, 30, W * 0.5, H * 0.36, W * 0.94);
  radGlow.addColorStop(0, 'rgba(56, 189, 248, 0.11)');
  radGlow.addColorStop(0.42, 'rgba(99, 102, 241, 0.045)');
  radGlow.addColorStop(1, 'rgba(3, 5, 10, 0.36)');
  fCtx.fillStyle = radGlow;
  fCtx.fillRect(0, 0, W, H);

  // Faint micro-brushed horizontal texture onto color
  fCtx.save();
  fCtx.globalAlpha = 0.055;
  fCtx.drawImage(bumpCanvas, 0, 0);
  fCtx.restore();

  // Base roughness (matte dark satin acrylic ~0.40) and metalness (subtle ~0.18)
  rCtx.fillStyle = '#686868';
  rCtx.fillRect(0, 0, W, H);
  rCtx.save();
  rCtx.globalAlpha = 0.14;
  rCtx.drawImage(bumpCanvas, 0, 0);
  rCtx.restore();

  mCtx.fillStyle = '#2A2A2A';
  mCtx.fillRect(0, 0, W, H);

  // Ultra-subtle geometric architectural micro-grid in upper field
  fCtx.save();
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.045)';
  fCtx.lineWidth = 1;
  for (let gx = 96; gx < W - 80; gx += 64) {
    fCtx.beginPath();
    fCtx.moveTo(gx, 140);
    fCtx.lineTo(gx, 720);
    fCtx.stroke();
  }
  for (let gy = 160; gy < 720; gy += 64) {
    fCtx.beginPath();
    fCtx.moveTo(86, gy);
    fCtx.lineTo(W - 86, gy);
    fCtx.stroke();
  }
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 2. PRECISION CELESTIAL CYAN & PLATINUM DOUBLE BORDER
  // --------------------------------------------------------------------------
  const accentGrad = fCtx.createLinearGradient(0, 0, W, H);
  accentGrad.addColorStop(0, '#BAE6FD');
  accentGrad.addColorStop(0.35, '#38BDF8');
  accentGrad.addColorStop(0.68, '#67E8F9');
  accentGrad.addColorStop(1, '#6366F1');

  fCtx.save();
  drawRoundedRect(fCtx, 42, 42, W - 84, H - 84, 44);
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.36)';
  fCtx.lineWidth = 2.5;
  fCtx.stroke();

  drawRoundedRect(fCtx, 58, 58, W - 116, H - 116, 34);
  fCtx.strokeStyle = 'rgba(148, 197, 255, 0.13)';
  fCtx.lineWidth = 1.2;
  fCtx.stroke();
  fCtx.restore();

  // Make border reflective & metallic in roughness/metalness maps
  rCtx.save();
  drawRoundedRect(rCtx, 42, 42, W - 84, H - 84, 44);
  rCtx.strokeStyle = '#242424';
  rCtx.lineWidth = 5;
  rCtx.stroke();
  rCtx.restore();

  mCtx.save();
  drawRoundedRect(mCtx, 42, 42, W - 84, H - 84, 44);
  mCtx.strokeStyle = '#ECECEC';
  mCtx.lineWidth = 5;
  mCtx.stroke();
  mCtx.restore();

  // Lanyard slot decorative recessed bezel at top center
  const slotW = 196;
  const slotH = 38;
  const slotX = (W - slotW) / 2;
  const slotY = 74;
  fCtx.save();
  drawRoundedRect(fCtx, slotX - 10, slotY - 10, slotW + 20, slotH + 20, 29);
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
  fCtx.lineWidth = 2.5;
  fCtx.stroke();
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 3. TOP HEADER: STUDIO MONOGRAM & IDENTITY VERIFICATION BADGE
  // --------------------------------------------------------------------------
  const padX = 88;
  const topRowY = 196;

  // Monogram Crest Box ("GS")
  fCtx.save();
  drawRoundedRect(fCtx, padX, topRowY - 34, 68, 68, 14);
  fCtx.fillStyle = 'rgba(56, 189, 248, 0.10)';
  fCtx.fill();
  fCtx.strokeStyle = accentGrad;
  fCtx.lineWidth = 2;
  fCtx.stroke();
  fCtx.fillStyle = '#E0F2FE';
  fCtx.font = '600 32px "Cormorant Garamond", Georgia, serif';
  fCtx.textAlign = 'center';
  fCtx.textBaseline = 'middle';
  fCtx.fillText('GS', padX + 34, topRowY + 2);
  fCtx.restore();

  // Edition caption next to monogram
  fCtx.save();
  fCtx.textAlign = 'left';
  fCtx.textBaseline = 'alphabetic';
  fCtx.fillStyle = 'rgba(241, 245, 249, 0.92)';
  fCtx.font = '600 17px "Space Grotesk", "Inter", sans-serif';
  fCtx.fillText('DEVELOPER PASS', padX + 88, topRowY - 6);
  fCtx.fillStyle = 'rgba(103, 232, 249, 0.72)';
  fCtx.font = '500 14px "JetBrains Mono", monospace';
  fCtx.fillText(IDENTITY_DATA.editionLabel, padX + 88, topRowY + 20);
  fCtx.restore();

  // Right-aligned Identity Verification Label
  const badgeW = 266;
  const badgeH = 44;
  const badgeX = W - padX - badgeW;
  const badgeY = topRowY - 22;
  fCtx.save();
  drawRoundedRect(fCtx, badgeX, badgeY, badgeW, badgeH, 22);
  fCtx.fillStyle = 'rgba(56, 189, 248, 0.10)';
  fCtx.fill();
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.48)';
  fCtx.lineWidth = 1.6;
  fCtx.stroke();

  // Cyan verification dot + checkmark ring
  fCtx.beginPath();
  fCtx.arc(badgeX + 26, badgeY + badgeH / 2, 7.5, 0, Math.PI * 2);
  fCtx.fillStyle = '#38BDF8';
  fCtx.fill();

  fCtx.strokeStyle = '#05070C';
  fCtx.lineWidth = 2.2;
  fCtx.lineCap = 'round';
  fCtx.lineJoin = 'round';
  fCtx.beginPath();
  fCtx.moveTo(badgeX + 22.4, badgeY + badgeH / 2 + 0.3);
  fCtx.lineTo(badgeX + 25.0, badgeY + badgeH / 2 + 3.0);
  fCtx.lineTo(badgeX + 29.8, badgeY + badgeH / 2 - 2.6);
  fCtx.stroke();

  fCtx.fillStyle = '#BAE6FD';
  fCtx.font = '600 14px "JetBrains Mono", monospace';
  fCtx.textAlign = 'left';
  fCtx.textBaseline = 'middle';
  fCtx.fillText(IDENTITY_DATA.verificationLabel, badgeX + 46, badgeY + badgeH / 2 + 1);
  fCtx.restore();

  // Hairline rule under header
  fCtx.save();
  const hr1 = fCtx.createLinearGradient(padX, 0, W - padX, 0);
  hr1.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
  hr1.addColorStop(0.25, 'rgba(56, 189, 248, 0.30)');
  hr1.addColorStop(0.75, 'rgba(129, 140, 248, 0.28)');
  hr1.addColorStop(1, 'rgba(56, 189, 248, 0.04)');
  fCtx.strokeStyle = hr1;
  fCtx.lineWidth = 1.5;
  fCtx.beginPath();
  fCtx.moveTo(padX, 272);
  fCtx.lineTo(W - padX, 272);
  fCtx.stroke();
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 4. EDITORIAL IDENTITY HERO BLOCK: GARV SHAW & DESIGNATION
  // --------------------------------------------------------------------------
  fCtx.save();
  fCtx.textAlign = 'left';
  fCtx.textBaseline = 'alphabetic';

  // Micro kicker
  fCtx.fillStyle = 'rgba(103, 232, 249, 0.72)';
  fCtx.font = '500 16px "JetBrains Mono", monospace';
  fCtx.fillText('01  /  PRINCIPAL IDENTITY', padX, 344);

  // Primary Name: GARV SHAW (high-contrast embossed platinum-white to ice-cyan display)
  const nameGrad = fCtx.createLinearGradient(padX, 380, W - padX, 510);
  nameGrad.addColorStop(0, '#FFFFFF');
  nameGrad.addColorStop(0.48, '#E6F4FE');
  nameGrad.addColorStop(0.84, '#7DD3FC');
  nameGrad.addColorStop(1, '#E0E7FF');

  fCtx.fillStyle = nameGrad;
  fCtx.font = '600 96px "Cormorant Garamond", "Bodoni Moda", Georgia, serif';
  fCtx.fillText(IDENTITY_DATA.name, padX - 4, 466);

  // Emboss name slightly in metallic + roughness + bump maps so light glances off the lettering!
  mCtx.save();
  mCtx.fillStyle = '#DCDCDC';
  mCtx.font = '600 96px "Cormorant Garamond", "Bodoni Moda", Georgia, serif';
  mCtx.fillText(IDENTITY_DATA.name, padX - 4, 466);
  mCtx.restore();

  rCtx.save();
  rCtx.fillStyle = '#242424';
  rCtx.font = '600 96px "Cormorant Garamond", "Bodoni Moda", Georgia, serif';
  rCtx.fillText(IDENTITY_DATA.name, padX - 4, 466);
  rCtx.restore();

  bCtx.save();
  bCtx.fillStyle = '#B8B8B8';
  bCtx.font = '600 96px "Cormorant Garamond", "Bodoni Moda", Georgia, serif';
  bCtx.fillText(IDENTITY_DATA.name, padX - 4, 466);
  bCtx.restore();

  // Electric cyan-to-sapphire short accent rule under name
  fCtx.fillStyle = accentGrad;
  fCtx.fillRect(padX, 498, 92, 3);

  // Designation: Developer / Creative Designer
  fCtx.fillStyle = '#67E8F9';
  fCtx.font = '400 32px "Space Grotesk", "Inter", sans-serif';
  fCtx.fillText(IDENTITY_DATA.role, padX, 558);

  // Subtle discipline metadata row
  fCtx.fillStyle = 'rgba(203, 213, 225, 0.62)';
  fCtx.font = '400 18px "Inter", sans-serif';
  fCtx.fillText('AI Systems  ·  Cloud Architecture  ·  Interactive WebGL', padX, 608);
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 5. INTERACTIVE GITHUB MODULE (exact coordinates aligned with GITHUB_REGION_UV)
  // --------------------------------------------------------------------------
  const ghX = GITHUB_REGION_UV.x * W;
  const ghY = GITHUB_REGION_UV.y * H;
  const ghW = GITHUB_REGION_UV.w * W;
  const ghH = GITHUB_REGION_UV.h * H;

  fCtx.save();
  drawRoundedRect(fCtx, ghX, ghY, ghW, ghH, 24);
  const ghFill = fCtx.createLinearGradient(ghX, ghY, ghX + ghW, ghY + ghH);
  ghFill.addColorStop(0, 'rgba(56, 189, 248, 0.065)');
  ghFill.addColorStop(0.5, 'rgba(59, 130, 246, 0.06)');
  ghFill.addColorStop(1, 'rgba(99, 102, 241, 0.045)');
  fCtx.fillStyle = ghFill;
  fCtx.fill();
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
  fCtx.lineWidth = 2;
  fCtx.stroke();

  // GitHub circular emblem pad
  const iconCx = ghX + 76;
  const iconCy = ghY + ghH / 2;
  fCtx.beginPath();
  fCtx.arc(iconCx, iconCy, 42, 0, Math.PI * 2);
  fCtx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  fCtx.fill();
  fCtx.strokeStyle = 'rgba(103, 232, 249, 0.48)';
  fCtx.lineWidth = 1.6;
  fCtx.stroke();

  drawGitHubOctocat(fCtx, iconCx, iconCy, 24, '#E0F2FE');

  // GitHub text stack
  fCtx.textAlign = 'left';
  fCtx.textBaseline = 'alphabetic';
  fCtx.fillStyle = 'rgba(103, 232, 249, 0.78)';
  fCtx.font = '600 15px "JetBrains Mono", monospace';
  fCtx.fillText('GITHUB PROFILE  ·  CLICK TO OPEN', ghX + 144, ghY + 62);

  fCtx.fillStyle = '#F8FAFC';
  fCtx.font = '600 34px "JetBrains Mono", monospace';
  fCtx.fillText(IDENTITY_DATA.githubHandle, ghX + 144, ghY + 114);

  fCtx.fillStyle = 'rgba(186, 210, 235, 0.62)';
  fCtx.font = '400 18px "Inter", sans-serif';
  fCtx.fillText('github.com/garvshaw89-glitch', ghX + 144, ghY + 152);

  // Subtle diagonal arrow on right side of GitHub inset
  const arrowX = ghX + ghW - 58;
  const arrowY = ghY + ghH / 2;
  fCtx.strokeStyle = '#38BDF8';
  fCtx.lineWidth = 3;
  fCtx.lineCap = 'round';
  fCtx.lineJoin = 'round';
  fCtx.beginPath();
  fCtx.moveTo(arrowX - 14, arrowY + 14);
  fCtx.lineTo(arrowX + 14, arrowY - 14);
  fCtx.moveTo(arrowX - 4, arrowY - 14);
  fCtx.lineTo(arrowX + 14, arrowY - 14);
  fCtx.lineTo(arrowX + 14, arrowY + 4);
  fCtx.stroke();
  fCtx.restore();

  // Slightly shinier glass treatment for the GitHub inset panel
  rCtx.save();
  drawRoundedRect(rCtx, ghX, ghY, ghW, ghH, 24);
  rCtx.fillStyle = '#404040';
  rCtx.fill();
  rCtx.restore();

  // --------------------------------------------------------------------------
  // 6. HOLOGRAPHIC SECURITY STRIP BASE RECESS (aligned with HOLO_STRIP_UV)
  // --------------------------------------------------------------------------
  const holoX = HOLO_STRIP_UV.x * W;
  const holoY = HOLO_STRIP_UV.y * H;
  const holoW = HOLO_STRIP_UV.w * W;
  const holoH = HOLO_STRIP_UV.h * H;

  fCtx.save();
  drawRoundedRect(fCtx, holoX, holoY, holoW, holoH, 10);
  const holoBg = fCtx.createLinearGradient(holoX, holoY, holoX + holoW, holoY);
  holoBg.addColorStop(0, '#0C1424');
  holoBg.addColorStop(0.28, '#132740');
  holoBg.addColorStop(0.54, '#1B1E3C');
  holoBg.addColorStop(0.78, '#112A3E');
  holoBg.addColorStop(1, '#0B1220');
  fCtx.fillStyle = holoBg;
  fCtx.fill();
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
  fCtx.lineWidth = 1.5;
  fCtx.stroke();

  // Precision micro-guilloche etched text inside strip base
  fCtx.fillStyle = 'rgba(186, 230, 253, 0.44)';
  fCtx.font = '600 13px "JetBrains Mono", monospace';
  fCtx.textAlign = 'center';
  fCtx.textBaseline = 'middle';
  fCtx.fillText(
    'AUTHENTICATED  ◆  GARV SHAW  ◆  HOLOGRAPHIC SECURITY SEAL  ◆  GS-2026',
    W / 2,
    holoY + holoH / 2 + 1
  );
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 7. FOOTER: SERIAL NUMBER, CLEARANCE METADATA & DEDICATED SCANNABLE QR CODE
  // --------------------------------------------------------------------------
  const footerTop = 1148;

  // Left metadata column
  fCtx.save();
  fCtx.textAlign = 'left';
  fCtx.textBaseline = 'alphabetic';

  fCtx.fillStyle = 'rgba(103, 232, 249, 0.72)';
  fCtx.font = '600 15px "JetBrains Mono", monospace';
  fCtx.fillText('SERIAL NUMBER', padX, footerTop + 28);

  fCtx.fillStyle = '#F1F5F9';
  fCtx.font = '600 34px "JetBrains Mono", monospace';
  fCtx.fillText(IDENTITY_DATA.serialNumber, padX, footerTop + 76);

  // Subtle metallic highlight on serial number
  mCtx.save();
  mCtx.fillStyle = '#C0C0C0';
  mCtx.font = '600 34px "JetBrains Mono", monospace';
  mCtx.fillText(IDENTITY_DATA.serialNumber, padX, footerTop + 76);
  mCtx.restore();

  // Second row: clearance + verification status
  fCtx.fillStyle = 'rgba(103, 232, 249, 0.72)';
  fCtx.font = '600 14px "JetBrains Mono", monospace';
  fCtx.fillText('CLEARANCE', padX, footerTop + 148);
  fCtx.fillStyle = 'rgba(241, 245, 249, 0.92)';
  fCtx.font = '500 23px "Space Grotesk", "Inter", sans-serif';
  fCtx.fillText(IDENTITY_DATA.clearance, padX, footerTop + 184);

  fCtx.fillStyle = 'rgba(103, 232, 249, 0.72)';
  fCtx.font = '600 14px "JetBrains Mono", monospace';
  fCtx.fillText('CRYPTOGRAPHIC HASH', padX, footerTop + 252);
  fCtx.fillStyle = 'rgba(186, 210, 235, 0.66)';
  fCtx.font = '500 16px "JetBrains Mono", monospace';
  fCtx.fillText('SHA256 · 89F4·C2A1·7E0B', padX, footerTop + 284);

  // Subtle decorative optical barcode bars along bottom-left edge
  const barY = footerTop + 314;
  let bx = padX;
  const barWidths = [3, 6, 2, 4, 8, 2, 3, 5, 2, 7, 3, 2, 6, 4, 2, 3, 7, 2, 4, 5, 2, 6, 3, 4];
  fCtx.fillStyle = 'rgba(56, 189, 248, 0.40)';
  for (let i = 0; i < barWidths.length; i++) {
    fCtx.fillRect(bx, barY, barWidths[i], 28);
    bx += barWidths[i] + (i % 3 === 0 ? 6 : 4);
  }
  fCtx.restore();

  // Right column: Dedicated Scannable Portfolio QR Code in Cool Platinum-Cyan Plate
  const qrBoxSize = 278;
  const qrBoxX = W - padX - qrBoxSize;
  const qrBoxY = footerTop + 14;

  fCtx.save();
  drawRoundedRect(fCtx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 22);
  fCtx.fillStyle = '#F0F7FC';
  fCtx.fill();
  fCtx.strokeStyle = accentGrad;
  fCtx.lineWidth = 3;
  fCtx.stroke();

  const qrMatrix = generateQrMatrix(getPortfolioUrlForQr());
  const modules = qrMatrix.length; // 33
  const quiet = 22;
  const drawSpan = qrBoxSize - quiet * 2;
  const cell = drawSpan / modules;

  fCtx.fillStyle = '#060A14';
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (qrMatrix[r][c]) {
        const px = qrBoxX + quiet + c * cell;
        const py = qrBoxY + quiet + r * cell;
        fCtx.fillRect(px, py, Math.ceil(cell + 0.35), Math.ceil(cell + 0.35));
      }
    }
  }

  // Subtle cyan corner alignment brackets outside QR plate
  const bk = 16;
  const padB = 9;
  fCtx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
  fCtx.lineWidth = 2.4;
  fCtx.beginPath();
  // Top-left
  fCtx.moveTo(qrBoxX - padB, qrBoxY - padB + bk);
  fCtx.lineTo(qrBoxX - padB, qrBoxY - padB);
  fCtx.lineTo(qrBoxX - padB + bk, qrBoxY - padB);
  // Top-right
  fCtx.moveTo(qrBoxX + qrBoxSize + padB - bk, qrBoxY - padB);
  fCtx.lineTo(qrBoxX + qrBoxSize + padB, qrBoxY - padB);
  fCtx.lineTo(qrBoxX + qrBoxSize + padB, qrBoxY - padB + bk);
  // Bottom-left
  fCtx.moveTo(qrBoxX - padB, qrBoxY + qrBoxSize + padB - bk);
  fCtx.lineTo(qrBoxX - padB, qrBoxY + qrBoxSize + padB);
  fCtx.lineTo(qrBoxX - padB + bk, qrBoxY + qrBoxSize + padB);
  // Bottom-right
  fCtx.moveTo(qrBoxX + qrBoxSize + padB - bk, qrBoxY + qrBoxSize + padB);
  fCtx.lineTo(qrBoxX + qrBoxSize + padB, qrBoxY + qrBoxSize + padB);
  fCtx.lineTo(qrBoxX + qrBoxSize + padB, qrBoxY + qrBoxSize + padB - bk);
  fCtx.stroke();

  // Caption under QR code
  fCtx.fillStyle = 'rgba(103, 232, 249, 0.82)';
  fCtx.font = '600 14px "JetBrains Mono", monospace';
  fCtx.textAlign = 'center';
  fCtx.fillText('SCAN PORTFOLIO', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 40);
  fCtx.restore();

  // --------------------------------------------------------------------------
  // 8. BACK FACE TEXTURE (matching obsidian-midnight & cyan-indigo theme)
  // --------------------------------------------------------------------------
  const backCanvas = document.createElement('canvas');
  backCanvas.width = W;
  backCanvas.height = H;
  const bkCtx = backCanvas.getContext('2d')!;

  const backGrad = bkCtx.createLinearGradient(0, 0, W, H);
  backGrad.addColorStop(0, '#0B101C');
  backGrad.addColorStop(0.5, '#070A12');
  backGrad.addColorStop(1, '#0C1220');
  bkCtx.fillStyle = backGrad;
  bkCtx.fillRect(0, 0, W, H);

  bkCtx.save();
  bkCtx.globalAlpha = 0.06;
  bkCtx.drawImage(bumpCanvas, 0, 0);
  bkCtx.restore();

  // Back magnetic optical strip
  bkCtx.fillStyle = '#04060B';
  bkCtx.fillRect(0, 220, W, 140);
  bkCtx.fillStyle = 'rgba(56, 189, 248, 0.30)';
  bkCtx.fillRect(0, 220, W, 2);
  bkCtx.fillRect(0, 360, W, 2);

  // Border & centered watermark crest
  drawRoundedRect(bkCtx, 42, 42, W - 84, H - 84, 44);
  bkCtx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
  bkCtx.lineWidth = 2;
  bkCtx.stroke();

  bkCtx.save();
  bkCtx.textAlign = 'center';
  bkCtx.textBaseline = 'middle';
  bkCtx.fillStyle = 'rgba(56, 189, 248, 0.20)';
  bkCtx.font = '500 220px "Cormorant Garamond", Georgia, serif';
  bkCtx.fillText('GS', W / 2, H * 0.52);

  bkCtx.fillStyle = 'rgba(103, 232, 249, 0.60)';
  bkCtx.font = '500 18px "JetBrains Mono", monospace';
  bkCtx.fillText(IDENTITY_DATA.serialNumber, W / 2, H * 0.67);

  bkCtx.fillStyle = 'rgba(203, 213, 225, 0.48)';
  bkCtx.font = '400 16px "Inter", sans-serif';
  bkCtx.fillText('GARV SHAW · DEVELOPER / CREATIVE DESIGNER', W / 2, H * 0.84);
  bkCtx.fillText('github.com/garvshaw89-glitch', W / 2, H * 0.875);
  bkCtx.restore();

  const backRoughCanvas = document.createElement('canvas');
  backRoughCanvas.width = 512;
  backRoughCanvas.height = 512;
  const brCtx = backRoughCanvas.getContext('2d')!;
  brCtx.fillStyle = '#727272';
  brCtx.fillRect(0, 0, 512, 512);
  brCtx.fillStyle = '#242424';
  brCtx.fillRect(0, 70, 512, 46);

  // --------------------------------------------------------------------------
  // 9. WOVEN GROSGRAIN LANYARD FABRIC TEXTURE (Obsidian + Cyan Edge Piping)
  // --------------------------------------------------------------------------
  const lw = 256;
  const lh = 1024;
  const lanCanvas = document.createElement('canvas');
  lanCanvas.width = lw;
  lanCanvas.height = lh;
  const lCtx = lanCanvas.getContext('2d')!;

  const lanBumpCanvas = document.createElement('canvas');
  lanBumpCanvas.width = lw;
  lanBumpCanvas.height = lh;
  const lbCtx = lanBumpCanvas.getContext('2d')!;

  // Deep obsidian-navy twill ribbon
  lCtx.fillStyle = '#0A0E17';
  lCtx.fillRect(0, 0, lw, lh);
  lbCtx.fillStyle = '#787878';
  lbCtx.fillRect(0, 0, lw, lh);

  // Fine woven herringbone ribs
  for (let y = 0; y < lh; y += 4) {
    lCtx.fillStyle = y % 8 === 0 ? 'rgba(186, 230, 253, 0.038)' : 'rgba(0,0,0,0.26)';
    lCtx.fillRect(0, y, lw, 2);

    lbCtx.fillStyle = y % 8 === 0 ? '#A6A6A6' : '#525252';
    lbCtx.fillRect(0, y, lw, 2);
  }
  for (let x = 0; x < lw; x += 6) {
    lCtx.fillStyle = x % 12 === 0 ? 'rgba(186, 230, 253, 0.022)' : 'rgba(0,0,0,0.10)';
    lCtx.fillRect(x, 0, 2, lh);
  }

  // Celestial cyan woven edge piping threads
  lCtx.fillStyle = 'rgba(56, 189, 248, 0.56)';
  lCtx.fillRect(10, 0, 5, lh);
  lCtx.fillRect(lw - 15, 0, 5, lh);

  // Tone-on-tone jacquard studio weave text along ribbon center
  lCtx.save();
  lCtx.translate(lw / 2, lh / 2);
  lCtx.rotate(-Math.PI / 2);
  lCtx.fillStyle = 'rgba(103, 232, 249, 0.18)';
  lCtx.font = '600 22px "Space Grotesk", sans-serif';
  lCtx.textAlign = 'center';
  lCtx.textBaseline = 'middle';
  lCtx.fillText('GARV SHAW   ◆   IDENTITY   ◆   GARV SHAW   ◆   IDENTITY', 0, 0);
  lCtx.restore();

  const configureTex = (
    canvas: HTMLCanvasElement,
    isColor: boolean,
    repeat = false
  ): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (repeat) {
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
    tex.needsUpdate = true;
    return tex;
  };

  const frontMap = configureTex(frontCanvas, true);
  const frontRoughnessMap = configureTex(roughCanvas, false);
  const frontMetalnessMap = configureTex(metalCanvas, false);
  const frontBumpMap = configureTex(bumpCanvas, false);
  const backMap = configureTex(backCanvas, true);
  const backRoughnessMap = configureTex(backRoughCanvas, false);
  const lanyardMap = configureTex(lanCanvas, true, true);
  const lanyardBumpMap = configureTex(lanBumpCanvas, false, true);

  return {
    frontMap,
    frontRoughnessMap,
    frontMetalnessMap,
    frontBumpMap,
    backMap,
    backRoughnessMap,
    lanyardMap,
    lanyardBumpMap,
    dispose: () => {
      frontMap.dispose();
      frontRoughnessMap.dispose();
      frontMetalnessMap.dispose();
      frontBumpMap.dispose();
      backMap.dispose();
      backRoughnessMap.dispose();
      lanyardMap.dispose();
      lanyardBumpMap.dispose();
    },
  };
}

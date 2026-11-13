/**
 * Renders a high-detail 3D-shaded aerospace rocket in the exact 34x46 coordinate space
 * of rocketBlueprint.ts (nose-tip anchored at (0, 0)), so it aligns pixel-for-pixel
 * when dissolving/converting into the particle rocket cursor.
 */
export function drawRealRocket(
  ctx: CanvasRenderingContext2D,
  scale: number,
  thrust: number,
  alpha: number,
  elapsed: number
): void {
  if (alpha <= 0.005 || scale <= 0.01) return;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Multi-layer supersonic exhaust plume with Mach shock diamonds (behind nozzle)
  const flameLen = (14.5 + thrust * 9.5) * (0.92 + 0.1 * Math.sin(elapsed * 34));
  const nozzleBottomY = 27.4;

  // Outer warm plasma envelope
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * Math.min(1, 0.55 + thrust * 0.35);
  const outerPlumeGrad = ctx.createLinearGradient(0, nozzleBottomY - 1, 0, nozzleBottomY + flameLen);
  outerPlumeGrad.addColorStop(0, 'rgba(255, 243, 196, 0.98)');
  outerPlumeGrad.addColorStop(0.22, 'rgba(251, 146, 60, 0.85)');
  outerPlumeGrad.addColorStop(0.62, 'rgba(234, 88, 12, 0.35)');
  outerPlumeGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

  ctx.fillStyle = outerPlumeGrad;
  ctx.beginPath();
  ctx.moveTo(-3.4, nozzleBottomY);
  ctx.quadraticCurveTo(-4.0, nozzleBottomY + flameLen * 0.32, 0, nozzleBottomY + flameLen);
  ctx.quadraticCurveTo(4.0, nozzleBottomY + flameLen * 0.32, 3.4, nozzleBottomY);
  ctx.closePath();
  ctx.fill();

  // Inner cyan-white ionized core jet
  const innerLen = flameLen * 0.66;
  const innerPlumeGrad = ctx.createLinearGradient(0, nozzleBottomY - 1, 0, nozzleBottomY + innerLen);
  innerPlumeGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  innerPlumeGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.92)');
  innerPlumeGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.4)');
  innerPlumeGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

  ctx.fillStyle = innerPlumeGrad;
  ctx.beginPath();
  ctx.moveTo(-1.85, nozzleBottomY);
  ctx.quadraticCurveTo(-2.1, nozzleBottomY + innerLen * 0.3, 0, nozzleBottomY + innerLen);
  ctx.quadraticCurveTo(2.1, nozzleBottomY + innerLen * 0.3, 1.85, nozzleBottomY);
  ctx.closePath();
  ctx.fill();

  // Supersonic Mach shock diamonds
  const diamondCount = 3;
  for (let d = 0; d < diamondCount; d++) {
    const frac = (d + 0.55) / (diamondCount + 0.5);
    const dy = nozzleBottomY + innerLen * frac;
    const dw = (1.35 - d * 0.3) * (0.9 + 0.12 * Math.sin(elapsed * 42 + d * 1.7));
    const dh = 2.0 - d * 0.35;
    ctx.globalAlpha = alpha * (0.72 - d * 0.16);
    ctx.fillStyle = 'rgba(240, 249, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(0, dy - dh);
    ctx.lineTo(dw, dy);
    ctx.lineTo(0, dy + dh);
    ctx.lineTo(-dw, dy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.globalAlpha = alpha;

  // 2. Swept delta stabilizer wings (left lit, right shadowed, matching blueprint vertices)
  // Left Wing
  const leftWingGrad = ctx.createLinearGradient(-11.8, 16.8, -5.0, 24.8);
  leftWingGrad.addColorStop(0, '#7dd3fc');
  leftWingGrad.addColorStop(0.28, '#cbd5e1');
  leftWingGrad.addColorStop(1, '#475569');
  ctx.fillStyle = leftWingGrad;
  ctx.beginPath();
  ctx.moveTo(-5.0, 16.8);
  ctx.lineTo(-11.8, 24.8);
  ctx.lineTo(-5.2, 23.6);
  ctx.closePath();
  ctx.fill();

  // Left wing leading-edge bevel highlight
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-5.0, 16.8);
  ctx.lineTo(-11.8, 24.8);
  ctx.stroke();

  // Right Wing
  const rightWingGrad = ctx.createLinearGradient(5.0, 16.8, 11.8, 24.8);
  rightWingGrad.addColorStop(0, '#334155');
  rightWingGrad.addColorStop(0.65, '#1e293b');
  rightWingGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = rightWingGrad;
  ctx.beginPath();
  ctx.moveTo(5.0, 16.8);
  ctx.lineTo(11.8, 24.8);
  ctx.lineTo(5.2, 23.6);
  ctx.closePath();
  ctx.fill();

  // Right wing trailing rim glint
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(5.0, 16.8);
  ctx.lineTo(11.8, 24.8);
  ctx.stroke();

  // Wingtip aerospace trim accents
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(-11.4, 24.35, 0.48, 0, Math.PI * 2);
  ctx.arc(11.4, 24.35, 0.48, 0, Math.PI * 2);
  ctx.fill();

  // 3. De Laval Engine Bell Thruster Nozzle (y = 25.2 .. 27.6)
  const nozzleGrad = ctx.createLinearGradient(-4.3, 26.4, 4.3, 26.4);
  nozzleGrad.addColorStop(0, '#334155');
  nozzleGrad.addColorStop(0.32, '#94a3b8');
  nozzleGrad.addColorStop(0.65, '#334155');
  nozzleGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = nozzleGrad;
  ctx.beginPath();
  ctx.moveTo(-3.6, 25.3);
  ctx.lineTo(3.6, 25.3);
  ctx.lineTo(4.35, 27.55);
  ctx.lineTo(-4.35, 27.55);
  ctx.closePath();
  ctx.fill();

  // Hot plasma rim inside nozzle throat
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-3.6, 27.2, 7.2, 0.4);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-3.8, 26.4);
  ctx.lineTo(3.8, 26.4);
  ctx.stroke();

  // 4. Main Cylindrical Aerospace Fuselage Hull (matching exact 0..25.6 ogive curve)
  const buildHullPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Right profile (y = 0 -> 25.6)
    for (let i = 1; i <= 20; i++) {
      const y = (i / 20) * 19.2;
      const hw = 5.4 * Math.pow(y / 19.2, 0.72);
      ctx.lineTo(hw, y);
    }
    ctx.lineTo(4.1, 25.6);
    // Flat aft bulkhead
    ctx.lineTo(-4.1, 25.6);
    // Left profile (y = 19.2 -> 0)
    for (let i = 20; i >= 1; i--) {
      const y = (i / 20) * 19.2;
      const hw = 5.4 * Math.pow(y / 19.2, 0.72);
      ctx.lineTo(-hw, y);
    }
    ctx.closePath();
  };

  buildHullPath();
  const hullGrad = ctx.createLinearGradient(-5.5, 13, 5.5, 13);
  hullGrad.addColorStop(0, '#94a3b8');
  hullGrad.addColorStop(0.24, '#f8fafc');
  hullGrad.addColorStop(0.45, '#e2e8f0');
  hullGrad.addColorStop(0.72, '#475569');
  hullGrad.addColorStop(0.92, '#1e293b');
  hullGrad.addColorStop(1, '#334155');
  ctx.fillStyle = hullGrad;
  ctx.fill();

  // Clip interior aerospace detailing cleanly to fuselage hull
  ctx.save();
  buildHullPath();
  ctx.clip();

  // Thermal / titanium nose cone fairing (y = 0 .. 7.8)
  const noseGrad = ctx.createLinearGradient(-4.0, 4.0, 4.0, 4.0);
  noseGrad.addColorStop(0, '#0284c7');
  noseGrad.addColorStop(0.28, '#e0f2fe');
  noseGrad.addColorStop(0.55, '#38bdf8');
  noseGrad.addColorStop(0.85, '#0369a1');
  noseGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = noseGrad;
  ctx.fillRect(-6, 0, 12, 7.8);

  // Machined stage separation rings & metallic seams
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.52)';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-6, 7.8);
  ctx.lineTo(6, 7.8);
  ctx.moveTo(-6, 19.2);
  ctx.lineTo(6, 19.2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(-6, 8.2);
  ctx.lineTo(6, 8.2);
  ctx.stroke();

  // Subtle vertical dorsal fin spine on lower fuselage
  const finGrad = ctx.createLinearGradient(-0.7, 21.8, 0.7, 21.8);
  finGrad.addColorStop(0, '#e0f2fe');
  finGrad.addColorStop(0.5, '#38bdf8');
  finGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = finGrad;
  ctx.beginPath();
  ctx.moveTo(0, 18.2);
  ctx.lineTo(0.7, 25.6);
  ctx.lineTo(-0.7, 25.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Crisp subtle hull rim highlight
  buildHullPath();
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.lineWidth = 0.28;
  ctx.stroke();

  // 5. Recessed Sapphire-Glass Cockpit Canopy (y = 9.6 .. 17.2)
  const buildCanopyPath = (inset = 0) => {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const y = 9.6 + inset + t * (7.6 - inset * 2);
      const w = Math.max(0, 2.05 * Math.sin(Math.pow(t, 0.75) * Math.PI) - inset * 0.7);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(w, y);
    }
    for (let i = 14; i >= 0; i--) {
      const t = i / 14;
      const y = 9.6 + inset + t * (7.6 - inset * 2);
      const w = Math.max(0, 2.05 * Math.sin(Math.pow(t, 0.75) * Math.PI) - inset * 0.7);
      ctx.lineTo(-w, y);
    }
    ctx.closePath();
  };

  // Machined bezel
  buildCanopyPath(0);
  ctx.fillStyle = '#334155';
  ctx.fill();

  // Deep tinted space glass core
  buildCanopyPath(0.32);
  const glassGrad = ctx.createLinearGradient(-1.6, 10, 1.6, 17);
  glassGrad.addColorStop(0, '#0284c7');
  glassGrad.addColorStop(0.38, '#082f49');
  glassGrad.addColorStop(1, '#020617');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Crisp curved glass specular reflection
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
  ctx.lineWidth = 0.42;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.45, 10.9);
  ctx.quadraticCurveTo(-1.2, 12.1, -0.9, 13.7);
  ctx.stroke();

  ctx.restore();
}

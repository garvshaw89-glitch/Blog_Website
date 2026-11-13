/**
 * Renders a large, high-detail 3D-shaded aerospace launch rocket in the canonical
 * 34x46 coordinate frame (nose-tip anchored at (0, 0)), so scaling cleanly from
 * hero launch size (~220-300px) down to 1.0x aligns seamlessly with rocketBlueprint.ts.
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

  const nozzleBottomY = 27.6;
  const flicker = 0.92 + 0.1 * Math.sin(elapsed * 38);
  const flameLen = (11.5 + thrust * 9.0) * flicker;

  // 1. Crisp Supersonic Propulsion Plume (tight Mach inner cone + warm secondary flame)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // Warm orange-amber secondary flame cone (crisp, zero blurry halo blotch)
  ctx.globalAlpha = alpha * Math.min(0.95, 0.65 + thrust * 0.28);
  const outerPlumeGrad = ctx.createLinearGradient(0, nozzleBottomY - 0.5, 0, nozzleBottomY + flameLen);
  outerPlumeGrad.addColorStop(0, 'rgba(255, 251, 235, 1)');
  outerPlumeGrad.addColorStop(0.24, 'rgba(251, 146, 60, 0.96)');
  outerPlumeGrad.addColorStop(0.6, 'rgba(234, 88, 12, 0.72)');
  outerPlumeGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

  const plumeW = 2.95 + thrust * 0.4;
  ctx.fillStyle = outerPlumeGrad;
  ctx.beginPath();
  ctx.moveTo(-2.85, nozzleBottomY);
  ctx.quadraticCurveTo(-plumeW * 0.95, nozzleBottomY + flameLen * 0.28, 0, nozzleBottomY + flameLen);
  ctx.quadraticCurveTo(plumeW * 0.95, nozzleBottomY + flameLen * 0.28, 2.85, nozzleBottomY);
  ctx.closePath();
  ctx.fill();

  // Crisp incandescent blue-white central Mach core
  const innerLen = flameLen * 0.58;
  const innerPlumeGrad = ctx.createLinearGradient(0, nozzleBottomY - 0.4, 0, nozzleBottomY + innerLen);
  innerPlumeGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  innerPlumeGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.95)');
  innerPlumeGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.35)');
  innerPlumeGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

  ctx.fillStyle = innerPlumeGrad;
  ctx.beginPath();
  ctx.moveTo(-1.55, nozzleBottomY);
  ctx.quadraticCurveTo(-1.7, nozzleBottomY + innerLen * 0.26, 0, nozzleBottomY + innerLen);
  ctx.quadraticCurveTo(1.7, nozzleBottomY + innerLen * 0.26, 1.55, nozzleBottomY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = alpha;

  // 2. Sculpted Swept Aerospace Delta Wings (left & right with beveled 3D lighting)
  // Left wing (lit metallic top-face + crimson/amber aerospace trim)
  const leftWingGrad = ctx.createLinearGradient(-12.0, 17.0, -4.8, 24.8);
  leftWingGrad.addColorStop(0, '#f1f5f9');
  leftWingGrad.addColorStop(0.32, '#94a3b8');
  leftWingGrad.addColorStop(0.75, '#475569');
  leftWingGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = leftWingGrad;
  ctx.beginPath();
  ctx.moveTo(-4.9, 16.5);
  ctx.lineTo(-12.1, 24.9);
  ctx.lineTo(-5.0, 23.8);
  ctx.closePath();
  ctx.fill();

  // Left wing root fairing shadow & specular leading edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 0.36;
  ctx.beginPath();
  ctx.moveTo(-4.9, 16.5);
  ctx.lineTo(-12.1, 24.9);
  ctx.stroke();

  // Right wing (deep gunmetal shadow + subtle sky-blue ambient bounce)
  const rightWingGrad = ctx.createLinearGradient(4.8, 17.0, 12.0, 24.8);
  rightWingGrad.addColorStop(0, '#334155');
  rightWingGrad.addColorStop(0.55, '#1e293b');
  rightWingGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = rightWingGrad;
  ctx.beginPath();
  ctx.moveTo(4.9, 16.5);
  ctx.lineTo(12.1, 24.9);
  ctx.lineTo(5.0, 23.8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
  ctx.lineWidth = 0.32;
  ctx.beginPath();
  ctx.moveTo(4.9, 16.5);
  ctx.lineTo(12.1, 24.9);
  ctx.stroke();

  // Wingtip thruster / navigation pods
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-12.1, 23.9, 0.85, 1.35);
  ctx.fillRect(11.25, 23.9, 0.85, 1.35);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(-11.65, 24.0, 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(11.65, 24.0, 0.38, 0, Math.PI * 2);
  ctx.fill();

  // 3. De Laval Rocket Engine Bell Nozzle & Cooling Manifold (y = 25.2 .. 27.8)
  const nozzleGrad = ctx.createLinearGradient(-4.5, 26.5, 4.5, 26.5);
  nozzleGrad.addColorStop(0, '#1e293b');
  nozzleGrad.addColorStop(0.28, '#94a3b8');
  nozzleGrad.addColorStop(0.55, '#475569');
  nozzleGrad.addColorStop(0.85, '#0f172a');
  nozzleGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = nozzleGrad;
  ctx.beginPath();
  ctx.moveTo(-3.6, 25.2);
  ctx.lineTo(3.6, 25.2);
  ctx.lineTo(4.5, 27.65);
  ctx.lineTo(-4.5, 27.65);
  ctx.closePath();
  ctx.fill();

  // Engine nozzle cooling ribs
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(-3.8, 25.9);
  ctx.lineTo(3.8, 25.9);
  ctx.moveTo(-4.15, 26.75);
  ctx.lineTo(4.15, 26.75);
  ctx.stroke();

  // Glowing hot chamber rim
  ctx.fillStyle = 'rgba(254, 243, 199, 0.92)';
  ctx.fillRect(-3.8, 27.35, 7.6, 0.32);

  // 4. Main Cylindrical Spacecraft Hull (0 .. 25.6 ogive curve matching blueprint)
  const buildHullPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= 24; i++) {
      const y = (i / 24) * 19.2;
      const hw = 5.45 * Math.pow(y / 19.2, 0.72);
      ctx.lineTo(hw, y);
    }
    ctx.lineTo(4.15, 25.6);
    ctx.lineTo(-4.15, 25.6);
    for (let i = 24; i >= 1; i--) {
      const y = (i / 24) * 19.2;
      const hw = 5.45 * Math.pow(y / 19.2, 0.72);
      ctx.lineTo(-hw, y);
    }
    ctx.closePath();
  };

  buildHullPath();
  const hullGrad = ctx.createLinearGradient(-5.5, 13, 5.5, 13);
  hullGrad.addColorStop(0, '#64748b');
  hullGrad.addColorStop(0.18, '#e2e8f0');
  hullGrad.addColorStop(0.32, '#ffffff');
  hullGrad.addColorStop(0.55, '#cbd5e1');
  hullGrad.addColorStop(0.78, '#334155');
  hullGrad.addColorStop(0.94, '#0f172a');
  hullGrad.addColorStop(1, '#334155');
  ctx.fillStyle = hullGrad;
  ctx.fill();

  // Clip realistic hull panel architecture inside fuselage
  ctx.save();
  buildHullPath();
  ctx.clip();

  // Thermal Nose Fairing (metallic graphite / ceramic tip + cobalt-titanium collar)
  const noseGrad = ctx.createLinearGradient(-4.2, 3.8, 4.2, 3.8);
  noseGrad.addColorStop(0, '#1e293b');
  noseGrad.addColorStop(0.28, '#94a3b8');
  noseGrad.addColorStop(0.45, '#e2e8f0');
  noseGrad.addColorStop(0.75, '#0f172a');
  noseGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = noseGrad;
  ctx.fillRect(-6, 0, 12, 7.6);

  // Crimson-amber aerospace orbital mission stripe under fairing
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-6, 6.8, 12, 0.95);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-6, 7.75, 12, 0.45);

  // Titanium interstage carbon ring & service seam lines
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-6, 18.85, 12, 0.95);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-6, 24.45, 12, 1.15);

  // Subtle vertical cylindrical panel stringers
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(-2.4, 8.2);
  ctx.lineTo(-2.4, 24.4);
  ctx.moveTo(2.1, 8.2);
  ctx.lineTo(2.1, 24.4);
  ctx.stroke();

  // Highlight along illuminated panel edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(-2.15, 8.2);
  ctx.lineTo(-2.15, 24.4);
  ctx.stroke();

  // Raised 3D Dorsal Center Stabilizer Fin (gives strong cylindrical depth during banking)
  const dorsalGrad = ctx.createLinearGradient(-0.65, 21.5, 0.65, 21.5);
  dorsalGrad.addColorStop(0, '#f8fafc');
  dorsalGrad.addColorStop(0.45, '#94a3b8');
  dorsalGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = dorsalGrad;
  ctx.beginPath();
  ctx.moveTo(0, 18.0);
  ctx.lineTo(0.75, 25.6);
  ctx.lineTo(-0.75, 25.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Sharp metallic hull silhouette outline
  buildHullPath();
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
  ctx.lineWidth = 0.24;
  ctx.stroke();

  // 5. Recessed Machined Sapphire Cockpit Viewport (y = 9.6 .. 17.2)
  const buildCanopyPath = (inset = 0) => {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const y = 9.6 + inset + t * (7.6 - inset * 2);
      const w = Math.max(0, 2.1 * Math.sin(Math.pow(t, 0.75) * Math.PI) - inset * 0.72);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(w, y);
    }
    for (let i = 16; i >= 0; i--) {
      const t = i / 16;
      const y = 9.6 + inset + t * (7.6 - inset * 2);
      const w = Math.max(0, 2.1 * Math.sin(Math.pow(t, 0.75) * Math.PI) - inset * 0.72);
      ctx.lineTo(-w, y);
    }
    ctx.closePath();
  };

  // Titanium bezel ring
  buildCanopyPath(0);
  const bezelGrad = ctx.createLinearGradient(-2.1, 10, 2.1, 17);
  bezelGrad.addColorStop(0, '#cbd5e1');
  bezelGrad.addColorStop(0.5, '#475569');
  bezelGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bezelGrad;
  ctx.fill();

  // Deep armored space glass
  buildCanopyPath(0.32);
  const glassGrad = ctx.createLinearGradient(-1.5, 10, 1.5, 16.8);
  glassGrad.addColorStop(0, '#0ea5e9');
  glassGrad.addColorStop(0.35, '#082f49');
  glassGrad.addColorStop(1, '#020617');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Curved glass specular highlight streak
  ctx.strokeStyle = 'rgba(240, 249, 255, 0.92)';
  ctx.lineWidth = 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.4, 10.8);
  ctx.quadraticCurveTo(-1.2, 12.1, -0.85, 13.8);
  ctx.stroke();

  ctx.restore();
}

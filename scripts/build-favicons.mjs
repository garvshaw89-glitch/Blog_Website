import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <defs>
    <!-- Background: Deep Cosmic Obsidian with subtle gradient -->
    <linearGradient id="bgGrad" x1="64" y1="0" x2="64" y2="128" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0C101C" />
      <stop offset="45%" stop-color="#05070C" />
      <stop offset="100%" stop-color="#020306" />
    </linearGradient>

    <!-- Frosted Glass Rim with Prismatic Cyan & Indigo Highlight -->
    <linearGradient id="rimGrad" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.85" />
      <stop offset="25%" stop-color="#00F2FE" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#818CF8" stop-opacity="0.3" />
      <stop offset="80%" stop-color="#1E293B" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#0284C7" stop-opacity="0.25" />
    </linearGradient>

    <!-- Ambient Core Light Field -->
    <radialGradient id="coreAmbient" cx="64" cy="64" r="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.35" />
      <stop offset="40%" stop-color="#3B82F6" stop-opacity="0.16" />
      <stop offset="75%" stop-color="#4F46E5" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Letter G Gradient (Luminous Electric Cyan to Deep Cobalt) -->
    <linearGradient id="gGrad" x1="22" y1="30" x2="76" y2="98" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="40%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>

    <!-- Letter S Gradient (Diamond White to Electric Azure/Indigo) -->
    <linearGradient id="sGrad" x1="104" y1="28" x2="44" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#BAE6FD" />
      <stop offset="65%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#00F2FE" />
    </linearGradient>

    <!-- Subtle Drop Shadow Filter for Vector Depth -->
    <filter id="vectorGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="1.8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Knockout Mask for Dimensional Letterform Weaving -->
    <mask id="weaveMask">
      <rect width="128" height="128" fill="white" />
      <path d="M100 40 L90 32 H76 L68 40 V50 L84 62 L100 74 V86 L90 96 H72 L62 88" 
            stroke="black" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    </mask>
  </defs>

  <!-- Squircle Base Frame -->
  <rect x="3" y="3" width="122" height="122" rx="32" fill="url(#bgGrad)" stroke="url(#rimGrad)" stroke-width="2.4" />
  <circle cx="64" cy="64" r="48" fill="url(#coreAmbient)" />

  <!-- Monogram Glyph with Dimensional Weave -->
  <g filter="url(#vectorGlow)">
    <!-- Letter G (Architectural Aerospace Chamfer) -->
    <path d="M60 32 H42 L26 48 V80 L42 96 H62 L74 84 V66 H48" 
          stroke="url(#gGrad)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" 
          mask="url(#weaveMask)" />

    <!-- Letter S (Forward Kinetic Chamfer) -->
    <path d="M100 40 L90 32 H76 L68 40 V50 L84 62 L100 74 V86 L90 96 H72 L62 88" 
          stroke="url(#sGrad)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- Central Convergence Node: Diamond AI Spark & Core -->
  <polygon points="64,59 69,64 64,69 59,64" fill="#FFFFFF" />
  <circle cx="64" cy="64" r="1.8" fill="#38BDF8" />
</svg>`;

async function build() {
  const publicDir = path.resolve('public');

  // 1. Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), SVG_CONTENT.trim());
  console.log('Created /public/favicon.svg');

  const svgBuffer = Buffer.from(SVG_CONTENT);

  // 2. Generate standard favicon.png (64x64)
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created /public/favicon.png');

  // 3. Generate 32x32 favicon
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created /public/favicon-32x32.png');

  // 4. Generate 16x16 favicon
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created /public/favicon-16x16.png');

  // 5. Generate apple-touch-icon.png (180x180)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created /public/apple-touch-icon.png');

  // 6. Generate android-chrome-192x192.png
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('Created /public/android-chrome-192x192.png');

  // 7. Generate android-chrome-512x512.png
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('Created /public/android-chrome-512x512.png');

  // 8. Generate site.webmanifest
  const manifest = {
    name: "Garv Shaw - AI & Cloud Developer",
    short_name: "Garv Shaw",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#05070A",
    background_color: "#05070A",
    display: "standalone"
  };

  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('Created /public/site.webmanifest');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

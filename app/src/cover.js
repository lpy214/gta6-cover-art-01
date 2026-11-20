// Neon Coast Cover Studio — cover rendering engine.
// Draws GTA-poster-style multi-panel cover art on a 2D canvas: panels,
// sunset/neon gradient-map colour grades, bold condensed lettering and
// poster effects. Every picture here is drawn by this file; no artwork,
// logo or font from any game is used anywhere in the app.

export const SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

// A grade is a gradient map: each pixel's brightness is re-coloured along
// these stops, then blended back with some of the original photo so faces
// stay recognisable. Stops are [position 0..1, r, g, b].
export const GRADES = [
  {
    id: 'vice-sunset', name: 'Vice Sunset', accent: '#ff5e8a',
    stops: [[0, 26, 8, 46], [0.3, 96, 24, 88], [0.55, 214, 72, 96],
            [0.78, 255, 158, 84], [1, 255, 236, 180]],
  },
  {
    id: 'neon-nights', name: 'Neon Nights', accent: '#37e6ff',
    stops: [[0, 8, 8, 34], [0.3, 52, 20, 110], [0.55, 176, 44, 150],
            [0.78, 255, 96, 170], [1, 190, 250, 255]],
  },
  {
    id: 'palm-gold', name: 'Palm Gold', accent: '#ffb347',
    stops: [[0, 30, 20, 8], [0.3, 96, 58, 22], [0.55, 198, 118, 40],
            [0.78, 250, 188, 92], [1, 255, 244, 200]],
  },
  {
    id: 'ocean-drive', name: 'Ocean Drive', accent: '#4de3c2',
    stops: [[0, 6, 26, 40], [0.3, 16, 84, 110], [0.55, 40, 158, 158],
            [0.78, 120, 224, 200], [1, 235, 255, 240]],
  },
  {
    id: 'after-dark', name: 'After Dark', accent: '#e8e8f0',
    stops: [[0, 4, 4, 8], [0.3, 40, 40, 52], [0.55, 110, 110, 128],
            [0.78, 190, 190, 205], [1, 250, 250, 255]],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// ---------------------------------------------------------------- layouts
// Every layout returns panel rects {x, y, w, h, rot} in cover pixels and
// tells the title where to sit: 'band' (a dark band across the bottom) or
// 'top' (title floating at the top-left, used by the snapshot collage).

function gutter(w) {
  return Math.max(6, Math.round(w * 0.012));
}

function viceGridPanels(w, h) {
  const g = gutter(w);
  const bandH = Math.round(h * 0.24);
  const areaH = h - bandH;
  const heroW = Math.round(w * 0.6);
  const colX = heroW + g;
  const colW = w - colX - g;
  const cellH = Math.round((areaH - g * 4) / 3);
  const panels = [{ x: g, y: g, w: heroW - g, h: areaH - g * 2, rot: 0 }];
  for (let i = 0; i < 3; i++) {
    panels.push({ x: colX, y: g + i * (cellH + g), w: colW, h: cellH, rot: 0 });
  }
  return { panels, title: 'band', bandH };
}

function ninePanelPanels(w, h) {
  const g = gutter(w);
  const cw = (w - g * 4) / 3;
  const ch = (h - g * 4) / 3;
  const panels = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
    }
  }
  return { panels, title: 'band', bandH: Math.round(h * 0.24) };
}

function fullBleedPanels(w, h) {
  return { panels: [{ x: 0, y: 0, w, h, rot: 0 }], title: 'band', bandH: Math.round(h * 0.26) };
}

function duoSplitPanels(w, h) {
  const g = gutter(w);
  const half = (w - g * 3) / 2;
  return {
    panels: [
      { x: g, y: g, w: half, h: h - g * 2, rot: 0 },
      { x: g * 2 + half, y: g, w: half, h: h - g * 2, rot: 0 },
    ],
    title: 'band',
    bandH: Math.round(h * 0.24),
  };
}

function snapshotPanels(w, h) {
  // Three tilted polaroid-style prints over a drawn sunset backdrop.
  const pw = w * 0.42;
  const ph = h * 0.46;
  return {
    panels: [
      { x: w * 0.06, y: h * 0.16, w: pw, h: ph, rot: -0.1, polaroid: true },
      { x: w * 0.5, y: h * 0.1, w: pw, h: ph, rot: 0.07, polaroid: true },
      { x: w * 0.27, y: h * 0.5, w: pw, h: ph * 0.94, rot: -0.02, polaroid: true },
    ],
    title: 'top',
    bandH: 0,
  };
}

export const LAYOUTS = [
  { id: 'vice-grid', name: 'Vice Grid', panels: viceGridPanels, slots: 4 },
  { id: 'nine-panel', name: 'Nine Panel', panels: ninePanelPanels, slots: 9 },
  { id: 'full-bleed', name: 'Full Bleed', panels: fullBleedPanels, slots: 1 },
  { id: 'snapshots', name: 'Snapshots', panels: snapshotPanels, slots: 3 },
  { id: 'duo-split', name: 'Duo Split', panels: duoSplitPanels, slots: 2 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel slots: the editor keeps one photo slot per panel position, so
// switching layouts never loses a photo already placed.
export function blankPanel() {
  return { img: null, name: '', zoom: 1, ox: 0, oy: 0, rot: 0 };
}

export function defaultState() {
  return {
    layout: 'vice-grid',
    grade: 'vice-sunset',
    size: '1080x1080',
    title: 'NEON COAST',
    subtitle: 'where the sun never sets',
    badge: 'EST. 2026',
    effects: { grain: true, vignette: true, halftone: false, rays: true },
    panels: Array.from({ length: 9 }, blankPanel),
    selected: 0,
  };
}

// ------------------------------------------------------------ grade mapping
function applyGradientMap(imageData, stops) {
  const px = imageData.data;
  const seg = [];
  for (let i = 0; i < stops.length - 1; i++) seg.push([stops[i], stops[i + 1]]);
  for (let p = 0; p < px.length; p += 4) {
    const lum = (0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2]) / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (const [s0, s1] of seg) {
      if (lum >= s0[0] && lum <= s1[0]) { a = s0; b = s1; break; }
    }
    const span = b[0] - a[0] || 1;
    const k = Math.min(1, Math.max(0, (lum - a[0]) / span));
    const mr = a[1] + (b[1] - a[1]) * k;
    const mg = a[2] + (b[2] - a[2]) * k;
    const mb = a[3] + (b[3] - a[3]) * k;
    // 68% grade, 32% original photo: the grade is the look, the photo
    // still reads as the photo.
    px[p] = mr * 0.68 + px[p] * 0.32;
    px[p + 1] = mg * 0.68 + px[p + 1] * 0.32;
    px[p + 2] = mb * 0.68 + px[p + 2] * 0.32;
  }
  return imageData;
}

// Draw one photo into a panel rect: cover-fit, zoom, pan and rotate,
// then the layout's colour grade. A missing photo becomes a drawn
// placeholder so an empty panel still shows the layout.
function drawPhotoPanel(ctx, panel, slot, grade, scale) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  if (!slot || !slot.img) {
    drawEmptyPanel(ctx, panel);
    ctx.restore();
    return;
  }
  const img = slot.img;
  const pw = Math.min(panel.w, 1100);
  const ph = Math.max(1, Math.round(pw * (panel.h / panel.w)));
  const off = document.createElement('canvas');
  off.width = pw;
  off.height = ph;
  const octx = off.getContext('2d');
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (slot.zoom || 1);
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  octx.save();
  octx.translate(pw / 2 + (slot.ox || 0) * pw, ph / 2 + (slot.oy || 0) * ph);
  octx.rotate((slot.rot || 0) * Math.PI / 180);
  octx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  octx.restore();
  const data = octx.getImageData(0, 0, pw, ph);
  octx.putImageData(applyGradientMap(data, grade.stops), 0, 0);
  // A warm top light keeps the grade from going flat.
  const shine = octx.createLinearGradient(0, 0, 0, ph);
  shine.addColorStop(0, 'rgba(255,180,120,0.10)');
  shine.addColorStop(0.6, 'rgba(255,180,120,0)');
  octx.fillStyle = shine;
  octx.fillRect(0, 0, pw, ph);
  ctx.drawImage(off, panel.x, panel.y, panel.w, panel.h);
  ctx.restore();
}

function drawEmptyPanel(ctx, panel) {
  const g = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
  g.addColorStop(0, '#3a1c5e');
  g.addColorStop(0.55, '#8a2a6d');
  g.addColorStop(1, '#e2607a');
  ctx.fillStyle = g;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, panel.w * 0.01);
  const cx = panel.x + panel.w / 2;
  const cy = panel.y + panel.h / 2;
  const r = Math.min(panel.w, panel.h) * 0.14;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.35, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.7);
  ctx.arc(cx, cy + r * 0.7, r, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 ${Math.max(13, Math.round(panel.w * 0.035))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Drop a photo here', cx, cy + r * 1.25);
}

// ------------------------------------------------------- sunset backdrop
// The backdrop behind the Snapshots collage: a drawn Vice City-style
// sunset — gradient sky, low sun, skyline and palm silhouettes.
function drawSunsetBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b0b3d');
  sky.addColorStop(0.35, '#7a2368');
  sky.addColorStop(0.65, '#e2607a');
  sky.addColorStop(0.85, '#ff9a56');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Low sun with a soft halo.
  const sx = w * 0.72;
  const sy = h * 0.34;
  const sr = w * 0.11;
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.2);
  halo.addColorStop(0, 'rgba(255,220,140,0.55)');
  halo.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  // Distant skyline.
  ctx.fillStyle = 'rgba(38,12,56,0.85)';
  let x = 0;
  while (x < w) {
    const bw = w * (0.05 + Math.random() * 0.06);
    const bh = h * (0.08 + Math.random() * 0.14);
    ctx.fillRect(x, h * 0.62 - bh, bw, bh);
    x += bw + w * 0.012;
  }
  // Palm silhouettes.
  ctx.strokeStyle = 'rgba(24,8,40,0.9)';
  ctx.fillStyle = 'rgba(24,8,40,0.9)';
  for (const px of [w * 0.1, w * 0.92]) {
    const py = h * 0.62;
    ctx.lineWidth = w * 0.008;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + w * 0.02, py - h * 0.12, px + w * 0.015, py - h * 0.2);
    ctx.stroke();
    for (let f = 0; f < 6; f++) {
      const a = -Math.PI * (0.08 + f * 0.16);
      ctx.lineWidth = w * 0.005;
      ctx.beginPath();
      ctx.moveTo(px + w * 0.015, py - h * 0.2);
      ctx.quadraticCurveTo(
        px + w * 0.015 + Math.cos(a) * w * 0.07,
        py - h * 0.2 + Math.sin(a) * h * 0.05,
        px + w * 0.015 + Math.cos(a) * w * 0.12,
        py - h * 0.2 + Math.sin(a) * h * 0.1 + h * 0.03,
      );
      ctx.stroke();
    }
  }
}

// ------------------------------------------------------------ title block
function fitTitleFont(ctx, text, maxW, startPx) {
  let px = startPx;
  ctx.font = `${px}px CoastDisplay, "Arial Narrow", sans-serif`;
  while (px > 24 && ctx.measureText(text).width > maxW) {
    px -= 4;
    ctx.font = `${px}px CoastDisplay, "Arial Narrow", sans-serif`;
  }
  return px;
}

function drawTitleBand(ctx, w, h, bandH, state, grade) {
  const y0 = h - bandH;
  const band = ctx.createLinearGradient(0, y0 - bandH * 0.25, 0, h);
  band.addColorStop(0, 'rgba(12,5,26,0)');
  band.addColorStop(0.35, 'rgba(12,5,26,0.82)');
  band.addColorStop(1, 'rgba(12,5,26,0.94)');
  ctx.fillStyle = band;
  ctx.fillRect(0, y0 - bandH * 0.25, w, bandH * 1.25);
  // Accent rule above the title.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w * 0.055, y0 + bandH * 0.1, w * 0.16, Math.max(3, h * 0.004));
  const pad = w * 0.055;
  const title = (state.title || 'NEON COAST').toUpperCase();
  // Measure the badge first so the title never runs underneath it.
  let badgeW = 0;
  let badgeH = 0;
  if (state.badge) {
    const bpx = Math.max(13, Math.round(bandH * 0.13));
    ctx.font = `700 ${bpx}px CoastDisplay, "Arial Narrow", sans-serif`;
    badgeW = ctx.measureText(state.badge.toUpperCase()).width + bpx * 2.2;
    badgeH = bpx * 2.1;
  }
  const maxW = w - pad * 2 - (badgeW ? badgeW + pad * 0.5 : 0);
  const px = fitTitleFont(ctx, title, maxW, Math.round(bandH * 0.48));
  ctx.save();
  ctx.translate(pad, y0 + bandH * 0.58);
  ctx.rotate(-0.012);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${px}px CoastDisplay, "Arial Narrow", sans-serif`;
  ctx.lineWidth = Math.max(3, px * 0.07);
  ctx.strokeStyle = 'rgba(20,6,40,0.9)';
  ctx.strokeText(title, 0, 0);
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = px * 0.16;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();
  // Neon-script subtitle.
  if (state.subtitle) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const spx = Math.max(18, Math.round(bandH * 0.2));
    ctx.font = `italic 700 ${spx}px CoastScript, Georgia, serif`;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = spx * 0.7;
    ctx.fillStyle = '#fff4f8';
    ctx.fillText(state.subtitle, pad, h - bandH * 0.05);
    ctx.restore();
  }
  // Badge ribbon, bottom-right, clear of the title.
  if (state.badge) {
    ctx.save();
    const bpx = Math.max(13, Math.round(bandH * 0.13));
    ctx.font = `700 ${bpx}px CoastDisplay, "Arial Narrow", sans-serif`;
    const bw = badgeW;
    const bh = badgeH;
    const bx = w - pad - bw;
    const by = y0 + bandH * 0.12;
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(0.03);
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#1b0b3d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge.toUpperCase(), 0, bpx * 0.06);
    ctx.restore();
  }
}

function drawTopTitle(ctx, w, h, state, grade) {
  const pad = w * 0.055;
  const title = (state.title || 'NEON COAST').toUpperCase();
  ctx.save();
  ctx.translate(pad, h * 0.075);
  ctx.rotate(-0.02);
  const px = fitTitleFont(ctx, title, w * 0.6, Math.round(h * 0.085));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${px}px CoastDisplay, "Arial Narrow", sans-serif`;
  ctx.lineWidth = Math.max(3, px * 0.07);
  ctx.strokeStyle = 'rgba(20,6,40,0.9)';
  ctx.strokeText(title, 0, 0);
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = px * 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();
  if (state.subtitle) {
    ctx.save();
    ctx.textAlign = 'left';
    const spx = Math.max(16, Math.round(h * 0.028));
    ctx.font = `italic 700 ${spx}px CoastScript, Georgia, serif`;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = spx * 0.7;
    ctx.fillStyle = '#fff4f8';
    ctx.fillText(state.subtitle, pad, h * 0.075 + px * 0.62);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- effects
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  noiseTile = document.createElement('canvas');
  noiseTile.width = 140;
  noiseTile.height = 140;
  const nctx = noiseTile.getContext('2d');
  const data = nctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseTile;
}

function drawSunRays(ctx, w, h) {
  const sx = w * 0.72;
  const sy = h * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#ffd98a';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, Math.max(w, h), a, a + 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#14061f';
  const step = Math.max(9, Math.round(w / 120));
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const r = step * 0.16 * (0.6 + 0.4 * Math.sin((x + y) / 90));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,24,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

// ------------------------------------------------------------- public API
// Panel rects in cover pixels, for hit-testing clicks in the preview.
export function coverPanelRects(state, w, h) {
  const layout = layoutById(state.layout);
  return layout.panels(w, h).panels;
}

// Draw the whole cover onto any canvas context at any pixel size.
export function renderCover(ctx, w, h, state) {
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const geo = layout.panels(w, h);
  const scale = w / 1080;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14061f';
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'snapshots') drawSunsetBackdrop(ctx, w, h);
  if (state.effects.rays && state.layout !== 'snapshots') drawSunRays(ctx, w, h);
  geo.panels.forEach((panel, i) => {
    const slot = state.panels[i];
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-panel.w / 2, -panel.h / 2);
      panel = { ...panel, x: 0, y: 0, rot: 0 };
    }
    if (panel.polaroid) {
      // White polaroid frame: thin sides, thick base.
      const b = Math.max(8, Math.round(w * 0.014));
      const base = Math.max(22, Math.round(h * 0.05));
      ctx.fillStyle = '#fdfbf6';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = w * 0.02;
      ctx.shadowOffsetY = h * 0.008;
      ctx.fillRect(-b, -b, panel.w + b * 2, panel.h + b + base);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      drawPhotoPanel(ctx, { x: 0, y: 0, w: panel.w, h: panel.h }, slot, grade, scale);
    } else {
      drawPhotoPanel(ctx, panel, slot, grade, scale);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    }
    ctx.restore();
  });
  if (geo.title === 'band') drawTitleBand(ctx, w, h, geo.bandH, state, grade);
  else drawTopTitle(ctx, w, h, state, grade);
  if (state.effects.halftone) drawHalftone(ctx, w, h);
  if (state.effects.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.effects.vignette) drawVignette(ctx, w, h);
}

// Render at the export size and hand back a PNG blob.
export async function exportCoverPng(state) {
  await document.fonts.ready;
  const size = sizeById(state.size);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

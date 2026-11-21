// Vice Coast Cover Studio — the cover renderer.
// Draws GTA-poster-style multi-panel cover art on a 2D canvas: panels filled
// with the user's photos, a Vice City sunset / neon colour grade, bold
// condensed title lettering with a neon script subtitle, grain and vignette.
// Everything here is original work: no Rockstar logo, artwork or font.

export const DISPLAY_FONT = '"Anton", "Arial Narrow", sans-serif';
export const SCRIPT_FONT = '"Pacifico", cursive';

// Colour grades. Each grade is two overlay washes: a top-to-bottom gradient
// drawn in "overlay" mode and a soft tint drawn in "soft-light" mode.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    gradient: ['#ff9a3d', '#ff2e88', '#7b2ff7'],
    tint: '#ff7a1a',
  },
  neon: {
    label: 'Neon Night',
    gradient: ['#00e5ff', '#ff2e88', '#2b0a4a'],
    tint: '#00c2ff',
  },
  gold: {
    label: 'Palm Gold',
    gradient: ['#ffe259', '#ffa751', '#b34700'],
    tint: '#ffc233',
  },
  teal: {
    label: 'Teal Haze',
    gradient: ['#7ef0d4', '#2a9d8f', '#123a5c'],
    tint: '#2ec4b6',
  },
  noir: {
    label: 'Mono Noir',
    gradient: ['#f5f5f5', '#8a8a8a', '#111111'],
    tint: '#666666',
  },
};

// Layouts. Each panel is a rectangle in fractions of the cover, with an
// optional rotation (tilted snapshots) and a z-order.
export const LAYOUTS = {
  grid4: {
    label: 'Four Panels',
    panels: [
      { x: 0.02, y: 0.02, w: 0.47, h: 0.46 },
      { x: 0.51, y: 0.02, w: 0.47, h: 0.46 },
      { x: 0.02, y: 0.50, w: 0.47, h: 0.46 },
      { x: 0.51, y: 0.50, w: 0.47, h: 0.46 },
    ],
    titleBand: 0.30,
  },
  hero3: {
    label: 'Hero + Three',
    panels: [
      { x: 0.02, y: 0.02, w: 0.60, h: 0.94 },
      { x: 0.64, y: 0.02, w: 0.34, h: 0.30 },
      { x: 0.64, y: 0.34, w: 0.34, h: 0.30 },
      { x: 0.64, y: 0.66, w: 0.34, h: 0.30 },
    ],
    titleBand: 0.34,
  },
  fullbleed: {
    label: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    titleBand: 0.38,
  },
  tilted: {
    label: 'Tilted Snaps',
    panels: [
      { x: 0.05, y: 0.06, w: 0.42, h: 0.62, rot: -4 },
      { x: 0.52, y: 0.04, w: 0.42, h: 0.62, rot: 3 },
      { x: 0.28, y: 0.42, w: 0.44, h: 0.50, rot: -1 },
    ],
    titleBand: 0.30,
    backdrop: true,
  },
  nine: {
    label: 'Nine Grid',
    panels: [
      { x: 0.015, y: 0.015, w: 0.315, h: 0.30 },
      { x: 0.342, y: 0.015, w: 0.315, h: 0.30 },
      { x: 0.67, y: 0.015, w: 0.315, h: 0.30 },
      { x: 0.015, y: 0.325, w: 0.315, h: 0.30 },
      { x: 0.342, y: 0.325, w: 0.315, h: 0.30 },
      { x: 0.67, y: 0.325, w: 0.315, h: 0.30 },
      { x: 0.015, y: 0.635, w: 0.315, h: 0.30 },
      { x: 0.342, y: 0.635, w: 0.315, h: 0.30 },
      { x: 0.67, y: 0.635, w: 0.315, h: 0.30 },
    ],
    titleBand: 0.26,
  },
  diagonal: {
    label: 'Diagonal Split',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62, clip: 'top' },
      { x: 0, y: 0.42, w: 1, h: 0.58, clip: 'bottom' },
    ],
    titleBand: 0.32,
  },
};

export const SIZES = {
  square: { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

// Draw one photo into a panel rect with cover-fit, zoom and pan offsets.
// ox/oy are -1..1 fractions of the spare room in each axis.
export function drawPhotoInPanel(ctx, img, rect, zoom, ox, oy) {
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const spareX = Math.max(0, (dw - rect.w) / 2);
  const spareY = Math.max(0, (dh - rect.h) / 2);
  const dx = rect.x + (rect.w - dw) / 2 - ox * spareX;
  const dy = rect.y + (rect.h - dh) / 2 - oy * spareY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Wash a panel with the grade's sunset / neon colours.
export function gradePanel(ctx, rect, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.gradient[0]);
  grad.addColorStop(0.55, grade.gradient[1]);
  grad.addColorStop(1, grade.gradient[2]);
  ctx.globalAlpha = 0.42;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.35;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Thin white frame + drop shadow around a panel, the poster look.
export function framePanel(ctx, rect, rot) {
  ctx.save();
  if (rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.max(8, rect.w * 0.03);
    ctx.shadowOffsetY = Math.max(6, rect.h * 0.015);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -6, rect.w + 12, rect.h + 12);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(3, rect.w * 0.008);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// The sunset backdrop behind the tilted-snapshot layout: gradient sky,
// a low sun and a palm-silhouette skyline drawn from paths.
export function drawSunsetBackdrop(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b0a4a');
  sky.addColorStop(0.45, '#ff2e88');
  sky.addColorStop(0.75, '#ff9a3d');
  sky.addColorStop(1, '#ffd319');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sunR = W * 0.11;
  const sunX = W * 0.78;
  const sunY = H * 0.42;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, 'rgba(255, 240, 160, 0.9)');
  glow.addColorStop(1, 'rgba(255, 240, 160, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // City skyline silhouette along the bottom (deterministic skyline).
  ctx.fillStyle = '#1a0533';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.86);
  let x = 0;
  let seed = 1234567;
  const nextRand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  while (x < W) {
    const bw = W * (0.05 + nextRand() * 0.04);
    const bh = H * (0.05 + nextRand() * 0.10);
    ctx.lineTo(x, H * 0.86 - bh);
    ctx.lineTo(x + bw, H * 0.86 - bh);
    ctx.lineTo(x + bw, H * 0.86);
    x += bw + W * 0.012;
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

// Bold condensed title with a black keyline and a sunset gradient fill.
export function drawTitle(ctx, text, cx, baselineY, size, gradient) {
  ctx.save();
  ctx.font = `${size}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  const grad = ctx.createLinearGradient(0, baselineY - size, 0, baselineY);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffe259');
  grad.addColorStop(1, gradient[1]);
  ctx.strokeStyle = '#12041f';
  ctx.lineWidth = Math.max(4, size * 0.09);
  ctx.strokeText(text, cx, baselineY);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, baselineY);
  ctx.restore();
}

// Neon script subtitle with a glow.
export function drawSubtitle(ctx, text, cx, baselineY, size, color) {
  ctx.save();
  ctx.font = `${size}px ${SCRIPT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, baselineY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, baselineY);
  ctx.restore();
}

// Five-star heat meter.
export function drawStars(ctx, cx, y, size, filled) {
  ctx.save();
  ctx.translate(cx - (size * 5.4) / 2, y);
  for (let i = 0; i < 5; i++) {
    const x = i * size * 1.08 + size / 2;
    drawStar(ctx, x, size / 2, size * 0.5, size * 0.22, i < filled);
    ctx.translate(0, 0);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, outer, inner, filled) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd319' : 'rgba(255,255,255,0.25)';
  ctx.strokeStyle = '#12041f';
  ctx.lineWidth = Math.max(1.5, outer * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Corner badge: a small tilted pill in the top-right corner, never clipped.
export function drawBadge(ctx, text, W, size) {
  ctx.save();
  ctx.translate(W - size * 1.5, size * 0.85);
  ctx.rotate(-0.06);
  ctx.font = `${size * 0.42}px ${DISPLAY_FONT}`;
  const textW = ctx.measureText(text).width;
  const w = textW + size * 0.9;
  const h = size * 0.62;
  ctx.fillStyle = '#ff2e88';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.04);
  roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.02);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Film grain: sparse light/dark speckles (seeded, so re-renders match).
export function drawGrain(ctx, W, H, density) {
  ctx.save();
  const count = Math.floor((W * H) / 9000) * density;
  let seed = 987654321;
  const nextRand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const x = nextRand() * W;
    const y = nextRand() * H;
    ctx.fillStyle = nextRand() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

// Vignette: darkened corners so the title pops.
export function drawVignette(ctx, W, H) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Rects of every panel in absolute pixels, for hit-testing in the editor.
export function layoutRects(W, H, layoutId) {
  const layout = LAYOUTS[layoutId];
  return layout.panels.map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
    rot: p.rot || 0,
    clip: p.clip || null,
  }));
}

// The whole cover. `cover` holds layout, grade, title, subtitle, badgeText,
// stars, grain, and panels: [{ img, zoom, ox, oy }]. Photos are optional:
// a panel with no photo gets a sunset placeholder so the app always shows art.
export function drawCover(ctx, W, H, cover) {
  const layout = LAYOUTS[cover.layout];
  const grade = GRADES[cover.grade];
  ctx.clearRect(0, 0, W, H);

  if (layout.backdrop) {
    drawSunsetBackdrop(ctx, W, H);
  } else {
    ctx.fillStyle = '#12041f';
    ctx.fillRect(0, 0, W, H);
  }

  const rects = layoutRects(W, H, cover.layout);
  const bandH = layout.titleBand * H;

  rects.forEach((rect, i) => {
    const panel = cover.panels[i] || {};
    ctx.save();
    if (rect.clip === 'top' || rect.clip === 'bottom') {
      ctx.beginPath();
      if (rect.clip === 'top') {
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, rect.y + rect.h);
        ctx.lineTo(0, rect.y + rect.h * 0.62);
      } else {
        ctx.moveTo(0, rect.y + rect.h * 0.38);
        ctx.lineTo(W, rect.y);
        ctx.lineTo(W, rect.y + rect.h);
        ctx.lineTo(0, rect.y + rect.h);
      }
      ctx.closePath();
      ctx.clip();
    } else if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      rect = { x: 0, y: 0, w: rect.w, h: rect.h };
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
    }

    if (panel.img) {
      drawPhotoInPanel(ctx, panel.img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    } else {
      const ph = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      ph.addColorStop(0, grade.gradient[0]);
      ph.addColorStop(1, grade.gradient[2]);
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradePanel(ctx, rect, grade);
    ctx.restore();
    framePanel(ctx, rects[i], rects[i].rot);
  });

  // Bottom title band.
  const bandY = H - bandH;
  const bandGrad = ctx.createLinearGradient(0, bandY - bandH * 0.4, 0, H);
  bandGrad.addColorStop(0, 'rgba(10,2,20,0)');
  bandGrad.addColorStop(0.45, 'rgba(10,2,20,0.72)');
  bandGrad.addColorStop(1, 'rgba(10,2,20,0.92)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY - bandH * 0.4, W, bandH * 1.4);

  const titleSize = fitTitleSize(ctx, cover.title, W * 0.92, Math.min(W * 0.16, bandH * 0.52));
  const titleBaseline = H - bandH * 0.30;
  if (cover.stars > 0) {
    // Stars sit just above the title cap, clear of the lettering.
    drawStars(ctx, W / 2, titleBaseline - titleSize - Math.min(W * 0.02, bandH * 0.10), Math.min(W * 0.035, bandH * 0.16), cover.stars);
  }
  drawTitle(ctx, cover.title.toUpperCase(), W / 2, titleBaseline, titleSize, grade.gradient);
  if (cover.subtitle) {
    drawSubtitle(ctx, cover.subtitle, W / 2, H - bandH * 0.08, Math.min(W * 0.045, bandH * 0.20), grade.gradient[1]);
  }
  if (cover.badgeText) {
    drawBadge(ctx, cover.badgeText.toUpperCase(), W, Math.min(W * 0.045, H * 0.03));
  }
  if (cover.grain) drawGrain(ctx, W, H, 1);
  drawVignette(ctx, W, H);
}

// Shrink the title until it fits the width.
function fitTitleSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${DISPLAY_FONT}`;
  while (size > 24 && ctx.measureText(text.toUpperCase()).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${DISPLAY_FONT}`;
  }
  return size;
}

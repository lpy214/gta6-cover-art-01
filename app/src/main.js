// Vice Coast Cover Studio — the editor.
// Wires the controls to the cover renderer: photo uploads, per-panel crop and
// position, layouts, grades, sizes, caption editing and PNG export. Photos
// are read on the user's own machine and never leave it. Also runs the
// screenshot scenes (?shot=cover, ?shot=cover-portrait, ?shot=cover-square,
// ?shot=editor) the maker uses to capture the entry's screenshots.

import { GRADES, LAYOUTS, SIZES, DISPLAY_FONT, SCRIPT_FONT, drawCover, layoutRects } from './cover.js';

const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

const DEFAULT_COVER = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'Vice Coast',
  subtitle: 'neon nights & palm dreams',
  badgeText: 'Vice Coast',
  stars: 4,
  grain: true,
  size: 'wide',
  panels: [
    { photo: 0, zoom: 1.15, ox: 0, oy: -0.2 },
    { photo: 1, zoom: 1.25, ox: 0.1, oy: 0 },
    { photo: 0, zoom: 1.6, ox: -0.3, oy: 0.2 },
    { photo: 1, zoom: 1.4, ox: 0, oy: -0.3 },
    { photo: 1, zoom: 1.7, ox: -0.2, oy: -0.1 },
    { photo: 0, zoom: 1.3, ox: 0.25, oy: 0.1 },
    { photo: 0, zoom: 2.0, ox: 0.1, oy: -0.35 },
    { photo: 1, zoom: 1.1, ox: -0.15, oy: 0.25 },
    { photo: 0, zoom: 1.45, ox: -0.05, oy: 0.3 },
  ],
};

let cover = structuredClone(DEFAULT_COVER);
let photos = []; // HTMLImageElements, indexed by cover.panels[].photo
let selectedPanel = 0;
let dragging = null;

const $ = (id) => document.getElementById(id);

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

async function loadSamples() {
  photos = [];
  for (const sample of SAMPLES) {
    try {
      photos.push(await loadImage(sample.src));
    } catch {
      photos.push(null);
    }
  }
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`64px ${DISPLAY_FONT}`),
      document.fonts.load(`32px ${SCRIPT_FONT}`),
    ]);
    await document.fonts.ready;
  } catch {
    // Fall back to system fonts; the cover still draws.
  }
}

// Render the current cover into a canvas at export size.
function renderCoverCanvas() {
  const size = SIZES[cover.size];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const state = {
    ...cover,
    panels: cover.panels.map((p) => ({
      img: photos[p.photo] || null,
      zoom: p.zoom,
      ox: p.ox,
      oy: p.oy,
    })),
  };
  drawCover(ctx, size.w, size.h, state);
  return canvas;
}

// Fit the preview canvas into its box and draw the live cover.
function renderPreview() {
  const canvas = $('preview');
  const box = canvas.parentElement.getBoundingClientRect();
  const size = SIZES[cover.size];
  const scale = Math.min((box.width - 8) / size.w, 520 / size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(renderCoverCanvas(), 0, 0, canvas.width, canvas.height);
  highlightSelectedPanel(canvas);
}

// Outline the selected panel on the preview.
function highlightSelectedPanel(canvas) {
  const ctx = canvas.getContext('2d');
  const size = SIZES[cover.size];
  const sx = canvas.width / size.w;
  const sy = canvas.height / size.h;
  const rects = layoutRects(size.w, size.h, cover.layout);
  const r = rects[selectedPanel];
  if (!r) return;
  ctx.save();
  ctx.strokeStyle = '#ffd319';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(r.x * sx + 2, r.y * sy + 2, r.w * sx - 4, r.h * sy - 4);
  ctx.restore();
}

// --- Controls -------------------------------------------------------------

function buildControlRows() {
  const layoutRow = $('layoutRow');
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.textContent = layout.label;
    btn.dataset.layout = id;
    btn.className = cover.layout === id ? 'chip active' : 'chip';
    btn.addEventListener('click', () => {
      cover.layout = id;
      selectedPanel = 0;
      syncControls();
      renderPreview();
    });
    layoutRow.appendChild(btn);
  }

  const gradeRow = $('gradeRow');
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.textContent = grade.label;
    btn.dataset.grade = id;
    btn.className = cover.grade === id ? 'chip active' : 'chip';
    btn.addEventListener('click', () => {
      cover.grade = id;
      syncControls();
      renderPreview();
    });
    gradeRow.appendChild(btn);
  }

  const sizeRow = $('sizeRow');
  for (const [id, size] of Object.entries(SIZES)) {
    const btn = document.createElement('button');
    btn.textContent = size.label;
    btn.dataset.size = id;
    btn.className = cover.size === id ? 'chip active' : 'chip';
    btn.addEventListener('click', () => {
      cover.size = id;
      syncControls();
      renderPreview();
    });
    sizeRow.appendChild(btn);
  }

  const sampleRow = $('sampleRow');
  SAMPLES.forEach((sample, i) => {
    const btn = document.createElement('button');
    btn.textContent = `Sample: ${sample.name}`;
    btn.className = 'chip';
    btn.addEventListener('click', () => {
      cover.panels[selectedPanel].photo = i;
      syncControls();
      renderPreview();
    });
    sampleRow.appendChild(btn);
  });
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === cover.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === cover.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === cover.size));
  $('titleInput').value = cover.title;
  $('subtitleInput').value = cover.subtitle;
  $('badgeInput').value = cover.badgeText;
  $('starsInput').value = cover.stars;
  $('grainInput').checked = cover.grain;
  const panel = cover.panels[selectedPanel];
  $('zoomInput').value = panel.zoom;
  $('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${LAYOUTS[cover.layout].panels.length}`;
}

function bindInputs() {
  $('titleInput').addEventListener('input', (e) => {
    cover.title = e.target.value;
    renderPreview();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    cover.subtitle = e.target.value;
    renderPreview();
  });
  $('badgeInput').addEventListener('input', (e) => {
    cover.badgeText = e.target.value;
    renderPreview();
  });
  $('starsInput').addEventListener('input', (e) => {
    cover.stars = Number(e.target.value);
    renderPreview();
  });
  $('grainInput').addEventListener('change', (e) => {
    cover.grain = e.target.checked;
    renderPreview();
  });
  $('zoomInput').addEventListener('input', (e) => {
    cover.panels[selectedPanel].zoom = Number(e.target.value);
    $('zoomValue').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
    renderPreview();
  });
  $('shuffleBtn').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    cover.layout = layouts[Math.floor(Math.random() * layouts.length)];
    cover.grade = grades[Math.floor(Math.random() * grades.length)];
    selectedPanel = 0;
    syncControls();
    renderPreview();
  });
  $('resetBtn').addEventListener('click', () => {
    cover = structuredClone(DEFAULT_COVER);
    selectedPanel = 0;
    syncControls();
    renderPreview();
  });
  $('exportBtn').addEventListener('click', exportCover);
  $('uploadInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      photos.push(img);
      cover.panels[selectedPanel].photo = photos.length - 1;
      renderPreview();
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  // Click a panel to select it; drag inside it to pan the photo.
  const canvas = $('preview');
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const size = SIZES[cover.size];
    const px = ((e.clientX - rect.left) / rect.width) * size.w;
    const py = ((e.clientY - rect.top) / rect.height) * size.h;
    const rects = layoutRects(size.w, size.h, cover.layout);
    const hit = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = { x: e.clientX, y: e.clientY, ox: cover.panels[hit].ox, oy: cover.panels[hit].oy };
      canvas.setPointerCapture(e.pointerId);
      syncControls();
      renderPreview();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const size = SIZES[cover.size];
    const panel = cover.panels[selectedPanel];
    panel.ox = clamp(dragging.ox - ((e.clientX - dragging.x) / rect.width) * (size.w / 200), -1, 1);
    panel.oy = clamp(dragging.oy - ((e.clientY - dragging.y) / rect.height) * (size.h / 200), -1, 1);
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => {
    dragging = null;
  });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function exportCover() {
  const canvas = renderCoverCanvas();
  const size = SIZES[cover.size];
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('exportNote').textContent = `Exported ${size.w} × ${size.h} PNG — check your downloads.`;
  }, 'image/png');
}

// --- Screenshot scenes ----------------------------------------------------
// ?shot=cover draws the wide cover full-frame; ?shot=cover-portrait and
// ?shot=cover-square do the same at those sizes; ?shot=editor shows the
// editor with a photo loaded. These are the app's own drawings, taken in a
// browser, for the entry's screenshots.

async function runShotMode(shot) {
  await ensureFonts();
  await loadSamples();
  document.body.classList.add('shot-mode');
  if (shot === 'editor') {
    document.body.classList.remove('shot-mode');
    buildControlRows();
    bindInputs();
    syncControls();
    renderPreview();
    return;
  }
  const sizeKey = shot === 'cover-portrait' ? 'portrait' : shot === 'cover-square' ? 'square' : 'wide';
  cover.size = sizeKey;
  cover.layout = shot === 'cover-portrait' ? 'nine' : shot === 'cover-square' ? 'grid4' : 'hero3';
  cover.grade = shot === 'cover-portrait' ? 'neon' : shot === 'cover-square' ? 'gold' : 'sunset';
  cover.title = shot === 'cover-portrait' ? 'Neon Shore' : shot === 'cover-square' ? 'Palm Gold' : 'Vice Coast';
  cover.subtitle = shot === 'cover-portrait' ? 'midnight on the strip' : shot === 'cover-square' ? 'golden hour, every hour' : 'neon nights & palm dreams';
  const stage = $('shotStage');
  stage.hidden = false;
  const canvas = renderCoverCanvas();
  const size = SIZES[sizeKey];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / size.w, vh / size.h);
  canvas.style.width = `${Math.round(size.w * scale)}px`;
  canvas.style.height = `${Math.round(size.h * scale)}px`;
  stage.replaceChildren(canvas);
  document.title = `Vice Coast Cover Studio — ${size.w}×${size.h} cover`;
}

// --- Boot -----------------------------------------------------------------

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShotMode(shot);
    return;
  }
  await ensureFonts();
  await loadSamples();
  buildControlRows();
  bindInputs();
  syncControls();
  renderPreview();
  window.addEventListener('resize', renderPreview);
}

boot();

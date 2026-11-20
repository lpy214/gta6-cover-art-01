// Neon Coast Cover Studio — editor wiring.
// Owns the photo bank, the undo history, the preview canvas and every
// control on the page. The cover itself is drawn by src/cover.js.

import {
  SIZES, GRADES, LAYOUTS, layoutById, sizeById, defaultState,
  renderCover, exportCoverPng, coverPanelRects,
} from './cover.js';

const $ = (sel) => document.querySelector(sel);
const preview = $('#preview');
const pctx = preview.getContext('2d');

const SAMPLES = [
  { id: 'sample-boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'sample-neon', name: 'Neon Street', src: 'samples/neon.jpg' },
  { id: 'sample-pier', name: 'Pier', src: 'samples/pier.jpg' },
];

const state = defaultState();
const photoBank = new Map(); // id -> { id, name, img }
let photoSeq = 0;
let armedPhotoId = null; // a tray photo waiting to be placed in a panel
let history = [];
let historyAt = -1;
let previewRaf = 0;

// ------------------------------------------------------------ photo bank
function registerPhoto(name, img) {
  const id = `p${++photoSeq}`;
  photoBank.set(id, { id, name, img });
  return id;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(sample) {
  if (photoBank.has(sample.id)) return sample.id;
  const img = await loadImage(sample.src);
  photoBank.set(sample.id, { id: sample.id, name: sample.name, img });
  return sample.id;
}

function placePhoto(panelIndex, photoId) {
  const photo = photoBank.get(photoId);
  if (!photo) return;
  const slot = state.panels[panelIndex];
  slot.img = photo.img;
  slot.name = photo.name;
  slot.photoId = photoId;
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  slot.rot = 0;
  state.selected = panelIndex;
}

function fillAllPanels(photoId) {
  const layout = layoutById(state.layout);
  for (let i = 0; i < layout.slots; i++) placePhoto(i, photoId);
}

// ---------------------------------------------------------------- history
function snapshotState() {
  return JSON.stringify({
    ...state,
    panels: state.panels.map(({ img, ...rest }) => rest),
  });
}

function restoreSnapshot(json) {
  const snap = JSON.parse(json);
  for (const key of ['layout', 'grade', 'size', 'title', 'subtitle', 'badge', 'effects', 'selected']) {
    state[key] = snap[key];
  }
  state.panels = snap.panels.map((slot) => {
    const photo = slot.photoId ? photoBank.get(slot.photoId) : null;
    return { ...slot, img: photo ? photo.img : null };
  });
}

function pushHistory() {
  history = history.slice(0, historyAt + 1);
  history.push(snapshotState());
  if (history.length > 60) history.shift();
  historyAt = history.length - 1;
  syncUndoButtons();
}

function undo() {
  if (historyAt <= 0) return;
  historyAt -= 1;
  restoreSnapshot(history[historyAt]);
  syncAllControls();
  schedulePreview();
}

function redo() {
  if (historyAt >= history.length - 1) return;
  historyAt += 1;
  restoreSnapshot(history[historyAt]);
  syncAllControls();
  schedulePreview();
}

function syncUndoButtons() {
  $('#undoBtn').disabled = historyAt <= 0;
  $('#redoBtn').disabled = historyAt >= history.length - 1;
}

// --------------------------------------------------------------- preview
function previewSize() {
  const size = sizeById(state.size);
  const maxW = 780;
  const maxH = 640;
  const k = Math.min(maxW / size.w, maxH / size.h, 1);
  return { w: Math.round(size.w * k), h: Math.round(size.h * k) };
}

function schedulePreview() {
  if (previewRaf) return;
  previewRaf = requestAnimationFrame(() => {
    previewRaf = 0;
    drawPreview();
  });
}

function drawPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  renderCover(pctx, w, h, state);
  drawSelectionOutline(w, h);
}

function drawSelectionOutline(w, h) {
  const size = sizeById(state.size);
  const rects = coverPanelRects(state, w, h);
  const rect = rects[state.selected];
  if (!rect) return;
  const kx = w / size.w;
  const ky = h / size.h;
  pctx.save();
  pctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (rect.rot) pctx.rotate(rect.rot);
  pctx.strokeStyle = '#37e6ff';
  pctx.lineWidth = 3;
  pctx.setLineDash([10, 6]);
  pctx.strokeRect(-rect.w / 2 - 4, -rect.h / 2 - 4, rect.w + 8, rect.h + 8);
  pctx.setLineDash([]);
  // Label sits inside the panel, on a dark chip, so it never overlaps the
  // panel above it.
  pctx.font = '700 13px system-ui, sans-serif';
  pctx.textAlign = 'left';
  const label = `Panel ${state.selected + 1}`;
  const lw = pctx.measureText(label).width + 12;
  pctx.fillStyle = 'rgba(10,4,24,0.8)';
  pctx.fillRect(-rect.w / 2 + 6, -rect.h / 2 + 6, lw, 20);
  pctx.fillStyle = '#37e6ff';
  pctx.fillText(label, -rect.w / 2 + 12, -rect.h / 2 + 20);
  pctx.restore();
}

// Hit-test a preview point against the current layout's panels, honouring
// the tilt of the snapshot panels.
function panelAt(clientX, clientY) {
  const box = preview.getBoundingClientRect();
  const px = (clientX - box.left) * (preview.width / box.width);
  const py = (clientY - box.top) * (preview.height / box.height);
  const rects = coverPanelRects(state, preview.width, preview.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    let lx = px - (r.x + r.w / 2);
    let ly = py - (r.y + r.h / 2);
    if (r.rot) {
      const c = Math.cos(-r.rot);
      const s = Math.sin(-r.rot);
      const rx = lx * c - ly * s;
      const ry = lx * s + ly * c;
      lx = rx;
      ly = ry;
    }
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return -1;
}

// ------------------------------------------------------- preview gestures
let drag = null;

preview.addEventListener('pointerdown', (ev) => {
  const i = panelAt(ev.clientX, ev.clientY);
  if (i < 0) return;
  preview.setPointerCapture(ev.pointerId);
  drag = { panel: i, x: ev.clientX, y: ev.clientY, moved: false };
  if (armedPhotoId) {
    placePhoto(i, armedPhotoId);
    armedPhotoId = null;
    syncTraySelection();
    pushHistory();
    schedulePreview();
    drag = null;
    return;
  }
  state.selected = i;
  syncPanelControls();
  schedulePreview();
});

preview.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const dx = ev.clientX - drag.x;
  const dy = ev.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const slot = state.panels[drag.panel];
  if (!slot.img) return;
  const box = preview.getBoundingClientRect();
  const rects = coverPanelRects(state, preview.width, preview.height);
  const r = rects[drag.panel];
  slot.ox += (dx * (preview.width / box.width)) / r.w;
  slot.oy += (dy * (preview.height / box.height)) / r.h;
  drag.x = ev.clientX;
  drag.y = ev.clientY;
  schedulePreview();
});

preview.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushHistory();
  drag = null;
  syncPanelControls();
});

preview.addEventListener('wheel', (ev) => {
  const i = panelAt(ev.clientX, ev.clientY);
  if (i < 0) return;
  ev.preventDefault();
  const slot = state.panels[i];
  if (!slot.img) return;
  slot.zoom = Math.min(4, Math.max(0.5, slot.zoom * (ev.deltaY < 0 ? 1.08 : 0.93)));
  state.selected = i;
  syncPanelControls();
  schedulePreview();
}, { passive: false });

// ------------------------------------------------------------ tray + files
function buildTray() {
  const tray = $('#tray');
  tray.innerHTML = '';
  for (const sample of SAMPLES) {
    const btn = document.createElement('button');
    btn.className = 'tray-item';
    btn.dataset.photoId = sample.id;
    btn.innerHTML = `<img src="${sample.src}" alt="${sample.name}"><span>${sample.name}</span>`;
    btn.addEventListener('click', async () => {
      const id = await loadSample(sample);
      armPhoto(id);
    });
    tray.appendChild(btn);
  }
}

function addTrayPhoto(photo) {
  const tray = $('#tray');
  const btn = document.createElement('button');
  btn.className = 'tray-item';
  btn.dataset.photoId = photo.id;
  btn.innerHTML = `<img src="${photo.img.src}" alt=""><span>${photo.name}</span>`;
  btn.addEventListener('click', () => armPhoto(photo.id));
  tray.appendChild(btn);
}

function armPhoto(photoId) {
  armedPhotoId = photoId;
  syncTraySelection();
  $('#hint').textContent = 'Now click a panel to place this photo — or “Fill all panels”.';
}

function syncTraySelection() {
  for (const btn of document.querySelectorAll('.tray-item')) {
    btn.classList.toggle('armed', btn.dataset.photoId === armedPhotoId);
  }
}

$('#uploadInput').addEventListener('change', async (ev) => {
  for (const file of ev.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    const id = registerPhoto(file.name.replace(/\.[^.]+$/, ''), img);
    addTrayPhoto(photoBank.get(id));
    armPhoto(id);
  }
  ev.target.value = '';
});

$('#fillAllBtn').addEventListener('click', () => {
  if (!armedPhotoId) {
    $('#hint').textContent = 'Pick a photo from the tray first, then “Fill all panels”.';
    return;
  }
  fillAllPanels(armedPhotoId);
  pushHistory();
  schedulePreview();
});

$('#clearPanelBtn').addEventListener('click', () => {
  const slot = state.panels[state.selected];
  slot.img = null;
  slot.name = '';
  slot.photoId = null;
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  slot.rot = 0;
  pushHistory();
  syncPanelControls();
  schedulePreview();
});

// ------------------------------------------------------------ option rows
function buildOptionRow(el, items, current, onPick) {
  el.innerHTML = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.textContent = item.name;
    btn.dataset.id = item.id;
    if (item.id === current) btn.classList.add('active');
    if (item.accent) btn.style.setProperty('--accent', item.accent);
    btn.addEventListener('click', () => {
      onPick(item.id);
      for (const b of el.children) b.classList.toggle('active', b.dataset.id === item.id);
    });
    el.appendChild(btn);
  }
}

function buildControls() {
  buildOptionRow($('#layoutRow'), LAYOUTS.map((l) => ({ id: l.id, name: l.name })),
    state.layout, (id) => {
      state.layout = id;
      state.selected = 0;
      pushHistory();
      syncPanelControls();
      schedulePreview();
    });
  buildOptionRow($('#gradeRow'), GRADES.map((g) => ({ id: g.id, name: g.name, accent: g.accent })),
    state.grade, (id) => {
      state.grade = id;
      pushHistory();
      schedulePreview();
    });
  buildOptionRow($('#sizeRow'), SIZES.map((s) => ({ id: s.id, name: s.label })),
    state.size, (id) => {
      state.size = id;
      pushHistory();
      schedulePreview();
    });
}

function syncPanelControls() {
  const slot = state.panels[state.selected];
  $('#panelLabel').textContent = `Panel ${state.selected + 1} — ${slot.name || 'empty'}`;
  $('#zoomRange').value = slot.zoom;
  $('#zoomVal').textContent = `${Math.round(slot.zoom * 100)}%`;
  $('#rotRange').value = slot.rot;
  $('#rotVal').textContent = `${slot.rot}°`;
  $('#panXRange').value = Math.round(slot.ox * 100);
  $('#panYRange').value = Math.round(slot.oy * 100);
}

function bindPanelSliders() {
  $('#zoomRange').addEventListener('input', (ev) => {
    state.panels[state.selected].zoom = Number(ev.target.value);
    $('#zoomVal').textContent = `${Math.round(state.panels[state.selected].zoom * 100)}%`;
    schedulePreview();
  });
  $('#zoomRange').addEventListener('change', pushHistory);
  $('#rotRange').addEventListener('input', (ev) => {
    state.panels[state.selected].rot = Number(ev.target.value);
    $('#rotVal').textContent = `${state.panels[state.selected].rot}°`;
    schedulePreview();
  });
  $('#rotRange').addEventListener('change', pushHistory);
  $('#panXRange').addEventListener('input', (ev) => {
    state.panels[state.selected].ox = Number(ev.target.value) / 100;
    schedulePreview();
  });
  $('#panXRange').addEventListener('change', pushHistory);
  $('#panYRange').addEventListener('input', (ev) => {
    state.panels[state.selected].oy = Number(ev.target.value) / 100;
    schedulePreview();
  });
  $('#panYRange').addEventListener('change', pushHistory);
}

function bindCaptionInputs() {
  for (const [id, key] of [['titleInput', 'title'], ['subtitleInput', 'subtitle'], ['badgeInput', 'badge']]) {
    const el = document.getElementById(id);
    el.value = state[key];
    el.addEventListener('input', () => {
      state[key] = el.value;
      schedulePreview();
    });
    el.addEventListener('change', pushHistory);
  }
  for (const [id, key] of [['grainCheck', 'grain'], ['vignetteCheck', 'vignette'],
    ['halftoneCheck', 'halftone'], ['raysCheck', 'rays']]) {
    const el = document.getElementById(id);
    el.checked = state.effects[key];
    el.addEventListener('change', () => {
      state.effects[key] = el.checked;
      pushHistory();
      schedulePreview();
    });
  }
}

function syncAllControls() {
  buildControls();
  bindCaptionInputsRefresh();
  syncPanelControls();
  syncUndoButtons();
}

function bindCaptionInputsRefresh() {
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  $('#badgeInput').value = state.badge;
  $('#grainCheck').checked = state.effects.grain;
  $('#vignetteCheck').checked = state.effects.vignette;
  $('#halftoneCheck').checked = state.effects.halftone;
  $('#raysCheck').checked = state.effects.rays;
}

// ---------------------------------------------------------------- actions
$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
document.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
    ev.preventDefault();
    if (ev.shiftKey) redo();
    else undo();
  }
});

$('#exportBtn').addEventListener('click', async () => {
  const btn = $('#exportBtn');
  btn.disabled = true;
  btn.textContent = 'Rendering PNG…';
  try {
    const blob = await exportCoverPng(state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-coast-cover-${state.size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('#hint').textContent = `Exported ${state.size.replace('x', ' × ')} PNG — check your downloads.`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Export PNG';
  }
});

$('#resetBtn').addEventListener('click', () => {
  const fresh = defaultState();
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
  // Keep the photos already loaded; re-place the samples.
  placePhoto(0, 'sample-boulevard');
  placePhoto(1, 'sample-neon');
  placePhoto(2, 'sample-pier');
  placePhoto(3, 'sample-pier');
  pushHistory();
  syncAllControls();
  schedulePreview();
});

// ------------------------------------------------------------------- boot
async function boot() {
  buildTray();
  buildControls();
  bindPanelSliders();
  bindCaptionInputs();
  await document.fonts.load('900 80px CoastDisplay');
  await document.fonts.load('italic 700 40px CoastScript');
  await document.fonts.ready;
  // Start with a finished-looking cover so the first paint shows the art.
  await loadSample(SAMPLES[0]);
  await loadSample(SAMPLES[1]);
  await loadSample(SAMPLES[2]);
  placePhoto(0, 'sample-boulevard');
  placePhoto(1, 'sample-neon');
  placePhoto(2, 'sample-pier');
  placePhoto(3, 'sample-pier');
  pushHistory();
  syncPanelControls();
  schedulePreview();
  // Handle for screenshot automation and the finalist review.
  window.__coverStudio = {
    state,
    photoBank,
    renderPreview: drawPreview,
    exportCoverPng,
    placePhoto,
    fillAllPanels,
    armPhoto,
    loadSample,
    SAMPLES,
  };
}

boot().catch((err) => {
  $('#hint').textContent = `Could not start: ${err.message}`;
});

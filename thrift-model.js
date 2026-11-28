// 3D models for the thrift shop. One module, used by the shop (thrift.html) and the owner page (thrift-admin.html), so what
// you adjust in the editor is exactly what shoppers see on the shelf.
//
// A model is a small JSON object (see baseModel()) stored in the item's "model": a shape, its real size in cm, how it is turned
// and placed, its material, a few extras (handle, lid, base) and a detailed texture set-up for the item's photos.
// Items with no model of their own get a sensible one from their category or name (presetFor), so every item has a 3D model.
//
// The model is always scaled to fit the space on a shelf (FIT) and stands on its bottom, centred.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const FIT = { w: 0.52, h: 0.54, d: 0.34 };
const MIN_SIDE = 0.17;                                          // the smallest an item is ever drawn (its longest side), so it can still be seen and clicked            // the space on a shelf, in shop units
export const KINDS = { block: 'Box / block', round: 'Round: mug, vase, bottle, lamp…', sphere: 'Ball / sphere', book: 'Book', pillow: 'Soft: bag, cushion, folded clothes', glb: 'My own 3D file (.glb)' };
export const MODES = {
  block: { front: 'Front only', split: 'Front and back (two photos)', all: 'Same photo on every chosen face', tile: 'Tiled pattern' },
  pillow: { front: 'Front only', split: 'Front and back (two photos)', all: 'Same photo on every chosen face', tile: 'Tiled pattern' },
  round: { wrap: 'Wrapped once around', twice: 'Same photo on front and back', front: 'Front only (an arc)', tile: 'Tiled pattern' },
  sphere: { wrap: 'Wrapped once around', front: 'Front only (an arc)', tile: 'Tiled pattern' },
  book: { front: 'Front cover', split: 'Front and back covers (two photos)' },
  glb: {},
};
const DEFAULT_MODE = { block: 'front', pillow: 'front', round: 'wrap', sphere: 'wrap', book: 'front', glb: 'front' };

export const baseModel = () => ({
  kind: 'block',
  size: { w: 20, h: 20, d: 8 },                                   // real size in cm
  fit: 100,                                                       // % of the shelf space it may use
  rot: { yaw: 0, tilt: 0, roll: 0 },                              // degrees
  offset: { x: 0, y: 0, z: 0 },                                   // % of the shelf space
  shape: { corner: 8, taperX: 100, taperZ: 100, bulge: 0, twist: 0,
           topR: 100, botR: 100, belly: 0, neck: 0, neckH: 25, lip: 0, foot: 0, open: false, wall: 8,
           cover: 8, pages: true, spine: true },
  look: { color: '#7d93a6', color2: '#ece4d2', rough: 55, metal: 0, opacity: 100 },
  acc: { handle: false, handleSize: 60, handleAngle: 0, lid: false, lidH: 10, lidScale: 100, knob: true, lidColor: '#3b3b3b', base: false, baseH: 8, baseGrow: 12, baseColor: '#4a3b2c' },
  tex: { mode: 'front', src: 0, src2: 1, fit: 'cover', scaleX: 100, scaleY: 100, offX: 0, offY: 0, rot: 0, flipX: false, flipY: false, repeatX: 2, repeatY: 2, seam: 0, arc: 140,
         bright: 0, contrast: 0, sat: 0, hue: 0, tint: '#ffffff', tintAmt: 0, bg: '#ffffff', opacity: 100,
         front: true, back: true, left: true, right: true, top: true, bottom: true },
  glb: '',
});

// Ready-made starting points, shown as a menu in the editor.
const P = (kind, size, extra = {}) => ({ kind, size: { w: size[0], h: size[1], d: size[2] }, ...extra });
export const PRESETS = {
  book_hard: { label: 'Book, hardcover', m: P('book', [15, 23, 3], { look: { color: '#2f5d8a', color2: '#efe6d2' }, shape: { cover: 7 } }) },
  book_paper: { label: 'Book, paperback', m: P('book', [11, 18, 2], { look: { color: '#b5483a', color2: '#f1e8d4' }, shape: { cover: 3, spine: true } }) },
  box: { label: 'Box', m: P('block', [20, 15, 10], { shape: { corner: 5 }, look: { color: '#c9a56d' } }) },
  boardgame: { label: 'Board game box', m: P('block', [27, 27, 6], { shape: { corner: 3 }, look: { color: '#c0392b' } }) },
  shoebox: { label: 'Shoe box', m: P('block', [33, 12, 20], { shape: { corner: 3 }, look: { color: '#b88b5a' } }) },
  tablet: { label: 'Tablet / photo frame', m: P('block', [20, 26, 1.5], { shape: { corner: 12 }, look: { color: '#22272b', rough: 30 } }) },
  phone: { label: 'Phone', m: P('block', [7.2, 15, 0.8], { shape: { corner: 18 }, look: { color: '#1d2125', rough: 25, metal: 40 } }) },
  speaker: { label: 'Speaker', m: P('block', [13, 19, 13], { shape: { corner: 18 }, look: { color: '#2b2f33' } }) },
  earbuds: { label: 'Earbuds case', m: P('block', [6.5, 3, 5], { shape: { corner: 40 }, look: { color: '#f2f2f2', rough: 35 } }) },
  mug: { label: 'Mug', m: P('round', [8.5, 9.5, 8.5], { shape: { botR: 88, topR: 100, belly: 6, open: true, wall: 7 }, acc: { handle: true, handleSize: 60 }, look: { color: '#e9e4da', rough: 30 } }) },
  vase: { label: 'Vase', m: P('round', [12, 28, 12], { shape: { botR: 55, topR: 80, belly: 55, neck: 45, neckH: 32, lip: 12, open: true, wall: 6 }, look: { color: '#5f8f9e', rough: 25 } }) },
  bottle: { label: 'Bottle', m: P('round', [7, 24, 7], { shape: { botR: 100, topR: 100, neck: 62, neckH: 28, lip: 8 }, look: { color: '#3d7a5a', rough: 20, opacity: 90 } }) },
  jar: { label: 'Jar / tin', m: P('round', [8, 11, 8], { shape: { botR: 100, topR: 100 }, acc: { lid: true, lidH: 10, lidScale: 104 }, look: { color: '#d8cdb5', rough: 40 } }) },
  lamp: { label: 'Lamp shade', m: P('round', [24, 20, 24], { shape: { botR: 66, topR: 100, belly: 0, open: true, wall: 3, lip: 6 }, look: { color: '#ecdcb4', rough: 80, opacity: 94 }, acc: { base: true, baseH: 22, baseGrow: -80, baseColor: '#3a3a3a' } }) },
  bowl: { label: 'Bowl', m: P('round', [18, 8, 18], { shape: { botR: 52, topR: 100, belly: 12, open: true, wall: 6 }, look: { color: '#d7b98e', rough: 35 } }) },
  plate: { label: 'Plate', m: P('round', [26, 2.5, 26], { shape: { botR: 70, topR: 100, open: true, wall: 9 }, look: { color: '#f1efe9', rough: 25 } }) },
  ball: { label: 'Ball', m: P('sphere', [20, 20, 20], { look: { color: '#e0a23a', rough: 60 } }) },
  plush: { label: 'Soft toy', m: P('pillow', [22, 26, 14], { shape: { bulge: 85 }, look: { color: '#c79a6b', rough: 95 } }) },
  cushion: { label: 'Cushion', m: P('pillow', [40, 40, 12], { shape: { bulge: 70 }, look: { color: '#6c8cae', rough: 95 } }) },
  folded: { label: 'Folded clothes', m: P('pillow', [32, 9, 26], { shape: { bulge: 30, corner: 20 }, look: { color: '#5c7aa1', rough: 95 }, tex: { mode: 'front' } }) },
  tote: { label: 'Tote / bag', m: P('pillow', [32, 36, 9], { shape: { bulge: 55 }, look: { color: '#d8c8a4', rough: 92 } }) },
};
const BY_NAME = [[/\b(mug|cup)\b/i, 'mug'], [/\b(book|novel|paperback|hardcover|manga|comic)s?\b/i, 'book_hard'], [/\blamp\b/i, 'lamp'], [/\bvase\b/i, 'vase'], [/\bbottle\b/i, 'bottle'], [/\bbowl\b/i, 'bowl'], [/\bplate\b/i, 'plate'],
  [/\b(ball|globe)\b/i, 'ball'], [/\b(plush|teddy|bear|stuffed)\b/i, 'plush'], [/\bcushion|pillow\b/i, 'cushion'], [/\b(tote|bag|backpack)\b/i, 'tote'], [/\b(phone|iphone)\b/i, 'phone'], [/\b(tablet|ipad|frame)\b/i, 'tablet'],
  [/\b(earbuds|airpods|earphones)\b/i, 'earbuds'], [/\bspeaker\b/i, 'speaker'], [/\bboard ?game|puzzle|card game|lego\b/i, 'boardgame'], [/\b(shoe|sneaker|boot)s?\b/i, 'shoebox'],
  [/\b(jacket|shirt|tee|t-shirt|hoodie|jeans|dress|sweater|jumper|pants|skirt|coat)s?\b/i, 'folded']];
const BY_CATEGORY = { 'Clothing': 'folded', 'Electronics': 'tablet', 'Books': 'book_hard', 'Home': 'vase', 'Toys & games': 'boardgame', 'Other': 'box' };
export function presetFor(item) {
  const name = (item && item.name) || '';
  for (const [re, id] of BY_NAME) if (re.test(name)) return id;
  return BY_CATEGORY[item && item.category] || 'box';
}

// ----- normalising: fill in everything that is missing, and keep every number in a safe range -----
const LIMITS = { 'size.w': [0.5, 200], 'size.h': [0.5, 200], 'size.d': [0.2, 200], fit: [20, 140], 'rot.yaw': [-360, 360], 'rot.tilt': [-180, 180], 'rot.roll': [-180, 180], 'offset.x': [-100, 100], 'offset.y': [-100, 100], 'offset.z': [-100, 100],
  'shape.corner': [0, 50], 'shape.taperX': [10, 250], 'shape.taperZ': [10, 250], 'shape.bulge': [0, 100], 'shape.twist': [-180, 180], 'shape.topR': [5, 250], 'shape.botR': [5, 250], 'shape.belly': [-60, 200], 'shape.neck': [0, 95], 'shape.neckH': [5, 80], 'shape.lip': [0, 100], 'shape.foot': [0, 100], 'shape.wall': [1, 40], 'shape.cover': [1, 30],
  'look.rough': [0, 100], 'look.metal': [0, 100], 'look.opacity': [10, 100], 'acc.handleSize': [10, 140], 'acc.handleAngle': [-180, 180], 'acc.lidH': [2, 40], 'acc.lidScale': [30, 150], 'acc.baseH': [2, 60], 'acc.baseGrow': [-90, 100],
  'tex.src': [0, 7], 'tex.src2': [0, 7], 'tex.scaleX': [10, 800], 'tex.scaleY': [10, 800], 'tex.offX': [-200, 200], 'tex.offY': [-200, 200], 'tex.rot': [-360, 360], 'tex.repeatX': [1, 12], 'tex.repeatY': [1, 12], 'tex.seam': [-360, 360], 'tex.arc': [20, 360],
  'tex.bright': [-100, 100], 'tex.contrast': [-100, 100], 'tex.sat': [-100, 100], 'tex.hue': [-180, 180], 'tex.tintAmt': [0, 100], 'tex.opacity': [0, 100] };
function merge(target, src, path = '') {
  if (!src || typeof src !== 'object') return target;
  for (const k of Object.keys(target)) {
    const p = path ? path + '.' + k : k, d = target[k], v = src[k];
    if (v === undefined || v === null) continue;
    if (d && typeof d === 'object') merge(d, v, p);
    else if (typeof d === 'number') { const n = Number(v); if (Number.isFinite(n)) { const L = LIMITS[p]; target[k] = L ? Math.min(L[1], Math.max(L[0], n)) : n; } }
    else if (typeof d === 'boolean') target[k] = !!v;
    else if (typeof d === 'string') { if (typeof v === 'string') target[k] = /^#[0-9a-f]{6}$/i.test(d) || /color|tint|bg/i.test(k) ? (/^#[0-9a-f]{6}$/i.test(v) ? v : d) : v.slice(0, 400); }
  }
  return target;
}
export function normalizeModel(raw, item) {
  const base = baseModel(), r = raw && typeof raw === 'object' ? raw : {};
  const hasOwn = r.kind && KINDS[r.kind];
  if (!hasOwn || (!r.size && r.kind !== 'glb')) {   // nothing set up yet: start from the preset that suits the item
    const pre = PRESETS[presetFor(item)].m; merge(base, pre);
    merge(base, r);
  } else merge(base, r);
  if (!KINDS[base.kind]) base.kind = 'block';
  if (!MODES[base.kind][base.tex.mode] && base.kind !== 'glb') base.tex.mode = DEFAULT_MODE[base.kind];
  return base;
}
export const applyPreset = (id, keepTex = true, current) => { const out = baseModel(); merge(out, PRESETS[id].m); if (keepTex && current) { out.tex = JSON.parse(JSON.stringify(current.tex)); if (!MODES[out.kind][out.tex.mode]) out.tex.mode = DEFAULT_MODE[out.kind]; } return out; };

// ----- pictures: draw the photo into a texture the way the settings ask -----
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function adjustPixels(ctx, W, H, t) {
  const needs = t.bright || t.contrast || t.sat || t.hue || t.tintAmt > 0; if (!needs) return;
  const d = ctx.getImageData(0, 0, W, H), a = d.data, br = t.bright * 2.55, ct = t.contrast >= 0 ? 1 + t.contrast / 40 : 1 + t.contrast / 100, sat = 1 + t.sat / 100;
  const ang = t.hue * Math.PI / 180, cs = Math.cos(ang), sn = Math.sin(ang);
  const hm = [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928, 0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283, 0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072];
  const tint = hexRGB(t.tint), ta = t.tintAmt / 100;
  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], g = a[i + 1], b = a[i + 2];
    if (t.hue) { const nr = r * hm[0] + g * hm[1] + b * hm[2], ng = r * hm[3] + g * hm[4] + b * hm[5], nb = r * hm[6] + g * hm[7] + b * hm[8]; r = nr; g = ng; b = nb; }
    if (t.sat) { const l = 0.299 * r + 0.587 * g + 0.114 * b; r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
    if (t.contrast) { r = (r - 128) * ct + 128; g = (g - 128) * ct + 128; b = (b - 128) * ct + 128; }
    r += br; g += br; b += br;
    if (ta > 0) { r += (r * tint[0] / 255 - r) * ta; g += (g * tint[1] / 255 - g) * ta; b += (b * tint[2] / 255 - b) * ta; }
    a[i] = r < 0 ? 0 : r > 255 ? 255 : r; a[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; a[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  ctx.putImageData(d, 0, 0);
}
// Draws image `img` into a W x H area (aspect = real width / height of the surface it will cover).
function drawPhoto(ctx, img, x0, y0, W, H, t, base) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.clip();
  ctx.fillStyle = t.bg; ctx.fillRect(x0, y0, W, H);
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  let k = t.fit === 'stretch' ? 0 : t.fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
  const dw = t.fit === 'stretch' ? W : iw * k, dh = t.fit === 'stretch' ? H : ih * k;
  ctx.translate(x0 + W / 2 + t.offX / 100 * W, y0 + H / 2 - t.offY / 100 * H); ctx.rotate(t.rot * Math.PI / 180);
  ctx.scale((t.flipX ? -1 : 1) * t.scaleX / 100, (t.flipY ? -1 : 1) * t.scaleY / 100);
  ctx.globalAlpha = t.opacity / 100; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}
function makeTexture(img, t, aspect, base, opts = {}) {
  const W = opts.wide ? 1024 : 512, H = Math.round(clamp(W / Math.max(0.05, aspect), 96, 1536));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  if (opts.arc) {   // a picture on part of the way round, the rest plain colour
    const aw = Math.round(W * opts.arc / 360), x = Math.round((W - aw) / 2); drawPhoto(ctx, img, x, 0, aw, H, t, base);
  } else if (opts.twice) { drawPhoto(ctx, img, 0, 0, W / 2, H, t, base); drawPhoto(ctx, img, W / 2, 0, W / 2, H, t, base); }
  else drawPhoto(ctx, img, 0, 0, W, H, t, base);
  adjustPixels(ctx, W, H, t);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = opts.aniso || 4;
  if (opts.repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return tx;
}

// ----- geometry -----
function twistAndTaper(geo, h, s) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = clamp((p.getY(i) + h / 2) / h, 0, 1), sx = 1 + (s.taperX / 100 - 1) * t, sz = 1 + (s.taperZ / 100 - 1) * t; let x = p.getX(i) * sx, z = p.getZ(i) * sz;
    if (s.twist) { const a = s.twist * Math.PI / 180 * (t - 0.5), cs = Math.cos(a), sn = Math.sin(a); const nx = x * cs + z * sn, nz = -x * sn + z * cs; x = nx; z = nz; }
    p.setXYZ(i, x, p.getY(i), z);
  }
  geo.computeVertexNormals();
}
function pillowGeo(w, h, d, bulge, n = 14) {
  const geo = new THREE.BoxGeometry(w, h, d, n, n, 1), p = geo.attributes.position, b = bulge / 100;
  for (let i = 0; i < p.count; i++) { const ax = p.getX(i) / (w / 2), ay = p.getY(i) / (h / 2), f = Math.sqrt(Math.max(0, 1 - ay ** 4)) * (0.62 + 0.38 * Math.sqrt(Math.max(0, 1 - ax ** 4))); p.setZ(i, p.getZ(i) * (1 + (Math.max(0.07, f) - 1) * b)); }
  geo.computeVertexNormals(); return geo;
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function roundRadius(s, t) {   // radius of a round object at height fraction t (1 = the base radius)
  let r = (s.botR + (s.topR - s.botR) * t) / 100; r *= 1 + s.belly / 100 * Math.sin(Math.PI * t);
  if (s.neck > 0) r *= 1 - s.neck / 100 * sstep(1 - s.neckH / 100 - 0.12, 1 - s.neckH / 100 + 0.12, t);
  if (s.lip > 0) r *= 1 + s.lip / 100 * sstep(0.94, 1, t);
  if (s.foot > 0) r *= 1 + s.foot / 100 * 0.2 * (1 - sstep(0, 0.07, t));
  return Math.max(0.02, r);
}
function lathe(points, seg) { const g = new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg); return g; }

// Items with the same shape settings share one geometry (a shelf of folded clothes builds the shape once). Shared geometries are never disposed.
const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { if (geoCache.size > 300) { geoCache.forEach(v => v.dispose()); geoCache.clear(); } g = make(); g.userData.shared = true; geoCache.set(key, g); }
  return g;
}

// ----- the model itself -----
export class ThriftModel {
  constructor(spec, opts = {}) {
    this.spec = spec; this.group = new THREE.Group(); this.group.userData.item = opts.item || null; this.content = new THREE.Group(); this.group.add(this.content);
    this.q = opts.detail === 'high' ? { rb: 5, lathe: 56, prof: 40, sph: [56, 36], pil: 14 } : { rb: 2, lathe: 28, prof: 18, sph: [24, 16], pil: 7 };   // the shelves use lighter shapes than the editor preview
    this.images = []; this.glb = null; this.aniso = opts.aniso || 4; this.dim = 1; this.mats = []; this.meshes = []; this.box = { w: 0.3, h: 0.3, d: 0.2 };
    this.assemble();
  }
  update(spec) { this.spec = spec; this.assemble(); }
  setImages(imgs) { this.images = imgs || []; this.assemble(); }
  setGlb(obj) { this.glb = obj; this.assemble(); }
  setDim(f) { this.dim = f; this.mats.forEach(m => { m.color.copy(m.userData.base).multiplyScalar(f); if (m.emissive) m.emissiveIntensity = (m.userData.emi || 0) * f; }); }
  dispose() { this.clear(); }
  clear() {
    this.content.traverse(o => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); });
    this.mats.forEach(m => { if (m.map) m.map.dispose(); if (m.emissiveMap && m.emissiveMap !== m.map) m.emissiveMap.dispose(); m.dispose(); });
    while (this.content.children.length) this.content.remove(this.content.children[0]); this.mats = []; this.meshes = [];
  }
  material(color, o = {}, map = null) {
    const L = this.spec.look, m = new THREE.MeshStandardMaterial({ color, roughness: L.rough / 100, metalness: L.metal / 100, transparent: L.opacity < 100, opacity: L.opacity / 100, side: o.double ? THREE.DoubleSide : THREE.FrontSide, map, depthWrite: !(L.opacity < 100) });
    m.emissive = new THREE.Color(map ? 0xffffff : color); m.emissiveIntensity = map ? 0.32 : 0.16; if (map) m.emissiveMap = map; m.userData.base = new THREE.Color(color); m.userData.emi = m.emissiveIntensity;
    if (this.dim !== 1) { m.color.multiplyScalar(this.dim); m.emissiveIntensity *= this.dim; }
    this.mats.push(m); return m;
  }
  // Six plain faces need only one material (one draw instead of six); with a photo on any face, keep one per face.
  collapse(mats) { if (mats.some(m => m.map)) return mats; mats.slice(1).forEach(m => { const i = this.mats.indexOf(m); if (i >= 0) this.mats.splice(i, 1); m.dispose(); }); return mats[0]; }
  mesh(geo, mat, parent) { const m = new THREE.Mesh(geo, mat); parent.add(m); this.meshes.push(m); return m; }
  image(i) { return this.images[clamp(i | 0, 0, 7)] || null; }
  // The material for one face, given the face's real aspect ratio: the photo if the settings give it one, else the plain colour.
  face(role, aspect, color) {
    const t = this.spec.tex, k = this.spec.kind, mode = t.mode;
    let img = null, use = false;
    if (mode === 'front') { use = role === 'front'; img = this.image(t.src); }
    else if (mode === 'split') { use = role === 'front' || role === 'back'; img = this.image(role === 'back' ? t.src2 : t.src); }
    else if (mode === 'all' || mode === 'tile') { use = t[role] !== false; img = this.image(t.src); }
    if (!use || !img) return this.material(color);
    const rep = mode === 'tile' ? [t.repeatX, t.repeatY] : null;
    return this.material(0xffffff, {}, makeTexture(img, t, aspect, this.spec.look.color, { aniso: this.aniso, repeat: rep }));
  }
  assemble() {
    this.clear(); const parent = this.group.parent; if (parent) parent.remove(this.group);   // measure it on its own, away from whatever shelf it stands on, so its size is not mixed up with the shelf's position
    const S = this.spec, { w, h, d } = S.size, L = S.look, sh = S.shape, A = S.acc, body = new THREE.Group(), obj = new THREE.Group();
    const baseH = A.base && S.kind !== 'glb' ? h * A.baseH / 100 : 0, lidH = A.lid && (S.kind === 'round' || S.kind === 'block') ? h * A.lidH / 100 : 0;
    body.position.y = baseH; obj.add(body); this.content.add(obj);
    const color = L.color;
    if (S.kind === 'glb') this.buildGlb(body);
    else if (S.kind === 'block' || S.kind === 'pillow') this.buildBlock(body, S, color);
    else if (S.kind === 'round') this.buildRound(body, S, color, lidH);
    else if (S.kind === 'sphere') this.buildSphere(body, S, color);
    else if (S.kind === 'book') this.buildBook(body, S, color);
    if (baseH > 0) { const gr = 1 + A.baseGrow / 100, rnd = S.kind === 'round' || S.kind === 'sphere'; const g = rnd ? new THREE.CylinderGeometry(w / 2 * gr, w / 2 * gr * 1.04, baseH, 40).scale(1, 1, d / w) : new RoundedBoxGeometry(w * gr, baseH, d * gr, 3, Math.min(w, d) * 0.04); const b = this.mesh(g, this.material(A.baseColor), obj); b.position.y = baseH / 2; }
    // Place it: turn it, stand it on its bottom, centre it, fit it to the shelf, then nudge it.
    this.content.position.set(0, 0, 0); this.content.scale.set(1, 1, 1); this.content.rotation.set(0, 0, 0); obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0);
    const tot = h + baseH + lidH; obj.position.y = -tot / 2;   // centre of the object at the origin, so it turns about its middle
    this.content.rotation.set(S.rot.tilt * Math.PI / 180, S.rot.yaw * Math.PI / 180, S.rot.roll * Math.PI / 180, 'YXZ');
    this.content.updateMatrixWorld(true); this.group.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(this.content), sz = bb.getSize(new THREE.Vector3());
    // Real relative size: 40 cm of height is the full shelf space; smaller things are smaller (but never tinier than MIN_SIDE, so they can still be seen and clicked); bigger things shrink to fit.
    const fitK = Math.min(FIT.w / Math.max(sz.x, 1e-6), FIT.h / Math.max(sz.y, 1e-6), FIT.d / Math.max(sz.z, 1e-6)), maxDim = Math.max(sz.x, sz.y, sz.z, 1e-6);
    const k = Math.min(fitK, Math.max(FIT.h / 40, MIN_SIDE / maxDim)) * S.fit / 100;
    this.content.scale.setScalar(k); this.content.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(this.content), c = b2.getCenter(new THREE.Vector3());
    this.content.position.set(-c.x + S.offset.x / 100 * FIT.w, -b2.min.y + S.offset.y / 100 * FIT.h, -c.z + S.offset.z / 100 * FIT.d);
    this.content.updateMatrixWorld(true); const b3 = new THREE.Box3().setFromObject(this.content), s3 = b3.getSize(new THREE.Vector3()), c3 = b3.getCenter(new THREE.Vector3());
    this.box = { w: s3.x, h: s3.y, d: s3.z, cx: c3.x, cy: c3.y, cz: c3.z };
    this.meshes.forEach(m => { m.userData.item = this.group.userData.item; });
    if (parent) parent.add(this.group);
  }
  buildBlock(parent, S, color) {
    const { w, h, d } = S.size, sh = S.shape, r = Math.min(w, h, d) * (S.kind === 'pillow' ? 0 : sh.corner / 100), pillow = S.kind === 'pillow';
    const geo = cached(`blk|${S.kind}|${w}|${h}|${d}|${r}|${sh.bulge}|${sh.taperX}|${sh.taperZ}|${sh.twist}|${this.q.rb}|${this.q.pil}`, () => { const g = pillow ? pillowGeo(w, h, d, sh.bulge, this.q.pil) : (r > 0.01 ? new RoundedBoxGeometry(w, h, d, this.q.rb, r) : new THREE.BoxGeometry(w, h, d, 3, 3, 3)); twistAndTaper(g, h, sh); return g; });
    // face order of a box: +x right, -x left, +y top, -y bottom, +z front, -z back
    const faces = [['right', d / h], ['left', d / h], ['top', w / d], ['bottom', w / d], ['front', w / h], ['back', w / h]];
    const mats = this.collapse(faces.map(([role, asp]) => this.face(role, asp, color)));
    const m = this.mesh(geo, mats, parent); m.position.y = h / 2;
    this.accessories(parent, S, h, Math.max(w, d) / 2, w / 2, h, Math.min(w, d) / 2);
  }
  buildSphere(parent, S, color) {
    const { w, h, d } = S.size, t = S.tex, geo = cached(`sph|${w}|${h}|${d}|${this.q.sph}`, () => new THREE.SphereGeometry(0.5, this.q.sph[0], this.q.sph[1]).scale(w, h, d));
    const img = this.image(t.src); let mat;
    if (!img || !['wrap', 'front', 'tile'].includes(t.mode)) mat = this.material(color);
    else { const tx = makeTexture(img, t, Math.PI * (w + d) / 2 / h, S.look.color, { aniso: this.aniso, arc: t.mode === 'front' ? t.arc : 0, repeat: t.mode === 'tile' ? [t.repeatX, t.repeatY] : null, wide: true }); tx.wrapS = THREE.RepeatWrapping; tx.offset.x = (t.mode === 'tile' ? 0 : 0.25) - t.seam / 360; mat = this.material(0xffffff, {}, tx); }
    const m = this.mesh(geo, mat, parent); m.position.y = h / 2;
  }
  buildRound(parent, S, color, lidH) {
    const { w, h, d } = S.size, sh = S.shape, t = S.tex, seg = this.q.lathe, NP = this.q.prof, Rx = w / 2, Rz = d / 2;
    const rkey = `rnd|${w}|${h}|${d}|${JSON.stringify(sh)}|${seg}|${NP}`;
    const outer = cached(rkey + '|o', () => { const pts = []; for (let i = 0; i <= NP; i++) { const tt = i / NP; pts.push([roundRadius(sh, tt), tt]); } return lathe(pts, seg).scale(Rx, h, Rz); });
    const circ = Math.PI * (w + d) / 2, img = this.image(t.src); let mat;
    if (!img || !['wrap', 'twice', 'front', 'tile'].includes(t.mode)) mat = this.material(color, { double: sh.open });
    else {
      const tx = makeTexture(img, t, t.mode === 'twice' ? circ / 2 / h * 2 : circ / h, S.look.color, { aniso: this.aniso, wide: true, twice: t.mode === 'twice', arc: t.mode === 'front' ? t.arc : 0, repeat: t.mode === 'tile' ? [t.repeatX, t.repeatY] : null });
      tx.wrapS = THREE.RepeatWrapping; tx.offset.x = (t.mode === 'tile' ? 0 : 0.5) - t.seam / 360; mat = this.material(0xffffff, { double: sh.open }, tx);
    }
    this.mesh(outer, mat, parent);
    const topR = roundRadius(sh, 1), inner = this.material(shade(color, -0.18), { double: true });
    const capGeo = cached(rkey + '|c', () => {   // the bottom, and the top or the rim: one mesh
      const caps = [new THREE.CircleGeometry(1, seg).rotateX(Math.PI / 2).scale(roundRadius(sh, 0) * Rx, 1, roundRadius(sh, 0) * Rz)];
      if (sh.open) caps.push(new THREE.RingGeometry(Math.max(0.01, topR - sh.wall / 100), topR, seg).rotateX(-Math.PI / 2).translate(0, 1, 0).scale(Rx, h, Rz));
      else caps.push(new THREE.CircleGeometry(topR, seg).rotateX(-Math.PI / 2).translate(0, 1, 0).scale(Rx, h, Rz));
      const merged = mergeGeometries(caps.map(g => g.index ? g.toNonIndexed() : g)); caps.forEach(g => g.dispose()); return merged;
    });
    if (sh.open) this.mesh(cached(rkey + '|i', () => {
      const wall = sh.wall / 100, ip = [], floorT = Math.min(0.5, 0.05 + sh.wall / 400);
      for (let i = NP; i >= 0; i--) { const tt = i / NP; if (tt < floorT) break; ip.push([Math.max(0.01, roundRadius(sh, tt) - wall), tt]); }
      ip.push([0.001, floorT]); return lathe(ip, seg).scale(Rx, h, Rz);
    }), inner, parent);
    this.mesh(capGeo, this.material(color), parent);
    this.accessories(parent, S, h, Rx * roundRadius(sh, 0.55), Rx * topR, h, Rz * topR);
  }
  buildBook(parent, S, color) {
    const { w, h, d } = S.size, sh = S.shape, t = S.tex, ct = Math.min(d / 2.5, d * sh.cover / 30 + 0.05), pageD = Math.max(0.05, d - 2 * ct);
    const pagesColor = S.look.color2, geoCover = () => new RoundedBoxGeometry(w, h, ct, this.q.rb, Math.min(ct * 0.45, 0.25));
    const front = geoCover(), back = geoCover();
    const frontMats = this.collapse([0, 1, 2, 3, 4, 5].map(i => i === 4 ? this.face('front', w / h, color) : this.material(color)));
    const backMats = this.collapse([0, 1, 2, 3, 4, 5].map(i => i === 5 ? (t.mode === 'split' ? this.face('back', w / h, color) : this.material(color)) : this.material(color)));
    const f = this.mesh(front, frontMats, parent); f.position.set(0, h / 2, d / 2 - ct / 2); const b = this.mesh(back, backMats, parent); b.position.set(0, h / 2, -d / 2 + ct / 2);
    if (sh.pages) { const pg = this.mesh(new THREE.BoxGeometry(w - 0.5 - ct * 0.3, h - 0.4, pageD), this.material(pagesColor), parent); pg.position.set(0.15, h / 2, 0); }
    if (sh.spine) { const sp = this.mesh(new RoundedBoxGeometry(ct * 1.1, h, d, this.q.rb, Math.min(d * 0.3, 0.3)), this.material(color), parent); sp.position.set(-w / 2 + ct * 0.55, h / 2, 0); }
  }
  buildGlb(parent) {
    const { w, h, d } = this.spec.size;
    if (!this.glb) { const ph = this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.1), this.material('#b9c4cc'), parent); ph.position.y = h / 2; return; }   // a plain block while the file loads, or if it cannot load
    const o = this.glb.clone(true); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    const k = Math.min(w / Math.max(sz.x, 1e-6), h / Math.max(sz.y, 1e-6), d / Math.max(sz.z, 1e-6)), wrap = new THREE.Group(); wrap.scale.setScalar(k); o.position.set(-c.x, -bb.min.y, -c.z); wrap.add(o); parent.add(wrap);
    wrap.traverse(m => { if (m.isMesh) { this.meshes.push(m); (Array.isArray(m.material) ? m.material : [m.material]).forEach(mm => { if (mm && mm.color) { mm.userData.base = mm.color.clone(); mm.userData.emi = 0; this.mats.push(mm); } }); } });
  }
  accessories(parent, S, h, midR, topR, hh, topRz) {
    const A = S.acc, { w, d } = S.size;
    if (A.handle) {
      const R = h * 0.22 * A.handleSize / 100, tube = Math.max(0.12, R * 0.16), g = new THREE.TorusGeometry(R, tube, 10, 28, Math.PI).rotateZ(-Math.PI / 2);
      const pivot = new THREE.Group(); parent.add(pivot); pivot.rotation.y = -A.handleAngle * Math.PI / 180;   // 0 = on the right, as seen from the front
      const hm = this.mesh(g, this.material(S.look.color), pivot); hm.position.set((S.kind === 'round' ? midR : w / 2) - tube * 0.4, h * 0.55, 0);
    }
    if (A.lid && (S.kind === 'round' || S.kind === 'block')) {
      const lh = h * A.lidH / 100, sc = A.lidScale / 100;
      const lg = S.kind === 'round' ? new THREE.CylinderGeometry(w / 2 * roundRadius(S.shape, 1) * sc, w / 2 * roundRadius(S.shape, 1) * sc, lh, 44).scale(1, 1, d / w) : new RoundedBoxGeometry(w * sc, lh, d * sc, 3, Math.min(lh, w) * 0.3);
      const lm = this.mesh(lg, this.material(A.lidColor), parent); lm.position.y = h + lh / 2;
      if (A.knob) { const kn = this.mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.07, 16, 12), this.material(A.lidColor), parent); kn.position.y = h + lh + Math.min(w, d) * 0.04; }
    }
  }
}
export function shade(hex, amt) { const [r, g, b] = hexRGB(hex), f = c => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)); return '#' + [f(r), f(g), f(b)].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join(''); }

// A .glb file, loaded once per address and shared.
const glbCache = new Map();
export function loadGlb(url) {
  if (!glbCache.has(url)) glbCache.set(url, import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => new Promise((ok, bad) => new GLTFLoader().load(url, g => ok(g.scene), undefined, bad))));
  return glbCache.get(url);
}
// A picture for the texture: loaded so that it may be drawn into a texture (the photos are served with permission for that).
const imgCache = new Map();
export function loadImage(url) {
  if (!imgCache.has(url)) imgCache.set(url, new Promise(ok => { const i = new Image(); if (!/^(blob|data):/.test(url)) i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = url; }));
  return imgCache.get(url);
}
export const photoCount = spec => spec.kind === 'glb' ? 0 : spec.tex.mode === 'split' ? 2 : 1;

#!/usr/bin/env node
// Checks the 3D shop for the things that are easy to break when the layout changes:
//
//   * every snack, every bundle tray and the starting spot can be reached on foot, without a huge detour
//   * the floor is one connected space (no sealed-off pockets that a shopper could be sent into)
//   * the page loads without errors and stays inside a drawing budget (so phones stay smooth)
//
// Run it from the repository folder:
//
//     npm install playwright        (once)
//     npx playwright install chromium   (once)
//     node tools/check-shop.mjs
//
// It starts its own little web server, opens virtual-snack-shop.html?debug in a headless browser with no
// internet (so it only sees what is in the repository), and exits with a non-zero code if a check fails.
// Options:  --max-detour=2.2   --max-calls=300   --verbose

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; }));
const MAX_DETOUR = Number(args['max-detour'] || 2.2);       // route length ÷ straight-line distance, for trips longer than 4 units
const MAX_CALLS = Number(args['max-calls'] || 300);         // draw calls for one frame, looking down the shop from the entrance
const MIN_MAIN = 0.9;                                       // the biggest connected area must hold at least this share of the floor

let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { console.error('This check needs Playwright:  npm install playwright && npx playwright install chromium'); process.exit(2); }

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/virtual-snack-shop.html?debug`;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 720 }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());          // no internet: only what is in the repository
await page.addInitScript(() => localStorage.setItem('virtual-snack-shop-welcomed', '1'));
await page.goto(url);
await page.waitForFunction(() => window.__dbg, null, { timeout: 90000 });
await page.waitForTimeout(2500);

const report = await page.evaluate(() => {
  const d = window.__dbg, { free, GX } = d;
  // 1. connected areas of the floor
  const comp = new Int32Array(free.length).fill(-1), sizes = []; let total = 0;
  for (let c = 0; c < free.length; c++) {
    if (!free[c]) continue; total++;
    if (comp[c] >= 0) continue;
    const id = sizes.length; let n = 0; const q = [c]; comp[c] = id;
    while (q.length) { const x = q.pop(); n++; const ci = x % GX; for (const m of [x - GX, x + GX, ci > 0 ? x - 1 : -1, ci < GX - 1 ? x + 1 : -1]) if (m >= 0 && m < free.length && free[m] && comp[m] < 0) { comp[m] = id; q.push(m); } }
    sizes.push(n);
  }
  // 2. routes from the entrance to every important spot
  const spots = d.spots(), start = spots[0], trips = [];
  const compAt = p => comp[Math.floor((p.z + d.HALF_D) / d.CELL) * GX + Math.floor((p.x + d.HALF_W) / d.CELL)];
  spots.slice(1).forEach(sp => {
    const path = d.findPath(start, sp); let len = 0, cur = start;
    path.forEach(q => { len += Math.hypot(q.x - cur.x, q.z - cur.z); cur = q; });
    const straight = Math.hypot(sp.x - start.x, sp.z - start.z), last = path[path.length - 1];
    trips.push({ name: sp.name, len, straight, ratio: straight > 4 ? len / straight : 1, arrived: Math.hypot(last.x - sp.x, last.z - sp.z) < 0.6 && compAt(sp) === compAt(start) });
  });
  // 3. drawing cost of the opening view
  d.renderer.render(d.scene, d.camera);
  const info = d.renderer.info;
  return { room: [d.HALF_W * 2, d.HALF_D * 2], floorCells: total, areas: sizes.sort((a, b) => b - a), trips, calls: info.render.calls, triangles: info.render.triangles, textures: info.memory.textures };
});
await browser.close(); server.close();

const failures = [];
const mainShare = report.areas[0] / report.floorCells;
if (mainShare < MIN_MAIN) failures.push(`the main walkable area is only ${(mainShare * 100).toFixed(0)}% of the floor (a shelf or table may be sealing off part of the shop)`);
report.trips.filter(t => !t.arrived).forEach(t => failures.push(`cannot walk to "${t.name}" from the entrance`));
report.trips.filter(t => t.arrived && t.ratio > MAX_DETOUR).forEach(t => failures.push(`the walk to "${t.name}" is ${t.len.toFixed(1)} long for a ${t.straight.toFixed(1)} trip (${t.ratio.toFixed(1)}x, limit ${MAX_DETOUR}x)`));
if (report.calls > MAX_CALLS) failures.push(`${report.calls} draw calls in the opening view (budget ${MAX_CALLS})`);
errors.forEach(e => failures.push(`page error: ${e}`));

const worst = [...report.trips].sort((a, b) => b.ratio - a.ratio)[0];
console.log(`Room ${report.room[0].toFixed(1)} x ${report.room[1].toFixed(1)} | ${report.trips.length} spots checked | walkable floor ${(mainShare * 100).toFixed(0)}% in one piece`);
if (worst) console.log(`Longest relative detour: "${worst.name}" ${worst.ratio.toFixed(2)}x (${worst.len.toFixed(1)} for ${worst.straight.toFixed(1)})`);
console.log(`Opening view: ${report.calls} draw calls, ${report.triangles} triangles, ${report.textures} textures`);
if (args.verbose) report.trips.forEach(t => console.log(`  ${t.name}: ${t.len.toFixed(1)} / ${t.straight.toFixed(1)} = ${t.ratio.toFixed(2)}x`));
if (failures.length) { console.error('\nFAILED:\n - ' + failures.join('\n - ')); process.exit(1); }
console.log('\nAll checks passed.');

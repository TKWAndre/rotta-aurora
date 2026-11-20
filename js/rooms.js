// ROTTA D'AURORA — top-down pixel-art rooms: each island is a grid of rooms linked by doors
'use strict';
const ROOMS = (() => {
  const T = PIX.T;
  let LV = null;
  const buf = PIX.mk(16, 16), b = buf.getContext('2d');
  const lc = PIX.mk(16, 16), l = lc.getContext('2d'); // (non più usato per la luce: ora è in alta risoluzione)
  const fxc = PIX.mk(16, 16), fg = fxc.getContext('2d');
  const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }, OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
  const key = (x, y) => x + ',' + y;
  let SAFE = null;
  function safe() {
    if (SAFE) return SAFE; const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;padding-left:env(safe-area-inset-left);padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);visibility:hidden';
    document.body.appendChild(d); const cs = getComputedStyle(d); SAFE = { l: parseFloat(cs.paddingLeft) || 0, t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0 }; d.remove(); return SAFE;
  }

  // ---------------- build ----------------
  function build(ch, W, H) {
    SAFE = null;
    const land = W >= H;
    const s = Math.max(1, Math.floor(Math.min(W / (land ? 20 : 12), H / (land ? 11 : 16)) / T));
    const RW = Math.max(land ? 16 : 10, Math.min(land ? 28 : 14, Math.floor(W / (T * s))));
    const RH = Math.max(land ? 10 : 14, Math.min(land ? 14 : 20, Math.floor(H / (T * s))));
    const th = PIX.theme(ch.map.bg);
    buf.width = lc.width = fxc.width = RW * T; buf.height = lc.height = fxc.height = RH * T;
    const rooms = new Map();
    const room = (x, y) => { const k = key(x, y); if (!rooms.has(k)) rooms.set(k, { cx: x, cy: y, k, nodes: [], doors: {} }); return rooms.get(k); };
    const cellOf = n => [Math.min(2, Math.max(0, Math.floor(n.x * 3))), Math.min(2, Math.max(0, Math.floor(n.y * 3)))];
    const nodeRoom = {};
    ch.map.nodes.forEach(n => { const [x, y] = cellOf(n); room(x, y).nodes.push(n); nodeRoom[n.id] = key(x, y); });
    const connect = (x, y, nx, ny) => { const a = room(x, y), c = room(nx, ny); const d = nx > x ? 'e' : nx < x ? 'w' : ny > y ? 's' : 'n'; a.doors[d] = c.k; c.doors[OPP[d]] = a.k; };
    const carve = (a, c) => { let [x, y] = a; while (x !== c[0]) { const nx = x + Math.sign(c[0] - x); connect(x, y, nx, y); x = nx; } while (y !== c[1]) { const ny = y + Math.sign(c[1] - y); connect(x, y, x, ny); y = ny; } };
    const byId = Object.fromEntries(ch.map.nodes.map(n => [n.id, n]));
    (ch.map.links || []).forEach(([a, c]) => { if (byId[a] && byId[c]) carve(cellOf(byId[a]), cellOf(byId[c])); });
    // make sure everything is connected
    for (let guard = 0; guard < 12; guard++) {
      const first = rooms.values().next().value, seen = new Set([first.k]), q = [first];
      while (q.length) { const r = q.shift(); Object.values(r.doors).forEach(k => { if (!seen.has(k)) { seen.add(k); q.push(rooms.get(k)); } }); }
      const lost = [...rooms.values()].find(r => !seen.has(r.k)); if (!lost) break;
      let best = null, bd = 99; seen.forEach(k => { const r = rooms.get(k), d = Math.abs(r.cx - lost.cx) + Math.abs(r.cy - lost.cy); if (d < bd) { bd = d; best = r; } });
      carve([best.cx, best.cy], [lost.cx, lost.cy]);
    }
    LV = { ch, W, H, s, RW, RH, th, rooms, nodeRoom, mx: Math.floor(RW / 2), my: Math.floor(RH / 2), cur: null, p: { x: 0, y: 0, dir: 0 }, path: [], goal: null, trail: [], fade: 0, fx: [], seen: new Set(), seed: ch.num * 7919, ping: null };
    LV.ox = Math.floor((W - RW * T * s) / 2); LV.oy = Math.floor((H - RH * T * s) / 2);
    rooms.forEach(buildRoom);
    LV.cur = rooms.values().next().value.k;
    return LV;
  }
  const lanes = (rm, x, y) => { const { mx, my, RW, RH } = LV; return (x >= mx - 2 && x <= mx + 1) || (y >= my - 2 && y <= my + 1) || y <= 2 || x <= 1 || x >= RW - 2 || y >= RH - 2; };
  function doorTiles(rm, d) {
    const { mx, my, RW, RH } = LV;
    if (d === 'n') return [[mx - 1, 0], [mx, 0], [mx - 1, 1], [mx, 1]]; if (d === 's') return [[mx - 1, RH - 1], [mx, RH - 1]];
    if (d === 'w') return [[0, my - 1], [0, my]]; return [[RW - 1, my - 1], [RW - 1, my]];
  }
  function buildRoom(rm) {
    const { RW, RH, th } = LV, r = PIX.rngOf(LV.seed + rm.cx * 17 + rm.cy * 131);
    const bl = new Uint8Array(RW * RH); rm.bl = bl;
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (y < 2 || y === RH - 1 || x === 0 || x === RW - 1) bl[y * RW + x] = 1;
    Object.keys(rm.doors).forEach(d => doorTiles(rm, d).forEach(([x, y]) => bl[y * RW + x] = 0));
    // nodes
    rm.pos = {}; const taken = [];
    rm.nodes.forEach(n => {
      const fx = n.x * 3 - rm.cx, fy = n.y * 3 - rm.cy;
      let tx = Math.round(2 + Math.min(1, Math.max(0, fx)) * (RW - 5)), ty = Math.round(3 + Math.min(1, Math.max(0, fy)) * (RH - 6));
      let best = null, bd = 1e9;
      for (let y = 3; y <= RH - 3; y++) for (let x = 2; x <= RW - 3; x++) {
        if (taken.some(([a, c]) => Math.max(Math.abs(a - x), Math.abs(c - y)) < 3)) continue;
        if ((Math.abs(x - LV.mx + .5) < 1.6 && (y <= 3 || y >= RH - 3)) || (Math.abs(y - LV.my + .5) < 1.6 && (x <= 2 || x >= RW - 3))) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2; if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) best = [tx, ty];
      taken.push(best); rm.pos[n.id] = best;
    });
    // props
    rm.props = []; rm.decals = [];
    const near = (x, y) => taken.some(([a, c]) => Math.abs(a - x) <= 2 && Math.abs(c - y) <= 2);
    const count = Math.round((RW - 2) * (RH - 3) * .12);
    for (let i = 0; i < count; i++) for (let tries = 0; tries < 25; tries++) {
      const x = 1 + Math.floor(r() * (RW - 2)), y = 2 + Math.floor(r() * (RH - 3));
      if (bl[y * RW + x] || near(x, y)) continue;
      const edge = x <= 2 || x >= RW - 3 || y <= 3 || y >= RH - 3;
      if (!edge && r() < .45) continue;
      if (Math.abs(x - LV.mx + .5) < 2.1 || Math.abs(y - LV.my + .5) < 2.1) continue;
      const type = th.props[Math.floor(r() * th.props.length)];
      rm.props.push({ x, y, type, seed: Math.floor(r() * 3) }); bl[y * RW + x] = 1; break;
    }
    const nd = Math.round(RW * RH * .07);
    for (let i = 0; i < nd; i++) rm.decals.push({ x: 1 + Math.floor(r() * (RW - 2)), y: 2 + Math.floor(r() * (RH - 3)), type: th.decals[Math.floor(r() * th.decals.length)] });
    // node footprints
    rm.foot = {}; rm.nodes.forEach(n => { const [x, y] = rm.pos[n.id]; const f = n.type === 'shop' ? [[x - 1, y], [x, y], [x + 1, y]] : n.type === 'main' ? [[x - 1, y], [x, y], [x + 1, y]] : [[x, y]]; rm.foot[n.id] = f; });
    // connectivity: drop props until doors and every node are reachable
    for (let guard = 0; guard < 60; guard++) {
      const ok = reachAll(rm); if (ok || !rm.props.length) break;
      const p = rm.props.splice(Math.floor(r() * rm.props.length), 1)[0]; bl[p.y * RW + p.x] = 0;
    }
    rm.lights = rm.props.filter(p => PIX.LIGHT[p.type]).map(p => { const L = PIX.LIGHT[p.type]; return { x: p.x * T + 8 + L[0], y: (p.y + 1) * T - 2 + L[1], r: L[2], col: L[3] || th.acc }; });
    rm.wins = [];
    if (th.wall === 'brick') for (let x = 1; x < RW; x += 3) if (!rm.doors.n || Math.abs(x - LV.mx + .5) > 1.5) { rm.lights.push({ x: x * T + 8, y: 2 * T + 2, r: 30, col: '#ffcf7a' }); rm.wins.push({ x: x * T + 4, y: 23, w: 8, col: '#ffcf7a' }); }
    if (th.wall === 'glass') for (let x = 0; x < RW; x += 2) rm.wins.push({ x: x * T + 4, y: 29, w: 8, col: ['#ff4d8d', '#4a8aff', '#ffcf6a', '#8a4aff', '#4affc8'][x % 5] });
    if (th.wall === 'shoji') for (let x = 2; x < RW; x += 5) rm.wins.push({ x: x * T, y: 21, w: 14, col: '#fff0d8' });
    if (th.wall === 'panel') for (let x = 1; x < RW; x += 3) rm.wins.push({ x: x * T + 6, y: 14, w: 4, col: '#ffb04a' });
    if (th.wall === 'glass') for (let x = 0; x < RW; x += 2) rm.lights.push({ x: x * T + 8, y: 2 * T, r: 26, col: ['#ff4d8d', '#4a8aff', '#8a4aff'][x % 3] });
    rm.static = renderStatic(rm, r);
  }
  function blockedFn(rm, info) {
    const { RW, RH } = LV, extra = new Set();
    rm.nodes.forEach(n => { if (!info || info.vis.has(n.id)) rm.foot[n.id].forEach(([x, y]) => extra.add(y * RW + x)); });
    if (info) Object.entries(rm.doors).forEach(([d, k]) => { if (!open(LV.rooms.get(k), info)) doorTiles(rm, d).forEach(([x, y]) => extra.add(y * RW + x)); });
    return (x, y) => x < 0 || y < 0 || x >= RW || y >= RH || rm.bl[y * RW + x] === 1 || extra.has(y * RW + x);
  }
  function reachAll(rm) {
    const { RW, mx, my } = LV, B = blockedFn(rm, null);
    let start = null; for (const d of Object.keys(rm.doors)) { const t = doorTiles(rm, d).find(t => !B(...t)); if (t) { start = t; break; } }
    if (!start) for (let rr = 0; rr < 6 && !start; rr++) for (let y = -rr; y <= rr && !start; y++) for (let x = -rr; x <= rr; x++) if (!B(mx + x, my + y)) { start = [mx + x, my + y]; break; }
    if (!start) return false;
    const seen = new Uint8Array(RW * LV.RH), q = [start]; seen[start[1] * RW + start[0]] = 1;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (B(nx, ny) || seen[ny * RW + nx]) continue; seen[ny * RW + nx] = 1; q.push([nx, ny]); } }
    for (const d of Object.keys(rm.doors)) if (!doorTiles(rm, d).some(([x, y]) => seen[y * RW + x])) return false;
    for (const n of rm.nodes) if (!rm.foot[n.id].some(([x, y]) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen[(y + dy) * RW + x + dx]))) return false;
    return true;
  }
  function renderStatic(rm, r) {
    const { RW, RH, th, mx, my } = LV, c = PIX.mk(RW * T, RH * T), g = c.getContext('2d');
    MOD.paintFloor(g, th, RW, RH, r, { mx, my, doors: rm.doors });
    rm.decals.forEach(d => PIX.decal(g, th, d.type, d.x * T, d.y * T, r));
    for (let x = 0; x < RW; x++) PIX.wallFace(g, th, x * T, 0, x, r);
    MOD.wallPass(g, RW * T, th, r);
    // ambient occlusion under the top wall
    { const gr = g.createLinearGradient(0, 2 * T, 0, 2 * T + 14); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.4, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 2 * T, RW * T, 14); }
    // side & bottom walls (seen from above: just the wall top)
    const capW = (x, y, w, h) => { g.fillStyle = th.cap; g.fillRect(x, y, w, h); };
    capW(0, 2 * T, 10, (RH - 2) * T); g.fillStyle = PIX.shade(th.cap, .3); g.fillRect(9, 2 * T, 1, (RH - 2) * T);
    capW(RW * T - 10, 2 * T, 10, (RH - 2) * T); g.fillStyle = PIX.shade(th.cap, .3); g.fillRect(RW * T - 10, 2 * T, 1, (RH - 2) * T);
    capW(0, RH * T - 8, RW * T, 8); g.fillStyle = PIX.shade(th.cap, .3); g.fillRect(0, RH * T - 8, RW * T, 1);
    { const gl = g.createLinearGradient(10, 0, 22, 0); gl.addColorStop(0, 'rgba(0,0,0,.45)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(10, 2 * T, 12, (RH - 2) * T - 8);
      const gr2 = g.createLinearGradient(RW * T - 10, 0, RW * T - 22, 0); gr2.addColorStop(0, 'rgba(0,0,0,.45)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(RW * T - 22, 2 * T, 12, (RH - 2) * T - 8);
      const gb = g.createLinearGradient(0, RH * T - 8, 0, RH * T - 18); gb.addColorStop(0, 'rgba(0,0,0,.4)'); gb.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gb; g.fillRect(0, RH * T - 18, RW * T, 10);
      g.fillStyle = PIX.shade(th.cap, .18); g.fillRect(0, 2 * T, 1, (RH - 2) * T); g.fillRect(RW * T - 1, 2 * T, 1, (RH - 2) * T); }
    // door openings
    Object.keys(rm.doors).forEach(d => {
      if (d === 'n') { g.drawImage(c, (mx - 1) * T, 2 * T, 2 * T, 2 * T, (mx - 1) * T, 0, 2 * T, 2 * T); const gr = g.createLinearGradient(0, 0, 0, 2 * T); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect((mx - 1) * T, 0, 2 * T, 2 * T); g.fillStyle = th.w[2]; g.fillRect((mx - 1) * T - 3, 0, 3, 2 * T); g.fillRect((mx + 1) * T, 0, 3, 2 * T); g.fillStyle = th.cap; g.fillRect((mx - 1) * T - 3, 0, 2 * T + 6, 3); }
      if (d === 's') { g.drawImage(c, (mx - 1) * T, (RH - 2) * T, 2 * T, T, (mx - 1) * T, (RH - 1) * T, 2 * T, T); const gr = g.createLinearGradient(0, (RH - 1) * T, 0, RH * T); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.95)'); g.fillStyle = gr; g.fillRect((mx - 1) * T, (RH - 1) * T, 2 * T, T); }
      if (d === 'w' || d === 'e') { const x = d === 'w' ? 0 : RW - 1; g.drawImage(c, (d === 'w' ? 1 : RW - 2) * T, (my - 1) * T, T, 2 * T, x * T, (my - 1) * T, T, 2 * T); const gr = g.createLinearGradient(x * T, 0, (x + 1) * T, 0); gr.addColorStop(d === 'w' ? 0 : 1, 'rgba(0,0,0,.95)'); gr.addColorStop(d === 'w' ? 1 : 0, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x * T, (my - 1) * T, T, 2 * T); g.fillStyle = th.cap; g.fillRect(x * T, (my - 1) * T - 3, T, 3); g.fillRect(x * T, (my + 1) * T, T, 3); }
    });
    return c;
  }

  // ---------------- state helpers ----------------
  const cur = () => LV.rooms.get(LV.cur);
  function open(rm, info) { if (!rm) return false; if (!rm.nodes.length) return true; return rm.nodes.some(n => info.vis.has(n.id)); }
  const center = (x, y) => ({ x: x * T + 8, y: y * T + 12 });
  function freeNear(rm, B, tx, ty, from) {
    const cands = []; for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) { const x = tx + dx, y = ty + dy; if (!B(x, y)) cands.push([x, y]); }
    if (!cands.length) return null; if (!from) return cands[0];
    cands.sort((a, c) => ((a[0] - from[0]) ** 2 + (a[1] - from[1]) ** 2) - ((c[0] - from[0]) ** 2 + (c[1] - from[1]) ** 2)); return cands[0];
  }
  function placeAt(id) {
    if (!LV) return;
    const k = id && LV.nodeRoom[id]; if (k) LV.cur = k;
    const rm = cur(); const B = blockedFn(rm, null);
    let t = null;
    if (k) { const [nx, ny] = rm.pos[id]; for (const c of [[nx, ny + 2], [nx - 2, ny + 1], [nx + 2, ny + 1], [nx, ny - 2]]) if (!B(...c)) { t = c; break; } if (!t) for (const [x, y] of rm.foot[id]) { t = freeNear(rm, B, x, y); if (t) break; } }
    if (!t) { t = [LV.mx, LV.my]; if (B(...t)) { outer: for (let rr = 1; rr < 8; rr++) for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (!B(LV.mx + x, LV.my + y)) { t = [LV.mx + x, LV.my + y]; break outer; } } }
    const c = center(...t); LV.p = { x: c.x, y: c.y, dir: 0 }; LV.path = []; LV.goal = null; LV.trail = []; const side = B(t[0] - 1, t[1]) ? 1 : -1; for (let i = 10; i > 0; i--) LV.trail.push({ x: c.x + side * i * 6, y: c.y - (i > 4 ? 4 : 0), dir: 0 }); LV.seen.add(LV.cur); LV.fade = 1;
  }
  function path(rm, B, from, to) {
    const { RW, RH } = LV; if (B(...to)) return null;
    const prev = new Int32Array(RW * RH).fill(-1), q = [from], st = from[1] * RW + from[0]; prev[st] = st;
    while (q.length) {
      const [x, y] = q.shift(); if (x === to[0] && y === to[1]) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy; if (B(nx, ny) || prev[ny * RW + nx] !== -1) continue;
        if (dx && dy && (B(x + dx, y) || B(x, y + dy))) continue;
        prev[ny * RW + nx] = y * RW + x; q.push([nx, ny]);
      }
    }
    const end = to[1] * RW + to[0]; if (prev[end] === -1) return null;
    const out = []; let i = end; while (i !== st) { out.unshift([i % RW, Math.floor(i / RW)]); i = prev[i]; } return out;
  }
  const tileOf = (x, y) => [Math.floor(x / T), Math.floor((y - 4) / T)];

  // ---------------- input ----------------
  function tap(cx, cy, info) {
    if (!LV || LV.fade > .4) return;
    info.vis = new Set(info.visible.map(n => n.id));
    const bx = (cx - LV.ox) / LV.s, by = (cy - LV.oy) / LV.s, rm = cur(), B = blockedFn(rm, info), me = tileOf(LV.p.x, LV.p.y);
    // objects
    let hit = null, hd = 1e9;
    rm.nodes.forEach(n => { if (!info.vis.has(n.id)) return; const [x, y] = rm.pos[n.id], nx = x * T + 8, ny = (y + 1) * T; const w = n.type === 'main' || n.type === 'shop' ? 22 : 13; if (Math.abs(bx - nx) < w && by > ny - 38 && by < ny + 6) { const d = Math.abs(bx - nx) + Math.abs(by - ny + 12); if (d < hd) { hd = d; hit = n; } } });
    if (hit) {
      let bestT = null, bp = null;
      rm.foot[hit.id].forEach(([x, y]) => [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => { const t = [x + dx, y + dy]; if (B(...t)) return; if (t[0] === me[0] && t[1] === me[1]) { bestT = t; bp = []; return; } if (bp && !bp.length) return; const p = path(rm, B, me, t); if (p && (!bp || p.length < bp.length)) { bp = p; bestT = t; } }));
      if (bp) { LV.path = bp; LV.goal = { node: hit, at: rm.pos[hit.id] }; ping(hit, rm); AUDIO.sfx('step'); }
      return;
    }
    // doors
    let [tx, ty] = [Math.floor(bx / T), Math.floor(by / T)];
    for (const d of Object.keys(rm.doors)) {
      const tiles = doorTiles(rm, d); const nearDoor = tiles.some(([x, y]) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1);
      if (nearDoor) {
        if (!open(LV.rooms.get(rm.doors[d]), info)) { AUDIO.sfx('deny'); toastLocked(); return; }
        const edge = tiles.filter(([x, y]) => d === 'n' ? y === 0 : true).sort((a, c) => Math.abs(a[0] - me[0]) + Math.abs(a[1] - me[1]) - Math.abs(c[0] - me[0]) - Math.abs(c[1] - me[1]))[0];
        const p = path(rm, B, me, edge); if (p) { LV.path = p; LV.goal = { door: d }; LV.ping = { x: edge[0] * T + 8, y: edge[1] * T + 8, t: 0 }; AUDIO.sfx('step'); }
        if (p && !p.length) { LV.goal = { door: d }; }
        return;
      }
    }
    tx = Math.max(1, Math.min(LV.RW - 2, tx)); ty = Math.max(2, Math.min(LV.RH - 2, ty));
    let target = [tx, ty]; if (B(...target)) { let best = null, bd = 99; for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) if (!B(x, y)) { const d = Math.abs(x - tx) + Math.abs(y - ty); if (d < bd) { bd = d; best = [x, y]; } } target = best; }
    if (!target) return;
    const p = path(rm, B, me, target); if (p) { LV.path = p; LV.goal = null; LV.ping = { x: target[0] * T + 8, y: target[1] * T + 10, t: 0 }; }
  }
  let lockT = 0; function toastLocked() { if (performance.now() - lockT < 1500) return; lockT = performance.now(); const t = document.getElementById('toasts'); if (!t) return; const d = document.createElement('div'); d.className = 'toast'; d.textContent = 'Questa zona non è ancora raggiungibile'; t.appendChild(d); setTimeout(() => d.remove(), 2200); }
  function ping(n, rm) { const [x, y] = rm.pos[n.id]; LV.ping = { x: x * T + 8, y: (y + 1) * T - 2, t: 0 }; }

  // ---------------- update ----------------
  function update(dt, info) {
    if (!LV) return null;
    info.vis = new Set(info.visible.map(n => n.id));
    if (LV.fade > 0) LV.fade = Math.max(0, LV.fade - dt * 3.2);
    const p = LV.p; LV.walking = false;
    if (LV.big) { stepFx(dt); return null; }
    const mv = moveVec();
    if (mv && !(LV.entering && LV.path.length)) {
      LV.path = []; LV.goal = null; LV.entering = false; freeMove(mv, dt, info);
    } else if (LV.path.length) {
      const [tx, ty] = LV.path[0], c = center(tx, ty), dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy), sp = 66 * dt;
      if (Math.abs(dx) > Math.abs(dy) + .5) p.dir = dx > 0 ? 2 : 3; else if (d > .5) p.dir = dy > 0 ? 0 : 1;
      if (d <= sp) { p.x = c.x; p.y = c.y; LV.path.shift(); if (!LV.path.length) LV.entering = false; } else { p.x += dx / d * sp; p.y += dy / d * sp; }
      LV.walking = true; LV.trail.push({ x: p.x, y: p.y, dir: p.dir }); if (LV.trail.length > 400) LV.trail.splice(0, 100);
      if (LV.path.length % 3 === 0 && d <= sp) AUDIO.sfx('step');
    } else if (LV.goal) {
      const g = LV.goal; LV.goal = null;
      if (g.node) { const [x, y] = g.at, me = tileOf(p.x, p.y); const dx = x - me[0], dy = y - me[1]; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1); return g.node; }
      if (g.door) changeRoom(g.door, info);
    }
    stepFx(dt);
    return null;
  }
  function changeRoom(d, info) {
    const rm = cur(), k = rm.doors[d], nr = LV.rooms.get(k); if (!nr || !open(nr, info)) return;
    LV.cur = k; LV.seen.add(k); LV.fade = 1; AUDIO.sfx('door');
    const { mx, my, RW, RH } = LV, back = OPP[d];
    const entry = { n: [[mx - 1, 2], 1], s: [[mx - 1, RH - 2], 0], w: [[1, my - 1], 3], e: [[RW - 2, my - 1], 2] }[back];
    // walk two tiles inwards from the doorway
    const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[back];
    const t0 = entry[0], t1 = [t0[0] + inward[0], t0[1] + inward[1]];
    const c0 = center(...t0); LV.p = { x: c0.x - inward[0] * 24, y: c0.y - inward[1] * 24, dir: { n: 0, s: 1, w: 2, e: 3 }[back] };
    LV.trail = []; for (let i = 6; i > 0; i--) LV.trail.push({ x: LV.p.x - inward[0] * i * 6, y: LV.p.y - inward[1] * i * 6, dir: LV.p.dir });
    const B = blockedFn(nr, info); LV.path = B(...t1) ? [t0] : [t0, t1]; LV.goal = null; LV.fx = []; LV.entering = true;
  }

  // ---------------- particles ----------------
  function stepFx(dt) {
    const { th } = LV, w = buf.width, h = buf.height, fx = LV.fx, kind = th.fx;
    const want = { fireflies: 14, embers: 22, rain: 70, snow: 60, petals: 24, motes: 26 }[kind] || 0;
    while (fx.length < want) fx.push({ x: Math.random() * w, y: Math.random() * h, v: Math.random(), t: Math.random() * 10 });
    fx.forEach(p => {
      p.t += dt;
      if (kind === 'rain') { p.x -= 50 * dt; p.y += 260 * dt; } else if (kind === 'snow') { p.y += (10 + p.v * 14) * dt; p.x += Math.sin(p.t + p.v * 6) * 8 * dt; }
      else if (kind === 'petals') { p.y += (12 + p.v * 10) * dt; p.x += (Math.sin(p.t * 1.5 + p.v * 6) * 14 + 6) * dt; }
      else if (kind === 'embers') { p.y -= (12 + p.v * 18) * dt; p.x += Math.sin(p.t * 2 + p.v * 9) * 6 * dt; }
      else { p.x += Math.sin(p.t * .7 + p.v * 9) * 7 * dt; p.y += Math.cos(p.t * .6 + p.v * 5) * 5 * dt - (kind === 'motes' ? 4 * dt : 0); }
      if (p.y > h + 4) { p.y = -4; p.x = Math.random() * w; } if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; } if (p.x < -4) p.x = w + 4; if (p.x > w + 4) p.x = -4;
    });
  }
  function drawFx(t) {
    const kind = LV.th.fx, b = fg;
    LV.fx.forEach(p => {
      if (kind === 'rain') { b.fillStyle = 'rgba(170,210,255,.45)'; b.fillRect(p.x | 0, p.y | 0, 1, 4); }
      else if (kind === 'snow') { b.fillStyle = '#ffffff'; b.fillRect(p.x | 0, p.y | 0, p.v > .7 ? 2 : 1, p.v > .7 ? 2 : 1); }
      else if (kind === 'petals') { b.fillStyle = p.v > .5 ? '#ffb0c8' : '#ff8aa8'; b.fillRect(p.x | 0, p.y | 0, 2, 1); }
      else if (kind === 'embers') { b.fillStyle = p.v > .5 ? '#ffb547' : '#ff6a2a'; b.globalAlpha = .5 + .5 * Math.sin(p.t * 5); b.fillRect(p.x | 0, p.y | 0, 1, 1); b.globalAlpha = 1; }
      else if (kind === 'fireflies') { const a = Math.max(0, Math.sin(p.t * 2 + p.v * 9)); if (a > .1) { b.globalAlpha = a; b.fillStyle = '#e8ff8a'; b.fillRect(p.x | 0, p.y | 0, 1, 1); b.globalAlpha = a * .35; b.fillRect((p.x | 0) - 1, (p.y | 0) - 1, 3, 3); b.globalAlpha = 1; } }
      else { b.globalAlpha = .6; b.fillStyle = p.v > .5 ? '#c08aff' : '#ffffff'; b.fillRect(p.x | 0, p.y | 0, 1, 1); b.globalAlpha = 1; }
    });
  }

  // ---------------- draw ----------------
  const lookOf = (id, def) => ART.LOOK[id] || (def ? Object.assign({}, ART.LOOK[def.base] || ART.LOOK.villager, def.color ? { cloth: def.color } : {}) : ART.LOOK.villager);
  function drawChar(img, x, y, dir) {
    x = Math.round(x); y = Math.round(y); img = MOD.volume(img, .8);
    b.fillStyle = 'rgba(0,0,0,.28)'; b.fillRect(x - 4, y - 1, 8, 2); b.fillRect(x - 2, y - 2, 4, 3);
    const ox2 = img.width >> 1, oy2 = img.height - 2; if (dir === 3) { b.save(); b.translate(x, 0); b.scale(-1, 1); b.drawImage(img, -ox2, y - oy2); b.restore(); } else b.drawImage(img, x - ox2, y - oy2);
  }
  function objectiveOf(info) { return info.visible.find(n => n.type === 'main' && !info.done(n)); }
  function roomRoute(fromK, toK, info) {
    if (fromK === toK) return null; const prev = { [fromK]: null }, q = [fromK];
    while (q.length) { const k = q.shift(); if (k === toK) break; const rm = LV.rooms.get(k); for (const [d, nk] of Object.entries(rm.doors)) { if (nk in prev || !open(LV.rooms.get(nk), info)) continue; prev[nk] = [k, d]; q.push(nk); } }
    if (!(toK in prev)) return null; let k = toK, d = null; while (prev[k] && prev[k][0] !== fromK) k = prev[k][0]; return prev[k] ? prev[k][1] : null;
  }
  function draw(ctx, t, dt, info) {
    if (!LV) return;
    info.vis = info.vis || new Set(info.visible.map(n => n.id));
    const rm = cur(), { th, RW, RH, s, ox, oy } = LV, fr4 = Math.floor(t * 8) % 4;
    b.imageSmoothingEnabled = false;
    b.drawImage(rm.static, 0, 0);
    const list = [], lights = rm.lights.map(L => ({ ...L })), shadows = [];
    rm.props.forEach(p => { const img = MOD.volume(PIX.propSprite(p.type, th, p.seed)), sx = p.x * T + 8 - 20, sy = (p.y + 1) * T - 2 - 46; shadows.push(() => MOD.shadowAt(b, img, sx, sy, .34, 2)); list.push({ y: (p.y + 1) * T - 2, f: () => b.drawImage(img, sx, sy) }); });
    const labels = [], me = LV.p;
    rm.nodes.forEach(n => {
      if (!info.vis.has(n.id)) return;
      const [x, y] = rm.pos[n.id], px = x * T + 8, py = (y + 1) * T - 2, done = info.done(n);
      const dist = Math.hypot(px - me.x, py - me.y);
      const lbl = { n, x: px, y: py - 36, near: dist < 60 };
      switch (n.type) {
        case 'main': shadows.push(() => MOD.shadowAt(b, PIX.nodeSprite('main', th, 0), px - 20, py - 46, .3, 2)); list.push({ y: py, f: () => { b.globalAlpha = done ? .55 : 1; b.drawImage(MOD.volume(PIX.nodeSprite('main', th, done ? 0 : Math.floor(t * 10) % 10), .7), px - 20, py - 46); b.globalAlpha = 1; } }); if (!done) lights.push({ x: px, y: py - 16, r: 52 + Math.sin(t * 3) * 3, col: '#ffd88a' }); lbl.y = py - 40; break;
        case 'lore': list.push({ y: py, f: () => b.drawImage(PIX.nodeSprite('lore', th, done ? 0 : Math.floor(t * 2) % 2), px - 20, py - 46) }); if (!done) lights.push({ x: px, y: py - 8, r: 26, col: '#c08aff' }); lbl.y = py - 22; break;
        case 'camp': shadows.push(() => MOD.shadowAt(b, PIX.nodeSprite('camp', th, 0), px - 20, py - 46, .25, 2)); list.push({ y: py, f: () => b.drawImage(MOD.volume(PIX.nodeSprite('camp', th, Math.floor(t * 9) % 3), .7), px - 20, py - 46) }); lights.push({ x: px, y: py - 6, r: 56 + Math.sin(t * 13) * 3 + Math.sin(t * 7) * 2, col: '#ff8a3a' }); lbl.y = py - 22; break;
        case 'shop': list.push({ y: py, f: () => { drawChar(PIX.charSprite('merchant', ART.LOOK.merchant, 0, 0), px, py - 7, 0); b.drawImage(PIX.nodeSprite('shop', th, 0), px - 20, py - 46); } }); lights.push({ x: px, y: py - 18, r: 40, col: '#ffcf7a' }); lbl.y = py - 34; break;
        case 'side': { const npc = info.npcFor(n); const id = npc ? npc.id : 'villager'; const L = lookOf(id, npc && npc.def); const dx = me.x - px, dy = me.y - py; const dir = dist > 70 ? 0 : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1); shadows.push(() => { const im = PIX.charSprite('npc_' + id, L, 0, 0); MOD.shadowAt(b, im, px - (im.width >> 1), py - im.height + 2, .3, 2); }); list.push({ y: py, f: () => { drawChar(PIX.charSprite('npc_' + id, L, dir === 3 ? 2 : dir, 0), px, py, dir); if (!done) b.drawImage(PIX.nodeSprite('bubble', th, 0), px - 20, py - 46 - 26 + Math.round(Math.sin(t * 5))); } }); lbl.y = py - 34; break; }
        case 'battle': { const e = info.enemiesFor(n)[0] || { look: 'soldier', color: '#ff6a6a' }; const ex = px + Math.round(Math.sin(t * 1.3 + x) * 9); const dir = Math.cos(t * 1.3 + x) > 0 ? 2 : 3; list.push({ y: py, f: () => { const img = MOD.volume(PIX.enemySprite(e.look, e.color || '#ff6a6a', fr4), .8); if (dir === 3) { b.save(); b.translate(ex, 0); b.scale(-1, 1); b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(-5, py - 1, 10, 2); b.drawImage(img, -(img.width / 2), py - (img.height - 2)); b.restore(); } else { b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(ex - 5, py - 1, 10, 2); b.drawImage(img, ex - img.width / 2, py - (img.height - 2)); } } }); lights.push({ x: ex, y: py - 10, r: 22, col: '#ff4a3a' }); lbl.x = ex; lbl.y = py - 34; break; }
      }
      labels.push(lbl);
    });
    // locked doors: gates
    Object.entries(rm.doors).forEach(([d, k]) => {
      if (open(LV.rooms.get(k), info)) return;
      doorTiles(rm, d).forEach(([x, y]) => { if (d === 'n' && y === 0) return; list.push({ y: (y + 1) * T - 1, f: () => { b.fillStyle = '#2a2430'; const vx = x * T, vy = y * T - (d === 'n' ? 8 : 6); for (let i = 1; i < 16; i += 4) { b.fillRect(vx + i, vy, 2, 22); b.fillStyle = '#6a6474'; b.fillRect(vx + i, vy, 1, 22); b.fillStyle = '#2a2430'; } b.fillRect(vx, vy + 2, 16, 2); b.fillRect(vx, vy + 16, 16, 2); } }); });
    });
    // party
    const party = info.party.slice(0, 5), trail = LV.trail;
    party.forEach((id, i) => {
      let pos = me;
      if (i > 0) { let need = i * 15, k = trail.length - 1, acc = 0, prev = me; pos = trail.length ? trail[0] : me; while (k >= 0) { const q = trail[k]; acc += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; if (acc >= need) { pos = q; break; } k--; } if (k < 0 && trail.length) pos = trail[0]; }
      const L = lookOf(id); const dir = pos.dir ?? 0; const fr = LV.walking ? (fr4 + i) % 4 : 0;
      const spr = PIX.charSprite(id, L, dir === 3 ? 2 : dir, fr); shadows.push(() => MOD.shadowAt(b, spr, Math.round(pos.x) - (spr.width >> 1), Math.round(pos.y) - spr.height + 2, .3, 2, dir === 3));
      list.push({ y: pos.y + (i ? -.1 * i : 0), f: () => drawChar(spr, pos.x, pos.y, dir) });
      if (id === 'nuvola') lights.push({ x: pos.x, y: pos.y - 14, r: 30, col: '#bfe0ff' });
    });
    lights.push({ x: me.x, y: me.y - 10, r: 64, col: null });
    shadows.forEach(f => f());
    list.sort((a, c) => a.y - c.y).forEach(o => o.f());
    // tap marker
    if (LV.ping) { LV.ping.t += dt; const a = 1 - LV.ping.t / .5; if (a <= 0) LV.ping = null; else { b.globalAlpha = a; b.fillStyle = '#ffe6a0'; const rr = Math.round(3 + LV.ping.t * 10); b.fillRect(LV.ping.x - rr, LV.ping.y, 2, 1); b.fillRect(LV.ping.x + rr - 1, LV.ping.y, 2, 1); b.fillRect(LV.ping.x, LV.ping.y - Math.round(rr / 2), 1, 1); b.fillRect(LV.ping.x, LV.ping.y + Math.round(rr / 2), 1, 1); b.globalAlpha = 1; } }
    // particelle e frecce: livello sopra la luce
    fg.clearRect(0, 0, fxc.width, fxc.height); drawFx(t);
    const bb = b;
    // objective arrow (pixel)
    const obj = objectiveOf(info);
    if (obj) {
      const ok = LV.nodeRoom[obj.id]; const bob = Math.round(Math.sin(t * 5) * 2);
      const arrow = (x, y, d) => { const b = fg; b.fillStyle = '#ffd84a'; const pts = { s: [[0, 0, 7, 1], [1, 1, 5, 1], [2, 2, 3, 1], [3, 3, 1, 1]], n: [[3, 0, 1, 1], [2, 1, 3, 1], [1, 2, 5, 1], [0, 3, 7, 1]], e: [[0, 0, 1, 7], [1, 1, 1, 5], [2, 2, 1, 3], [3, 3, 1, 1]], w: [[3, 0, 1, 7], [2, 1, 1, 5], [1, 2, 1, 3], [0, 3, 1, 1]] }[d]; b.fillStyle = '#120c18'; pts.forEach(([a, c, w, h]) => b.fillRect(x + a - 1, y + c - 1, w + 2, h + 2)); b.fillStyle = '#ffd84a'; pts.forEach(([a, c, w, h]) => b.fillRect(x + a, y + c, w, h)); };
      if (ok === LV.cur) { const [x, y] = rm.pos[obj.id]; if (Math.hypot(x * T + 8 - me.x, (y + 1) * T - me.y) > 40) arrow(x * T + 5, (y + 1) * T - 58 + bob, 's'); }
      else { const d = roomRoute(LV.cur, ok, info); if (d) { const { mx, my } = LV; const pos = { n: [mx * T - 4, 2 * T + 4 + bob, 'n'], s: [mx * T - 4, (RH - 2) * T + 4 - bob, 's'], w: [T + 4 + bob, my * T - 4, 'w'], e: [(RW - 1) * T - 8 - bob, my * T - 4, 'e'] }[d]; arrow(...pos); } }
    }
    // to screen
    ctx.save();
    ctx.fillStyle = th.cap; ctx.fillRect(0, 0, LV.W, LV.H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(buf, ox, oy, buf.width * s, buf.height * s);
    MOD.depth(ctx, LV, buf);
    MOD.lights(ctx, LV, lights, t, th);
    MOD.rays(ctx, LV, rm.wins || [], t);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(fxc, ox, oy, fxc.width * s, fxc.height * s);
    MOD.grade(ctx, LV, th, t, dt);
    // labels (hi-res for legibility)
    ctx.textAlign = 'center'; ctx.font = '600 11px Georgia';
    labels.forEach(L => {
      const isObj = obj && L.n.id === obj.id; if (!L.near && !isObj) return;
      const x = ox + L.x * s, y = oy + L.y * s; const txt = L.n.name + (info.done(L.n) && L.n.type !== 'shop' && L.n.type !== 'camp' && !L.n.repeat ? ' ✓' : ''); const w = ctx.measureText(txt).width + 14;
      ctx.fillStyle = 'rgba(12,8,20,.78)'; ctx.fillRect(x - w / 2, y - 15, w, 18); ctx.fillStyle = isObj ? '#ffd84a' : '#f4ecdf'; ctx.fillRect(x - w / 2, y + 3, w, 1); ctx.fillText(txt, x, y - 2);
    });
    drawMinimap(ctx, info, obj, t);
    drawControls(ctx, info, t);
    if (LV.big) drawBig(ctx, info, obj, t);
    if (LV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${LV.fade})`; ctx.fillRect(0, 0, LV.W, LV.H); }
    ctx.restore();
  }
  function drawMinimap(ctx, info, obj, t) {
    const sf = safe(), cw = 13, chh = 9, gap = 4, land = LV.W > LV.H;
    const x0 = (land ? Math.max(LV.ox + 6, sf.l + 8) : LV.ox + 14), y0 = land ? Math.max(LV.oy + 6, sf.t + 8) : LV.oy + LV.RH * PIX.T * LV.s - (12 + 3 * chh + 2 * gap) - 14;
    const P = (cx, cy) => [x0 + 6 + cx * (cw + gap), y0 + 6 + cy * (chh + gap)];
    const mw = 12 + 3 * cw + 2 * gap, mh = 12 + 3 * chh + 2 * gap; LV.mm = { x: x0, y: y0, w: mw, h: mh };
    ctx.fillStyle = 'rgba(10,8,18,.62)'; ctx.fillRect(x0, y0, mw, mh);
    ctx.fillStyle = 'rgba(255,230,160,.55)'; ctx.font = '600 9px Georgia'; ctx.textAlign = 'left'; ctx.fillText('MAPPA ⤢', x0 + 2, y0 + mh + 11);
    ctx.fillStyle = 'rgba(255,230,160,.25)';
    LV.rooms.forEach(rm => Object.entries(rm.doors).forEach(([d, k]) => { if (d !== 'e' && d !== 's') return; const [x, y] = P(rm.cx, rm.cy); if (d === 'e') ctx.fillRect(x + cw, y + chh / 2 - 1, gap, 2); else ctx.fillRect(x + cw / 2 - 1, y + chh, 2, gap); }));
    const objK = obj && LV.nodeRoom[obj.id];
    LV.rooms.forEach(rm => {
      const [x, y] = P(rm.cx, rm.cy), isCur = rm.k === LV.cur, op = open(rm, info);
      ctx.fillStyle = isCur ? '#ffe6a0' : !op ? '#2a2234' : LV.seen.has(rm.k) ? '#7a6c98' : '#463c5a'; ctx.fillRect(x, y, cw, chh);
      if (!op) { ctx.fillStyle = '#5a5068'; ctx.fillRect(x + 5, y + 3, 3, 3); }
      if (rm.k === objK && !isCur) { ctx.fillStyle = `rgba(255,216,74,${.6 + .4 * Math.sin(t * 5)})`; ctx.fillRect(x + 4, y + 2, 5, 5); }
      if (isCur) { ctx.fillStyle = '#1a1024'; ctx.fillRect(x + 5, y + 3, 3, 3); }
    });
  }

  // ---------------- joystick / tastiera / azione ----------------
  const KEYS = { x: 0, y: 0 };
  function moveVec() {
    if (LV.stick && LV.stick.on) { const dx = LV.stick.x - LV.stick.sx, dy = LV.stick.y - LV.stick.sy, d = Math.hypot(dx, dy); if (d < 6) return null; const m = Math.min(1, Math.max(.45, d / 44)); return { x: dx / d * m, y: dy / d * m }; }
    if (KEYS.x || KEYS.y) { const d = Math.hypot(KEYS.x, KEYS.y); return { x: KEYS.x / d, y: KEYS.y / d }; }
    return null;
  }
  function feetFree(B, x, y) { for (const [ax, ay] of [[-4, -2], [4, -2], [-4, 2], [4, 2]]) { const [tx, ty] = tileOf(x + ax, y + ay); if (B(tx, ty)) return false; } return true; }
  function freeMove(v, dt, info) {
    const p = LV.p, rm = cur(), B = blockedFn(rm, info), sp = 70 * dt;
    const nx = p.x + v.x * sp, ny = p.y + v.y * sp; let moved = 0;
    if (feetFree(B, nx, p.y)) { moved += Math.abs(nx - p.x); p.x = nx; }
    if (feetFree(B, p.x, ny)) { moved += Math.abs(ny - p.y); p.y = ny; }
    if (Math.abs(v.x) > Math.abs(v.y)) p.dir = v.x > 0 ? 2 : 3; else p.dir = v.y > 0 ? 0 : 1;
    LV.walking = moved > 0.05;
    if (LV.walking) { LV.trail.push({ x: p.x, y: p.y, dir: p.dir }); if (LV.trail.length > 400) LV.trail.splice(0, 100); LV.stepAcc = (LV.stepAcc || 0) + moved; if (LV.stepAcc > 22) { LV.stepAcc = 0; AUDIO.sfx('step'); } }
    // porte
    const [tx, ty] = tileOf(p.x, p.y);
    for (const d of Object.keys(rm.doors)) {
      const onDoor = doorTiles(rm, d).some(([x, y]) => x === tx && y === ty); if (!onDoor) continue;
      const push = d === 'n' ? v.y < -.3 && ty <= 1 : d === 's' ? v.y > .3 && ty >= LV.RH - 1 : d === 'w' ? v.x < -.3 && tx <= 0 : v.x > .3 && tx >= LV.RW - 1;
      if (push) { changeRoom(d, info); return; }
    }
    // porta chiusa: avviso quando ci si spinge contro
    if (moved < .05) for (const d of Object.keys(rm.doors)) { if (open(LV.rooms.get(rm.doors[d]), info)) continue; const near = doorTiles(rm, d).some(([x, y]) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1); if (near) { toastLocked(); break; } }
  }
  function nearNode(info) {
    if (!LV || LV.path.length) return null; const rm = cur(), me = tileOf(LV.p.x, LV.p.y); let best = null, bd = 99;
    rm.nodes.forEach(n => { if (!info.vis.has(n.id)) return; rm.foot[n.id].forEach(([x, y]) => { const d = Math.max(Math.abs(x - me[0]), Math.abs(y - me[1])); if (d <= 1 && d < bd) { bd = d; best = n; } }); });
    return best;
  }
  const VERB = { main: 'Entra', side: 'Parla', lore: 'Esamina', camp: 'Riposa', shop: 'Compra', battle: 'Combatti' };
  function act(info) {
    if (!LV || LV.big) return false; info.vis = new Set(info.visible.map(n => n.id)); const n = nearNode(info); if (!n) return false;
    LV.path = []; LV.goal = { node: n, at: cur().pos[n.id] }; ping(n, cur()); return true;
  }
  function actBtn() { const sf = safe(); const r = 30; return { x: LV.W - Math.max(sf.r, 0) - r - 22, y: LV.H - r - 22, r }; }
  function drawControls(ctx, info, t) {
    if (LV.big) return;
    const st = LV.stick;
    if (st && st.on) {
      ctx.globalAlpha = .5; ctx.fillStyle = 'rgba(10,8,18,.6)'; ctx.beginPath(); ctx.arc(st.sx, st.sy, 44, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,160,.5)'; ctx.lineWidth = 2; ctx.stroke();
      const dx = st.x - st.sx, dy = st.y - st.sy, d = Math.hypot(dx, dy), k = d > 44 ? 44 / d : 1;
      ctx.globalAlpha = .85; ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.arc(st.sx + dx * k, st.sy + dy * k, 18, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    const n = nearNode(info); LV.actN = n;
    if (n) {
      const b0 = actBtn(), pulse = 1 + Math.sin(t * 5) * .04;
      ctx.fillStyle = 'rgba(12,8,20,.8)'; ctx.beginPath(); ctx.arc(b0.x, b0.y, b0.r * pulse, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.textAlign = 'center'; ctx.font = '700 12px Georgia'; ctx.fillText(VERB[n.type] || 'Vai', b0.x, b0.y + 4);
    }
    if (LV.hintT == null) { let used = false; try { used = !!localStorage.getItem('ra_stick'); } catch (e) { } LV.hintT = used ? 0 : 7; }
    if (LV.hintT > 0) { LV.hintT -= 1 / 60; ctx.globalAlpha = Math.min(1, LV.hintT); const txt = 'Trascina il dito per muoverti · tocca un punto per andarci'; ctx.font = '600 12px Georgia'; ctx.textAlign = 'center'; const w = ctx.measureText(txt).width + 20; ctx.fillStyle = 'rgba(12,8,20,.78)'; ctx.fillRect(LV.W / 2 - w / 2, LV.H - 40, w, 24); ctx.fillStyle = '#f4ecdf'; ctx.fillText(txt, LV.W / 2, LV.H - 24); ctx.globalAlpha = 1; }
  }
  const inR = (x, y, r) => r && x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 6 && y <= r.y + r.h + 16;
  function pointer(type, x, y, info) {
    if (!LV) return;
    if (type === 'down') { LV.stick = { sx: x, sy: y, x, y, on: false, t: performance.now() }; return; }
    const st = LV.stick; if (!st) return;
    if (type === 'move') {
      st.x = x; st.y = y;
      if (!st.on && !LV.big && Math.hypot(x - st.sx, y - st.sy) > 14) { st.on = true; LV.hintT = Math.min(LV.hintT || 0, .5); try { localStorage.setItem('ra_stick', '1'); } catch (e) { } }
      return;
    }
    if (type === 'cancel') { LV.stick = null; return; }
    // up
    LV.stick = null; if (st.on) return;
    if (LV.big) return bigTap(x, y, info);
    if (inR(x, y, LV.mm)) { LV.big = true; AUDIO.sfx('map'); return; }
    const b0 = LV.actN && actBtn(); if (b0 && Math.hypot(x - b0.x, y - b0.y) < b0.r + 8) { act(info); return; }
    tap(x, y, info);
  }
  function keyIn(code, down, info) {
    if (!LV) return false;
    const m = { ArrowLeft: ['x', -1], KeyA: ['x', -1], ArrowRight: ['x', 1], KeyD: ['x', 1], ArrowUp: ['y', -1], KeyW: ['y', -1], ArrowDown: ['y', 1], KeyS: ['y', 1] }[code];
    if (m) { KEYS[m[0]] = down ? m[1] : (KEYS[m[0]] === m[1] ? 0 : KEYS[m[0]]); return true; }
    if (!down) return false;
    if (code === 'KeyM' || code === 'Tab') { LV.big = !LV.big; AUDIO.sfx('map'); return true; }
    if (code === 'Escape' && LV.big) { LV.big = false; return true; }
    if (code === 'Enter' || code === 'Space' || code === 'KeyE') return act(info);
    return false;
  }
  function releaseKeys() { KEYS.x = KEYS.y = 0; if (LV) LV.stick = null; }

  // ---------------- mappa a schermo intero ----------------
  function bigLayout() {
    const sf = safe(), W = LV.W, H = LV.H, top = Math.max(sf.t, 0) + 46, bot = 18, side = Math.max(sf.l, sf.r, 0) + 20;
    const gap = 14, cw = Math.min(220, (W - side * 2 - gap * 2) / 3), ch = Math.min(130, (H - top - bot - gap * 2) / 3);
    const gw = cw * 3 + gap * 2, gh = ch * 3 + gap * 2;
    return { x0: (W - gw) / 2, y0: top + (H - top - bot - gh) / 2, cw, ch, gap, gw, gh };
  }
  const ICON = { main: '◆', side: '●', lore: '✧', camp: '▲', shop: '$', battle: '⚔' };
  function drawBig(ctx, info, obj, t) {
    const L = bigLayout(), objK = obj && LV.nodeRoom[obj.id];
    ctx.fillStyle = 'rgba(6,4,12,.9)'; ctx.fillRect(0, 0, LV.W, LV.H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe6a0'; ctx.font = '700 17px Georgia'; ctx.fillText(LV.ch.title, LV.W / 2, L.y0 - 18);
    ctx.font = '600 11px Georgia'; ctx.fillStyle = 'rgba(244,236,223,.6)'; ctx.fillText('Tocca una stanza già visitata per raggiungerla · tocca fuori per chiudere', LV.W / 2, L.y0 - 4);
    const P = rm => [L.x0 + rm.cx * (L.cw + L.gap), L.y0 + rm.cy * (L.ch + L.gap)];
    ctx.fillStyle = 'rgba(255,230,160,.35)';
    LV.rooms.forEach(rm => Object.entries(rm.doors).forEach(([d]) => { const [x, y] = P(rm); if (d === 'e') ctx.fillRect(x + L.cw, y + L.ch / 2 - 3, L.gap, 6); if (d === 's') ctx.fillRect(x + L.cw / 2 - 3, y + L.ch, 6, L.gap); }));
    LV.rooms.forEach(rm => {
      const [x, y] = P(rm), isCur = rm.k === LV.cur, op = open(rm, info), seen = LV.seen.has(rm.k), known = seen || rm.k === objK;
      ctx.fillStyle = isCur ? '#3a2e4e' : !op ? '#16121e' : seen ? '#2a2238' : '#1d1828'; ctx.fillRect(x, y, L.cw, L.ch);
      ctx.strokeStyle = isCur ? '#ffe6a0' : rm.k === objK ? `rgba(255,216,74,${.55 + .45 * Math.sin(t * 5)})` : 'rgba(255,230,160,.18)'; ctx.lineWidth = isCur || rm.k === objK ? 2 : 1; ctx.strokeRect(x + .5, y + .5, L.cw - 1, L.ch - 1);
      ctx.textAlign = 'left';
      if (!op) { ctx.fillStyle = 'rgba(244,236,223,.35)'; ctx.font = '600 12px Georgia'; ctx.textAlign = 'center'; ctx.fillText('🔒 Non ancora raggiungibile', x + L.cw / 2, y + L.ch / 2 + 4); return; }
      if (!known) { ctx.fillStyle = 'rgba(244,236,223,.35)'; ctx.font = '600 20px Georgia'; ctx.textAlign = 'center'; ctx.fillText('?', x + L.cw / 2, y + L.ch / 2 + 7); return; }
      const ns = rm.nodes.filter(n => info.vis.has(n.id)).sort((a, c) => (a.type === 'main' ? -1 : 0) - (c.type === 'main' ? -1 : 0));
      const lh = Math.min(17, (L.ch - 14) / Math.max(1, ns.length)); ctx.font = `600 ${Math.min(12, lh - 3)}px Georgia`;
      ns.forEach((n, i) => {
        const done = info.done(n), isObj = obj && n.id === obj.id;
        ctx.fillStyle = isObj ? '#ffd84a' : done ? 'rgba(244,236,223,.45)' : n.type === 'main' ? '#ffe6a0' : n.type === 'battle' ? '#ff8a7a' : n.type === 'lore' ? '#d0a8ff' : '#f4ecdf';
        let txt = (ICON[n.type] || '•') + ' ' + n.name + (done && n.type !== 'shop' && n.type !== 'camp' ? ' ✓' : '');
        while (ctx.measureText(txt).width > L.cw - 14 && txt.length > 4) txt = txt.slice(0, -2) + '…';
        ctx.fillText(txt, x + 8, y + 16 + i * lh);
      });
      if (!ns.length) { ctx.fillStyle = 'rgba(244,236,223,.35)'; ctx.font = 'italic 11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('passaggio', x + L.cw / 2, y + L.ch / 2 + 4); }
      if (isCur) { ctx.fillStyle = '#ffe6a0'; ctx.font = '700 10px Georgia'; ctx.textAlign = 'right'; ctx.fillText('SEI QUI', x + L.cw - 6, y + L.ch - 6); }
    });
    // pulsante chiudi
    const sf = safe(); LV.bigX = { x: LV.W - Math.max(sf.r, 0) - 44, y: Math.max(sf.t, 0) + 8, w: 34, h: 34 };
    ctx.fillStyle = 'rgba(255,230,160,.15)'; ctx.fillRect(LV.bigX.x, LV.bigX.y, 34, 34); ctx.fillStyle = '#ffe6a0'; ctx.font = '700 18px Georgia'; ctx.textAlign = 'center'; ctx.fillText('✕', LV.bigX.x + 17, LV.bigX.y + 23);
  }
  function bigTap(x, y, info) {
    const L = bigLayout();
    if (LV.bigX && x >= LV.bigX.x && x <= LV.bigX.x + 34 && y >= LV.bigX.y && y <= LV.bigX.y + 34) { LV.big = false; return; }
    const cx = Math.floor((x - L.x0) / (L.cw + L.gap)), cy = Math.floor((y - L.y0) / (L.ch + L.gap));
    const inside = x >= L.x0 && y >= L.y0 && x <= L.x0 + L.gw && y <= L.y0 + L.gh;
    const rm = inside && LV.rooms.get(key(cx, cy));
    if (!rm) { LV.big = false; return; }
    if (rm.k === LV.cur) { LV.big = false; return; }
    if (!LV.seen.has(rm.k) || !open(rm, info)) { AUDIO.sfx('deny'); return; }
    // viaggio rapido
    const first = rm.nodes.find(n => info.vis.has(n.id) && n.type === 'main') || rm.nodes.find(n => info.vis.has(n.id));
    LV.cur = rm.k; placeAt(first ? first.id : null); LV.big = false; AUDIO.sfx('door');
  }

  return { build, placeAt, update, draw, tap, pointer, key: keyIn, act, releaseKeys, get level() { return LV; } };
})();

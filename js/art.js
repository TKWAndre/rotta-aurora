// ROTTA D'AURORA — procedural 2D art: backgrounds, portraits, enemies
'use strict';
const ART = (() => {
  const TAU = Math.PI * 2;
  const rngOf = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = (h, a = 1) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };

  // ---------- primitives for silhouettes ----------
  function glowCircle(g, x, y, r, col, a = 1) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hex(col, a)); gr.addColorStop(1, hex(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function vgrad(g, y0, y1, stops) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s));
    return gr;
  }
  function windows(g, x, y, w, h, rng, col, density = .35) {
    const cw = Math.max(3, w / 6), ch = cw * 1.4;
    for (let yy = y + ch; yy < y + h - ch; yy += ch * 1.8) for (let xx = x + cw * .6; xx < x + w - cw; xx += cw * 1.6)
      if (rng() < density) { g.fillStyle = hex(col, .55 + rng() * .45); g.fillRect(xx, yy, cw, ch); glowCircle(g, xx + cw / 2, yy + ch / 2, cw * 2.2, col, .18); }
  }
  // Paris-like skyline with mansards, chimneys, lamp towers
  function cityParis(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col; let x = -20;
    while (x < w + 20) {
      const bw = 30 + rng() * 60, bh = maxH * (.35 + rng() * .65), top = base - bh;
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, top + 14); g.lineTo(x + 8, top); g.lineTo(x + bw - 8, top); g.lineTo(x + bw, top + 14); g.lineTo(x + bw, base); g.fill();
      for (let c = 0; c < 2; c++) if (rng() < .7) g.fillRect(x + 6 + rng() * (bw - 16), top - 10 - rng() * 8, 5, 14);
      if (rng() < .12) { // lamp tower
        const tx = x + bw / 2, th = maxH * .9;
        g.beginPath(); g.moveTo(tx - 10, top); g.lineTo(tx - 2, top - th); g.lineTo(tx + 2, top - th); g.lineTo(tx + 10, top); g.fill();
        glowCircle(g, tx, top - th, 26, light, .7); g.fillStyle = col;
      }
      windows(g, x, top + 12, bw, bh - 12, rng, light, .28); g.fillStyle = col;
      x += bw + rng() * 4;
    }
    g.fillRect(0, base, w, h - base);
  }
  function cityPagoda(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col; let x = -20;
    while (x < w + 20) {
      const bw = 40 + rng() * 60, tiers = 1 + (rng() * (rng() < .2 ? 5 : 2) | 0); let y = base;
      for (let i = 0; i < tiers; i++) {
        const tw = bw * (1 - i * .14), th = 16 + rng() * 10, cx = x + bw / 2;
        g.fillRect(cx - tw * .38, y - th, tw * .76, th);
        if (rng() < .6) { g.fillStyle = hex(light, .7); g.fillRect(cx - tw * .25, y - th * .7, tw * .5, th * .35); glowCircle(g, cx, y - th * .5, tw * .5, light, .12); g.fillStyle = col; }
        y -= th; g.beginPath(); g.moveTo(cx - tw * .62, y + 4); g.quadraticCurveTo(cx - tw * .3, y - 2, cx, y - 12); g.quadraticCurveTo(cx + tw * .3, y - 2, cx + tw * .62, y + 4); g.fill(); y -= 8;
      }
      if (tiers > 2) g.fillRect(x + bw / 2 - 1.5, y - 22, 3, 22);
      if (rng() < .3) { const lx = x + rng() * bw; g.strokeStyle = col; g.beginPath(); g.moveTo(lx, base); g.lineTo(lx, base - 30); g.stroke(); glowCircle(g, lx, base - 32, 12, '#ff5a3a', .8); }
      x += bw + 6 + rng() * 10;
    }
    g.fillRect(0, base, w, h - base);
  }
  function gothic(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col;
    const cx = w / 2;
    // central cathedral
    const bw = w * .5; g.fillRect(cx - bw / 2, base - maxH * .55, bw, maxH * .55);
    [[-.22, .95], [.22, .95], [0, 1.2], [-.4, .7], [.4, .7]].forEach(([ox, k]) => {
      const sx = cx + ox * w, sh = maxH * k;
      g.beginPath(); g.moveTo(sx - 18, base - maxH * .5); g.lineTo(sx - 18, base - sh * .7); g.lineTo(sx, base - sh); g.lineTo(sx + 18, base - sh * .7); g.lineTo(sx + 18, base - maxH * .5); g.fill();
    });
    // rose window
    const ry = base - maxH * .62; glowCircle(g, cx, ry, 70, light, .5);
    g.save(); g.translate(cx, ry); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.fillStyle = hex(i % 2 ? light : '#7a5cff', .55); g.beginPath(); g.ellipse(0, 18, 6, 16, 0, 0, TAU); g.fill(); } g.restore();
    g.fillStyle = col;
    for (let i = 0; i < 9; i++) { const ax = cx - bw / 2 + 20 + i * (bw - 40) / 8; g.fillStyle = hex(light, .35); g.beginPath(); g.moveTo(ax - 7, base - 20); g.lineTo(ax - 7, base - 70); g.quadraticCurveTo(ax, base - 86, ax + 7, base - 70); g.lineTo(ax + 7, base - 20); g.fill(); }
    g.fillStyle = col; g.fillRect(0, base, w, h - base);
  }
  function island(g, x, y, w, rng, col, light, opts = {}) {
    const hgt = w * (.5 + rng() * .4);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2, y);
    for (let i = 0; i <= 10; i++) { const t = i / 10; g.lineTo(x - w / 2 + w * t, y - 3 - rng() * 6); }
    const steps = 9; for (let i = 0; i <= steps; i++) { const t = i / steps; const px = x + w / 2 - w * t; const d = Math.sin(t * Math.PI); g.lineTo(px + (rng() - .5) * 10, y + hgt * d * (.6 + rng() * .5)); }
    g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { const rx = x - w * .35 + rng() * w * .7; g.beginPath(); g.moveTo(rx, y + hgt * .3); g.quadraticCurveTo(rx + (rng() - .5) * 20, y + hgt * .8, rx + (rng() - .5) * 10, y + hgt * (1 + rng() * .5)); g.stroke(); }
    if (opts.houses) for (let i = 0; i < opts.houses; i++) { const hx = x - w * .35 + rng() * w * .6, hw = 8 + rng() * 14, hh = 8 + rng() * 16; g.fillRect(hx, y - hh, hw, hh); g.beginPath(); g.moveTo(hx - 2, y - hh); g.lineTo(hx + hw / 2, y - hh - 8); g.lineTo(hx + hw + 2, y - hh); g.fill(); if (rng() < .7) { g.fillStyle = hex(light, .9); g.fillRect(hx + hw * .35, y - hh * .6, hw * .3, hh * .3); glowCircle(g, hx + hw / 2, y - hh / 2, hw * 1.4, light, .25); g.fillStyle = col; } }
    if (opts.trees) for (let i = 0; i < opts.trees; i++) { const tx = x - w * .4 + rng() * w * .8, tr = 6 + rng() * 10; g.beginPath(); g.arc(tx, y - tr, tr, 0, TAU); g.fill(); }
  }
  function ruins(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col;
    for (let i = 0; i < 7; i++) { const x = rng() * w, cw = 14 + rng() * 16, ch = maxH * (.3 + rng() * .7); g.fillRect(x, base - ch, cw, ch); g.fillRect(x - 5, base - ch - 6, cw + 10, 8); if (rng() < .5) { g.beginPath(); g.moveTo(x - 5, base - ch - 6); g.lineTo(x + cw * .6, base - ch - 20 - rng() * 12); g.lineTo(x + cw + 5, base - ch - 6); g.fill(); } }
    // giant head
    const hx = w * (.25 + rng() * .5), hy = base - maxH * .25, hr = maxH * .45;
    g.beginPath(); g.ellipse(hx, hy, hr * .75, hr, -.25, 0, TAU); g.fill();
    g.fillStyle = hex(light, .85); g.beginPath(); g.ellipse(hx - hr * .25, hy - hr * .15, hr * .12, hr * .05, -.25, 0, TAU); g.fill(); glowCircle(g, hx - hr * .25, hy - hr * .15, hr * .4, light, .35);
    g.fillStyle = col; g.fillRect(0, base, w, h - base);
    for (let i = 0; i < 30; i++) { const vx = rng() * w; g.strokeStyle = hex('#2c5a46', .7); g.lineWidth = 2; g.beginPath(); g.moveTo(vx, base - rng() * maxH); g.quadraticCurveTo(vx + 10, base, vx - 5, base + 30); g.stroke(); }
  }
  function wrecks(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col;
    for (let i = 0; i < 5; i++) { // hulls
      const x = rng() * w, hw = 80 + rng() * 120, tilt = (rng() - .5) * .6, y = base - rng() * maxH * .4;
      g.save(); g.translate(x, y); g.rotate(tilt); g.beginPath(); g.moveTo(-hw / 2, 0); g.quadraticCurveTo(0, hw * .45, hw / 2, 0); g.lineTo(hw / 2 - 10, -14); g.lineTo(-hw / 2 + 10, -14); g.fill();
      for (let r = 0; r < 6; r++) { g.fillRect(-hw / 2 + 10 + r * hw / 7, -40, 3, 30); }
      g.restore();
    }
    for (let i = 0; i < 3; i++) { // cranes
      const x = w * (.15 + i * .35) + rng() * 30, ch = maxH * (.8 + rng() * .4);
      g.fillRect(x, base - ch, 6, ch); g.fillRect(x - 40, base - ch, 120, 5); g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 70, base - ch); g.lineTo(x + 70, base - ch + 60); g.stroke(); g.fillRect(x + 64, base - ch + 60, 12, 10);
      glowCircle(g, x + 3, base - ch - 4, 10, '#ff4a2a', .9);
    }
    g.fillRect(0, base, w, h - base);
    for (let i = 0; i < 18; i++) glowCircle(g, rng() * w, base - rng() * maxH * .5, 6 + rng() * 10, light, .5);
  }
  function marketStrings(g, w, h, rng, col, base, light) {
    g.fillStyle = col;
    for (let i = 0; i < 9; i++) { const x = i * w / 8 - 20 + rng() * 20, sw = 50 + rng() * 30, sh = 40 + rng() * 40; g.fillRect(x, base - sh, sw, sh); g.beginPath(); g.moveTo(x - 8, base - sh); for (let k = 0; k <= 6; k++) g.lineTo(x - 8 + (sw + 16) * k / 6, base - sh - (k % 2 ? 10 : 0) - 6); g.lineTo(x + sw + 8, base - sh); g.fill(); g.fillStyle = hex(light, .4); g.fillRect(x + 6, base - sh + 10, sw - 12, sh * .4); g.fillStyle = col; }
    g.fillRect(0, base, w, h - base);
    const cols = [light, '#ff5a7a', '#ffd25a', '#7affd4', '#b07cff'];
    for (let s = 0; s < 3; s++) { const y0 = h * (.18 + s * .12), sag = 30 + rng() * 30; g.strokeStyle = hex('#000000', .6); g.lineWidth = 1; g.beginPath(); g.moveTo(-10, y0); g.quadraticCurveTo(w / 2, y0 + sag * 2, w + 10, y0); g.stroke();
      for (let k = 1; k < 14; k++) { const t = k / 14, x = lerp(-10, w + 10, t), y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0; const c = cols[(k + s) % cols.length]; glowCircle(g, x, y + 10, 18, c, .5); g.fillStyle = hex(c, .95); g.beginPath(); g.ellipse(x, y + 10, 5, 7, 0, 0, TAU); g.fill(); } }
  }
  function trees(g, w, h, rng, col, base, maxH, light) {
    g.fillStyle = col; g.strokeStyle = col;
    for (let i = 0; i < 14; i++) { const x = rng() * w, th = maxH * (.5 + rng() * .6), tw = 6 + rng() * 10;
      g.beginPath(); g.moveTo(x - tw, base); g.quadraticCurveTo(x - tw * .3, base - th * .5, x, base - th); g.quadraticCurveTo(x + tw * .3, base - th * .5, x + tw, base); g.fill();
      g.lineWidth = 2; for (let b = 0; b < 5; b++) { const by = base - th * (.4 + rng() * .5), dir = rng() < .5 ? -1 : 1; g.beginPath(); g.moveTo(x, by); g.quadraticCurveTo(x + dir * 20, by - 10, x + dir * (30 + rng() * 30), by - 25 - rng() * 20); g.stroke(); } }
    g.fillRect(0, base, w, h - base);
  }
  function shipDeck(g, w, h, rng, col, light) {
    const base = h * .78;
    g.fillStyle = col; g.fillRect(0, base, w, h - base);
    g.fillStyle = vgrad(g, base, h, [hex('#5a3a22', 1), hex('#24160c', 1)]); g.fillRect(0, base + 6, w, h);
    g.strokeStyle = hex('#000000', .35); for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, base + 6); g.lineTo(x - 40, h); g.stroke(); }
    g.fillStyle = col; g.fillRect(0, base - 34, w, 5); for (let x = 8; x < w; x += 26) g.fillRect(x, base - 34, 4, 34);
    g.fillRect(w * .62, 0, 12, base); g.fillRect(w * .3, h * .12, w * .62, 6);
    g.fillStyle = hex('#e8dcc0', .16); g.beginPath(); g.moveTo(w * .63, h * .14); g.quadraticCurveTo(w * .95, h * .35, w * .66, h * .6); g.fill();
    g.strokeStyle = col; g.lineWidth = 1.2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w * .62, h * .05 + i * 20); g.lineTo(i % 2 ? w + 10 : -10, base - 34); g.stroke(); }
    [[.15, base - 50], [.88, base - 50]].forEach(([fx, fy]) => { g.fillStyle = col; g.fillRect(w * fx - 2, fy, 4, 16); glowCircle(g, w * fx, fy - 4, 34, light, .55); g.fillStyle = hex(light, 1); g.beginPath(); g.arc(w * fx, fy - 4, 5, 0, TAU); g.fill(); });
  }
  function cabin(g, w, h, rng, light) {
    g.fillStyle = vgrad(g, 0, h, ['#2a1a10', '#3d2616', '#1a0f08']); g.fillRect(0, 0, w, h);
    const wx = w * .2, wy = h * .14, ww = w * .6, wh = h * .3;
    g.clearRect(wx, wy, ww, wh);
    g.fillStyle = '#1a0f08'; g.fillRect(wx - 8, wy - 8, ww + 16, 8); g.fillRect(wx - 8, wy + wh, ww + 16, 10); g.fillRect(wx - 8, wy, 8, wh); g.fillRect(wx + ww, wy, 8, wh); g.fillRect(wx + ww / 2 - 3, wy, 6, wh); g.fillRect(wx, wy + wh / 2 - 3, ww, 6);
    for (let i = 0; i < 5; i++) { g.fillStyle = hex('#000000', .3); g.fillRect(0, h * .55 + i * 2, w, 1); }
    g.fillStyle = '#1a0f08'; for (let x = 0; x < w; x += w / 5) g.fillRect(x, 0, 10, h * .08);
    // table, map, lamp
    g.fillStyle = '#24150b'; g.fillRect(w * .1, h * .7, w * .8, 12); g.fillStyle = hex('#e8d6a8', .85); g.save(); g.translate(w * .45, h * .69); g.rotate(-.06); g.fillRect(-60, -6, 120, 8); g.restore();
    glowCircle(g, w * .8, h * .62, 120, light, .45); g.fillStyle = hex(light, 1); g.beginPath(); g.arc(w * .8, h * .62, 6, 0, TAU); g.fill();
    g.fillStyle = '#100905'; g.fillRect(w * .78, h * .64, w * .04, h * .06);
  }
  function campfire(g, w, h, rng) {
    const base = h * .74; g.fillStyle = '#05060c'; g.beginPath(); g.moveTo(0, base); for (let x = 0; x <= w; x += 20) g.lineTo(x, base - 6 - Math.sin(x * .02) * 8 - rng() * 4); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#0a0b14'; g.beginPath(); g.ellipse(w * .2, base + 20, 50, 16, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(w * .82, base + 26, 44, 14, 0, 0, TAU); g.fill();
    g.fillStyle = '#1a0d06'; g.save(); g.translate(w / 2, base + 30); g.rotate(.3); g.fillRect(-36, -4, 72, 8); g.rotate(-.6); g.fillRect(-36, -4, 72, 8); g.restore();
  }
  function hollow(g, w, h, rng, col, light, throne) {
    g.fillStyle = col;
    for (let i = 0; i < 16; i++) { const x = rng() * w, top = rng() < .5; const len = h * (.2 + rng() * .4), bw = 12 + rng() * 30; g.beginPath(); if (top) { g.moveTo(x - bw, 0); g.lineTo(x + (rng() - .5) * 20, len); g.lineTo(x + bw, 0); } else { g.moveTo(x - bw, h); g.lineTo(x + (rng() - .5) * 20, h - len); g.lineTo(x + bw, h); } g.fill(); }
    if (throne) { const cx = w / 2, by = h * .78; g.fillRect(cx - 80, by - 140, 160, 140); g.beginPath(); g.moveTo(cx - 110, by - 140); for (let k = 0; k <= 7; k++) g.lineTo(cx - 110 + 220 * k / 7, by - 140 - (k % 2 ? 90 : 30)); g.lineTo(cx + 110, by - 140); g.fill(); glowCircle(g, cx, by - 200, 140, light, .35); g.fillRect(0, by, w, h - by); for (let s = 0; s < 6; s++) g.fillRect(cx - 120 - s * 20, by + s * 10, 240 + s * 40, 10); }
  }

  // ---------- background definitions ----------
  const BG = {
    lutece_night: { sky: ['#070b22', '#16205a', '#3d2f6b', '#7a4a6e'], stars: 160, moon: [.78, .14, .055, '#fff4d6'], aurora: 0, clouds: ['#3b3f80', .35], particles: 'embers', glow: '#ffb547',
      layers: [(g, w, h, r) => { island(g, w * .15, h * .3, 90, r, '#1e2350', '#ffcc70', { houses: 3 }); island(g, w * .85, h * .38, 70, r, '#1e2350', '#ffcc70', { houses: 2 }); }, (g, w, h, r) => cityParis(g, w, h, r, '#141a42', h * .72, h * .28, '#ffcf6a'), (g, w, h, r) => cityParis(g, w, h, r, '#090c22', h * .85, h * .2, '#ffb547')] },
    lutece_roofs: { sky: ['#060a1e', '#1a2152', '#4a3466'], stars: 200, moon: [.25, .16, .07, '#fff4d6'], clouds: ['#2e3270', .3], particles: 'embers', glow: '#ffb547',
      layers: [(g, w, h, r) => cityParis(g, w, h, r, '#1a1f48', h * .6, h * .25, '#ffcf6a'), (g, w, h, r) => { g.fillStyle = '#0a0d24'; g.beginPath(); g.moveTo(0, h * .8); g.lineTo(w * .35, h * .66); g.lineTo(w * .7, h * .8); g.lineTo(w, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill(); for (let i = 0; i < 4; i++) g.fillRect(w * (.1 + i * .25), h * .62 + i % 2 * 30, 14, 40); }] },
    lutece_hangar: { sky: ['#0a0f2a', '#283066', '#6a4a70'], stars: 80, moon: [.82, .2, .04, '#fff'], clouds: ['#454a90', .4], particles: 'sparks', glow: '#ffb547',
      layers: [(g, w, h, r) => cityParis(g, w, h, r, '#1a1f48', h * .7, h * .2, '#ffcf6a'), (g, w, h, r) => { g.fillStyle = '#0b0c1c'; g.beginPath(); g.moveTo(0, h * .15); g.quadraticCurveTo(w / 2, -h * .05, w, h * .15); g.lineTo(w, h * .2); g.quadraticCurveTo(w / 2, 0, 0, h * .2); g.fill(); g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); g.fillRect(0, h * .82, w, h); for (let i = 0; i < 5; i++) glowCircle(g, w * (.1 + i * .2), h * .12, 30, '#ffcf6a', .4); g.fillStyle = '#120d18'; g.beginPath(); g.ellipse(w * .5, h * .7, w * .32, 30, 0, 0, TAU); g.fill(); g.fillStyle = hex('#e8dcc0', .2); g.beginPath(); g.moveTo(w * .5, h * .7); g.lineTo(w * .5, h * .4); g.lineTo(w * .8, h * .66); g.fill(); }] },
    skyship_deck: { sky: ['#050818', '#141c4e', '#3a3170', '#6d4a7e'], stars: 220, moon: [.2, .12, .05, '#fff4d6'], clouds: ['#4a4f95', .5], cloudsLow: 1, particles: 'motes', glow: '#ffcf6a', speed: 1.8,
      layers: [(g, w, h, r) => { island(g, w * .8, h * .42, 60, r, '#262a5e', '#ffcc70', { houses: 1 }); }, (g, w, h, r) => shipDeck(g, w, h, r, '#140c08', '#ffcf6a')] },
    skyship_cabin: { sky: ['#06091e', '#1a2152', '#4a3466'], stars: 120, moon: [.62, .2, .04, '#fff'], clouds: ['#3a3f80', .4], particles: 'motes', glow: '#ffb547', layers: [(g, w, h, r) => cabin(g, w, h, r, '#ffb547')], front: true },
    sky_open: { sky: ['#040716', '#0f1a48', '#2f3a86', '#7a6aa8'], stars: 260, moon: [.7, .2, .06, '#ffffff'], clouds: ['#5a64b0', .55], cloudsLow: 1, particles: 'motes', glow: '#aab8ff', speed: 2.4,
      layers: [(g, w, h, r) => { for (let i = 0; i < 4; i++) island(g, r() * w, h * (.35 + r() * .3), 30 + r() * 70, r, '#2a3070', '#ffcc70', { houses: r() * 3 | 0, trees: 2 }); }] },
    rustworks: { sky: ['#140a0a', '#3a1e1a', '#7a3a22', '#b0603a'], stars: 40, moon: [.2, .2, .07, '#ffb27a'], clouds: ['#5a2a20', .5], particles: 'sparks', glow: '#ff8a3a', smog: '#4a2418',
      layers: [(g, w, h, r) => wrecks(g, w, h, r, '#2a1410', h * .7, h * .3, '#ff8a3a'), (g, w, h, r) => wrecks(g, w, h, r, '#120806', h * .88, h * .2, '#ff6a2a')] },
    forge: { sky: ['#1a0804', '#3a1208', '#7a2a0a'], stars: 0, particles: 'embers', glow: '#ff6a1a',
      layers: [(g, w, h, r) => { g.fillStyle = '#140806'; g.fillRect(0, 0, w, h * .12); for (let i = 0; i < 6; i++) g.fillRect(i * w / 5, 0, 12, h); glowCircle(g, w * .5, h * .7, w * .6, '#ff5a0a', .55); g.fillStyle = '#0c0404'; g.fillRect(w * .3, h * .6, w * .4, h * .4); g.fillStyle = hex('#ffb04a', 1); g.fillRect(w * .36, h * .66, w * .28, h * .08); for (let i = 0; i < 8; i++) { g.fillStyle = '#0c0404'; g.fillRect(r() * w, h * .82, 30 + r() * 40, 20 + r() * 50); } g.strokeStyle = '#0c0404'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(r() * w, 0); g.lineTo(r() * w, h * .3 + r() * 100); g.stroke(); } }] },
    garden_ruins: { sky: ['#06141a', '#0e3040', '#1e5a60', '#4a8a7a'], stars: 90, moon: [.75, .15, .05, '#e8fff4'], clouds: ['#2a6a6a', .5], cloudsLow: 1, particles: 'fireflies', glow: '#9affd0', rays: '#bfffe8',
      layers: [(g, w, h, r) => ruins(g, w, h, r, '#0e2a2e', h * .7, h * .35, '#9affd0'), (g, w, h, r) => trees(g, w, h, r, '#061416', h * .9, h * .2, '#9affd0')] },
    giant_hall: { sky: ['#03080c', '#0a1c22', '#123038'], stars: 0, particles: 'motes', glow: '#7affd4', rays: '#9affe0',
      layers: [(g, w, h, r) => { g.fillStyle = '#071216'; for (let i = 0; i < 4; i++) { const x = w * (.05 + i * .3); g.fillRect(x, 0, 36, h); g.fillRect(x - 8, h * .1, 52, 12); } const cx = w / 2, cy = h * .5; g.fillStyle = '#0a1a1e'; g.beginPath(); g.ellipse(cx, cy, w * .3, h * .3, 0, 0, TAU); g.fill(); g.fillRect(cx - w * .35, cy + h * .1, w * .7, h * .4); g.fillStyle = hex('#7affd4', .9); g.beginPath(); g.ellipse(cx - 30, cy - 10, 14, 4, 0, 0, TAU); g.ellipse(cx + 30, cy - 10, 14, 4, 0, 0, TAU); g.fill(); glowCircle(g, cx, cy - 10, 120, '#7affd4', .3); for (let i = 0; i < 20; i++) { g.fillStyle = hex('#7affd4', .5); g.fillRect(cx - w * .3 + r() * w * .6, cy + h * .15 + r() * h * .3, 3, 10); } }] },
    night_market: { sky: ['#0c0618', '#2a0f3a', '#5a1f4a', '#8a3a4a'], stars: 100, moon: [.15, .1, .05, '#ffe2c4'], clouds: ['#5a2a5a', .4], particles: 'lanterns', glow: '#ff9a4a',
      layers: [(g, w, h, r) => cityPagoda(g, w, h, r, '#220c2a', h * .62, h * .2, '#ff9a4a'), (g, w, h, r) => marketStrings(g, w, h, r, '#0e0612', h * .86, '#ffb05a')] },
    shadow_theatre: { sky: ['#140608', '#3a0e10', '#6a1a14'], stars: 0, particles: 'motes', glow: '#ffb05a',
      layers: [(g, w, h, r) => { g.fillStyle = '#0a0304'; g.fillRect(0, 0, w, h); g.clearRect(w * .1, h * .15, w * .8, h * .5); g.fillStyle = '#5a0e12'; g.fillRect(0, 0, w * .14, h); g.fillRect(w * .86, 0, w * .14, h); g.fillRect(0, 0, w, h * .12); g.fillStyle = '#0a0304'; g.beginPath(); g.ellipse(w * .4, h * .5, 30, 50, .2, 0, TAU); g.fill(); g.fillRect(w * .38, h * .3, 4, 60); g.beginPath(); g.arc(w * .62, h * .42, 26, 0, TAU); g.fill(); g.beginPath(); g.moveTo(w * .55, h * .65); g.lineTo(w * .62, h * .45); g.lineTo(w * .7, h * .65); g.fill(); g.fillStyle = '#120608'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(w * (i / 13), h * .9, 22 + r() * 8, Math.PI, 0); g.fill(); } g.fillRect(0, h * .9, w, h); }], screen: '#ffcf8a' },
    cathedral: { sky: ['#05030c', '#140a26', '#2a1440', '#4a1a4a'], stars: 120, moon: [.5, .08, .05, '#e6e0ff'], clouds: ['#2a1a4a', .5], particles: 'ash', glow: '#ff4d8d', rays: '#d9b0ff',
      layers: [(g, w, h, r) => gothic(g, w, h, r, '#0c0614', h * .86, h * .55, '#ff4d8d')] },
    crypt: { sky: ['#020205', '#08061a', '#120a24'], stars: 0, particles: 'motes', glow: '#8a6aff',
      layers: [(g, w, h, r) => { g.fillStyle = '#05040c'; for (let i = 0; i < 5; i++) { const x = w * (i / 4); g.beginPath(); g.moveTo(x - 60, 0); g.quadraticCurveTo(x, h * .3, x + 60, 0); g.fill(); g.fillRect(x - 12, h * .1, 24, h); } g.fillRect(0, h * .85, w, h); for (let i = 0; i < 12; i++) { const cx = r() * w, cy = h * (.6 + r() * .25); g.fillStyle = '#d8c8a0'; g.fillRect(cx - 2, cy - 14, 4, 14); glowCircle(g, cx, cy - 18, 26, '#ffcf6a', .55); } for (let i = 0; i < 4; i++) { g.fillStyle = '#0c0a18'; g.fillRect(w * (.1 + i * .22), h * .74, w * .14, h * .1); } }] },
    storm: { sky: ['#03060a', '#0a1a22', '#1a3a3a', '#2a4a3a'], stars: 0, clouds: ['#1a2a30', .9], cloudsLow: 1, particles: 'rain', glow: '#7affa0', lightning: 1, speed: 3,
      layers: [(g, w, h, r) => { g.fillStyle = '#05090c'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(r() * w, h * (.2 + r() * .3), 120 + r() * 120, 50 + r() * 40, 0, 0, TAU); g.fill(); } }, (g, w, h, r) => shipDeck(g, w, h, r, '#05070a', '#7affa0')] },
    flagship: { sky: ['#06080c', '#121a24', '#2a3440'], stars: 0, clouds: ['#1e2a34', .7], particles: 'rain', glow: '#7fd1ff', lightning: 1,
      layers: [(g, w, h, r) => { g.fillStyle = '#0a0e14'; g.beginPath(); g.moveTo(-20, h * .7); g.lineTo(w * .15, h * .5); g.lineTo(w * .9, h * .46); g.lineTo(w + 40, h * .55); g.lineTo(w + 20, h * .8); g.lineTo(-20, h * .8); g.fill(); for (let i = 0; i < 4; i++) { const x = w * (.25 + i * .18); g.fillRect(x, h * .26, 18, h * .22); glowCircle(g, x + 9, h * .26, 20, '#ff4a2a', .6); } for (let i = 0; i < 12; i++) { g.fillStyle = hex('#7fd1ff', .8); g.fillRect(w * (.12 + i * .065), h * .58, 8, 5); } }, (g, w, h, r) => { g.fillStyle = '#05070a'; g.fillRect(0, h * .82, w, h); g.fillRect(0, h * .76, w, 6); for (let x = 0; x < w; x += 30) g.fillRect(x, h * .76, 5, h * .06); g.fillStyle = '#0a0e14'; g.beginPath(); g.ellipse(w * .82, h * .8, 40, 16, 0, Math.PI, 0); g.fill(); g.fillRect(w * .76, h * .7, 80, 10); }] },
    silence_isles: { sky: ['#0a0e14', '#1e2630', '#4a5562', '#8a96a2'], stars: 60, moon: [.5, .22, .09, '#f2f6ff'], clouds: ['#9aa6b4', .45], cloudsLow: 1, particles: 'snow', glow: '#dfe8ff', aurora: 1,
      layers: [(g, w, h, r) => { for (let i = 0; i < 5; i++) island(g, r() * w, h * (.4 + r() * .3), 40 + r() * 80, r, '#2a323e', '#dfe8ff', { trees: 3 }); }, (g, w, h, r) => trees(g, w, h, r, '#141a22', h * .9, h * .25, '#fff')] },
    white_forest: { sky: ['#c8d0dc', '#e2e8f0', '#f4f6fa'], stars: 0, particles: 'snow', glow: '#ffffff', fog: '#ffffff',
      layers: [(g, w, h, r) => trees(g, w, h, r, '#a8b2c0', h * .8, h * .5), (g, w, h, r) => trees(g, w, h, r, '#6a7686', h * .95, h * .7)] },
    dreamscape: { sky: ['#1a0a2a', '#4a1a5a', '#a04a8a', '#ffb0a0'], stars: 300, moon: [.5, .45, .14, '#fff0f0'], clouds: ['#ffb0d0', .35], cloudsLow: 1, particles: 'petals', glow: '#ffd0e8', aurora: 1,
      layers: [(g, w, h, r) => { for (let i = 0; i < 7; i++) island(g, r() * w, h * (.2 + r() * .6), 20 + r() * 60, r, '#5a2a6a', '#ffe0a0', { houses: r() * 2 | 0, trees: 2 }); }] },
    akatsuki: { sky: ['#0a0408', '#2a0a14', '#6a1a1e', '#c0462a'], stars: 80, moon: [.8, .16, .08, '#ff7a4a'], clouds: ['#6a1a1a', .45], particles: 'petals_black', glow: '#ff5a3a',
      layers: [(g, w, h, r) => { island(g, w * .2, h * .3, 110, r, '#2a0a10', '#ff9a4a', { houses: 4 }); }, (g, w, h, r) => cityPagoda(g, w, h, r, '#1e060c', h * .7, h * .3, '#ff9a4a'), (g, w, h, r) => cityPagoda(g, w, h, r, '#0a0206', h * .88, h * .14, '#ff5a3a')] },
    akatsuki_palace: { sky: ['#0a0206', '#2a060c', '#4a0a12'], stars: 0, particles: 'petals_black', glow: '#ffb000',
      layers: [(g, w, h, r) => { g.fillStyle = '#120306'; for (let i = 0; i < 6; i++) { const x = w * (i / 5); g.fillRect(x - 10, 0, 20, h); } g.fillStyle = '#5a0a10'; for (let i = 0; i < 6; i++) g.fillRect(w * (i / 5) - 6, 0, 12, h); g.fillStyle = '#0a0204'; g.fillRect(0, h * .78, w, h); g.fillStyle = hex('#ffb000', .3); g.fillRect(w * .4, h * .78, w * .2, h); g.fillStyle = '#1e0408'; g.fillRect(w * .3, h * .4, w * .4, h * .38); g.beginPath(); g.moveTo(w * .22, h * .4); g.quadraticCurveTo(w * .5, h * .26, w * .78, h * .4); g.fill(); glowCircle(g, w / 2, h * .55, 100, '#ffb000', .35); g.fillStyle = hex('#ffb000', .9); g.beginPath(); g.arc(w / 2, h * .5, 18, 0, TAU); g.fill(); for (let i = 0; i < 8; i++) { const lx = w * (.08 + i * .12); glowCircle(g, lx, h * .2, 20, '#ff5a3a', .6); g.fillStyle = hex('#ff5a3a', .9); g.beginPath(); g.ellipse(lx, h * .2, 7, 10, 0, 0, TAU); g.fill(); } }] },
    dojo: { sky: ['#0a0806', '#1a120a', '#2a1c10'], stars: 0, particles: 'motes', glow: '#ffcf8a',
      layers: [(g, w, h, r) => { g.fillStyle = '#140c06'; g.fillRect(0, 0, w, h); g.fillStyle = hex('#ffe4b0', .14); for (let i = 0; i < 4; i++) g.fillRect(w * (.08 + i * .23), h * .12, w * .18, h * .45); g.fillStyle = '#0c0704'; for (let i = 0; i < 5; i++) g.fillRect(w * (.06 + i * .23), h * .1, 8, h * .5); g.fillRect(0, h * .1, w, 8); g.fillRect(0, h * .56, w, 8); g.fillStyle = vgrad(g, h * .62, h, ['#3a2814', '#1a1008']); g.fillRect(0, h * .62, w, h); g.strokeStyle = hex('#000', .4); for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, h * .62); g.lineTo(x * 1.3 - w * .15, h); g.stroke(); } g.fillStyle = '#0c0704'; g.fillRect(w * .78, h * .3, 50, 6); g.fillRect(w * .8, h * .3, 4, 30); g.fillRect(w * .86, h * .3, 4, 30); glowCircle(g, w * .5, h * .35, 160, '#ffcf8a', .2); }] },
    hollow_descent: { sky: ['#000000', '#05030a', '#0e0618'], stars: 40, particles: 'void', glow: '#8a5aff',
      layers: [(g, w, h, r) => hollow(g, w, h, r, '#0a0614', '#8a5aff', false), (g, w, h, r) => { for (let i = 0; i < 6; i++) { const y = h * (.2 + i * .14), x = (i % 2 ? .65 : .35) * w; g.fillStyle = '#05030a'; g.fillRect(x - 50, y, 100, 10); glowCircle(g, x, y, 30, '#8a5aff', .3); } }] },
    hollow_throne: { sky: ['#000000', '#060210', '#140620', '#1e0a2a'], stars: 80, particles: 'void', glow: '#c08aff',
      layers: [(g, w, h, r) => hollow(g, w, h, r, '#05020a', '#c08aff', true)] },
    dawn: { sky: ['#1a2a6a', '#6a5aa8', '#ff9a8a', '#ffd8a0', '#fff4d0'], stars: 30, sun: [.5, .72, .12, '#fff2c0'], clouds: ['#ffb8a8', .55], cloudsLow: 1, particles: 'motes', glow: '#ffe0a0', rays: '#fff0c0',
      layers: [(g, w, h, r) => { for (let i = 0; i < 6; i++) island(g, r() * w, h * (.55 + r() * .25), 40 + r() * 80, r, '#6a4a7a', '#fff0c0', { houses: r() * 3 | 0, trees: 3 }); }, (g, w, h, r) => cityPagoda(g, w, h, r, '#3a2a4a', h * .92, h * .14, '#ffe0a0')] },
    campfire: { sky: ['#030510', '#0a1030', '#1a1a40'], stars: 300, moon: [.8, .14, .03, '#fff'], particles: 'embers', glow: '#ff9a3a', fire: 1,
      layers: [(g, w, h, r) => { island(g, w * .2, h * .3, 50, r, '#141a40', '#ffcc70'); island(g, w * .9, h * .44, 40, r, '#141a40', '#ffcc70'); }, (g, w, h, r) => campfire(g, w, h, r)] },
    black: { sky: ['#000', '#000'], stars: 0 },
  };

  // ---------- background renderer ----------
  let cur = null;
  function prepare(id, W, H, dpr) {
    const def = BG[id] || BG.black;
    const s = { id, def, W, H, dpr, layers: [], parts: [], t0: performance.now(), flash: 0 };
    const pw = W * 1.15;
    const sky = mkCanvas(W * dpr, H * dpr), g = sky.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = vgrad(g, 0, H, def.sky); g.fillRect(0, 0, W, H);
    if (def.sun) { const [x, y, r, c] = def.sun; glowCircle(g, W * x, H * y, W * r * 6, c, .55); glowCircle(g, W * x, H * y, W * r * 2.2, c, .8); g.fillStyle = c; g.beginPath(); g.arc(W * x, H * y, W * r, 0, TAU); g.fill(); }
    if (def.moon) { const [x, y, r, c] = def.moon; glowCircle(g, W * x, H * y, W * r * 5, c, .25); g.fillStyle = c; g.beginPath(); g.arc(W * x, H * y, W * r, 0, TAU); g.fill(); g.fillStyle = hex('#000000', .07); for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(W * x + (Math.sin(i * 7) * W * r * .5), H * y + Math.cos(i * 5) * W * r * .4, W * r * (.12 + i % 3 * .08), 0, TAU); g.fill(); } }
    s.sky = sky;
    const rng = rngOf(id.length * 977 + id.charCodeAt(0) * 31);
    s.stars = []; for (let i = 0; i < (def.stars || 0); i++) s.stars.push([rng() * W, rng() * H * .7, rng() * 1.3 + .2, rng() * TAU, rng() < .06]);
    if (def.clouds) { const [col, a] = def.clouds; const cc = mkCanvas(W * 2, H), cg = cc.getContext('2d');
      const tex = WORLD.cloudTexture(320, 200, col, Math.min(1, a * 1.5), id.length * 13 + 5);
      cg.imageSmoothingEnabled = true; const y0 = def.cloudsLow ? H * .3 : H * .02, hh = def.cloudsLow ? H * .75 : H * .6;
      cg.drawImage(tex, 0, y0, W * 2, hh);
      for (let i = 0; i < 10; i++) glowCircle(cg, rng() * W * 2, y0 + rng() * hh, 60 + rng() * 90, col, a * .25);
      s.clouds = cc; }
    (def.layers || []).forEach((fn, i) => { const c = mkCanvas(pw * dpr, H * dpr), lg = c.getContext('2d'); lg.scale(dpr, dpr); fn(lg, pw, H, rngOf(i * 131 + id.length * 7)); s.layers.push(c); });
    const n = { embers: 50, sparks: 40, fireflies: 40, rain: 140, snow: 90, ash: 60, petals: 40, petals_black: 45, lanterns: 22, motes: 50, void: 60 }[def.particles] || 0;
    for (let i = 0; i < n; i++) s.parts.push(newPart(def.particles, W, H, true));
    return s;
  }
  function newPart(type, W, H, init) {
    const r = Math.random;
    const p = { type, x: r() * W, y: init ? r() * H : H + 10, vx: 0, vy: 0, s: 1, a: 1, ph: r() * TAU };
    switch (type) {
      case 'embers': p.vy = -(15 + r() * 30); p.vx = (r() - .5) * 10; p.s = 1 + r() * 2; p.c = r() < .5 ? '#ffb547' : '#ff6a2a'; break;
      case 'sparks': p.vy = -(30 + r() * 40); p.vx = (r() - .5) * 40; p.s = .8 + r(); p.c = '#ffd27a'; break;
      case 'fireflies': p.y = init ? r() * H : r() * H; p.vx = (r() - .5) * 8; p.vy = (r() - .5) * 8; p.s = 1.5 + r() * 1.5; p.c = '#d0ff8a'; break;
      case 'rain': p.y = init ? r() * H : -20; p.vy = 600 + r() * 300; p.vx = -150; p.s = 10 + r() * 12; p.c = '#a8d8ff'; break;
      case 'snow': case 'ash': p.y = init ? r() * H : -10; p.vy = 12 + r() * 25; p.vx = (r() - .5) * 15; p.s = 1 + r() * 2.5; p.c = type === 'snow' ? '#ffffff' : '#c8b0d8'; break;
      case 'petals': case 'petals_black': p.y = init ? r() * H : -10; p.vy = 20 + r() * 25; p.vx = 15 + r() * 20; p.s = 3 + r() * 3; p.c = type === 'petals' ? (r() < .5 ? '#ffc0d8' : '#fff0f6') : (r() < .7 ? '#1a0408' : '#ff3a4a'); break;
      case 'lanterns': p.vy = -(8 + r() * 12); p.vx = (r() - .5) * 6; p.s = 3 + r() * 5; p.c = r() < .6 ? '#ffb05a' : '#ff7a5a'; break;
      case 'motes': p.vy = -(2 + r() * 6); p.vx = (r() - .5) * 6; p.s = .8 + r() * 1.4; p.c = '#fff2d0'; break;
      case 'void': p.vy = -(6 + r() * 14); p.vx = (r() - .5) * 8; p.s = 1 + r() * 3; p.c = r() < .5 ? '#8a5aff' : '#000000'; break;
    }
    return p;
  }
  function drawBg(ctx, s, t, dt, opts = {}) {
    const { W, H, def } = s;
    ctx.drawImage(s.sky, 0, 0, W, H);
    // stars
    for (const st of s.stars) { const tw = .5 + .5 * Math.sin(t * 2 + st[3]); ctx.globalAlpha = .3 + tw * .7; ctx.fillStyle = '#fff'; ctx.fillRect(st[0], st[1], st[2], st[2]); if (st[4]) { ctx.globalAlpha = tw * .5; ctx.fillRect(st[0] - 3, st[1] + st[2] / 2, 6 + st[2], .6); ctx.fillRect(st[0] + st[2] / 2, st[1] - 3, .6, 6 + st[2]); } }
    ctx.globalAlpha = 1;
    if (def.aurora) { for (let b = 0; b < 3; b++) { ctx.beginPath(); for (let x = 0; x <= W; x += 10) { const y = H * (.12 + b * .06) + Math.sin(x * .01 + t * .3 + b) * 30 + Math.sin(x * .023 - t * .2) * 15; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.closePath(); const gr = ctx.createLinearGradient(0, 0, 0, H * .35); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, b % 2 ? 'rgba(120,255,200,0.10)' : 'rgba(180,120,255,0.10)'); ctx.fillStyle = gr; ctx.fill(); } }
    const sp = (def.speed || 1);
    if (s.clouds) { const off = (t * 6 * sp) % (W * 2); ctx.drawImage(s.clouds, -off, 0, W * 2, H); ctx.drawImage(s.clouds, W * 2 - off, 0, W * 2, H); }
    if (def.lightning) { if (Math.random() < .004) s.flash = 1; if (s.flash > 0) { ctx.fillStyle = `rgba(200,255,230,${s.flash * .35})`; ctx.fillRect(0, 0, W, H); s.flash -= dt * 3; } }
    const n = s.layers.length;
    s.layers.forEach((c, i) => { const depth = (i + 1) / n; const ox = -(W * .075) + Math.sin(t * .05 * sp) * W * .06 * depth + (opts.px || 0) * depth * 10; const oy = Math.sin(t * .4 + i) * 1.5 * depth; ctx.drawImage(c, ox, oy, W * 1.15, H); });
    if (def.rays) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x = W * (.2 + i * .2) + Math.sin(t * .2 + i) * 20; const gr = ctx.createLinearGradient(x, 0, x + 80, H); gr.addColorStop(0, hex(def.rays, .09 + .04 * Math.sin(t + i))); gr.addColorStop(1, hex(def.rays, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 10, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 180, H); ctx.lineTo(x + 40, H); ctx.fill(); } ctx.restore(); }
    if (def.fire) { const fx = W / 2, fy = H * .76; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowCircle(ctx, fx, fy, 160 + Math.sin(t * 9) * 8, '#ff7a2a', .35); for (let i = 0; i < 6; i++) { const fh = 40 + Math.sin(t * 8 + i * 2) * 14; ctx.fillStyle = hex(i % 2 ? '#ffb547' : '#ff5a1a', .7); ctx.beginPath(); ctx.moveTo(fx - 22 + i * 8, fy + 20); ctx.quadraticCurveTo(fx - 16 + i * 6, fy - fh * .5, fx - 8 + i * 4 + Math.sin(t * 6 + i) * 5, fy - fh); ctx.quadraticCurveTo(fx - 2 + i * 6, fy - fh * .4, fx - 10 + i * 8, fy + 20); ctx.fill(); } ctx.restore(); }
    // particles
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < s.parts.length; i++) {
      const p = s.parts[i]; p.ph += dt;
      p.x += (p.vx + (p.type === 'fireflies' || p.type === 'snow' || p.type === 'petals' || p.type === 'petals_black' ? Math.sin(p.ph * 1.3) * 15 : 0)) * dt; p.y += p.vy * dt;
      if (p.y < -30 || p.y > H + 30 || p.x < -40 || p.x > W + 40) { s.parts[i] = newPart(p.type, W, H, false); if (p.vy > 0) s.parts[i].y = -10; if (p.type === 'rain') s.parts[i].x = Math.random() * (W + 200); continue; }
      switch (p.type) {
        case 'rain': ctx.strokeStyle = hex(p.c, .35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * .02, p.y + p.s); ctx.stroke(); break;
        case 'petals': case 'petals_black': ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph * 2); ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .5, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.globalCompositeOperation = 'lighter'; break;
        case 'lanterns': glowCircle(ctx, p.x, p.y, p.s * 5, p.c, .35); ctx.fillStyle = hex(p.c, .9); ctx.fillRect(p.x - p.s * .5, p.y - p.s * .7, p.s, p.s * 1.4); break;
        case 'void': if (p.c === '#000000') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; } else glowCircle(ctx, p.x, p.y, p.s * 3, p.c, .5); break;
        default: { const a = p.type === 'fireflies' ? .5 + .5 * Math.sin(p.ph * 3) : .8; glowCircle(ctx, p.x, p.y, p.s * 3.5, p.c, a * .6); ctx.fillStyle = hex(p.c, a); ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
      }
    }
    ctx.restore();
    if (def.fog) { ctx.fillStyle = vgrad(ctx, H * .4, H, [hex(def.fog, 0), hex(def.fog, .45)]); ctx.fillRect(0, 0, W, H); }
    if (def.smog) { ctx.fillStyle = vgrad(ctx, H * .3, H, [hex(def.smog, 0), hex(def.smog, .35)]); ctx.fillRect(0, 0, W, H); }
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .3, W / 2, H * .5, Math.max(W, H) * .8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // ---------- portraits ----------
  const LOOK = {
    mira: { skin: '#f3cfae', hair: '#c4552c', hs: 'bob', cloth: '#26406e', cloth2: '#e0a03c', eye: '#2fb7a8', rim: '#ffcf7a', extra: ['goggles', 'scarf'] },
    // cicatrice sottile sul collo (c1, c4), kimono scuro consumato, codino nero
    kai: { skin: '#e6bf98', hair: '#17151f', hs: 'topknot', cloth: '#5a1a26', cloth2: '#1a1016', eye: '#e8a33a', rim: '#ff6a6a', extra: ['neckscar', 'kimono'] },
    // ragazza robusta, occhialoni da saldatore sulla fronte, sempre sporca di grasso, chiave inglese Gertrude
    otto: { skin: '#c98e62', hair: '#f2cf55', hs: 'messy', cloth: '#6a4a2a', cloth2: '#3a6a5a', eye: '#5ce05c', rim: '#7cf0c0', gog: '#ffb05a', extra: ['goggles', 'overalls', 'grease', 'big', 'wrench'] },
    // pietra grigia e bronzo verde, muschio, occhi d'ambra, un fiore sulla testa
    bram: { robot: 1, cloth: '#3a4a46', cloth2: '#6a7a70', eye: '#ffb347', rim: '#ffcf7a', flower: 1 },
    nuvola: { cloud: 1, eye: '#7ab8ff', rim: '#bfe0ff' },
    // capelli corti neri, neo sul labbro, guanti neri sottili
    sable: { skin: '#ead6c8', hair: '#17141c', hs: 'short', cloth: '#1b1a2a', cloth2: '#6a3aa0', eye: '#b07cff', rim: '#b07cff', glove: '#16141c', extra: ['highcollar', 'gloves', 'mole'] },
    // alto, spalle larghe, cappotto blu, capelli grigi raccolti, cicatrice sul sopracciglio, guanti; in c9 un occhio solo
    malachar: { skin: '#d6b096', hair: '#9a9aa4', hs: 'bun', cloth: '#24365a', cloth2: '#c9a24a', eye: '#8ad0ff', rim: '#7fd1ff', glove: '#1a1a22', extra: ['browscar', 'epaulettes', 'gloves', 'big'], old: 1,
      by: { c9: { cloth: '#15151c', extra: ['browscar', 'patch', 'gloves', 'highcollar', 'big'] } } },
    // veli neri, maniche di schegge, maschera di vetro scuro senza occhi; in c9 (risparmiata) a volto scoperto
    vedova: { skin: '#e6dce8', hair: '#140a18', hs: 'long', cloth: '#160a1c', cloth2: '#ff4d8d', eye: '#ff4d8d', rim: '#ff4d8d', extra: ['veil', 'shards', 'darkmask'],
      by: { c9: { hair: '#8a8690', extra: ['veil', 'shards', 'burn', 'tears'] } } },
    // capelli bianchi ma viso giovane (quello di Kai), armatura completa, elmo col sole spezzato, pupille senza riflesso
    raiden: { skin: '#e2bc96', hair: '#ece8e2', hs: 'topknot', cloth: '#2a1416', cloth2: '#ffb000', eye: '#3a2a2a', rim: '#ffb000', crest: 'sun', extra: ['armor', 'kabuto', 'deadeyes'] },
    revuoto: { void: 1, eye: '#ffffff', rim: '#c08aff' },
    elise: { skin: '#f0d2bb', hair: '#e8e3dc', hs: 'bun', cloth: '#4a3a5a', cloth2: '#c9a24a', eye: '#2fb7a8', rim: '#ffe4a8', extra: ['glasses', 'shawl'], old: 1 },
    // c1-c2: massiccio, rasato, cicatrice, baffi impomatati e monocolo; c4-c6: bendato, cappellaccio; c8+: calvo, cicatrice a uncino, niente baffi
    grinza: { skin: '#c4a07c', hair: '#2a2a20', hs: 'bald', cloth: '#3a3f2a', cloth2: '#8a2a1a', eye: '#ff3a2a', rim: '#ff8844', extra: ['scar', 'epaulettes', 'mustache', 'monocle', 'big'],
      by: { c4: { cloth: '#4a4436', cloth2: '#6a5a40', extra: ['headwrap', 'mustache', 'hat', 'big'] }, c8: { cloth: '#5a5a48', cloth2: '#8a6a3a', extra: ['hookscar', 'apron', 'big'] } } },
    pip: { skin: '#f3c9a0', hair: '#8a5a2b', hs: 'messy', cloth: '#4b6a3b', cloth2: '#c98a3a', eye: '#4aa8aa', rim: '#ffd27a', extra: ['cap', 'grease'], child: 1 },
    // piccolo, magro come un ramo, un occhio velato di bianco, spada di legno
    hanzo: { skin: '#cfa47e', hair: '#c8c8c8', hs: 'bald', cloth: '#2a3a4a', cloth2: '#8aa0b0', eye: '#9fd8d0', rim: '#9fd8d0', extra: ['longbeard', 'cloudeye', 'kimono', 'tiny'], old: 1 },
    guard: { skin: '#d8b090', hair: '#3a2a1a', hs: 'short', cloth: '#3a3a52', cloth2: '#c9a24a', eye: '#6a8aff', rim: '#ffcf7a', extra: ['helmet'] },
    soldier: { skin: '#c8a888', hair: '#222', hs: 'short', cloth: '#2c3138', cloth2: '#7fd1ff', eye: '#7fd1ff', rim: '#7fd1ff', extra: ['visor'] },
    monk: { skin: '#e0d6e2', hair: '#000', hs: 'bald', cloth: '#1a0f20', cloth2: '#ff4d8d', eye: '#ff4d8d', rim: '#d9b0ff', extra: ['hood', 'mask'] },
    merchant: { skin: '#e0b08a', hair: '#5a3a1a', hs: 'short', cloth: '#7a3a1a', cloth2: '#ffcf6a', eye: '#3a6a3a', rim: '#ffb05a', extra: ['hat', 'mustache'] },
    villager: { skin: '#e8c4a0', hair: '#6a4a2a', hs: 'short', cloth: '#5a5040', cloth2: '#8a7a5a', eye: '#5a7aaa', rim: '#ffd8a0', extra: [] },
    child: { skin: '#f3cfae', hair: '#3a2a1a', hs: 'messy', cloth: '#5a7aa0', cloth2: '#e0c060', eye: '#6a5aaa', rim: '#ffe0a0', extra: [], child: 1 },
    elder: { skin: '#e0c0a0', hair: '#d8d8d8', hs: 'short', cloth: '#4a4038', cloth2: '#8a7a6a', eye: '#6a6a6a', rim: '#ffe4c0', extra: ['beard'], old: 1 },
    noble: { skin: '#f0d8c4', hair: '#d8b060', hs: 'long', cloth: '#3a1a4a', cloth2: '#ffcf6a', eye: '#4a8aff', rim: '#ffd88a', extra: ['highcollar'] },
    samurai: { skin: '#d8b088', hair: '#111', hs: 'topknot', cloth: '#3a2020', cloth2: '#c9a24a', eye: '#d0a060', rim: '#ff8a5a', extra: ['armor'] },
  };
  // dettagli dei personaggi secondari, presi dalle descrizioni nella storia (si sommano alla loro base)
  const NPCLOOK = {
    fosco: { extra: ['beard', 'blind', 'scarf'] },                                         // lampionaio cieco
    notaio: { hs: 'short', hair: '#4a3a3a', extra: ['highcollar', 'umbrella'] },             // redingote viola, ombrello chiuso
    fenn: { hs: 'bun', hair: '#8a5a3a', extra: ['shawl'] },                                  // Madama Fenn
    ruggine: { hair: '#6a6e78', cloth: '#5a4a3a', extra: ['fullbeard', 'glasseye', 'cap', 'big'] }, // vecchio enorme, barba color ferro, occhio di vetro verde
    tosca: { hair: '#dcdcdc', hs: 'bun', old: 1, extra: ['shawl', 'pipe', 'tiny'] },          // donna minuscola con la pipa
    nico: { extra: ['grease'] },                                                             // pieno di fuliggine
    cricca: { hair: '#2a1020', extra: ['feathers'] },                                        // avvolta in piume di struzzo nere
    martello: { extra: ['helmet', 'big'] },                                                   // grande come un armadio
    bullone: { dog: 1, eye: '#ffe27a', rim: '#ffc860' },                                     // cane di latta: caldaie, teiera per testa
    germoglio: { sprout: 1, eye: '#ffd88a', rim: '#8fe3a0' },                                 // automa di rame verde e radici
    esploratrice: { hs: 'short', hair: '#4a3020', extra: ['scope', 'bandarm'] },            // lente telescopica su un occhio, braccio ferito
    recluta: { skin: '#f2e2d6', extra: ['helmet'] },                                         // pallidissimo, elmo troppo grande
    doganiere: { extra: ['hat', 'mustache'] },                                               // cappello troppo grande, baffi
    lina: { hs: 'braids', hair: '#9a6232' },                                                                  // bambina con le trecce
    zia: { hs: 'bun', extra: ['shawl'] },
    sagara: { hair: '#9a9aa0', old: 1, extra: ['armor', 'kabuto'] },                         // armatura di lacca rossa, capelli grigi
    diacono: { extra: ['hood', 'mask', 'cracked'] },                                          // maschera di vetro incrinata
    prigioniero: { extra: ['apron'] },                                                       // grembiule di cuoio
    soma: { crest: 'sun', extra: ['armor', 'kabuto'] },                                      // sole spezzato sul petto
    naufraga: { hair: '#d0d0d0', hs: 'bun', old: 1, extra: ['shawl'] },                      // Lisette, anziana
    barcaiolo: { hair: '#cfd4da', cloth: '#8a949e', extra: ['hood', 'slate', 'beard'] },      // mantello color nebbia, ardesia al collo
    eco: { extra: ['ghost'] },                                                               // naufraghi svuotati, trasparenti
    hotaru: { cloth: '#a8502a', extra: ['hood', 'freckles'] },                                // cappuccio color ruggine, lentiggini
    sayo: { cloth: '#c4c0cc', hs: 'bun', extra: ['kimono', 'tiny'] },                         // minuta, kimono grigio perla
    juro: { crest: 'antlers', extra: ['armor', 'kabuto'] },                                   // elmo a corna di cervo
    ume: { hs: 'bun', hair: '#e0e0e0', extra: ['shawl', 'lantern'] },                         // lanterna spenta al collo
    ribelle: { extra: ['hood'] },
    lacca: { extra: ['armor', 'helmet'] },
    kenta: { extra: ['armor'] },                                                             // resti dell'armatura di lacca
    lampionaio: { cloth: '#3a3a42', extra: ['faceless', 'widehat', 'scarf'] },               // senza volto, cappello a tesa larga
    ayame: { hair: '#17151f', hs: 'bun', extra: ['kimono', 'heronclip'] },                    // fermaglio d'argento ad airone
    altra: { mirror: 'mira', extra: ['goggles', 'scarf', 'voideyes'] },                     // l'Altra Mira: occhi neri interi
    lise: { hair: '#f0e8d8', extra: ['ghost'] },                                              // spirito di bambina
    daichi: { extra: ['ghost'] },                                                             // spirito in armatura
  };
  // capitolo corrente (impostato dal motore) per gli aspetti che cambiano con la storia
  let chOf = () => null; const LC = {};
  const chN = c => +String(c).replace(/\D/g, '') || 0;
  let NP = {};
  function look(id, npc) {
    npc = npc || NP[id];
    const ch = chOf(), key = id + '|' + (ch || '') + '|' + (npc ? npc.base + npc.color : '');
    if (LC[key]) return LC[key];
    const o = NPCLOOK[id];
    let L;
    if (o && o.mirror) L = Object.assign({}, LOOK[o.mirror], { rim: npc?.color || '#4b2b6b' });
    else if (LOOK[id]) L = Object.assign({}, LOOK[id]);
    else if (npc) { L = Object.assign({}, LOOK[npc.base] || LOOK.villager); if (npc.color) { L.cloth = npc.color; L.rim = npc.color; } }
    else L = Object.assign({}, LOOK.villager);
    if (o) { const { mirror, ...rest } = o; Object.assign(L, rest); }
    let tag = id;
    const by = L.by; delete L.by;
    if (by && ch) { const ks = Object.keys(by).filter(k => chN(k) <= chN(ch)).sort((a, b) => chN(a) - chN(b)); const k = ks.pop(); if (k) { Object.assign(L, by[k]); tag += '@' + k; } }
    if (npc && !LOOK[id]) tag += '~' + (npc.color || '');
    L.extra = L.extra || []; L._k = tag;
    return LC[key] = L;
  }
  const lookFor = look;

  function drawPortrait(ctx, id, mood, cx, by, scale, t, alpha = 1, npc) {
    if (id === 'voice') return;
    const L = lookFor(id, npc);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, by);
    const br = 1 + Math.sin(t * 2.2) * .008; ctx.scale(scale, scale * br); ctx.translate(-150, -380);
    const zs = L.child ? .86 : L.extra.includes('tiny') ? .9 : L.extra.includes('big') ? 1.06 : 1; if (zs !== 1) { ctx.translate(150, 380); ctx.scale(zs, zs); ctx.translate(-150, -380); }
    if (L.extra.includes('ghost')) { ctx.globalAlpha *= .62; glowCircle(ctx, 150, 180, 180, '#aaccff', .35); }
    // aura glow
    glowCircle(ctx, 150, 200, 210, L.rim, .18);
    if (L.robot) drawRobot(ctx, L, mood, t);
    else if (L.cloud) drawCloudChild(ctx, L, mood, t);
    else if (L.void) drawVoidKing(ctx, L, mood, t);
    else if (L.dog) drawTinDog(ctx, L, mood, t);
    else if (L.sprout) drawSprout(ctx, L, mood, t);
    else drawHuman(ctx, L, mood, t);
    ctx.restore();
  }
  function rimStroke(ctx, col, w = 3) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.strokeStyle = hex(col, .85); ctx.lineWidth = w; ctx.stroke(); ctx.restore(); }
  function drawHuman(ctx, L, mood, t) {
    const skinSh = shade(L.skin, -.22);
    // back hair
    ctx.fillStyle = L.hair;
    if (L.hs === 'long' || L.hs === 'long_side') { ctx.beginPath(); ctx.moveTo(78, 120); ctx.quadraticCurveTo(60, 260, 70, 330); ctx.lineTo(230, 330); ctx.quadraticCurveTo(240, 260, 222, 120); ctx.fill(); }
    if (L.hs === 'bob') { ctx.beginPath(); ctx.moveTo(80, 120); ctx.quadraticCurveTo(66, 210, 86, 250); ctx.lineTo(214, 250); ctx.quadraticCurveTo(234, 210, 220, 120); ctx.fill(); }
    if (L.extra.includes('veil')) { ctx.fillStyle = hex('#0a0410', .85); ctx.beginPath(); ctx.moveTo(150, 40); ctx.quadraticCurveTo(40, 120, 40, 380); ctx.lineTo(260, 380); ctx.quadraticCurveTo(260, 120, 150, 40); ctx.fill(); }
    // torso
    const tg = ctx.createLinearGradient(0, 240, 0, 380); tg.addColorStop(0, shade(L.cloth, .1)); tg.addColorStop(1, shade(L.cloth, -.35));
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(20, 380); ctx.quadraticCurveTo(30, 280, 105, 258); ctx.lineTo(195, 258); ctx.quadraticCurveTo(270, 280, 280, 380); ctx.closePath(); ctx.fill(); rimStroke(ctx, L.rim, 2);
    // neck
    ctx.fillStyle = skinSh; ctx.fillRect(130, 200, 40, 66);
    // clothing details
    const ex = L.extra;
    if (ex.includes('kimono') || ex.includes('armor')) { ctx.fillStyle = L.cloth2; ctx.beginPath(); ctx.moveTo(115, 258); ctx.lineTo(150, 330); ctx.lineTo(185, 258); ctx.lineTo(172, 258); ctx.lineTo(150, 305); ctx.lineTo(128, 258); ctx.fill(); }
    if (ex.includes('armor')) { ctx.fillStyle = shade(L.cloth, -.2); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 6, 300 + i * 18); ctx.lineTo(100, 290 + i * 18); ctx.lineTo(100, 302 + i * 18); ctx.lineTo(28 + i * 6, 314 + i * 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(270 - i * 6, 300 + i * 18); ctx.lineTo(200, 290 + i * 18); ctx.lineTo(200, 302 + i * 18); ctx.lineTo(272 - i * 6, 314 + i * 18); ctx.fill(); } ctx.strokeStyle = hex(L.cloth2, .8); ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 6, 300 + i * 18); ctx.lineTo(100, 290 + i * 18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(270 - i * 6, 300 + i * 18); ctx.lineTo(200, 290 + i * 18); ctx.stroke(); } }
    if (ex.includes('scarf')) { ctx.fillStyle = L.cloth2; ctx.beginPath(); ctx.moveTo(100, 250); ctx.quadraticCurveTo(150, 285, 200, 250); ctx.lineTo(205, 272); ctx.quadraticCurveTo(150, 305, 95, 272); ctx.fill(); ctx.beginPath(); ctx.moveTo(170, 280); ctx.quadraticCurveTo(190 + Math.sin(t * 2) * 6, 330, 182, 370); ctx.lineTo(198, 368); ctx.quadraticCurveTo(200, 320, 188, 276); ctx.fill(); ctx.fillStyle = '#e0c060'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(120 + i * 18, 320 + i * 4, 3.5, 0, TAU); ctx.fill(); } }
    if (ex.includes('overalls')) { ctx.fillStyle = L.cloth2; ctx.fillRect(108, 300, 84, 80); ctx.fillRect(110, 258, 12, 50); ctx.fillRect(178, 258, 12, 50); ctx.fillStyle = '#d8c070'; ctx.beginPath(); ctx.arc(116, 306, 4, 0, TAU); ctx.arc(184, 306, 4, 0, TAU); ctx.fill(); }
    if (ex.includes('highcollar')) { ctx.fillStyle = L.cloth; ctx.beginPath(); ctx.moveTo(118, 200); ctx.lineTo(112, 262); ctx.lineTo(188, 262); ctx.lineTo(182, 200); ctx.quadraticCurveTo(150, 230, 118, 200); ctx.fill(); ctx.strokeStyle = hex(L.cloth2, .9); ctx.lineWidth = 2; ctx.stroke(); }
    if (ex.includes('epaulettes')) { ctx.fillStyle = L.cloth2; ctx.beginPath(); ctx.ellipse(66, 278, 34, 12, -.3, 0, TAU); ctx.ellipse(234, 278, 34, 12, .3, 0, TAU); ctx.fill(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(150, 290 + i * 22, 4, 0, TAU); ctx.fill(); } }
    if (ex.includes('shawl')) { ctx.fillStyle = L.cloth2; ctx.globalAlpha *= .9; ctx.beginPath(); ctx.moveTo(40, 340); ctx.quadraticCurveTo(150, 240, 260, 340); ctx.lineTo(240, 380); ctx.quadraticCurveTo(150, 290, 60, 380); ctx.fill(); ctx.globalAlpha /= .9; }
    if (ex.includes('hood')) { ctx.fillStyle = L.cloth; ctx.beginPath(); ctx.moveTo(150, 40); ctx.quadraticCurveTo(60, 60, 64, 200); ctx.quadraticCurveTo(70, 260, 100, 270); ctx.lineTo(200, 270); ctx.quadraticCurveTo(230, 260, 236, 200); ctx.quadraticCurveTo(240, 60, 150, 40); ctx.fill(); rimStroke(ctx, L.rim, 2); }
    if (ex.includes('shards')) { for (let i = 0; i < 7; i++) { const a = -Math.PI * (.15 + i * .12), r = 150 + Math.sin(t + i) * 6; ctx.save(); ctx.translate(150 + Math.cos(a) * r, 150 + Math.sin(a) * r * .8); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = hex('#ffd0e8', .5); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(6, 0); ctx.lineTo(0, 22); ctx.lineTo(-6, 0); ctx.fill(); ctx.restore(); } }
    // head
    const hg = ctx.createLinearGradient(90, 0, 210, 0); hg.addColorStop(0, shade(L.skin, -.1)); hg.addColorStop(.5, L.skin); hg.addColorStop(1, shade(L.skin, -.18));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(92, 120); ctx.quadraticCurveTo(90, 190, 118, 214); ctx.quadraticCurveTo(150, 240, 182, 214); ctx.quadraticCurveTo(210, 190, 208, 120); ctx.quadraticCurveTo(206, 54, 150, 52); ctx.quadraticCurveTo(94, 54, 92, 120); ctx.fill();
    if (!ex.includes('hood')) rimStroke(ctx, L.rim, 2);
    // ears
    ctx.fillStyle = skinSh; ctx.beginPath(); ctx.ellipse(92, 140, 8, 14, 0, 0, TAU); ctx.ellipse(208, 140, 8, 14, 0, 0, TAU); ctx.fill();
    if (L.old) { ctx.strokeStyle = hex(shade(L.skin, -.4), .4); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(112, 168); ctx.quadraticCurveTo(118, 176, 116, 186); ctx.moveTo(188, 168); ctx.quadraticCurveTo(182, 176, 184, 186); ctx.moveTo(125, 94); ctx.lineTo(175, 94); ctx.stroke(); }
    drawFace(ctx, L, mood, t);
    if (ex.includes('scar')) { ctx.strokeStyle = hex('#a04040', .8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(172, 112); ctx.lineTo(186, 160); ctx.stroke(); }
    if (ex.includes('fullbeard')) { const g = ctx.createLinearGradient(0, 150, 0, 300); g.addColorStop(0, L.hair); g.addColorStop(1, shade(L.hair, -.3)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(94, 140); ctx.quadraticCurveTo(96, 210, 120, 260); ctx.quadraticCurveTo(150, 300, 180, 260); ctx.quadraticCurveTo(204, 210, 206, 140); ctx.quadraticCurveTo(190, 176, 150, 178); ctx.quadraticCurveTo(110, 176, 94, 140); ctx.closePath(); ctx.ellipse(150, 196, 18, 9, 0, 0, TAU); ctx.fill('evenodd'); ctx.strokeStyle = hex(shade(L.hair, .25), .5); ctx.lineWidth = 1.5; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(112 + i * 13, 214); ctx.quadraticCurveTo(114 + i * 12, 240, 124 + i * 9, 262); ctx.stroke(); } }
    if (ex.includes('beard')) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(110, 180); ctx.quadraticCurveTo(150, 262, 190, 180); ctx.quadraticCurveTo(170, 214, 150, 212); ctx.quadraticCurveTo(130, 214, 110, 180); ctx.fill(); }
    if (ex.includes('longbeard')) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(112, 186); ctx.quadraticCurveTo(150, 340, 188, 186); ctx.quadraticCurveTo(150, 222, 112, 186); ctx.fill(); }
    if (ex.includes('mustache')) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(150, 186); ctx.quadraticCurveTo(126, 180, 116, 196); ctx.quadraticCurveTo(132, 188, 150, 192); ctx.quadraticCurveTo(168, 188, 184, 196); ctx.quadraticCurveTo(174, 180, 150, 186); ctx.fill(); }
    // front hair
    ctx.fillStyle = L.hair; const hs = L.hs;
    if (hs === 'bob') { ctx.beginPath(); ctx.moveTo(86, 140); ctx.quadraticCurveTo(80, 50, 150, 44); ctx.quadraticCurveTo(222, 50, 214, 140); ctx.quadraticCurveTo(200, 96, 176, 92); ctx.lineTo(168, 112); ctx.lineTo(156, 90); ctx.lineTo(140, 114); ctx.lineTo(132, 92); ctx.quadraticCurveTo(100, 98, 86, 140); ctx.fill(); }
    if (hs === 'topknot') { ctx.beginPath(); ctx.moveTo(90, 132); ctx.quadraticCurveTo(84, 52, 150, 48); ctx.quadraticCurveTo(216, 52, 210, 132); ctx.lineTo(196, 100); ctx.lineTo(186, 120); ctx.lineTo(176, 92); ctx.lineTo(160, 112); ctx.lineTo(150, 90); ctx.lineTo(132, 116); ctx.lineTo(124, 92); ctx.lineTo(104, 118); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(150, 38, 16, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = L.cloth2; ctx.fillRect(140, 48, 20, 5); ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(158, 34); ctx.quadraticCurveTo(200 + Math.sin(t * 1.6) * 6, 30, 214, 70); ctx.quadraticCurveTo(196, 46, 160, 44); ctx.fill(); }
    if (hs === 'messy') { ctx.beginPath(); ctx.moveTo(88, 136); for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, r = i % 2 ? 72 : 88; ctx.lineTo(150 + Math.cos(a) * r, 118 + Math.sin(a) * r); } ctx.lineTo(212, 136); ctx.quadraticCurveTo(190, 100, 150, 100); ctx.quadraticCurveTo(110, 100, 88, 136); ctx.fill(); }
    if (hs === 'long_side') { ctx.beginPath(); ctx.moveTo(84, 160); ctx.quadraticCurveTo(80, 48, 150, 44); ctx.quadraticCurveTo(220, 48, 216, 150); ctx.quadraticCurveTo(200, 110, 190, 100); ctx.quadraticCurveTo(170, 140, 120, 176); ctx.quadraticCurveTo(140, 130, 150, 100); ctx.quadraticCurveTo(110, 110, 84, 160); ctx.fill(); }
    if (hs === 'long') { ctx.beginPath(); ctx.moveTo(86, 150); ctx.quadraticCurveTo(80, 48, 150, 44); ctx.quadraticCurveTo(220, 48, 214, 150); ctx.quadraticCurveTo(190, 92, 150, 90); ctx.quadraticCurveTo(110, 92, 86, 150); ctx.fill(); }
    if (hs === 'slick') { ctx.beginPath(); ctx.moveTo(90, 124); ctx.quadraticCurveTo(88, 50, 150, 48); ctx.quadraticCurveTo(212, 50, 210, 124); ctx.quadraticCurveTo(196, 80, 150, 80); ctx.quadraticCurveTo(104, 80, 90, 124); ctx.fill(); ctx.strokeStyle = hex('#ffffff', .2); ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(110 + i * 20, 62); ctx.quadraticCurveTo(140 + i * 18, 58, 160 + i * 14, 76); ctx.stroke(); } }
    if (hs === 'bun') { ctx.beginPath(); ctx.moveTo(90, 130); ctx.quadraticCurveTo(86, 52, 150, 50); ctx.quadraticCurveTo(214, 52, 210, 130); ctx.quadraticCurveTo(200, 84, 150, 82); ctx.quadraticCurveTo(100, 84, 90, 130); ctx.fill(); ctx.beginPath(); ctx.arc(150, 42, 24, 0, TAU); ctx.fill(); }
    if (hs === 'short' || hs === 'braids') { ctx.beginPath(); ctx.moveTo(90, 124); ctx.quadraticCurveTo(86, 50, 150, 48); ctx.quadraticCurveTo(214, 50, 210, 124); ctx.lineTo(196, 96); ctx.lineTo(176, 100); ctx.lineTo(150, 88); ctx.lineTo(124, 100); ctx.lineTo(104, 96); ctx.closePath(); ctx.fill(); }
    if (hs !== 'bald' && !ex.includes('hood')) { ctx.beginPath(); ctx.ellipse(130, 66, 26, 6, -.3, 0, TAU); ctx.fillStyle = hex('#ffffff', .12); ctx.fill(); }
    // headwear
    if (ex.includes('goggles')) { ctx.fillStyle = '#4a3020'; ctx.fillRect(92, 74, 116, 10); [[124, 72], [176, 72]].forEach(([x, y]) => { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.fillStyle = hex(L.gog || '#7fe8ff', .8); ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 3, 0, TAU); ctx.fill(); }); }
    if (ex.includes('goggles_eyes')) { ctx.fillStyle = '#2a2018'; ctx.fillRect(90, 80, 120, 9); [[126, 76], [174, 76]].forEach(([x, y]) => { ctx.fillStyle = '#b08a4a'; ctx.beginPath(); ctx.arc(x, y, 15, 0, TAU); ctx.fill(); ctx.fillStyle = hex('#ffb05a', .85); ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); }); }
    if (ex.includes('helmet')) { ctx.fillStyle = '#5a5a6a'; ctx.beginPath(); ctx.moveTo(84, 120); ctx.quadraticCurveTo(84, 40, 150, 40); ctx.quadraticCurveTo(216, 40, 216, 120); ctx.lineTo(200, 110); ctx.quadraticCurveTo(150, 92, 100, 110); ctx.fill(); ctx.fillStyle = L.cloth2; ctx.fillRect(146, 30, 8, 30); }
    if (ex.includes('visor')) { ctx.fillStyle = '#20242c'; ctx.beginPath(); ctx.moveTo(84, 130); ctx.quadraticCurveTo(84, 40, 150, 40); ctx.quadraticCurveTo(216, 40, 216, 130); ctx.fill(); ctx.fillStyle = hex(L.cloth2, .9); ctx.fillRect(100, 116, 100, 14); glowCircle(ctx, 150, 123, 60, L.cloth2, .3); }
    if (ex.includes('mask')) { ctx.fillStyle = hex('#f0e8f4', .92); ctx.beginPath(); ctx.moveTo(104, 104); ctx.quadraticCurveTo(150, 92, 196, 104); ctx.quadraticCurveTo(200, 200, 150, 220); ctx.quadraticCurveTo(100, 200, 104, 104); ctx.fill(); ctx.fillStyle = L.eye; ctx.beginPath(); ctx.ellipse(128, 140, 10, 3, 0, 0, TAU); ctx.ellipse(172, 140, 10, 3, 0, 0, TAU); ctx.fill(); glowCircle(ctx, 128, 140, 18, L.eye, .5); glowCircle(ctx, 172, 140, 18, L.eye, .5); }
    if (ex.includes('hat')) { ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.ellipse(150, 70, 90, 16, 0, 0, TAU); ctx.fill(); ctx.fillRect(100, 24, 100, 48); ctx.fillStyle = L.cloth2; ctx.fillRect(100, 58, 100, 8); }
    if (ex.includes('cap')) { ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.ellipse(150, 80, 70, 40, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(186, 82, 40, 8, .1, 0, TAU); ctx.fill(); }
    if (ex.includes('glasses')) { ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(126, 142, 15, 0, TAU); ctx.moveTo(189, 142); ctx.arc(174, 142, 15, 0, TAU); ctx.moveTo(141, 142); ctx.lineTo(159, 142); ctx.stroke(); }
    if (ex.includes('monocle')) { ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(174, 142, 16, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(188, 150); ctx.quadraticCurveTo(200, 200, 190, 260); ctx.stroke(); }
    drawMarks(ctx, L, mood, t);
    if (ex.includes('veil')) { ctx.fillStyle = hex('#140a18', .55); ctx.beginPath(); ctx.moveTo(84, 90); ctx.quadraticCurveTo(150, 30, 216, 90); ctx.lineTo(214, 132); ctx.quadraticCurveTo(150, 120, 86, 132); ctx.fill(); }
  }
  // segni particolari del ritratto (sopra il volto)
  function drawMarks(ctx, L, m, t) {
    const ex = L.extra, has = e => ex.includes(e);
    const line = (col, w, pts) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
    const SC = hex('#a03a3a', .85);
    if (has('grease')) { ctx.fillStyle = hex('#2a2220', .55); ctx.beginPath(); ctx.ellipse(112, 176, 16, 6, -.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(120, 184, 8, 3, -.3, 0, TAU); ctx.fill(); }
    if (has('freckles')) { ctx.fillStyle = hex(shade(L.skin, -.35), .7); [[108, 166], [116, 172], [100, 172], [112, 160], [184, 166], [192, 172], [200, 166], [188, 160]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }); }
    if (has('mole')) { ctx.fillStyle = '#3a1e24'; ctx.beginPath(); ctx.arc(170, 200, 2.6, 0, TAU); ctx.fill(); }
    if (has('neckscar')) line(SC, 2.2, [[164, 222], [172, 236], [178, 252]]);
    if (has('browscar')) line(SC, 2.6, [[178, 104], [184, 122], [190, 136]]);
    if (has('hookscar')) line(SC, 3, [[108, 70], [100, 92], [104, 110], [120, 114]]);
    if (has('tears')) { ctx.fillStyle = hex('#9ad8ff', .6); [[118, 160], [182, 162]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y + 10, 3, 14, 0, 0, TAU); ctx.fill(); }); }
    if (has('burn')) { ctx.save(); ctx.globalAlpha *= .55; const g = ctx.createRadialGradient(182, 150, 4, 182, 150, 50); g.addColorStop(0, '#b05a5a'); g.addColorStop(1, hex('#c88080', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(150, 92); ctx.quadraticCurveTo(214, 100, 208, 170); ctx.quadraticCurveTo(196, 214, 158, 222); ctx.quadraticCurveTo(170, 150, 150, 92); ctx.fill(); ctx.restore(); }
    if (has('glasseye')) { glowCircle(ctx, 174, 142, 34, '#5aff8a', .45 + .2 * Math.sin(t * 5)); ctx.fillStyle = '#2ab060'; ctx.beginPath(); ctx.arc(174, 143, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8ffcc'; ctx.beginPath(); ctx.arc(174, 143, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a6e74'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(174, 143, 13, 0, TAU); ctx.stroke(); }
    if (has('cloudeye')) { ctx.fillStyle = hex('#eef4f6', .92); ctx.beginPath(); ctx.arc(174, 143, 9, 0, TAU); ctx.fill(); }
    if (has('blind')) { ctx.fillStyle = L.skin; [126, 174].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 142, 14, 14, 0, 0, TAU); ctx.fill(); }); line('#3a2a22', 3, [[114, 144], [126, 148], [138, 144]]); line('#3a2a22', 3, [[162, 144], [174, 148], [186, 144]]); }
    if (has('scope')) { ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(108, 142); ctx.lineTo(84, 120); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(126, 142, 19, 0, TAU); ctx.fill(); const g = ctx.createRadialGradient(122, 138, 2, 126, 142, 14); g.addColorStop(0, '#d8f4ff'); g.addColorStop(1, '#2a5a8a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(126, 142, 13, 0, TAU); ctx.fill(); }
    if (has('patch')) { ctx.fillStyle = '#121016'; line('#121016', 4, [[110, 130], [92, 112]]); line('#121016', 4, [[142, 132], [204, 96]]); ctx.beginPath(); ctx.ellipse(126, 144, 18, 15, 0, 0, TAU); ctx.fill(); }
    if (has('headwrap')) { ctx.fillStyle = '#ece4d2'; ctx.beginPath(); ctx.moveTo(90, 96); ctx.quadraticCurveTo(150, 78, 210, 96); ctx.lineTo(210, 116); ctx.quadraticCurveTo(150, 98, 90, 116); ctx.fill(); ctx.beginPath(); ctx.moveTo(96, 110); ctx.lineTo(118, 106); ctx.lineTo(152, 158); ctx.lineTo(132, 166); ctx.fill(); ctx.strokeStyle = hex('#a89880', .8); ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(100 + i * 26, 100 - (i % 2) * 3); ctx.lineTo(112 + i * 26, 112); ctx.stroke(); } ctx.fillStyle = hex('#a03a3a', .5); ctx.beginPath(); ctx.arc(188, 104, 5, 0, TAU); ctx.fill(); }
    if (has('darkmask')) { const g = ctx.createLinearGradient(100, 90, 200, 220); g.addColorStop(0, '#3a2a44'); g.addColorStop(.5, '#120a18'); g.addColorStop(1, '#2a1a30'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(96, 100); ctx.quadraticCurveTo(150, 84, 204, 100); ctx.quadraticCurveTo(210, 206, 150, 226); ctx.quadraticCurveTo(90, 206, 96, 100); ctx.fill(); rimStroke(ctx, L.rim, 1.5); ctx.fillStyle = hex('#ffffff', .18); ctx.beginPath(); ctx.ellipse(124, 124, 10, 30, -.3, 0, TAU); ctx.fill(); }
    if (has('cracked')) line(hex('#3a2a3a', .9), 2, [[160, 100], [150, 130], [164, 150], [154, 182]]);
    if (has('faceless')) { const g = ctx.createLinearGradient(90, 0, 210, 0); g.addColorStop(0, '#b8b8c0'); g.addColorStop(.5, '#a0a0a8'); g.addColorStop(1, '#7a7a84'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(150, 152, 58, 78, 0, 0, TAU); ctx.fill(); }
    if (has('widehat')) { ctx.fillStyle = '#26222c'; ctx.beginPath(); ctx.ellipse(150, 84, 124, 20, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#34303c'; ctx.beginPath(); ctx.moveTo(96, 84); ctx.quadraticCurveTo(100, 22, 150, 20); ctx.quadraticCurveTo(200, 22, 204, 84); ctx.fill(); ctx.fillStyle = '#6a5a3a'; ctx.fillRect(98, 66, 104, 9); }
    if (has('kabuto')) {
      const g = ctx.createLinearGradient(80, 0, 220, 0); g.addColorStop(0, shade(L.cloth, .2)); g.addColorStop(1, shade(L.cloth, -.3)); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(80, 124); ctx.quadraticCurveTo(80, 36, 150, 34); ctx.quadraticCurveTo(220, 36, 220, 124); ctx.lineTo(206, 112); ctx.quadraticCurveTo(150, 94, 94, 112); ctx.fill(); rimStroke(ctx, L.rim, 1.5);
      ctx.beginPath(); ctx.moveTo(80, 120); ctx.lineTo(56, 168); ctx.lineTo(90, 150); ctx.moveTo(220, 120); ctx.lineTo(244, 168); ctx.lineTo(210, 150); ctx.fill();
      ctx.fillStyle = '#e8c25a';
      if (L.crest === 'sun') { ctx.beginPath(); ctx.arc(150, 40, 34, Math.PI, 0); ctx.fill(); ctx.strokeStyle = shade(L.cloth, -.4); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 8); ctx.lineTo(142, 24); ctx.lineTo(156, 30); ctx.lineTo(148, 42); ctx.stroke(); for (let i = 0; i < 7; i++) { const a = Math.PI + (i + .5) / 7 * Math.PI; ctx.beginPath(); ctx.moveTo(150 + Math.cos(a) * 36, 40 + Math.sin(a) * 36); ctx.lineTo(150 + Math.cos(a) * 50, 40 + Math.sin(a) * 50); ctx.strokeStyle = '#e8c25a'; ctx.lineWidth = 3; ctx.stroke(); } }
      else if (L.crest === 'antlers') { ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 6; ctx.lineCap = 'round'; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(150 + s * 20, 44); ctx.quadraticCurveTo(150 + s * 50, 10, 150 + s * 80, -30); ctx.moveTo(150 + s * 46, 14); ctx.lineTo(150 + s * 36, -16); ctx.moveTo(150 + s * 64, -6); ctx.lineTo(150 + s * 82, 4); ctx.stroke(); }); }
      else { ctx.beginPath(); ctx.moveTo(110, 44); ctx.quadraticCurveTo(150, 10, 190, 44); ctx.quadraticCurveTo(150, 30, 110, 44); ctx.fill(); }
    }
    if (has('heronclip')) { ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(176, 50); ctx.quadraticCurveTo(200, 30, 222, 40); ctx.lineTo(206, 44); ctx.quadraticCurveTo(196, 52, 186, 60); ctx.fill(); ctx.strokeStyle = '#c0c8d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(214, 40); ctx.lineTo(232, 34); ctx.stroke(); }
    if (has('pipe')) { ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(160, 196); ctx.quadraticCurveTo(190, 206, 204, 202); ctx.stroke(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(198, 184, 14, 20); ctx.fillStyle = hex('#d8d8e0', .4); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(208 + Math.sin(t * 2 + i) * 6, 170 - i * 18, 7 + i * 2, 0, TAU); ctx.fill(); } }
    if (has('feathers')) { for (let i = 0; i < 26; i++) { const a = i / 25, x = 30 + a * 240, y = 268 + Math.sin(a * Math.PI) * -18 + (i % 2) * 8; ctx.fillStyle = i % 3 ? '#1c1418' : '#3a2c34'; ctx.beginPath(); ctx.ellipse(x, y, 16, 9, (i % 2 ? .6 : -.6), 0, TAU); ctx.fill(); } }
    if (has('slate')) { ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(130, 240); ctx.lineTo(120, 300); ctx.moveTo(170, 240); ctx.lineTo(180, 300); ctx.stroke(); ctx.fillStyle = '#2a3038'; ctx.fillRect(108, 298, 84, 56); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 4; ctx.strokeRect(108, 298, 84, 56); ctx.fillStyle = '#e8e8e0'; ctx.font = 'bold 16px serif'; ctx.textAlign = 'center'; ctx.fillText('…', 150, 330); }
    if (has('lantern')) { ctx.strokeStyle = '#3a3446'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(136, 244); ctx.lineTo(150, 290); ctx.lineTo(164, 244); ctx.stroke(); ctx.fillStyle = '#4a4438'; ctx.fillRect(138, 290, 24, 30); ctx.fillStyle = '#8a8070'; ctx.fillRect(142, 294, 16, 22); }
    if (has('apron')) { const g = ctx.createLinearGradient(0, 280, 0, 380); g.addColorStop(0, '#7a5a3a'); g.addColorStop(1, '#4a3420'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(112, 290); ctx.lineTo(188, 290); ctx.lineTo(196, 380); ctx.lineTo(104, 380); ctx.fill(); }
    if (has('bandarm')) { ctx.fillStyle = '#efe8dc'; ctx.beginPath(); ctx.ellipse(52, 320, 30, 18, -.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8bca8'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 14, 330 - i * 6); ctx.lineTo(42 + i * 14, 304 - i * 6); ctx.stroke(); } }
    if (has('gloves')) { ctx.fillStyle = L.glove || '#16141c'; [[40, 370], [260, 370]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 20, 12, 0, 0, TAU); ctx.fill(); }); }
    if (L.hs === 'braids') { ctx.fillStyle = L.hair; [92, 208].forEach(x => { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x, 160 + i * 18, 11 - i * .6, 10, 0, 0, TAU); ctx.fill(); } }); ctx.fillStyle = L.cloth2; [92, 208].forEach(x => ctx.fillRect(x - 7, 262, 14, 6)); }
  }
  // Bullone: ritratto del cane di latta (teiera, occhi a lampadina, collare con targhetta)
  function drawTinDog(ctx, L, m, t) {
    const metal = (x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#c4ccd2'); g.addColorStop(.45, '#8a929a'); g.addColorStop(1, '#4a5058'); return g; };
    const tilt = m === 'sad' || m === 'hurt' ? -.12 : m === 'happy' ? .05 * Math.sin(t * 8) : 0;
    // corpo: caldaia
    ctx.fillStyle = metal(20, 280); ctx.beginPath(); ctx.ellipse(150, 360, 140, 80, 0, Math.PI, 0); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.fillStyle = '#b8823a'; [70, 150, 230].forEach(x => ctx.fillRect(x - 5, 290, 10, 90));
    glowCircle(ctx, 150, 350, 40, '#ff9a3a', .5 + .2 * Math.sin(t * 3)); ctx.fillStyle = '#ffb05a'; ctx.fillRect(132, 340, 36, 14);
    // collare e targhetta
    ctx.fillStyle = '#7a2a2a'; ctx.fillRect(84, 262, 132, 18); ctx.fillStyle = '#e8c25a'; ctx.beginPath(); ctx.arc(150, 292, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a4010'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BULLONE', 150, 295);
    ctx.save(); ctx.translate(150, 170); ctx.rotate(tilt); ctx.translate(-150, -170);
    // manico (orecchio) e beccuccio (muso)
    ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(66, 160, 34, Math.PI * .6, Math.PI * 1.45); ctx.stroke();
    ctx.fillStyle = metal(200, 280); ctx.beginPath(); ctx.moveTo(214, 180); ctx.quadraticCurveTo(260, 170, 276, 120); ctx.lineTo(288, 126); ctx.quadraticCurveTo(272, 196, 214, 214); ctx.fill();
    // teiera
    ctx.fillStyle = metal(70, 230); ctx.beginPath(); ctx.ellipse(150, 170, 88, 72, 0, 0, TAU); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.fillStyle = '#7a828a'; ctx.beginPath(); ctx.ellipse(150, 104, 54, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8823a'; ctx.beginPath(); ctx.arc(150, 88, 12, 0, TAU); ctx.fill();
    // fiocco rosso
    ctx.fillStyle = '#d03a3a'; ctx.beginPath(); ctx.moveTo(196, 108); ctx.lineTo(222, 92); ctx.lineTo(220, 122); ctx.closePath(); ctx.moveTo(196, 108); ctx.lineTo(170, 92); ctx.lineTo(172, 122); ctx.closePath(); ctx.fill();
    // occhi a lampadina
    const lit = m === 'sad' ? .45 : m === 'hurt' ? .3 + .3 * Math.abs(Math.sin(t * 9)) : 1;
    [118, 182].forEach(x => { glowCircle(ctx, x, 160, 34, L.eye, .5 * lit); ctx.fillStyle = hex('#fff6c0', .4 + .6 * lit); ctx.beginPath(); ctx.arc(x, 160, 17, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4e56'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = hex('#c87a2a', .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, 166); ctx.lineTo(x - 3, 156); ctx.lineTo(x, 166); ctx.lineTo(x + 3, 156); ctx.lineTo(x + 6, 166); ctx.stroke(); });
    // griglia della bocca e lingua di cuoio
    ctx.fillStyle = '#2a2e34'; ctx.fillRect(124, 196, 52, 14); ctx.fillStyle = '#8a929a'; for (let i = 0; i < 5; i++) ctx.fillRect(128 + i * 10, 196, 3, 14);
    if (m === 'happy') { ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.ellipse(150, 218, 12, 16, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // Germoglio: ritratto dell'automa giardiniere
  function drawSprout(ctx, L, m, t) {
    const cu = (x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#8ac8a4'); g.addColorStop(.5, '#5f9a7c'); g.addColorStop(1, '#3a6a54'); return g; };
    // radici sulle spalle
    ctx.strokeStyle = '#6a4a2e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(150, 260); ctx.quadraticCurveTo(150 + (i - 2.5) * 50, 290, 150 + (i - 2.5) * 70, 380); ctx.stroke(); }
    ctx.fillStyle = cu(60, 240); ctx.beginPath(); ctx.ellipse(150, 330, 92, 62, 0, Math.PI, 0); ctx.lineTo(242, 380); ctx.lineTo(58, 380); ctx.fill(); rimStroke(ctx, L.rim, 2);
    // annaffiatoio (braccio sinistro)
    ctx.fillStyle = '#4f8a6c'; ctx.fillRect(16, 300, 56, 50); ctx.beginPath(); ctx.moveTo(20, 304); ctx.lineTo(-10, 262); ctx.lineTo(0, 256); ctx.lineTo(32, 300); ctx.fill(); ctx.fillStyle = '#bfe8ff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-6 + Math.sin(t * 4 + i) * 3, 270 + ((t * 40 + i * 12) % 50), 2.4, 0, TAU); ctx.fill(); }
    // testa
    ctx.fillStyle = cu(80, 220); ctx.beginPath(); ctx.ellipse(150, 168, 82, 74, 0, 0, TAU); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.strokeStyle = hex('#2a4a3a', .6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(74, 170); ctx.lineTo(226, 170); ctx.stroke(); ctx.fillStyle = '#c88a4a'; [[86, 170], [214, 170]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); });
    // germoglio in testa
    ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 96); ctx.quadraticCurveTo(146, 70, 152, 50); ctx.stroke(); ctx.fillStyle = '#6ac25a'; [[-1, 0], [1, 1]].forEach(([s, k]) => { ctx.beginPath(); ctx.ellipse(150 + s * 22, 60 - k * 10, 22, 10, s * .5 + Math.sin(t * 2) * .08, 0, TAU); ctx.fill(); });
    // occhi tondi come lanterne di carta
    [118, 182].forEach(x => { glowCircle(ctx, x, 160, 40, '#ffd88a', .45); ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.ellipse(x, 160, 22, 26, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = hex('#c8a060', .7); ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(x, 160, 22 - Math.abs(i) * 4, 26, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = m === 'sad' ? '#7a6a4a' : '#5a3a1a'; ctx.beginPath(); ctx.arc(x, m === 'happy' ? 156 : 164, m === 'surprised' ? 5 : 8, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = '#2a4a3a'; ctx.lineWidth = 3; ctx.beginPath(); if (m === 'sad' || m === 'hurt') { ctx.moveTo(136, 214); ctx.quadraticCurveTo(150, 206, 164, 214); } else { ctx.moveTo(134, 206); ctx.quadraticCurveTo(150, 218, 166, 206); } ctx.stroke();
  }
  function drawFace(ctx, L, m, t) {
    if (['visor', 'mask', 'darkmask', 'faceless'].some(e => L.extra.includes(e))) return;
    const blink = (Math.sin(t * 1.3) > .985) || (Math.sin(t * 0.7 + 1) > .995);
    const ey = 142, lx = 126, rx = 174;
    // brows
    ctx.strokeStyle = shade(L.hair === '#e8e3dc' || L.hair === '#e8e4e0' || L.hair === '#c8c8c8' ? '#888888' : L.hair, -.1); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    const bt = { neutral: [0, 0], happy: [-3, 2], sad: [6, -6], angry: [-6, 8], surprised: [-8, 0], serious: [2, 4], hurt: [4, -5] }[m] || [0, 0];
    ctx.beginPath(); ctx.moveTo(lx - 14, ey - 20 + bt[0] - bt[1] / 2); ctx.lineTo(lx + 12, ey - 20 + bt[0] + bt[1] / 2); ctx.moveTo(rx + 14, ey - 20 + bt[0] - bt[1] / 2); ctx.lineTo(rx - 12, ey - 20 + bt[0] + bt[1] / 2); ctx.stroke();
    const eyeOne = (x, closedOverride) => {
      if (blink || closedOverride || m === 'happy') { ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 3; ctx.beginPath(); if (m === 'happy') ctx.arc(x, ey + 4, 10, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(x, ey - 4, 10, Math.PI * .2, Math.PI * .8); ctx.stroke(); return; }
      const h = m === 'surprised' ? 13 : m === 'serious' || m === 'angry' ? 8 : 11;
      ctx.fillStyle = '#fbf7f2'; ctx.beginPath(); ctx.ellipse(x, ey, 12, h, 0, 0, TAU); ctx.fill();
      const ir = m === 'surprised' ? 6 : 8;
      const ig = ctx.createRadialGradient(x, ey + 2, 1, x, ey, ir); ig.addColorStop(0, shade(L.eye, .4)); ig.addColorStop(1, shade(L.eye, -.3));
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(x, ey + 1, ir, 0, TAU); ctx.fill();
      ctx.fillStyle = '#120a10'; ctx.beginPath(); ctx.arc(x, ey + 1, ir * .45, 0, TAU); ctx.fill();
      if (L.extra.includes('voideyes')) { ctx.fillStyle = '#07040b'; ctx.beginPath(); ctx.ellipse(x, ey, 12, h, 0, 0, TAU); ctx.fill(); ctx.fillStyle = hex('#7a4aff', .5); ctx.beginPath(); ctx.arc(x - 3, ey - 3, 2, 0, TAU); ctx.fill(); }
      else if (!L.extra.includes('deadeyes')) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, ey - 3, 2.6, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, ey, 12, h, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      if (m === 'angry' || m === 'serious') { ctx.fillStyle = shade(L.skin, -.05); ctx.fillRect(x - 13, ey - h - 2, 26, 5); }
    };
    eyeOne(lx, false); eyeOne(rx, m === 'hurt');
    // nose
    ctx.strokeStyle = hex(shade(L.skin, -.35), .7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, 152); ctx.lineTo(146, 170); ctx.lineTo(152, 172); ctx.stroke();
    // mouth
    ctx.strokeStyle = '#6a2a2a'; ctx.lineWidth = 2.6; ctx.beginPath();
    const my = 192;
    switch (m) {
      case 'happy': ctx.moveTo(136, my - 2); ctx.quadraticCurveTo(150, my + 12, 164, my - 2); ctx.stroke(); ctx.fillStyle = hex('#ff7a8a', .28); ctx.beginPath(); ctx.ellipse(116, 170, 12, 6, 0, 0, TAU); ctx.ellipse(184, 170, 12, 6, 0, 0, TAU); ctx.fill(); break;
      case 'sad': ctx.moveTo(138, my + 4); ctx.quadraticCurveTo(150, my - 4, 162, my + 4); ctx.stroke(); break;
      case 'angry': ctx.moveTo(136, my + 2); ctx.lineTo(164, my - 1); ctx.stroke(); break;
      case 'surprised': ctx.fillStyle = '#4a1a1a'; ctx.ellipse(150, my + 2, 6, 8, 0, 0, TAU); ctx.fill(); break;
      case 'hurt': ctx.moveTo(136, my); ctx.quadraticCurveTo(143, my - 4, 150, my); ctx.quadraticCurveTo(157, my + 4, 164, my); ctx.stroke(); break;
      default: ctx.moveTo(140, my); ctx.quadraticCurveTo(150, my + 3, 160, my); ctx.stroke();
    }
    if (m === 'sad' && Math.sin(t) > 0) { ctx.fillStyle = hex('#9ad8ff', .7); ctx.beginPath(); ctx.ellipse(lx - 4, ey + 18 + (t * 20 % 30), 2.5, 4, 0, 0, TAU); ctx.fill(); }
  }
  function drawRobot(ctx, L, m, t) {
    const body = ctx.createLinearGradient(0, 200, 0, 380); body.addColorStop(0, '#5a6a64'); body.addColorStop(1, '#1e2624');
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(0, 380); ctx.quadraticCurveTo(10, 250, 90, 236); ctx.lineTo(210, 236); ctx.quadraticCurveTo(290, 250, 300, 380); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.fillStyle = '#3a4642'; ctx.beginPath(); ctx.arc(40, 280, 52, 0, TAU); ctx.arc(260, 280, 52, 0, TAU); ctx.fill();
    ctx.strokeStyle = hex(L.eye, .6 + .3 * Math.sin(t * 2)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(150, 320, 24, 0, TAU); ctx.moveTo(150, 296); ctx.lineTo(150, 344); ctx.moveTo(126, 320); ctx.lineTo(174, 320); ctx.stroke(); glowCircle(ctx, 150, 320, 40, L.eye, .25);
    // moss
    ctx.fillStyle = hex('#4a8a4a', .7); for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(70 + i * 22, 240 + (i % 3) * 4, 8, 0, TAU); ctx.fill(); }
    const hg = ctx.createLinearGradient(80, 0, 220, 0); hg.addColorStop(0, '#4a5652'); hg.addColorStop(.5, '#7a8a84'); hg.addColorStop(1, '#3a4440');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(84, 200); ctx.lineTo(84, 110); ctx.quadraticCurveTo(90, 50, 150, 46); ctx.quadraticCurveTo(210, 50, 216, 110); ctx.lineTo(216, 200); ctx.quadraticCurveTo(150, 232, 84, 200); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.strokeStyle = hex('#000', .3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, 46); ctx.lineTo(150, 100); ctx.moveTo(100, 180); ctx.lineTo(200, 180); ctx.stroke();
    const vc = { angry: '#ff6a4a', sad: '#7a9aff', happy: '#9affc0', hurt: '#ffb04a', surprised: '#ffffff' }[m] || L.eye;
    ctx.fillStyle = '#0a1012'; ctx.fillRect(98, 124, 104, 30);
    const op = (Math.sin(t * 1.1) > .99) ? .2 : 1;
    ctx.fillStyle = hex(vc, op); ctx.fillRect(108, 134, 30, m === 'serious' ? 5 : 10); ctx.fillRect(162, 134, 30, m === 'serious' ? 5 : 10); glowCircle(ctx, 123, 139, 30, vc, .5 * op); glowCircle(ctx, 177, 139, 30, vc, .5 * op);
    ctx.fillStyle = hex(L.eye, .5); for (let i = 0; i < 5; i++) ctx.fillRect(120 + i * 13, 196, 6, 3);
    if (L.flower) { ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(176, 56); ctx.quadraticCurveTo(180, 36, 186, 22); ctx.stroke(); ctx.fillStyle = '#ffb6d0'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * .3; ctx.beginPath(); ctx.ellipse(186 + Math.cos(a) * 9, 18 + Math.sin(a) * 9, 8, 5, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(186, 18, 5, 0, TAU); ctx.fill(); }
  }
  function drawCloudChild(ctx, L, m, t) {
    ctx.save(); ctx.translate(0, Math.sin(t * 1.5) * 6);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = 80 + Math.sin(t + i) * 6; glowCircle(ctx, 150 + Math.cos(a) * r * .8, 300 + Math.sin(a) * r * .5, 50, '#dfefff', .55); }
    glowCircle(ctx, 150, 150, 160, '#bfe0ff', .25);
    ctx.fillStyle = 'rgba(240,248,255,.95)'; ctx.beginPath(); ctx.ellipse(150, 150, 72, 80, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; ctx.beginPath(); ctx.arc(150 + Math.cos(a) * 74, 128 + Math.sin(a) * 74, 26 + Math.sin(t * 2 + i) * 2, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(80, 170, 22, 0, TAU); ctx.arc(220, 170, 22, 0, TAU); ctx.fill();
    // eyes: big starry
    const eyeY = 158, blink = Math.sin(t * 1.4) > .985;
    [[124, eyeY], [176, eyeY]].forEach(([x, y]) => {
      if (blink || m === 'happy') { ctx.strokeStyle = '#3a5a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + 4, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return; }
      ctx.fillStyle = '#2a4a8a'; ctx.beginPath(); ctx.ellipse(x, y, 11, m === 'surprised' ? 16 : 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = L.eye; ctx.beginPath(); ctx.ellipse(x, y + 4, 8, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, y - 5, 3.5, 0, TAU); ctx.arc(x + 4, y + 5, 1.6, 0, TAU); ctx.fill();
    });
    ctx.strokeStyle = '#5a7ab0'; ctx.lineWidth = 2.5; ctx.beginPath();
    if (m === 'sad' || m === 'hurt') { ctx.moveTo(142, 196); ctx.quadraticCurveTo(150, 190, 158, 196); } else if (m === 'surprised') { ctx.arc(150, 194, 5, 0, TAU); } else { ctx.moveTo(140, 190); ctx.quadraticCurveTo(150, 200, 160, 190); }
    ctx.stroke();
    ctx.fillStyle = hex('#ffaac8', .35); ctx.beginPath(); ctx.ellipse(108, 182, 10, 5, 0, 0, TAU); ctx.ellipse(192, 182, 10, 5, 0, 0, TAU); ctx.fill();
    // star crown sparkle
    ctx.fillStyle = hex('#fff6c0', .7 + .3 * Math.sin(t * 3)); star(ctx, 150, 54, 9, 4); glowCircle(ctx, 150, 54, 30, '#fff6c0', .5);
    ctx.restore();
  }
  function drawVoidKing(ctx, L, m, t) {
    for (let i = 0; i < 10; i++) { ctx.strokeStyle = hex('#2a0a4a', .6); ctx.lineWidth = 8 - i * .5; ctx.beginPath(); ctx.moveTo(150, 260); ctx.bezierCurveTo(150 + Math.sin(t + i) * 120, 300, 150 + Math.cos(t * .7 + i * 2) * 160, 340, (i / 9) * 300, 400); ctx.stroke(); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(20, 380); ctx.quadraticCurveTo(40, 230, 100, 220); ctx.lineTo(200, 220); ctx.quadraticCurveTo(260, 230, 280, 380); ctx.fill(); rimStroke(ctx, L.rim, 2);
    ctx.beginPath(); ctx.ellipse(150, 140, 70, 86, 0, 0, TAU); ctx.fill(); rimStroke(ctx, L.rim, 2.5);
    ctx.fillStyle = '#0a0410'; ctx.beginPath(); ctx.moveTo(80, 80); for (let k = 0; k <= 6; k++) ctx.lineTo(80 + k * 140 / 6, k % 2 ? 0 + Math.sin(t + k) * 4 : 60); ctx.lineTo(220, 80); ctx.fill(); rimStroke(ctx, '#ffd27a', 1.5);
    const eo = .7 + .3 * Math.sin(t * 2);
    [[120, 140], [180, 140], [150, 110]].forEach(([x, y], i) => { glowCircle(ctx, x, y, 26, '#ffffff', .45 * eo); ctx.fillStyle = hex('#ffffff', eo); ctx.beginPath(); ctx.ellipse(x, y, i === 2 ? 5 : 9, i === 2 ? 3 : 4, 0, 0, TAU); ctx.fill(); });
  }
  function star(ctx, x, y, R, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function shade(h, amt) { const n = parseInt(h.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } return '#' + ((1 << 24) | (r << 16) | (g << 8) | b | 0).toString(16).slice(1); }

  // ---------- enemies ----------
  function drawEnemy(ctx, look, col, x, y, s, t, hurt, dead) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    if (dead) ctx.globalAlpha = Math.max(0, 1 - dead);
    const bob = Math.sin(t * 2 + x) * 4;
    const dark = '#0c0a12', mid = '#1e1a2a';
    glowCircle(ctx, 0, 0, 90, col, .18);
    const eye = (ex, ey, r = 5) => { glowCircle(ctx, ex, ey, r * 4, col, .6); ctx.fillStyle = hurt ? '#fff' : col; ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); };
    const body = (g0, g1) => { const gr = ctx.createLinearGradient(0, -80, 0, 80); gr.addColorStop(0, g0); gr.addColorStop(1, g1); return gr; };
    ctx.fillStyle = body(mid, dark);
    if (look[0] === '@') look = 'samurai'; else if (look === 'moth' || look === 'spark') look = 'drone';
    switch (look) {
      case 'drone': ctx.translate(0, bob * 2); ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill(); rimStroke(ctx, col, 2); ctx.strokeStyle = hex(col, .6); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -30, 50, 8 * Math.abs(Math.sin(t * 20)), 0, 0, TAU); ctx.stroke(); eye(0, 4, 10); ctx.fillStyle = dark; ctx.fillRect(-4, 30, 8, 18); ctx.fillRect(-30, 18, 6, 22); ctx.fillRect(24, 18, 6, 22); break;
      case 'soldier': ctx.beginPath(); ctx.moveTo(-30, 80); ctx.lineTo(-36, -10); ctx.quadraticCurveTo(-30, -40, 0, -42); ctx.quadraticCurveTo(30, -40, 36, -10); ctx.lineTo(30, 80); ctx.fill(); ctx.beginPath(); ctx.arc(0, -58, 20, 0, TAU); ctx.fill(); rimStroke(ctx, col, 2); ctx.fillStyle = hex(col, .9); ctx.fillRect(-14, -62, 28, 6); glowCircle(ctx, 0, -59, 24, col, .4); ctx.fillStyle = dark; ctx.save(); ctx.rotate(-.5); ctx.fillRect(10, -20, 70, 8); ctx.restore(); break;
      case 'beast': ctx.translate(0, Math.abs(bob)); ctx.beginPath(); ctx.moveTo(-70, 30); ctx.quadraticCurveTo(-60, -40, 0, -36); ctx.quadraticCurveTo(50, -40, 64, -20); ctx.lineTo(80, -10); ctx.lineTo(60, 10); ctx.lineTo(60, 50); ctx.lineTo(44, 50); ctx.lineTo(40, 20); ctx.lineTo(-40, 26); ctx.lineTo(-44, 50); ctx.lineTo(-58, 50); ctx.closePath(); ctx.fill(); rimStroke(ctx, col, 2); ctx.fillStyle = dark; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 16, -34); ctx.lineTo(-42 + i * 16, -56 - (i % 2) * 8); ctx.lineTo(-34 + i * 16, -36); ctx.fill(); } eye(58, -16, 4); eye(48, -18, 3); break;
      case 'wraith': ctx.translate(0, bob * 2); ctx.globalAlpha *= .9; ctx.beginPath(); ctx.moveTo(0, -70); ctx.quadraticCurveTo(46, -60, 40, 0); for (let i = 0; i <= 6; i++) ctx.lineTo(40 - i * 80 / 6, 70 + Math.sin(t * 4 + i) * 10 + (i % 2) * 14); ctx.quadraticCurveTo(-46, -60, 0, -70); ctx.fill(); rimStroke(ctx, col, 2); eye(-12, -36, 5); eye(12, -36, 5); break;
      case 'golem': ctx.fillRect(-50, -40, 100, 90); ctx.fillRect(-30, -76, 60, 40); ctx.fillRect(-80, -36, 30, 70); ctx.fillRect(50, -36, 30, 70); ctx.beginPath(); ctx.rect(-50, -40, 100, 90); rimStroke(ctx, col, 2); eye(-12, -58, 5); eye(12, -58, 5); ctx.strokeStyle = hex(col, .7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(0, 10); ctx.lineTo(20, -10); ctx.moveTo(0, 10); ctx.lineTo(0, 36); ctx.stroke(); break;
      case 'cultist': ctx.beginPath(); ctx.moveTo(0, -80); ctx.quadraticCurveTo(40, -70, 36, -30); ctx.lineTo(50, 80); ctx.lineTo(-50, 80); ctx.lineTo(-36, -30); ctx.quadraticCurveTo(-40, -70, 0, -80); ctx.fill(); rimStroke(ctx, col, 2); ctx.fillStyle = hex('#f0e8f4', .9); ctx.beginPath(); ctx.ellipse(0, -46, 16, 20, 0, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-10, -50, 7, 2); ctx.fillRect(3, -50, 7, 2); glowCircle(ctx, 30, 10, 20, '#ffcf6a', .7); ctx.fillStyle = '#e8d8b0'; ctx.fillRect(28, 12, 4, 14); break;
      case 'samurai': ctx.beginPath(); ctx.moveTo(-44, 80); ctx.lineTo(-50, -20); ctx.lineTo(-30, -36); ctx.lineTo(30, -36); ctx.lineTo(50, -20); ctx.lineTo(44, 80); ctx.fill(); ctx.beginPath(); ctx.arc(0, -56, 22, 0, TAU); ctx.fill(); rimStroke(ctx, col, 2); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(-6, -74); ctx.lineTo(-30, -104); ctx.lineTo(-10, -78); ctx.moveTo(6, -74); ctx.lineTo(30, -104); ctx.lineTo(10, -78); ctx.fill(); eye(-8, -56, 3); eye(8, -56, 3); ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, 30); ctx.lineTo(90, -60); ctx.stroke(); break;
      case 'mech': ctx.fillRect(-46, -50, 92, 60); ctx.fillRect(-36, 10, 20, 70); ctx.fillRect(16, 10, 20, 70); ctx.fillRect(-70, -40, 24, 50); ctx.fillRect(46, -40, 24, 50); ctx.beginPath(); ctx.rect(-46, -50, 92, 60); rimStroke(ctx, col, 2); ctx.fillStyle = hex(col, .9); ctx.fillRect(-30, -36, 60, 10); glowCircle(ctx, 0, -31, 40, col, .4); break;
      default: drawBoss(ctx, look, col, t, hurt, eye, body);
    }
    if (hurt) { ctx.globalCompositeOperation = 'lighter'; glowCircle(ctx, 0, 0, 90, '#ffffff', .4 * hurt); }
    ctx.restore();
  }
  function drawBoss(ctx, look, col, t, hurt, eye, body) {
    const dark = '#0a0810';
    ctx.fillStyle = body('#241e30', dark);
    switch (look) {
      case 'boss_crane': ctx.fillRect(-60, -10, 120, 80); ctx.fillRect(-10, -100, 20, 100); ctx.save(); ctx.translate(0, -100); ctx.rotate(Math.sin(t) * .15); ctx.fillRect(-90, -8, 180, 14); ctx.fillRect(80, -8, 4, 60 + Math.sin(t * 2) * 10); ctx.beginPath(); ctx.moveTo(70, 56); ctx.lineTo(82, 80); ctx.lineTo(94, 56); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.rect(-60, -10, 120, 80); rimStroke(ctx, col, 2); eye(-24, 20, 8); eye(24, 20, 8); ctx.fillStyle = '#2a2018'; for (let i = 0; i < 6; i++) ctx.fillRect(-60 + i * 22, 70, 16, 12); break;
      case 'boss_glass': ctx.beginPath(); ctx.moveTo(0, -90); ctx.quadraticCurveTo(40, -80, 30, -30); ctx.lineTo(60, 90); ctx.lineTo(-60, 90); ctx.lineTo(-30, -30); ctx.quadraticCurveTo(-40, -80, 0, -90); ctx.fill(); rimStroke(ctx, col, 2.5); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .4, r = 80 + Math.sin(t * 2 + i) * 8; ctx.save(); ctx.translate(Math.cos(a) * r, -30 + Math.sin(a) * r * .7); ctx.rotate(a); ctx.fillStyle = hex('#ffd0e8', .55); ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(5, 0); ctx.lineTo(0, 16); ctx.lineTo(-5, 0); ctx.fill(); ctx.restore(); } eye(-8, -60, 3); eye(8, -60, 3); break;
      case 'boss_admiral': ctx.beginPath(); ctx.moveTo(-60, 90); ctx.lineTo(-56, -20); ctx.quadraticCurveTo(-40, -46, 0, -48); ctx.quadraticCurveTo(40, -46, 56, -20); ctx.lineTo(60, 90); ctx.fill(); ctx.beginPath(); ctx.arc(0, -70, 24, 0, TAU); ctx.fill(); rimStroke(ctx, col, 2); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(-48, -30, 22, 8, -.3, 0, TAU); ctx.ellipse(48, -30, 22, 8, .3, 0, TAU); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-40, -86); ctx.lineTo(40, -86); ctx.lineTo(30, -100); ctx.lineTo(-30, -100); ctx.fill(); ctx.fillRect(56, -10, 50, 26); glowCircle(ctx, 108, 3, 18, '#ff6a2a', .6 + .3 * Math.sin(t * 4)); eye(-8, -70, 3); eye(9, -70, 5); break;
      case 'boss_shogun': ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) glowCircle(ctx, Math.sin(t * 3 + i) * 40, -40 - i * 10, 40, '#ff6a1a', .15); ctx.restore(); ctx.beginPath(); ctx.moveTo(-70, 90); ctx.lineTo(-80, -20); ctx.lineTo(-40, -50); ctx.lineTo(40, -50); ctx.lineTo(80, -20); ctx.lineTo(70, 90); ctx.fill(); ctx.beginPath(); ctx.arc(0, -72, 26, 0, TAU); ctx.fill(); rimStroke(ctx, col, 2.5); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(-8, -94); ctx.lineTo(-50, -140); ctx.lineTo(-14, -98); ctx.moveTo(8, -94); ctx.lineTo(50, -140); ctx.lineTo(14, -98); ctx.fill(); ctx.beginPath(); ctx.arc(0, -98, 8, 0, TAU); ctx.fill(); eye(-10, -72, 4); eye(10, -72, 4); ctx.strokeStyle = '#ffe0c0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-60, 40); ctx.lineTo(-120, -80); ctx.stroke(); glowCircle(ctx, -90, -20, 40, col, .3); break;
      case 'boss_king': for (let i = 0; i < 12; i++) { ctx.strokeStyle = hex('#1a0630', .8); ctx.lineWidth = 10 - i * .5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(Math.sin(t + i) * 120, 40, Math.cos(t * .8 + i) * 160, 80, (i - 6) * 30, 130); ctx.stroke(); } ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, -20, 70, 90, 0, 0, TAU); ctx.fill(); rimStroke(ctx, col, 3); ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.moveTo(-60, -90); for (let k = 0; k <= 8; k++) ctx.lineTo(-60 + k * 15, k % 2 ? -150 + Math.sin(t + k) * 6 : -100); ctx.lineTo(60, -90); ctx.fill(); rimStroke(ctx, '#ffd27a', 2); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * .3; eye(Math.cos(a) * 36, -20 + Math.sin(a) * 46, 4 + (i % 2) * 2); } eye(0, -30, 10); break;
    }
  }

  return { BG, prepare, drawBg, drawPortrait, drawEnemy, glowCircle, hex, LOOK, NPCLOOK, look, setChapter: f => { chOf = f; }, setNpcs: n => { NP = n; }, star };
})();

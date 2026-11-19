// ROTTA D'AURORA — walking sprites, explorable side-scrolling levels, world map, organic textures
'use strict';
const WORLD = (() => {
  const TAU = Math.PI * 2;
  const hex = ART.hex, glow = ART.glowCircle;
  const rngOf = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------------- value noise / fbm ----------------
  function makeNoise(seed) {
    const r = rngOf(seed), P = new Float32Array(256 * 256); for (let i = 0; i < P.length; i++) P[i] = r();
    const at = (x, y) => P[((y & 255) << 8) | (x & 255)];
    const sm = t => t * t * (3 - 2 * t);
    const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
    return (x, y, oct = 5) => { let v = 0, amp = .5, f = 1; for (let i = 0; i < oct; i++) { v += n(x * f, y * f) * amp; amp *= .5; f *= 2.03; } return v; };
  }
  const NZ = makeNoise(7);
  // soft organic cloud texture (tileable horizontally enough for scrolling)
  function cloudTexture(w, h, col, alpha, seed = 1) {
    const c = mk(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), n = parseInt(col.slice(1), 16);
    const R = n >> 16 & 255, Gc = n >> 8 & 255, B = n & 255; const nz = makeNoise(seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = nz(x / w * 6, y / h * 3, 6); const band = Math.sin(y / h * Math.PI);
      let a = Math.max(0, (v - .42) * 3.2) * band; a = Math.min(1, a) * alpha;
      const lit = 1 + (nz(x / w * 6 + 3, y / h * 3 - .08, 3) - .5) * .7;
      const i = (y * w + x) * 4; img.data[i] = Math.min(255, R * lit + 18); img.data[i + 1] = Math.min(255, Gc * lit + 14); img.data[i + 2] = Math.min(255, B * lit + 24); img.data[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0); return c;
  }
  // painterly grain
  let grain = null;
  function grainPattern(ctx) {
    if (!grain) { const c = mk(160, 160), g = c.getContext('2d'), img = g.createImageData(160, 160); for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); grain = ctx.createPattern(c, 'repeat'); }
    return grain;
  }
  function drawGrain(ctx, W, H, t) {
    ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPattern(ctx); ctx.translate((t * 37 | 0) % 160, (t * 23 | 0) % 160); ctx.fillRect(-160, -160, W + 320, H + 320); ctx.restore();
  }

  // ---------------- organic shapes ----------------
  function blob(ctx, cx, cy, rx, ry, seed, wob = .18, pts = 24) {
    const r = rngOf(seed); const off = Array.from({ length: pts }, () => 1 + (r() - .5) * wob * 2);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) { const k = i % pts, a = k / pts * TAU; const px = cx + Math.cos(a) * rx * off[k], py = cy + Math.sin(a) * ry * off[k]; const k2 = (i + 1) % pts, a2 = k2 / pts * TAU; const nx = cx + Math.cos(a2) * rx * off[k2], ny = cy + Math.sin(a2) * ry * off[k2]; if (i === 0) ctx.moveTo((px + nx) / 2, (py + ny) / 2); else ctx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2); }
    ctx.closePath();
  }
  function tree(ctx, x, y, h, col, seed, opts = {}) {
    const r = rngOf(seed); ctx.strokeStyle = col; ctx.lineCap = 'round';
    const branch = (x0, y0, len, ang, w, d) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + (r() - .5) * len * .3, (y0 + y1) / 2, x1, y1); ctx.stroke();
      if (d <= 0 || len < 6) { if (opts.leaves) { ctx.fillStyle = opts.leaves; blob(ctx, x1, y1, 7 + r() * 9, 6 + r() * 7, seed + d * 13 + (x1 | 0), .35, 10); ctx.fill(); } if (opts.blossom && r() < .5) { ctx.fillStyle = opts.blossom; ctx.beginPath(); ctx.arc(x1, y1, 2.5, 0, TAU); ctx.fill(); } return; }
      const n = 2 + (r() < .3 ? 1 : 0); for (let i = 0; i < n; i++) branch(x1, y1, len * (.62 + r() * .18), ang + (r() - .5) * 1.1, w * .66, d - 1);
    };
    branch(x, y, h * .32, -Math.PI / 2 + (r() - .5) * .2, Math.max(2, h * .06), opts.depth || 5);
  }
  function grassTufts(ctx, x0, x1, ground, col, seed, dens = .25, t = 0) {
    const r = rngOf(seed); ctx.strokeStyle = col; ctx.lineWidth = 1.3;
    for (let x = x0; x < x1; x += 4) { if (r() > dens) continue; const gy = ground(x), h = 5 + r() * 11, sway = Math.sin(t * 1.6 + x * .05) * 2.5; ctx.beginPath(); ctx.moveTo(x, gy + 2); ctx.quadraticCurveTo(x + sway * .5, gy - h * .5, x + sway + (r() - .5) * 4, gy - h); ctx.stroke(); }
  }

  // ---------------- walking character sprites ----------------
  function walker(ctx, id, x, y, sc, t, walking, face, npc, o = {}) {
    const L = (ART.LOOK[id]) || (npc && Object.assign({}, ART.LOOK[npc.base] || ART.LOOK.villager, npc.color ? { cloth: npc.color } : {})) || ART.LOOK.villager;
    const ph = walking ? t * 9 : 0, sw = walking ? Math.sin(ph) : 0, bob = walking ? Math.abs(Math.cos(ph)) * 2.5 : Math.sin(t * 2) * .8;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc * face, sc);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 4.5, 0, 0, TAU); ctx.fill();
    if (o.glowCol) glow(ctx, 0, -40, 50, o.glowCol, .25);
    if (L.cloud) { // Nuvola floats
      const fy = -34 + Math.sin(t * 2.4) * 4; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; glow(ctx, Math.cos(a) * 12, fy + 14 + Math.sin(a) * 5, 12, '#dfefff', .6); }
      ctx.fillStyle = 'rgba(244,250,255,.97)'; blob(ctx, 0, fy, 15, 16, 11, .12, 14); ctx.fill(); ctx.fillStyle = '#2a4a8a'; ctx.beginPath(); ctx.ellipse(4, fy, 2.4, 3.2, 0, 0, TAU); ctx.ellipse(10, fy, 2.4, 3.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(3.5, fy - 2, 1.2, 1.2); ctx.fillRect(9.5, fy - 2, 1.2, 1.2);
      ctx.fillStyle = hex('#fff6c0', .8 + .2 * Math.sin(t * 3)); ART.star(ctx, 0, fy - 20, 4, 1.8); ctx.restore(); return;
    }
    if (L.void) { ctx.fillStyle = '#000'; blob(ctx, 0, -40, 18, 40, 5, .2, 16); ctx.fill(); glow(ctx, 6, -64, 10, '#fff', .8); ctx.restore(); return; }
    const robot = L.robot, big = robot ? 1.25 : L.child ? .8 : 1;
    ctx.scale(big, big);
    const legC = robot ? '#3a4642' : shadeHex(L.cloth, -.45), boot = robot ? '#252c2a' : '#1e140e';
    // back arm
    limb(ctx, -2, -30 - bob, -sw * 9, robot ? '#4a5652' : shadeHex(L.cloth, -.25), robot ? 7 : 4.2, 15);
    // legs
    limb(ctx, -3, -17 - bob * .5, sw * 10, legC, robot ? 8 : 4.8, 17, boot);
    limb(ctx, 3, -17 - bob * .5, -sw * 10, legC, robot ? 8 : 4.8, 17, boot);
    // torso
    const ty = -36 - bob;
    if (robot) { ctx.fillStyle = '#5a6a64'; blob(ctx, 0, ty + 6, 15, 14, 3, .08, 12); ctx.fill(); ctx.fillStyle = hex(L.eye, .7 + .3 * Math.sin(t * 2)); ctx.beginPath(); ctx.arc(2, ty + 6, 3, 0, TAU); ctx.fill(); glow(ctx, 2, ty + 6, 10, L.eye, .5); ctx.fillStyle = hex('#4a8a4a', .8); ctx.beginPath(); ctx.arc(-8, ty - 6, 4, 0, TAU); ctx.arc(-2, ty - 8, 3, 0, TAU); ctx.fill(); }
    else {
      const tg = ctx.createLinearGradient(0, ty - 10, 0, ty + 18); tg.addColorStop(0, shadeHex(L.cloth, .15)); tg.addColorStop(1, shadeHex(L.cloth, -.3));
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-7, ty - 10); ctx.quadraticCurveTo(-10, ty + 6, -9 - (L.extra.includes('kimono') || id === 'sable' || id === 'vedova' ? 3 : 0), ty + 19); ctx.lineTo(9 + (L.extra.includes('kimono') ? 3 : 0), ty + 19); ctx.quadraticCurveTo(10, ty + 6, 7, ty - 10); ctx.quadraticCurveTo(0, ty - 13, -7, ty - 10); ctx.fill();
      ctx.fillStyle = L.cloth2; ctx.fillRect(-8, ty + 8, 16, 2.6);
      if (L.extra.includes('scarf')) { ctx.fillStyle = L.cloth2; ctx.beginPath(); ctx.moveTo(-6, ty - 10); ctx.quadraticCurveTo(0, ty - 5, 6, ty - 10); ctx.lineTo(6, ty - 6); ctx.quadraticCurveTo(0, ty - 1, -6, ty - 6); ctx.fill(); const fl = walking ? 1 : .4; ctx.beginPath(); ctx.moveTo(-4, ty - 8); ctx.quadraticCurveTo(-14, ty - 6 + Math.sin(t * 7) * 3 * fl, -22 * fl - 6, ty - 2 + Math.sin(t * 6 + 1) * 4 * fl); ctx.quadraticCurveTo(-12, ty - 2, -3, ty - 5); ctx.fill(); }
      if (id === 'sable' || L.extra.includes('hood')) { ctx.fillStyle = hex(shadeHex(L.cloth, -.2), .95); ctx.beginPath(); ctx.moveTo(-7, ty - 11); ctx.quadraticCurveTo(-18 - (walking ? 4 : 0), ty + 8, -16 - (walking ? 6 + Math.sin(t * 6) * 2 : 0), ty + 22); ctx.lineTo(-4, ty + 18); ctx.fill(); }
      if (L.extra.includes('epaulettes')) { ctx.fillStyle = L.cloth2; ctx.beginPath(); ctx.ellipse(-6, ty - 9, 4, 2, 0, 0, TAU); ctx.ellipse(6, ty - 9, 4, 2, 0, 0, TAU); ctx.fill(); }
      if (id === 'kai' || L.extra.includes('armor') && id !== 'raiden') { ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-9, ty + 10); ctx.lineTo(-24, ty + 24); ctx.stroke(); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, ty + 7); ctx.lineTo(-10, ty + 11); ctx.stroke(); }
      if (id === 'otto') { ctx.strokeStyle = '#b0b8c0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(7, ty + 12); ctx.lineTo(10, ty + 22); ctx.stroke(); ctx.beginPath(); ctx.arc(10, ty + 24, 2.5, 0, TAU); ctx.stroke(); }
    }
    // head
    const hy = ty - 20 + (walking ? Math.sin(ph * 2) * .6 : 0);
    if (robot) { ctx.fillStyle = '#7a8a84'; blob(ctx, 1, hy + 2, 12, 11, 9, .06, 12); ctx.fill(); ctx.fillStyle = '#0a1012'; ctx.fillRect(-3, hy, 14, 5); ctx.fillStyle = L.eye; ctx.fillRect(1, hy + 1, 4, 2.5); ctx.fillRect(7, hy + 1, 4, 2.5); glow(ctx, 6, hy + 2, 12, L.eye, .6); }
    else {
      const hc = L.hair;
      // back hair
      ctx.fillStyle = hc;
      if (L.hs === 'long' || L.hs === 'long_side') { ctx.beginPath(); ctx.moveTo(-8, hy - 4); ctx.quadraticCurveTo(-13, hy + 12, -9 - (walking ? Math.sin(t * 6) * 2 : 0), hy + 20); ctx.lineTo(3, hy + 10); ctx.fill(); }
      if (L.hs === 'bob') { ctx.beginPath(); ctx.moveTo(-9, hy - 4); ctx.quadraticCurveTo(-12, hy + 7, -7, hy + 10); ctx.lineTo(6, hy + 9); ctx.lineTo(8, hy); ctx.fill(); }
      ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(1, hy, 8.5, 9.5, 0, 0, TAU); ctx.fill();
      // eyes facing right
      ctx.fillStyle = '#1a1018'; const blink = Math.sin(t * 1.3 + x) > .985;
      if (!L.extra.includes('mask') && !L.extra.includes('visor')) { if (blink) { ctx.fillRect(3, hy + 1, 2.4, .9); ctx.fillRect(7.4, hy + 1, 2.2, .9); } else { ctx.beginPath(); ctx.ellipse(4.2, hy + 1, 1.3, 2, 0, 0, TAU); ctx.ellipse(8.4, hy + 1, 1.2, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = hex(L.eye, .9); ctx.fillRect(3.8, hy + 1.2, 1, 1); ctx.fillRect(8, hy + 1.2, 1, 1); } }
      if (L.extra.includes('mask')) { ctx.fillStyle = '#f0e8f4'; ctx.beginPath(); ctx.ellipse(3, hy + 1, 7, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = L.eye; ctx.fillRect(4, hy, 5, 1.2); }
      if (L.extra.includes('visor')) { ctx.fillStyle = '#20242c'; ctx.beginPath(); ctx.ellipse(1, hy - 1, 9.5, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = L.cloth2; ctx.fillRect(0, hy - 1, 10, 2.5); }
      ctx.fillStyle = hex('#ff7a8a', .25); ctx.beginPath(); ctx.ellipse(6, hy + 4.5, 2.2, 1.2, 0, 0, TAU); ctx.fill();
      if (L.extra.includes('beard') || L.extra.includes('longbeard')) { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-2, hy + 4); ctx.quadraticCurveTo(4, hy + (L.extra.includes('longbeard') ? 22 : 15), 9, hy + 4); ctx.fill(); }
      // front hair
      ctx.fillStyle = hc;
      switch (L.hs) {
        case 'bob': ctx.beginPath(); ctx.moveTo(-9, hy + 2); ctx.quadraticCurveTo(-9, hy - 12, 2, hy - 11); ctx.quadraticCurveTo(11, hy - 10, 10, hy - 2); ctx.lineTo(6, hy - 4); ctx.lineTo(4, hy - 1); ctx.lineTo(1, hy - 5); ctx.quadraticCurveTo(-4, hy - 3, -9, hy + 2); ctx.fill(); break;
        case 'topknot': ctx.beginPath(); ctx.moveTo(-8, hy + 1); ctx.quadraticCurveTo(-8, hy - 11, 2, hy - 10.5); ctx.quadraticCurveTo(10, hy - 10, 10, hy - 3); ctx.lineTo(5, hy - 5); ctx.lineTo(1, hy - 3); ctx.lineTo(-2, hy - 6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(-3, hy - 12, 3.4, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-5, hy - 12); ctx.quadraticCurveTo(-16, hy - 10 + Math.sin(t * 5) * 2, -17 - (walking ? 4 : 0), hy + 2 + Math.sin(t * 6) * 2); ctx.quadraticCurveTo(-12, hy - 6, -4, hy - 10); ctx.fill(); break;
        case 'messy': ctx.beginPath(); ctx.moveTo(-9, hy + 1); for (let i = 0; i <= 8; i++) { const a = Math.PI * (1 + i / 8), rr = i % 2 ? 10 : 13; ctx.lineTo(1 + Math.cos(a) * rr, hy - 2 + Math.sin(a) * rr); } ctx.lineTo(10, hy - 1); ctx.quadraticCurveTo(2, hy - 6, -9, hy + 1); ctx.fill(); break;
        case 'long': case 'long_side': ctx.beginPath(); ctx.moveTo(-9, hy + 3); ctx.quadraticCurveTo(-9, hy - 12, 2, hy - 11); ctx.quadraticCurveTo(11, hy - 10, 10, hy + (L.hs === 'long_side' ? 4 : -2)); ctx.quadraticCurveTo(4, hy - 6, -9, hy + 3); ctx.fill(); break;
        case 'slick': case 'short': ctx.beginPath(); ctx.moveTo(-8.5, hy); ctx.quadraticCurveTo(-8, hy - 11, 2, hy - 10.5); ctx.quadraticCurveTo(10, hy - 10, 9.5, hy - 3); ctx.quadraticCurveTo(2, hy - 7, -8.5, hy); ctx.fill(); break;
        case 'bun': ctx.beginPath(); ctx.moveTo(-8.5, hy); ctx.quadraticCurveTo(-8, hy - 11, 2, hy - 10.5); ctx.quadraticCurveTo(10, hy - 10, 9.5, hy - 3); ctx.quadraticCurveTo(2, hy - 7, -8.5, hy); ctx.fill(); ctx.beginPath(); ctx.arc(-4, hy - 11, 4.5, 0, TAU); ctx.fill(); break;
      }
      if (L.extra.includes('goggles')) { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(1, hy - 8, 3, 0, TAU); ctx.arc(7, hy - 7, 3, 0, TAU); ctx.fill(); ctx.fillStyle = hex('#7fe8ff', .9); ctx.beginPath(); ctx.arc(1, hy - 8, 1.8, 0, TAU); ctx.arc(7, hy - 7, 1.8, 0, TAU); ctx.fill(); }
      if (L.extra.includes('goggles_eyes')) { ctx.fillStyle = '#b08a4a'; ctx.beginPath(); ctx.arc(2, hy - 6, 2.8, 0, TAU); ctx.arc(7.5, hy - 5.5, 2.8, 0, TAU); ctx.fill(); }
      if (L.extra.includes('helmet') || L.extra.includes('armor') && id === 'raiden') { ctx.fillStyle = id === 'raiden' ? '#3a1010' : '#5a5a6a'; ctx.beginPath(); ctx.arc(1, hy - 2, 10, Math.PI, 0); ctx.fill(); if (id === 'raiden') { ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(0, hy - 10); ctx.lineTo(-6, hy - 20); ctx.lineTo(2, hy - 11); ctx.lineTo(10, hy - 20); ctx.lineTo(4, hy - 10); ctx.fill(); } }
      if (L.extra.includes('hat')) { ctx.fillStyle = '#3a2010'; ctx.fillRect(-10, hy - 9, 22, 3); ctx.fillRect(-6, hy - 17, 14, 9); }
      if (L.extra.includes('cap')) { ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.arc(1, hy - 4, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(4, hy - 5, 10, 2.5); }
      if (L.extra.includes('hood')) { ctx.fillStyle = L.cloth; ctx.beginPath(); ctx.moveTo(-11, hy + 8); ctx.quadraticCurveTo(-12, hy - 16, 3, hy - 13); ctx.quadraticCurveTo(13, hy - 10, 11, hy + 2); ctx.quadraticCurveTo(4, hy - 8, -2, hy + 8); ctx.fill(); }
      if (L.extra.includes('veil')) { ctx.fillStyle = hex('#0a0410', .8); ctx.beginPath(); ctx.moveTo(-10, hy + 14); ctx.quadraticCurveTo(-12, hy - 16, 2, hy - 13); ctx.quadraticCurveTo(13, hy - 10, 11, hy - 1); ctx.lineTo(4, hy - 3); ctx.quadraticCurveTo(-2, hy + 4, -4, hy + 16); ctx.fill(); }
    }
    // front arm
    limb(ctx, 2, -30 - bob, sw * 9, robot ? '#5a6a64' : shadeHex(L.cloth, -.05), robot ? 7 : 4.2, 15, robot ? null : L.skin);
    // rim light
    if (L.rim) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 9, ty - 4, 22, L.rim, .12); }
    ctx.restore();
  }
  function limb(ctx, x, y, swingDeg, col, w, len, endCol) {
    const a = swingDeg * Math.PI / 180, kx = x + Math.sin(a) * len * .5, ky = y + Math.cos(a) * len * .5;
    const ex = kx + Math.sin(a * .4) * len * .5, ey = ky + len * .5;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(kx, ky, ex, ey); ctx.stroke();
    if (endCol) { ctx.fillStyle = endCol; ctx.beginPath(); ctx.ellipse(ex + 1, ey, w * .7, w * .55, 0, 0, TAU); ctx.fill(); }
  }
  function shadeHex(h, amt) { const n = parseInt(h.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } return '#' + ((1 << 24) | (r << 16) | (g << 8) | b | 0).toString(16).slice(1); }

  // ---------------- level themes ----------------
  const THEMES = {
    lutece: { top: '#2a2440', body: '#141026', edge: '#6a5a8a', grass: '#3a3a5a', props: ['lamp', 'chimney', 'lamp', 'bench', 'house'], mid: 'house', midC: '#1a1a3a', light: '#ffcf6a' },
    rust: { top: '#4a2a1e', body: '#1e0f0a', edge: '#a0582a', grass: '#5a3a20', props: ['gear', 'pipe', 'crate', 'barrel', 'scrap'], mid: 'crane', midC: '#2a1410', light: '#ff8a3a' },
    garden: { top: '#1e4a3a', body: '#0a1c18', edge: '#5aa080', grass: '#4a9a6a', props: ['tree', 'fern', 'pillar', 'flower', 'fern'], mid: 'tree', midC: '#0e2a26', light: '#9affd0', leaves: '#2a6a50' },
    market: { top: '#3a1e2a', body: '#140a12', edge: '#a05a4a', grass: '#5a2a3a', props: ['stall', 'lantern', 'crate', 'lantern', 'barrel'], mid: 'pagoda', midC: '#220c2a', light: '#ffb05a' },
    church: { top: '#241a30', body: '#0a0612', edge: '#6a4a8a', grass: '#3a2a4a', props: ['candle', 'pillar', 'candle', 'statue'], mid: 'spire', midC: '#140a20', light: '#ff4d8d' },
    deck: { top: '#4a3020', body: '#1a0f08', edge: '#8a6040', grass: '#5a3a24', props: ['barrel', 'rope', 'crate', 'mast'], mid: 'cloud', midC: '#1e2a40', light: '#ffcf6a' },
    snow: { top: '#c8d0dc', body: '#2a323e', edge: '#ffffff', grass: '#9aa6b4', props: ['deadtree', 'rock', 'deadtree', 'grave'], mid: 'deadtree', midC: '#3a4250', light: '#dfe8ff' },
    dream: { top: '#8a4a8a', body: '#2a0a3a', edge: '#ffb0d0', grass: '#d080b0', props: ['flower', 'crystal', 'tree', 'flower'], mid: 'tree', midC: '#5a2a6a', light: '#ffd0e8', leaves: '#ffb0d0' },
    akatsuki: { top: '#3a1014', body: '#14060a', edge: '#c0462a', grass: '#5a1a1e', props: ['torii', 'stonelamp', 'sakura', 'stonelamp'], mid: 'pagoda', midC: '#1e060c', light: '#ff9a4a', leaves: '#1a0408', blossom: '#ff3a4a' },
    hollow: { top: '#140a20', body: '#05020a', edge: '#8a5aff', grass: '#2a1a4a', props: ['crystal', 'rock', 'crystal', 'spike'], mid: 'spike', midC: '#0a0614', light: '#c08aff' },
    dawn: { top: '#6a5a3a', body: '#3a2a3a', edge: '#ffe0a0', grass: '#a0c060', props: ['tree', 'flower', 'house', 'flower'], mid: 'tree', midC: '#6a4a7a', light: '#fff0c0', leaves: '#7aa04a' },
  };
  function themeFor(bg) {
    if (/lutece/.test(bg)) return 'lutece'; if (/rust|forge/.test(bg)) return 'rust'; if (/garden|giant/.test(bg)) return 'garden'; if (/market|theatre/.test(bg)) return 'market';
    if (/cathedral|crypt/.test(bg)) return 'church'; if (/storm|flagship|skyship|sky_open/.test(bg)) return 'deck'; if (/silence|white/.test(bg)) return 'snow'; if (/dream/.test(bg)) return 'dream';
    if (/akatsuki|dojo/.test(bg)) return 'akatsuki'; if (/hollow/.test(bg)) return 'hollow'; if (/dawn|camp/.test(bg)) return 'dawn'; return 'lutece';
  }

  // ---------------- level ----------------
  let LV = null;
  function buildLevel(ch, W, H) {
    const th = THEMES[themeFor(ch.map.bg)], seed = ch.num * 977;
    const nodes = ch.map.nodes.slice().sort((a, b) => ((1 - a.y) + a.x * .08) - ((1 - b.y) + b.x * .08));
    let x = W * .5; const pos = {};
    nodes.forEach((n, i) => { const want = W * .45 + (1 - n.y) * W * 3.4 + n.x * 40; x = i === 0 ? want : Math.max(x + 175, want); pos[n.id] = x; });
    const width = x + W * .6;
    const base = H * .76, nz = makeNoise(seed);
    const ground = gx => base + (nz(gx / 420, 1.3, 3) - .5) * 46;
    const r = rngOf(seed + 5); const props = []; for (let px = 40; px < width; px += 50 + r() * 90) { if (Object.values(pos).some(p => Math.abs(p - px) < 70)) continue; props.push({ x: px, k: th.props[Math.floor(r() * th.props.length)], s: .8 + r() * .5, seed: (r() * 1e6) | 0 }); }
    const mids = []; for (let px = 0; px < width * .6 + W; px += 70 + r() * 110) mids.push({ x: px, s: .7 + r() * .7, seed: (r() * 1e6) | 0 });
    const hang = []; for (let px = 0; px < width; px += 14) hang.push({ x: px, len: 30 + nz(px / 60, 9, 3) * 160, w: 1 + r() * 2.5 });
    LV = { ch, th, W, H, width, pos, ground, props, mids, hang, cam: 0, fol: [], px: pos[nodes[0].id] - 60, tx: null, target: null, face: 1, trail: [], walking: false, seed };
    return LV;
  }
  function placeAt(nodeId) { if (!LV) return; const p = LV.pos[nodeId]; if (p != null) { LV.px = p - 50; LV.cam = Math.max(0, Math.min(LV.width - LV.W, LV.px - LV.W * .4)); LV.trail = []; LV.fol = []; } }
  function update(dt) {
    if (!LV) return null;
    const L = LV; let arrived = null;
    if (L.tx != null) { const d = L.tx - L.px; const sp = 230 * dt; if (Math.abs(d) <= sp) { L.px = L.tx; L.tx = null; L.walking = false; arrived = L.target; L.target = null; } else { L.px += Math.sign(d) * sp; L.face = Math.sign(d); L.walking = true; } }
    L.trail.unshift({ x: L.px, f: L.face, w: L.walking }); if (L.trail.length > 120) L.trail.pop();
    const want = Math.max(0, Math.min(L.width - L.W, L.px - L.W * .42)); L.cam += (want - L.cam) * Math.min(1, dt * 4);
    return arrived;
  }
  function walkTo(wx, node) { if (!LV) return; LV.tx = Math.max(30, Math.min(LV.width - 30, wx)); LV.target = node || null; if (Math.abs(LV.tx - LV.px) < 2) { LV.tx = LV.px + .01; } }
  const ICON = { main: ['◆', '#f2c46d'], side: ['●', '#7ec8ff'], lore: ['✦', '#c08aff'], battle: ['⚔', '#ff6a5a'], shop: ['⌂', '#6ee7a0'], camp: ['🔥', '#ff9a3a'] };
  function draw(ctx, t, dt, info) {
    const L = LV; if (!L) return; const { W, H, th } = L; const cam = L.cam;
    // mid layer (parallax .55)
    ctx.save(); ctx.translate(-cam * .55, 0);
    for (const m of L.mids) { const sx = m.x - cam * .0; if (sx - cam * .55 < -200 || sx - cam * .55 > W + 200) continue; drawMid(ctx, th, m.x, L.ground(m.x / .55) - 30, m.s, m.seed, t); }
    ctx.restore();
    ctx.fillStyle = 'rgba(5,4,16,.18)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-cam, 0);
    const x0 = Math.max(0, cam - 40), x1 = Math.min(L.width, cam + W + 40);
    // island underside + hanging roots
    ctx.fillStyle = th.body; ctx.beginPath(); ctx.moveTo(x0, H + 10); for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, L.ground(x)); ctx.lineTo(x1, H + 10); ctx.fill();
    const ug = ctx.createLinearGradient(0, H * .7, 0, H); ug.addColorStop(0, hex(th.edge, .0)); ug.addColorStop(1, hex('#000000', .55)); ctx.fillStyle = ug; ctx.fillRect(x0, H * .7, x1 - x0, H * .3);
    ctx.strokeStyle = hex(th.top, .7);
    for (const hg of L.hang) { if (hg.x < x0 || hg.x > x1) continue; const gy = L.ground(hg.x) + 18; ctx.lineWidth = hg.w; ctx.beginPath(); ctx.moveTo(hg.x, gy); ctx.quadraticCurveTo(hg.x + Math.sin(t * .8 + hg.x) * 6, gy + hg.len * .5, hg.x + Math.sin(t + hg.x * .1) * 3, gy + hg.len); ctx.stroke(); }
    // stones texture
    const r = rngOf(L.seed + ((x0 / 300) | 0)); ctx.fillStyle = hex(th.edge, .08);
    for (let x = x0 - (x0 % 23); x < x1; x += 23) { const gy = L.ground(x); const k = (Math.sin(x * 12.9898) * 43758.5453) % 1; ctx.beginPath(); ctx.ellipse(x, gy + 20 + Math.abs(k) * 50, 6 + Math.abs(k) * 8, 3 + Math.abs(k) * 3, 0, 0, TAU); ctx.fill(); }
    // top surface band
    ctx.fillStyle = th.top; ctx.beginPath(); for (let x = x0; x <= x1; x += 8) { const gy = L.ground(x); x === x0 ? ctx.moveTo(x, gy - 2) : ctx.lineTo(x, gy - 2); } for (let x = x1; x >= x0; x -= 8) ctx.lineTo(x, L.ground(x) + 14 + Math.sin(x * .07) * 3); ctx.fill();
    ctx.strokeStyle = hex(th.edge, .8); ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = x0; x <= x1; x += 8) { const gy = L.ground(x) - 2; x === x0 ? ctx.moveTo(x, gy) : ctx.lineTo(x, gy); } ctx.stroke();
    grassTufts(ctx, x0, x1, L.ground, th.grass, 3, .3, t);
    // props
    for (const p of L.props) { if (p.x < x0 - 80 || p.x > x1 + 80) continue; drawProp(ctx, p.k, p.x, L.ground(p.x), p.s, p.seed, t, th); }
    // POIs
    const vis = info.visible;
    info.hits.length = 0;
    for (const n of vis) {
      const px = L.pos[n.id]; if (px < x0 - 120 || px > x1 + 120) continue; const gy = L.ground(px);
      const done = info.done(n); drawPOI(ctx, n, px, gy, t, done, th, info);
      const [ic, col] = ICON[n.type] || ICON.side;
      const ly = gy - (n.type === 'battle' ? 120 : 112) + Math.sin(t * 2 + px) * 3;
      ctx.font = '600 12.5px Georgia'; const tw = ctx.measureText(n.name).width + 30;
      ctx.fillStyle = 'rgba(5,4,14,.78)'; roundRect(ctx, px - tw / 2, ly - 12, tw, 24, 12); ctx.fill(); ctx.strokeStyle = hex(col, done ? .25 : .7); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = done ? '#8a8494' : col; ctx.textAlign = 'center'; ctx.fillText((done ? '✓ ' : ic + ' ') + n.name, px, ly + 4.5);
      if (n.type === 'main' && !done) { glow(ctx, px, ly - 22, 18, col, .5 + .3 * Math.sin(t * 4)); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px - 6, ly - 28 + Math.sin(t * 4) * 3); ctx.lineTo(px + 6, ly - 28 + Math.sin(t * 4) * 3); ctx.lineTo(px, ly - 19 + Math.sin(t * 4) * 3); ctx.fill(); }
      info.hits.push({ n, x: px - cam, y0: ly - 20, y1: gy + 10, w: Math.max(60, tw / 2) });
    }
    // party (followers then leader)
    const party = info.party;
    for (let i = 1; i < party.length; i++) { const want = L.px - L.face * 30 * i; let f = L.fol[i]; if (!f) f = L.fol[i] = { x: want, face: L.face }; const d = want - f.x; f.walk = Math.abs(d) > 3; if (f.walk) { f.face = Math.sign(d); f.x += d * Math.min(1, dt * (3.2 - i * .25)); } else if (!L.walking) f.face = L.face; }
    for (let i = party.length - 1; i >= 0; i--) {
      const f = i ? L.fol[i] : { x: L.px, face: L.face, walk: L.walking }; const gy = L.ground(f.x);
      walker(ctx, party[i], f.x, gy + 2, 1.15, t + i * .7, f.walk, f.face);
    }
    if (L.tx != null) { const gy = L.ground(L.tx); ctx.strokeStyle = 'rgba(242,196,109,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(L.tx, gy + 2, 14 + Math.sin(t * 8) * 2, 4, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // foreground silhouettes for depth
    ctx.save(); ctx.translate(-cam * 1.35, 0); ctx.fillStyle = hex('#000000', .55);
    for (let i = 0; i < L.props.length; i += 4) { const p = L.props[i]; const sx = p.x * 1.2; if (sx - cam * 1.35 < -100 || sx - cam * 1.35 > W + 100) continue; blob(ctx, sx, H + 10, 60 * p.s, 40 * p.s, p.seed, .3, 12); ctx.fill(); }
    ctx.restore();
    // objective arrow
    const obj = vis.find(n => n.type === 'main' && !info.done(n));
    if (obj) { const ox = L.pos[obj.id] - cam; if (ox < 10 || ox > W - 10) { const right = ox > W; const ax = right ? W - 22 : 22, ay = H * .52; glow(ctx, ax, ay, 26, '#f2c46d', .5); ctx.fillStyle = '#f2c46d'; ctx.beginPath(); ctx.moveTo(ax + (right ? 10 : -10), ay); ctx.lineTo(ax + (right ? -6 : 6), ay - 10); ctx.lineTo(ax + (right ? -6 : 6), ay + 10); ctx.fill(); } }
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawMid(ctx, th, x, gy, s, seed, t) {
    ctx.fillStyle = th.midC; ctx.strokeStyle = th.midC; const r = rngOf(seed);
    switch (th.mid) {
      case 'house': { const w = 50 * s, h = (70 + r() * 70) * s; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - h); ctx.quadraticCurveTo(x + w * .5, gy - h - 26 * s, x + w, gy - h); ctx.lineTo(x + w, gy); ctx.fill(); ctx.fillRect(x + w * .7, gy - h - 22 * s, 6, 18 * s); for (let i = 0; i < 3; i++) if (r() < .6) { ctx.fillStyle = hex(th.light, .55); ctx.fillRect(x + 8 + i * 14 * s, gy - h + 16 + r() * h * .5, 6 * s, 9 * s); ctx.fillStyle = th.midC; } break; }
      case 'tree': tree(ctx, x, gy, 150 * s, th.midC, seed, { leaves: hex(th.leaves || th.midC, .9), depth: 5 }); break;
      case 'deadtree': tree(ctx, x, gy, 160 * s, th.midC, seed, { depth: 5 }); break;
      case 'crane': ctx.fillRect(x, gy - 160 * s, 6, 160 * s); ctx.fillRect(x - 30 * s, gy - 160 * s, 90 * s, 5); ctx.fillRect(x + 50 * s, gy - 155 * s, 2, 40 + Math.sin(t + x) * 6); glow(ctx, x + 3, gy - 164 * s, 8, '#ff4a2a', .8); break;
      case 'pagoda': { let y = gy; const w = 60 * s; for (let i = 0; i < 3; i++) { const tw = w * (1 - i * .18); ctx.fillRect(x - tw * .35, y - 22 * s, tw * .7, 22 * s); y -= 22 * s; ctx.beginPath(); ctx.moveTo(x - tw * .6, y + 4); ctx.quadraticCurveTo(x, y - 14 * s, x + tw * .6, y + 4); ctx.fill(); } glow(ctx, x, gy - 30 * s, 20 * s, th.light, .25); break; }
      case 'spire': ctx.beginPath(); ctx.moveTo(x - 16 * s, gy); ctx.lineTo(x - 14 * s, gy - 140 * s); ctx.lineTo(x, gy - 210 * s); ctx.lineTo(x + 14 * s, gy - 140 * s); ctx.lineTo(x + 16 * s, gy); ctx.fill(); glow(ctx, x, gy - 120 * s, 16, th.light, .3); break;
      case 'cloud': ctx.fillStyle = hex(th.midC, .7); blob(ctx, x, gy - 40 * s, 90 * s, 30 * s, seed, .25, 16); ctx.fill(); break;
      case 'spike': ctx.beginPath(); ctx.moveTo(x - 20 * s, gy); ctx.quadraticCurveTo(x - 4, gy - 100 * s, x + (r() - .5) * 20, gy - 180 * s); ctx.quadraticCurveTo(x + 6, gy - 90 * s, x + 20 * s, gy); ctx.fill(); break;
    }
  }
  function drawProp(ctx, k, x, gy, s, seed, t, th) {
    const r = rngOf(seed);
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    const dark = shadeHex(th.body, .15);
    switch (k) {
      case 'lamp': ctx.fillStyle = '#0c0a16'; ctx.fillRect(-2, -70, 4, 70); ctx.beginPath(); ctx.moveTo(-8, -70); ctx.quadraticCurveTo(0, -84, 8, -70); ctx.fill(); glow(ctx, 0, -68, 34, th.light, .55 + .1 * Math.sin(t * 3 + x)); ctx.fillStyle = th.light; ctx.beginPath(); ctx.ellipse(0, -66, 4, 6, 0, 0, TAU); ctx.fill(); break;
      case 'chimney': case 'house': ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-24, -46); ctx.quadraticCurveTo(0, -66, 24, -46); ctx.lineTo(26, 0); ctx.fill(); ctx.fillStyle = hex(th.light, .7); ctx.fillRect(-8, -32, 9, 12); glow(ctx, -4, -26, 20, th.light, .3); break;
      case 'bench': ctx.fillStyle = dark; ctx.fillRect(-18, -12, 36, 4); ctx.fillRect(-16, -12, 3, 12); ctx.fillRect(13, -12, 3, 12); ctx.fillRect(-18, -22, 36, 3); break;
      case 'gear': ctx.fillStyle = shadeHex(th.top, .1); ctx.save(); ctx.translate(0, -18); ctx.rotate(t * .3 + x); for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillRect(-3, -20, 6, 6); } ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.fillStyle = th.body; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill(); ctx.restore(); break;
      case 'pipe': ctx.strokeStyle = shadeHex(th.top, .1); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-20, -40, 10, -44); ctx.stroke(); if (r() < .5) { glow(ctx, 10, -48, 14, '#ffffff', .15 + .1 * Math.sin(t * 2)); } break;
      case 'crate': ctx.fillStyle = shadeHex(th.top, -.1); ctx.fillRect(-14, -26, 28, 26); ctx.strokeStyle = hex('#000', .4); ctx.lineWidth = 2; ctx.strokeRect(-14, -26, 28, 26); ctx.beginPath(); ctx.moveTo(-14, -26); ctx.lineTo(14, 0); ctx.stroke(); break;
      case 'barrel': ctx.fillStyle = shadeHex(th.top, -.05); blob(ctx, 0, -14, 11, 15, seed, .05, 12); ctx.fill(); ctx.strokeStyle = hex('#000', .4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -20); ctx.lineTo(11, -20); ctx.moveTo(-11, -8); ctx.lineTo(11, -8); ctx.stroke(); break;
      case 'scrap': ctx.fillStyle = dark; blob(ctx, 0, -8, 30, 12, seed, .4, 10); ctx.fill(); break;
      case 'tree': tree(ctx, 0, 0, 120, dark, seed, { leaves: hex(th.leaves || th.grass, .95), depth: 5 }); break;
      case 'sakura': tree(ctx, 0, 0, 110, '#140406', seed, { leaves: hex('#2a080e', .9), blossom: '#ff3a4a', depth: 5 }); break;
      case 'deadtree': tree(ctx, 0, 0, 100, dark, seed, { depth: 4 }); break;
      case 'fern': ctx.strokeStyle = th.grass; ctx.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .35 + Math.sin(t + x) * .05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 14, Math.sin(a) * 22, Math.cos(a) * 26, Math.sin(a) * 26 + 8); ctx.stroke(); } break;
      case 'flower': for (let i = 0; i < 5; i++) { const fx = (r() - .5) * 30, fh = 8 + r() * 12; ctx.strokeStyle = th.grass; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx + Math.sin(t + i) * 2, -fh); ctx.stroke(); glow(ctx, fx, -fh, 7, th.light, .6); ctx.fillStyle = th.light; ctx.beginPath(); ctx.arc(fx + Math.sin(t + i) * 2, -fh, 2.2, 0, TAU); ctx.fill(); } break;
      case 'pillar': ctx.fillStyle = dark; ctx.fillRect(-9, -60 - r() * 30, 18, 90); ctx.fillStyle = hex(th.grass, .8); blob(ctx, 0, -50, 12, 6, seed, .5, 8); ctx.fill(); break;
      case 'stall': ctx.fillStyle = dark; ctx.fillRect(-26, -30, 52, 30); ctx.fillStyle = r() < .5 ? '#8a2a3a' : '#2a5a6a'; ctx.beginPath(); ctx.moveTo(-32, -30); for (let i = 0; i <= 6; i++) ctx.lineTo(-32 + i * 64 / 6, -38 - (i % 2) * 6); ctx.lineTo(32, -30); ctx.fill(); glow(ctx, 0, -20, 30, th.light, .35); break;
      case 'lantern': ctx.strokeStyle = '#0c0608'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.stroke(); { const sw = Math.sin(t * 1.5 + x) * 3; glow(ctx, sw, -52, 26, th.light, .6); ctx.fillStyle = r() < .5 ? th.light : '#ff6a5a'; ctx.beginPath(); ctx.ellipse(sw, -52, 6, 9, 0, 0, TAU); ctx.fill(); } break;
      case 'candle': for (let i = 0; i < 3; i++) { const cx = (i - 1) * 8, ch = 10 + i * 5; ctx.fillStyle = '#e8d8b0'; ctx.fillRect(cx - 2, -ch, 4, ch); glow(ctx, cx, -ch - 4, 14, '#ffcf6a', .6 + .2 * Math.sin(t * 9 + i)); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(cx, -ch - 3, 1.6, 3, 0, 0, TAU); ctx.fill(); } break;
      case 'statue': ctx.fillStyle = dark; blob(ctx, 0, -40, 10, 30, seed, .15, 12); ctx.fill(); ctx.beginPath(); ctx.arc(0, -76, 8, 0, TAU); ctx.fill(); glow(ctx, 0, -76, 14, th.light, .3); break;
      case 'rope': ctx.strokeStyle = '#6a5030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -5, 14, 5, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -9, 10, 4, 0, 0, TAU); ctx.stroke(); break;
      case 'mast': ctx.fillStyle = dark; ctx.fillRect(-3, -130, 6, 130); ctx.fillStyle = hex('#e8dcc0', .25); ctx.beginPath(); ctx.moveTo(3, -122); ctx.quadraticCurveTo(40 + Math.sin(t) * 4, -80, 3, -40); ctx.fill(); break;
      case 'rock': ctx.fillStyle = dark; blob(ctx, 0, -8, 18, 12, seed, .3, 10); ctx.fill(); ctx.fillStyle = hex('#ffffff', .5); blob(ctx, -2, -16, 12, 4, seed + 1, .3, 8); ctx.fill(); break;
      case 'grave': ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, -20); ctx.quadraticCurveTo(0, -30, 8, -20); ctx.lineTo(8, 0); ctx.fill(); break;
      case 'crystal': for (let i = 0; i < 4; i++) { const a = (i - 1.5) * .35, h = 20 + r() * 26; ctx.save(); ctx.rotate(a); ctx.fillStyle = hex(th.light, .75); ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, -h); ctx.lineTo(4, 0); ctx.fill(); ctx.restore(); } glow(ctx, 0, -18, 26, th.light, .35 + .15 * Math.sin(t * 2 + x)); break;
      case 'spike': ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-2, -30, 2, -60); ctx.quadraticCurveTo(4, -28, 10, 0); ctx.fill(); break;
      case 'torii': ctx.fillStyle = '#8a1a14'; ctx.fillRect(-26, -70, 5, 70); ctx.fillRect(21, -70, 5, 70); ctx.beginPath(); ctx.moveTo(-36, -70); ctx.quadraticCurveTo(0, -78, 36, -70); ctx.lineTo(34, -64); ctx.quadraticCurveTo(0, -70, -34, -64); ctx.fill(); ctx.fillRect(-28, -56, 56, 4); break;
      case 'stonelamp': ctx.fillStyle = dark; ctx.fillRect(-4, -24, 8, 24); ctx.fillRect(-10, -36, 20, 12); ctx.beginPath(); ctx.moveTo(-14, -36); ctx.quadraticCurveTo(0, -48, 14, -36); ctx.fill(); glow(ctx, 0, -30, 18, th.light, .55); break;
    }
    ctx.restore();
  }
  function drawPOI(ctx, n, x, gy, t, done, th, info) {
    ctx.save(); if (done && n.type !== 'shop' && n.type !== 'camp' && !n.repeat) ctx.globalAlpha = .55;
    const col = (ICON[n.type] || ICON.side)[1];
    switch (n.type) {
      case 'main': { ctx.fillStyle = '#0c0814'; ctx.beginPath(); ctx.moveTo(x - 28, gy); ctx.lineTo(x - 26, gy - 70); ctx.quadraticCurveTo(x, gy - 104, x + 26, gy - 70); ctx.lineTo(x + 28, gy); ctx.fill(); const gg = ctx.createLinearGradient(0, gy - 90, 0, gy); gg.addColorStop(0, hex(col, done ? .15 : .7)); gg.addColorStop(1, hex(col, .05)); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x - 18, gy); ctx.lineTo(x - 17, gy - 64); ctx.quadraticCurveTo(x, gy - 90, x + 17, gy - 64); ctx.lineTo(x + 18, gy); ctx.fill(); if (!done) { glow(ctx, x, gy - 40, 70, col, .25 + .1 * Math.sin(t * 3)); for (let i = 0; i < 5; i++) { const py = gy - ((t * 30 + i * 18) % 90); glow(ctx, x + Math.sin(t + i * 2) * 10, py, 4, col, .8); } } break; }
      case 'side': { const npc = info.npcFor(n); if (npc) walker(ctx, npc.id, x, gy + 2, 1.1, t, false, -1, npc.def, { glowCol: col }); else { ctx.fillStyle = '#1a1424'; ctx.fillRect(x - 2, gy - 50, 4, 50); ctx.fillRect(x - 16, gy - 50, 28, 14); glow(ctx, x, gy - 56, 22, col, .5); } ctx.fillStyle = col; ctx.font = 'bold 18px Georgia'; ctx.textAlign = 'center'; if (!done) ctx.fillText('!', x, gy - 72 + Math.sin(t * 5) * 2); break; }
      case 'lore': { ctx.fillStyle = shadeHex(th.body, .1); blob(ctx, x, gy - 26, 14, 28, 77, .15, 12); ctx.fill(); ctx.strokeStyle = hex(col, done ? .3 : .9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 5, gy - 40); ctx.lineTo(x + 3, gy - 30); ctx.lineTo(x - 4, gy - 20); ctx.moveTo(x + 5, gy - 44); ctx.lineTo(x + 5, gy - 26); ctx.stroke(); glow(ctx, x, gy - 30, 34, col, done ? .1 : .35 + .15 * Math.sin(t * 2)); break; }
      case 'battle': { const es = info.enemiesFor(n); es.slice(0, 3).forEach((e, i) => { ART.drawEnemy(ctx, e.look, e.color, x + (i - (es.length - 1) / 2) * 34 + Math.sin(t * .8 + i) * 8, gy - 30 - (e.look === 'drone' || e.look === 'wraith' ? 18 : 0), 46, t, 0, 0); }); break; }
      case 'shop': drawProp(ctx, 'stall', x, gy, 1.3, 9, t, th); if (info.shopkeeper) walker(ctx, 'merchant', x + 6, gy - 2, 1, t, false, -1, null); break;
      case 'camp': { ctx.fillStyle = '#1a0d06'; ctx.save(); ctx.translate(x, gy - 4); ctx.rotate(.3); ctx.fillRect(-18, -3, 36, 6); ctx.rotate(-.6); ctx.fillRect(-18, -3, 36, 6); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, gy - 14, 60 + Math.sin(t * 9) * 4, '#ff7a2a', .4); for (let i = 0; i < 5; i++) { const fh = 20 + Math.sin(t * 8 + i * 2) * 7; ctx.fillStyle = hex(i % 2 ? '#ffb547' : '#ff5a1a', .75); ctx.beginPath(); ctx.moveTo(x - 9 + i * 4, gy - 4); ctx.quadraticCurveTo(x - 7 + i * 3, gy - fh * .5, x - 3 + i * 2 + Math.sin(t * 6 + i) * 3, gy - fh); ctx.quadraticCurveTo(x + i * 3, gy - fh * .4, x - 5 + i * 4, gy - 4); ctx.fill(); } ctx.restore(); break; }
    }
    ctx.restore();
  }
  function hit(sx, sy, hits) { let best = null, bd = 1e9; for (const h of hits) { if (sy < h.y0 - 10 || sy > h.y1 + 30) continue; const d = Math.abs(sx - h.x); if (d < h.w && d < bd) { bd = d; best = h; } } return best; }

  // ---------------- world map ----------------
  const ISLES = [
    { id: 'c1', n: 'Lutèce', x: .18, y: .9, c: '#ffcf6a' }, { id: 'c2', n: 'Officine di Ruggine', x: .62, y: .82, c: '#ff8a3a' },
    { id: 'c3', n: 'Giardino dei Giganti', x: .3, y: .71, c: '#9affd0' }, { id: 'c4', n: 'Mercato delle Lanterne', x: .74, y: .6, c: '#ffb05a' },
    { id: 'c5', n: 'Cattedrale del Coro', x: .32, y: .5, c: '#ff4d8d' }, { id: 'c6', n: 'Tempesta Eterna', x: .66, y: .39, c: '#7affa0' },
    { id: 'c7', n: 'Isole del Silenzio', x: .28, y: .29, c: '#dfe8ff' }, { id: 'c8', n: 'Akatsuki', x: .7, y: .18, c: '#ff5a3a' },
    { id: 'c9', n: 'Il Trono Vuoto', x: .5, y: .08, c: '#c08aff' },
  ];
  let WM = null;
  function worldMapStart(W, H, fromId, toId) {
    const sea = cloudTexture(360, 260, '#3a3a7a', .8, 21);
    WM = { W, H, sea, from: ISLES.findIndex(i => i.id === fromId), to: ISLES.findIndex(i => i.id === toId), t0: null };
    if (WM.from < 0) WM.from = WM.to;
  }
  function islePos(i, W, H) { const s = ISLES[i]; if (W > H) return [70 + (1 - s.y) / .82 * (W - 160), 90 + (s.x - .18) / .56 * (H - 190)]; return [s.x * W, 90 + s.y * (H - 170)]; }
  function drawWorldMap(ctx, t, W, H) {
    if (!WM) return 0; if (WM.t0 == null) WM.t0 = t; const k = Math.min(1, (t - WM.t0) / 3);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a3a'); g.addColorStop(.3, '#0e1236'); g.addColorStop(1, '#060818'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // dawn glow in the east (top)
    if (W > H) glow(ctx, W + 40, H * .4, H * 1.2, '#ff9a6a', .25 + .1 * Math.sin(t * .5)); else glow(ctx, W * .5, -40, W * .9, '#ff9a6a', .25 + .1 * Math.sin(t * .5));
    ctx.globalAlpha = .55; ctx.drawImage(WM.sea, -((t * 4) % W), 0, W, H); ctx.drawImage(WM.sea, W - ((t * 4) % W), 0, W, H); ctx.globalAlpha = 1;
    // route
    ctx.setLineDash([3, 7]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(242,196,109,.55)'; ctx.beginPath();
    ISLES.forEach((s, i) => { const [x, y] = islePos(i, W, H); if (!i) ctx.moveTo(x, y); else { const [px, py] = islePos(i - 1, W, H); ctx.quadraticCurveTo((px + x) / 2 + (i % 2 ? 40 : -40), (py + y) / 2, x, y); } }); ctx.stroke(); ctx.setLineDash([]);
    // islands
    ISLES.forEach((s, i) => {
      const [x, y] = islePos(i, W, H); const reached = i <= WM.to; const cur = i === WM.to;
      ctx.save(); ctx.globalAlpha = reached ? 1 : .45;
      glow(ctx, x, y, 60, s.c, cur ? .35 + .15 * Math.sin(t * 3) : .12);
      ctx.fillStyle = '#1a1430'; blob(ctx, x, y + 8, 36, 16, i * 31 + 3, .2, 18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 30, y + 12); ctx.quadraticCurveTo(x, y + 60 + (i % 3) * 8, x + 30, y + 12); ctx.fill();
      ctx.fillStyle = shadeHex(s.c, -.55); blob(ctx, x, y + 2, 34, 11, i * 31 + 7, .2, 18); ctx.fill();
      const r = rngOf(i * 99); for (let k2 = 0; k2 < 5; k2++) { const hx = x - 22 + r() * 40; ctx.fillStyle = '#0c0818'; ctx.fillRect(hx, y - 10 - r() * 10, 5 + r() * 6, 10 + r() * 8); glow(ctx, hx + 3, y - 6, 8, s.c, .5); }
      ctx.restore();
      ctx.font = `${cur ? '600 ' : ''}12px Georgia`; ctx.textAlign = 'center'; ctx.fillStyle = reached ? (cur ? '#ffe3a3' : '#d8cfe8') : '#6a6480';
      ctx.fillText(reached ? s.n : '???', x, y + 44);
    });
    // ship
    const ease = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const [ax, ay] = islePos(WM.from, W, H), [bx, by] = islePos(WM.to, W, H);
    const sx = ax + (bx - ax) * ease, sy = ay + (by - ay) * ease - 26 - Math.sin(ease * Math.PI) * 30 + Math.sin(t * 2) * 3;
    ship(ctx, sx, sy, bx >= ax ? 1 : -1, t);
    ctx.font = '600 20px Georgia'; ctx.fillStyle = '#ffe3a3'; ctx.textAlign = 'center'; ctx.fillText("Rotta d'Aurora", W / 2, 46);
    ctx.font = 'italic 12px Georgia'; ctx.fillStyle = '#a9a3b8'; ctx.fillText(W > H ? 'Ovest  →  Est' : 'Ovest (in basso)  →  Est (in alto)', W / 2, 64);
    return k;
  }
  function ship(ctx, x, y, f, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    glow(ctx, 0, 0, 40, '#ffcf6a', .25);
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, 12, 24, 0); ctx.lineTo(18, -3); ctx.lineTo(-18, -3); ctx.fill();
    ctx.fillStyle = '#1a0f08'; ctx.fillRect(-1, -30, 2, 28); ctx.fillRect(10, -22, 2, 20);
    const flap = Math.sin(t * 14) * .3;
    ctx.fillStyle = 'rgba(235,225,255,.9)'; ctx.beginPath(); ctx.ellipse(-12, -24, 13, 4, -.2 + flap, 0, TAU); ctx.ellipse(12, -24, 13, 4, .2 - flap, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(205,195,240,.85)'; ctx.beginPath(); ctx.ellipse(-10, -16, 10, 3.4, -.1 - flap, 0, TAU); ctx.ellipse(10, -16, 10, 3.4, .1 + flap, 0, TAU); ctx.fill();
    glow(ctx, 22, -1, 10, '#ffcf6a', .8);
    ctx.restore();
  }

  return { walker, buildLevel, placeAt, update, walkTo, draw, hit, get level() { return LV; }, worldMapStart, drawWorldMap, cloudTexture, drawGrain, blob, ISLES, ship, clearWorld() { WM = null; } };
})();

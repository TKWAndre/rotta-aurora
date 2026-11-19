// ROTTA D'AURORA — pixel art: tile sets, character sprites (4 directions, walk cycle), props
'use strict';
const PIX = (() => {
  const T = 16;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rngOf = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  function shade(col, k) {
    const n = parseInt(col.slice(1), 16); const rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
    return '#' + rgb.map(v => clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
  }
  const OUT = [18, 12, 24];
  function outline(c, col = OUT) {
    const g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), a = d.data, add = [];
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) add.push((y * w + x) * 4);
    add.forEach(i => { a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2]; a[i + 3] = 255; });
    g.putImageData(d, 0, 0); return c;
  }
  const painter = (g, ox, oy) => (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(ox + x, oy + y, w, h); };
  function disc(P, cx, cy, r, col, r2) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .8) P(cx + x, cy + y, 1, 1, col); }
  function ell(P, cx, cy, rx, ry, col) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) P(cx + x, cy + y, 1, 1, col); }

  // ---------------- themes ----------------
  const TH = {
    lutece: { floor: 'cobble', f: ['#3b3550', '#4a4363', '#29243a'], wall: 'brick', w: ['#5a4258', '#6e5068', '#2e2030'], cap: '#1b1422', dark: .42, amb: [8, 6, 30], acc: '#ffcf7a', props: ['lamp', 'crate', 'barrel', 'bench', 'plant', 'lamp', 'barrel'], decals: ['puddle', 'leaf', 'leaf'], fx: 'fireflies' },
    rust: { floor: 'metal', f: ['#4d4239', '#5d5045', '#352c26'], wall: 'panel', w: ['#6e3d24', '#8a5530', '#3a2014'], cap: '#22140c', dark: .3, amb: [26, 10, 4], acc: '#ff9a3a', props: ['gear', 'crate', 'pipe', 'barrel', 'scrap', 'lamp'], decals: ['oil', 'bolt', 'bolt'], fx: 'embers' },
    garden: { floor: 'grass', f: ['#3f7a4e', '#4e8e5c', '#2f6340'], wall: 'ruin', w: ['#5f6f62', '#788a7a', '#3a463c'], cap: '#202c24', dark: .16, amb: [10, 30, 30], acc: '#9fffd0', props: ['tree', 'pillar', 'bush', 'statue', 'crystal', 'bush', 'tree'], decals: ['flower', 'flower', 'moss', 'flower'], fx: 'fireflies' },
    market: { floor: 'boards', f: ['#5c3c29', '#6e4933', '#43291c'], wall: 'wood', w: ['#3c2619', '#523424', '#22140c'], cap: '#170d08', dark: .36, amb: [22, 6, 10], acc: '#ffb547', props: ['lantern', 'crate', 'barrel', 'lantern', 'plant', 'crate'], decals: ['rug', 'coin', 'coin'], fx: 'embers' },
    cathedral: { floor: 'checker', f: ['#1e1729', '#2c2340', '#120e1a'], wall: 'glass', w: ['#251b31', '#35284c', '#120c1a'], cap: '#0c0812', dark: .44, amb: [16, 4, 24], acc: '#ff4d8d', props: ['pillar', 'candle', 'pew', 'statue', 'candle'], decals: ['crack', 'crack'], fx: 'motes' },
    storm: { floor: 'deck', f: ['#4c3b2d', '#5a4732', '#33281e'], wall: 'hull', w: ['#3c2d22', '#4e3c2d', '#1e160f'], cap: '#120c08', dark: .38, amb: [6, 18, 26], acc: '#c8ffe0', props: ['crate', 'barrel', 'cannon', 'lamp', 'crate'], decals: ['puddle', 'rope', 'puddle'], fx: 'rain' },
    silence: { floor: 'snow', f: ['#d2d9e6', '#e2e7f0', '#b8c1d4'], wall: 'rock', w: ['#8c95aa', '#a8b1c4', '#5e6678'], cap: '#454f68', dark: .1, amb: [40, 56, 90], acc: '#bfe0ff', props: ['pine', 'rock', 'crystal', 'wreck', 'pine', 'pine'], decals: ['track', 'track'], fx: 'snow' },
    akatsuki: { floor: 'flag', f: ['#403537', '#4f4244', '#2c2426'], wall: 'shoji', w: ['#86222a', '#ecdfc6', '#4a1014'], cap: '#2a0a0c', dark: .34, amb: [26, 6, 16], acc: '#ff8aa8', props: ['sakura', 'toro', 'bamboo', 'rock', 'sakura'], decals: ['petal', 'petal', 'petal'], fx: 'petals' },
    hollow: { floor: 'void', f: ['#1c1724', '#251e30', '#110d17'], wall: 'obsidian', w: ['#211a2c', '#2e253c', '#0c0912'], cap: '#06040a', dark: .5, amb: [10, 0, 22], acc: '#c08aff', props: ['crystal', 'spike', 'ruin', 'spike', 'crystal'], decals: ['crack', 'skull', 'crack'], fx: 'motes' },
  };
  const THEME_OF = { lutece_night: 'lutece', lutece_roofs: 'lutece', lutece_hangar: 'lutece', rustworks: 'rust', forge: 'rust', garden_ruins: 'garden', giant_hall: 'garden', night_market: 'market', shadow_theatre: 'market', cathedral: 'cathedral', crypt: 'cathedral', storm: 'storm', flagship: 'storm', skyship_deck: 'storm', silence_isles: 'silence', white_forest: 'silence', akatsuki: 'akatsuki', akatsuki_palace: 'akatsuki', dojo: 'akatsuki', hollow_descent: 'hollow', hollow_throne: 'hollow' };
  const theme = bg => TH[THEME_OF[bg] || 'lutece'];

  // ---------------- floor & walls ----------------
  function floorTile(g, th, x0, y0, tx, ty, r) {
    const P = painter(g, x0, y0), [a, b, c] = th.f;
    switch (th.floor) {
      case 'cobble': P(0, 0, 16, 16, c); for (let sy = 0; sy < 16; sy += 8) { const off = ((ty * 2 + sy / 8) % 2) * 4; for (let sx = -4; sx < 16; sx += 8) { const col = r() < .5 ? a : b; const x = sx + off; P(x + 1, sy + 1, 6, 6, col); P(x + 1, sy + 1, 6, 1, shade(col, .12)); P(x + 1, sy + 6, 6, 1, shade(col, -.2)); } } break;
      case 'metal': P(0, 0, 16, 16, a); P(15, 0, 1, 16, c); P(0, 15, 16, 1, c); P(0, 0, 16, 1, shade(a, .1)); [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => P(x, y, 1, 1, shade(b, .3))); if (r() < .35) for (let i = 0; i < 6; i++) P(3 + r() * 10 | 0, 3 + r() * 10 | 0, 1 + (r() * 2 | 0), 1, '#7a4a2a'); if (r() < .2) P(4, 7, 8, 1, b); break;
      case 'grass': P(0, 0, 16, 16, a); for (let i = 0; i < 22; i++) P(r() * 16 | 0, r() * 16 | 0, 1, 1, r() < .5 ? b : c); if (r() < .3) { const x = 2 + r() * 11 | 0, y = 3 + r() * 10 | 0; P(x, y, 1, 2, shade(b, .25)); P(x + 2, y - 1, 1, 3, shade(b, .2)); P(x + 1, y, 1, 2, b); } break;
      case 'boards': for (let row = 0; row < 4; row++) { const col = (row + ty) % 2 ? a : b; P(0, row * 4, 16, 4, col); P(0, row * 4 + 3, 16, 1, c); P(0, row * 4, 16, 1, shade(col, .08)); const sx = (tx * 7 + row * 5 + ty * 3) % 16; P(sx, row * 4, 1, 3, c); if (r() < .25) P(r() * 15 | 0, row * 4 + 1, 1, 1, shade(c, -.3)); } break;
      case 'checker': { const col = (tx + ty) % 2 ? a : b; P(0, 0, 16, 16, col); P(0, 0, 16, 1, shade(col, .12)); P(0, 0, 1, 16, shade(col, .06)); P(0, 15, 16, 1, c); if (r() < .15) P(3 + r() * 9 | 0, 3 + r() * 9 | 0, 2, 1, shade(col, .3)); break; }
      case 'deck': for (let k = 0; k < 4; k++) { const col = (k + tx) % 2 ? a : b; P(k * 4, 0, 4, 16, col); P(k * 4 + 3, 0, 1, 16, c); P(k * 4, 0, 1, 16, shade(col, .08)); } P(0, (tx * 5 + ty * 9) % 16, 16, 1, c); if (r() < .4) P(1 + (r() * 3 | 0) * 4, 2 + r() * 12 | 0, 1, 1, '#2a2018'); break;
      case 'snow': P(0, 0, 16, 16, b); for (let i = 0; i < 16; i++) P(r() * 16 | 0, r() * 16 | 0, 1, 1, r() < .6 ? a : c); if (r() < .15) P(2 + r() * 10 | 0, 2 + r() * 12 | 0, 3, 1, '#ffffff'); break;
      case 'flag': P(0, 0, 16, 16, c); { const w1 = 6 + (r() * 4 | 0); const c1 = r() < .5 ? a : b, c2 = r() < .5 ? b : a; P(1, 1, w1, 14, c1); P(1, 1, w1, 1, shade(c1, .12)); P(w1 + 2, 1, 13 - w1, 6, c2); P(w1 + 2, 8, 13 - w1, 7, c1); P(w1 + 2, 1, 13 - w1, 1, shade(c2, .12)); } break;
      case 'void': P(0, 0, 16, 16, a); for (let i = 0; i < 14; i++) P(r() * 16 | 0, r() * 16 | 0, 1, 1, r() < .5 ? b : c); if (r() < .14) { let x = r() * 12 | 0, y = r() * 12 | 0; for (let i = 0; i < 6; i++) { P(x, y, 1, 1, '#6a3aa8'); x += (r() * 3 | 0) - 1 || 1; y += 1; } } break;
    }
  }
  // wall face: 16 x 32 strip (top wall, two tiles tall)
  function wallFace(g, th, x0, y0, tx, r) {
    const P = painter(g, x0, y0), [a, b, c] = th.w;
    switch (th.wall) {
      case 'brick': P(0, 0, 16, 32, c); for (let row = 0; row < 6; row++) { const off = (row % 2) * 4; for (let sx = -4; sx < 16; sx += 8) { const col = r() < .5 ? a : b; P(sx + off, 4 + row * 5, 7, 4, col); P(sx + off, 4 + row * 5, 7, 1, shade(col, .15)); } } if (tx % 3 === 1) { P(3, 9, 10, 15, '#1c1420'); const lit = r() < .7; P(4, 10, 8, 13, lit ? '#ffcf7a' : '#2a3048'); if (lit) { P(4, 10, 8, 2, '#fff0c0'); P(5, 17, 6, 6, '#e8a84a'); } P(7, 10, 2, 13, '#1c1420'); P(4, 16, 8, 1, '#1c1420'); P(2, 24, 12, 2, '#6a5060'); } else if (tx % 7 === 4) { P(3, 12, 10, 20, '#2a1a14'); P(4, 13, 8, 19, '#5a3a24'); P(4, 13, 8, 1, '#7a5030'); P(10, 22, 1, 2, '#e0b84a'); } break;
      case 'panel': P(0, 0, 16, 32, a); P(0, 4, 16, 1, c); P(15, 4, 1, 28, c); P(0, 18, 16, 1, c); [[2, 7], [13, 7], [2, 21], [13, 21]].forEach(([x, y]) => P(x, y, 1, 1, shade(b, .35))); for (let i = 0; i < 2; i++) { const x = 3 + r() * 10 | 0; P(x, 8 + r() * 4 | 0, 1, 6 + r() * 8 | 0, '#9a5a2a'); } if (tx % 3 === 1) { P(5, 9, 6, 6, '#2a1a10'); P(6, 10, 4, 4, '#ffb04a'); } break;
      case 'ruin': P(0, 0, 16, 32, c); for (let row = 0; row < 4; row++) for (let sx = 0; sx < 16; sx += 8) { const col = r() < .5 ? a : b; P(sx + 1, 4 + row * 7, 6 + (r() * 2 | 0), 6, col); P(sx + 1, 4 + row * 7, 6, 1, shade(col, .15)); } for (let i = 0; i < 7; i++) P(r() * 16 | 0, 4 + r() * 6 | 0, 1 + (r() * 2 | 0), 1 + (r() * 3 | 0), '#3f7a44'); if (r() < .4) P(r() * 14 | 0, 4, 1, 10 + r() * 10 | 0, '#4a8a4a'); break;
      case 'wood': for (let k = 0; k < 4; k++) { const col = (k + tx) % 2 ? a : b; P(k * 4, 0, 4, 32, col); P(k * 4 + 3, 0, 1, 32, c); } P(0, 12, 16, 3, c); P(0, 12, 16, 1, shade(b, .2)); if (tx % 4 === 2) { P(7, 15, 1, 3, '#222'); ell(P, 7, 21, 3, 4, '#d8442a'); P(5, 18, 5, 1, '#a02a1a'); P(5, 24, 5, 1, '#a02a1a'); P(6, 20, 3, 2, '#ffd27a'); } break;
      case 'glass': P(0, 0, 16, 32, a); if (tx % 2 === 0) { const cols = ['#ff4d8d', '#4a8aff', '#ffcf6a', '#8a4aff', '#4affc8']; P(3, 6, 10, 24, c); for (let y = 0; y < 5; y++) for (let x = 0; x < 2; x++) P(4 + x * 4 + (x ? 1 : 0), 8 + y * 4, 3, 3, shade(cols[(tx + y + x) % 5], -.25 + r() * .2)); P(5, 6, 6, 1, c); P(7, 5, 2, 1, c); } else { P(6, 4, 4, 28, b); P(6, 4, 1, 28, shade(b, .15)); } break;
      case 'hull': for (let row = 0; row < 7; row++) { const col = row % 2 ? a : b; P(0, 4 + row * 4, 16, 4, col); P(0, 4 + row * 4 + 3, 16, 1, c); } P(0, 2, 16, 2, '#6a5038'); P(tx % 2 ? 2 : 10, 0, 2, 6, '#6a5038'); if (tx % 3 === 0) { disc(P, 8, 18, 3, '#2a2a32'); disc(P, 8, 18, 2, '#5a8aa0'); } break;
      case 'rock': P(0, 0, 16, 32, c); for (let i = 0; i < 6; i++) { const x = r() * 12 | 0, y = 4 + r() * 22 | 0, col = r() < .5 ? a : b; ell(P, x + 3, y + 2, 4, 3, col); P(x + 1, y, 4, 1, shade(col, .2)); } P(0, 2, 16, 3, '#eef2f8'); P(r() * 12 | 0, 5, 4, 1, '#eef2f8'); break;
      case 'shoji': P(0, 0, 16, 32, b); P(0, 0, 16, 4, a); P(0, 22, 16, 10, a); P(0, 22, 16, 1, shade(a, .25)); for (let x = 0; x < 16; x += 5) P(x, 4, 1, 18, c); P(0, 12, 16, 1, c); P(15, 0, 1, 32, c); if (tx % 5 === 2) { P(4, 14, 8, 1, '#c9a24a'); } break;
      case 'obsidian': P(0, 0, 16, 32, a); for (let i = 0; i < 4; i++) { const x = r() * 14 | 0, h = 6 + r() * 14 | 0; for (let y = 0; y < h; y++) P(x + (y * .2 | 0), 30 - y, 2 - (y > h * .7 ? 1 : 0), 1, b); } for (let i = 0; i < 2; i++) { let x = r() * 14 | 0, y = 6 + r() * 10 | 0; for (let k = 0; k < 9; k++) { P(x, y, 1, 1, k % 3 ? '#7a4ac0' : '#c08aff'); x += (r() * 3 | 0) - 1; y += 1; } } break;
    }
    P(0, 0, 16, 3, th.cap); P(0, 3, 16, 1, shade(th.cap, .25)); P(0, 31, 16, 1, shade(c, -.4));
  }
  function decal(g, th, type, x, y, r) {
    const P = painter(g, x, y);
    switch (type) {
      case 'flower': { const cols = ['#ff6a8a', '#ffd84a', '#9fd0ff', '#ffffff', '#c08aff']; for (let i = 0; i < 3; i++) { const fx = r() * 12 | 0, fy = r() * 12 | 0; P(fx, fy + 1, 1, 2, '#2a6a32'); P(fx, fy, 1, 1, cols[r() * 5 | 0]); } break; }
      case 'moss': for (let i = 0; i < 8; i++) P(r() * 14 | 0, r() * 14 | 0, 2, 1, '#4a8a4a'); break;
      case 'puddle': ell(P, 8, 9, 6, 3, 'rgba(110,140,190,.35)'); P(5, 8, 3, 1, 'rgba(220,235,255,.5)'); break;
      case 'leaf': P(r() * 12 | 0, r() * 12 | 0, 2, 1, '#8a6a2a'); P(r() * 12 | 0, r() * 12 | 0, 1, 2, '#a0502a'); break;
      case 'oil': ell(P, 8, 9, 5, 3, 'rgba(10,8,6,.55)'); P(6, 8, 2, 1, 'rgba(120,90,200,.4)'); break;
      case 'bolt': P(r() * 13 | 0, r() * 13 | 0, 2, 2, '#8a8a90'); break;
      case 'rug': for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 28; xx++) P(xx - 6, yy + 2, 1, 1, (xx === 0 || yy === 0 || xx === 27 || yy === 11) ? '#e0b04a' : ((xx + yy) % 6 < 3 ? '#8a1e2a' : '#a8323a')); break;
      case 'coin': P(r() * 14 | 0, r() * 14 | 0, 1, 1, '#ffd84a'); break;
      case 'crack': { let cx = r() * 10 | 0, cy = r() * 8 | 0; for (let i = 0; i < 7; i++) { P(cx, cy, 1, 1, shade(th.f[2], -.4)); cx += (r() * 3 | 0) - 1; cy++; } break; }
      case 'petal': for (let i = 0; i < 3; i++) P(r() * 14 | 0, r() * 14 | 0, 2, 1, i % 2 ? '#ff9ab8' : '#ffc0d4'); break;
      case 'track': for (let i = 0; i < 3; i++) P(3 + i * 4, 4 + (i % 2) * 5, 2, 3, '#aab4c8'); break;
      case 'skull': P(6, 6, 4, 3, '#d8d0c8'); P(7, 7, 1, 1, '#000'); P(9, 7, 1, 1, '#000'); P(7, 9, 2, 1, '#d8d0c8'); break;
      case 'rope': for (let a = 0; a < 18; a++) { const ang = a * .7, rr = 1 + a * .25; P(8 + Math.cos(ang) * rr | 0, 8 + Math.sin(ang) * rr * .6 | 0, 1, 1, '#b08a52'); } break;
    }
  }

  // ---------------- characters ----------------
  const SPR = {};
  function charSprite(key, L, dir, fr) {
    const k = key + '|' + dir + '|' + fr; if (SPR[k]) return SPR[k];
    const c = mk(24, 34), g = c.getContext('2d'), P = painter(g, 12, 32);
    const step = fr === 1 ? 1 : fr === 3 ? -1 : 0;
    if (L.robot) {
      const st = '#6a7a72', st2 = '#869690', dk = '#3a4844', moss = '#4a7a3a', eye = L.eye;
      const lu = step > 0 ? 1 : 0, ru = step < 0 ? 1 : 0;
      P(-6, -6 - lu, 4, 5, dk); P(2, -6 - ru, 4, 5, dk); P(-6, -1 - lu, 5, 1, '#2a2a2a'); P(2, -1 - ru, 5, 1, '#2a2a2a');
      P(-7, -17, 14, 11, st); P(-7, -17, 14, 1, st2); P(-7, -7, 14, 1, dk); P(-3, -14, 6, 5, dk); P(-2, -13, 4, 3, dir === 1 ? dk : shade(eye, -.3));
      P(-9, -16 + step, 2, 9, st2); P(7, -16 - step, 2, 9, st2);
      P(-5, -25, 10, 8, st); P(-5, -25, 10, 1, st2); P(-5, -18, 10, 1, dk); P(-4, -26, 3, 1, moss); P(1, -27, 2, 2, moss); P(-7, -15, 2, 1, moss);
      if (dir === 0) { P(-3, -22, 2, 2, eye); P(1, -22, 2, 2, eye); } else if (dir === 2) P(2, -22, 2, 2, eye);
      return SPR[k] = outline(c);
    }
    if (L.cloud) {
      const bob = fr % 2 ? -1 : 0, y0 = -14 + bob;
      ell(P, 0, y0, 7, 5, '#eef6ff'); ell(P, -4, y0 + 2, 4, 3, '#ffffff'); ell(P, 4, y0 + 2, 4, 3, '#ffffff'); ell(P, 0, y0 - 3, 4, 3, '#ffffff'); P(-6, y0 + 4, 12, 1, '#c8dcf4');
      if (dir === 0) { P(-3, y0, 2, 2, '#2a4a8a'); P(1, y0, 2, 2, '#2a4a8a'); P(-3, y0, 1, 1, '#fff'); P(1, y0, 1, 1, '#fff'); P(-5, y0 + 2, 1, 1, '#ffb0c8'); P(4, y0 + 2, 1, 1, '#ffb0c8'); }
      else if (dir === 2) { P(2, y0, 2, 2, '#2a4a8a'); P(2, y0, 1, 1, '#fff'); }
      P(0, y0 - 9, 1, 1, '#fff6c0'); P(-1, y0 - 8, 3, 1, '#fff6c0'); P(0, y0 - 7, 1, 1, '#fff6c0');
      return SPR[k] = outline(c, [120, 150, 200]);
    }
    if (L.void) { for (let y = -30; y < 0; y++) { const w = Math.round(4 + Math.sin((y + 30) / 30 * Math.PI) * 4); P(-w, y, w * 2, 1, '#050208'); } P(1, -24, 2, 2, '#ffffff'); return SPR[k] = outline(c, [120, 70, 200]); }
    const ex = L.extra || [], has = e => ex.includes(e);
    const skin = L.skin, hair = L.hair, cl = L.cloth, c2 = L.cloth2, dk = shade(cl, -.35), lt = shade(cl, .18), shoe = '#241a18', eye = '#1a1020';
    const ch = L.child ? 3 : 0, bT = -13 + ch, hT = bT - 8; // body top, head top
    // legs
    const pants = has('kimono') || has('hood') ? cl : has('overalls') ? c2 : shade(cl, -.45);
    if (dir === 2) {
      const a = step, b = -step;
      P(-2 + a, -5, 2, 4, pants); P(-2 + a, -1, 3, 1, shoe); P(0 + b, -5, 2, 4, shade(pants, -.15)); P(0 + b, -1, 3, 1, shoe);
    } else {
      const lu = step > 0 ? 1 : 0, ru = step < 0 ? 1 : 0;
      P(-3, -5 - lu, 2, 4, pants); P(-3, -1 - lu, 2, 1, shoe); P(1, -5 - ru, 2, 4, pants); P(1, -1 - ru, 2, 1, shoe);
    }
    // body
    const bw = dir === 2 ? 6 : 8, bx = dir === 2 ? -3 : -4;
    if (has('kimono') || has('hood') || has('veil')) P(bx - 1, bT, bw + 2, -bT - 3, cl); // robe reaches lower
    P(bx, bT, bw, -bT - 4, cl); P(bx, bT, bw, 1, lt); P(bx + bw - 1, bT, 1, -bT - 4, dk);
    if (has('overalls')) { P(-2, bT + 1, 4, -bT - 5, c2); P(-2, bT + 1, 1, 2, '#c9a24a'); }
    else if (has('kimono')) { for (let i = 0; i < 4; i++) P(dir === 2 ? i - 1 : -2 + i, bT + i, 1, 1, c2); P(bx, -6, bw, 1, c2); }
    else if (has('armor')) { P(bx - 1, bT, bw + 2, 3, c2); P(bx, -6, bw, 1, shade(c2, -.3)); }
    else P(bx, -6, bw, 1, c2);
    if (has('scarf')) { P(bx, bT, bw, 2, c2); if (dir !== 1) P(bx + 1, bT + 2, 2, 3, c2); else P(bx + bw - 3, bT + 2, 2, 4, c2); }
    if (has('highcollar') || has('shawl')) P(bx - 1, bT, bw + 2, 2, c2);
    if (has('epaulettes')) { P(bx - 1, bT, 2, 1, '#e0b84a'); P(bx + bw - 1, bT, 2, 1, '#e0b84a'); }
    // arms
    if (dir === 2) { P(-1 + step, bT + 1, 2, 5, lt); P(-1 + step, bT + 6, 2, 1, skin); }
    else { P(bx - 1, bT + 1 + step, 1, 5, cl); P(bx + bw, bT + 1 - step, 1, 5, dk); P(bx - 1, bT + 6 + step, 1, 1, skin); P(bx + bw, bT + 6 - step, 1, 1, skin); }
    // head
    const hw = dir === 2 ? 7 : 8, hx = dir === 2 ? -3 : -4;
    P(hx, hT, hw, 8, skin); P(hx, hT + 7, hw, 1, shade(skin, -.15));
    const H = (x, y, w, h) => P(x, y, w, h, hair);
    const hs = L.hs;
    if (dir === 1) { // back
      if (hs !== 'bald') H(hx, hT, hw, hs === 'slick' || hs === 'short' ? 5 : 7);
      if (hs === 'bob') H(hx - 1, hT + 2, hw + 2, 6); if (hs === 'long' || hs === 'long_side') H(hx - 1, hT + 2, hw + 2, 12);
      if (hs === 'topknot' || hs === 'bun') H(-1, hT - 3, 3, 3);
    } else if (dir === 0) { // front
      if (hs !== 'bald') H(hx, hT, hw, 3);
      if (hs === 'bob') { H(hx - 1, hT + 1, 2, 7); H(hx + hw - 1, hT + 1, 2, 7); H(hx + 1, hT + 3, 3, 1); }
      if (hs === 'messy') { H(hx - 1, hT - 1, 2, 2); H(hx + 3, hT - 2, 2, 2); H(hx + 6, hT - 1, 2, 2); H(hx, hT + 3, 2, 1); H(hx + 5, hT + 3, 2, 1); }
      if (hs === 'topknot') { H(-1, hT - 3, 3, 3); H(hx, hT + 3, 1, 2); H(hx + hw - 1, hT + 3, 1, 2); }
      if (hs === 'bun') { H(-1, hT - 2, 3, 2); }
      if (hs === 'long') { H(hx - 1, hT + 1, 2, 12); H(hx + hw - 1, hT + 1, 2, 12); }
      if (hs === 'long_side') { H(hx - 1, hT + 1, 3, 11); H(hx, hT + 3, 4, 1); H(hx + hw - 1, hT + 1, 1, 5); }
      if (hs === 'short') { H(hx, hT + 3, 1, 2); H(hx + hw - 1, hT + 3, 1, 2); }
      if (hs === 'bald') { H(hx, hT + 3, 1, 3); H(hx + hw - 1, hT + 3, 1, 3); }
      P(-2, hT + 4, 1, 2, eye); P(1, hT + 4, 1, 2, eye); P(-2, hT + 4, 1, 1, L.eye); P(1, hT + 4, 1, 1, L.eye);
      if (!L.old) { P(-3, hT + 6, 1, 1, shade(skin, -.08)); }
    } else { // side, facing right
      if (hs !== 'bald') H(hx, hT, hw, 3);
      H(hx, hT, 3, hs === 'short' || hs === 'slick' ? 5 : 7);
      if (hs === 'bob') H(hx - 1, hT + 1, 4, 7); if (hs === 'long' || hs === 'long_side') H(hx - 1, hT + 1, 3, 12);
      if (hs === 'messy') { H(hx + 1, hT - 1, 2, 1); H(hx + 4, hT - 2, 2, 2); H(hx + 6, hT + 2, 1, 2); }
      if (hs === 'topknot' || hs === 'bun') H(hx - 1, hT - 2, 3, 3);
      P(hx + hw - 2, hT + 4, 1, 2, eye); P(hx + hw - 2, hT + 4, 1, 1, L.eye); P(hx + hw, hT + 5, 1, 1, skin);
    }
    // head extras
    if (has('goggles')) { P(hx, hT + 2, hw, 1, '#6a4a22'); if (dir === 0) { P(-3, hT + 1, 2, 2, '#7fe0ff'); P(1, hT + 1, 2, 2, '#7fe0ff'); } else if (dir === 2) P(hx + hw - 3, hT + 1, 2, 2, '#7fe0ff'); }
    if (has('goggles_eyes') && dir !== 1) { P(dir === 0 ? -3 : hx + hw - 3, hT + 4, dir === 0 ? 6 : 3, 2, '#c9a24a'); P(dir === 0 ? -2 : hx + hw - 2, hT + 4, 1, 1, '#7fff9a'); if (dir === 0) P(1, hT + 4, 1, 1, '#7fff9a'); }
    if (has('helmet')) { P(hx - 1, hT - 1, hw + 2, 4, '#7c7c8c'); P(hx - 1, hT - 1, hw + 2, 1, '#a0a0b0'); }
    if (has('visor') && dir !== 1) P(hx, hT + 3, hw, 2, '#7fd1ff');
    if (has('hood')) { P(hx - 1, hT - 1, hw + 2, 4, cl); P(hx - 1, hT + 2, 2, 8, cl); P(hx + hw - 1, hT + 2, 2, 8, cl); if (dir === 1) P(hx, hT, hw, 8, cl); }
    if (has('mask') && dir !== 1) { P(dir === 0 ? -3 : hx + 2, hT + 3, dir === 0 ? 6 : 5, 4, '#ece4f2'); P(dir === 0 ? -2 : hx + hw - 2, hT + 4, 1, 1, c2); if (dir === 0) P(1, hT + 4, 1, 1, c2); }
    if (has('veil')) { P(hx - 1, hT - 1, hw + 2, 3, '#140a18'); P(hx - 1, hT + 2, 2, 12, '#140a18'); P(hx + hw - 1, hT + 2, 2, 12, '#140a18'); P(-1, hT - 1, 2, 1, c2); }
    if (has('hat')) { P(hx - 2, hT + 1, hw + 4, 1, shade(c2, -.4)); P(hx, hT - 3, hw, 4, shade(c2, -.25)); P(hx, hT, hw, 1, c2); }
    if (has('cap')) { P(hx, hT - 1, hw, 3, c2); if (dir === 0) P(hx - 1, hT + 2, hw + 2, 1, shade(c2, -.3)); if (dir === 2) P(hx + hw - 1, hT + 2, 3, 1, shade(c2, -.3)); }
    if ((has('beard') || has('longbeard')) && dir !== 1) { const bh = has('longbeard') ? 6 : 2; P(dir === 0 ? hx + 1 : hx + 3, hT + 6, dir === 0 ? hw - 2 : 4, bh, hair); }
    if (has('mustache') && dir !== 1) P(dir === 0 ? -2 : hx + hw - 3, hT + 6, dir === 0 ? 4 : 3, 1, hair);
    if (has('scar') && dir === 0) P(1, hT + 3, 1, 3, '#c04a4a');
    if (has('monocle') && dir === 0) { P(0, hT + 3, 3, 1, '#e0b84a'); P(2, hT + 4, 1, 2, '#e0b84a'); }
    if (has('glasses') && dir === 0) { P(-3, hT + 4, 3, 1, '#c9a24a'); P(0, hT + 4, 3, 1, '#c9a24a'); }
    if (has('shards')) { P(hx - 2, hT + 9, 1, 1, c2); P(hx + hw + 1, hT + 12, 1, 1, c2); }
    return SPR[k] = outline(c);
  }

  // ---------------- enemies (overworld patrols) ----------------
  function enemySprite(look, col, fr) {
    const k = 'en|' + look + '|' + col + '|' + fr; if (SPR[k]) return SPR[k];
    const human = { soldier: 'soldier', cultist: 'monk', samurai: 'samurai', boss_admiral: 'soldier', boss_shogun: 'samurai', boss_glass: 'monk' }[look];
    if (human) { const L = Object.assign({}, ART.LOOK[human], { cloth2: col }); const s = charSprite('en_' + look + col, L, 0, fr); return SPR[k] = s; }
    const c = mk(28, 34), g = c.getContext('2d'), P = painter(g, 14, 32), dk = shade(col, -.5), bob = fr % 2;
    switch (look) {
      case 'drone': case 'mech': case 'boss_crane':
        if (look === 'drone') { const y = -16 - bob; P(-6, y, 12, 6, '#5a5a66'); P(-6, y, 12, 1, '#8a8a96'); P(-2, y + 2, 4, 2, col); P(-9, y - 2, 6, 1, '#aaa'); P(3, y - 2, 6, 1, '#aaa'); P(-7, y - 1, 1, 1, '#333'); P(6, y - 1, 1, 1, '#333'); }
        else { P(-7, -20, 14, 14, '#4a4f5a'); P(-7, -20, 14, 1, '#7a808c'); P(-4, -17, 8, 3, col); P(-6, -6, 4, 5, '#333840'); P(2, -6, 4, 5, '#333840'); P(-10, -18 + bob, 3, 9, '#5a606c'); P(7, -18 - bob, 3, 9, '#5a606c'); }
        break;
      case 'beast': P(-9, -10 - bob, 16, 6, dk); P(-9, -10 - bob, 16, 1, col); P(5, -13 - bob, 6, 6, dk); P(9, -11 - bob, 1, 1, col); P(-8, -4, 2, 4, dk); P(-3, -4 + bob, 2, 4, dk); P(1, -4, 2, 4, dk); P(5, -4 + bob, 2, 4, dk); P(-11, -11 - bob, 3, 1, dk); break;
      case 'wraith': for (let y = -24; y < -2; y++) { const w = Math.round(5 - Math.abs(y + 14) * .12 + (y > -8 ? Math.sin(y + fr) : 0)); P(-w, y - bob, w * 2, 1, y % 3 ? shade(col, -.2) : col); } P(-3, -20 - bob, 2, 2, '#fff'); P(1, -20 - bob, 2, 2, '#fff'); break;
      case 'golem': case 'boss_king': P(-9, -24, 18, 20, '#4a4458'); P(-9, -24, 18, 2, '#6a6478'); P(-4, -20, 3, 2, col); P(1, -20, 3, 2, col); P(-12, -20 + bob, 4, 12, '#3a3448'); P(8, -20 - bob, 4, 12, '#3a3448'); P(-7, -4, 5, 4, '#2a2438'); P(2, -4, 5, 4, '#2a2438'); P(-2, -14, 4, 4, shade(col, -.2)); break;
      default: P(-5, -16, 10, 14, col);
    }
    return SPR[k] = outline(c);
  }

  // ---------------- props ----------------
  function propSprite(type, th, seed) {
    const k = 'p|' + type + '|' + (th.floor) + '|' + seed; if (SPR[k]) return SPR[k];
    const c = mk(40, 48), g = c.getContext('2d'), P = painter(g, 20, 46), r = rngOf(seed * 31 + type.length);
    const wood = '#8a5a32', wood2 = '#a6703e', woodD = '#5a3a1e';
    switch (type) {
      case 'lamp': P(-1, -26, 2, 26, '#2a2430'); P(-3, -3, 6, 3, '#2a2430'); P(-4, -33, 8, 7, '#3a3040'); P(-3, -32, 6, 5, '#ffe6a0'); P(-1, -32, 2, 5, '#fff8d8'); P(-2, -35, 4, 2, '#3a3040'); break;
      case 'lantern': P(-1, -30, 2, 30, '#2a1a12'); P(-3, -3, 6, 3, '#2a1a12'); P(-1, -30, 8, 1, '#2a1a12'); ell(P, 6, -22, 4, 5, '#d8442a'); P(3, -25, 7, 1, '#a02a1a'); P(3, -19, 7, 1, '#a02a1a'); P(5, -23, 3, 3, '#ffd27a'); P(6, -28, 1, 2, '#2a1a12'); break;
      case 'crate': P(-7, -12, 14, 12, wood); P(-7, -12, 14, 2, wood2); P(-7, -12, 1, 12, woodD); P(6, -12, 1, 12, woodD); P(-7, -1, 14, 1, woodD); for (let i = 0; i < 10; i++) P(-5 + i, -10 + i, 1, 1, woodD); P(-7, -6, 14, 1, woodD); break;
      case 'barrel': P(-5, -14, 10, 14, '#7a4a2a'); P(-5, -14, 10, 2, '#9a6038'); P(-5, -12, 10, 1, '#4a4a52'); P(-5, -4, 10, 1, '#4a4a52'); P(-3, -11, 1, 9, '#a06a3e'); P(-6, -9, 1, 5, '#7a4a2a'); P(5, -9, 1, 5, '#6a3a1e'); break;
      case 'bench': P(-9, -7, 18, 2, wood2); P(-9, -5, 18, 1, woodD); P(-8, -4, 2, 4, woodD); P(6, -4, 2, 4, woodD); P(-9, -12, 18, 2, wood); P(-8, -10, 1, 3, woodD); P(7, -10, 1, 3, woodD); break;
      case 'plant': P(-4, -6, 8, 6, '#a0522d'); P(-4, -6, 8, 1, '#c06a3a'); ell(P, 0, -11, 6, 5, '#2e6a3a'); ell(P, -3, -13, 3, 3, '#3e8a4a'); ell(P, 3, -14, 3, 3, '#4a9a52'); break;
      case 'tree': case 'sakura': {
        const pal = type === 'sakura' ? ['#b04a6a', '#e07a9a', '#ffb0c8'] : ['#245a32', '#357a42', '#52a05e'];
        P(-2, -12, 4, 12, '#4a3020'); P(-2, -12, 1, 12, '#6a4630'); P(-4, -2, 8, 2, '#4a3020');
        ell(P, 0, -24, 12, 10, pal[0]); for (let i = 0; i < 9; i++) ell(P, -8 + r() * 16 | 0, -30 + r() * 12 | 0, 4 + (r() * 3 | 0), 3 + (r() * 2 | 0), pal[1]); for (let i = 0; i < 8; i++) P(-8 + r() * 14 | 0, -33 + r() * 10 | 0, 2, 1, pal[2]); break;
      }
      case 'pine': P(-1, -6, 3, 6, '#4a3020'); for (let l = 0; l < 4; l++) { const w = 10 - l * 2, y = -8 - l * 7; for (let i = 0; i < 8; i++) P(-w + i * .4 | 0, y - i, (w - i * .5) * 2 | 0, 1, l % 2 ? '#2a4a3c' : '#24423a'); P(-w + 2, y - 2, w * 2 - 4, 1, '#eef2f8'); } P(0, -40, 1, 2, '#eef2f8'); break;
      case 'pillar': { const s1 = th.w[0], s2 = th.w[1]; P(-6, -3, 12, 3, s2); P(-5, -30, 10, 27, s1); P(-5, -30, 2, 27, s2); P(1, -30, 1, 27, shade(s1, -.2)); P(-7, -33, 14, 3, s2); P(-7, -33, 14, 1, shade(s2, .2)); break; }
      case 'statue': { const s = '#7a7a86', s2 = '#9a9aa6'; P(-6, -6, 12, 6, '#5a5a66'); P(-6, -6, 12, 1, s2); P(-3, -20, 6, 14, s); P(-2, -26, 4, 6, s); P(-5, -18, 2, 8, s); P(3, -24, 2, 8, s); P(-3, -20, 1, 14, s2); P(-1, -25, 2, 1, '#9fffd0'); break; }
      case 'bush': ell(P, 0, -5, 7, 5, '#2e6a3a'); ell(P, -3, -7, 3, 3, '#3e8a4a'); ell(P, 3, -6, 3, 2, '#4a9a52'); P(-2, -8, 1, 1, '#ff6a8a'); P(3, -4, 1, 1, '#ffd84a'); break;
      case 'crystal': { const a = th.acc; P(-1, -18, 3, 18, a); P(-1, -18, 1, 18, '#ffffff'); P(-5, -11, 3, 11, shade(a, -.2)); P(-5, -11, 1, 3, shade(a, .5)); P(3, -9, 3, 9, shade(a, -.3)); P(3, -9, 1, 3, shade(a, .4)); P(-6, -1, 13, 1, shade(a, -.6)); break; }
      case 'gear': for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; P(Math.round(Math.cos(an) * 8) - 1, -9 + Math.round(Math.sin(an) * 8) - 1, 3, 3, '#6a5a4a'); } disc(P, 0, -9, 7, '#7a6a5a'); disc(P, 0, -9, 3, '#3a3028'); P(-5, -14, 4, 1, '#9a8a7a'); break;
      case 'pipe': P(-3, -28, 6, 28, '#6a5040'); P(-3, -28, 2, 28, '#8a6a52'); P(-4, -20, 8, 2, '#4a3a2e'); P(-4, -8, 8, 2, '#4a3a2e'); disc(P, 0, -14, 3, '#b0302a'); P(-1, -15, 2, 2, '#e05a4a'); break;
      case 'scrap': P(-7, -4, 14, 4, '#4a4440'); P(-5, -8, 6, 4, '#6a5a50'); P(1, -10, 3, 7, '#7a4a2a'); P(-6, -6, 2, 2, '#8a8a90'); P(4, -5, 3, 2, '#5a6a70'); P(-2, -9, 1, 1, '#aaa'); break;
      case 'candle': P(-1, -14, 2, 14, '#c9a24a'); P(-5, -14, 10, 1, '#c9a24a'); P(-4, -3, 8, 3, '#a8842e'); [-5, 0, 4].forEach(x => { P(x, -18, 2, 4, '#efe6d8'); P(x, -20, 2, 2, '#ffd27a'); P(x, -21, 1, 1, '#fff6c0'); }); break;
      case 'pew': P(-14, -8, 28, 3, '#3a2418'); P(-14, -8, 28, 1, '#5a3a26'); P(-14, -15, 28, 3, '#2a1a10'); P(-13, -5, 2, 5, '#24160c'); P(11, -5, 2, 5, '#24160c'); P(-1, -5, 2, 5, '#24160c'); break;
      case 'cannon': P(-6, -5, 12, 5, wood); P(-6, -5, 12, 1, wood2); disc(P, -4, -1, 2, '#2a2018'); disc(P, 4, -1, 2, '#2a2018'); P(-8, -10, 16, 5, '#2a2a32'); P(-8, -10, 16, 1, '#4a4a56'); P(7, -11, 2, 7, '#1a1a20'); break;
      case 'rock': ell(P, 0, -4, 7, 4, th.floor === 'snow' ? '#7c859a' : '#4a4652'); P(-4, -7, 6, 1, th.floor === 'snow' ? '#eef2f8' : '#6a6672'); P(-5, -6, 3, 1, th.floor === 'snow' ? '#eef2f8' : '#5a5662'); break;
      case 'wreck': P(-9, -3, 18, 3, '#5a4a3a'); for (let i = 0; i < 9; i++) P(-6 + i, -12 + i, 2, 1, '#6a5440'); P(2, -9, 2, 9, '#4a3a2e'); P(-8, -5, 5, 2, '#7a6450'); P(-1, -12, 1, 1, '#eef2f8'); break;
      case 'toro': { const s = '#8a8690', s2 = '#a8a4ae'; P(-5, -3, 10, 3, s); P(-2, -12, 4, 9, s); P(-5, -18, 10, 6, s); P(-3, -17, 6, 4, '#ffd27a'); P(-7, -21, 14, 3, s2); P(-1, -24, 2, 3, s2); break; }
      case 'bamboo': [-5, 0, 4].forEach((x, i) => { const h = 26 + i * 4 - (i === 2 ? 8 : 0); P(x, -h, 2, h, '#4a8a3a'); P(x, -h, 1, h, '#6aaa52'); for (let y = -h + 5; y < 0; y += 6) P(x - 1, y, 4, 1, '#2e5a24'); P(x + 2, -h + 3, 4, 1, '#5a9a42'); P(x - 4, -h + 9, 4, 1, '#5a9a42'); }); break;
      case 'spike': for (let y = 0; y < 22; y++) { const w = Math.max(1, Math.round((22 - y) / 4)); P(-w, -y - 1, w * 2, 1, y % 5 === 2 ? th.acc : th.w[1]); } break;
      case 'ruin': { const s1 = th.w[0], s2 = th.w[1]; P(-5, -3, 10, 3, s2); P(-4, -14, 8, 11, s1); P(-4, -14, 2, 11, s2); P(-4, -16, 3, 2, s1); P(1, -15, 3, 1, s1); P(-7, -2, 3, 2, s1); P(5, -1, 2, 1, s2); break; }
    }
    return SPR[k] = outline(c);
  }
  const LIGHT = { lamp: [0, -30, 46, '#ffd27a'], lantern: [6, -22, 40, '#ff8a3a'], candle: [0, -19, 34, '#ffcf7a'], crystal: [0, -10, 34, null], toro: [0, -15, 34, '#ffd27a'], pipe: [0, -14, 14, '#ff5a3a'] };
  const BLOCK = { lamp: 1, lantern: 1, crate: 1, barrel: 1, bench: 1, plant: 1, tree: 1, sakura: 1, pine: 1, pillar: 1, statue: 1, bush: 1, crystal: 1, gear: 1, pipe: 1, scrap: 1, candle: 1, pew: 1, cannon: 1, rock: 1, wreck: 1, toro: 1, bamboo: 1, spike: 1, ruin: 1 };

  // ---------------- interactive objects ----------------
  function nodeSprite(type, th, fr) {
    const k = 'n|' + type + '|' + th.floor + '|' + fr; if (SPR[k]) return SPR[k];
    const c = mk(40, 48), g = c.getContext('2d'), P = painter(g, 20, 46);
    switch (type) {
      case 'main': { const gold = '#c9a24a', gl = '#ffe6a0'; P(-11, -30, 4, 30, gold); P(7, -30, 4, 30, gold); P(-11, -30, 1, 30, gl); P(7, -30, 1, 30, gl); for (let x = -11; x <= 10; x++) { const y = -30 - Math.round(Math.sqrt(Math.max(0, 121 - x * x)) * .5); P(x, y, 1, 3, gold); P(x, y, 1, 1, gl); } P(-7, -32, 14, 32, '#2a1e44'); for (let i = 0; i < 14; i++) { const y = -2 - ((i * 7 + fr * 3) % 30); P(-6 + (i * 5) % 12, y, 1, 2, i % 2 ? '#ffe6a0' : '#8a7aff'); } P(-13, -2, 26, 2, shade(gold, -.3)); break; }
      case 'lore': P(-5, -15, 10, 15, '#5a5070'); P(-5, -15, 10, 1, '#7a7090'); P(-6, -2, 12, 2, '#3a3448'); P(-3, -12, 2, 1, '#c08aff'); P(0, -12, 3, 1, '#c08aff'); P(-3, -9, 5, 1, '#c08aff'); P(-2, -6, 3, 1, fr % 2 ? '#ffffff' : '#c08aff'); break;
      case 'camp': { P(-7, -3, 14, 3, '#4a3020'); for (let i = 0; i < 7; i++) P(-6 + i * 2, -4 + (i % 2), 2, 1, '#3a2418'); [[-8, -1], [7, -1], [-6, 1], [5, 1]].forEach(([x, y]) => P(x, y - 1, 2, 2, '#6a6672')); const f = fr % 3; P(-3, -8 - f, 6, 6 + f, '#ff6a2a'); P(-2, -11 - f, 4, 5, '#ffb547'); P(-1, -13 - (f === 1 ? 1 : 0), 2, 4, '#fff0a0'); P(-4 + f, -6, 1, 2, '#ff6a2a'); break; }
      case 'shop': { P(-14, -10, 28, 10, '#6a4630'); P(-14, -10, 28, 2, '#8a5a3a'); P(-12, -26, 2, 16, '#4a3020'); P(10, -26, 2, 16, '#4a3020'); for (let x = -15; x < 15; x++) P(x, -29, 1, 4, ((x + 15) >> 2) % 2 ? th.acc : '#f4ecdf'); P(-15, -25, 30, 1, shade(th.acc, -.4)); P(-10, -13, 3, 3, '#ffcf6a'); P(-5, -12, 2, 2, '#7fd1ff'); P(1, -13, 3, 3, '#ff6a8a'); P(6, -12, 3, 2, '#9fffd0'); break; }
      case 'bubble': P(-3, -9, 7, 9, '#f4ecdf'); P(-1, -1, 2, 2, '#f4ecdf'); P(0, -8, 1, 4, '#d8442a'); P(0, -3, 1, 1, '#d8442a'); break;
    }
    return SPR[k] = outline(c);
  }

  return { T, TH, theme, shade, mk, rngOf, outline, floorTile, wallFace, decal, charSprite, enemySprite, propSprite, nodeSprite, LIGHT, BLOCK };
})();

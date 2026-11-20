// ROTTA D'AURORA — sprite in pixel art moderna: volumi ombreggiati con palette a 5 toni (ombre fredde,
// luci calde), contorni colorati, luce da in alto a sinistra. Sostituisce gli sprite di base di PIX.
'use strict';
(() => {
  const { mk, rngOf } = PIX;
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixA = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const RC = {};
  // rampa di 5 toni: [ombra profonda, ombra, base, luce, riflesso] con spostamento di tinta
  function ramp(col) {
    if (RC[col]) return RC[col]; const c = rgb(col);
    const lum = (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255, kl = lum < .2 ? .45 : 1; // i colori scuri restano scuri
    const lift = lum < .2 ? mixA(c, [90, 80, 120], .18) : c;
    return RC[col] = [mixA(c, [22, 14, 48], .58), mixA(c, [36, 26, 70], .3), lift, mixA(lift, [255, 236, 190], .24 * kl), mixA(lift, [255, 250, 230], .5 * kl)].map(hex);
  }
  const BY = [0, .5, .75, .25];
  const tone = (R, t, x, y) => { const v = t * 4 + (BY[(x & 1) + (y & 1) * 2] - .375) * .32; return R[Math.max(0, Math.min(4, Math.round(v)))]; };

  // tela con ancoraggio (piedi) e primitive ombreggiate
  function canvas(w, h, ax, ay) {
    const c = mk(w, h), g = c.getContext('2d');
    const px = (x, y, col) => { if (!col) return; g.fillStyle = col; g.fillRect(ax + x, ay + y, 1, 1); };
    const rect = (x, y, w2, h2, col) => { g.fillStyle = col; g.fillRect(ax + x, ay + y, w2, h2); };
    // ellisse/sfera ombreggiata (luce da in alto a sinistra)
    const ball = (cx, cy, rx, ry, R, k = 1, lx = -.55, ly = -.65) => {
      for (let y = Math.floor(-ry); y <= Math.ceil(ry); y++) for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
        const nx = x / (rx + .3), ny = y / (ry + .3), q = nx * nx + ny * ny; if (q > 1) continue;
        const nz = Math.sqrt(1 - q), d = (-(nx * lx + ny * ly) * .75 + nz * .55) * k + (1 - k) * .55;
        px(Math.round(cx + x), Math.round(cy + y), tone(R, Math.max(0, Math.min(1, d * .85 + .1)), cx + x, cy + y));
      }
    };
    // cilindro verticale: tono per colonna, con fasce
    const cyl = (cx, top, rx, hgt, R, cap = true) => {
      for (let y = 0; y < hgt; y++) for (let x = -rx; x <= rx; x++) { const u = x / (rx + .5), t = .62 - u * .42 - (Math.abs(u) > .8 ? .15 : 0) - (y > hgt - 2 ? .2 : 0); px(cx + x, top + y, tone(R, Math.max(0, Math.min(1, t)), cx + x, top + y)); }
      if (cap) { const ry = Math.max(1, Math.round(rx * .35)); for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + .5) + (y * y) / (ry * ry + .3) <= 1) px(cx + x, top + y, (y < 0 ? R[4] : R[3])); }
    };
    // scatola in 3/4: faccia superiore chiara + faccia frontale sfumata
    const box = (x, y, w2, h2, d, R) => {
      for (let yy = 0; yy < d; yy++) for (let xx = 0; xx < w2; xx++) px(x + xx, y + yy, xx === 0 || yy === 0 ? R[4] : R[3]);
      for (let yy = 0; yy < h2; yy++) for (let xx = 0; xx < w2; xx++) { const t = .58 - yy / h2 * .3 - (xx === w2 - 1 ? .25 : 0) + (xx === 0 ? .12 : 0); px(x + xx, y + d + yy, tone(R, t, x + xx, y + yy)); }
    };
    return { c, g, px, rect, ball, cyl, box };
  }
  // contorno colorato: scurisce il colore vicino invece del nero pieno
  function outline2(c, tint = [20, 12, 30]) {
    const g = c.getContext('2d'), w = c.width, h = c.height, D = g.getImageData(0, 0, w, h), a = D.data, src = new Uint8ClampedArray(a);
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 60;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (on(x, y)) continue; let n = null;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (on(x + dx, y + dy)) { n = ((y + dy) * w + x + dx) * 4; break; }
      if (n === null) continue; const i = (y * w + x) * 4, below = on(x, y - 1) ? .78 : .66;
      a[i] = src[n] * (1 - below) + tint[0] * below; a[i + 1] = src[n + 1] * (1 - below) + tint[1] * below; a[i + 2] = src[n + 2] * (1 - below) + tint[2] * below; a[i + 3] = 255;
    }
    g.putImageData(D, 0, 0); return c;
  }
  const SPR = {};

  // ======================= PERSONAGGI (32x42, piedi in 16,40) =======================
  function charSprite(key, L, dir, fr) {
    const k = key + '|' + dir + '|' + fr; if (SPR[k]) return SPR[k];
    const S = canvas(32, 42, 16, 40), { px, rect, ball } = S;
    const step = [0, 1, 0, -1][fr % 4], bob = fr % 2 ? -1 : 0;
    if (L.robot) return SPR[k] = outline2(robot(S, L, dir, step, bob).c);
    if (L.cloud) return SPR[k] = outline2(cloud(S, L, dir, fr).c, [70, 100, 170]);
    if (L.void) { for (let y = -36; y < 0; y++) { const w = Math.round(5 + Math.sin((y + 36) / 36 * Math.PI) * 5); for (let x = -w; x < w; x++) px(x, y + bob, (x + y) % 7 === 0 ? '#1a0e2a' : '#06030c'); } px(-2, -28 + bob, '#ffffff'); px(2, -28 + bob, '#ffffff'); return SPR[k] = outline2(S.c, [120, 70, 210]); }
    const ex = L.extra || [], has = e => ex.includes(e);
    const SK = ramp(L.skin), HR = ramp(L.hair), CL = ramp(L.cloth), C2 = ramp(L.cloth2), SH = ramp('#3a2a26');
    const ch = L.child ? 5 : 0, bT = -19 + ch, hc = bT - 7; // torso top, head centre
    const robe = has('kimono') || has('hood') || has('veil');
    const PANTS = has('overalls') ? C2 : robe ? CL : ramp(L.old ? '#3a3440' : '#2c2a3a');
    // gambe
    const leg = (x, lift, R) => { for (let y = -7; y < -1 - lift; y++) for (let xx = 0; xx < 3; xx++) px(x + xx, y, R[xx === 0 ? 3 : xx === 2 ? 1 : 2]); rect(x - (dir === 2 ? 0 : 0), -2 - lift, 4, 2, SH[1]); px(x, -2 - lift, SH[3]); };
    if (dir === 2) { leg(-2 + step * 2, 0, PANTS.map((c, i) => PANTS[Math.max(0, i - 1)])); leg(-1 - step * 2, 0, PANTS); }
    else { leg(-4, step > 0 ? 1 : 0, PANTS); leg(1, step < 0 ? 1 : 0, PANTS); }
    // busto (cilindro morbido)
    const bw = dir === 2 ? 9 : 12, bx = -Math.floor(bw / 2), bH = -bT - 6 + (robe ? 4 : 0);
    for (let y = 0; y < bH; y++) for (let x = 0; x < bw; x++) {
      const u = (x + .5) / bw, edge = (y === 0 && (x === 0 || x === bw - 1)); if (edge) continue;
      const t = .72 - u * .5 - (y > bH - 2 ? .18 : 0) + (y < 2 ? .1 : 0); px(bx + x, bT + y, tone(dir === 1 ? CL.map((c, i) => CL[Math.max(0, i - 1)]) : CL, t, x, y));
    }
    // dettagli dell'abito
    const belt = bT + bH - (robe ? 6 : 3);
    if (has('overalls')) { for (let y = bT + 3; y < bT + bH; y++) for (let x = -3; x <= 2; x++) px(x, y, tone(C2, .65 - (x + 3) / 6 * .4, x, y)); px(-3, bT + 3, '#e8c25a'); px(2, bT + 3, '#e8c25a'); rect(-4, bT, 1, 4, C2[2]); rect(3, bT, 1, 4, C2[1]); }
    else if (has('kimono')) { for (let i = 0; i < 6; i++) { px((dir === 2 ? 1 : -3) + i, bT + i, C2[3]); px((dir === 2 ? 2 : -2) + i, bT + i, C2[2]); } for (let x = bx; x < bx + bw; x++) { px(x, belt, C2[2]); px(x, belt + 1, C2[1]); } px(dir === 2 ? bx + 1 : 2, belt, '#e8c25a'); }
    else if (has('armor')) { for (let y = 0; y < 4; y++) for (let x = bx - 1; x <= bx + bw; x++) px(x, bT + y, tone(C2, .8 - y * .15 - (x - bx) / bw * .3, x, y)); for (let x = bx; x < bx + bw; x += 3) px(x, bT + 5, C2[1]); }
    else { for (let x = bx; x < bx + bw; x++) px(x, belt, C2[1]); px(dir === 2 ? bx + bw - 2 : 0, belt, '#e8c25a'); if (dir === 0) for (let y = bT + 1; y < belt; y += 2) px(0, y, CL[1]); }
    if (has('highcollar') || has('shawl')) { for (let x = bx - 1; x <= bx + bw; x++) { px(x, bT - 1, C2[3]); px(x, bT, C2[2]); px(x, bT + 1, C2[1]); } }
    if (has('epaulettes')) { rect(bx - 1, bT, 3, 2, '#e0b84a'); px(bx - 1, bT, '#fff0a0'); rect(bx + bw - 2, bT, 3, 2, '#c9a24a'); }
    // braccia con oscillazione
    const arm = (x, sw, R) => { for (let y = 0; y < 8; y++) { px(x, bT + 1 + y + sw, R[y < 2 ? 3 : 2]); px(x + 1, bT + 1 + y + sw, R[1]); } rect(x, bT + 9 + sw, 2, 2, SK[2]); px(x, bT + 9 + sw, SK[3]); };
    if (dir === 2) arm(-1 + step, 0, CL);
    else { arm(bx - 2, step, CL); arm(bx + bw, -step, CL.map((c, i) => CL[Math.max(0, i - 1)])); }
    // sciarpa (dopo le braccia, con coda mossa)
    if (has('scarf')) { for (let x = bx - 1; x <= bx + bw; x++) { px(x, bT - 1, C2[3]); px(x, bT, C2[2]); px(x, bT + 1, C2[1]); } const tx = dir === 1 ? bx + bw - 3 : dir === 2 ? bx - 2 - Math.abs(step) : bx + 1; for (let y = 2; y < 7; y++) { px(tx + (dir === 2 ? -(y >> 1) : 0), bT + y, C2[y % 2 ? 2 : 1]); px(tx + 1 + (dir === 2 ? -(y >> 1) : 0), bT + y, C2[1]); } }
    // testa (sfera grande, stile chibi moderno)
    const rx = dir === 2 ? 6.2 : 7, ry = 6.6;
    ball(0, hc + bob * 0, rx, ry, SK, .85);
    const H = (x, y) => px(x, y, null);
    // capelli: calotta ombreggiata + ciocche + riflesso
    const hs = L.hs, hcap = hs === 'bald' ? 0 : hs === 'slick' || hs === 'short' ? 4.2 : 5;
    const hairPx = (x, y, t) => px(x, y, tone(HR, t, x, y));
    if (hs !== 'bald') {
      for (let y = Math.floor(-ry - 1); y <= Math.ceil(ry); y++) for (let x = Math.floor(-rx - 1); x <= Math.ceil(rx + 1); x++) {
        const nx = x / (rx + 1), ny = y / (ry + 1); if (nx * nx + ny * ny > 1) continue;
        let cover = y < -ry + hcap + (dir === 1 ? 9 : 0);
        if (dir === 0) { if (hs === 'bob' || hs === 'long') cover = cover || Math.abs(x) >= rx - 1.5 && y < (hs === 'long' ? 9 : 4); if (hs === 'long_side') cover = cover || (x < -2 && y < 5) || (y < -ry + hcap + 2 && x < 2); }
        if (dir === 2) cover = cover || (x < -1 && y < (hs === 'short' || hs === 'slick' ? 1 : 4));
        if (!cover) continue;
        const t = .62 - nx * .3 - ny * .25 + (Math.abs(x + y * .6 + 2) < 1.2 && y < 0 ? .3 : 0);
        hairPx(x, hc + y, Math.max(0, Math.min(1, t)));
      }
      if (hs === 'messy') [[-6, -6], [-3, -8], [0, -9], [3, -8], [6, -6]].forEach(([x, y], i) => { hairPx(x, hc + y, .8); hairPx(x + 1, hc + y + 1, .55); if (i % 2) hairPx(x, hc + y - 1, .9); });
      if (hs === 'topknot' || hs === 'bun') ball(dir === 2 ? -2 : 0, hc - ry - 2, 2.4, 2.2, HR, .9);
      if ((hs === 'long' || hs === 'long_side') && dir !== 0) for (let y = 0; y < 12; y++) for (let x = (dir === 2 ? -6 : -6); x <= (dir === 2 ? -2 : 6); x++) hairPx(x, hc + 2 + y, .5 - y / 30 - Math.abs(x) / 30);
      if ((hs === 'long') && dir === 0) for (let y = 0; y < 9; y++) { hairPx(-7, hc + 3 + y, .45); hairPx(-6, hc + 3 + y, .55); hairPx(6, hc + 3 + y, .3); hairPx(7, hc + 3 + y, .2); }
      if (hs === 'bob' && dir === 0) { for (let y = 0; y < 4; y++) { hairPx(-7, hc + 1 + y, .5); hairPx(7, hc + 1 + y, .25); } for (let x = -4; x <= 2; x += 2) hairPx(x, hc - ry + hcap + 1, .4); }
    } else { px(-3, hc - 4, SK[4]); px(-2, hc - 5, SK[4]); if (dir === 0) { hairPx(-7, hc, .4); hairPx(7, hc, .3); } }
    // volto
    if (dir === 0) {
      const ey = hc + 1;
      const eye = (x) => { if (L.old) { px(x, ey + 1, SK[0]); px(x + 1, ey + 1, SK[0]); return; } px(x, ey, '#1a1020'); px(x + 1, ey, '#1a1020'); px(x, ey + 1, L.eye); px(x + 1, ey + 1, '#1a1020'); px(x, ey + 2, ramp(L.eye)[1]); px(x + 1, ey + 2, ramp(L.eye)[3]); px(x, ey + 1, '#ffffff'); };
      eye(-4); eye(2);
      px(-5, ey + 3, '#f08a8a'); px(4, ey + 3, '#f08a8a'); px(-1, ey + 4, SK[1]); px(0, ey + 4, SK[1]);
    } else if (dir === 2) {
      const ey = hc + 1; if (L.old) { px(3, ey + 1, SK[0]); px(4, ey + 1, SK[0]); } else { px(3, ey, '#1a1020'); px(4, ey, '#1a1020'); px(3, ey + 1, '#ffffff'); px(4, ey + 1, L.eye); px(4, ey + 2, ramp(L.eye)[1]); }
      px(6, ey + 2, SK[3]); px(6, ey + 3, SK[2]); px(2, ey + 3, '#f08a8a'); px(-2, hc + 1, SK[1]); px(-2, hc + 2, SK[1]);
    }
    // accessori della testa
    const fx = dir === 0 ? -5 : 1, fw = dir === 0 ? 11 : 6;
    if (has('goggles')) { for (let x = -rx; x <= rx; x++) px(Math.round(x), hc - 3, '#5a3a1a'); if (dir !== 1) { const lens = (x) => { ball(x, hc - 3, 1.6, 1.4, ramp('#7fe0ff'), .8); px(x - 1, hc - 4, '#ffffff'); }; if (dir === 0) { lens(-3); lens(3); } else lens(3); } }
    if (has('goggles_eyes') && dir !== 1) { const lens = x => { ball(x, hc + 2, 1.8, 1.6, ramp('#c9a24a'), .9); px(x, hc + 2, '#7fff9a'); px(x - 1, hc + 1, '#d8ffd0'); }; if (dir === 0) { lens(-3); lens(3); for (let x = -1; x <= 1; x++) px(x, hc + 2, '#8a6a2a'); } else lens(3); }
    if (has('helmet')) for (let y = -ry - 1; y < -1; y++) for (let x = -rx - 1; x <= rx + 1; x++) { const nx = x / (rx + 1.5), ny = y / (ry + 1); if (nx * nx + ny * ny <= 1) px(Math.round(x), Math.round(hc + y), tone(ramp('#7c7c8c'), .65 - nx * .3 - ny * .2, x, y)); }
    if (has('visor') && dir !== 1) for (let x = fx; x < fx + fw; x++) { px(x, hc + 1, '#a8e8ff'); px(x, hc + 2, '#4aa8e0'); }
    if (has('hood')) { for (let y = -ry - 2; y <= ry + 3; y++) for (let x = -rx - 2; x <= rx + 2; x++) { const nx = x / (rx + 2), ny = y / (ry + 2); const inside = nx * nx + ny * ny <= 1, face = dir !== 1 && Math.abs(x - (dir === 2 ? 2 : 0)) < (dir === 2 ? 4 : 5) && y > -3 && y < 6; if (inside && !face) px(Math.round(x), Math.round(hc + y), tone(CL, .6 - nx * .3 - ny * .2, x, y)); } }
    if (has('mask') && dir !== 1) for (let y = 0; y < 5; y++) for (let x = fx; x < fx + fw - (dir === 2 ? 0 : 1); x++) px(x, hc - 1 + y, tone(ramp('#ece4f2'), .7 - y * .08, x, y));
    if (has('mask') && dir === 0) { px(-3, hc + 1, L.cloth2); px(2, hc + 1, L.cloth2); }
    if (has('veil')) for (let y = -ry - 1; y <= ry + 8; y++) for (let x = -rx - 1; x <= rx + 1; x++) { const nx = x / (rx + 1), side = Math.abs(nx) > .55 || y < -3 || dir === 1; if (side && (y < 0 ? nx * nx + (y / (ry + 1)) ** 2 <= 1 : Math.abs(nx) <= 1)) px(Math.round(x), Math.round(hc + y), tone(ramp('#1e1026'), .5 - nx * .3, x, y)); }
    if (has('hat')) { for (let x = -rx - 3; x <= rx + 3; x++) { px(Math.round(x), hc - 4, C2[1]); px(Math.round(x), hc - 3, C2[0]); } for (let y = -10; y < -4; y++) for (let x = -5; x <= 5; x++) px(x, hc + y, tone(C2, .65 - x / 12 - (y === -6 ? .3 : 0), x, y)); }
    if (has('cap')) { for (let y = -ry - 1; y < -2; y++) for (let x = -rx; x <= rx; x++) { const nx = x / (rx + .5), ny = y / (ry + 1); if (nx * nx + ny * ny <= 1) px(Math.round(x), Math.round(hc + y), tone(C2, .65 - nx * .3, x, y)); } if (dir === 0) for (let x = -5; x <= 5; x++) px(x, hc - 2, C2[0]); if (dir === 2) for (let x = 3; x <= 8; x++) px(x, hc - 2, C2[1]); }
    if ((has('beard') || has('longbeard')) && dir !== 1) { const bh = has('longbeard') ? 8 : 3; for (let y = 0; y < bh; y++) for (let x = (dir === 0 ? -4 + (y >> 2) : 1); x <= (dir === 0 ? 4 - (y >> 2) : 5); x++) px(x, hc + 4 + y, tone(HR, .6 - y / bh * .3 - x / 20, x, y)); }
    if (has('mustache') && dir !== 1) for (let x = (dir === 0 ? -3 : 3); x <= (dir === 0 ? 3 : 6); x++) px(x, hc + 4, HR[1]);
    if (has('scar') && dir === 0) { px(2, hc - 1, '#c04a4a'); px(3, hc, '#c04a4a'); px(3, hc + 1, '#e07070'); }
    if (has('monocle') && dir === 0) { px(2, hc, '#e0b84a'); px(4, hc, '#e0b84a'); px(4, hc + 2, '#e0b84a'); px(5, hc + 3, '#e0b84a'); px(5, hc + 5, '#e0b84a'); }
    if (has('glasses') && dir === 0) { [-4, 2].forEach(x => { px(x - 1, hc + 1, '#c9a24a'); px(x + 2, hc + 1, '#c9a24a'); px(x, hc, '#c9a24a'); px(x + 1, hc, '#c9a24a'); }); px(0, hc + 1, '#c9a24a'); }
    if (has('shards')) { px(bx - 3, bT + 2, L.cloth2); px(bx + bw + 2, bT + 5, L.cloth2); px(bx - 2, bT + 7, '#ffffff'); }
    return SPR[k] = outline2(S.c);
  }
  function robot(S, L, dir, step, bob) {
    const { px, rect, ball, box } = S, M = ramp('#6a7a72'), D = ramp('#3a4844'), moss = ramp('#4a7a3a'), eye = L.eye;
    // gambe
    [[-6, step > 0 ? 1 : 0], [2, step < 0 ? 1 : 0]].forEach(([x, l]) => { box(x, -8 - l, 5, 6, 1, D); rect(x - 1, -2 - l, 7, 2, '#2a2a2e'); });
    // busto squadrato
    box(-9, -24, 18, 13, 3, M);
    for (let x = -8; x < 9; x += 4) { px(x, -21, M[4]); px(x, -10, M[0]); }
    if (dir !== 1) { rect(-4, -19, 8, 6, D[0]); ball(0, -16, 3, 2.4, ramp(eye), .9); px(-1, -17, '#ffffff'); }
    [[-12, step], [10, -step]].forEach(([x, s]) => { for (let y = 0; y < 11; y++) { px(x, -22 + y + s, M[y < 2 ? 4 : 3]); px(x + 1, -22 + y + s, M[2]); px(x + 2, -22 + y + s, M[1]); } rect(x, -11 + s, 3, 2, D[1]); });
    // testa
    box(-6, -34 + bob, 12, 7, 2, M);
    if (dir === 0) { ball(-3, -29 + bob, 1.4, 1.2, ramp(eye), 1); ball(3, -29 + bob, 1.4, 1.2, ramp(eye), 1); px(-3, -30 + bob, '#ffffff'); px(3, -30 + bob, '#ffffff'); }
    else if (dir === 2) { ball(3, -29 + bob, 1.4, 1.2, ramp(eye), 1); px(3, -30 + bob, '#ffffff'); }
    rect(0, -38 + bob, 1, 4, D[2]); px(0, -39 + bob, eye);
    // muschio
    [[-6, -34], [-5, -35], [4, -34], [-9, -22], [-8, -23], [7, -13]].forEach(([x, y], i) => px(x, y + (y < -30 ? bob : 0), moss[i % 2 ? 2 : 3]));
    return S;
  }
  function cloud(S, L, dir, fr) {
    const { px, ball } = S, R = ramp('#dce8fa'), bob = Math.round(Math.sin(fr / 4 * Math.PI * 2) * 1.2), y0 = -18 + bob;
    ball(-5, y0 + 2, 5, 4, R); ball(5, y0 + 2, 5, 4, R); ball(0, y0 - 1, 7, 6, R); ball(-2, y0 - 5, 4, 3, R);
    if (dir === 0) { [-3, 2].forEach(x => { px(x, y0, '#2a4a8a'); px(x + 1, y0, '#2a4a8a'); px(x, y0 + 1, '#2a4a8a'); px(x + 1, y0 + 1, '#4a7ad0'); px(x, y0, '#ffffff'); }); px(-5, y0 + 3, '#ffb0c8'); px(5, y0 + 3, '#ffb0c8'); px(-1, y0 + 3, '#6a8ac0'); px(0, y0 + 3, '#6a8ac0'); }
    else if (dir === 2) { px(3, y0, '#2a4a8a'); px(4, y0, '#2a4a8a'); px(3, y0 + 1, '#ffffff'); px(4, y0 + 1, '#4a7ad0'); px(4, y0 + 3, '#ffb0c8'); }
    const sp = ramp('#fff6c0'); px(0, y0 - 12, sp[4]); px(-1, y0 - 11, sp[3]); px(0, y0 - 11, sp[4]); px(1, y0 - 11, sp[3]); px(0, y0 - 10, sp[4]);
    return S;
  }

  // ======================= NEMICI =======================
  function enemySprite(look, col, fr) {
    const k = 'en|' + look + '|' + col + '|' + fr; if (SPR[k]) return SPR[k];
    const human = { soldier: 'soldier', cultist: 'monk', samurai: 'samurai', boss_admiral: 'soldier', boss_shogun: 'samurai', boss_glass: 'monk' }[look];
    if (human) { const L = Object.assign({}, ART.LOOK[human], { cloth2: col }); return SPR[k] = charSprite('en_' + look + col, L, 0, fr); }
    const S = canvas(34, 42, 17, 40), { px, rect, ball, box, cyl } = S, C = ramp(col), M = ramp('#5a5f6c'), bob = fr % 2;
    switch (look) {
      case 'drone': { const y = -20 - bob; ball(0, y, 8, 5, M, .9); ball(0, y + 1, 3, 2, C, 1); px(-1, y, '#ffffff'); for (let x = -12; x <= 12; x++) if (Math.abs(x) > 5) px(x, y - 5, (x + fr) % 3 ? '#c8ccd8' : '#7a7e8a'); rect(-6, y - 4, 1, 2, M[1]); rect(5, y - 4, 1, 2, M[1]); for (let i = 0; i < 3; i++) px(-1 + i, y + 6 + (i === 1 ? 1 : 0), C[3]); break; }
      case 'mech': case 'boss_crane': { box(-9, -30, 18, 16, 3, M); rect(-5, -24, 10, 4, C[1]); for (let x = -4; x < 4; x++) px(x, -23, C[x === -4 ? 4 : 3]); [[-7, 0], [3, 0]].forEach(([x]) => box(x, -12, 5, 8, 1, ramp('#3a3e48'))); [[-13, bob], [10, -bob]].forEach(([x, s]) => cyl(x + 1, -28 + s, 2, 12, M, false)); break; }
      case 'beast': { ball(-1, -10 - bob, 10, 6, C, .9); ball(9, -14 - bob, 5, 4.5, C, .9); px(11, -15 - bob, '#fff6a0'); px(12, -15 - bob, '#1a1020'); for (let i = 0; i < 4; i++) { const x = -8 + i * 5, l = (i + fr) % 2; for (let y = 0; y < 5 - l; y++) { px(x, -5 + y, C[1]); px(x + 1, -5 + y, C[0]); } } for (let i = 0; i < 5; i++) px(-11 - i, -12 - bob + (i >> 1), C[2 - (i >> 1)]); for (let x = -6; x < 6; x += 2) px(x, -16 - bob, C[4]); break; }
      case 'wraith': { for (let y = -30; y < -1; y++) { const w = 6.5 - Math.abs(y + 18) * .16 + (y > -9 ? Math.sin(y * .9 + fr) * 1.2 : 0); for (let x = -Math.round(w); x <= Math.round(w); x++) px(x, y - bob, tone(C, .7 - x / (w * 2.2) - (y + 30) / 70, x, y)); } ball(-3, -25 - bob, 1.3, 1.6, ramp('#ffffff'), 1); ball(3, -25 - bob, 1.3, 1.6, ramp('#ffffff'), 1); break; }
      case 'golem': case 'boss_king': { const St = ramp('#4a4458'); box(-10, -32, 20, 22, 4, St); ball(-4, -24, 2, 1.4, C, 1); ball(4, -24, 2, 1.4, C, 1); [[-14, bob], [10, -bob]].forEach(([x, s]) => box(x, -28 + s, 5, 14, 2, St)); [[-8], [3]].forEach(([x]) => box(x, -10, 6, 8, 1, ramp('#3a3448'))); for (let i = 0; i < 6; i++) px(-6 + i * 2, -16 + (i % 2), C[3]); break; }
      default: box(-6, -18, 12, 14, 2, C);
    }
    return SPR[k] = outline2(S.c);
  }

  // ======================= OGGETTI (40x48, piedi in 20,46) =======================
  function propSprite(type, th, seed) {
    const k = 'p|' + type + '|' + th.floor + '|' + seed; if (SPR[k]) return SPR[k];
    const S = canvas(40, 48, 20, 46), { px, rect, ball, cyl, box } = S, r = rngOf(seed * 31 + type.length * 7);
    const WOOD = ramp('#8a5a32'), IRON = ramp('#3a3446'), BRASS = ramp('#c9a24a'), STONE = ramp(th.w[1] || '#7a7a86');
    const leaves = (cx, cy, rx, ry, R, n = 9) => { ball(cx, cy, rx, ry, R, .9); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = r() * .7; ball(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d - 1, 2.5 + r() * 2.5, 2 + r() * 2, R, .9); } for (let i = 0; i < n * 2; i++) { const x = Math.round(cx + (r() - .6) * rx * 1.4), y = Math.round(cy + (r() - .7) * ry * 1.3); px(x, y, R[4]); } };
    switch (type) {
      case 'lamp': { cyl(0, -27, 1, 25, IRON, false); box(-3, -4, 7, 3, 1, IRON); rect(-2, -16, 5, 1, IRON[3]); box(-4, -36, 9, 2, 1, IRON); for (let y = -33; y < -26; y++) for (let x = -3; x <= 3; x++) px(x, y, Math.abs(x) === 3 ? IRON[2] : y < -31 ? '#fff8d8' : x < 0 ? '#ffe6a0' : '#ffc860'); px(0, -32, '#ffffff'); rect(-4, -26, 9, 1, IRON[1]); px(0, -38, IRON[3]); break; }
      case 'lantern': { const R = ramp('#d8442a'); cyl(-2, -32, 1, 32, WOOD, false); rect(-2, -32, 9, 1, WOOD[1]); ball(5, -22, 5, 6, R, .8); for (let y = -27; y <= -17; y += 3) for (let x = 1; x <= 9; x++) if (Math.hypot((x - 5) / 5, (y + 22) / 6) < 1) px(x, y, R[1]); ball(5, -23, 2, 3, ramp('#ffd27a'), .5); rect(3, -29, 5, 1, '#2a1a12'); rect(3, -16, 5, 1, '#2a1a12'); px(5, -15, '#e0b84a'); px(5, -14, '#e0b84a'); break; }
      case 'crate': { box(-8, -16, 16, 12, 4, WOOD); for (let x = -8; x < 8; x++) { px(x, -8, WOOD[1]); } for (let i = 0; i < 11; i++) px(-7 + i * 1.3 | 0, -5 - i, WOOD[3]); [[-8, -12], [7, -12], [-8, -5], [7, -5]].forEach(([x, y]) => { px(x, y, IRON[3]); px(x, y + 1, IRON[1]); }); for (let x = -7; x < 7; x += 3) px(x, -15, WOOD[2]); break; }
      case 'barrel': { const B = ramp('#7a4a2a'); for (let y = 0; y < 15; y++) { const bulge = Math.round(Math.sin(y / 14 * Math.PI) * 1.2); for (let x = -5 - bulge; x <= 5 + bulge; x++) { const u = x / (6 + bulge), t = .65 - u * .42 - (y > 13 ? .2 : 0); px(x, -16 + y, tone(B, t, x, y)); } } [-14, -9, -4].forEach(y => { for (let x = -6; x <= 6; x++) px(x, y, x < -2 ? IRON[3] : IRON[1]); }); for (let y = -16; y < -2; y += 1) if (y % 4) { px(-2, y, B[1]); px(2, y, B[1]); } for (let x = -5; x <= 5; x++) for (let y = -18; y <= -16; y++) if ((x * x) / 30 + ((y + 17) ** 2) / 2 <= 1) px(x, y, y === -18 ? B[4] : B[3]); px(0, -17, B[1]); break; }
      case 'bench': { box(-11, -12, 22, 2, 3, WOOD); for (let x = -11; x < 11; x += 4) px(x, -11, WOOD[1]); box(-11, -18, 22, 2, 1, WOOD); [-9, 8].forEach(x => { rect(x, -7, 2, 7, IRON[1]); px(x, -7, IRON[3]); rect(x, -16, 1, 4, IRON[2]); }); break; }
      case 'plant': { const T = ramp('#b0603a'); cyl(0, -8, 5, 8, T); for (let x = -5; x <= 5; x++) px(x, -6, T[1]); leaves(0, -14, 7, 5, ramp('#3e8a4a'), 7); px(-3, -18, '#ff8aa8'); px(3, -16, '#ffd84a'); break; }
      case 'tree': case 'sakura': { const L = ramp(type === 'sakura' ? '#e07a9a' : '#3a8048'); const Tk = ramp('#5a3a24'); for (let y = -16; y < 0; y++) for (let x = -2; x <= 2; x++) px(x + (y < -10 ? (y + 10) / 6 | 0 : 0), y, tone(Tk, .65 - x * .18, x, y)); [[-4, -1], [-3, -2], [3, -1], [4, -1]].forEach(([x, y]) => px(x, y, Tk[1])); leaves(0, -27, 13, 10, L, 12); if (type === 'sakura') for (let i = 0; i < 6; i++) px(-12 + r() * 24 | 0, -2 - r() * 6 | 0, '#ffc0d4'); break; }
      case 'pine': { const P2 = ramp('#2e5a48'); cyl(0, -7, 1, 7, ramp('#5a3a24'), false); for (let l = 0; l < 4; l++) { const w = 11 - l * 2.4, y = -8 - l * 7; for (let i = 0; i < 9; i++) for (let x = -Math.round(w - i * 1.1); x <= Math.round(w - i * 1.1); x++) px(x, y - i, tone(P2, .62 - x / (w * 2.4) - (i < 2 ? .15 : 0), x, i)); if (th.floor === 'snow') for (let x = -Math.round(w - 3); x <= Math.round(w - 4); x++) px(x, y - 3 - (Math.abs(x) >> 2), '#f4f8ff'); } px(0, -41, '#f4f8ff'); break; }
      case 'pillar': { cyl(0, -31, 5, 28, STONE, false); for (let x = -3; x <= 3; x += 2) for (let y = -29; y < -5; y++) px(x, y, tone(STONE, .3 - x * .05, x, y)); box(-7, -35, 14, 3, 1, STONE); box(-7, -5, 14, 3, 1, STONE); break; }
      case 'statue': { const St = ramp('#8a8a96'); box(-7, -9, 14, 7, 2, ramp('#5a5a66')); for (let y = -24; y < -9; y++) for (let x = -3; x <= 3; x++) px(x, y, tone(St, .7 - x * .1 - (y + 24) / 40, x, y)); ball(0, -27, 3, 3, St, .9); [[-5, -22], [-6, -20], [4, -25], [5, -27]].forEach(([x, y]) => { px(x, y, St[2]); px(x, y + 1, St[1]); }); px(0, -28, '#9fffd0'); for (let y = -22; y < -10; y += 3) px(-2, y, ramp('#4a7a4a')[2]); break; }
      case 'bush': { leaves(0, -6, 8, 5, ramp('#3e8a4a'), 8); px(-3, -9, '#ff6a8a'); px(3, -5, '#ffd84a'); px(1, -10, '#ffffff'); break; }
      case 'crystal': { const A = ramp(th.acc); const shard = (cx, h, w) => { for (let y = 0; y < h; y++) { const hw = Math.max(0, Math.round(w * (1 - Math.max(0, y - h * .6) / (h * .4)))); for (let x = -hw; x <= hw; x++) px(cx + x, -1 - y, x < 0 ? (y > h * .6 ? A[4] : A[3]) : x === 0 ? A[4] : A[1]); } }; shard(-5, 11, 1.5); shard(4, 9, 1.5); shard(0, 19, 2); px(0, -15, '#ffffff'); px(-1, -12, '#ffffff'); for (let x = -7; x <= 6; x++) px(x, -1, A[0]); break; }
      case 'gear': { const G = ramp('#7a6a5a'); for (let i = 0; i < 10; i++) { const an = i / 10 * 6.28; rect(Math.round(Math.cos(an) * 9) - 1, -10 + Math.round(Math.sin(an) * 9) - 1, 3, 3, G[Math.sin(an) < 0 ? 3 : 1]); } ball(0, -10, 8, 8, G, .7); ball(0, -10, 3, 3, ramp('#3a3028'), .4); px(-4, -15, G[4]); px(-5, -14, G[4]); break; }
      case 'pipe': { const Pp = ramp('#7a5a44'); cyl(0, -30, 3, 30, Pp, true); [-22, -8].forEach(y => box(-4, y, 9, 2, 1, IRON)); ball(5, -15, 3, 3, ramp('#c0302a'), .9); px(4, -16, '#ff9a8a'); rect(2, -15, 3, 1, IRON[2]); break; }
      case 'scrap': { box(-9, -6, 18, 4, 2, ramp('#4a4440')); box(-6, -11, 8, 4, 2, ramp('#6a5a50')); box(1, -14, 4, 8, 1, ramp('#7a4a2a')); ball(-6, -8, 2, 2, ramp('#8a8a90'), .9); px(4, -7, '#c8d0d8'); px(-2, -12, '#c8d0d8'); break; }
      case 'candle': { cyl(0, -16, 1, 13, BRASS, false); for (let x = -6; x <= 6; x++) px(x, -16 + (Math.abs(x) > 4 ? 1 : 0), BRASS[x < 0 ? 3 : 2]); box(-5, -4, 10, 2, 1, BRASS); [-6, 0, 6].forEach(x => { for (let y = 0; y < 5; y++) { px(x, -21 + y, '#f4ecdf'); px(x + 1, -21 + y, '#cfc4b4'); } px(x, -23, '#ffd27a'); px(x, -24, '#fff6c0'); px(x + 1, -23, '#ff9a3a'); }); break; }
      case 'pew': { box(-15, -11, 30, 3, 3, ramp('#4a2c1c')); box(-15, -19, 30, 3, 1, ramp('#3a2216')); [-13, 0, 12].forEach(x => rect(x, -5, 2, 5, '#24160c')); break; }
      case 'cannon': { box(-7, -7, 14, 4, 2, WOOD); [-5, 5].forEach(x => ball(x, -2, 2.5, 2.5, IRON, .9)); for (let x = -9; x <= 9; x++) for (let y = -14; y <= -9; y++) px(x, y, tone(IRON, .72 - (y + 14) / 7, x, y)); ball(9, -11, 2.2, 3, ramp('#1a1a20'), .5); px(-6, -14, IRON[4]); break; }
      case 'rock': { const Rk = ramp(th.floor === 'snow' ? '#8a93a8' : '#5a5662'); ball(0, -5, 8, 5, Rk, .95); ball(-3, -7, 4, 3, Rk, .95); if (th.floor === 'snow') for (let x = -6; x <= 4; x++) px(x, -9 - (Math.abs(x + 1) < 3 ? 1 : 0), '#f4f8ff'); break; }
      case 'wreck': { const Wk = ramp('#6a5440'); box(-11, -5, 22, 3, 2, Wk); for (let i = 0; i < 11; i++) { px(-7 + i, -14 + i, Wk[3]); px(-6 + i, -14 + i, Wk[1]); } box(2, -12, 3, 9, 1, Wk); px(-1, -13, '#f4f8ff'); px(-8, -6, '#f4f8ff'); break; }
      case 'toro': { const St = ramp('#8a8690'); box(-5, -4, 10, 2, 1, St); cyl(0, -13, 2, 9, St, false); box(-5, -19, 10, 5, 1, St); rect(-3, -18, 6, 3, '#ffd27a'); px(-2, -18, '#fff6c0'); box(-8, -23, 16, 2, 2, St); ball(0, -25, 2, 2, St, .9); break; }
      case 'bamboo': { const Bb = ramp('#5a9a42'); [-6, 0, 5].forEach((x, i) => { const h = 28 + i * 4 - (i === 2 ? 9 : 0); for (let y = 0; y < h; y++) { px(x, -1 - y, Bb[y % 7 === 0 ? 1 : 3]); px(x + 1, -1 - y, Bb[y % 7 === 0 ? 0 : 2]); } [[2, -h + 4], [-4, -h + 10], [2, -h + 15]].forEach(([dx, y]) => { for (let j = 0; j < 4; j++) px(x + (dx > 0 ? 2 + j : -j), -1 + y + (j >> 1), Bb[3 + (j < 2 ? 1 : 0) - 1]); }); }); break; }
      case 'spike': { const Sp = ramp(th.w[1]); const sp = (cx, h) => { for (let y = 0; y < h; y++) { const w = Math.max(0, Math.round((h - y) / 4.5)); for (let x = -w; x <= w; x++) px(cx + x, -1 - y, x < 0 ? Sp[3] : x === 0 ? Sp[4] : Sp[1]); } px(cx, -h + 3, th.acc); }; sp(0, 24); sp(-6, 12); sp(6, 15); break; }
      case 'ruin': { box(-6, -4, 12, 2, 1, STONE); for (let y = -16; y < -4; y++) for (let x = -4; x <= 4; x++) if (!(y < -13 && x > 1 - (y + 16))) px(x, y, tone(STONE, .65 - x * .08, x, y)); box(-10, -3, 4, 2, 1, STONE); px(6, -2, STONE[3]); px(-2, -14, ramp('#4a8a4a')[3]); px(-3, -13, ramp('#4a8a4a')[2]); break; }
      default: return PIX._oldProp(type, th, seed);
    }
    return SPR[k] = outline2(S.c);
  }

  // ======================= LUOGHI INTERATTIVI =======================
  function nodeSprite(type, th, fr) {
    const k = 'n|' + type + '|' + th.floor + '|' + fr; if (SPR[k]) return SPR[k];
    const S = canvas(40, 48, 20, 46), { px, rect, ball, box } = S, GOLD = ramp('#c9a24a');
    switch (type) {
      case 'main': {
        // portale: archivolto dorato, interno stellato che vortica
        for (let y = -40; y < 0; y++) for (let x = -8; x <= 8; x++) { const top = -32 - Math.sqrt(Math.max(0, 64 - x * x)) * .9; if (y < top) continue; const d = Math.hypot(x, (y + 20) * .6); px(x, y, tone(ramp('#3a2a6a'), .25 + .45 * (1 - d / 14), x, y)); }
        for (let i = 0; i < 16; i++) { const a = (i * 2.4 + fr * .35), rr = (i * 5 % 14) * .6 + 1; const x = Math.round(Math.cos(a) * rr * .8), y = Math.round(-18 + Math.sin(a) * rr * 1.5); px(x, y, i % 3 ? '#ffe6a0' : '#a89aff'); }
        px(0, -18, '#ffffff');
        for (let a = 0; a <= 32; a++) { const an = Math.PI * a / 32, x = Math.round(-Math.cos(an) * 10), y = Math.round(-32 - Math.sin(an) * 9); rect(x - 1, y - 1, 3, 3, GOLD[an < Math.PI / 2 ? 3 : 2]); px(x, y - 1, GOLD[4]); }
        [-11, 9].forEach((x, i) => { for (let y = -32; y < 0; y++) { px(x, y, GOLD[i ? 2 : 4]); px(x + 1, y, GOLD[i ? 1 : 3]); px(x + 2, y, GOLD[i ? 0 : 2]); } });
        box(-14, -3, 28, 2, 1, GOLD); ball(0, -41, 2, 2, ramp('#ffe6a0'), .9);
        break;
      }
      case 'lore': { const St = ramp('#5a5070'); box(-6, -18, 12, 15, 2, St); box(-8, -3, 16, 2, 1, ramp('#3a3448')); const g = fr % 2 ? '#ffffff' : '#d8b0ff'; [[-3, -13, 5], [-3, -10, 3], [-3, -7, 5]].forEach(([x, y, w]) => { for (let i = 0; i < w; i++) px(x + i, y, i % 2 ? '#c08aff' : g); }); ball(0, -20, 1.5, 1.5, ramp('#c08aff'), .9); break; }
      case 'camp': {
        const Lg = ramp('#5a3a24'), Sto = ramp('#6a6672');
        [[-9, 0], [8, 0], [-6, 2], [6, 2], [0, 3], [-10, -3], [9, -3]].forEach(([x, y]) => ball(x, y - 2, 2, 1.5, Sto, .9));
        for (let x = -7; x <= 7; x++) { px(x, -4 - (x & 1), Lg[2]); px(x, -3, Lg[1]); } for (let x = -5; x <= 5; x++) px(x, -5 + Math.abs(x) / 3 | 0, Lg[3]);
        const f = fr % 3, FL = ['#ff5a1a', '#ff9a2a', '#ffd25a', '#fff6c0'];
        for (let y = 0; y < 12 + f; y++) { const w = Math.max(0, Math.round(4.5 - y * .38 + Math.sin(y * 1.3 + f * 2) * .8)); for (let x = -w; x <= w; x++) px(x + Math.round(Math.sin(y * .6 + f) * .8), -5 - y, FL[Math.min(3, Math.max(0, Math.round((1 - Math.abs(x) / (w + 1)) * 3 - y / 10)))]); }
        px(-4 + f * 3, -18 - f, '#ffb547'); px(3 - f, -21, '#ff8a2a');
        break;
      }
      case 'shop': {
        const Wd = ramp('#7a4e32'), A = ramp(th.acc);
        box(-15, -13, 30, 9, 3, Wd); for (let x = -14; x < 14; x += 5) px(x, -8, Wd[1]);
        [-13, 12].forEach(x => { for (let y = -30; y < -10; y++) { px(x, y, Wd[3]); px(x + 1, y, Wd[1]); } });
        for (let x = -16; x <= 16; x++) for (let y = -33; y <= -28 + (Math.abs(x % 5) < 2 ? 1 : 0); y++) px(x, y, ((x + 16) / 4 | 0) % 2 ? A[y < -31 ? 4 : 3] : (y < -31 ? '#ffffff' : '#e8e0d4'));
        [[-10, '#ffcf6a'], [-5, '#7fd1ff'], [1, '#ff6a8a'], [7, '#9fffd0']].forEach(([x, c]) => { ball(x, -14, 2, 1.6, ramp(c), .9); });
        break;
      }
      case 'bubble': { const Wt = ramp('#f4ecdf'); for (let y = -10; y < 0; y++) for (let x = -4; x <= 4; x++) if (!((y === -10 || y === -1) && Math.abs(x) === 4)) px(x, y, y < -8 ? Wt[4] : x > 2 ? Wt[2] : Wt[3]); px(-1, 0, Wt[2]); px(0, 0, Wt[2]); px(-1, 1, Wt[1]); for (let y = -8; y < -4; y++) px(0, y, '#e0442a'); px(0, -3, '#e0442a'); break; }
    }
    return SPR[k] = outline2(S.c);
  }

  PIX._oldProp = PIX.propSprite;
  Object.assign(PIX, { charSprite, enemySprite, propSprite, nodeSprite, ramp, outline2 });
})();

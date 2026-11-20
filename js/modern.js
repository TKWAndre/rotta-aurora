// ROTTA D'AURORA — resa "pixel art moderna": pavimenti organici senza griglia, ombre proiettate,
// luci morbide in alta risoluzione, bagliori, raggi di luce, profondità di campo, correzione colore.
'use strict';
const MOD = (() => {
  const T = 16;
  const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);

  // rumore a valori (liscio) per variazioni organiche
  function noise2(seed) {
    const G = 64, v = new Float32Array(G * G); let s = seed | 0;
    for (let i = 0; i < v.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; v[i] = s / 0x7fffffff; }
    const at = (x, y) => v[((y % G + G) % G) * G + ((x % G + G) % G)];
    const sm = t => t * t * (3 - 2 * t);
    const base = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi); const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
    return (x, y) => base(x / 40, y / 40) * .55 + base(x / 14 + 9, y / 14 + 3) * .3 + base(x / 5 + 17, y / 5 + 11) * .15;
  }

  // ---------------- pavimento dell'intera stanza ----------------
  function paintFloor(g, th, RW, RH, r, info) {
    const w = RW * T, h = RH * T, y0 = 2 * T;
    const N = noise2(Math.floor(r() * 1e6));
    const [A, B, C] = th.f.map(hex);
    const img = g.createImageData(w, h - y0), d = img.data;
    const put = (x, y, c, a = 1) => { if (x < 0 || y < y0 || x >= w || y >= h) return; const i = ((y - y0) * w + x) * 4; d[i] = d[i] * (1 - a) + c[0] * a; d[i + 1] = d[i + 1] * (1 - a) + c[1] * a; d[i + 2] = d[i + 2] * (1 - a) + c[2] * a; d[i + 3] = 255; };
    const get = (x, y) => { const i = ((y - y0) * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    // 1. base: tono organico con dithering ordinato (niente griglia)
    for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = N(x, y), t = n + (BAYER[(y & 3) * 4 + (x & 3)] - .5) * .18;
      put(x, y, t < .42 ? C : t < .62 ? A : B);
    }
    const lit = (c, k) => k > 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k);
    // 2. motivo per tema, con moduli irregolari
    const stone = (cx, cy, rw, rh, base) => { // pietra arrotondata con luce in alto a sinistra
      for (let y = -rh; y <= rh; y++) for (let x = -rw; x <= rw; x++) {
        const q = (x * x) / (rw * rw) + (y * y) / (rh * rh); if (q > 1) continue;
        const px = cx + x, py = cy + y; if (py < y0) continue;
        const n = N(px * 1.5, py * 1.5) - .5; let c = lit(base, n * .12);
        if (y < -rh * .45 && q > .35) c = lit(c, .2); else if (x + y > (rw + rh) * .45) c = lit(c, -.22);
        if (q > .8) c = lit(c, -.16);
        put(px, py, c);
      }
    };
    switch (th.floor) {
      case 'cobble': case 'flag': {
        // ciottoli / lastre di misure diverse, sfalsati
        const gap = lit(C, -.42); for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) put(x, y, lit(gap, (N(x, y) - .5) * .2));
        const big = th.floor === 'flag';
        for (let y = y0 + 2; y < h + 6;) {
          const rh = big ? 5 + (r() * 4 | 0) : 3 + (r() * 2 | 0);
          for (let x = -(r() * 6 | 0); x < w + 6;) { const rw = big ? 6 + (r() * 7 | 0) : 4 + (r() * 4 | 0); const base = r() < .5 ? A : r() < .6 ? B : mix(A, C, .5); stone(x + rw, y + rh + (r() * 2 | 0) - 1, rw, rh, lit(base, (N(x, y) - .5) * .4)); x += rw * 2 + 1 + (r() * 2 | 0); }
          y += rh * 2 + 1;
        }
        if (big) for (let i = 0; i < RW * RH * .6; i++) { const x = r() * w | 0, y = y0 + (r() * (h - y0) | 0); if (get(x, y)[0] < C[0] + 6) for (let k = 0; k < 3; k++) put(x + k, y, [60, 110, 64], .55); }
        break;
      }
      case 'metal': {
        // lastre grandi di larghezza variabile, rivetti, colature di ruggine
        for (let y = y0; y < h;) {
          const ph = 22 + (r() * 20 | 0);
          for (let x = -(r() * 20 | 0); x < w;) {
            const pw = 26 + (r() * 34 | 0), tone = lit(r() < .5 ? A : B, (r() - .5) * .14);
            for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) { const px = x + xx, py = y + yy; if (px < 0 || px >= w || py < y0 || py >= h) continue; const n = N(px * 2, py * 2) - .5; let c = lit(tone, n * .18 + (yy < 1 ? .12 : 0) - (yy >= ph - 1 || xx >= pw - 1 ? .45 : 0)); put(px, py, c); }
            [[3, 3], [pw - 4, 3], [3, ph - 4], [pw - 4, ph - 4]].forEach(([a, b]) => { put(x + a, y + b, lit(B, .4)); put(x + a + 1, y + b + 1, lit(C, -.3)); });
            if (r() < .5) { const sx = x + 4 + (r() * (pw - 8) | 0); for (let k = 0; k < 6 + r() * 14; k++) put(sx + (k > 8 ? 1 : 0), y + 4 + k, [130, 70, 36], .55 - k * .02); }
            x += pw;
          }
          y += ph;
        }
        break;
      }
      case 'boards': case 'deck': {
        // assi lunghe sfalsate con venature e chiodi
        const vert = th.floor === 'deck', L = vert ? w : h - y0, Wd = vert ? h : w; const bw = vert ? 6 : 5;
        for (let row = 0; row * bw < (vert ? w : h - y0); row++) {
          for (let p = -(r() * 40 | 0); p < (vert ? h : w);) {
            const len = 30 + (r() * 50 | 0), tone = lit(r() < .5 ? A : B, (r() - .5) * .16);
            for (let a = 0; a < len; a++) for (let b = 0; b < bw; b++) {
              const along = p + a, across = row * bw + b; const px = vert ? across : along, py = vert ? along : y0 + across;
              if (px < 0 || px >= w || py < y0 || py >= h) continue;
              const grain = Math.sin(along * .35 + b * 1.7 + row * 3) * .5 + .5; let c = lit(tone, (grain - .5) * .1 + (N(px * 2, py * 2) - .5) * .12);
              if (b === bw - 1 || a === len - 1) c = lit(C, -.25); else if (b === 0) c = lit(c, .08);
              put(px, py, c);
            }
            [2, len - 3].forEach(a => { const along = p + a, across = row * bw + 2; put(vert ? across : along, vert ? along : y0 + across, lit(C, -.35)); });
            if (r() < .25) { const a = p + 6 + (r() * (len - 12) | 0), across = row * bw + 2; put(vert ? across : a, vert ? a : y0 + across, lit(C, -.2)); put(vert ? across + 1 : a + 1, vert ? a + 1 : y0 + across, lit(C, -.15)); }
            p += len;
          }
        }
        break;
      }
      case 'checker': {
        // marmo a lastre grandi (32px), venature e lucentezza
        for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) {
          const cx = Math.floor(x / 32), cy = Math.floor((y - y0) / 32), base = (cx + cy) % 2 ? A : B;
          const vein = Math.abs(Math.sin((x + y * .6) * .08 + N(x, y) * 9)) < .05 ? .22 : 0;
          let c = lit(base, (N(x * 1.5, y * 1.5) - .5) * .2 + vein);
          if (x % 32 === 0 || (y - y0) % 32 === 0) c = lit(C, -.2);
          put(x, y, c);
        }
        break;
      }
      case 'grass': {
        for (let i = 0; i < w * (h - y0) * .05; i++) { const x = r() * w | 0, y = y0 + (r() * (h - y0) | 0); const c = N(x, y) > .55 ? lit(B, .18) : lit(A, -.1); put(x, y, c); put(x, y - 1, lit(c, .1), .7); if (r() < .3) put(x + 1, y - 2, lit(c, .2), .6); }
        for (let i = 0; i < RW * RH * .25; i++) { const x = r() * w | 0, y = y0 + (r() * (h - y0) | 0), cols = [[255, 120, 150], [255, 220, 90], [170, 210, 255], [255, 255, 255]]; put(x, y, cols[r() * 4 | 0]); put(x, y + 1, [40, 100, 50]); }
        break;
      }
      case 'snow': {
        for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) { const n = N(x * .7, y * 1.4); if (n < .4) put(x, y, [150, 170, 210], .35); if (n > .68) put(x, y, [255, 255, 255], .5); }
        for (let i = 0; i < RW * RH * 1.2; i++) put(r() * w | 0, y0 + (r() * (h - y0) | 0), [255, 255, 255]);
        break;
      }
      case 'void': {
        for (let i = 0; i < RW * 1.2; i++) { let x = r() * w, y = y0 + r() * (h - y0); for (let k = 0; k < 30; k++) { put(x | 0, y | 0, k % 4 ? [110, 58, 168] : [200, 140, 255], .8); x += (r() - .5) * 3; y += r() * 1.6; } }
        break;
      }
    }
    // 3. sentieri consumati tra le porte e il centro, sporco ai bordi
    const mx = info.mx * T, my = info.my * T, doors = info.doors;
    const lane = (x, y) => { let best = 99; if (doors.n || doors.s) { const dx = Math.abs(x - mx); if ((doors.n && y < my) || (doors.s && y >= my)) best = Math.min(best, dx); } if (doors.w || doors.e) { const dy = Math.abs(y - my); if ((doors.w && x < mx) || (doors.e && x >= mx)) best = Math.min(best, dy); } best = Math.min(best, Math.hypot(x - mx, y - my) - 18); return best; };
    const wear = th.floor === 'grass' ? [140, 120, 80] : th.floor === 'snow' ? [170, 180, 205] : null;
    for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) {
      const l = lane(x, y) + (N(x * 2, y * 2) - .5) * 14;
      if (l < 13) { const k = (1 - l / 13) * (wear ? .5 : .14); const c = get(x, y); put(x, y, wear ? mix(c, wear, k) : lit(c, k)); }
      const e = Math.min(x - 10, w - 10 - x, y - y0, h - 8 - y); if (e < 14) { const k = (1 - Math.max(0, e) / 14) * .35 * (.6 + N(x * 3, y * 3) * .8); if (BAYER[(y & 3) * 4 + (x & 3)] < k * 1.6) put(x, y, lit(get(x, y), -.25)); }
    }
    g.putImageData(img, 0, y0);
  }

  // ---------------- ombre proiettate ----------------
  const SH = new WeakMap(), SQ = .36, KK = .55;
  function shadowOf(img) {
    let c = SH.get(img); if (c) return c;
    const w = img.width, h = img.height;
    c = document.createElement('canvas'); c.width = w + Math.ceil(h * KK) + 2; c.height = Math.ceil(h * SQ) + 1;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    // la base dello sprite resta ferma, la cima si allunga verso destra e si appiattisce sul pavimento
    g.setTransform(1, 0, -KK, SQ, h * KK, 0); g.drawImage(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#05030a'; g.fillRect(0, 0, c.width, c.height);
    SH.set(img, c); return c;
  }
  // ombra di uno sprite disegnato con l'angolo in alto a sinistra in (sx, sy); 'lift' = righe vuote sotto i piedi
  function shadowAt(b, img, sx, sy, alpha = .32, lift = 0, flip = false) {
    const c = shadowOf(img), h = img.height; b.globalAlpha = alpha;
    const by = Math.round(sy + h - lift - c.height + 1);
    if (flip) { b.save(); b.translate(sx + img.width, 0); b.scale(-1, 1); b.drawImage(c, 0, by); b.restore(); } else b.drawImage(c, Math.round(sx), by);
    b.globalAlpha = 1;
  }

  // ---------------- volume: luce dall'alto e bordo luminoso su ogni sprite ----------------
  const VOL = new WeakMap();
  function volume(img, k = 1) {
    let c = VOL.get(img); if (c) return c;
    const w = img.width, h = img.height; c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, w, h), a = D.data, src = new Uint8ClampedArray(a);
    let top = h, bot = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (src[(y * w + x) * 4 + 3] > 40) { if (y < top) top = y; if (y > bot) bot = y; }
    const isOut = i => src[i + 3] < 40 || (src[i] < 34 && src[i + 1] < 28 && src[i + 2] < 40);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (src[i + 3] < 40 || isOut(i)) continue;
      const v = (y - top) / Math.max(1, bot - top); let f = (.16 - v * .34) * k;
      const up = y > 0 ? (y - 1) * w * 4 + x * 4 : -1, lf = x > 0 ? i - 4 : -1;
      if (up < 0 || isOut(up)) f += .22 * k; else if (lf < 0 || isOut(lf)) f += .1 * k;
      const rt = x < w - 1 ? i + 4 : -1, dn = y < h - 1 ? i + w * 4 : -1;
      if ((rt > 0 && isOut(rt)) || (dn > 0 && isOut(dn))) f -= .12 * k;
      for (let ch = 0; ch < 3; ch++) a[i + ch] = f > 0 ? a[i + ch] + (255 - a[i + ch]) * f * .8 : a[i + ch] * (1 + f);
    }
    g.putImageData(D, 0, 0); VOL.set(img, c); return c;
  }
  // muro: sfumatura verticale, rumore e zoccolo
  function wallPass(g, w, th, r) {
    const gr = g.createLinearGradient(0, 3, 0, 32); gr.addColorStop(0, 'rgba(255,240,220,.10)'); gr.addColorStop(.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.38)');
    g.fillStyle = gr; g.fillRect(0, 3, w, 29);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 29, w, 3); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 28, w, 1);
    for (let i = 0; i < w * .8; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.05)'; g.fillRect(r() * w | 0, 4 + r() * 24 | 0, 1 + (r() * 2 | 0), 1); }
    // trave superiore con luce
    g.fillStyle = 'rgba(255,240,210,.18)'; g.fillRect(0, 3, w, 1);
  }

  // ---------------- post-processing in alta risoluzione ----------------
  const LC = document.createElement('canvas'), lg = LC.getContext('2d');
  let bokeh = [];
  function lights(ctx, LV, lights, t, th) {
    const { s, ox, oy } = LV, bw = LV.RW * T, bh = LV.RH * T, q = 2;
    if (LC.width !== bw * q || LC.height !== bh * q) { LC.width = bw * q; LC.height = bh * q; }
    const [ar, ag, ab] = th.amb;
    lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, LC.width, LC.height);
    lg.fillStyle = `rgba(${ar},${ag},${ab},${Math.min(.82, .2 + th.dark * 1.35)})`; lg.fillRect(0, 0, LC.width, LC.height);
    lg.globalCompositeOperation = 'destination-out';
    lights.forEach(L => { const R = L.r * q * 1.3, x = L.x * q, y = L.y * q; lg.save(); lg.translate(x, y); lg.scale(1, .78); lg.translate(-x, -y); const gr = lg.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.35, 'rgba(0,0,0,.8)'); gr.addColorStop(.7, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.fillRect(x - R, y - R, R * 2, R * 2); lg.restore(); });
    ctx.imageSmoothingEnabled = true; ctx.drawImage(LC, ox, oy, bw * s, bh * s);
    // bagliori additivi
    ctx.globalCompositeOperation = 'lighter';
    lights.forEach(L => {
      if (!L.col) return; const x = ox + L.x * s, y = oy + L.y * s, [r1, g1, b1] = hex(L.col);
      const R = L.r * s * 1.05; ctx.save(); ctx.translate(x, y); ctx.scale(1, .8); ctx.translate(-x, -y); const gr = ctx.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(${r1},${g1},${b1},.42)`); gr.addColorStop(.3, `rgba(${r1},${g1},${b1},.17)`); gr.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
      ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, R * 2, R * 2); ctx.restore();
      if (L.core !== false && L.r <= 64) { const Rc = 7 * s * (1 + Math.sin(t * 6 + L.x) * .06), gc = ctx.createRadialGradient(x, y, 0, x, y, Rc); gc.addColorStop(0, `rgba(255,250,235,.55)`); gc.addColorStop(.4, `rgba(${r1},${g1},${b1},.25)`); gc.addColorStop(1, `rgba(${r1},${g1},${b1},0)`); ctx.fillStyle = gc; ctx.fillRect(x - Rc, y - Rc, Rc * 2, Rc * 2); }
    });
    ctx.globalCompositeOperation = 'source-over';
  }
  function rays(ctx, LV, wins, t) {
    if (!wins.length) return; const { s, ox, oy } = LV;
    ctx.globalCompositeOperation = 'lighter';
    wins.forEach((W0, i) => {
      const x = ox + W0.x * s, y = oy + W0.y * s, len = (LV.RH - 3) * T * s * .7, sk = len * .45, wd = W0.w * s, a = .05 + .025 * Math.sin(t * .7 + i * 1.7);
      const gr = ctx.createLinearGradient(x, y, x + sk, y + len); const [r1, g1, b1] = hex(W0.col); gr.addColorStop(0, `rgba(${r1},${g1},${b1},${a * 2})`); gr.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + wd, y); ctx.lineTo(x + wd * 2.2 + sk, y + len); ctx.lineTo(x - wd * .2 + sk, y + len); ctx.closePath(); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }
  function grade(ctx, LV, th, t, dt) {
    const { W, H, ox, oy, s } = LV, bw = LV.RW * T * s, bh = LV.RH * T * s;
    // correzione colore: ombre fredde in alto, calde in basso
    const [ar, ag, ab] = th.amb, [cr, cg, cb] = hex(th.acc);
    ctx.globalCompositeOperation = 'soft-light';
    const gr = ctx.createLinearGradient(0, oy, 0, oy + bh); gr.addColorStop(0, `rgba(${ar * 3},${ag * 3},${ab * 3 + 20},.3)`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},.35)`);
    ctx.fillStyle = gr; ctx.fillRect(ox, oy, bw, bh);
    ctx.globalCompositeOperation = 'source-over';
    // vignettatura
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) * .62, vg = ctx.createRadialGradient(cx, cy, R * .45, cx, cy, R);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // bokeh in primo piano (fuori fuoco)
    if (bokeh.length !== 7) bokeh = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, r: 14 + Math.random() * 30, v: Math.random() * 2 * Math.PI, sp: 4 + Math.random() * 8 }));
    ctx.globalCompositeOperation = 'lighter';
    bokeh.forEach(p => { p.v += dt * .3; p.x += Math.cos(p.v) * p.sp * dt; p.y -= p.sp * .5 * dt; if (p.y < -p.r) { p.y = H + p.r; p.x = Math.random() * W; } const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(${cr},${cg},${cb},.07)`); g.addColorStop(.7, `rgba(${cr},${cg},${cb},.04)`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); });
    ctx.globalCompositeOperation = 'source-over';
  }
  // profondità di campo: leggera sfocatura sulla fascia del muro in alto e sul bordo in basso
  const HAS_FILTER = (() => { try { const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(1px)'; return c.filter === 'blur(1px)'; } catch (e) { return false; } })();
  function depth(ctx, LV, buf) {
    if (!HAS_FILTER) return; const { s, ox, oy } = LV, bw = buf.width * s, bh = buf.height * s;
    ctx.save(); ctx.filter = `blur(${Math.max(1, s * .6)}px)`; ctx.imageSmoothingEnabled = false;
    const top = 1.4 * T * s, bot = .7 * T * s;
    ctx.beginPath(); ctx.rect(ox, oy, bw, top); ctx.rect(ox, oy + bh - bot, bw, bot); ctx.clip();
    ctx.globalAlpha = .75; ctx.drawImage(buf, ox, oy, bw, bh); ctx.restore();
  }
  return { paintFloor, volume, wallPass, shadowOf, shadowAt, lights, rays, grade, depth };
})();

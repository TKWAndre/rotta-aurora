// ROTTA D'AURORA — engine
'use strict';
const G = (() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clone = o => JSON.parse(JSON.stringify(o));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- data registries ----------
  const CH = {}, SCENES = {}, ENEMIES = {}, BATTLES = {}, LORE = {}, NPCS = {};
  const ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];
  function chapter(c) {
    CH[c.id] = c; Object.assign(SCENES, c.scenes || {}); Object.assign(ENEMIES, c.enemies || {});
    Object.assign(BATTLES, c.battles || {}); Object.assign(NPCS, c.npcs || {});
    for (const [k, v] of Object.entries(c.lore || {})) LORE[k] = Object.assign({ ch: c.num }, v);
  }
  const NAMES = { mira: 'Mira', kai: 'Kai', otto: 'Otto', bram: 'Bram', nuvola: 'Nuvola', sable: 'Sable', malachar: 'Ammiraglio Malachar', vedova: 'La Vedova di Vetro', raiden: 'Shōgun Raiden', revuoto: 'Il Re Vuoto', elise: 'Nonna Élise', grinza: 'Capitano Grinza', pip: 'Pip', hanzo: 'Hanzō', guard: 'Guardia', soldier: "Soldato dell'Armata", monk: 'Corista', merchant: 'Mercante', villager: 'Abitante', child: 'Bambino', elder: 'Anziano', voice: 'Voce' };
  const ENDINGS = {
    alba_di_tutti: "L'Alba di Tutti", prezzo_luce: 'Il Prezzo della Luce', ronin_cartografa: 'Il Rōnin e la Cartografa',
    corona_ferro: 'Corona di Ferro', regina_notte: 'La Regina della Notte', tradimento: "Il Furto dell'Alba", notte_eterna: 'La Notte Eterna'
  };
  const ITEMS = {
    tonico: { name: 'Tonico', desc: 'Cura il 50% della salute di un alleato.', price: 30, t: 'ally' },
    etere: { name: 'Etere', desc: "Ripristina il 50% dell'Etere di un alleato.", price: 50, t: 'ally' },
    fenice: { name: 'Piuma di Fenice', desc: 'Rianima un alleato al 50%.', price: 120, t: 'ko' },
    bomba: { name: 'Bomba a Mano', desc: 'Danni a tutti i nemici.', price: 70, t: 'enemies' },
    te: { name: 'Tè di Akatsuki', desc: 'Cura il 35% a tutto il gruppo e rimuove gli stati.', price: 100, t: 'party' },
  };
  const ALLY = {
    mira: { b: [62, 30, 9, 6, 12, 10], g: [12, 4, 2.2, 1.6, 2.8, 1.2] },
    kai: { b: [72, 20, 13, 7, 5, 13], g: [14, 3, 3, 1.8, 1, 1.5] },
    otto: { b: [66, 26, 10, 8, 10, 9], g: [13, 3.5, 2.4, 2, 2.4, 1] },
    bram: { b: [110, 16, 11, 12, 6, 5], g: [22, 2, 2.5, 2.8, 1.2, .6] },
    nuvola: { b: [52, 40, 6, 5, 15, 11], g: [10, 5, 1.2, 1.3, 3.3, 1.3] },
    sable: { b: [60, 22, 12, 6, 6, 16], g: [12, 3, 2.7, 1.5, 1.2, 1.8] },
  };
  // skills: t = enemy|enemies|ally|allies|self|ko ; lv = unlock level
  const SKILLS = {
    mira: [
      { id: 'lampo', n: 'Lampo di Lanterna', mp: 6, t: 'enemy', lv: 1, d: 'Luce magica, può accecare.', fx: { mag: 1.4, blind: .4 } },
      { id: 'cura', n: "Cura d'Etere", mp: 7, t: 'ally', lv: 1, d: 'Cura un alleato.', fx: { heal: 2.4 } },
      { id: 'mappa', n: 'Mappa Stellare', mp: 10, t: 'allies', lv: 5, d: 'Attacco +30% al gruppo (3 turni).', fx: { buff: 'atk' } },
      { id: 'alba', n: 'Alba Interiore', mp: 18, t: 'enemies', lv: 12, d: 'Luce su tutti i nemici.', fx: { mag: 1.6 } },
    ],
    kai: [
      { id: 'iai', n: 'Fendente Iai', mp: 5, t: 'enemy', lv: 1, d: 'Colpo rapido, critico 45%.', fx: { atk: 1.6, crit: .45 } },
      { id: 'danza', n: 'Danza delle Lame', mp: 9, t: 'rand3', lv: 5, d: '3 colpi su nemici casuali.', fx: { atk: .85 } },
      { id: 'vento', n: 'Postura del Vento', mp: 6, t: 'self', lv: 8, d: 'Contrattacca e schiva (2 turni).', fx: { counter: 1 } },
      { id: 'taglio', n: "Taglio dell'Alba", mp: 16, t: 'enemy', lv: 14, d: 'Colpo devastante.', fx: { atk: 3.1 } },
    ],
    otto: [
      { id: 'chiave', n: 'Chiave Esplosiva', mp: 6, t: 'enemies', lv: 1, d: 'Esplosione su tutti i nemici.', fx: { atk: .8 } },
      { id: 'ripara', n: 'Riparazione Rapida', mp: 6, t: 'ally', lv: 1, d: 'Cura un alleato.', fx: { heal: 2 } },
      { id: 'torretta', n: 'Torretta Brasse', mp: 10, t: 'self', lv: 6, d: 'Spara ogni turno (3 turni).', fx: { turret: 1 } },
      { id: 'cannone', n: 'Cannone Brasse', mp: 16, t: 'enemy', lv: 13, d: 'Colpo di cannone enorme.', fx: { mag: 3 } },
    ],
    bram: [
      { id: 'scudo', n: 'Scudo di Pietra', mp: 4, t: 'ally', lv: 1, d: 'Protegge un alleato (2 turni).', fx: { protect: 1 } },
      { id: 'pugno', n: 'Pugno Antico', mp: 5, t: 'enemy', lv: 1, d: 'Può stordire.', fx: { atk: 1.5, stun: .3 } },
      { id: 'ricordo', n: "Ricordo dell'Alba", mp: 12, t: 'allies', lv: 7, d: 'Cura tutto il gruppo.', fx: { heal: 1.4 } },
      { id: 'sentinella', n: 'Sentinella', mp: 10, t: 'allies', lv: 12, d: 'Difesa +50% al gruppo (3 turni).', fx: { buff: 'def' } },
    ],
    nuvola: [
      { id: 'pioggia', n: 'Pioggia di Stelle', mp: 8, t: 'enemies', lv: 1, d: 'Stelle su tutti i nemici.', fx: { mag: 1 } },
      { id: 'bruma', n: 'Bruma', mp: 6, t: 'allies', lv: 1, d: 'Il gruppo schiva (2 turni).', fx: { buff: 'evade' } },
      { id: 'canto', n: 'Canto della Nube', mp: 14, t: 'ko', lv: 6, d: 'Rianima un alleato.', fx: { revive: .5 } },
      { id: 'frammento', n: "Frammento d'Aurora", mp: 20, t: 'enemy', lv: 12, d: 'Luce pura.', fx: { mag: 3.3 } },
    ],
    sable: [
      { id: 'veleno', n: 'Pugnale Avvelenato', mp: 5, t: 'enemy', lv: 1, d: 'Danno + veleno.', fx: { atk: 1.1, poison: 1 } },
      { id: 'furto', n: 'Furto', mp: 3, t: 'enemy', lv: 1, d: 'Ruba Lumen o oggetti.', fx: { atk: .7, steal: 1 } },
      { id: 'ombra', n: 'Ombra', mp: 6, t: 'self', lv: 5, d: 'Schiva; prossimo colpo critico.', fx: { shadow: 1 } },
      { id: 'esecuzione', n: 'Esecuzione', mp: 14, t: 'enemy', lv: 12, d: 'x2, x4 se il nemico è sotto il 30%.', fx: { atk: 2, exec: 1 } },
    ],
  };
  const ROLE = { brute: { hp: 1.15, atk: 1.1 }, fast: { hp: .8, spd: 1.5, atk: .92 }, caster: { hp: .85, mag: 1.25, def: .8 }, tank: { hp: 1.5, def: 1.5, atk: .85 }, boss: { hp: 6.5, atk: 1.15, def: 1.2, spd: 1.1, mag: 1.15 } };

  // ---------- persistent state ----------
  const LS = { get(k, d) { try { const v = localStorage.getItem('ra_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('ra_' + k, JSON.stringify(v)); } catch (e) { } } };
  const P = { read: LS.get('read', {}), endings: LS.get('endings', {}), set: Object.assign({ speed: 28, music: .55, sfx: .8, auto: 1 }, LS.get('settings', {})) };
  const saveP = () => { LS.set('read', P.read); LS.set('endings', P.endings); LS.set('settings', P.set); };
  let S = null;
  function fresh() { return { ch: 'c1', flags: {}, aff: {}, party: ['mira'], active: ['mira'], met: { mira: 1 }, lv: 1, xp: 0, hp: {}, mp: {}, items: { tonico: 3, etere: 1 }, money: 60, done: {}, lore: {}, scene: null, node: null, bg: 'black', time: 0, diff: 'normal', ng: 0, snap: null }; }

  // ---------- expression eval ----------
  const zp = obj => new Proxy(obj, { get: (o, k) => (k in o ? o[k] : 0) });
  function cond(expr) {
    if (expr == null || expr === '') return true;
    try { return !!new Function('f', 'a', 'has', 'lv', 'return (' + expr + ')')(zp(S.flags), zp(S.aff), id => S.party.includes(id), S.lv); }
    catch (e) { console.warn('expr', expr, e); return false; }
  }

  // ---------- canvas & render loop ----------
  const cv = $('cv'), ctx = cv.getContext('2d');
  let W = 390, H = 844, DPR = 1;
  const R = { bg: null, bgPrev: null, bgFade: 0, portrait: null, pAlpha: 0, mode: 'title', shake: 0, flash: 0, flashCol: '#fff', fade: 0, fadeTarget: 0, enemies: [], pops: [], map: null, t: 0 };
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (R.bg) R.bg = ART.prepare(R.bg.id, W, H, DPR);
    R.bgPrev = null;
    if (R.mode === 'map' && S) { ROOMS.build(CH[S.ch], W, H); ROOMS.placeAt(S.mapAt); renderMapNodes(); }
    if (B) { layoutEnemies(); B.enemies.forEach((e, i) => { const d = $('eb' + i); if (d) { d.style.left = e.x + 'px'; d.style.top = barTop(e) + 'px'; } }); }
  }
  function setBg(id) {
    if (R.bg && R.bg.id === id) return;
    R.bgPrev = R.bg; R.bgFade = 1; R.bg = ART.prepare(id, W, H, DPR); if (S) S.bg = id;
  }
  // retro pass: downsample the painted frame, posterize with ordered dithering, upscale with hard pixels
  const PXC = document.createElement('canvas'), PXG = PXC.getContext('2d', { willReadFrequently: true });
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v / 16 - .5));
  function pixelate() {
    const k = Math.max(3, Math.round(Math.min(W, H) / 130)), pw = Math.ceil(W / k), ph = Math.ceil(H / k);
    if (PXC.width !== pw || PXC.height !== ph) { PXC.width = pw; PXC.height = ph; }
    PXG.imageSmoothingEnabled = true; PXG.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, pw, ph);
    const d = PXG.getImageData(0, 0, pw, ph), a = d.data, st = 255 / (R.mode === 'cine' ? 14 : 10);
    for (let y = 0, i = 0; y < ph; y++) for (let x = 0; x < pw; x++, i += 4) { const b = BAYER[(y & 3) * 4 + (x & 3)] * st * (R.mode === 'cine' ? 0 : .4); a[i] = Math.round((a[i] + b) / st) * st; a[i + 1] = Math.round((a[i + 1] + b) / st) * st; a[i + 2] = Math.round((a[i + 2] + b) / st) * st; }
    PXG.putImageData(d, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(PXC, 0, 0, pw * k * DPR, ph * k * DPR); ctx.restore();
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; R.t += dt; if (S && R.mode !== 'title') S.time += dt;
    ctx.save();
    if (R.shake > 0) { ctx.translate(rnd(-1, 1) * R.shake * 10, rnd(-1, 1) * R.shake * 10); R.shake = Math.max(0, R.shake - dt * 2.5); }
    if (R.bg) ART.drawBg(ctx, R.bg, R.t, dt);
    else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    if (R.bgPrev && R.bgFade > 0) { ctx.globalAlpha = R.bgFade; ART.drawBg(ctx, R.bgPrev, R.t, 0); ctx.globalAlpha = 1; R.bgFade -= dt * 1.6; if (R.bgFade <= 0) R.bgPrev = null; }
    if (R.mode === 'map' && R.map) drawMap(dt);
    if (R.mode === 'world') WORLD.drawWorldMap(ctx, R.t, W, H);
    if (R.mode === 'cine') drawCine(dt);
    if (R.mode === 'battle') drawBattle(dt);
    // portrait
    if (R.mode === 'scene') {
      const p = R.portrait; const target = p ? 1 : 0; R.pAlpha += (target - R.pAlpha) * Math.min(1, dt * 8);
      if (R.pShown && R.pAlpha > .01) { const land = W > H; const sc = land ? H * .98 / 380 : Math.min(W / 300 * .95, H * .62 / 380); ART.drawPortrait(ctx, R.pShown.id, R.pShown.mood, land ? Math.max(W * .18, sc * 150 + 10) : W / 2, (land ? H + 30 : H - 150) + (1 - R.pAlpha) * 20, sc, R.t, R.pAlpha, NPCS[R.pShown.id]); }
      if (p) R.pShown = p;
    }
    if (R.mode !== 'map' && R.mode !== 'battle') pixelate();
    // popups
    for (let i = R.pops.length - 1; i >= 0; i--) { const p = R.pops[i]; p.t += dt; const a = 1 - p.t / 1.2; if (a <= 0) { R.pops.splice(i, 1); continue; } ctx.globalAlpha = a; ctx.font = `bold ${p.big ? 30 : 22}px Georgia`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; const y = p.y - p.t * 40; ctx.strokeText(p.txt, p.x, y); ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, y); ctx.globalAlpha = 1; }
    ctx.restore();
    if (R.flash > 0) { ctx.fillStyle = R.flashCol; ctx.globalAlpha = R.flash; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; R.flash = Math.max(0, R.flash - dt * 2.5); }
    R.fade += (R.fadeTarget - R.fade) * Math.min(1, dt * 4);
    if (R.fade > .005) { ctx.fillStyle = `rgba(0,0,0,${R.fade})`; ctx.fillRect(0, 0, W, H); }
    requestAnimationFrame(frame);
  }
  const pop = (x, y, txt, col = '#fff', big) => R.pops.push({ x, y, txt: String(txt), col, t: 0, big });

  // ---------- UI helpers ----------
  const show = (id, on = true) => $(id).classList.toggle('hidden', !on);
  function toast(html) { const t = el('div', 'toast', html); $('toasts').appendChild(t); setTimeout(() => t.remove(), 2700); }
  function overlay(html) { const o = $('ovl'); o.innerHTML = ''; if (html == null) return null; const d = el('div', 'ov', html); o.appendChild(d); return d; }
  function closeOverlay() { $('ovl').innerHTML = ''; }
  function ask(text) { return new Promise(res => { const box = el('div', 'ov', `<div style="margin-top:30vh"><div class="card" style="text-align:center;font-size:17px">${text}</div><button class="btn" id="askY">Sì</button><button class="btn small" id="askN">No</button></div>`); box.style.zIndex = 50; $('ovl').appendChild(box); box.querySelector('#askY').onclick = () => { box.remove(); res(true); }; box.querySelector('#askN').onclick = () => { box.remove(); res(false); }; }); }
  function setTop() { const on = R.mode === 'map' || R.mode === 'scene'; show('menuBtn', on); }

  // ---------- party stats ----------
  function stats(id, lv = S.lv) { const a = ALLY[id]; const k = ['hp', 'mp', 'atk', 'def', 'mag', 'spd']; const o = {}; k.forEach((n, i) => o[n] = Math.round(a.b[i] + a.g[i] * (lv - 1))); return o; }
  function fullHeal(id) { const s = stats(id); S.hp[id] = s.hp; S.mp[id] = s.mp; }
  function healAll() { S.party.forEach(fullHeal); }
  const xpNeed = lv => 25 * lv + 5 * lv * lv;
  function gainXp(n) {
    S.xp += n; let up = false;
    while (S.xp >= xpNeed(S.lv) && S.lv < 40) {
      S.xp -= xpNeed(S.lv); const before = {}; S.party.forEach(id => before[id] = stats(id)); S.lv++; up = true;
      S.party.forEach(id => { const s = stats(id); S.hp[id] = Math.min(s.hp, (S.hp[id] ?? s.hp) + (s.hp - before[id].hp)); S.mp[id] = Math.min(s.mp, (S.mp[id] ?? s.mp) + (s.mp - before[id].mp)); });
      S.party.forEach(id => SKILLS[id].forEach(sk => { if (sk.lv === S.lv) toast(`✦ ${NAMES[id]} impara <b>${sk.n}</b>`); }));
    }
    return up;
  }

  // ---------- save / load ----------
  function snapshot() { return clone(S.snap || S); }
  function autosave() { if (!S) return; const data = S.scene ? clone(S.snap) : clone(S); data.savedAt = Date.now(); LS.set('save_auto', data); saveP(); }
  function saveSlot(n) { const data = S.scene ? clone(S.snap) : clone(S); data.savedAt = Date.now(); LS.set('save_' + n, data); toast('Partita salvata'); }
  function describeSave(d) { if (!d) return '<i>vuoto</i>'; const c = CH[d.ch]; const dt = new Date(d.savedAt || 0); const h = Math.floor(d.time / 3600), m = Math.floor(d.time / 60) % 60; return `<b>Cap. ${c ? c.num : '?'} — ${c ? c.title : ''}</b><br><small>Liv. ${d.lv} · ${h}h ${m}m · ${dt.toLocaleDateString('it-IT')} ${dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</small>`; }
  async function loadState(d) {
    S = clone(d); closeOverlay(); if (S.bg) setBg(S.bg);
    if (S.scene) runScene(S.scene, S.node); else openMap();
  }

  // ---------- dialogue ----------
  let tapResolve = null, typing = false, typeDone = null, autoOn = false, skipOn = false, typeTimer = null;
  function cancelDialog() { clearTimeout(typeTimer); typing = false; typeDone = null; tapResolve = null; show('tb', false); $('ch').innerHTML = ''; R.portrait = null; }
  const LOG = [];
  function onTap() { if (typing) { typeDone && typeDone(); return; } if (tapResolve) { const r = tapResolve; tapResolve = null; AUDIO.sfx('tick'); r(); } }
  $('tb').addEventListener('click', e => { if (e.target.closest('#tbb')) return; onTap(); });
  $('bAuto').onclick = e => { e.stopPropagation(); autoOn = !autoOn; skipOn = false; updTB(); if (autoOn && tapResolve && !typing) onTap(); };
  $('bSkip').onclick = e => { e.stopPropagation(); skipOn = !skipOn; autoOn = false; updTB(); if (skipOn && tapResolve && !typing) onTap(); };
  $('bLog').onclick = e => { e.stopPropagation(); const o = overlay(`<h1>Registro</h1>${LOG.slice(-60).map(l => `<div class="card">${l.n ? `<b>${l.n}</b><br>` : ''}${l.t}</div>`).join('')}<button class="btn" id="lgx">Chiudi</button>`); o.scrollTop = 1e9; $('lgx').onclick = closeOverlay; };
  function updTB() { $('bAuto').classList.toggle('on', autoOn); $('bSkip').classList.toggle('on', skipOn); }
  const PARSE = /^@(\w+)(?::(\w+))?(?:\[([^\]]*)\])?\s+([\s\S]*)$/;
  async function say(raw, key) {
    let who = null, mood = 'neutral', nm = null, text = raw;
    const m = raw.match(PARSE); if (m) { who = m[1]; mood = m[2] || 'neutral'; nm = m[3] ?? (NPCS[who] ? NPCS[who].name : NAMES[who] || who); text = m[4]; }
    const wasRead = !!P.read[key]; P.read[key] = 1;
    if (skipOn && !wasRead) { skipOn = false; updTB(); }
    show('tb'); const nmEl = $('nm'), tx = $('tx');
    if (who) { nmEl.textContent = nm; nmEl.style.color = (ART.LOOK[who] || ART.LOOK[NPCS[who]?.base] || {}).rim || '#fff'; if (NPCS[who]?.color) nmEl.style.color = NPCS[who].color; show('nm'); } else show('nm', false);
    tx.classList.toggle('narr', !who);
    R.portrait = who && who !== 'voice' ? { id: who, mood } : null;
    if (!R.portrait) R.pShown = R.pShown; // fade out
    LOG.push({ n: who ? nm : '', t: text }); if (LOG.length > 200) LOG.shift();
    $('adv').style.visibility = 'hidden';
    // typewriter
    if (skipOn) { tx.textContent = text; }
    else {
      typing = true; tx.textContent = '';
      await new Promise(res => {
        let i = 0; const sp = P.set.speed; let tm;
        typeDone = () => { clearTimeout(tm); tx.textContent = text; res(); };
        const stepT = () => { if (i >= text.length) return res(); const n = sp >= 60 ? 3 : 1; i = Math.min(text.length, i + n); tx.textContent = text.slice(0, i); if (who && i % 2 === 0) AUDIO.blip(who); const c = text[i - 1]; typeTimer = tm = setTimeout(stepT, sp >= 60 ? 8 : (/[.!?…]/.test(c) ? 1000 / sp * 6 : /[,;:]/.test(c) ? 1000 / sp * 3 : 1000 / sp)); };
        stepT();
      });
      typing = false; typeDone = null;
    }
    $('adv').style.visibility = 'visible';
    await new Promise(res => {
      tapResolve = res;
      if (skipOn) setTimeout(() => tapResolve === res && onTap(), 45);
      else if (autoOn) setTimeout(() => tapResolve === res && autoOn && onTap(), 900 + text.length * 32 / P.set.auto);
    });
  }
  async function choose(opts, key) {
    skipOn = false; updTB();
    const vis = opts.map((o, i) => ({ o, i })).filter(x => cond(x.o.if));
    const box = $('ch'); box.innerHTML = '';
    if (!vis.length) return -1;
    return new Promise(res => {
      vis.forEach(({ o, i }, k) => {
        const b = el('button', '', o.t + (o.if ? `<span class="req">✦ scelta sbloccata</span>` : ''));
        b.style.animationDelay = (k * .07) + 's';
        b.onclick = () => { AUDIO.sfx('choice'); box.innerHTML = ''; LOG.push({ n: '➤', t: o.t }); res(i); };
        box.appendChild(b);
      });
    });
  }
  async function titleCard(t, sub, top) {
    const o = $('ovl'); o.innerHTML = ''; const d = el('div', '', ''); d.id = 'card'; d.innerHTML = `${top ? `<h4>${top}</h4>` : ''}<h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}`; o.appendChild(d);
    AUDIO.sfx('chime');
    await new Promise(r => { let done = false; const fin = () => { if (done) return; done = true; r(); }; setTimeout(() => d.onclick = fin, 600); setTimeout(fin, skipOn ? 600 : 3800); });
    d.style.transition = 'opacity .5s'; d.style.opacity = 0; await wait(500); o.innerHTML = '';
  }

  // ---------- scene interpreter ----------
  let runId = 0;
  async function runScene(id, node) {
    cancelDialog(); const my = ++runId;
    const steps = SCENES[id];
    if (!steps) { console.error('scena mancante', id); toast('Scena mancante: ' + id); return openMap(); }
    R.mode = 'scene'; setTop(); show('map', false); $('map').innerHTML = ''; $('mapHead').innerHTML = ''; $('bt').innerHTML = '';
    S.scene = id; S.node = node; S.snap = null; S.snap = clone(S); autosave();
    let res;
    try { res = await exec(steps, id, ''); } catch (e) { if (e === 'abort') return; throw e; }
    if (my !== runId) return;
    R.portrait = null; show('tb', false); $('ch').innerHTML = '';
    if (res && res.go) return runScene(res.go, node);
    if (res && res.next) return startChapter(res.next);
    if (res && res.ending) return showEnding(res.ending);
    if (node) S.done[S.ch + ':' + node] = 1;
    openMap(node);
  }
  async function exec(steps, sid, path) {
    const my = runId;
    for (let i = 0; i < steps.length; i++) {
      if (my !== runId) throw 'abort';
      const s = steps[i], key = sid + ':' + path + i;
      if (typeof s === 'string') { await say(s, key); continue; }
      if (s.bg) { setBg(s.bg); if (!s.choice) await wait(skipOn ? 50 : 350); }
      if ('music' in s) AUDIO.play(s.music);
      if (s.sfx) AUDIO.sfx(s.sfx);
      if (s.fx) await doFx(s.fx);
      if (s.wait) await wait(skipOn ? 0 : s.wait);
      if (s.cine) { R.portrait = null; show('tb', false); await playCine(s.cine); R.mode = 'scene'; }
      if (s.title) { R.portrait = null; show('tb', false); await titleCard(s.title, s.sub); }
      if (s.set) Object.assign(S.flags, s.set);
      if (s.add) for (const [k, v] of Object.entries(s.add)) { S.flags[k] = (S.flags[k] || 0) + v; if (k === 'dark' && v > 0) { AUDIO.sfx('dark'); toast('<span style="color:#c08aff">◆ L\'oscurità cresce in te</span>'); } }
      if (s.aff) applyAff(s.aff);
      if (s.join) { if (!S.party.includes(s.join)) { S.party.push(s.join); S.met[s.join] = 1; fullHeal(s.join); if (S.active.length < 4) S.active.push(s.join); toast(`✦ <b>${NAMES[s.join]}</b> si unisce al gruppo`); AUDIO.sfx('levelup'); } }
      if (s.leave) { S.party = S.party.filter(x => x !== s.leave); S.active = S.active.filter(x => x !== s.leave); fillActive(); toast(`<b>${NAMES[s.leave]}</b> lascia il gruppo`); }
      if (s.item) { S.items[s.item] = (S.items[s.item] || 0) + (s.n || 1); toast(`Ottenuto: <b>${ITEMS[s.item].name}</b> ×${s.n || 1}`); AUDIO.sfx('chime'); }
      if (s.money) { S.money = Math.max(0, S.money + s.money); toast(s.money > 0 ? `+${s.money} Lumen` : `${s.money} Lumen`); }
      if (s.lore) { if (!S.lore[s.lore]) { S.lore[s.lore] = 1; toast(`📜 Codex: <b>${LORE[s.lore]?.title || s.lore}</b>`); AUDIO.sfx('chime'); } }
      if (s.heal) healAll();
      if (s.battle) {
        show('tb', false); R.portrait = null;
        const r = await battle(s.battle, !!s.lose);
        R.mode = 'scene'; setTop(); $('bt').innerHTML = '';
        if (r === 'lose' && s.lose) return { go: s.lose };
      }
      if (s.choice) {
        const idx = await choose(s.choice, key); const o = s.choice[idx];
        if (!o) continue; // nessuna opzione disponibile: prosegui invece di bloccarti
        if (o.set) Object.assign(S.flags, o.set);
        if (o.add) for (const [k, v] of Object.entries(o.add)) { S.flags[k] = (S.flags[k] || 0) + v; if (k === 'dark' && v > 0) { AUDIO.sfx('dark'); toast('<span style="color:#c08aff">◆ L\'oscurità cresce in te</span>'); } }
        if (o.aff) applyAff(o.aff);
        if (o.then) { const r = await exec(o.then, sid, path + i + 'c' + idx + '.'); if (r) return r; }
        if (o.go) return { go: o.go };
      }
      if (s.if != null && !s.choice) {
        const br = cond(s.if) ? s.then : s.else;
        if (br) { const r = await exec(br, sid, path + i + (cond(s.if) ? 't' : 'e') + '.'); if (r) return r; }
      }
      if (s.go) return { go: s.go };
      if (s.map) return { map: true };
      if (s.next) return { next: s.next };
      if (s.ending) return { ending: s.ending };
    }
    return null;
  }
  function applyAff(o) { for (const [k, v] of Object.entries(o)) { S.aff[k] = (S.aff[k] || 0) + v; if (v > 0) { toast(`<span style="color:#ff8aa8">♥ ${NAMES[k]} apprezza</span>`); AUDIO.sfx('love'); } else if (v < 0) toast(`<span style="color:#9aa">♡ ${NAMES[k]} non approva</span>`); } }
  function fillActive() { S.party.forEach(id => { if (S.active.length < 4 && !S.active.includes(id)) S.active.push(id); }); if (!S.active.includes('mira')) S.active.unshift('mira'); }
  async function doFx(f) {
    switch (f) {
      case 'shake': R.shake = 1; AUDIO.sfx('hit'); break;
      case 'flash': R.flash = .9; R.flashCol = '#fff'; AUDIO.sfx('flash'); break;
      case 'redflash': R.flash = .8; R.flashCol = '#ff2a2a'; break;
      case 'fadeout': R.fadeTarget = 1; show('tb', false); R.portrait = null; await wait(skipOn ? 100 : 900); break;
      case 'fadein': R.fadeTarget = 0; await wait(skipOn ? 100 : 700); break;
    }
  }

  // ---------- cinematics ----------
  const CINE = {};
  function cine(id, shots) { CINE[id] = shots; }
  const IMG = {};
  function img(name) { if (!IMG[name]) { const im = new Image(); im.src = 'cine/' + name + '.jpg'; IMG[name] = im; } return IMG[name]; }
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  let CS = null;
  function playCine(id) {
    const shots = (CINE[id] || []).filter(s => cond(s.if));
    if (!shots.length) return Promise.resolve();
    shots.forEach(s => s.img && img(s.img));
    return new Promise(res => {
      const prevMode = R.mode; R.mode = 'cine'; setTop(); show('tb', false); R.portrait = null; R.pShown = null;
      const o = $('ovl'); o.innerHTML = '';
      const ui = el('div', '', `<div id="cineTx"></div><button id="cineSkip">SALTA ▸▸</button>`); ui.id = 'cineUI'; o.appendChild(ui);
      CS = { shots, i: -1, t0: 0, res, prevMode, bgCache: {} };
      const next = () => { CS.i++; if (CS.i >= CS.shots.length) return end(); const s = CS.shots[CS.i]; CS.t0 = R.t; CS.dur = (s.dur || (3200 + (s.text || '').length * 48)) / 1000;
        if (s.music !== undefined) AUDIO.play(s.music); if (s.sfx) AUDIO.sfx(s.sfx); if (s.fx === 'flash') { R.flash = 1; R.flashCol = '#fff'; } if (s.fx === 'shake') R.shake = 1; if (s.fx === 'redflash') { R.flash = .9; R.flashCol = '#ff2a2a'; }
        if (!s.img && s.bg && !CS.bgCache[s.bg]) CS.bgCache[s.bg] = ART.prepare(s.bg, W, H, DPR);
        const tx = $('cineTx'); tx.classList.remove('on'); setTimeout(() => { if (!CS) return; tx.innerHTML = s.title ? `<b>${s.title}</b>${s.text ? '<br>' + s.text : ''}` : (s.text || ''); tx.classList.toggle('big', !!s.title); if (s.text || s.title) tx.classList.add('on'); }, 350);
        clearTimeout(CS.tm); CS.tm = setTimeout(() => CS && next(), CS.dur * 1000);
      };
      const end = () => { if (!CS) return; clearTimeout(CS.tm); CS = null; o.innerHTML = ''; R.mode = prevMode === 'cine' ? 'scene' : prevMode; setTop(); res(); };
      ui.onclick = e => { if (e.target.id === 'cineSkip') { AUDIO.sfx('back'); return end(); } if (R.t - CS.t0 > .6) next(); };
      R.fadeTarget = 0; next();
    });
  }
  function drawCine(dt) {
    if (!CS) return; const s = CS.shots[CS.i]; if (!s) return;
    const k = Math.min(1, (R.t - CS.t0) / CS.dur), e = ease(k);
    const cam = s.cam || [[.5, .5, 1.08], [.5, .5, 1.0]];
    const cx = cam[0][0] + (cam[1][0] - cam[0][0]) * e, cy = cam[0][1] + (cam[1][1] - cam[0][1]) * e, z = cam[0][2] + (cam[1][2] - cam[0][2]) * e;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const im = s.img && IMG[s.img];
    ctx.save();
    if (im && im.complete && im.naturalWidth) {
      const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight) * z, iw = im.naturalWidth * sc, ih = im.naturalHeight * sc;
      let x = W / 2 - cx * iw, y = H / 2 - cy * ih; x = Math.min(0, Math.max(W - iw, x)); y = Math.min(0, Math.max(H - ih, y));
      ctx.drawImage(im, x, y, iw, ih);
    } else {
      const bg = CS.bgCache[s.bg || 'black'] || (CS.bgCache[s.bg || 'black'] = ART.prepare(s.bg || 'black', W, H, DPR));
      ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W * cx, -H * cy); ART.drawBg(ctx, bg, R.t, dt);
    }
    ctx.restore();
    // actors
    (s.actors || []).forEach(a => {
      const p0 = a.from || [.5, .5], p1 = a.to || p0, ax = (p0[0] + (p1[0] - p0[0]) * (a.lin ? k : e)) * W, ay = (p0[1] + (p1[1] - p0[1]) * (a.lin ? k : e)) * H;
      const sc = (a.scale || 1) * Math.min(W, H) / 400;
      if (a.k === 'ship') { ctx.save(); ctx.translate(ax, ay + Math.sin(R.t * 2) * 4); ctx.scale(sc * 1.6, sc * 1.6); WORLD.ship(ctx, 0, 0, a.face || 1, R.t); ctx.restore(); }
      else if (a.k === 'enemy') ART.drawEnemy(ctx, a.look, a.color || '#fff', ax, ay, 100 * sc, R.t, 0, 0);
      else (a.ids || [a.id]).forEach((id, i) => WORLD.walker(ctx, id, ax - (a.face || 1) * i * 30 * sc, ay, sc * 1.4, R.t + i, p1[0] !== p0[0], a.face || 1));
    });
    if (s.fx === 'lightning' && Math.random() < .005) { R.flash = .45; R.flashCol = '#c8ffe0'; AUDIO.sfx('thunder'); }
    if (s.fx === 'snow' || s.fx === 'rain' || s.fx === 'embers' || s.fx === 'petals') { const pb = CS.bgCache['_p_' + s.fx] || (CS.bgCache['_p_' + s.fx] = { parts: [] }); /* light overlay particles */ ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { const sd = i * 97.13; const px = ((sd * 13.7 + R.t * (s.fx === 'rain' ? -120 : 12) * (1 + i % 3)) % (W + 40) + W + 40) % (W + 40) - 20; const py = ((sd * 7.3 + R.t * (s.fx === 'rain' ? 700 : s.fx === 'embers' ? -30 : 30) * (1 + i % 4 * .3)) % (H + 40) + H + 40) % (H + 40) - 20; if (s.fx === 'rain') { ctx.strokeStyle = 'rgba(170,220,255,.35)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py + 14); ctx.stroke(); } else ART.glowCircle(ctx, px, py, s.fx === 'embers' ? 4 : 3, s.fx === 'embers' ? '#ffb547' : s.fx === 'petals' ? '#ff6a8a' : '#ffffff', .8); } ctx.restore(); }
    // fade at shot start/end
    const fin = Math.min(1, (R.t - CS.t0) / .6), fout = Math.min(1, (CS.dur - (R.t - CS.t0)) / .5);
    const a = 1 - Math.min(fin, s.cut ? 1 : fout); if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
    // letterbox
    const bar = H * (W > H ? .1 : .14); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    const vg = ctx.createLinearGradient(0, H - bar - 120, 0, H - bar); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, H - bar - 120, W, 120);
  }

  // ---------- chapters & map ----------
  async function startChapter(id) {
    const c = CH[id];
    if (!c) { overlay(`<h1>Continua...</h1><div class="card">Il capitolo <b>${id}</b> non è ancora disponibile in questa versione.</div><button class="btn" id="bk">Titolo</button>`); $('bk').onclick = () => { closeOverlay(); titleScreen(); }; return; }
    const prev = S.ch && S.ch !== id ? S.ch : id;
    S.ch = id; S.scene = null; S.node = null; S.mapAt = null; R.portrait = null; show('tb', false); setTop();
    // travel map: the Libellula flies to the next island
    await showWorld(prev, id, true);
    await playCine(id + '_intro');
    R.mode = 'scene'; setBg(c.map.bg); AUDIO.play(c.music || 'title'); R.fadeTarget = 0;
    await titleCard(c.title, c.subtitle, `Capitolo ${c.num}`);
    runScene(c.start, null);
  }
  function showWorld(from, to, auto) {
    return new Promise(res => {
      const prevMode = R.mode; R.mode = 'world'; setTop(); WORLD.worldMapStart(W, H, from, to);
      if (auto) { AUDIO.play('title'); AUDIO.sfx('wind'); }
      const o = $('ovl'); o.innerHTML = '';
      const d = el('div', '', `<div class="tap" style="bottom:calc(30px + var(--sab))">${auto ? 'TOCCA PER CONTINUARE' : 'TOCCA PER CHIUDERE'}</div>`); d.style.cssText = 'position:absolute;inset:0'; o.appendChild(d);
      let done = false; const fin = () => { if (done) return; done = true; o.innerHTML = ''; WORLD.clearWorld(); R.mode = auto ? 'scene' : prevMode; setTop(); res(); };
      setTimeout(() => d.onclick = fin, 500); if (auto) setTimeout(fin, skipOn ? 800 : 4200);
    });
  }
  function visibleNodes() { const c = CH[S.ch]; return c.map.nodes.filter(n => cond(n.req)); }
  const isDone = n => !!S.done[S.ch + ':' + n.id] && !n.repeat;
  function openMap(atNode) {
    runId++; cancelDialog(); const c = CH[S.ch]; S.scene = null; S.node = null; S.snap = null;
    R.mode = 'map'; R.portrait = null; R.pShown = null; show('tb', false); $('ch').innerHTML = ''; $('bt').innerHTML = '';
    setBg(c.map.bg); AUDIO.play(c.music || 'title'); AUDIO.sfx('map'); R.fadeTarget = 0;
    const L0 = ROOMS.level, fresh = !L0 || L0.ch !== c || L0.W !== W || L0.H !== H;
    if (fresh) ROOMS.build(c, W, H);
    if (atNode) S.mapAt = atNode;
    if (S.mapAt || fresh) ROOMS.placeAt(S.mapAt || c.map.nodes.filter(n => cond(n.req)).sort((a, b) => b.y - a.y)[0]?.id);
    autosave(); setTop(); renderMapNodes();
  }
  function renderMapNodes() {
    const c = CH[S.ch];
    const vis = visibleNodes(); const left = vis.filter(n => n.type === 'main' && !isDone(n));
    $('mapHead').innerHTML = `<h2>${c.title}</h2><div>Cap. ${c.num} · Liv. ${S.lv} · ${S.money} Lumen</div>${left.length ? `<div style="margin-top:6px;font-style:normal;color:var(--gold)">◆ Obiettivo: ${left[0].name}</div>` : ''}`;
    R.map = { nodes: vis };
  }
  const MAPINFO = {
    hits: [], get visible() { return R.map ? R.map.nodes : []; }, done: isDone,
    get party() { const p = S.active.filter(id => S.party.includes(id)); S.party.forEach(id => { if (!p.includes(id)) p.push(id); }); return p; },
    npcFor(n) { if (n._npc !== undefined) return n._npc; const st = SCENES[n.scene] || []; let found = null; const allies = ['mira', 'kai', 'otto', 'bram', 'nuvola', 'sable', 'voice']; const scan = arr => { for (const s of arr) { if (found) return; if (typeof s === 'string') { const m = s.match(/^@(\w+)/); if (m && !allies.includes(m[1])) found = m[1]; } else if (s && s.choice) s.choice.forEach(o => o.then && scan(o.then)); else if (s && s.then) scan(s.then); } }; scan(st); n._npc = found ? { id: found, def: NPCS[found] } : null; return n._npc; },
    enemiesFor(n) { const b = BATTLES[n.battle]; return b ? b.enemies.map(e => ENEMIES[e]).filter(Boolean) : []; },
    shopkeeper: true,
  };
  function drawMap(dt) {
    const arrived = ROOMS.update(dt, MAPINFO); ROOMS.draw(ctx, R.t, dt, MAPINFO);
    if (arrived && R.mode === 'map') { const done = isDone(arrived); enterNode(arrived, done); }
  }
  cv.addEventListener('click', ev => {
    if (R.mode !== 'map' || $('ovl').children.length) return;
    ROOMS.tap(ev.clientX, ev.clientY, MAPINFO);
  });
  async function enterNode(n, done) {
    AUDIO.sfx('select'); S.mapAt = n.id;
    if (n.type === 'shop') return shop(n);
    if (done && n.type !== 'camp') { toast('Già visitato'); return; }
    if (n.type === 'battle') { $('mapHead').innerHTML = ''; const r = await battle(n.battle, true); if (r === 'win') S.done[S.ch + ':' + n.id] = 1; return openMap(n.id); }
    if (n.type === 'camp') { healAll(); toast('🔥 Il gruppo riposa: salute ed etere ripristinati'); if (done) return; }
    $('mapHead').innerHTML = '';
    runScene(n.scene, n.id);
  }
  function shop(n) {
    const draw = () => {
      const o = overlay(`<h1>${n.name}</h1><div class="small-note">Lumen: <b style="color:var(--gold2)">${S.money}</b></div>` + n.stock.map(k => `<div class="card"><div class="row"><div><b>${ITEMS[k].name}</b> <small>(hai ${S.items[k] || 0})</small><br><small>${ITEMS[k].desc}</small></div><button class="btn small" style="width:auto;padding:9px 14px" data-k="${k}" ${S.money < ITEMS[k].price ? 'disabled' : ''}>${ITEMS[k].price}</button></div></div>`).join('') + `<button class="btn" id="shx">Esci</button>`);
      o.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; if (S.money < ITEMS[k].price) return AUDIO.sfx('deny'); S.money -= ITEMS[k].price; S.items[k] = (S.items[k] || 0) + 1; AUDIO.sfx('buy'); draw(); });
      $('shx').onclick = () => { closeOverlay(); renderMapNodes(); autosave(); };
    };
    draw();
  }

  // ---------- battle ----------
  let B = null;
  function enemyStats(def) {
    const L = def.lv, r = ROLE[def.role] || {}; const easy = S.diff === 'story' ? .65 : 1;
    const ng = 1 + S.ng * .15;
    return {
      maxhp: Math.round((22 + 13 * L) * (r.hp || 1) * easy * ng), atk: (7 + 2.6 * L) * (r.atk || 1) * easy * ng, def: (3 + 1.5 * L) * (r.def || 1),
      mag: (7 + 2.6 * L) * (r.mag || 1) * easy * ng, spd: (7 + L) * (r.spd || 1), xp: Math.round((8 + 5 * L) * (def.role === 'boss' ? 6 : 1)), money: Math.round((5 + 3 * L) * (def.role === 'boss' ? 5 : 1))
    };
  }
  function battle(bid, canLose) {
    return new Promise(resolve => {
      const bd = BATTLES[bid]; if (!bd) { console.error('battaglia mancante', bid); return resolve('win'); }
      const pre = { hp: clone(S.hp), mp: clone(S.mp), items: clone(S.items) };
      if (bd.bg) setBg(bd.bg);
      const isBoss = bd.enemies.some(e => ENEMIES[e]?.role === 'boss');
      const prevMusic = AUDIO.theme; AUDIO.play(isBoss ? 'boss' : 'battle');
      R.mode = 'battle'; setTop(); show('tb', false); R.portrait = null; R.pShown = null;
      const n = bd.enemies.length;
      const enemies = bd.enemies.map((eid, i) => { const d = ENEMIES[eid] || { name: eid, lv: S.lv, role: 'brute', look: 'wraith', color: '#f0f', skills: ['strike'] }; const st = enemyStats(d); return Object.assign({ key: eid, name: d.name, look: d.look, color: d.color || '#ff6a6a', skills: d.skills && d.skills.length ? d.skills : ['strike'], lv: d.lv, boss: d.role === 'boss', hp: st.maxhp, st: {}, buf: {}, hurt: 0, dead: 0, slot: i, n }, st); });
      const allies = S.active.filter(id => S.party.includes(id)).slice(0, 4).map(id => { const s = stats(id); return { id, ally: true, name: NAMES[id], maxhp: s.hp, maxmp: s.mp, hp: Math.max(0, Math.min(s.hp, S.hp[id] ?? s.hp)), mp: Math.min(s.mp, S.mp[id] ?? s.mp), atk: s.atk, def: s.def, mag: s.mag, spd: s.spd, st: {}, buf: {} }; });
      allies.forEach(a => { if (a.hp <= 0) a.hp = 1; });
      B = { enemies, allies, auto: false, resolve, canLose, pre, prevMusic, bid, over: false, round: 0, bg: bd.bg };
      layoutEnemies(); buildBattleUI(); log(isBoss ? `⚔ ${enemies.find(e => e.boss).name}!` : 'Nemici in vista!');
      setTimeout(battleLoop, 700);
    });
  }
  function layoutEnemies() { const es = B.enemies, n = es.length, land = W > H; es.forEach((e, i) => { if (land) { const sz = e.boss ? H * .5 : Math.min(W * .5 / (n + .3), H * .3); e.size = sz; e.x = W * .46 + W * .5 * (i + .5) / n; e.y = H * (e.boss ? .4 : .36) + (n > 2 && i % 2 ? 26 : 0); } else { const sz = e.boss ? Math.min(W * .55, 230) : Math.min(W / (n + .6), 120); e.size = sz; e.x = W * (i + 1) / (n + 1); e.y = H * (e.boss ? .36 : .34) + (n > 2 && i % 2 ? 40 : 0); } }); }
  // pixel arena + pixel sprites
  let ARENA = null;
  function arena() {
    const bg = B.bg || CH[S.ch]?.map?.bg || 'lutece_night', px = Math.max(2, Math.round(Math.min(W, H) / 130));
    if (ARENA && ARENA.bg === bg && ARENA.W === W && ARENA.H === H) return ARENA;
    const th = PIX.theme(bg), T = PIX.T, bw = Math.ceil(W / px), bh = Math.ceil(H / px), c = PIX.mk(bw, bh), g = c.getContext('2d'), r = PIX.rngOf(bg.length * 97 + 3);
    const wallH = Math.round(bh * (W > H ? .34 : .3)), tilesX = Math.ceil(bw / T) + 1;
    for (let y = wallH - 32; y < bh; y += T) for (let x = 0; x < tilesX; x++) PIX.floorTile(g, th, x * T, y, x, Math.floor(y / T), r);
    for (let x = 0; x < tilesX; x++) PIX.wallFace(g, th, x * T, wallH - 32, x, r);
    g.fillStyle = th.cap; g.fillRect(0, 0, bw, Math.max(0, wallH - 32));
    for (let i = 0; i < 6; i++) { const t = th.props[i % th.props.length], x = Math.round((i + .5) / 6 * bw + (r() - .5) * 20); const sp = PIX.propSprite(t, th, i % 3); g.drawImage(sp, x - 20, wallH + 4 - 46); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, wallH, bw, 3);
    const vg = g.createRadialGradient(bw / 2, bh * .6, bh * .2, bw / 2, bh * .6, bw * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${th.amb.join(',')},${.35 + th.dark * .6})`); g.fillStyle = vg; g.fillRect(0, 0, bw, bh);
    return ARENA = { bg, W, H, c, px, th };
  }
  function barTop(e) { const px = Math.max(2, Math.round(Math.min(W, H) / 130)), sc = px * (e.boss ? 2 : 1); return Math.max(44, e.y + e.size * .5 - 32 * sc - 30); }
  function blit(img, x, y, sc, flip, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -img.width / 2 * sc, -img.height * sc, img.width * sc, img.height * sc); ctx.restore(); }
  function drawBattle(dt) {
    if (!B) return;
    const A = arena(), px = A.px; ctx.imageSmoothingEnabled = false; ctx.drawImage(A.c, 0, 0, A.c.width * px, A.c.height * px);
    const fr = Math.floor(R.t * 6) % 4;
    B.enemies.forEach(e => {
      if (e.dead >= 1) return; if (e.hp <= 0) e.dead = Math.min(1, e.dead + dt * 1.5); e.hurt = Math.max(0, e.hurt - dt * 3);
      const sc = px * (e.boss ? 2 : 1) * (e.size > 150 && !e.boss ? 1.5 : 1), img = PIX.enemySprite(e.look, e.color || '#ff6a6a', fr), base = e.y + e.size * .5;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(e.x - 7 * sc, base - sc, 14 * sc, 2 * sc);
      blit(img, e.x + (e.hurt ? rnd(-5, 5) : 0), base + (e.dead || 0) * 20, sc, true, 1 - (e.dead || 0));
      if (e.hurt > .5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(img, e.x, base, sc, true, (e.hurt - .5)); ctx.restore(); }
    });
    const n = B.allies.length, land = W > H;
    B.allies.forEach((a, i) => {
      const x = land ? W * (.07 + i * .095) + (i % 2) * 10 : W * (i + 1) / (n + 1), base = land ? H * .7 - (i % 2) * 14 : H * .64; const act = B.actor === a; const lunge = act ? 10 + Math.max(0, B.lunge || 0) * 40 : 0; a.sx = x; a.sy = base - 70;
      const img = PIX.charSprite(a.id, ART.LOOK[a.id] || ART.LOOK.villager, land ? 2 : 1, act && B.lunge > 0 ? fr : 0);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 6 * px, base - px, 12 * px, 2 * px);
      if (a.hp <= 0) { ctx.save(); ctx.globalAlpha = .45; ctx.translate(x, base); ctx.rotate(-Math.PI / 2); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, -img.width / 2 * px, -img.height * px, img.width * px, img.height * px); ctx.restore(); }
      else { if (act) { ctx.fillStyle = `rgba(255,230,160,${.25 + .15 * Math.sin(R.t * 6)})`; ctx.fillRect(x - 8 * px, base - px, 16 * px, 2 * px); } blit(img, land ? x + lunge : x, land ? base : base - lunge, px, false); }
    });
    if (B.lunge > 0) B.lunge = Math.max(0, B.lunge - dt * 3);
    if (B.pick) B.enemies.forEach(e => { if (e.hp > 0) { const base = e.y + e.size * .5; ctx.fillStyle = `rgba(242,196,109,${.5 + .5 * Math.sin(R.t * 6)})`; const w = 16 * px; ctx.fillRect(e.x - w / 2, base + px, w, px); ctx.fillRect(e.x - w / 2, base - 2 * px, px, 3 * px); ctx.fillRect(e.x + w / 2 - px, base - 2 * px, px, 3 * px); } });
    updEnemyBars();
  }
  function buildBattleUI() {
    const bt = $('bt'); bt.innerHTML = `<button class="autoB" id="autoB">AUTO</button><div class="blog" id="blog"></div><div class="ebars" id="ebars"></div><div class="acts" id="acts"></div><div class="party" id="pcs"></div>`;
    $('autoB').onclick = () => { B.auto = !B.auto; $('autoB').classList.toggle('on', B.auto); if (B.auto && B.waiting) B.waiting(null); };
    $('ebars').innerHTML = B.enemies.map((e, i) => `<div class="eb" id="eb${i}"><div>${e.name}</div><div class="bar"><i></i></div><div class="st"></div></div>`).join('');
    B.enemies.forEach((e, i) => { const d = $('eb' + i); d.style.left = e.x + 'px'; d.style.top = barTop(e) + 'px'; d.style.pointerEvents = 'auto'; d.onclick = () => B.pick && B.pick(e); });
    cv.onclick = ev => { if (!B || !B.pick) return; const t = B.enemies.filter(e => e.hp > 0).sort((a, b) => Math.hypot(a.x - ev.clientX, a.y - ev.clientY) - Math.hypot(b.x - ev.clientX, b.y - ev.clientY))[0]; if (t && Math.hypot(t.x - ev.clientX, t.y - ev.clientY) < t.size) B.pick(t); };
    updParty();
  }
  function updEnemyBars() { if (!B) return; B.enemies.forEach((e, i) => { const d = $('eb' + i); if (!d) return; d.style.opacity = e.hp > 0 ? 1 : 0; d.querySelector('i').style.width = (100 * e.hp / e.maxhp) + '%'; const st = []; if (e.st.poison) st.push('☠'); if (e.st.stun) st.push('✧stordito'); if (e.st.blind) st.push('◌accecato'); if (e.charging) st.push('⚠ CARICA'); if (e.buf.def) st.push('🛡'); d.querySelector('.st').textContent = st.join(' '); }); }
  function updParty(act) {
    if (!B || !$('pcs')) return;
    $('pcs').innerHTML = B.allies.map(a => `<div class="pc ${a === act ? 'act' : ''} ${a.hp <= 0 ? 'ko' : ''}" id="pc_${a.id}"><div class="n"><span>${a.name}</span></div><div class="bar"><i style="width:${100 * a.hp / a.maxhp}%"></i></div><div class="v">${Math.ceil(a.hp)}/${a.maxhp}</div><div class="bar mp"><i style="width:${100 * a.mp / a.maxmp}%"></i></div><div class="v">${Math.floor(a.mp)} ✦ ${[a.st.poison ? '☠' : '', a.st.stun ? '✧' : '', a.buf.evade ? '≋' : '', a.buf.atk ? '⚔↑' : '', a.buf.def ? '🛡' : '', a.buf.protectBy ? '⛨' : '', a.buf.turret ? '⚙' : ''].join('')}</div></div>`).join('');
  }
  function log(t) { const b = $('blog'); if (b) b.innerHTML = t; }
  function allyPos(a) { if (a.sx) return [a.sx, a.sy]; const d = $('pc_' + a.id); if (!d) return [W / 2, H - 80]; const r = d.getBoundingClientRect(); return [r.left + r.width / 2, r.top]; }
  const alive = arr => arr.filter(u => u.hp > 0);
  async function battleLoop() {
    const b0 = B;
    while (B === b0 && !B.over) {
      B.round++;
      const order = [...alive(B.allies), ...alive(B.enemies)].sort((a, b) => (b.spd + rnd(0, 4)) - (a.spd + rnd(0, 4)));
      for (const u of order) {
        if (B !== b0 || B.over) return;
        if (u.hp <= 0) continue;
        // start-of-turn effects
        for (const k of Object.keys(u.buf)) if (typeof u.buf[k] === 'number' && k !== 'shadow') { u.buf[k]--; if (u.buf[k] <= 0) delete u.buf[k]; }
        if (u.st.poison) { const d = Math.max(1, Math.round(u.maxhp * .06)); u.hp = Math.max(1, u.hp - d); popAt(u, '-' + d, '#a3e635'); u.st.poison--; if (!u.st.poison) delete u.st.poison; await wait(300); }
        if (u.st.stun) { delete u.st.stun; log(`${u.name} è stordito!`); await wait(700); continue; }
        if (u.ally) {
          if (u.buf.turret) { const t = pickRand(alive(B.enemies)); if (t) { await wait(200); dealDmg(u, t, u.mag * .9, 'mag'); log('⚙ La torretta di Otto spara!'); await wait(500); if (checkEnd()) return; } }
          updParty(u); B.actor = u;
          const act = await allyTurn(u); B.lunge = 1; if (B.over) return;
          await doAction(u, act);
        } else { B.actor = null; await enemyTurn(u); }
        updParty(); if (checkEnd()) return;
        await wait(B.auto ? 150 : 250);
      }
    }
  }
  function popAt(u, txt, col, big) { if (u.ally) { const [x, y] = allyPos(u); pop(x, y, txt, col, big); } else pop(u.x, u.y - u.size * .3, txt, col, big); }
  const pickRand = arr => arr[Math.floor(Math.random() * arr.length)];
  function allyTurn(u) {
    if (B.auto) return Promise.resolve(autoAction(u));
    return new Promise(res => {
      B.waiting = r => { B.waiting = null; B.pick = null; $('acts').innerHTML = ''; res(r || autoAction(u)); };
      const acts = $('acts'); log(`Turno di <b>${u.name}</b>`);
      const main = () => {
        B.pick = null; const sk = SKILLS[u.id].filter(s => s.lv <= S.lv);
        acts.innerHTML = `<button id="aA">⚔ Attacca<small>Colpo base</small></button><button id="aS">✦ Tecniche<small>${Math.floor(u.mp)} Etere</small></button><button id="aI">✚ Oggetti<small>${Object.values(S.items).reduce((a, b) => a + b, 0)} disponibili</small></button><button id="aD">🛡 Difendi<small>Danni dimezzati, +Etere</small></button>`;
        $('aA').onclick = () => target('enemy', t => B.waiting({ k: 'atk', t }));
        $('aS').onclick = () => { acts.innerHTML = sk.map((s, i) => `<button data-i="${i}" ${u.mp < s.mp ? 'disabled' : ''}>${s.n}<small>${s.mp} ✦ · ${s.d}</small></button>`).join('') + `<button class="full" id="bk">← Indietro</button>`; acts.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const s = sk[+b.dataset.i]; target(s.t, t => B.waiting({ k: 'skill', s, t })); }); $('bk').onclick = main; };
        $('aI').onclick = () => { const ks = Object.keys(S.items).filter(k => S.items[k] > 0); acts.innerHTML = ks.map(k => `<button data-k="${k}">${ITEMS[k].name} ×${S.items[k]}<small>${ITEMS[k].desc}</small></button>`).join('') + `<button class="full" id="bk">← Indietro</button>`; acts.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; target(ITEMS[k].t, t => B.waiting({ k: 'item', it: k, t })); }); $('bk').onclick = main; };
        $('aD').onclick = () => B.waiting({ k: 'def' });
      };
      const target = (t, cb) => {
        AUDIO.sfx('select');
        if (t === 'enemies' || t === 'allies' || t === 'self' || t === 'rand3' || t === 'party') return cb(null);
        if (t === 'enemy') { const es = alive(B.enemies); if (es.length === 1) return cb(es[0]); log('Scegli un bersaglio'); acts.innerHTML = es.map((e, i) => `<button data-i="${i}">${e.name}<small>${Math.ceil(e.hp)}/${e.maxhp}</small></button>`).join('') + `<button class="full" id="bk">← Indietro</button>`; acts.querySelectorAll('[data-i]').forEach(b => b.onclick = () => cb(es[+b.dataset.i])); $('bk').onclick = main; B.pick = e => cb(e); return; }
        const pool = t === 'ko' ? B.allies.filter(a => a.hp <= 0) : alive(B.allies);
        if (!pool.length) { toast('Nessun bersaglio valido'); return main(); }
        acts.innerHTML = pool.map((a, i) => `<button data-i="${i}">${a.name}<small>${Math.ceil(a.hp)}/${a.maxhp}</small></button>`).join('') + `<button class="full" id="bk">← Indietro</button>`;
        acts.querySelectorAll('[data-i]').forEach(b => b.onclick = () => cb(pool[+b.dataset.i])); $('bk').onclick = main;
      };
      main();
    });
  }
  function autoAction(u) {
    const sk = SKILLS[u.id].filter(s => s.lv <= S.lv && u.mp >= s.mp);
    const hurt = alive(B.allies).filter(a => a.hp / a.maxhp < .4).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
    const heal = sk.find(s => s.fx.heal);
    if (hurt && heal) return { k: 'skill', s: heal, t: heal.t === 'ally' ? hurt : null };
    const ko = B.allies.find(a => a.hp <= 0); const rev = sk.find(s => s.fx.revive); if (ko && rev) return { k: 'skill', s: rev, t: ko };
    const es = alive(B.enemies); const tgt = es.sort((a, b) => a.hp - b.hp)[0];
    const dmg = sk.filter(s => (s.fx.atk || s.fx.mag) && (s.t === 'enemy' || s.t === 'enemies' || s.t === 'rand3'));
    if (dmg.length && u.mp > u.maxmp * .35 && Math.random() < .6) { const s = es.length > 1 ? (dmg.find(s => s.t !== 'enemy') || dmg[dmg.length - 1]) : dmg[dmg.length - 1]; return { k: 'skill', s, t: s.t === 'enemy' ? tgt : null }; }
    return { k: 'atk', t: tgt };
  }
  function dealDmg(src, tgt, power, kind = 'atk', o = {}) {
    if (tgt.hp <= 0) return 0;
    if (tgt.ally && tgt.buf.protectBy) { const p = B.allies.find(a => a.id === 'bram' && a.hp > 0); if (p && p !== tgt) { tgt = p; power *= .6; } }
    const evade = (tgt.buf.evade ? .5 : 0) + (tgt.buf.counter ? .35 : 0) + (tgt.buf.shadowEv ? .6 : 0);
    if ((!src.ally && src.st.blind && Math.random() < .5) || Math.random() < evade) { popAt(tgt, 'Mancato', '#ccc'); if (src.st.blind) delete src.st.blind; if (tgt.buf.counter && !src.ally) { setTimeout(() => { dealDmg(tgt, src, tgt.atk * 1.2); log(`${tgt.name} contrattacca!`); }, 250); } return 0; }
    let def = kind === 'mag' ? tgt.def * .3 : tgt.def * .5; if (tgt.buf.def) def *= 1.5;
    let d = power * 1.5 - def; if (src.buf && src.buf.atk && kind === 'atk') d *= 1.3;
    if (src.ally && src.id === 'mira' && S.flags.dark >= 4) d *= 1.2;
    let crit = Math.random() < (o.crit || .07); if (src.buf && src.buf.shadow) { crit = true; delete src.buf.shadow; }
    if (crit) d *= 1.7; if (tgt.defending) d *= .5;
    d = Math.max(1, Math.round(d * rnd(.9, 1.1)));
    tgt.hp = Math.max(0, tgt.hp - d);
    if (!tgt.ally) { tgt.hurt = 1; } else { R.shake = Math.max(R.shake, .35); }
    popAt(tgt, (crit ? '✦' : '') + d, tgt.ally ? '#ff8a8a' : crit ? '#ffe066' : '#fff', crit);
    AUDIO.sfx(crit ? 'crit' : 'hit');
    if (tgt.hp <= 0) { if (!tgt.ally) AUDIO.sfx('enemyDie'); else log(`${tgt.name} è a terra!`); }
    return d;
  }
  function healU(u, amt) { if (u.hp <= 0) return; amt = Math.round(amt); u.hp = Math.min(u.maxhp, u.hp + amt); popAt(u, '+' + amt, '#7dffa0'); }
  async function doAction(u, a) {
    u.defending = false;
    if (a.k === 'def') { u.defending = true; u.mp = Math.min(u.maxmp, u.mp + u.maxmp * .12); log(`${u.name} si difende`); AUDIO.sfx('select'); await wait(400); return; }
    if (a.k === 'atk') { const t = a.t && a.t.hp > 0 ? a.t : pickRand(alive(B.enemies)); log(`${u.name} attacca`); AUDIO.sfx('swing'); await wait(180); dealDmg(u, t, u.atk); await wait(450); return; }
    if (a.k === 'item') {
      const it = a.it; S.items[it]--; const st = ITEMS[it]; log(`${u.name} usa ${st.name}`); AUDIO.sfx('heal');
      if (it === 'tonico') healU(a.t, a.t.maxhp * .5);
      if (it === 'etere') { a.t.mp = Math.min(a.t.maxmp, a.t.mp + a.t.maxmp * .5); popAt(a.t, '+✦', '#8ab4ff'); }
      if (it === 'fenice') { a.t.hp = Math.round(a.t.maxhp * .5); a.t.st = {}; popAt(a.t, 'Rianimato', '#ffe066'); }
      if (it === 'te') alive(B.allies).forEach(x => { healU(x, x.maxhp * .35); x.st = {}; });
      if (it === 'bomba') { R.flash = .5; R.flashCol = '#ffb04a'; AUDIO.sfx('explosion'); alive(B.enemies).forEach(e => { e.hp = Math.max(0, e.hp - (30 + 12 * S.lv)); e.hurt = 1; popAt(e, 30 + 12 * S.lv, '#ffb04a'); }); }
      await wait(600); return;
    }
    const s = a.s, fx = s.fx; u.mp -= s.mp; log(`${u.name}: <b>${s.n}</b>`); AUDIO.sfx(fx.heal || fx.revive ? 'heal' : 'magic');
    R.flash = .25; R.flashCol = ART.LOOK[u.id]?.rim || '#fff'; await wait(250);
    const es = alive(B.enemies);
    const pw = fx.mag ? u.mag * fx.mag : u.atk * (fx.atk || 1); const kind = fx.mag ? 'mag' : 'atk';
    if (s.t === 'enemy') { const t = a.t && a.t.hp > 0 ? a.t : pickRand(es); let p = pw; if (fx.exec && t.hp / t.maxhp < .3) p *= 2; dealDmg(u, t, p, kind, { crit: fx.crit }); if (fx.blind && Math.random() < fx.blind) t.st.blind = 1; if (fx.stun && Math.random() < fx.stun && !t.boss) t.st.stun = 1; if (fx.poison) t.st.poison = 3; if (fx.steal) { if (Math.random() < .6) { const m = 10 + S.lv * 4; S.money += m; popAt(t, `+${m} Lumen`, '#ffe066'); } else { const it = pickRand(['tonico', 'etere', 'tonico', 'bomba']); S.items[it] = (S.items[it] || 0) + 1; toast(`Rubato: ${ITEMS[it].name}`); } } }
    else if (s.t === 'enemies') { R.shake = .4; es.forEach(t => dealDmg(u, t, pw, kind)); }
    else if (s.t === 'rand3') { for (let i = 0; i < 3; i++) { const t = pickRand(alive(B.enemies)); if (!t) break; dealDmg(u, t, pw, kind); await wait(220); } }
    else if (s.t === 'ally' && fx.heal) healU(a.t, u.mag * fx.heal + 10);
    else if (s.t === 'allies' && fx.heal) alive(B.allies).forEach(x => healU(x, u.mag * fx.heal + 8));
    else if (s.t === 'allies' && fx.buff) alive(B.allies).forEach(x => { x.buf[fx.buff] = 3; popAt(x, { atk: 'ATT ↑', def: 'DIF ↑', evade: 'Bruma' }[fx.buff], '#ffe066'); });
    else if (s.t === 'ally' && fx.protect) { a.t.buf.protectBy = 2; popAt(a.t, 'Protetto', '#9fd8ff'); }
    else if (s.t === 'ko') { a.t.hp = Math.round(a.t.maxhp * fx.revive); a.t.st = {}; popAt(a.t, 'Rianimato', '#ffe066'); }
    else if (s.t === 'self') { if (fx.counter) { u.buf.counter = 2; popAt(u, 'Postura', '#ffe066'); } if (fx.turret) { u.buf.turret = 3; popAt(u, 'Torretta!', '#ffe066'); } if (fx.shadow) { u.buf.shadow = 1; u.buf.shadowEv = 2; popAt(u, 'Ombra', '#c08aff'); } }
    await wait(550);
  }
  async function enemyTurn(e) {
    const targets = alive(B.allies); if (!targets.length) return;
    const actions = e.boss && e.hp < e.maxhp * .5 ? 2 : 1;
    for (let k = 0; k < actions; k++) {
      if (B.over || e.hp <= 0) return;
      const tg = alive(B.allies); if (!tg.length) return;
      const t = pickRand(tg);
      if (e.charging) { e.charging = false; log(`<b>${e.name}</b> scatena il colpo caricato!`); R.flash = .5; R.flashCol = '#ff4a2a'; AUDIO.sfx('explosion'); await wait(300); dealDmg(e, t, e.atk * 2.6); updParty(); await wait(700); continue; }
      let sk = pickRand(e.skills);
      if (sk === 'heal' && e.hp > e.maxhp * .6) sk = 'strike';
      if (sk === 'guard' && e.buf.def) sk = 'strike';
      const nm = { strike: 'attacca', heavy: 'sferra un colpo pesante', multi: 'colpisce a raffica', sweep: 'attacca tutto il gruppo', drain: 'prosciuga energia', poison: 'avvelena', stun: 'tenta di stordire', heal: 'si rigenera', guard: 'si protegge', charge: 'sta caricando un colpo devastante!' }[sk];
      log(`<b>${e.name}</b> ${nm}`); await wait(350);
      switch (sk) {
        case 'strike': dealDmg(e, t, e.atk); break;
        case 'heavy': R.shake = .5; dealDmg(e, t, e.atk * 1.6); break;
        case 'multi': dealDmg(e, t, e.atk * .6); await wait(200); dealDmg(e, pickRand(alive(B.allies)) || t, e.atk * .6); break;
        case 'sweep': R.shake = .6; alive(B.allies).forEach(a => dealDmg(e, a, e.atk * .65)); break;
        case 'drain': { const d = dealDmg(e, t, e.mag * .9, 'mag'); e.hp = Math.min(e.maxhp, e.hp + d * .5); break; }
        case 'poison': if (dealDmg(e, t, e.atk * .6)) t.st.poison = 3; break;
        case 'stun': if (dealDmg(e, t, e.atk * .8) && Math.random() < .3) { t.st.stun = 1; popAt(t, 'Stordito', '#ffe066'); } break;
        case 'heal': { const amt = e.maxhp * .22; e.hp = Math.min(e.maxhp, e.hp + amt); popAt(e, '+' + Math.round(amt), '#7dffa0'); AUDIO.sfx('heal'); break; }
        case 'guard': e.buf.def = 2; popAt(e, 'DIF ↑', '#9fd8ff'); break;
        case 'charge': e.charging = true; AUDIO.sfx('alarm'); break;
      }
      updParty(); await wait(600);
    }
  }
  function checkEnd() {
    if (!alive(B.enemies).length) { finishBattle(true); return true; }
    if (!alive(B.allies).length) { finishBattle(false); return true; }
    return false;
  }
  async function finishBattle(win) {
    B.over = true; B.pick = null; $('acts').innerHTML = '';
    const b = B;
    if (win) {
      AUDIO.sfx('victory');
      const xp = b.enemies.reduce((a, e) => a + e.xp, 0), money = b.enemies.reduce((a, e) => a + e.money, 0);
      const bonus = b.enemies[0] && b.enemies[0].lv > S.lv ? 1.4 : 1;
      // persist hp/mp
      b.allies.forEach(a => { S.hp[a.id] = Math.max(1, Math.round(a.hp + (S.diff === 'story' ? a.maxhp : a.maxhp * .25))); S.mp[a.id] = Math.round(Math.min(a.maxmp, a.mp + a.maxmp * .25)); if (S.hp[a.id] > a.maxhp) S.hp[a.id] = a.maxhp; });
      S.money += money; const lv0 = S.lv; gainXp(Math.round(xp * bonus));
      let drop = ''; if (Math.random() < .35) { const it = pickRand(['tonico', 'tonico', 'etere', 'bomba', 'fenice']); S.items[it] = (S.items[it] || 0) + 1; drop = `<br>Trovato: <b>${ITEMS[it].name}</b>`; }
      if (S.lv > lv0) AUDIO.sfx('levelup');
      const o = overlay(`<div style="margin-top:28vh;text-align:center"><h1>Vittoria!</h1><div class="card" style="text-align:center">+${Math.round(xp * bonus)} XP · +${money} Lumen${drop}${S.lv > lv0 ? `<br><b style="font-size:20px">✦ Livello ${S.lv}! ✦</b>` : ''}<div class="bar xp" style="margin-top:10px"><i style="width:${100 * S.xp / xpNeed(S.lv)}%"></i></div></div><button class="btn" id="vk">Continua</button></div>`);
      o.style.background = 'rgba(4,3,12,.6)';
      await new Promise(r => $('vk').onclick = r);
      closeOverlay(); R.mode = 'scene'; B = null; cv.onclick = null; AUDIO.play(b.prevMusic); b.resolve('win');
    } else {
      const o = overlay(`<div style="margin-top:24vh;text-align:center"><h1>Sconfitta</h1><div class="card">La notte si richiude su di voi... ma il viaggio non è finito.</div><button class="btn" id="rt">Riprova</button><button class="btn" id="rte">Riprova (modalità Storia)</button>${b.canLose ? '<button class="btn" id="rtx">Ritirati</button>' : ''}</div>`);
      const retry = () => { closeOverlay(); S.hp = b.pre.hp; S.mp = b.pre.mp; S.items = b.pre.items; B = null; battle(b.bid, b.canLose).then(b.resolve); };
      $('rt').onclick = retry; $('rte').onclick = () => { S.diff = 'story'; toast('Modalità Storia attiva (cambiabile in Opzioni)'); retry(); };
      if (b.canLose) $('rtx').onclick = () => { closeOverlay(); S.hp = b.pre.hp; S.mp = b.pre.mp; S.party.forEach(id => { if (!(S.hp[id] > 0)) S.hp[id] = 1; }); B = null; cv.onclick = null; AUDIO.play(b.prevMusic); b.resolve('lose'); };
    }
  }

  // ---------- endings ----------
  async function showEnding(id) {
    P.endings[id] = { at: Date.now(), lv: S.lv }; saveP(); LS.set('save_auto', null);
    R.portrait = null; show('tb', false); R.mode = 'scene'; setTop();
    await playCine('end_' + id);
    const n = Object.keys(P.endings).length;
    await titleCard(ENDINGS[id] || id, `Finale ${n} di 7 scoperti`, 'Fine');
    const h = Math.floor(S.time / 3600), m = Math.floor(S.time / 60) % 60;
    const o = overlay(`<h1>${ENDINGS[id]}</h1><div class="card" style="text-align:center">Tempo di gioco: <b>${h}h ${m}m</b> · Livello ${S.lv}<br>Finali scoperti: <b>${n}/7</b></div>
      <div class="card"><b>Grazie per aver viaggiato sulla Libellula.</b><br><br>Ogni scelta cambia la rotta: prova a risparmiare chi hai condannato, a fidarti di chi hai respinto, o a cedere all'oscurità. Con <i>Nuova Partita+</i> mantieni livello e oggetti, e il pulsante SALTA scorre il testo già letto.</div>
      <h3>Finali</h3>${Object.entries(ENDINGS).map(([k, v]) => `<div class="card">${P.endings[k] ? '✦ <b>' + v + '</b>' : '🔒 ???'}</div>`).join('')}
      <button class="btn" id="eg">Torna al titolo</button>`);
    $('eg').onclick = () => { closeOverlay(); titleScreen(); };
  }

  // ---------- menus ----------
  $('menuBtn').onclick = () => { AUDIO.sfx('select'); openMenu('gruppo'); };
  function openMenu(tab) {
    const tabs = { mappa: 'Mappa', gruppo: 'Gruppo', legami: 'Legami', oggetti: 'Oggetti', codex: 'Codex', salva: 'Salva/Carica', opzioni: 'Opzioni' };
    if (tab === 'mappa') { closeOverlay(); showWorld(S.ch, S.ch, false); return; }
    const body = { gruppo: menuParty, legami: menuBonds, oggetti: menuItems, codex: menuCodex, salva: menuSave, opzioni: menuOptions }[tab]();
    const o = overlay(`<div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${v}</button>`).join('')}</div>${body}<button class="btn" id="mx">Chiudi</button><button class="btn small" id="mtitle">Torna al titolo</button>`);
    o.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { AUDIO.sfx('select'); openMenu(b.dataset.t); });
    $('mx').onclick = () => { closeOverlay(); if (R.mode === 'map') renderMapNodes(); };
    $('mtitle').onclick = async () => { if (await ask('Tornare al titolo? Il gioco ha salvato automaticamente all\'inizio della scena.')) { runId++; closeOverlay(); titleScreen(); } };
    bindMenu(tab, o);
  }
  function menuParty() {
    const h = Math.floor(S.time / 3600), m = Math.floor(S.time / 60) % 60;
    return `<h1>Gruppo</h1><div class="card"><div class="row"><span>Livello <b>${S.lv}</b></span><span>${S.money} Lumen</span><span>${h}h ${m}m</span></div><div class="bar xp"><i style="width:${100 * S.xp / xpNeed(S.lv)}%"></i></div><small>XP ${S.xp}/${xpNeed(S.lv)}</small></div>` +
      S.party.map(id => { const s = stats(id); const act = S.active.includes(id); return `<div class="card"><div class="row"><b>${NAMES[id]}</b>${id === 'mira' ? '<small>capitana</small>' : `<button class="btn small" style="width:auto;padding:6px 12px;margin:0" data-act="${id}">${act ? 'In squadra ✓' : 'Riserva'}</button>`}</div><div class="bar"><i style="width:${100 * (S.hp[id] ?? s.hp) / s.hp}%"></i></div><small>Salute ${S.hp[id] ?? s.hp}/${s.hp} · Etere ${S.mp[id] ?? s.mp}/${s.mp} · Att ${s.atk} · Dif ${s.def} · Mag ${s.mag} · Vel ${s.spd}</small><br><small style="color:var(--dim)">${SKILLS[id].map(k => k.lv <= S.lv ? k.n : `🔒 ${k.n} (liv.${k.lv})`).join(' · ')}</small></div>`; }).join('') +
      `<div class="small-note">Massimo 4 in squadra durante i combattimenti.</div>`;
  }
  const BIO = { kai: 'Rōnin di Akatsuki. Lingua tagliente, lama più tagliente.', otto: 'Meccanica geniale, ex-ingegnera dell\'Armata.', bram: 'Automa guardiano del Giardino dei Giganti.', nuvola: 'Bambina-spirito fatta di nube.', sable: 'Ladra elegante. Non fidarti. O forse sì.' };
  function menuBonds() {
    const ids = ['kai', 'otto', 'bram', 'nuvola', 'sable'].filter(id => S.met[id]);
    return `<h1>Legami</h1>` + (ids.length ? ids.map(id => { const v = Math.max(0, Math.min(10, S.aff[id] || 0)); return `<div class="card"><div class="row"><b>${NAMES[id]}</b><span class="hearts">${'♥'.repeat(Math.round(v / 2))}${'♡'.repeat(5 - Math.round(v / 2))}</span></div><small>${BIO[id]}${S.party.includes(id) ? '' : ' <i>(non è con voi)</i>'}</small></div>`; }).join('') : '<div class="card">Nessun legame... ancora.</div>') +
      (S.flags.dark ? `<div class="card"><div class="row"><b style="color:#c08aff">Oscurità</b><span style="color:#c08aff">${'◆'.repeat(Math.min(10, S.flags.dark))}</span></div><small>Le scelte crudeli lasciano un segno.</small></div>` : '');
  }
  function menuItems() {
    const ks = Object.keys(S.items).filter(k => S.items[k] > 0);
    return `<h1>Oggetti</h1>` + (ks.length ? ks.map(k => `<div class="card"><div class="row"><div><b>${ITEMS[k].name}</b> ×${S.items[k]}<br><small>${ITEMS[k].desc}</small></div>${['tonico', 'te', 'etere', 'fenice'].includes(k) ? `<button class="btn small" style="width:auto;padding:8px 12px;margin:0" data-use="${k}">Usa</button>` : ''}</div></div>`).join('') : '<div class="card">Borsa vuota.</div>');
  }
  function menuCodex() {
    const ks = Object.keys(LORE).filter(k => S.lore[k]);
    return `<h1>Codex</h1><div class="small-note">${ks.length}/${Object.keys(LORE).length} voci scoperte</div>` + ks.map(k => `<div class="card"><b>${LORE[k].title}</b><br>${LORE[k].text}</div>`).join('');
  }
  function menuSave() {
    let h = `<h1>Salva / Carica</h1>`;
    for (let i = 1; i <= 3; i++) { const d = LS.get('save_' + i, null); h += `<div class="card">${describeSave(d)}<div class="row" style="margin-top:8px"><button class="btn small" data-save="${i}">Salva qui</button><button class="btn small" data-load="${i}" ${d ? '' : 'disabled'}>Carica</button></div></div>`; }
    return h + `<div class="small-note">Il gioco salva anche automaticamente all'inizio di ogni scena.</div>`;
  }
  function menuOptions() {
    return `<h1>Opzioni</h1><div class="card">Velocità testo<input type="range" min="10" max="70" value="${P.set.speed}" id="oSp"></div><div class="card">Velocità Auto<input type="range" min=".5" max="2.5" step=".1" value="${P.set.auto}" id="oAu"></div><div class="card">Musica<input type="range" min="0" max="1" step=".05" value="${P.set.music}" id="oMu"></div><div class="card">Effetti<input type="range" min="0" max="1" step=".05" value="${P.set.sfx}" id="oSf"></div>
      ${S ? `<div class="card"><div class="row"><span>Difficoltà</span><button class="btn small" style="width:auto;margin:0;padding:8px 14px" id="oDf">${S.diff === 'story' ? 'Storia (facile)' : 'Normale'}</button></div></div>` : ''}
      <div class="small-note">Se non senti audio su iPhone, controlla che l'interruttore silenzioso sia disattivato.</div>`;
  }
  function bindMenu(tab, o) {
    o.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const id = b.dataset.act; if (S.active.includes(id)) S.active = S.active.filter(x => x !== id); else if (S.active.length < 4) S.active.push(id); else toast('Squadra piena (4)'); openMenu('gruppo'); });
    o.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
      const k = b.dataset.use; const tg = S.party;
      if (k === 'te') { tg.forEach(id => { const s = stats(id); S.hp[id] = Math.min(s.hp, (S.hp[id] ?? s.hp) + s.hp * .35 | 0); }); S.items[k]--; AUDIO.sfx('heal'); return openMenu('oggetti'); }
      const list = overlay(`<h1>Su chi?</h1>${tg.map(id => { const s = stats(id); return `<button class="btn" data-on="${id}">${NAMES[id]} — ${S.hp[id] ?? s.hp}/${s.hp} · ✦${S.mp[id] ?? s.mp}/${s.mp}</button>`; }).join('')}<button class="btn small" id="cx">Annulla</button>`);
      list.querySelectorAll('[data-on]').forEach(x => x.onclick = () => { const id = x.dataset.on, s = stats(id); if (k === 'tonico' || k === 'fenice') S.hp[id] = Math.min(s.hp, (S.hp[id] ?? s.hp) + s.hp * .5 | 0); if (k === 'etere') S.mp[id] = Math.min(s.mp, (S.mp[id] ?? s.mp) + s.mp * .5 | 0); S.items[k]--; AUDIO.sfx('heal'); openMenu('oggetti'); });
      $('cx').onclick = () => openMenu('oggetti');
    });
    o.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { saveSlot(b.dataset.save); openMenu('salva'); });
    o.querySelectorAll('[data-load]').forEach(b => b.onclick = async () => { const d = LS.get('save_' + b.dataset.load, null); if (d && await ask('Caricare questa partita?')) { runId++; loadState(d); } });
    bindOptions();
  }
  function bindOptions() {
    const sp = $('oSp'); if (!sp) return;
    sp.oninput = () => { P.set.speed = +sp.value; saveP(); };
    $('oAu').oninput = () => { P.set.auto = +$('oAu').value; saveP(); };
    $('oMu').oninput = () => { P.set.music = +$('oMu').value; AUDIO.setVol(P.set.music, P.set.sfx); saveP(); };
    $('oSf').oninput = () => { P.set.sfx = +$('oSf').value; AUDIO.setVol(P.set.music, P.set.sfx); AUDIO.sfx('select'); saveP(); };
    const df = $('oDf'); if (df) df.onclick = () => { S.diff = S.diff === 'story' ? 'normal' : 'story'; df.textContent = S.diff === 'story' ? 'Storia (facile)' : 'Normale'; };
  }

  // ---------- title ----------
  function titleScreen() {
    runId++; cancelDialog(); R.mode = 'title'; B = null; cv.onclick = null; setTop(); show('tb', false); show('map', false); $('mapHead').innerHTML = ''; $('bt').innerHTML = ''; $('ch').innerHTML = ''; R.portrait = null; R.pShown = null; R.fadeTarget = 0;
    setBg('lutece_night'); AUDIO.play('title');
    const auto = LS.get('save_auto', null); const ends = Object.keys(P.endings).length;
    const o = $('ovl'); o.innerHTML = '';
    const d = el('div', '', `<div class="logo"><h1>ROTTA<br>D'AURORA</h1><p>Un viaggio verso l'alba</p></div><div class="menu">
      ${auto ? `<button class="btn" id="tCont">Continua<br><small style="color:var(--dim)">${describeSave(auto).replace(/<br>/, ' · ')}</small></button>` : ''}
      <button class="btn" id="tNew">Nuova partita</button>
      ${ends ? `<button class="btn" id="tNg">Nuova Partita+ <small>(mantieni livello e oggetti)</small></button>` : ''}
      <button class="btn small" id="tLoad">Carica</button>
      <button class="btn small" id="tExtra">Finali (${ends}/7) e Opzioni</button></div>`);
    d.id = 'title'; o.appendChild(d); offBadge();
    const go = fn => () => { AUDIO.init(); AUDIO.sfx('choice'); fn(); };
    if (auto) $('tCont').onclick = go(() => loadState(auto));
    $('tNew').onclick = go(async () => { if (auto && !(await ask('Iniziare una nuova partita? Il salvataggio automatico verrà sostituito (gli slot manuali restano).'))) return; newGame(); });
    if (ends) $('tNg').onclick = go(() => { const base = auto || LS.get('save_1', null); newGame(base ? { lv: Math.max(base.lv, 1), items: base.items, money: base.money } : null); });
    $('tLoad').onclick = go(() => { let h = '<h1>Carica</h1>'; for (let i = 1; i <= 3; i++) { const sd = LS.get('save_' + i, null); h += `<div class="card">${describeSave(sd)}${sd ? `<button class="btn small" data-l="${i}">Carica</button>` : ''}</div>`; } const ov = overlay(h + '<button class="btn" id="lx">Indietro</button>'); ov.querySelectorAll('[data-l]').forEach(b => b.onclick = () => loadState(LS.get('save_' + b.dataset.l))); $('lx').onclick = titleScreen; });
    $('tExtra').onclick = go(() => { const ov = overlay(`<h1>Finali</h1>${Object.entries(ENDINGS).map(([k, v]) => `<div class="card">${P.endings[k] ? '✦ <b>' + v + '</b>' : '🔒 ???'}</div>`).join('')}${menuOptions()}<button class="btn" id="ex">Indietro</button>`); bindOptions(); $('ex').onclick = titleScreen; });
  }
  // stato offline (dal service worker)
  let OFF = null;
  function offBadge() {
    const t = document.querySelector('#title .menu'); if (!t || location.protocol !== 'https:') return;
    let b = document.getElementById('offB'); if (!b) { b = el('div', ''); b.id = 'offB'; t.appendChild(b); }
    b.textContent = !OFF ? 'Preparazione per l\'offline…' : OFF.err ? 'Offline non disponibile' : OFF.cached >= OFF.total ? '✓ Pronto per giocare offline' : `Download per l'offline: ${OFF.cached}/${OFF.total}`;
    b.style.cssText = 'font-size:12px;text-align:center;margin-top:6px;color:' + (OFF && !OFF.err && OFF.cached >= OFF.total ? '#8fe3b0' : 'var(--dim)');
  }
  function newGame(ng) {
    S = fresh(); if (ng) { S.lv = ng.lv; S.items = Object.assign({}, ng.items); S.money = ng.money; S.ng = 1; }
    healAll(); closeOverlay(); LOG.length = 0;
    startChapter('c1');
  }

  function boot() {
    addEventListener('resize', () => setTimeout(resize, 100)); resize();
    AUDIO.setVol(P.set.music, P.set.sfx);
    const d = el('div', '', `<div class="logo"><h1>ROTTA<br>D'AURORA</h1><p>Un viaggio verso l'alba</p></div><div class="tap">TOCCA PER INIZIARE</div>`); d.id = 'title';
    setBg('lutece_night'); requestAnimationFrame(frame);
    $('ovl').appendChild(d); d.onclick = () => { AUDIO.init(); AUDIO.play('title'); titleScreen(); };
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'status') { OFF = e.data; offBadge(); } });
      const ask = () => navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('status'));
      navigator.serviceWorker.register('sw.js').then(ask).catch(() => { OFF = { err: 1 }; offBadge(); });
      // aggiornamento: se c'era già una versione, ricarica appena sei al titolo (mai a metà partita)
      const had = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        ask(); if (!had) return; autosave();
        const go = () => { if (R.mode === 'title') location.reload(); else setTimeout(go, 3000); }; go();
      });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) { autosave(); } });
    // debug hooks
    window.__G = { get S() { return S; }, openMapAt: (ch) => { S.ch = ch; openMap(); }, CH, SCENES, runScene: (id) => runScene(id, null), startChapter, newGame, fresh: () => { S = fresh(); healAll(); }, openMap, battle, gainXp, healAll, get R() { return R; }, visible: () => visibleNodes(), isDone: n => isDone(n), enter: id => { const n = CH[S.ch].map.nodes.find(x => x.id === id); if (n) enterNode(n, isDone(n)); }, playCine, CINE };
  }
  return { chapter, boot, cine, ending: () => { } };
})();

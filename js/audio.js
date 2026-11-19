// ROTTA D'AURORA — procedural music & SFX (Web Audio, no files)
'use strict';
const AUDIO = (() => {
  let ac = null, master, musicBus, sfxBus, verb, verbSend;
  let musicVol = .55, sfxVol = .8;
  const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], in: [0, 1, 5, 7, 8, 12, 13] };
  const THEMES = {
    title: { root: 50, sc: 'dorian', bpm: 70, prog: [0, 3, 5, 4], ins: ['pad', 'harp', 'bell'], lead: 'bell', dens: .45 },
    lutece: { root: 53, sc: 'major', bpm: 84, prog: [0, 5, 3, 4, 0, 5, 1, 4], ins: ['pad', 'waltz', 'bass'], lead: 'music_box', dens: .6, meter: 3 },
    rust: { root: 52, sc: 'minor', bpm: 100, prog: [0, 0, 5, 6], ins: ['bass', 'drums_metal', 'arp'], lead: 'square', dens: .5 },
    garden: { root: 57, sc: 'lydian', bpm: 66, prog: [0, 1, 0, 4], ins: ['pad', 'harp', 'bell'], lead: 'bell', dens: .35 },
    market: { root: 50, sc: 'phrygian', bpm: 108, prog: [0, 1, 0, 6], ins: ['bass', 'pluck', 'drums_hand'], lead: 'koto', dens: .7 },
    choir: { root: 48, sc: 'minor', bpm: 60, prog: [0, 5, 3, 4], ins: ['organ', 'choir'], lead: 'choir', dens: .3 },
    storm: { root: 47, sc: 'minor', bpm: 120, prog: [0, 5, 6, 4], ins: ['pad', 'bass_pulse', 'drums'], lead: 'saw', dens: .55 },
    silence: { root: 52, sc: 'minor', bpm: 54, prog: [0, 3, 5, 4], ins: ['pad', 'piano'], lead: 'piano', dens: .3 },
    akatsuki: { root: 50, sc: 'in', bpm: 90, prog: [0, 0, 3, 4], ins: ['koto_arp', 'taiko', 'pad'], lead: 'koto', dens: .55 },
    throne: { root: 49, sc: 'harm', bpm: 72, prog: [0, 5, 1, 4], ins: ['organ', 'pad', 'taiko'], lead: 'saw', dens: .4 },
    battle: { root: 57, sc: 'minor', bpm: 140, prog: [0, 5, 6, 4], ins: ['bass_pulse', 'drums', 'arp'], lead: 'square', dens: .7 },
    boss: { root: 50, sc: 'harm', bpm: 150, prog: [0, 0, 5, 4, 0, 0, 6, 4], ins: ['bass_pulse', 'drums', 'organ', 'arp'], lead: 'saw', dens: .75 },
    camp: { root: 55, sc: 'major', bpm: 72, prog: [0, 3, 0, 4], ins: ['pad', 'guitar'], lead: 'harp', dens: .4 },
    dawn: { root: 50, sc: 'major', bpm: 76, prog: [0, 4, 5, 3], ins: ['pad', 'harp', 'bell', 'bass'], lead: 'bell', dens: .5 },
    sad: { root: 46, sc: 'minor', bpm: 58, prog: [0, 5, 3, 4], ins: ['pad', 'piano'], lead: 'piano', dens: .3 },
    tension: { root: 49, sc: 'minor', bpm: 92, prog: [0, 1, 0, 1], ins: ['pad', 'bass_pulse'], lead: null, dens: .2 },
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 4; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = musicVol; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
    verb = ac.createConvolver(); const len = ac.sampleRate * 2.8, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = buf; verbSend = ac.createGain(); verbSend.gain.value = .35; verbSend.connect(verb); verb.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    setInterval(tick, 30);
  }
  let noiseBuf;
  function out(node, bus, wet = .3) { node.connect(bus); if (wet) { const s = ac.createGain(); s.gain.value = wet; node.connect(s); s.connect(verbSend); } }
  function env(g, t, a, d, peak, sus = 0, rel = .1) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(.0001, sus || .0001), t + a + d); if (sus) g.gain.exponentialRampToValueAtTime(.0001, t + a + d + rel); }
  function osc(type, f, t, dur, vel, bus, o = {}) {
    const os = ac.createOscillator(), g = ac.createGain(); os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.det) os.detune.value = o.det; if (o.glide) os.frequency.exponentialRampToValueAtTime(o.glide, t + dur);
    let node = os;
    if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.setValueAtTime(o.lp, t); if (o.lpEnd) f2.frequency.exponentialRampToValueAtTime(o.lpEnd, t + dur); f2.Q.value = o.q || 1; os.connect(f2); node = f2; }
    node.connect(g); out(g, bus, o.wet ?? .3);
    const a = o.a ?? .005;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vel, t + a);
    if (o.hold) { g.gain.setValueAtTime(vel, t + dur - (o.r || .3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
    else g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    os.start(t); os.stop(t + dur + .05);
  }
  function noise(t, dur, vel, bus, o = {}) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.setValueAtTime(o.f || 6000, t); if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + dur); f.Q.value = o.q || .7;
    const g = ac.createGain(); s.connect(f); f.connect(g); out(g, bus, o.wet ?? .1);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vel, t + (o.a || .002)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.start(t); s.stop(t + dur + .05);
  }
  const INS = {
    pad: (f, t, d, v) => { [-7, 7].forEach(det => osc('sawtooth', f, t, d, v * .05, musicBus, { det, lp: 900, a: d * .35, hold: 1, r: d * .4, wet: .6 })); },
    organ: (f, t, d, v) => { [1, 2, 3, 4].forEach((h, i) => osc('sine', f * h, t, d, v * .06 / (i + 1), musicBus, { a: .05, hold: 1, r: .2, wet: .6 })); },
    choir: (f, t, d, v) => { [-10, 0, 10].forEach(det => osc('sawtooth', f, t, d, v * .025, musicBus, { det, lp: 1400, q: 6, a: .4, hold: 1, r: .6, wet: .8 })); },
    harp: (f, t, d, v) => osc('triangle', f, t, Math.min(2.5, d * 3), v * .16, musicBus, { lp: 3000, lpEnd: 600, wet: .45 }),
    pluck: (f, t, d, v) => osc('sawtooth', f, t, .4, v * .08, musicBus, { lp: 2400, lpEnd: 300, wet: .3 }),
    koto: (f, t, d, v) => { osc('sawtooth', f, t, .9, v * .1, musicBus, { lp: 3500, lpEnd: 500, q: 3, wet: .4 }); osc('sine', f * 2, t, .3, v * .04, musicBus, { wet: .3 }); },
    bell: (f, t, d, v) => { osc('sine', f * 2, t, 2.2, v * .1, musicBus, { wet: .6 }); osc('sine', f * 5.4, t, .8, v * .03, musicBus, { wet: .6 }); },
    music_box: (f, t, d, v) => { osc('sine', f * 2, t, 1.4, v * .12, musicBus, { wet: .5 }); osc('triangle', f * 4, t, .3, v * .03, musicBus, { wet: .5 }); },
    piano: (f, t, d, v) => { osc('triangle', f, t, 2.4, v * .14, musicBus, { lp: 2500, lpEnd: 400, wet: .5 }); osc('sine', f * 2, t, 1.2, v * .04, musicBus, { wet: .5 }); },
    guitar: (f, t, d, v) => osc('triangle', f, t, 1.2, v * .12, musicBus, { lp: 1800, lpEnd: 400, wet: .3 }),
    square: (f, t, d, v) => osc('square', f, t, d * .9, v * .05, musicBus, { lp: 2200, wet: .3 }),
    saw: (f, t, d, v) => osc('sawtooth', f, t, d * .95, v * .06, musicBus, { lp: 1800, a: .03, wet: .4 }),
    bass: (f, t, d, v) => osc('triangle', f / 2, t, d * .9, v * .22, musicBus, { lp: 600, wet: .05 }),
  };
  function drum(kind, t, v) {
    switch (kind) {
      case 'kick': osc('sine', 120, t, .3, v * .5, musicBus, { glide: 40, wet: 0 }); break;
      case 'snare': noise(t, .18, v * .18, musicBus, { f: 1800, wet: .2 }); osc('triangle', 190, t, .1, v * .1, musicBus, { wet: 0 }); break;
      case 'hat': noise(t, .05, v * .07, musicBus, { f: 8000, wet: 0 }); break;
      case 'metal': noise(t, .25, v * .08, musicBus, { type: 'bandpass', f: 3200, q: 12, wet: .3 }); osc('square', 523, t, .08, v * .02, musicBus, { wet: .2 }); break;
      case 'taiko': osc('sine', 90, t, .6, v * .5, musicBus, { glide: 50, wet: .3 }); noise(t, .08, v * .1, musicBus, { type: 'lowpass', f: 900, wet: .2 }); break;
      case 'hand': osc('sine', 300, t, .15, v * .2, musicBus, { glide: 180, wet: .2 }); break;
    }
  }
  // sequencer
  let theme = null, themeId = null, nextT = 0, step = 0, motif = [], fade = null;
  function makeMotif(seed) { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; const m = []; let p = 2; for (let i = 0; i < 16; i++) { p = Math.max(0, Math.min(6, p + Math.round((r() - .5) * 3))); m.push(r() < .7 ? p : null); } return m; }
  function play(id) {
    if (!ac) { pendingTheme = id; return; }
    if (id === themeId) return;
    themeId = id; const th = THEMES[id];
    const now = ac.currentTime;
    musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value, now); musicBus.gain.linearRampToValueAtTime(.0001, now + .6);
    setTimeout(() => { if (themeId !== id) return; theme = th; step = 0; nextT = ac.currentTime + .1; motif = th ? makeMotif(id.length * 131 + id.charCodeAt(0)) : []; musicBus.gain.cancelScheduledValues(ac.currentTime); musicBus.gain.setValueAtTime(.0001, ac.currentTime); musicBus.gain.linearRampToValueAtTime(musicVol, ac.currentTime + 1.2); }, 650);
  }
  let pendingTheme = null;
  function tick() {
    if (!ac || !theme || ac.state !== 'running') return;
    const th = theme, sc = SC[th.sc], meter = th.meter || 4, s16 = 60 / th.bpm / 4;
    while (nextT < ac.currentTime + .15) {
      const stepsPerBar = meter * 4, bar = Math.floor(step / stepsPerBar), sb = step % stepsPerBar;
      const deg = th.prog[bar % th.prog.length];
      const note = (d, oct = 0) => { const L = sc.length; const i = ((d % L) + L) % L; return th.root + sc[i] + 12 * (Math.floor(d / L) + oct); };
      const chord = [note(deg), note(deg + 2), note(deg + 4)];
      const t = nextT, barDur = s16 * stepsPerBar;
      const has = k => th.ins.includes(k);
      if (sb === 0) {
        if (has('pad')) chord.forEach(n => INS.pad(mtof(n), t, barDur, 1));
        if (has('organ')) chord.forEach(n => INS.organ(mtof(n), t, barDur, 1));
        if (has('choir')) chord.forEach(n => INS.choir(mtof(n + 12), t, barDur, 1));
      }
      if (has('bass') && (sb === 0 || (meter === 4 && sb === 8))) INS.bass(mtof(chord[0] - 12), t, s16 * 7, 1);
      if (has('bass_pulse') && sb % 2 === 0) INS.bass(mtof(chord[0] - 12), t, s16 * 1.6, sb % 4 === 0 ? 1 : .6);
      if (has('waltz')) { if (sb === 0) INS.bass(mtof(chord[0] - 12), t, s16 * 3, 1); if (sb === 4 || sb === 8) chord.forEach(n => INS.harp(mtof(n + 12), t, s16 * 2, .5)); }
      if (has('harp') && sb % 2 === 0) { const i = (sb / 2) % 4; INS.harp(mtof([chord[0], chord[1], chord[2], chord[1] + 12][i] + 12), t, s16 * 2, .7); }
      if (has('arp') && sb % 1 === 0 && sb % 2 === 0) INS.pluck(mtof(chord[(sb / 2) % 3] + 12 + (sb > 7 ? 12 : 0)), t, s16, .8);
      if (has('koto_arp') && sb % 2 === 0 && Math.random() < .8) INS.koto(mtof(chord[(sb / 2) % 3] + 12), t, s16, .7);
      if (has('pluck') && sb % 3 === 0) INS.pluck(mtof(chord[sb % 3] + 12), t, s16, .7);
      if (has('guitar') && sb % 2 === 0) INS.guitar(mtof(chord[(sb / 2) % 3] + (sb >= 8 ? 12 : 0)), t, s16 * 2, .8);
      if (has('piano') && sb % 4 === 0) INS.piano(mtof(chord[(sb / 4) % 3]), t, s16 * 4, .7);
      if (has('drums')) { if (sb % 8 === 0) drum('kick', t, 1); if (sb % 8 === 4) drum('snare', t, 1); if (sb % 2 === 0) drum('hat', t, sb % 4 ? .5 : 1); if (sb === 14 && bar % 2) drum('kick', t, .7); }
      if (has('drums_metal')) { if (sb % 8 === 0) drum('kick', t, 1); if (sb % 8 === 4) drum('metal', t, 1); if (sb % 4 === 2) drum('hat', t, .6); }
      if (has('drums_hand')) { if ([0, 3, 6, 10, 12].includes(sb)) drum('hand', t, sb === 0 ? 1 : .6); if (sb % 2 === 1) drum('hat', t, .3); }
      if (has('taiko')) { if (sb === 0) drum('taiko', t, 1); if (sb === 10 && bar % 2) drum('taiko', t, .7); }
      // lead motif
      if (th.lead && sb % 2 === 0 && bar % 4 !== 3) {
        const mi = ((bar % 2) * 8 + sb / 2) % 16, m = motif[mi];
        if (m !== null && Math.random() < th.dens + .3) INS[th.lead](mtof(note(deg + m, 1)), t, s16 * 2, .8);
      }
      nextT += s16 * (sb % 2 === 1 && th.swing ? 1.2 : 1); step++;
    }
  }
  // SFX
  const sfxF = {
    tick: () => osc('sine', 1800 + Math.random() * 300, ac.currentTime, .06, .05, sfxBus, { wet: .2 }),
    choice: () => { const t = ac.currentTime; osc('sine', 1318, t, .4, .1, sfxBus, { wet: .5 }); osc('sine', 1760, t + .07, .5, .08, sfxBus, { wet: .5 }); },
    select: () => osc('triangle', 880, ac.currentTime, .12, .08, sfxBus, { wet: .2 }),
    back: () => osc('triangle', 520, ac.currentTime, .12, .07, sfxBus, { wet: .2 }),
    love: () => { const t = ac.currentTime; [0, 4, 7, 12, 16].forEach((n, i) => osc('sine', mtof(76 + n), t + i * .06, .6, .07, sfxBus, { wet: .6 })); },
    dark: () => { const t = ac.currentTime; osc('sawtooth', 55, t, 1.6, .12, sfxBus, { lp: 400, wet: .8 }); osc('sawtooth', 58.3, t, 1.6, .1, sfxBus, { lp: 400, wet: .8 }); },
    swing: () => noise(ac.currentTime, .18, .25, sfxBus, { type: 'bandpass', f: 800, fEnd: 3000, q: 2, wet: .1 }),
    hit: () => { const t = ac.currentTime; noise(t, .15, .35, sfxBus, { type: 'lowpass', f: 2000, fEnd: 200, wet: .1 }); osc('sine', 160, t, .18, .3, sfxBus, { glide: 50, wet: 0 }); },
    crit: () => { const t = ac.currentTime; sfxF.hit(); osc('sine', 2093, t + .03, 1, .12, sfxBus, { wet: .6 }); },
    magic: () => { const t = ac.currentTime; for (let i = 0; i < 6; i++) osc('sine', 600 + i * 220, t + i * .03, .5, .05, sfxBus, { wet: .7 }); },
    heal: () => osc('sine', 440, ac.currentTime, .8, .1, sfxBus, { glide: 1320, wet: .7 }),
    enemyDie: () => { const t = ac.currentTime; noise(t, .8, .2, sfxBus, { type: 'bandpass', f: 3000, fEnd: 200, q: 3, wet: .6 }); osc('triangle', 330, t, .8, .08, sfxBus, { glide: 80, wet: .6 }); },
    victory: () => { const t = ac.currentTime; [[0, 0], [4, .12], [7, .24], [12, .36]].forEach(([n, d]) => osc('square', mtof(67 + n), t + d, n === 12 ? 1 : .2, .06, sfxBus, { lp: 3000, wet: .5 })); },
    levelup: () => { const t = ac.currentTime; [0, 4, 7, 11, 12, 16, 19, 24].forEach((n, i) => osc('triangle', mtof(72 + n), t + i * .07, .6, .07, sfxBus, { wet: .6 })); },
    map: () => { const t = ac.currentTime; noise(t, 1.2, .06, sfxBus, { type: 'bandpass', f: 400, fEnd: 1200, q: 1, a: .4, wet: .5 }); osc('sine', 1568, t + .3, 1.2, .06, sfxBus, { wet: .7 }); },
    chime: () => { const t = ac.currentTime; [0, 7, 12].forEach((n, i) => osc('sine', mtof(84 + n), t + i * .09, 1.2, .07, sfxBus, { wet: .7 })); },
    thunder: () => { const t = ac.currentTime; noise(t, 2.5, .5, sfxBus, { type: 'lowpass', f: 600, fEnd: 60, a: .05, wet: .6 }); },
    explosion: () => { const t = ac.currentTime; noise(t, 1.4, .6, sfxBus, { type: 'lowpass', f: 1500, fEnd: 50, wet: .4 }); osc('sine', 90, t, .8, .4, sfxBus, { glide: 30, wet: .2 }); },
    door: () => { const t = ac.currentTime; osc('sawtooth', 80, t, .6, .08, sfxBus, { lp: 300, glide: 60, wet: .4 }); noise(t + .4, .2, .2, sfxBus, { type: 'lowpass', f: 500, wet: .3 }); },
    wind: () => noise(ac.currentTime, 2.5, .12, sfxBus, { type: 'bandpass', f: 300, fEnd: 900, q: 2, a: .8, wet: .5 }),
    bell: () => { const t = ac.currentTime; osc('sine', 392, t, 3, .15, sfxBus, { wet: .8 }); osc('sine', 392 * 2.76, t, 1.5, .05, sfxBus, { wet: .8 }); },
    step: () => noise(ac.currentTime, .08, .12, sfxBus, { type: 'lowpass', f: 700, wet: .1 }),
    alarm: () => { const t = ac.currentTime; for (let i = 0; i < 4; i++) osc('square', i % 2 ? 660 : 880, t + i * .22, .2, .05, sfxBus, { lp: 2000, wet: .3 }); },
    buy: () => { const t = ac.currentTime; osc('square', 1318, t, .08, .04, sfxBus, { wet: .2 }); osc('square', 1760, t + .08, .2, .04, sfxBus, { wet: .2 }); },
    deny: () => osc('square', 140, ac.currentTime, .2, .05, sfxBus, { lp: 800, wet: .1 }),
    flash: () => osc('sine', 3000, ac.currentTime, .3, .05, sfxBus, { glide: 800, wet: .6 }),
  };
  function sfx(name) { if (!ac || !sfxF[name]) return; try { sfxF[name](); } catch (e) { } }
  const VOICE = { mira: 620, kai: 300, otto: 560, bram: 180, nuvola: 900, sable: 480, malachar: 220, vedova: 520, raiden: 200, revuoto: 110, elise: 500, grinza: 260, pip: 760, hanzo: 240 };
  let lastBlip = 0;
  function blip(id) { if (!ac || !id) return; const now = ac.currentTime; if (now - lastBlip < .055) return; lastBlip = now; const f = (VOICE[id] || 400) * (1 + (Math.random() - .5) * .12); osc(id === 'bram' ? 'square' : 'triangle', f, now, .045, .025, sfxBus, { lp: 2500, wet: .05 }); }
  function setVol(m, s) { musicVol = m; sfxVol = s; if (ac) { musicBus.gain.setValueAtTime(m, ac.currentTime); sfxBus.gain.value = s; } }
  function unlock() { init(); if (pendingTheme) { const p = pendingTheme; pendingTheme = null; play(p); } }
  return { init: unlock, play, sfx, blip, setVol, get theme() { return themeId; } };
})();

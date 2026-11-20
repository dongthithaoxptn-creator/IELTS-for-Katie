/* IELTS Studio — core: utilities, storage, spaced repetition, band maths, TTS */
window.App = window.App || { views: {}, data: {} };
App.data.bookSets = App.data.bookSets || [];
App.addBookSet = set => { const i = App.data.bookSets.findIndex(s => s.id === set.id); if (i >= 0) App.data.bookSets[i] = set; else App.data.bookSets.push(set); };
(function (App) {
  'use strict';

  /* ---------------- utilities ---------------- */
  const U = App.util = {
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => Array.from(r.querySelectorAll(s)),
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    pick(a, n) { return U.shuffle(a).slice(0, n); },
    rand(a) { return a[Math.floor(Math.random() * a.length)]; },
    dayKey(d = new Date()) { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); },
    daysBetween(a, b) { return Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5); },
    fmtDur(sec) { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? h + 'h ' + m + 'm' : m ? m + 'm' : sec + 's'; },
    fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); },
    fmtDate(ts) { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); },
    /* IELTS rounding: x.25 -> x.5, x.75 -> x+1 */
    roundBand(x) { return Math.round(x * 2 + 1e-9) / 2; },
    bandStr(b) { return b == null || isNaN(b) ? '–' : (+b).toFixed(1); },
    words(t) { return (String(t).trim().match(/[A-Za-z0-9][A-Za-z0-9'’\-]*/g) || []).length; },
    norm(s) { return String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' \-]/g, ' ').replace(/\s+/g, ' ').trim(); },
    toast(msg, ms = 2200) { const t = U.$('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms); },
    modal(html, onMount) {
      const m = U.$('#modal'); m.innerHTML = '<div class="box" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false;
      const close = () => { m.hidden = true; m.innerHTML = ''; };
      m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) close(); };
      if (onMount) onMount(m.firstChild, close);
      return close;
    },
    confirm(msg, yes = 'Yes') {
      return new Promise(res => {
        U.modal('<p>' + U.esc(msg) + '</p><div class="row mt" style="justify-content:flex-end"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="cfy">' + U.esc(yes) + '</button></div>',
          (box, close) => { box.querySelector('#cfy').onclick = () => { close(); res(true); }; box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => res(false))); });
      });
    },
    download(name, text, type = 'application/json') {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  };

  /* ---------------- icons (stroke icons) ---------------- */
  const P = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    vocab: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    read: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>',
    listen: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    write: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    speak: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    gear: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    sound: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    play: '<path d="M6 4l14 8-14 8z"/>', pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>', stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    check: '<path d="M20 6L9 17l-5-5"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>', fire: '<path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>'
  };
  App.icon = (n, cls = '') => '<svg class="ic ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';

  /* ---------------- storage ---------------- */
  const KEY = 'ielts-studio-v1';
  const defaults = () => ({
    v: 1, vocab: {}, saved: [], activity: {}, attempts: [], writing: [], speaking: [], dictCache: {}, notes: {},
    extra: { families: [], phrasal: [], colloc: [] },
    settings: { apiKey: '', model: 'claude-opus-5-5', target: 7, examDate: '', theme: 'auto', voice: '', rate: 0.95, quizSize: 10 },
    meta: { startDay: U.dayKey(), created: Date.now() }
  });
  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    const d = defaults();
    if (!s) return d;
    for (const k in d) if (s[k] == null) s[k] = d[k];
    s.settings = Object.assign(d.settings, s.settings);
    s.extra = Object.assign(d.extra, s.extra);
    return s;
  }
  let state = load();
  const S = App.store = {
    get s() { return state; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { U.toast('Could not save — storage full?'); } },
    day(k = U.dayKey()) { return state.activity[k] || (state.activity[k] = { sec: 0, learned: 0, reviewed: 0, correct: 0, tasks: 0 }); },
    addSeconds(sec) { S.day().sec += sec; S.save(); },
    exportJSON() { return JSON.stringify(state, null, 1); },
    importJSON(txt) { const o = JSON.parse(txt); if (!o || typeof o !== 'object' || !o.settings) throw new Error('Not an IELTS Studio backup file'); localStorage.setItem(KEY, JSON.stringify(o)); state = load(); },
    reset() { localStorage.removeItem(KEY); state = load(); },

    /* spaced repetition (Leitner boxes 1..6) */
    INTERVALS: [0, 1, 2, 4, 8, 16, 32],
    vs(id) { return state.vocab[id] || { box: 0 }; },
    isLearned(id) { return (state.vocab[id] || {}).box >= 1; },
    learn(id) {
      const v = state.vocab[id] || (state.vocab[id] = { box: 0, ok: 0, bad: 0 });
      if (!v.box) { v.box = 1; v.t = Date.now(); v.due = Date.now() + 864e5; S.day().learned++; }
      S.save();
    },
    unlearn(id) { delete state.vocab[id]; S.save(); },
    review(id, ok) {
      const v = state.vocab[id] || (state.vocab[id] = { box: 1, ok: 0, bad: 0, t: Date.now() });
      if (!v.box) { v.box = 1; v.t = Date.now(); }
      if (ok) { v.ok++; v.box = Math.min(6, v.box + 1); } else { v.bad++; v.box = 1; }
      v.last = Date.now(); v.due = Date.now() + S.INTERVALS[v.box] * 864e5;
      const d = S.day(); d.reviewed++; if (ok) d.correct++;
      S.save();
    },
    attempt(a) { a.ts = Date.now(); a.id = 'a' + a.ts; state.attempts.push(a); S.day().tasks++; S.save(); return a; }
  };

  /* ---------------- vocabulary units ---------------- */
  App.units = {
    list: [], byId: {}, wordIndex: {},
    build() {
      const L = [], B = {}, W = {};
      const fams = (App.data.families || []).concat(state.extra.families || []);
      fams.forEach(f => {
        const u = { id: 'f:' + f.r, kind: 'f', f, title: f.r, lv: f.lv || 'B2', topic: f.t || 'General' };
        if (B[u.id]) return; L.push(u); B[u.id] = u;
        f.m.forEach(m => { const k = m[0].toLowerCase(); if (!W[k]) W[k] = { w: m[0], pos: m[1], ipa: m[2], vi: m[3], ex: m[4], unit: u.id }; });
      });
      // sets organised by your books (loaded from vocab/sets.js or the imported vocab pack)
      (App.data.bookSets || []).forEach(set => set.units.forEach(un => un.i.forEach(it => {
        const ref = { set: set.id, n: un.n };
        if (set.kind === 'c') {
          const id = 'c:' + it[0];
          if (B[id]) { (B[id].refs = B[id].refs || []).push(ref); return; }
          const u = { id, kind: 'c', c: { c: it[0], vi: it[1], ex: it[2], ty: set.short + ' · Unit ' + un.n }, title: it[0], lv: set.lv || 'C1', topic: un.t, refs: [ref] };
          L.push(u); B[id] = u;
        } else {
          let id = 'p:' + it[0];
          if (B[id] && B[id].p.vi === it[1]) { (B[id].refs = B[id].refs || []).push(ref); return; }
          if (B[id]) id += '|' + set.id + '-' + un.n; // same verb, different meaning in another unit
          const u = { id, kind: 'p', p: { p: it[0], vi: it[1], d: it[2], ex: it[3] }, title: it[0], lv: set.lv || 'C1', topic: un.t, refs: [ref] };
          L.push(u); B[id] = u;
        }
      })));
      (App.data.phrasal || []).concat(state.extra.phrasal || []).forEach(p => {
        const u = { id: 'p:' + p.p, kind: 'p', p, title: p.p, lv: p.lv || 'B2', topic: 'Phrasal verbs' };
        if (!B[u.id]) { L.push(u); B[u.id] = u; }
      });
      (App.data.colloc || []).concat(state.extra.colloc || []).forEach(c => {
        const u = { id: 'c:' + c.c, kind: 'c', c, title: c.c, lv: c.lv || 'B2', topic: c.ty || 'Collocations' };
        if (!B[u.id]) { L.push(u); B[u.id] = u; }
      });
      this.list = L; this.byId = B; this.wordIndex = W;
    },
    of(kind) { return this.list.filter(u => u.kind === kind); },
    learned(kind) { return this.list.filter(u => (!kind || u.kind === kind) && S.isLearned(u.id)); },
    wordsLearned() { return this.learned().reduce((n, u) => n + (u.kind === 'f' ? u.f.m.length : 1), 0); },
    wordsTotal() { return this.list.reduce((n, u) => n + (u.kind === 'f' ? u.f.m.length : 1), 0); },
    due() { const now = Date.now(); return this.learned().filter(u => (S.vs(u.id).due || 0) <= now); }
  };

  /* ---------------- band maths ---------------- */
  const LIS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  const REA = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  const conv = (tbl, raw, total) => { const n = Math.round(raw / total * 40); for (const [min, b] of tbl) if (n >= min) return b; return 0; };
  App.bands = {
    listening: (raw, total) => conv(LIS, raw, total),
    reading: (raw, total) => conv(REA, raw, total),
    /* recency-weighted estimate from the most recent attempts of each skill */
    estimate() {
      const out = { counts: {} };
      ['listening', 'reading', 'writing', 'speaking'].forEach(sk => {
        const at = state.attempts.filter(a => a.skill === sk && a.band != null).slice(-6).reverse();
        out.counts[sk] = state.attempts.filter(a => a.skill === sk).length;
        if (!at.length) { out[sk] = null; return; }
        let sw = 0, sb = 0;
        at.forEach((a, i) => { const w = (6 - i) * (sk === 'writing' && a.task === 1 ? 0.5 : 1); sw += w; sb += w * a.band; });
        out[sk] = U.roundBand(sb / sw);
      });
      const have = ['listening', 'reading', 'writing', 'speaking'].filter(k => out[k] != null);
      out.overall = have.length ? U.roundBand(have.reduce((n, k) => n + out[k], 0) / have.length) : null;
      out.complete = have.length === 4;
      return out;
    },
    history(skill) { return state.attempts.filter(a => (!skill || a.skill === skill) && a.band != null); },
    cefr(b) { return b == null ? '' : b >= 8.5 ? 'C2' : b >= 7 ? 'C1' : b >= 5.5 ? 'B2' : b >= 4 ? 'B1' : 'A2'; }
  };

  /* ---------------- text to speech (British voices) ---------------- */
  const T = App.tts = {
    _voices: [],
    load() { if (!('speechSynthesis' in window)) return []; T._voices = speechSynthesis.getVoices(); return T._voices; },
    NOVELTY: /grandma|grandpa|rocko|bells|bubbles|jester|whisper|zarvox|trinoids|albert|bad news|good news|boing|cellos|organ|superstar|wobble|bahh/i,
    FEMALE: ['serena', 'kate', 'martha', 'stephanie', 'libby', 'sonia', 'google uk english female', 'flo', 'shelley', 'sandy'],
    MALE: ['daniel', 'arthur', 'oliver', 'ryan', 'google uk english male', 'eddy', 'reed'],
    gb() {
      const v = T._voices.length ? T._voices : T.load();
      let gb = v.filter(x => /en[-_]GB/i.test(x.lang) && !T.NOVELTY.test(x.name));
      if (!gb.length) gb = v.filter(x => /^en/i.test(x.lang) && !T.NOVELTY.test(x.name));
      const rank = x => { const n = x.name.toLowerCase(); const i = T.FEMALE.concat(T.MALE).findIndex(p => n.includes(p)); return i < 0 ? 50 : i; };
      return gb.sort((a, b) => rank(a) - rank(b));
    },
    /* voice(0): main voice (your choice, else a natural female UK voice); voice(1): a contrasting male UK voice */
    voice(i = 0) {
      const gb = T.gb(); if (!gb.length) return null;
      const pref = state.settings.voice && gb.find(v => v.name === state.settings.voice);
      const first = pref || gb[0];
      if (i === 0) return first;
      const isF = x => T.FEMALE.some(p => x.name.toLowerCase().includes(p));
      const contrast = gb.find(x => x !== first && isF(x) !== isF(first));
      return contrast || gb.find(x => x !== first) || first;
    },
    speak(text, opt = {}) {
      if (!('speechSynthesis' in window)) { U.toast('Speech is not supported on this browser'); return null; }
      if (!opt.queue) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = T.voice(opt.voice || 0); if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-GB'; u.rate = opt.rate || state.settings.rate || 0.95; u.pitch = opt.pitch || 1;
      if (opt.onend) u.onend = opt.onend; if (opt.onerror) u.onerror = opt.onerror;
      speechSynthesis.speak(u); return u;
    },
    stop() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  };
  if ('speechSynthesis' in window) { T.load(); speechSynthesis.onvoiceschanged = () => T.load(); }

  /* ---------------- active study timer ---------------- */
  let lastInput = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'touchstart', 'input'].forEach(e => window.addEventListener(e, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => {
    const speaking = 'speechSynthesis' in window && speechSynthesis.speaking;
    if (document.visibilityState === 'visible' && (Date.now() - lastInput < 120000 || speaking || App.busy)) S.addSeconds(15);
  }, 15000);

  /* ---------------- streak ---------------- */
  App.streak = function () {
    let n = 0; const d = new Date();
    const active = k => { const a = state.activity[k]; return a && (a.sec >= 60 || a.reviewed || a.tasks || a.learned); };
    if (!active(U.dayKey(d))) d.setDate(d.getDate() - 1);
    while (active(U.dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
})(window.App);

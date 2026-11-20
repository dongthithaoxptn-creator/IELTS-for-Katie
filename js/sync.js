/* Sync your progress between devices through a private GitHub repository.
   Each device keeps working offline; when online it reads the shared file, merges it with what is on this
   device (latest change wins per item, study time is added up per device, deletions are remembered) and
   writes the result back. The GitHub key stays on this device only (not in backups, never synced). */
(function (App) {
  'use strict';
  const U = App.util, S = App.store;
  const CFG = 'ielts-sync', DEV = 'ielts-device', FILE = 'katie-ielts-sync.json';
  const API = 'https://api.github.com';
  const DEFAULT_REPO = 'dongthithaoxptn-creator/katie-ielts-data';
  const LOCAL_ONLY = ['apiKey', 'voice']; // settings that stay on each device

  const cfg = () => { try { return JSON.parse(localStorage.getItem(CFG) || 'null') || {}; } catch (e) { return {}; } };
  const saveCfg = c => { try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) { /* ignore */ } };
  const device = () => {
    let d = null; try { d = localStorage.getItem(DEV); } catch (e) { /* ignore */ }
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); try { localStorage.setItem(DEV, d); } catch (e) { /* ignore */ } }
    return d;
  };

  /* ---------- GitHub contents API ---------- */
  function headers(token, raw) { return { Authorization: 'Bearer ' + token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }; }
  async function gh(c, path, opt = {}) {
    const r = await fetch(API + '/repos/' + c.repo + path, Object.assign({ cache: 'no-store' }, opt, { headers: Object.assign(headers(c.token, opt.raw), opt.headers || {}) }));
    if (r.status === 401) throw new Error('GitHub did not accept the key. Make a new key and paste it again.');
    if (r.status === 403 && !opt.okStatus) throw new Error('The key is not allowed to use ' + c.repo + '. Check it has “Contents: Read and write” for that repository.');
    return r;
  }
  function toB64(str) { const b = new TextEncoder().encode(str); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function fromB64(b64) { const s = atob(b64.replace(/\s/g, '')), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }
  async function pull(c) {
    const r = await gh(c, '/contents/' + FILE);
    if (r.status === 404) {
      const repo = await gh(c, ''); if (repo.status === 404) throw new Error('Can’t find the storage “' + c.repo + '”, or the key can’t see it.');
      return { sha: null, data: null };
    }
    if (!r.ok) throw new Error('GitHub error ' + r.status);
    const j = await r.json(); let text;
    if (j.content && j.encoding === 'base64') text = fromB64(j.content);
    else { const rr = await gh(c, '/contents/' + FILE, { raw: true }); text = await rr.text(); }
    return { sha: j.sha, data: JSON.parse(text) };
  }
  async function push(c, sha, data) {
    const body = { message: 'Sync from ' + (navigator.platform || 'device') + ' · ' + new Date().toISOString(), content: toB64(JSON.stringify(data)) };
    if (sha) body.sha = sha;
    const r = await gh(c, '/contents/' + FILE, { method: 'PUT', body: JSON.stringify(body), okStatus: true });
    if (r.status === 409 || r.status === 422) return { conflict: true };
    if (!r.ok) throw new Error('GitHub error ' + r.status + ' while saving');
    return { sha: (await r.json()).content.sha };
  }

  /* ---------- merging ---------- */
  const stampV = v => v ? v.u || Math.max(v.last || 0, v.t || 0) : 0;
  const gone = (G, kind, id, ts) => G[kind] && G[kind][id] != null && G[kind][id] >= (ts || 0);
  function mergeGone(a = {}, b = {}) {
    const out = {};
    ['notes', 'saved', 'vocab', 'w'].forEach(k => { out[k] = Object.assign({}, a[k]); Object.entries(b[k] || {}).forEach(([id, t]) => { if (!(out[k][id] >= t)) out[k][id] = t; }); });
    return out;
  }
  function byKey(listA, listB, keyOf, better) {
    const m = new Map();
    [...(listA || []), ...(listB || [])].forEach(x => { const k = keyOf(x); const cur = m.get(k); m.set(k, cur ? better(cur, x) : x); });
    return [...m.values()];
  }
  const fuller = (a, b) => (JSON.stringify(b).length > JSON.stringify(a).length ? b : a);
  function mergeAct(a = {}, b = {}) { // same device seen twice: keep the larger numbers per day
    const out = JSON.parse(JSON.stringify(a));
    Object.entries(b).forEach(([d, r]) => { const o = out[d] || (out[d] = {}); for (const f in r) o[f] = Math.max(o[f] || 0, r[f] || 0); });
    return out;
  }
  /* L: this device's state, R: the shared state (or null). Returns the merged shared state. */
  function merge(L, R, me) {
    R = R || {};
    const G = mergeGone(L.gone, R.gone);
    const out = { v: 1, gone: G };
    // words you learned: the most recent change to each word wins
    out.vocab = {};
    new Set([...Object.keys(L.vocab || {}), ...Object.keys(R.vocab || {})]).forEach(id => {
      const a = (L.vocab || {})[id], b = (R.vocab || {})[id], v = stampV(b) > stampV(a) ? b : a;
      if (v && !gone(G, 'vocab', id, stampV(v))) out.vocab[id] = v;
    });
    out.saved = byKey(L.saved, R.saved, x => String(x.w).toLowerCase(), (a, b) => ((b.t || 0) > (a.t || 0) ? b : a)).filter(x => !gone(G, 'saved', String(x.w).toLowerCase(), x.t));
    out.attempts = byKey(L.attempts, R.attempts, x => x.id || x.ts, (a) => a).sort((a, b) => a.ts - b.ts);
    out.writing = byKey(L.writing, R.writing, x => String(x.ts), fuller).filter(x => !gone(G, 'w', String(x.ts), 0)).sort((a, b) => a.ts - b.ts);
    out.speaking = byKey(L.speaking, R.speaking, x => String(x.ts), fuller).sort((a, b) => a.ts - b.ts);
    out.notes = {};
    new Set([...Object.keys(L.notes || {}), ...Object.keys(R.notes || {})]).forEach(k => {
      const a = (L.notes || {})[k], b = (R.notes || {})[k], n = (b && (!a || b.ts > a.ts)) ? b : a;
      if (n && !gone(G, 'notes', k, n.ts)) out.notes[k] = n;
    });
    const LE = L.extra || {}, RE = R.extra || {};
    out.extra = {
      families: byKey(LE.families, RE.families, x => x.r, a => a),
      phrasal: byKey(LE.phrasal, RE.phrasal, x => x.p, a => a),
      colloc: byKey(LE.colloc, RE.colloc, x => x.c, a => a)
    };
    const ls = L.settings || {}, rs = R.settings || {};
    out.settings = Object.assign({}, (rs._u || 0) > (ls._u || 0) ? rs : ls); LOCAL_ONLY.forEach(k => delete out.settings[k]);
    const lm = L.meta || {}, rm = R.meta || {};
    out.meta = { startDay: [lm.startDay, rm.startDay].filter(Boolean).sort()[0] || U.dayKey(), created: Math.min(lm.created || Date.now(), rm.created || Date.now()) };
    // study time is kept per device and added up when shown
    out.acts = Object.assign({}, R.acts || {});
    out.acts[me] = mergeAct(L.activity || {}, (R.acts || {})[me] || {});
    return out;
  }

  /* ---------- running a sync ---------- */
  let running = null, timer = null;
  const st = { status: 'idle', error: '', last: cfg().last || 0 };
  const listeners = new Set();
  const emit = () => listeners.forEach(f => { try { f(st); } catch (e) { /* ignore */ } });

  async function inkMerge(G, remoteInk) {
    const out = {};
    const local = App.ink ? await App.ink.exportAll() : {};
    new Set([...Object.keys(local), ...Object.keys(remoteInk || {})]).forEach(k => {
      const a = local[k], b = (remoteInk || {})[k], n = (b && (!a || (b.ts || 0) > (a.ts || 0))) ? b : a;
      if (n && !gone(G, 'notes', k, n.ts)) out[k] = n;
    });
    // bring this device up to date
    for (const k of Object.keys(out)) { if (!local[k] || (local[k].ts || 0) < (out[k].ts || 0)) await App.media.put('ink/' + k, out[k]); }
    for (const k of Object.keys(local)) { if (!out[k]) await App.media.del('ink/' + k); }
    return out;
  }
  function apply(m) {
    const s = S.s, me = device();
    const keepLocal = {}; LOCAL_ONLY.forEach(k => { keepLocal[k] = s.settings[k]; });
    ['vocab', 'saved', 'attempts', 'writing', 'speaking', 'notes', 'extra', 'gone'].forEach(k => { s[k] = m[k]; });
    s.settings = Object.assign({}, s.settings, m.settings, keepLocal);
    s.meta = Object.assign({}, s.meta, m.meta);
    s.activity = m.acts[me] || s.activity;
    s.acts = {}; Object.keys(m.acts).forEach(d => { if (d !== me) s.acts[d] = m.acts[d]; });
    S.save(true);
  }
  async function run(reason) {
    const c = cfg(); if (!c.token || !c.repo || !navigator.onLine) return st;
    if (running) return running;
    running = (async () => {
      st.status = 'syncing'; st.error = ''; emit();
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const remote = await pull(c);
          const R = remote.data || {};
          const merged = merge(S.s, R.state, device());
          const ink = await inkMerge(merged.gone, R.ink);
          const data = { app: 'katie-ielts', v: 1, ts: Date.now(), state: merged, ink };
          apply(merged);
          const res = await push(c, remote.sha, data);
          if (res.conflict) continue; // another device saved at the same moment: merge again
          const cc = cfg(); cc.last = st.last = Date.now(); saveCfg(cc);
          st.status = 'ok';
          afterApply(reason);
          return st;
        }
        throw new Error('Another device kept saving at the same time. Try again in a moment.');
      } catch (e) {
        st.status = 'error'; st.error = navigator.onLine ? e.message : 'You are offline. It will sync when you are back online.';
        return st;
      } finally { running = null; emit(); }
    })();
    return running;
  }
  function afterApply(reason) {
    App.units.build(); if (App.refreshNav) App.refreshNav();
    // refresh screens that only show progress, never ones you are working in
    const route = (location.hash.slice(2).split(/[/?]/)[0]) || 'home';
    const typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    const calm = ['home', 'progress', 'notes'].includes(route) || (route === 'vocab' && !/vocab\/(learn|item)/.test(location.hash));
    if (reason !== 'settings' && calm && !typing && !document.getElementById('inkpad') && !U.$('#modal').innerHTML) App.go(location.hash || '#/home');
  }

  App.sync = {
    get state() { return st; },
    connected: () => !!cfg().token,
    repo: () => cfg().repo || DEFAULT_REPO,
    on(f) { listeners.add(f); return () => listeners.delete(f); },
    run,
    soon() { if (!cfg().token) return; clearTimeout(timer); timer = setTimeout(() => run('auto'), 45000); },
    async connect(token, repo) {
      const c = { token: token.trim(), repo: (repo || DEFAULT_REPO).trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '') };
      const r = await gh(c, ''); // check the key can see the storage
      if (r.status === 404) throw new Error('Can’t find “' + c.repo + '”. Check the key was made for that repository.');
      if (!r.ok) throw new Error('GitHub error ' + r.status);
      saveCfg(Object.assign(cfg(), c));
      return run('settings');
    },
    disconnect() { const c = cfg(); delete c.token; saveCfg(c); st.status = 'idle'; emit(); },
    merge // exposed for testing
  };

  // sync when the app opens, when you come back to it, and before it goes to the background
  window.addEventListener('online', () => run('online'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { clearTimeout(timer); run('hide'); }
    else if (Date.now() - (st.last || 0) > 30000) run('show');
  });
})(window.App);

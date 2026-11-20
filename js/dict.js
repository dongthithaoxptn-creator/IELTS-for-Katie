/* Tap-a-word dictionary: local vocab bank + passage glossary first, then an online learner-style dictionary */
(function (App) {
  'use strict';
  const U = App.util, S = App.store;
  let gloss = {}; // passage glossary registered by the current view
  let current = null;

  const D = App.dict = {
    /* turn raw text into tappable word spans (safe: escapes everything) */
    wrap(raw) { return String(raw).split(/([A-Za-z][A-Za-z'’\-]*[A-Za-z]|[A-Za-z])/).map((p, i) => i % 2 ? '<span class="w">' + U.esc(p) + '</span>' : U.esc(p)).join(''); },
    setGloss(g) { gloss = {}; Object.keys(g || {}).forEach(k => { gloss[k.toLowerCase()] = g[k]; }); },
    candidates(w) {
      w = w.toLowerCase().replace(/[’]/g, "'").replace(/'s$/, '').replace(/^-+|-+$/g, '');
      const c = [w];
      const add = x => { if (x && x.length > 1 && !c.includes(x)) c.push(x); };
      if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');
      if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');
      if (w.endsWith('es')) add(w.slice(0, -2));
      if (w.endsWith('s')) add(w.slice(0, -1));
      if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); }
      if (w.endsWith('ing')) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) add(w.slice(0, -4)); }
      if (w.endsWith('ly')) add(w.slice(0, -2));
      if (w.endsWith('er')) add(w.slice(0, -2));
      return c;
    },
    local(w) {
      for (const c of D.candidates(w)) {
        if (gloss[c]) return Object.assign({ src: 'Passage glossary', w: c }, normGloss(gloss[c]));
        const x = App.units.wordIndex[c]; if (x) return { src: 'My vocabulary bank', w: x.w, pos: x.pos, ipa: x.ipa, vi: x.vi, ex: x.ex, unit: x.unit };
        const sv = S.s.saved.find(s => s.w.toLowerCase() === c); if (sv) return Object.assign({ src: 'Saved word' }, sv);
      }
      return null;
    },
    async online(w) {
      const cache = S.s.dictCache;
      for (const c of D.candidates(w)) {
        if (cache[c]) return cache[c];
        try {
          const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(c));
          if (!r.ok) continue;
          const data = await r.json(); if (!Array.isArray(data) || !data.length) continue;
          const ph = data.flatMap(e => e.phonetics || []);
          const uk = ph.find(p => /-uk\.mp3/.test(p.audio || '') && p.text) || ph.find(p => /-uk\.mp3/.test(p.audio || ''));
          const anyText = ph.find(p => p.text) || {};
          const meanings = [];
          data.forEach(e => (e.meanings || []).forEach(m => {
            let g = meanings.find(x => x.pos === m.partOfSpeech);
            if (!g) { g = { pos: m.partOfSpeech, defs: [] }; meanings.push(g); }
            (m.definitions || []).forEach(d => { if (g.defs.length < 3) g.defs.push({ d: d.definition, ex: d.example || '' }); });
          }));
          const out = { w: data[0].word, ipa: ((uk && uk.text) || anyText.text || '').replace(/^\/|\/$/g, ''), audio: (uk && uk.audio) || '', ukAudio: !!uk, meanings: meanings.slice(0, 4), src: 'Online dictionary' };
          const keys = Object.keys(cache); if (keys.length > 400) delete cache[keys[0]];
          cache[c] = out; S.save();
          return out;
        } catch (e) { return { error: 'offline' }; }
      }
      return null;
    },
    close() { const p = U.$('#pop'); p.hidden = true; p.innerHTML = ''; U.$$('span.w.sel').forEach(s => s.classList.remove('sel')); current = null; },
    async open(word, anchor, ctx) {
      const p = U.$('#pop');
      U.$$('span.w.sel').forEach(s => s.classList.remove('sel'));
      if (anchor) anchor.classList.add('sel');
      current = { word, ctx };
      const loc = D.local(word);
      p.innerHTML = loc ? renderLocal(loc) : '<div class="hw">' + U.esc(word) + '</div><p class="muted">Looking up…</p>';
      p.hidden = false; place(p, anchor);
      bind(p, loc || { w: word });
      if (!loc) {
        const on = await D.online(word);
        if (!current || current.word !== word) return;
        p.innerHTML = renderOnline(word, on); bind(p, on && !on.error ? on : { w: word }); place(p, anchor);
      }
    }
  };
  function normGloss(g) { return Array.isArray(g) ? { pos: g[0], ipa: g[1], vi: g[2], def: g[3] } : g; }
  function actions(w) {
    const ox = 'https://www.oxfordlearnersdictionaries.com/definition/english/' + encodeURIComponent(w.toLowerCase().replace(/\s+/g, '-'));
    const hasAI = App.ai && App.ai.enabled();
    return '<div class="row mt">' +
      '<button class="btn sm soft" data-act="say">' + App.icon('sound') + ' UK</button>' +
      '<button class="btn sm soft" data-act="save">' + App.icon('plus') + ' Save</button>' +
      (App.notes && App.notes.current ? '<button class="btn sm soft" data-act="note">' + App.icon('note') + ' Add to notes</button>' : '') +
      (hasAI ? '<button class="btn sm soft" data-act="vi">Tiếng Việt</button>' : '<a class="btn sm soft" target="_blank" rel="noopener" href="https://translate.google.com/?sl=en&tl=vi&text=' + encodeURIComponent(w) + '">Tiếng Việt ' + App.icon('ext') + '</a>') +
      '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + ox + '">Oxford ' + App.icon('ext') + '</a></div><div id="pop-vi"></div>';
  }
  function head(w, ipa, uk) { return '<div class="row between"><div><div class="hw">' + U.esc(w) + '</div>' + (ipa ? '<span class="ipa">' + (uk === false ? '' : 'BrE ') + '/' + U.esc(ipa) + '/</span>' : '') + '</div><button class="icon-btn" data-act="x" aria-label="Close">' + App.icon('x') + '</button></div>'; }
  function renderLocal(x) {
    return '<div class="src">' + U.esc(x.src) + '</div>' + head(x.w, x.ipa) +
      (x.pos ? '<div class="pos">' + U.esc(posName(x.pos)) + '</div>' : '') +
      (x.def ? '<p style="margin:4px 0">' + U.esc(x.def) + '</p>' : '') +
      (x.vi ? '<p class="vi" style="margin:4px 0">🇻🇳 ' + U.esc(x.vi) + '</p>' : '') +
      (x.ex ? '<span class="exm">' + U.esc(x.ex) + '</span>' : '') +
      (x.unit ? '<a class="btn sm ghost mt" href="#/vocab/item/' + encodeURIComponent(x.unit) + '">Open word family</a>' : '') +
      '<button class="btn sm ghost mt" data-act="more">More definitions</button>' + actions(x.w);
  }
  function renderOnline(word, o) {
    if (!o) return head(word) + '<p class="muted">No entry found. Try the Oxford link.</p>' + actions(word);
    if (o.error) return head(word) + '<p class="muted">You seem to be offline — the online dictionary is unavailable. Words from your vocab bank and passage glossaries still work offline.</p>' + actions(word);
    return '<div class="src">' + U.esc(o.src) + '</div>' + head(o.w, o.ipa, o.ukAudio ? true : false) +
      o.meanings.map(m => '<div class="pos">' + U.esc(m.pos) + '</div><ol>' + m.defs.map(d => '<li>' + U.esc(d.d) + (d.ex ? '<span class="exm">“' + U.esc(d.ex) + '”</span>' : '') + '</li>').join('') + '</ol>').join('') + actions(o.w);
  }
  function posName(p) { return ({ n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', 'n/v': 'noun / verb', prep: 'preposition', phr: 'phrase' })[p] || p; }
  function place(p, a) {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!a || vw < 560) { p.style.left = '12px'; p.style.right = '12px'; p.style.width = 'auto'; p.style.top = 'auto'; p.style.bottom = (vw < 900 ? 84 : 16) + 'px'; return; }
    p.style.right = 'auto'; p.style.bottom = 'auto'; p.style.width = '';
    const r = a.getBoundingClientRect(), ph = p.offsetHeight, pw = p.offsetWidth;
    let top = r.bottom + 8; if (top + ph > vh - 10) top = Math.max(10, r.top - ph - 8);
    let left = Math.min(Math.max(10, r.left - 20), vw - pw - 10);
    p.style.top = top + 'px'; p.style.left = left + 'px';
  }
  function bind(p, entry) {
    p.onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, w = entry.w || (current && current.word);
      if (act === 'x') D.close();
      else if (act === 'say') {
        if (entry.audio) { try { await new Audio(entry.audio).play(); return; } catch (err) { /* fall back to TTS */ } }
        App.tts.speak(w);
      } else if (act === 'save') {
        if (S.s.saved.some(s => s.w.toLowerCase() === w.toLowerCase())) { U.toast('Already saved'); return; }
        const m = entry.meanings && entry.meanings[0];
        S.s.saved.push({ w, ipa: entry.ipa || '', pos: entry.pos || (m && m.pos) || '', def: entry.def || (m && m.defs[0] && m.defs[0].d) || '', vi: entry.vi || '', ex: entry.ex || (m && m.defs[0] && m.defs[0].ex) || '', ctx: current && current.ctx || '', t: Date.now() });
        S.save(); U.toast('Saved to My words');
      } else if (act === 'note') {
        const m = entry.meanings && entry.meanings[0];
        const mean = entry.vi || entry.def || (m && m.defs[0] && m.defs[0].d) || '';
        const ctx = current && current.ctx ? ' (“' + current.ctx.trim().slice(0, 140) + '”)' : '';
        App.notes.append(App.notes.current.key, '• ' + w + (mean ? ' — ' + mean : '') + ctx);
        U.toast('Added “' + w + '” to your notes'); D.close();
      } else if (act === 'more') {
        const on = await D.online(w); p.innerHTML = renderOnline(w, on); bind(p, on && !on.error ? on : { w });
      } else if (act === 'vi') {
        const box = p.querySelector('#pop-vi'); box.innerHTML = '<p class="muted mt">Translating…</p>';
        try { const t = await App.ai.translate(w, current && current.ctx); box.innerHTML = '<p class="vi mt">🇻🇳 ' + U.esc(t) + '</p>'; entry.vi = t; }
        catch (err) { box.innerHTML = '<p class="muted mt">' + U.esc(err.message) + '</p>'; }
      }
    };
  }
  function sentenceAround(el) {
    const block = el.closest('p,li,.script-line,.qbody,.node,div');
    const txt = (block ? block.textContent : '').replace(/\s+/g, ' ');
    const w = el.textContent; const sents = txt.split(/(?<=[.!?])\s+/);
    return (sents.find(s => s.includes(w)) || txt).replace(/^\s*[A-H](?=[A-Z][a-z])/, '').slice(0, 300); // drop the paragraph letter (A, B…)
  }
  document.addEventListener('click', e => {
    const w = e.target.closest('span.w');
    if (w) { e.preventDefault(); D.open(w.textContent, w, sentenceAround(w)); return; }
    if (!e.target.closest('#pop')) { if (!U.$('#pop').hidden) D.close(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { D.close(); const m = U.$('#modal'); if (!m.hidden) { m.hidden = true; m.innerHTML = ''; } } });
  window.addEventListener('hashchange', () => D.close());
})(window.App);

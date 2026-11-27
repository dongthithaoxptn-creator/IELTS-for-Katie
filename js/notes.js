/* My notes — write notes on any word or book unit; see them again when you come back or review */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  const KINDS = { vocab: 'Words', unit: 'Book units', reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking' };
  const all = () => S.s.notes || (S.s.notes = {});
  const KC = { vocab: 'lav', unit: 'sky', reading: 'mint', listening: 'aqua', writing: 'lilac', speaking: 'peach' };
  const meta = {}; // key -> { kind, title, href } for notes shown on the current screen
  const timers = {};

  const N = App.notes = {
    KINDS,
    get(key) { const n = all()[key]; return n ? n.t || '' : ''; },
    raw(key) { return all()[key] || null; },
    inkCount(key) { const n = all()[key]; return n && n.ink || 0; },
    has(key) { return !!N.get(key).trim() || N.inkCount(key) > 0; },
    metaOf(key) { const n = all()[key] || {}; return meta[key] || { kind: n.kind, title: n.title, href: n.href }; },
    set(key, text, m) {
      const A = all(); m = m || meta[key] || {}; const old = A[key] || {};
      if (!String(text).trim() && !old.ink) { if (A[key]) S.forget('notes', key); delete A[key]; }
      else A[key] = { t: String(text), ink: old.ink || 0, kind: m.kind || old.kind || 'vocab', title: m.title || old.title || '', href: m.href || old.href || '', ts: Date.now(), created: old.created || Date.now() };
      S.save(); N.refresh(key);
    },
    /* handwritten pages: how many this note has (the pages themselves live in App.ink) */
    setInk(key, count, m0) {
      const A = all(), old = A[key], m = m0 && m0.title ? m0 : meta[key] || old || {};
      if (!count && !(old && String(old.t || '').trim())) { if (old) S.forget('notes', key); delete A[key]; }
      else A[key] = { t: old ? old.t || '' : '', ink: count, kind: m.kind || 'vocab', title: m.title || '', href: m.href || '', ts: Date.now(), created: old && old.created || Date.now() };
      S.save(); N.refresh(key);
    },
    append(key, line) { const cur = N.get(key).replace(/\s+$/, ''); N.set(key, (cur ? cur + '\n' : '') + line); },
    remove(key) { delete all()[key]; S.forget('notes', key); S.save(); if (App.ink) App.media.del('ink/' + key).catch(() => {}); N.refresh(key); },
    list() { return Object.entries(all()).map(([key, n]) => Object.assign({ key }, n)).sort((a, b) => b.ts - a.ts); },
    count() { return Object.keys(all()).length; },

    /* an always-open notes box inside a page (book units, words, learning cards) */
    box(key, m, opt = {}) {
      meta[key] = m; N.current = { key, m };
      const t = N.get(key);
      return '<div class="notes-box' + (t ? ' has' : '') + '" data-nbox="' + U.esc(key) + '"><div class="row between"><b class="row" style="gap:6px">' + I('note') + (opt.label || 'My notes') + '</b><small class="nstat muted">' + (t ? 'Saved ' + ago(all()[key].ts) : 'Only you can see this') + '</small></div>' +
        '<textarea class="notes-ta" data-nkey="' + U.esc(key) + '" rows="' + (opt.rows || 2) + '" placeholder="' + U.esc(opt.ph || 'Write anything you want to remember: a meaning, an example of your own, a mistake you made…') + '">' + U.esc(t) + '</textarea>' +
        '<div class="ink-row">' + App.ink.thumbs(key) + '<button type="button" class="btn sm ghost ink-btn" data-ink-open="' + U.esc(key) + '" data-page="">' + I('write') + ' Handwrite</button></div></div>';
    },
    /* your note shown read-only (in a review), with a link to edit it */
    show(key, href) {
      if (!N.has(key)) return ''; const t = N.get(key);
      return '<div class="notes-show"><b>' + I('note') + ' Your note</b>' + (t.trim() ? '<div class="nt">' + U.esc(t) + '</div>' : '') + App.ink.thumbs(key) + (href ? '<a class="btn sm ghost mt" href="' + U.esc(href) + '">Edit note</a>' : '') + '</div>';
    },
    mark(key) { return N.has(key) ? '<span class="note-mark" title="You have a note here">' + I('note') + '</span>' : ''; },

    /* a floating "Notes" button + side panel for exercises (Reading, Listening, Writing, Speaking) */
    attach(key, m) {
      meta[key] = m; N.current = { key, m };
      let fab = U.$('#notefab');
      if (!fab) { fab = document.createElement('button'); fab.id = 'notefab'; fab.type = 'button'; document.body.appendChild(fab); }
      fab.hidden = false; fab.dataset.key = key;
      fab.onclick = () => N.open(key);
      N.refresh(key);
      if (N.has(key)) U.toast('You have notes for this — tap “My notes” to read them', 3200);
    },
    open(key) {
      const m = meta[key] || {};
      let sh = U.$('#notesheet');
      if (!sh) { sh = document.createElement('aside'); sh.id = 'notesheet'; sh.setAttribute('aria-label', 'My notes'); document.body.appendChild(sh); }
      sh.innerHTML = '<div class="row between"><div><div class="eyebrow">My notes</div><b>' + U.esc(m.title || '') + '</b></div><button class="icon-btn" id="nsx" aria-label="Close notes">' + I('x') + '</button></div>' +
        '<textarea class="notes-ta big" data-nkey="' + U.esc(key) + '" placeholder="Notes for this exercise: tricky questions, words to learn, why an answer was wrong, tips for next time…">' + U.esc(N.get(key)) + '</textarea>' +
        '<div class="ink-row">' + App.ink.thumbs(key) + '<button type="button" class="btn sm soft ink-btn" data-ink-open="' + U.esc(key) + '" data-page="">' + I('write') + ' Handwrite</button></div>' +
        '<div class="row between"><small class="nstat muted" data-nstat="' + U.esc(key) + '">' + (N.has(key) ? 'Saved ' + ago(all()[key].ts) : 'Saved automatically as you type') + '</small><a class="btn sm ghost" href="#/notes">All my notes</a></div>' +
        '<p class="muted" style="margin:0"><small>Tip: tap a word in the text, then <b>Add to notes</b>. With Apple Pencil, tap <b>Handwrite</b> to write by hand.</small></p>';
      sh.hidden = false; requestAnimationFrame(() => sh.classList.add('open'));
      U.$('#nsx', sh).onclick = N.closeSheet;
      const ta = U.$('textarea', sh); grow(ta); if (window.innerWidth >= 900) ta.focus();
    },
    closeSheet() { const sh = U.$('#notesheet'); if (sh) { sh.classList.remove('open'); sh.hidden = true; } },
    detach() {
      N.current = null; N.closeSheet();
      const fab = U.$('#notefab'); if (fab) fab.hidden = true;
      Object.keys(meta).forEach(k => delete meta[k]);
    },
    /* update every place showing this note */
    refresh(key) {
      const t = N.get(key);
      U.$$('textarea.notes-ta').forEach(ta => { if (ta.dataset.nkey === key && document.activeElement !== ta) { ta.value = t; grow(ta); } });
      const has = N.has(key);
      U.$$('[data-nbox]').forEach(b => { if (b.dataset.nbox === key) b.classList.toggle('has', has); });
      const fab = U.$('#notefab');
      if (fab && fab.dataset.key === key) { fab.classList.toggle('has', has); fab.innerHTML = I('note') + '<span>' + (has ? 'My notes' : 'Add notes') + '</span>'; }
    }
  };

  function ago(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return U.fmtDate(ts);
  }
  function grow(ta) { if (!ta || ta.classList.contains('big')) return; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 420) + 'px'; }

  /* typing in any notes box saves it (shortly after you stop) */
  document.addEventListener('input', e => {
    const ta = e.target.closest && e.target.closest('textarea.notes-ta'); if (!ta) return;
    const key = ta.dataset.nkey; grow(ta);
    const stat = ta.closest('[data-nbox], #notesheet'); const st = stat && stat.querySelector('.nstat'); if (st) st.textContent = 'Saving…';
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => { N.set(key, ta.value); if (st) st.textContent = ta.value.trim() || N.inkCount(key) ? 'Saved ✓' : 'Empty note removed'; }, 500);
  });
  document.addEventListener('focusout', e => { // save at once when you leave the box
    const ta = e.target.closest && e.target.closest('textarea.notes-ta'); if (!ta) return;
    const key = ta.dataset.nkey; if (timers[key]) {
      clearTimeout(timers[key]); timers[key] = null; N.set(key, ta.value);
      const box = ta.closest('[data-nbox], #notesheet'), st = box && box.querySelector('.nstat'); if (st) st.textContent = ta.value.trim() || N.inkCount(key) ? 'Saved ✓' : 'Empty note removed';
    }
  });
  window.addEventListener('pagehide', () => U.$$('textarea.notes-ta').forEach(ta => { const k = ta.dataset.nkey; if (timers[k]) { clearTimeout(timers[k]); N.set(k, ta.value); } }));

  /* ---------- My notes page ---------- */
  const ui = { kind: '', q: '' };
  App.views.notes = function (v) {
    const L = N.list();
    const kinds = Object.keys(KINDS).filter(k => L.some(n => n.kind === k));
    v.innerHTML = '<div class="wrap" style="max-width:980px"><div class="page-head"><div><div class="eyebrow">You</div><h1>My notes</h1><p>' + (L.length ? L.length + ' note' + (L.length > 1 ? 's' : '') + ' from your practice. Tap a title to go back to that exercise.' : 'Notes you write on words and book units appear here.') + '</p></div></div>' +
      (L.length ? '<div class="row mb"><input class="input" id="nq" placeholder="Search your notes…" value="' + U.esc(ui.q) + '" style="flex:1;min-width:200px"></div>' +
        '<div class="tabs"><button data-k="" class="' + (!ui.kind ? 'on' : '') + '">All</button>' + kinds.map(k => '<button data-k="' + k + '" class="' + (ui.kind === k ? 'on' : '') + '">' + KINDS[k] + '</button>').join('') + '</div><div id="nl"></div>'
        : '<div class="card empty"><div style="font-size:2.4rem">📝</div><h2>No notes yet</h2><p>Every word, phrasal verb, collocation and book unit has a notes box: type, or tap <b>Handwrite</b> to write with your Pencil.<br>Your notes come back when you review the word or the unit.</p><div class="row" style="justify-content:center"><a class="btn" href="#/vocab?tab=b">Your books</a><a class="btn ghost" href="#/vocab">Vocabulary</a></div></div>') + '</div>';
    if (!L.length) return;
    const draw = () => {
      const q = U.norm(ui.q);
      const items = N.list().filter(n => (!ui.kind || n.kind === ui.kind) && (!q || U.norm(n.title + ' ' + n.t).includes(q)));
      U.$('#nl', v).innerHTML = items.length ? items.map(n => '<div class="card note-card tint" data-c="' + (KC[n.kind] || 'butter') + '" data-key="' + U.esc(n.key) + '"><div class="row between"><div class="row" style="gap:8px"><span class="chip">' + U.esc(KINDS[n.kind] || n.kind) + '</span>' + (n.href ? '<a href="' + U.esc(n.href) + '"><b>' + U.esc(n.title || 'Open') + '</b></a>' : '<b>' + U.esc(n.title) + '</b>') + '</div><small class="muted">' + ago(n.ts) + '</small></div>' +
        (n.t && n.t.trim() ? '<div class="nt mt">' + U.esc(n.t) + '</div>' : '<div class="nt mt" hidden></div>') + App.ink.thumbs(n.key) + '<div class="row mt"><button class="btn sm ghost" data-edit>' + (n.t && n.t.trim() ? 'Edit' : 'Add text') + '</button><button class="btn sm ghost" data-ink-open="' + U.esc(n.key) + '" data-page="">' + I('write') + ' Handwrite</button>' + (n.href ? '<a class="btn sm soft" href="' + U.esc(n.href) + '">Open ' + I('arrow') + '</a>' : '') + '<span class="spacer"></span><button class="btn sm ghost" data-del>Delete</button></div></div>').join('')
        : '<div class="empty">No notes match.</div>';
    };
    v.querySelector('.tabs').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { ui.kind = b.dataset.k; App.views.notes(v); } };
    U.$('#nq', v).oninput = e => { ui.q = e.target.value; draw(); };
    U.$('#nl', v).onclick = async e => {
      const card = e.target.closest('.note-card'); if (!card) return; const key = card.dataset.key;
      if (e.target.closest('[data-del]')) { if (await U.confirm('Delete this note? This can’t be undone.', 'Delete')) { N.remove(key); App.views.notes(v); } }
      else if (e.target.closest('[data-edit]')) {
        const n = all()[key]; meta[key] = { kind: n.kind, title: n.title, href: n.href };
        card.querySelector('.nt').hidden = false;
        card.querySelector('.nt').outerHTML = '<textarea class="notes-ta mt" data-nkey="' + U.esc(key) + '" rows="5">' + U.esc(n.t) + '</textarea><small class="nstat muted">Saved automatically</small>';
        e.target.closest('[data-edit]').remove(); const ta = card.querySelector('textarea'); grow(ta); ta.focus();
      }
    };
    draw();
  };

  /* ---------- recent notes on Home ---------- */
  App.notes.recentHTML = function (n = 3) {
    const L = N.list().slice(0, n); if (!L.length) return '';
    return '<div class="card tint" data-c="butter"><div class="row between"><h3 style="margin:0">' + I('note') + ' From your notes</h3><a class="btn sm ghost" href="#/notes">All notes</a></div>' +
      L.map(x => '<div class="recent-note"><a href="' + U.esc(x.href || '#/notes') + '"><b>' + U.esc(x.title || KINDS[x.kind]) + '</b></a> <small class="muted">· ' + ago(x.ts) + (x.ink ? ' · ✍️ ' + x.ink + ' handwritten page' + (x.ink > 1 ? 's' : '') : '') + '</small>' + (x.t && x.t.trim() ? '<div class="nt clip">' + U.esc(x.t) + '</div>' : '') + '</div>').join('') + '</div>';
  };
})(window.App);

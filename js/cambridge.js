/* Cambridge IELTS 16–20: full Reading tests, Writing tasks and Speaking tests from your own books.
   Nothing from the books is published: each book's pages, answer keys and tasks come in a private pack
   (cam16x.zip … cam20x.zip) imported once per device in Settings and kept in this device's storage. */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  const IDS = ['cam16', 'cam17', 'cam18', 'cam19', 'cam20'];
  const C = App.cam = { books: {} };

  /* ---------- loading the packs ---------- */
  C.load = async function () {
    const found = {};
    if (App.media.supported) {
      for (const k of await App.media.keys('rws/')) {
        try { const v = await App.media.get(k); const d = typeof v === 'string' ? JSON.parse(v) : JSON.parse(await new Response(v).text()); found[d.id] = d; } catch (e) { /* skip a damaged file */ }
      }
    }
    C.books = found;
    return Object.keys(found).length;
  };
  C.list = () => IDS.map(id => C.books[id]).filter(Boolean);
  C.has = () => C.list().length > 0;
  C.missingNote = what => '<div class="note mb">' + I('read') + ' The Cambridge IELTS 16–20 ' + what + ' come from your own books, so they aren’t online. Import the packs <b>cam16x.zip … cam20x.zip</b> once in <a href="#/settings">Settings → Cambridge books on this device</a>.</div>';
  C.img = (path, alt) => '<img data-cam-src="' + U.esc(path) + '" alt="' + U.esc(alt || '') + '" loading="lazy" class="cam-page">';
  // swap stored page paths for this device's copies once they are on screen
  C.fill = root => U.$$('img[data-cam-src]', root).forEach(async im => { const p = im.dataset.camSrc; im.removeAttribute('data-cam-src'); im.src = await App.media.url(p); });
  // tap a page to see it full size
  document.addEventListener('click', e => { const im = e.target.closest && e.target.closest('img.cam-page'); if (im && im.src) U.modal('<img src="' + U.esc(im.src) + '" alt="" style="width:100%;display:block;background:#fff;border-radius:8px"><div class="row mt" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); });

  /* ---------- marking ---------- */
  const TFNG = { t: 'TRUE', true: 'TRUE', f: 'FALSE', false: 'FALSE', ng: 'NOT GIVEN', 'not given': 'NOT GIVEN', notgiven: 'NOT GIVEN', y: 'YES', yes: 'YES', n: 'NO', no: 'NO' };
  const CHOICE = { 'TRUE/FALSE/NOT GIVEN': ['TRUE', 'FALSE', 'NOT GIVEN'], 'YES/NO/NOT GIVEN': ['YES', 'NO', 'NOT GIVEN'] };
  const kindOf = k => (k === 'TRUE' || k === 'FALSE') ? 'TRUE/FALSE/NOT GIVEN' : (k === 'YES' || k === 'NO') ? 'YES/NO/NOT GIVEN' : k === 'NOT GIVEN' ? 'NG' : 'text';
  function keyFor(keys, q) {
    if (keys[q] != null) return { key: keys[q] };
    for (const k of Object.keys(keys)) { const m = k.match(/^(\d+)-(\d+)$/); if (m && (+m[1] === q || +m[2] === q)) return { pair: [+m[1], +m[2]], set: keys[k].split(',').map(x => x.trim().toUpperCase()) }; }
    return null;
  }
  function same(user, key) {
    const u = String(user || '').trim(); if (!u) return false;
    if (['TRUE', 'FALSE', 'NOT GIVEN', 'YES', 'NO'].includes(key)) return (TFNG[u.toLowerCase().replace(/\s+/g, ' ')] || u.toUpperCase()) === key;
    return App.matchKey(u, key);
  }
  function mark(keys, ans) {
    const out = [];
    for (let q = 1; q <= 40; q++) {
      const k = keyFor(keys, q), u = (ans[q] || '').trim();
      if (!k) { out.push({ q, ok: null, user: u, correct: '' }); continue; }
      if (k.set) { const other = (ans[k.pair[0] === q ? k.pair[1] : k.pair[0]] || '').trim().toUpperCase(), up = u.toUpperCase(); out.push({ q, ok: k.set.includes(up) && !(q === k.pair[1] && up === other), user: u, correct: k.set.join(' / ') + ' (either order)' }); continue; }
      out.push({ q, ok: same(u, k.key), user: u, correct: String(k.key).replace(/\//g, ' / ') });
    }
    return out;
  }
  // which kind of answer box each question needs (taken from the key, like the instructions on the page)
  function boxFor(keys, q) {
    const k = keyFor(keys, q); if (!k || k.set) return 'text';
    let kind = kindOf(k.key);
    if (kind === 'NG') { // NOT GIVEN: look at the neighbours to see if this is a TRUE/FALSE or a YES/NO set
      for (let d = 1; d < 8 && kind === 'NG'; d++) for (const n of [q - d, q + d]) { const kk = keys[n]; if (kk && kindOf(kk) !== 'NG' && kindOf(kk) !== 'text') { kind = kindOf(kk); break; } }
      if (kind === 'NG') kind = 'TRUE/FALSE/NOT GIVEN';
    }
    return kind;
  }

  /* ---------- Reading: a full Cambridge test ---------- */
  C.readingTest = async function (v, bookId, n) {
    if (!C.has()) await C.load();
    const b = C.books[bookId], t = b && b.reading.find(x => x.n === n);
    if (!t) { v.innerHTML = '<div class="wrap"><a class="btn ghost sm mb" href="#/reading">' + I('back') + ' Reading</a>' + C.missingNote('Reading tests') + '</div>'; return; }
    const ref = bookId + '-r' + n, title = b.title + ' · Test ' + n;
    const sheet = [[1, 13, 1], [14, 26, 2], [27, 40, 3]].map(([a, z, p]) => '<div class="qgroup"><div class="instr"><b>Passage ' + p + '</b> · Questions ' + a + '–' + z + '</div>' +
      Array.from({ length: z - a + 1 }, (_, i) => a + i).map(q => {
        const kind = boxFor(t.keys, q);
        const input = CHOICE[kind] ? '<div class="radio-row">' + CHOICE[kind].map(o => '<label><input type="radio" name="q' + q + '" value="' + o + '"> ' + o + '</label>').join('') + '</div>'
          : '<input class="input" name="q' + q + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Answer ' + q + '">';
        return '<div class="qitem" data-n="' + q + '"><div class="qnum">' + q + '</div><div class="qbody">' + input + '</div></div>';
      }).join('') + '</div>').join('');
    v.innerHTML = '<div class="wrap" style="max-width:1400px"><div class="row between mb"><a class="btn ghost sm" href="#/reading">' + I('back') + ' Reading</a><div class="row"><span class="timer" id="tm"></span><button class="btn" id="sub">Submit answers</button></div></div>' +
      '<div class="eyebrow">' + U.esc(b.title) + '</div><h1>Test ' + n + ' · Academic Reading</h1>' + (b.note ? '<p class="muted"><small>' + U.esc(b.note) + '</small></p>' : '') +
      '<p class="muted">60 minutes · 3 passages · 40 questions. Read the pages on the left (tap a page to enlarge it) and write your answers on the answer sheet.</p>' +
      '<div class="split"><div class="pane card" id="paper">' + t.pages.map((p, i) => C.img(p, 'Page ' + (i + 1))).join('') + '</div>' +
      '<div class="pane card" id="sheet"><h3>Answer sheet</h3>' + sheet + '<div id="result"></div></div></div></div>';
    C.fill(v);
    App.notes.attach('r:' + ref, { kind: 'reading', title: 'Reading · ' + title, href: '#/reading/cam/' + bookId + '/' + n });
    const tm = App.Q.timer(U.$('#tm', v), 60 * 60); App.onLeave(tm.stop);
    U.$('#sub', v).onclick = async () => {
      const ans = {};
      for (let q = 1; q <= 40; q++) { const r = U.$('[name=q' + q + ']:checked', v), i = U.$('input.input[name=q' + q + ']', v); ans[q] = r ? r.value : i ? i.value : ''; }
      const blanks = Object.values(ans).filter(x => !String(x).trim()).length;
      if (blanks && !(await U.confirm(blanks + ' question' + (blanks > 1 ? 's are' : ' is') + ' unanswered. Submit anyway?', 'Submit'))) return;
      tm.stop();
      const res = mark(t.keys, ans), raw = res.filter(r => r.ok).length, band = App.bands.reading(raw, 40);
      S.attempt({ skill: 'reading', ref, title: title + ' (Reading)', raw, total: 40, band, secs: Math.round(tm.elapsed()) });
      U.$('#sub', v).disabled = true; U.$$('#sheet input', v).forEach(x => { x.disabled = true; });
      res.forEach(r => { const el = U.$('.qitem[data-n="' + r.q + '"]', v); el.classList.add(r.ok ? 'right' : 'wrong'); if (!r.ok) el.querySelector('.qbody').insertAdjacentHTML('beforeend', '<div class="answer-note">Correct: <b>' + U.esc(r.correct) + '</b>' + (r.user ? ' · you wrote “' + U.esc(r.user) + '”' : '') + '</div>'); });
      const per = [[1, 13], [14, 26], [27, 40]].map(([a, z]) => res.filter(r => r.q >= a && r.q <= z && r.ok).length + '/' + (z - a + 1));
      U.$('#result', v).innerHTML = '<div class="card card-hero mt" style="text-align:center"><small>Score</small><div class="band-big">' + raw + '/40</div><p class="muted" style="margin:6px 0">Estimated Reading band <b style="font-size:1.3rem">' + U.bandStr(band) + '</b> · time ' + U.fmtClock(tm.elapsed()) + '<br>Passage 1: ' + per[0] + ' · Passage 2: ' + per[1] + ' · Passage 3: ' + per[2] + '</p><div class="row" style="justify-content:center"><a class="btn light" href="#/reading">More tests</a><button class="btn glass" id="retry">Try again</button></div></div>';
      U.$('#retry', v).onclick = () => C.readingTest(v, bookId, n);
      U.$('#result', v).scrollIntoView({ behavior: 'smooth', block: 'center' });
      App.refreshNav();
    };
  };
  C.readingListHTML = function () {
    if (!C.has()) return C.missingNote('Reading tests');
    const best = ref => App.bestAttempt('reading', ref);
    return C.list().map(b => '<div class="card mb tint" data-c="mint"><div class="row between"><h2 style="margin:0">' + U.esc(b.title) + '</h2><span class="chip">4 full tests</span></div>' + (b.note ? '<p class="muted" style="margin:6px 0 0"><small>' + U.esc(b.note) + '</small></p>' : '') +
      '<div class="grid g2 mt" style="gap:10px">' + b.reading.map(t => { const x = best(b.id + '-r' + t.n);
        return '<a class="list-item" style="margin:0" href="#/reading/cam/' + b.id + '/' + t.n + '"><span class="ic-bubble" style="width:40px;height:40px;border-radius:12px">' + I('read') + '</span><div class="grow"><b>Test ' + t.n + '</b><br><small>3 passages · 40 questions · 60 min</small></div>' + (x ? '<div style="text-align:right"><span class="band-pill">' + U.bandStr(x.band) + '</span><br><small>' + x.raw + '/40</small></div>' : '<span class="chip outline">Not tried</span>') + '</a>'; }).join('') + '</div></div>').join('');
  };

  /* ---------- Writing: tasks from the books ---------- */
  // id like "cam16-2-t1" -> a task the writing editor can use
  C.writingTask = function (id) {
    const m = String(id).match(/^(cam\d+)-(\d)-t([12])$/); if (!m) return null;
    const b = C.books[m[1]], t = b && b.writing.find(x => x.n === +m[2]); if (!t) return null;
    const w = t['t' + m[3]];
    return { id, task: +m[3], title: b.title.replace('Cambridge IELTS', 'Cam') + ' · Test ' + t.n + ' · ' + w.title, kind: b.title + ' · Test ' + t.n, prompt: w.text.join('\n\n'), pages: w.pages || [], cam: true };
  };
  C.writingListHTML = function (hist) {
    if (!C.has()) return C.missingNote('Writing tasks');
    const last = id => { const d = hist.filter(h => h.ref === id && h.result); return d[d.length - 1]; };
    const row = (id, task, title) => { const l = last(id); return '<a class="list-item" style="margin:0" href="#/writing/' + id + '"><span class="ic-bubble" style="width:40px;height:40px;border-radius:12px">' + I('write') + '</span><div class="grow"><b>Task ' + task + '</b> · <span>' + U.esc(title) + '</span></div>' + (l ? '<span class="band-pill">' + U.bandStr(l.result.overall) + '</span>' : '') + '</a>'; };
    return C.list().map(b => '<div class="card mb tint" data-c="lilac"><div class="row between"><h2 style="margin:0">' + U.esc(b.title) + '</h2>' + (b.samples.length ? '<button class="btn sm soft" data-samples="' + b.id + '">' + I('read') + ' Examiner sample answers</button>' : '') + '</div>' +
      b.writing.map(t => '<h3 class="mt" style="margin-bottom:8px">Test ' + t.n + '</h3><div class="grid g2" style="gap:10px">' + row(b.id + '-' + t.n + '-t1', 1, t.t1.title) + row(b.id + '-' + t.n + '-t2', 2, t.t2.title) + '</div>').join('') + '</div>').join('');
  };
  document.addEventListener('click', e => {
    const s = e.target.closest && e.target.closest('[data-samples]'); if (!s) return;
    const b = C.books[s.dataset.samples]; if (!b) return;
    U.modal('<div class="row between"><h2 style="margin:0">' + U.esc(b.title) + ' · Sample answers</h2><button class="icon-btn" data-close aria-label="Close">' + I('x') + '</button></div><p class="muted">Model answers with examiner comments from the book. Compare your own essay for the same task.</p>' + b.samples.map((p, i) => C.img(p, 'Sample answers page ' + (i + 1))).join(''), box => C.fill(box));
  });

  /* ---------- Speaking: the books' speaking tests ---------- */
  C.speakingTest = function (id) {
    const m = String(id).match(/^(cam\d+)-(\d)$/); if (!m) return null;
    const b = C.books[m[1]], t = b && b.speaking.find(x => x.n === +m[2]); if (!t) return null;
    return { title: b.title.replace('Cambridge IELTS', 'Cam') + ' · Test ' + t.n, t };
  };
  C.speakingListHTML = function () {
    if (!C.has()) return C.missingNote('Speaking tests');
    return C.list().map(b => '<div class="card mb tint" data-c="peach"><h2 style="margin:0 0 10px">' + U.esc(b.title) + '</h2><div class="grid g2" style="gap:10px">' +
      b.speaking.map(t => '<a class="list-item" style="margin:0" href="#/speaking/cam/' + b.id + '-' + t.n + '"><span class="ic-bubble" style="width:40px;height:40px;border-radius:12px">' + I('speak') + '</span><div class="grow"><b>Test ' + t.n + '</b> · ' + U.esc(t.p1.topic) + '<br><small>' + U.esc(t.p2.cue) + '</small></div></a>').join('') + '</div></div>').join('');
  };
})(window.App);

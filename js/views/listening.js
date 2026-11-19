/* Listening — real Cambridge IELTS recordings from your Drive, question paper pages, answer sheet, official keys */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  const book = id => App.data.books.find(b => b.id === id);

  /* ---------- answer-key matching ---------- */
  const clean = s => U.norm(String(s).replace(/[£$€]/g, '').replace(/(\d),(\d{3})/g, '$1$2')).replace(/\s*-\s*/g, '-');
  function variants(alt) { // "(the) library" -> ["the library", "library"]
    let out = [''];
    alt.split(/(\([^)]*\))/).forEach(seg => {
      if (/^\(.*\)$/.test(seg)) { const w = seg.slice(1, -1); out = out.flatMap(o => [o + w, o]); }
      else out = out.map(o => o + seg);
    });
    return out.map(clean).filter(Boolean);
  }
  App.matchKey = function (user, key) {
    const u = clean(user); if (!u) return false;
    return String(key).split('/').some(alt => variants(alt).some(v => v === u || v.replace(/\s/g, '') === u.replace(/\s/g, '')));
  };
  function keyInfo(t, q) {
    if (t.keys[q] != null) return { key: t.keys[q] };
    for (const k of Object.keys(t.keys)) { const m = k.match(/^(\d+)-(\d+)$/); if (m && (+m[1] === q || +m[2] === q)) return { pair: [+m[1], +m[2]], set: t.keys[k].split(',').map(x => x.trim().toUpperCase()) }; }
    return null;
  }
  function mark(t, qs, ans) {
    return qs.map(q => {
      const k = keyInfo(t, q), u = (ans[q] || '').trim();
      if (!k) return { q, ok: null, user: u, correct: '' };
      if (k.set) { const other = ans[k.pair[0] === q ? k.pair[1] : k.pair[0]] || ''; const up = u.toUpperCase(); const ok = k.set.includes(up) && !(q === k.pair[1] && up === other.trim().toUpperCase()); return { q, ok, user: u, correct: k.set.join(' / ') + ' (either order)' }; }
      return { q, ok: App.matchKey(u, k.key), user: u, correct: String(k.key).replace(/\//g, ' / ') };
    });
  }

  /* ---------- list ---------- */
  let tab = null;
  function list(v) {
    const best = ref => App.bestAttempt('listening', ref);
    const chip = ref => { const b = best(ref); return b ? '<span class="band-pill" style="height:26px;min-width:40px;font-size:.85rem">' + U.bandStr(b.band) + '</span>' : ''; };
    if (!tab) { try { tab = localStorage.getItem('ielts-listen-book'); } catch (e) { /* ignore */ } }
    const bk = App.data.books.find(b => b.id === tab) || App.data.books[0];
    const done = b => S.s.attempts.filter(a => a.skill === 'listening' && String(a.ref || '').startsWith(b.id + '-')).length;
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">IELTS Builder · Listening</div><h1>Listening</h1><p>Real Cambridge IELTS recordings from your Drive: ' + App.data.books.length + ' books, ' + App.data.books.length * 4 + ' full tests. Do a whole test (40 questions, about 30 minutes) or one part at a time.</p></div></div>' +
      '<div class="tabs">' + App.data.books.map(b => '<button data-book="' + b.id + '" class="' + (b === bk ? 'on' : '') + '">' + U.esc(b.title.replace('Cambridge IELTS', 'Cam')) + (done(b) ? ' · ' + done(b) : '') + '</button>').join('') + '</div>' +
      [bk].map(b => '<h2>' + U.esc(b.title) + '</h2><div id="avail"></div>' + (b.note ?'<p class="note">' + U.esc(b.note) + '</p>' : '') + '<div class="grid g2">' + b.tests.map(t => {
        const ref = b.id + '-t' + t.n;
        const ready = t.parts.every(p => p.pages.length) && Object.keys(t.keys).length;
        return '<div class="card"><div class="row between"><h3 style="margin:0">Test ' + t.n + '</h3>' + (ready ? '' : '<span class="chip warn">Questions not imported yet</span>') + '</div>' +
          '<a class="list-item mt" href="#/listening/' + b.id + '/' + t.n + '/full"><span class="icon-btn" style="width:40px;height:40px">' + I('listen') + '</span><div class="grow"><b>Full test</b><br><small>Parts 1–4 · 40 questions · ~30 min</small></div>' + chip(ref + '-full') + '</a>' +
          '<div class="grid g2 mt" style="gap:8px">' + t.parts.map(p => '<a class="list-item" style="margin:0;padding:10px 12px" href="#/listening/' + b.id + '/' + t.n + '/' + p.p + '"><div class="grow"><b>Part ' + p.p + '</b><br><small>Q ' + p.from + '–' + p.to + '</small></div>' + chip(ref + '-p' + p.p) + '</a>').join('') + '</div></div>';
      }).join('') + '</div>').join('') + '</div>';
    App.media.available(bk).then(ok => { const a = U.$('#avail', v); if (a && !ok) a.innerHTML = '<div class="note mb">' + I('listen') + ' The recordings and pages for ' + U.esc(bk.title) + ' aren’t on this device yet. Import the <b>' + bk.id + '.zip</b> pack once in <a href="#/settings">Settings → Cambridge books on this device</a>.</div>'; });
    v.querySelector('.tabs').onclick = e => { const b = e.target.closest('[data-book]'); if (!b) return; tab = b.dataset.book; try { localStorage.setItem('ielts-listen-book', tab); } catch (err) { /* ignore */ } list(v); };
  }

  /* ---------- test ---------- */
  async function run(v, bookId, tn, which) {
    const b = book(bookId), t = b && b.tests[tn - 1];
    if (!t) { list(v); return; }
    const full = which === 'full';
    let parts = full ? t.parts : [t.parts[+which - 1]];
    if (!parts[0]) { list(v); return; }
    v.innerHTML = '<div class="wrap"><p class="muted">Loading the recording…</p></div>';
    if (!(await App.media.available(b))) {
      v.innerHTML = '<div class="wrap"><a class="btn ghost sm mb" href="#/listening">' + I('back') + ' Listening</a><div class="card empty"><h2>' + U.esc(b.title) + ' isn’t on this device yet</h2><p>Import the <b>' + b.id + '.zip</b> book pack once, and this test will work here (also offline).</p><a class="btn" href="#/settings">Go to Settings</a></div></div>';
      return;
    }
    const url = App.media.url;
    parts = await Promise.all(parts.map(async p => Object.assign({}, p, { audio: await url(p.audio), pages: await Promise.all(p.pages.map(url)), script: await Promise.all(p.script.map(url)) })));
    const qs = []; parts.forEach(p => { for (let q = p.from; q <= p.to; q++) qs.push(q); });
    const hasKey = qs.every(q => keyInfo(t, q));
    const title = b.title + ' · Test ' + t.n + (full ? '' : ' · Part ' + parts[0].p);
    const st = { exam: true, cur: 0, started: false, done: false, ended: false };

    v.innerHTML = '<div class="wrap" style="max-width:1300px"><div class="row between mb"><a class="btn ghost sm" href="#/listening">' + I('back') + ' Listening</a><button class="btn" id="sub">Submit answers</button></div>' +
      '<div class="eyebrow">' + U.esc(b.title) + '</div><h1>Test ' + t.n + (full ? ' · Full listening test' : ' · Part ' + parts[0].p) + '</h1>' +
      '<div class="player mb"><button class="btn light" id="play">' + I('play') + ' Start recording</button><div class="grow" style="flex:1;min-width:180px"><div class="row between" style="font-size:.85rem;color:#BCD3F2"><span id="lbl">' + (full ? 'Part 1 of 4' : 'Part ' + parts[0].p) + '</span><span id="time">0:00</span></div><div class="prog" style="margin-top:6px"><i id="bar"></i></div></div>' +
      '<label class="row" style="gap:6px;font-size:.9rem"><input type="checkbox" id="exam" checked> Exam mode</label>' +
      '<select id="rate" aria-label="Speed" hidden><option value="0.8">0.8×</option><option value="0.9">0.9×</option><option value="1" selected>1×</option><option value="1.1">1.1×</option><option value="1.25">1.25×</option></select>' +
      '<button class="btn soft" id="pause" hidden style="background:rgba(255,255,255,.14);color:#fff">' + I('pause') + '</button></div>' +
      '<audio id="au" preload="metadata"></audio>' +
      '<p class="muted" id="hint" style="margin-top:-6px">Exam mode: the recording plays once without pausing, like the real test. Read the questions before you start. Turn exam mode off to pause, rewind and change speed.</p>' +
      '<div class="split"><div class="pane card" id="paper"></div><div class="pane card" id="sheet"><h3>Answer sheet</h3>' +
      parts.map(p => '<div class="qgroup"><div class="instr"><b>Part ' + p.p + '</b> · Questions ' + p.from + '–' + p.to + '</div>' +
        Array.from({ length: p.to - p.from + 1 }, (_, i) => p.from + i).map(q => '<div class="qitem" data-n="' + q + '"><div class="qnum">' + q + '</div><div class="qbody"><input class="input" name="q' + q + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Answer ' + q + '"></div></div>').join('') + '</div>').join('') +
      '</div></div><div id="result"></div></div>';

    const au = U.$('#au', v), play = U.$('#play', v), pause = U.$('#pause', v), bar = U.$('#bar', v), time = U.$('#time', v), lbl = U.$('#lbl', v), rate = U.$('#rate', v);
    const showPaper = i => {
      const p = parts[i];
      U.$('#paper', v).innerHTML = '<div class="row between"><h3 style="margin:0">Question paper · Part ' + p.p + '</h3><small>Questions ' + p.from + '–' + p.to + '</small></div>' +
        (p.pages.length ? p.pages.map(src => '<img src="' + U.esc(src) + '" alt="Test ' + t.n + ' Part ' + p.p + ' questions" loading="lazy" style="width:100%;border-radius:10px;border:1px solid var(--line);margin-top:12px;background:#fff">').join('')
          : '<div class="note mt">The question pages for this part haven’t been imported from your book yet. For now, open the book alongside: <a href="' + U.esc(b.drive) + '" target="_blank" rel="noopener">' + U.esc(b.title) + ' in Drive ' + I('ext') + '</a> (Test ' + t.n + ', Listening, Part ' + p.p + ').</div>') +
        (full ? '<div class="row mt">' + parts.map((pp, j) => '<button class="btn sm ' + (j === i ? '' : 'ghost') + '" data-pg="' + j + '">Part ' + pp.p + '</button>').join('') + '</div>' : '');
      U.$$('[data-pg]', v).forEach(bt => bt.onclick = () => showPaper(+bt.dataset.pg));
    };
    const load = i => { st.cur = i; au.src = parts[i].audio; au.playbackRate = st.exam ? 1 : +rate.value; lbl.textContent = full ? 'Part ' + parts[i].p + ' of 4' : 'Part ' + parts[i].p; showPaper(i); };
    const ui = () => {
      au.controls = !st.exam;
      rate.hidden = st.exam; pause.hidden = st.exam || !st.started;
      play.disabled = st.exam && st.started && !st.done;
      play.innerHTML = I('play') + (st.started ? (st.exam && !st.done ? ' Playing…' : ' Play') : ' Start recording');
      pause.innerHTML = I(au.paused ? 'play' : 'pause');
      U.$('#hint', v).textContent = st.exam ? 'Exam mode: the recording plays once without pausing, like the real test. Read the questions before you start. Turn exam mode off to pause, rewind and change speed.' : 'Practice mode: use the player to pause, rewind or slow down. Your score still counts, but try exam mode before test day.';
    };
    au.ontimeupdate = () => { if (au.duration) { bar.style.width = (au.currentTime / au.duration * 100) + '%'; time.textContent = U.fmtClock(au.currentTime) + ' / ' + U.fmtClock(au.duration); } };
    au.onplay = au.onpause = ui;
    au.onended = () => {
      if (st.cur + 1 < parts.length) { load(st.cur + 1); au.play().catch(() => { st.started = false; ui(); U.toast('Tap play to continue with Part ' + parts[st.cur].p); }); return; }
      st.ended = true; App.busy = false; U.toast('That is the end of the recording. Check your answers and submit.');
      if (st.exam) { st.done = true; ui(); }
    };
    au.onerror = () => U.toast('Could not load the recording file');
    play.onclick = () => { st.started = true; App.busy = true; au.play().then(ui).catch(e => U.toast('Playback blocked: ' + e.message)); ui(); };
    pause.onclick = () => { au.paused ? au.play() : au.pause(); };
    rate.onchange = () => { au.playbackRate = +rate.value; };
    U.$('#exam', v).onchange = e => { st.exam = e.target.checked; if (st.exam) au.playbackRate = 1; ui(); };
    App.onLeave(() => { au.pause(); au.removeAttribute('src'); App.busy = false; });
    // tap a page to see it full size
    v.addEventListener('click', e => { const im = e.target.closest('#paper img, #result img'); if (im) U.modal('<img src="' + U.esc(im.getAttribute('src')) + '" alt="" style="width:100%;display:block;background:#fff;border-radius:8px"><div class="row mt" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); });
    load(0); ui();

    U.$('#sub', v).onclick = async () => {
      const ans = {}; qs.forEach(q => { ans[q] = (U.$('[name=q' + q + ']', v).value || '').trim(); });
      if (!st.ended && !(await U.confirm('The recording hasn’t finished yet. Submit anyway?', 'Submit'))) return;
      au.pause(); App.busy = false; st.done = true; ui();
      U.$('#sub', v).disabled = true;
      U.$$('#sheet input', v).forEach(i => i.disabled = true);
      if (!hasKey) {
        U.$('#result', v).innerHTML = '<div class="card mt"><h3>Answers saved</h3><p>The answer key for this test hasn’t been imported yet, so it can’t be marked automatically. Check your answers with the key at the back of your book.</p></div>';
        S.attempt({ skill: 'listening', ref: b.id + '-t' + t.n + (full ? '-full' : '-p' + parts[0].p), title: title + ' (unmarked)', answers: ans });
        return;
      }
      const res = mark(t, qs, ans), raw = res.filter(r => r.ok).length, band = App.bands.listening(raw, qs.length);
      S.attempt({ skill: 'listening', ref: b.id + '-t' + t.n + (full ? '-full' : '-p' + parts[0].p), title, raw, total: qs.length, band });
      res.forEach(r => {
        const el = U.$('.qitem[data-n="' + r.q + '"]', v); el.classList.add(r.ok ? 'right' : 'wrong');
        if (!r.ok) { const n = document.createElement('div'); n.className = 'answer-note'; n.innerHTML = 'Correct: <b>' + U.esc(r.correct) + '</b>'; el.querySelector('.qbody').appendChild(n); }
      });
      const scripts = [...new Set(parts.flatMap(p => p.script))];
      U.$('#result', v).innerHTML = '<div class="card card-hero mt" style="text-align:center"><small>Score</small><div class="band-big">' + raw + '/' + qs.length + '</div><p class="muted" style="margin:6px 0">Estimated Listening band <b style="color:#fff;font-size:1.3rem">' + U.bandStr(band) + '</b>' + (qs.length < 40 ? ' (≈ ' + Math.round(raw / qs.length * 40) + '/40)' : '') + '. Exam mode is now off, so you can replay the recording and check what you missed.</p></div>' +
        (scripts.length ? '<div class="card mt"><h3>Audioscript</h3>' + scripts.map(src => '<img src="' + U.esc(src) + '" alt="Audioscript" loading="lazy" style="width:100%;border-radius:10px;border:1px solid var(--line);margin-top:10px;background:#fff">').join('') + '</div>' : '');
      U.$('#exam', v).checked = false; st.exam = false; ui();
      U.$('#result', v).scrollIntoView({ behavior: 'smooth', block: 'center' });
      App.refreshNav();
    };
  }
  App.views.listening = (v, parts) => parts[0] && parts[1] ? run(v, parts[0], +parts[1], parts[2] || 'full') : list(v);
})(window.App);

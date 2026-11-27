/* Vocabulary test engine — daily test (≥10 learned items, due first) and quick checks */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;

  /* pick an item (one concrete word/phrase) from a unit */
  function itemOf(u) {
    if (u.kind === 'f') { const m = U.rand(u.f.m); return { en: m[0], vi: m[3], ipa: m[2], pos: m[1], ex: m[4], fam: u.f }; }
    const x = u.p || u.c; return { en: u.p ? x.p : x.c, vi: x.vi, ex: x.ex, pos: u.p ? 'phrasal verb' : 'collocation' };
  }
  function distractors(u, it, field, n = 3) {
    const pool = [];
    App.units.list.forEach(o => {
      if (o.id === u.id) return;
      if (o.kind !== u.kind && !(u.kind !== 'f' && o.kind !== 'f')) return;
      if (o.kind === 'f') o.f.m.forEach(m => { if (!it.pos || m[1] === it.pos || Math.random() < .25) pool.push(field === 'en' ? m[0] : m[3]); });
      else { const x = o.p || o.c; pool.push(field === 'en' ? (o.p ? x.p : x.c) : x.vi); }
    });
    const out = [];
    U.shuffle(pool).forEach(p => { if (out.length < n && p !== it[field] && !out.includes(p)) out.push(p); });
    return out;
  }
  function blank(ex, phrase) {
    const re = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return re.test(ex) ? ex.replace(re, '_____') : null;
  }
  const TYPES = ['vi2en', 'en2vi', 'gap', 'type'];
  function makeQ(u, type) {
    const it = itemOf(u);
    let t = type || U.rand(TYPES);
    if (t === 'gap' && !blank(it.ex, it.en)) t = 'vi2en';
    if (t === 'type' && it.en.length > 22) t = 'vi2en';
    const q = { u, it, t };
    if (t === 'vi2en') { q.prompt = 'Which English ' + (u.kind === 'f' ? 'word' : u.kind === 'p' ? 'phrasal verb' : 'collocation') + ' means <span class="vi">“' + U.esc(it.vi) + '”</span>?'; q.opts = U.shuffle([it.en].concat(distractors(u, it, 'en'))); q.answer = it.en; }
    else if (t === 'en2vi') { q.prompt = 'What does <span class="serif">“' + U.esc(it.en) + '”</span>' + (it.ipa ? ' <span class="ipa">/' + U.esc(it.ipa) + '/</span>' : '') + ' mean?'; q.opts = U.shuffle([it.vi].concat(distractors(u, it, 'vi'))); q.answer = it.vi; }
    else if (t === 'gap') {
      q.prompt = 'Complete the sentence:<div class="serif" style="font-family:var(--serif);font-weight:500;margin-top:8px">' + U.esc(blank(it.ex, it.en)) + '</div>';
      let opts = [it.en];
      if (u.kind === 'f') u.f.m.forEach(m => { if (m[0] !== it.en && opts.length < 4) opts.push(m[0]); }); // other forms of the same family = word-formation test
      distractors(u, it, 'en').forEach(d => { if (opts.length < 4 && !opts.includes(d)) opts.push(d); });
      q.opts = U.shuffle(opts); q.answer = it.en;
    } else { q.prompt = 'Type the English ' + (u.kind === 'f' ? 'word (' + U.esc(posName(it.pos)) + ')' : 'phrase') + ' for <span class="vi">“' + U.esc(it.vi) + '”</span><div class="muted" style="font-size:1rem;margin-top:6px">Starts with “' + U.esc(it.en.slice(0, 2)) + '…” · ' + it.en.length + ' letters</div>'; q.answer = it.en; }
    q.t = t;
    return q;
  }
  function posName(p) { return ({ n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', 'n/v': 'noun/verb' })[p] || p || ''; }

  /* choose units for the daily test: due first, then weakest/random — at least `min` questions */
  function selectDaily(min) {
    const learned = App.units.learned();
    if (!learned.length) return [];
    const now = Date.now();
    const due = U.shuffle(learned.filter(u => (S.vs(u.id).due || 0) <= now));
    const rest = U.shuffle(learned.filter(u => (S.vs(u.id).due || 0) > now)).sort((a, b) => S.vs(a.id).box - S.vs(b.id).box);
    let pick = due.concat(rest).slice(0, Math.max(min, Math.min(due.length, 20)));
    while (pick.length < min) pick = pick.concat(U.shuffle(learned)).slice(0, min); // fewer learned items than min: repeat with other question types
    return U.shuffle(pick);
  }

  App.quiz = {
    makeQ,
    start(v, unitIds, opt = {}) {
      const min = opt.min || +S.s.settings.quizSize || 10;
      if (!unitIds) {
        const units = selectDaily(min);
        if (units.length) return App.phraseTest.run(v, units, { title: opt.title || 'Daily test', back: '#/home', quit: opt.auto ? 'Later' : 'Quit', again: () => App.quiz.start(v, null, { min }) });
      }
      let units = unitIds ? unitIds.map(id => App.units.byId[id]).filter(Boolean) : selectDaily(min);
      if (unitIds) { while (units.length < min) units = units.concat(U.shuffle(unitIds.map(id => App.units.byId[id]))); units = units.slice(0, Math.max(min, unitIds.length)); }
      const lastType = {};
      const qs = units.map(u => { const avoid = lastType[u.id]; let t; do { t = U.rand(TYPES); } while (t === avoid && Math.random() < .8); lastType[u.id] = t; return makeQ(u, t); });
      const res = [];
      let i = 0;
      const title = opt.title || 'Daily test';
      const head = () => '<div class="row between mb"><div><div class="eyebrow">' + U.esc(title) + '</div><b>Question ' + (i + 1) + ' of ' + qs.length + '</b></div><a class="btn ghost sm" href="#/home">' + (opt.auto ? 'Later' : 'Quit') + '</a></div><div class="dots mb">' + qs.map((_, j) => '<i class="' + (j < i ? (res[j] ? 'ok' : 'bad') : j === i ? 'cur' : '') + '"></i>').join('') + '</div>';
      const show = () => {
        const q = qs[i];
        v.innerHTML = '<div class="wrap"><div class="q-card">' + head() + '<div class="card"><span class="chip outline">' + (q.u.kind === 'f' ? 'Word family · ' + U.esc(q.u.f.r) : q.u.kind === 'p' ? 'Phrasal verb' : 'Collocation') + '</span><div class="q-prompt">' + q.prompt + '</div>' +
          (q.opts ? '<div class="opts">' + q.opts.map((o, k) => '<button class="opt" data-k="' + k + '"><b style="color:var(--muted);margin-right:8px">' + 'ABCD'[k] + '</b>' + U.esc(o) + '</button>').join('') + '</div>'
            : '<form id="tf" class="row"><input class="input" id="ta" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;font-size:1.1rem" placeholder="Type your answer"><button class="btn">Check</button></form>') +
          '<div id="fb"></div></div></div></div>';
        const done = (ok, chosenEl) => {
          res[i] = ok; S.review(q.u.id, ok);
          if (q.opts) U.$$('.opt', v).forEach((b, k) => { b.disabled = true; if (q.opts[k] === q.answer) b.classList.add('right'); else if (b === chosenEl) b.classList.add('wrong'); });
          const it = q.it;
          U.$('#fb', v).innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✓ Correct!' : '✗ Not quite — the answer is “' + U.esc(q.answer) + '”') + '</b><div class="row mt" style="gap:8px"><b>' + U.esc(it.en) + '</b>' + (it.ipa ? '<span class="ipa">/' + U.esc(it.ipa) + '/</span>' : '') + '<span class="vi">' + U.esc(it.vi) + '</span><button class="icon-btn" id="sp">' + I('sound') + '</button></div><div style="font-family:var(--serif);margin-top:6px">' + D.wrap(it.ex) + '</div></div>' + App.notes.show('v:' + q.u.id) +
            '<div class="row mt" style="justify-content:flex-end"><button class="btn lg" id="nx">' + (i + 1 < qs.length ? 'Next ' + I('arrow') : 'See results') + '</button></div>';
          U.$('#sp', v).onclick = () => App.tts.speak(it.en);
          const nx = U.$('#nx', v); nx.focus(); nx.onclick = () => { i++; i < qs.length ? show() : finish(); };
        };
        if (q.opts) U.$$('.opt', v).forEach(b => b.onclick = () => done(q.opts[+b.dataset.k] === q.answer, b));
        else { const inp = U.$('#ta', v); setTimeout(() => inp.focus(), 50); U.$('#tf', v).onsubmit = e => { e.preventDefault(); if (!inp.value.trim()) return; inp.disabled = true; done(U.norm(inp.value) === U.norm(q.answer), null); }; }
      };
      const finish = () => {
        const ok = res.filter(Boolean).length, pct = U.pct(ok, qs.length);
        App.refreshNav();
        const missed = qs.filter((q, j) => !res[j]);
        v.innerHTML = '<div class="wrap"><div class="q-card"><div class="card card-hero" style="text-align:center"><div class="eyebrow">' + U.esc(title) + ' complete</div><div class="band-big">' + ok + '/' + qs.length + '</div><p class="muted">' + (pct >= 90 ? 'Excellent — these words are sticking.' : pct >= 70 ? 'Good work. Missed items come back sooner.' : 'Keep going — missed items are scheduled for tomorrow.') + '</p></div>' +
          (missed.length ? '<div class="card"><h3>Review these</h3>' + missed.map(q => '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>' + U.esc(q.it.en) + '</b> ' + (q.it.ipa ? '<span class="ipa">/' + U.esc(q.it.ipa) + '/</span> ' : '') + '— <span class="vi">' + U.esc(q.it.vi) + '</span><br><small>' + U.esc(q.it.ex) + '</small>' + (App.notes.has('v:' + q.u.id) ? '<div class="nt clip mini">📝 ' + U.esc(App.notes.get('v:' + q.u.id)) + '</div>' : '') + '<a class="btn sm ghost mt" href="#/vocab/item/' + encodeURIComponent(q.u.id) + '">' + I('note') + (App.notes.has('v:' + q.u.id) ? ' Open note' : ' Add a note') + '</a></div>').join('') + '</div>' : '') +
          '<div class="row mt" style="justify-content:center"><a class="btn ghost" href="#/vocab">Vocabulary</a><a class="btn soft" href="#/quiz/phrases">Phrase test</a><button class="btn" id="again">' + I('spark') + ' Another test</button><a class="btn soft" href="#/home">Home</a></div></div></div>';
        U.$('#again', v).onclick = () => App.quiz.start(v, null, { min });
      };
      if (!qs.length) {
        v.innerHTML = '<div class="wrap"><div class="card empty"><h2>No learned words yet</h2><p>The daily test checks words you have already learned. Learn your first five word families, then come back.</p><a class="btn" href="#/vocab/learn/f">' + I('plus') + ' Learn 5 word families</a></div></div>';
        return;
      }
      show();
    }
  };
  App.views.quiz = function (v, parts, params) { if (parts[0] === 'phrases') return App.phraseTest.setup(v); App.quiz.start(v, null, { auto: params.auto === '1', title: params.auto === '1' ? 'Welcome back — daily test' : 'Daily test' }); };
})(window.App);

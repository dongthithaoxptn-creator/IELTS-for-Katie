/* Reading practice */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict, Q = App.Q;
  function best(skill, id) { const a = S.s.attempts.filter(x => x.skill === skill && x.ref === id); return a.length ? a.reduce((m, x) => x.band > m.band ? x : m) : null; }
  App.bestAttempt = best;

  function list(v) {
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">IELTS Builder · Reading</div><h1>Academic Reading</h1><p>About 20 minutes per passage. Tap any word to see its meaning. Your band is estimated from the official 40-question conversion table.</p></div></div>' +
      App.data.reading.map(r => { const b = best('reading', r.id); const n = Q.flat(r.groups).length; return '<a class="list-item" href="#/reading/' + r.id + '"><span class="icon-btn" style="width:46px;height:46px">' + I('read') + '</span><div class="grow"><h3>' + U.esc(r.title) + '</h3><small>' + U.esc(r.topic) + ' · ' + n + ' questions · ' + r.groups.map(g => ({ tfng: 'T/F/NG', gap: 'completion', mcq: 'multiple choice', match: 'matching' })[g.type]).join(', ') + '</small></div>' + (b ? '<div style="text-align:right"><span class="band-pill">' + U.bandStr(b.band) + '</span><br><small>best ' + b.raw + '/' + b.total + '</small></div>' : '<span class="chip outline">Not tried</span>') + '</a>'; }).join('') +
      '</div>';
  }
  function test(v, id) {
    const r = App.data.reading.find(x => x.id === id);
    if (!r) { list(v); return; }
    D.setGloss(r.gloss);
    v.innerHTML = '<div class="wrap" style="max-width:1300px"><div class="row between mb"><a class="btn ghost sm" href="#/reading">' + I('back') + ' Reading</a><div class="row"><span class="timer" id="tm"></span><button class="btn" id="sub">Submit answers</button></div></div>' +
      '<div class="split"><div class="pane card passage"><div class="eyebrow">' + U.esc(r.topic) + '</div><h2>' + U.esc(r.title) + '</h2>' + r.paras.map((p, i) => '<p><span class="pl">' + 'ABCDEFGH'[i] + '</span>' + D.wrap(p) + '</p>').join('') + '</div>' +
      '<div class="pane card" id="qs">' + Q.render(r.groups) + '<div id="result"></div></div></div></div>';
    App.notes.attach('r:' + r.id, { kind: 'reading', title: 'Reading · ' + r.title, href: '#/reading/' + r.id });
    const t = Q.timer(U.$('#tm', v), (r.minutes || 20) * 60);
    App.onLeave(t.stop);
    U.$('#sub', v).onclick = async () => {
      const qs = U.$('#qs', v);
      const ans = Q.collect(qs, r.groups);
      const blanks = ans.filter(a => !a).length;
      if (blanks && !(await U.confirm(blanks + ' question' + (blanks > 1 ? 's are' : ' is') + ' unanswered. Submit anyway?', 'Submit'))) return;
      t.stop();
      const res = Q.mark(r.groups, ans);
      const band = App.bands.reading(res.raw, res.total);
      S.attempt({ skill: 'reading', ref: r.id, title: r.title, raw: res.raw, total: res.total, band, secs: Math.round(t.elapsed()) });
      Q.show(qs, res);
      U.$('#sub', v).disabled = true;
      U.$('#result', v).innerHTML = '<div class="card card-hero mt" style="text-align:center"><small>Score</small><div class="band-big">' + res.raw + '/' + res.total + '</div><p class="muted" style="margin:6px 0">Estimated Reading band <b style="font-size:1.3rem">' + U.bandStr(band) + '</b> (≈ ' + Math.round(res.raw / res.total * 40) + '/40) · time ' + U.fmtClock(t.elapsed()) + '</p><div class="row" style="justify-content:center"><a class="btn light" href="#/reading">More passages</a><button class="btn glass" id="retry">Try again</button></div></div>';
      U.$('#retry', v).onclick = () => test(v, id);
      U.$('#result', v).scrollIntoView({ behavior: 'smooth', block: 'center' });
      App.refreshNav();
    };
  }
  App.views.reading = (v, parts) => parts[0] ? test(v, parts[0]) : list(v);
})(window.App);

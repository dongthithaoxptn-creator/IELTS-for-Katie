/* Home dashboard */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  App.views.home = function (v) {
    const s = S.s, est = App.bands.estimate(), UN = App.units;
    const learned = UN.learned().length, total = UN.list.length, due = UN.due().length;
    const wl = UN.wordsLearned(), wt = UN.wordsTotal();
    const today = S.day(), streak = App.streak();
    const totalSec = Object.values(s.activity).reduce((n, d) => n + (d.sec || 0), 0);
    const h = new Date().getHours();
    const greet = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + (s.settings.name ? ', ' + U.esc(s.settings.name) : '');
    const target = +s.settings.target || 7;
    let countdown = '';
    if (s.settings.examDate) { const d = U.daysBetween(U.dayKey(), s.settings.examDate); countdown = d >= 0 ? '<span class="chip">' + I('clock') + ' ' + d + ' days to your exam</span>' : ''; }
    const nextFam = UN.of('f').find(u => !S.isLearned(u.id));
    const skill = (k, label, icon) => '<a class="card fam-card tint" data-c="' + App.SEC[k] + '" href="#/' + k + '" style="padding:16px"><div class="row between"><span class="row" style="gap:10px"><span class="ic-bubble" style="width:36px;height:36px;border-radius:12px">' + I(icon) + '</span><b>' + label + '</b></span><span class="band-pill ' + (est[k] == null ? 'none' : '') + '">' + U.bandStr(est[k]) + '</span></div><div class="bar mt"><i style="width:' + (est[k] ? Math.min(100, est[k] / 9 * 100) : 0) + '%"></i></div><small>' + (est.counts[k] || 0) + ' attempts · target ' + target.toFixed(1) + '</small></a>';
    const recent = s.attempts.slice(-5).reverse();

    v.innerHTML = '<div class="wrap">' +
      '<div class="card card-hero"><div class="row between" style="align-items:flex-start"><div><div class="eyebrow">' + U.esc(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })) + '</div><h1>' + greet + '</h1><p class="muted" style="margin-bottom:14px">' + (due ? due + ' word' + (due > 1 ? 's are' : ' is') + ' due for review today.' : learned ? 'You’re up to date with reviews.' : 'Start by learning your first word families.') + '</p>' +
      '<div class="row"><a class="btn light lg" href="#/quiz">' + I('spark') + ' Daily test</a><a class="btn glass lg" href="#/vocab/learn/f">' + I('plus') + ' Learn new words</a></div></div>' +
      '<div style="text-align:right"><small>Estimated overall band</small><div class="band-big">' + U.bandStr(est.overall) + '</div><small>' + (est.overall != null ? 'CEFR ' + App.bands.cefr(est.overall) + ' · target ' + target.toFixed(1) : 'complete a test to see it') + '</small><div class="mt">' + countdown + '</div></div></div></div>' +

      '<div class="grid g4 mt">' +
      '<div class="card stat tint" data-c="lav"><small>Words learned</small><b>' + wl + '</b><div class="bar mt"><i style="width:' + U.pct(wl, wt) + '%"></i></div><small>' + U.pct(wl, wt) + '% of ' + wt + ' in your bank</small></div>' +
      '<div class="card stat tint" data-c="pink"><small>Due for review</small><b>' + due + '</b><small>' + learned + ' of ' + total + ' items learned</small></div>' +
      '<div class="card stat tint" data-c="aqua"><small>Study time today</small><b>' + U.fmtDur(today.sec) + '</b><small>' + U.fmtDur(totalSec) + ' in total</small></div>' +
      '<div class="card stat tint" data-c="peach"><small>Streak</small><b>' + streak + (streak === 1 ? ' day' : ' days') + '</b><small>since ' + U.fmtDate(new Date(s.meta.startDay + 'T12:00')) + '</small></div>' +
      '</div>' +

      '<h2 class="mt2">Your four skills</h2><div class="grid g4">' + skill('listening', 'Listening', 'listen') + skill('reading', 'Reading', 'read') + skill('writing', 'Writing', 'write') + skill('speaking', 'Speaking', 'speak') + '</div>' +

      '<div class="grid g2 mt2">' +
      '<div class="card tint" data-c="lav"><h3>Next word family</h3>' + (nextFam ? '<div class="fam-card"><div class="root">' + U.esc(nextFam.f.r) + '</div><p class="muted">' + nextFam.f.m.map(m => U.esc(m[0])).join(' · ') + '</p><a class="btn" href="#/vocab/item/' + encodeURIComponent(nextFam.id) + '">Study this family ' + I('arrow') + '</a></div>' : '<p class="muted">You’ve learned every family in the bank. Add more in Settings → Grow your word bank.</p>') + '</div>' +
      '<div class="card tint" data-c="blue"><h3>Recent activity</h3>' + (recent.length ? recent.map(a => '<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><b>' + U.esc(cap(a.skill)) + '</b> · ' + U.esc(a.title || '') + '<br><small>' + U.fmtDate(a.ts) + (a.raw != null ? ' · ' + a.raw + '/' + a.total : '') + '</small></span><span class="band-pill">' + U.bandStr(a.band) + '</span></div>').join('') : '<p class="muted">No tests yet. Try a <a href="#/reading">Reading</a> passage or a <a href="#/listening">Listening</a> section to get your first band estimate.</p>') + '</div>' +
      '</div>' + (App.notes.count() ? '<div class="mt">' + App.notes.recentHTML(3) + '</div>' : '') + '</div>';
  };
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  App.util.cap = cap;
})(window.App);

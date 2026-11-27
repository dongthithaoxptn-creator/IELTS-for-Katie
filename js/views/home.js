/* Home: your words, phrases and collocations at a glance */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  const KIND = [['f', 'Word families', 'lav'], ['p', 'Phrasal verbs', 'aqua'], ['c', 'Collocations', 'mint']];
  App.views.home = function (v) {
    const s = S.s, UN = App.units;
    const learned = UN.learned().length, total = UN.list.length, due = UN.due().length;
    const wl = UN.wordsLearned(), wt = UN.wordsTotal();
    const allAct = S.allActivity(), today = allAct[U.dayKey()] || S.day(), streak = App.streak();
    const totalSec = Object.values(allAct).reduce((n, d) => n + (d.sec || 0), 0);
    const h = new Date().getHours();
    const greet = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + (s.settings.name ? ', ' + U.esc(s.settings.name) : '');
    let countdown = '';
    if (s.settings.examDate) { const d = U.daysBetween(U.dayKey(), s.settings.examDate); countdown = d >= 0 ? '<span class="chip">' + I('clock') + ' ' + d + ' days to your exam</span>' : ''; }
    const nextFam = UN.of('f').find(u => !S.isLearned(u.id));
    const acc = today.reviewed ? Math.round(today.correct / today.reviewed * 100) : null;

    // where you are in each of your books: the first unit that isn't finished
    const books = (App.data.bookSets || []).map((b, i) => {
      const items = n => UN.list.filter(u => u.refs && u.refs.some(r => r.set === b.id && r.n === n));
      const un = b.units.find(x => items(x.n).some(u => !S.isLearned(u.id)));
      const all = UN.list.filter(u => u.refs && u.refs.some(r => r.set === b.id)), l = all.filter(u => S.isLearned(u.id)).length;
      const it = un ? items(un.n) : [], il = it.filter(u => S.isLearned(u.id)).length;
      return '<a class="card fam-card tint" data-c="' + ['lav', 'aqua', 'mint', 'pink', 'peach'][i % 5] + '" href="' + (un ? '#/vocab/unit/' + b.id + '/' + un.n : '#/vocab?tab=b') + '" style="padding:16px"><div class="row between"><b>' + U.esc(b.short || b.title) + '</b><small>' + l + ' / ' + all.length + '</small></div>' +
        '<div class="bar mt"><i style="width:' + U.pct(l, all.length) + '%"></i></div>' +
        (un ? '<p style="margin:10px 0 0"><small>Continue with</small><br><b>Unit ' + un.n + ' · ' + U.esc(un.t) + '</b> <small>(' + il + '/' + it.length + ')</small></p>' : '<p style="margin:10px 0 0"><b>Book finished 🎉</b></p>') + '</a>';
    });

    v.innerHTML = '<div class="wrap">' +
      '<div class="card card-hero"><div class="row between" style="align-items:flex-start"><div><div class="eyebrow">' + U.esc(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })) + '</div><h1>' + greet + '</h1><p class="muted" style="margin-bottom:14px">' + (due ? due + ' item' + (due > 1 ? 's are' : ' is') + ' due for review today.' : learned ? 'You’re up to date with reviews.' : 'Start by learning your first words, phrasal verbs or collocations.') + '</p>' +
      '<div class="row"><a class="btn light lg" href="#/quiz">' + I('spark') + ' Daily test</a><a class="btn glass lg" href="#/quiz/phrases">' + I('spark') + ' Phrase test</a><a class="btn glass lg" href="#/vocab">' + I('plus') + ' Learn new words</a></div></div>' +
      '<div style="text-align:right"><small>Words learned</small><div class="band-big">' + wl + '</div><small>' + U.pct(wl, wt) + '% of ' + wt + ' in your bank</small><div class="mt">' + countdown + '</div></div></div></div>' +

      '<div class="grid g4 mt">' +
      '<div class="card stat tint" data-c="pink"><small>Due for review</small><b>' + due + '</b><small>' + learned + ' of ' + total + ' items learned</small></div>' +
      '<div class="card stat tint" data-c="lav"><small>Reviewed today</small><b>' + (today.reviewed || 0) + '</b><small>' + (acc != null ? acc + '% correct' : 'no reviews yet today') + '</small></div>' +
      '<div class="card stat tint" data-c="aqua"><small>Study time today</small><b>' + U.fmtDur(today.sec) + '</b><small>' + U.fmtDur(totalSec) + ' in total</small></div>' +
      '<div class="card stat tint" data-c="peach"><small>Streak</small><b>' + streak + (streak === 1 ? ' day' : ' days') + '</b><small>since ' + U.fmtDate(new Date(s.meta.startDay + 'T12:00')) + '</small></div>' +
      '</div>' +

      (books.length ? '<h2 class="mt2">Your books</h2><div class="grid g3">' + books.join('') + '</div>' : '') +

      '<h2 class="mt2">Your word bank</h2><div class="grid g3">' + KIND.map(([k, name, c]) => {
        const all = UN.of(k), l = all.filter(u => S.isLearned(u.id)).length, m = all.filter(u => S.vs(u.id).box >= 5).length;
        return '<a class="card fam-card tint" data-c="' + c + '" href="#/vocab?tab=' + k + '" style="padding:16px"><div class="row between"><b>' + name + '</b><small>' + l + ' / ' + all.length + '</small></div><div class="bar mt"><i style="width:' + U.pct(l, all.length) + '%"></i></div><small>' + m + ' mastered</small></a>';
      }).join('') + '</div>' +

      '<div class="grid g2 mt2">' +
      '<div class="card tint" data-c="lav"><h3>Next word family</h3>' + (nextFam ? '<div class="fam-card"><div class="root">' + U.esc(nextFam.f.r) + '</div><p class="muted">' + nextFam.f.m.map(m => U.esc(m[0])).join(' · ') + '</p><a class="btn" href="#/vocab/item/' + encodeURIComponent(nextFam.id) + '">Study this family ' + I('arrow') + '</a></div>' : '<p class="muted">You’ve learned every family in the bank. Add more in Settings → Grow your word bank.</p>') + '</div>' +
      (App.notes.count() ? App.notes.recentHTML(3) : '<div class="card tint" data-c="butter"><h3>' + I('note') + ' Your notes</h3><p class="muted">Write notes or handwrite on any word or book unit. They come back when you review.</p><a class="btn sm ghost" href="#/vocab?tab=b">Open your books</a></div>') +
      '</div></div>';
  };
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  App.util.cap = cap;
})(window.App);

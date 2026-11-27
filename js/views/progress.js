/* Progress: vocabulary mastery, memory strength, review accuracy and study time */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;

  function studyBars(days) {
    const vals = days.map(d => (S.allActivity()[d] || {}).sec || 0), max = Math.max(1800, Math.max.apply(null, vals));
    const W = 640, H = 160, B = 22, bw = W / days.length;
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" style="color:var(--muted)" role="img" aria-label="Study time, last 14 days">' + days.map((d, i) => { const h = vals[i] / max * (H - B - 10); return '<rect x="' + (i * bw + 4) + '" y="' + (H - B - h) + '" width="' + (bw - 8) + '" height="' + Math.max(h, 1.5) + '" rx="4" fill="#2F6FD0" fill-opacity="' + (vals[i] ? 1 : .2) + '"><title>' + d + ': ' + U.fmtDur(vals[i]) + '</title></rect><text x="' + (i * bw + bw / 2) + '" y="' + (H - 6) + '" font-size="10.5" text-anchor="middle" fill="currentColor">' + d.slice(8) + '</text>'; }).join('') + '</svg>';
  }
  function heat() {
    const cells = [], d = new Date(); d.setDate(d.getDate() - 7 * 16 + 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
    const today = U.dayKey();
    for (let k = 0; k < 7 * 17; k++) {
      const key = U.dayKey(d); if (key > today) break;
      const a = S.allActivity()[key] || {}, m = (a.sec || 0) / 60;
      const lv = m === 0 && !a.reviewed && !a.tasks ? 0 : m < 10 ? 1 : m < 25 ? 2 : m < 50 ? 3 : 4;
      cells.push('<i class="' + (lv ? 'l' + lv : '') + '" title="' + key + ': ' + Math.round(m) + ' min"></i>');
      d.setDate(d.getDate() + 1);
    }
    return '<div class="heat">' + cells.join('') + '</div><div class="row mt" style="gap:6px"><small>Less</small><span class="heat" style="grid-template-rows:1fr"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><small>More</small></div>';
  }

  function accuracyBars(days) {
    const A = S.allActivity(), W = 640, H = 150, B = 22, bw = W / days.length;
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" style="color:var(--muted)" role="img" aria-label="Daily test accuracy, last 14 days">' + days.map((d, i) => {
      const a = A[d] || {}, pct = a.reviewed ? a.correct / a.reviewed : null, h = pct == null ? 0 : pct * (H - B - 14);
      return (pct == null ? '' : '<rect x="' + (i * bw + 4) + '" y="' + (H - B - h) + '" width="' + (bw - 8) + '" height="' + Math.max(h, 1.5) + '" rx="4" fill="var(--acc)" opacity=".85"><title>' + d + ': ' + Math.round(pct * 100) + '% of ' + a.reviewed + '</title></rect>') +
        '<text x="' + (i * bw + bw / 2) + '" y="' + (H - 6) + '" font-size="10" text-anchor="middle" fill="currentColor">' + (+d.slice(8)) + '</text>';
    }).join('') + '</svg>';
  }

  App.views.progress = function (v) {
    const s = S.s, UN = App.units, A = S.allActivity();
    const totalSec = Object.values(A).reduce((n, d) => n + (d.sec || 0), 0);
    const daysActive = Object.values(A).filter(d => d.sec >= 60 || d.reviewed || d.learned).length;
    const since = U.daysBetween(s.meta.startDay, U.dayKey()) + 1;
    const days = []; for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); days.push(U.dayKey(d)); }
    const week = days.slice(7).reduce((n, d) => n + ((A[d] || {}).sec || 0), 0);
    const rev = Object.values(A).reduce((n, d) => n + (d.reviewed || 0), 0), cor = Object.values(A).reduce((n, d) => n + (d.correct || 0), 0);
    const boxes = [0, 0, 0, 0, 0, 0]; UN.learned().forEach(u => { boxes[Math.min(6, S.vs(u.id).box) - 1]++; });
    const bmax = Math.max(1, Math.max.apply(null, boxes));
    const wl = UN.wordsLearned(), wt = UN.wordsTotal(), mastered = UN.learned().filter(u => S.vs(u.id).box >= 5).length;
    const books = (App.data.bookSets || []).map((b, i) => {
      const all = UN.list.filter(u => u.refs && u.refs.some(r => r.set === b.id)), l = all.filter(u => S.isLearned(u.id)).length, m = all.filter(u => S.vs(u.id).box >= 5).length;
      return '<div class="mt"><div class="row between"><b>' + U.esc(b.title) + '</b><small>' + l + ' / ' + all.length + ' learned · ' + m + ' mastered</small></div><div class="bar mt" style="height:8px"><i style="width:' + U.pct(l, all.length) + '%"></i></div></div>';
    }).join('');

    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">Progress</div><h1>How far you’ve come</h1><p>Studying for ' + since + ' day' + (since > 1 ? 's' : '') + ' · ' + daysActive + ' active days · ' + U.fmtDur(totalSec) + ' in total</p></div></div>' +
      '<div class="grid g4">' +
      '<div class="card stat tint" data-c="lav"><small>Words learned</small><b>' + wl + '</b><small>' + U.pct(wl, wt) + '% of ' + wt + '</small></div>' +
      '<div class="card stat tint" data-c="mint"><small>Mastered</small><b>' + mastered + '</b><small>items in box 5–6</small></div>' +
      '<div class="card stat tint" data-c="pink"><small>Reviews</small><b>' + rev + '</b><small>' + (rev ? Math.round(cor / rev * 100) + '% correct' : 'take a daily test') + '</small></div>' +
      '<div class="card stat tint" data-c="peach"><small>Streak</small><b>' + App.streak() + '</b><small>days in a row</small></div></div>' +
      '<div class="grid g2 mt"><div class="card tint" data-c="lav"><h3>Vocabulary mastery</h3>' + ['f', 'p', 'c'].map(k => { const all = UN.of(k), l = all.filter(u => S.isLearned(u.id)).length, m = all.filter(u => S.vs(u.id).box >= 5).length; return '<div class="mt"><div class="row between"><b>' + ({ f: 'Word families', p: 'Phrasal verbs', c: 'Collocations' })[k] + '</b><small>' + l + ' / ' + all.length + ' learned · ' + m + ' mastered</small></div><div class="bar mt" style="height:8px"><i style="width:' + U.pct(l, all.length) + '%"></i></div></div>'; }).join('') +
      (books ? '<h3 class="mt2">Your books</h3>' + books : '') +
      '<h3 class="mt2">Memory strength</h3><div class="boxes">' + boxes.map(n => '<div style="height:' + (n / bmax * 100) + '%" title="' + n + ' items"></div>').join('') + '</div><div class="row between"><small>box 1</small><small>→</small><small>box 6 (mastered)</small></div><p class="muted" style="margin:8px 0 0"><small>Each correct answer in a test moves an item up a box and spaces its next review further out (1, 2, 4, 8, 16, 32 days). A wrong answer sends it back to box 1.</small></p></div>' +
      '<div class="card tint" data-c="aqua"><h3>Study time · last 14 days</h3>' + studyBars(days) + '<p class="muted">' + U.fmtDur(week) + ' this week · ' + App.streak() + '-day streak</p>' +
      '<h3 class="mt">Daily test accuracy · last 14 days</h3>' + accuracyBars(days) +
      '<h3 class="mt">Activity · last 16 weeks</h3>' + heat() + '</div></div></div>';
  };
})(window.App);

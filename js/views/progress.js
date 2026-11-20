/* Progress: band estimate per skill, trends, vocabulary mastery, study time, history */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  const SK = [['listening', 'Listening'], ['reading', 'Reading'], ['writing', 'Writing'], ['speaking', 'Speaking']];
  let filter = '';

  function trend(points, target) {
    const W = 640, H = 220, L = 34, R = 14, T = 14, B = 28, pw = W - L - R, ph = H - T - B;
    const y = b => T + ph - (b - 3) / 6 * ph; // band 3–9 scale
    let g = '';
    for (let b = 3; b <= 9; b++) g += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y(b) + '" y2="' + y(b) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (L - 8) + '" y="' + (y(b) + 4) + '" font-size="11" text-anchor="end" fill="currentColor">' + b + '</text>';
    if (target) g += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y(target) + '" y2="' + y(target) + '" stroke="#E0A100" stroke-dasharray="5 4" stroke-width="1.5"/><text x="' + (L + pw) + '" y="' + (y(target) - 6) + '" font-size="11" text-anchor="end" fill="#B07A00">target ' + target.toFixed(1) + '</text>';
    const colors = { listening: '#14A3A3', reading: '#2F80C8', writing: '#8A7BEA', speaking: '#E0A100' };
    const all = points.flat(); if (!all.length) return '';
    const t0 = Math.min.apply(null, all.map(p => p.ts)), t1 = Math.max.apply(null, all.map(p => p.ts));
    const x = ts => L + (t1 === t0 ? pw / 2 : (ts - t0) / (t1 - t0) * pw);
    SK.forEach(([k], si) => {
      const pts = points[si]; if (!pts.length) return;
      if (pts.length > 1) g += '<polyline fill="none" stroke="' + colors[k] + '" stroke-width="2.5" points="' + pts.map(p => x(p.ts) + ',' + y(Math.max(3, p.band))).join(' ') + '"/>';
      pts.forEach(p => { g += '<circle cx="' + x(p.ts) + '" cy="' + y(Math.max(3, p.band)) + '" r="4" fill="' + colors[k] + '"><title>' + U.esc(k + ' ' + U.bandStr(p.band) + ' · ' + U.fmtDate(p.ts)) + '</title></circle>'; });
    });
    g += '<text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="currentColor">' + U.fmtDate(t0) + '</text><text x="' + (L + pw) + '" y="' + (H - 6) + '" font-size="11" text-anchor="end" fill="currentColor">' + U.fmtDate(t1) + '</text>';
    const legend = SK.map(([k, n]) => '<span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:' + colors[k] + ';display:inline-block"></i><small>' + n + '</small></span>').join('');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" style="color:var(--muted)" role="img" aria-label="Band score trend">' + g + '</svg><div class="row" style="gap:16px">' + legend + '</div>';
  }
  function studyBars(days) {
    const vals = days.map(d => (S.s.activity[d] || {}).sec || 0), max = Math.max(1800, Math.max.apply(null, vals));
    const W = 640, H = 160, B = 22, bw = W / days.length;
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" style="color:var(--muted)" role="img" aria-label="Study time, last 14 days">' + days.map((d, i) => { const h = vals[i] / max * (H - B - 10); return '<rect x="' + (i * bw + 4) + '" y="' + (H - B - h) + '" width="' + (bw - 8) + '" height="' + Math.max(h, 1.5) + '" rx="4" fill="#2F6FD0" fill-opacity="' + (vals[i] ? 1 : .2) + '"><title>' + d + ': ' + U.fmtDur(vals[i]) + '</title></rect><text x="' + (i * bw + bw / 2) + '" y="' + (H - 6) + '" font-size="10.5" text-anchor="middle" fill="currentColor">' + d.slice(8) + '</text>'; }).join('') + '</svg>';
  }
  function heat() {
    const cells = [], d = new Date(); d.setDate(d.getDate() - 7 * 16 + 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
    const today = U.dayKey();
    for (let k = 0; k < 7 * 17; k++) {
      const key = U.dayKey(d); if (key > today) break;
      const a = S.s.activity[key] || {}, m = (a.sec || 0) / 60;
      const lv = m === 0 && !a.reviewed && !a.tasks ? 0 : m < 10 ? 1 : m < 25 ? 2 : m < 50 ? 3 : 4;
      cells.push('<i class="' + (lv ? 'l' + lv : '') + '" title="' + key + ': ' + Math.round(m) + ' min"></i>');
      d.setDate(d.getDate() + 1);
    }
    return '<div class="heat">' + cells.join('') + '</div><div class="row mt" style="gap:6px"><small>Less</small><span class="heat" style="grid-template-rows:1fr"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><small>More</small></div>';
  }

  App.views.progress = function (v) {
    const s = S.s, est = App.bands.estimate(), target = +s.settings.target || 7, UN = App.units;
    const totalSec = Object.values(s.activity).reduce((n, d) => n + (d.sec || 0), 0);
    const daysActive = Object.values(s.activity).filter(d => d.sec >= 60 || d.reviewed || d.tasks).length;
    const since = U.daysBetween(s.meta.startDay, U.dayKey()) + 1;
    const days = []; for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); days.push(U.dayKey(d)); }
    const week = days.slice(7).reduce((n, d) => n + ((s.activity[d] || {}).sec || 0), 0);
    const pts = SK.map(([k]) => App.bands.history(k).map(a => ({ ts: a.ts, band: a.band })));
    const boxes = [0, 0, 0, 0, 0, 0]; UN.learned().forEach(u => { boxes[Math.min(6, S.vs(u.id).box) - 1]++; });
    const bmax = Math.max(1, Math.max.apply(null, boxes));
    const gap = est.overall != null ? target - est.overall : null;
    const att = s.attempts.filter(a => !filter || a.skill === filter).slice().reverse();
    const bandCard = ([k, n]) => { const b = est[k]; return '<div class="card" style="padding:16px"><div class="row between"><b>' + n + '</b><span class="band-pill ' + (b == null ? 'none' : '') + '">' + U.bandStr(b) + '</span></div><div class="bar mt" style="position:relative"><i style="width:' + (b ? b / 9 * 100 : 0) + '%"></i></div><div class="row between"><small>' + est.counts[k] + ' attempts</small><small>' + (b == null ? 'no data' : b >= target ? '✓ at target' : (target - b).toFixed(1) + ' to target') + '</small></div></div>'; };

    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">Progress</div><h1>How far you’ve come</h1><p>Studying for ' + since + ' day' + (since > 1 ? 's' : '') + ' · ' + daysActive + ' active days · ' + U.fmtDur(totalSec) + ' in total</p></div></div>' +
      '<div class="grid g2"><div class="card card-hero"><small>Estimated overall band</small><div class="row" style="align-items:flex-end;gap:14px"><div class="band-big">' + U.bandStr(est.overall) + '</div><div style="padding-bottom:6px">' + (est.overall != null ? '<b>CEFR ' + App.bands.cefr(est.overall) + '</b><br><small>' + (gap > 0 ? gap.toFixed(1) + ' below your target of ' + target.toFixed(1) : 'At or above your target 🎯') + '</small>' : '<small>Complete Reading, Listening, Writing and Speaking tasks to get an estimate.</small>') + '</div></div>' +
      '<p class="muted" style="margin:12px 0 0"><small>' + (est.complete ? 'Average of your four skill bands, rounded the IELTS way (.25 → .5, .75 → next band).' : 'Provisional — based on ' + SK.filter(([k]) => est[k] != null).length + ' of 4 skills.') + ' Each skill band weights your most recent 6 attempts more heavily; Writing Task 2 counts double Task 1, as in the real test.</small></p></div>' +
      '<div class="grid g2">' + SK.map(bandCard).join('') + '</div></div>' +
      '<div class="card mt"><h3>Band trend</h3>' + (pts.flat().length ? trend(pts, target) : '<p class="muted">Your scores will be plotted here after your first tests.</p>') + '</div>' +
      '<div class="grid g2 mt"><div class="card"><h3>Vocabulary mastery</h3>' + ['f', 'p', 'c'].map(k => { const all = UN.of(k), l = all.filter(u => S.isLearned(u.id)).length, m = all.filter(u => S.vs(u.id).box >= 5).length; return '<div class="mt"><div class="row between"><b>' + ({ f: 'Word families', p: 'Phrasal verbs', c: 'Collocations' })[k] + '</b><small>' + l + ' learned · ' + m + ' mastered / ' + all.length + '</small></div><div class="bar" style="margin-top:6px"><i style="width:' + U.pct(l, all.length) + '%"></i></div></div>'; }).join('') +
      '<h3 class="mt2">Memory strength</h3><div class="boxes">' + boxes.map(n => '<div style="height:' + (n / bmax * 100) + '%" title="' + n + ' items"></div>').join('') + '</div><div class="row between"><small>new</small><small>box 1 → 6</small><small>mastered</small></div><p class="muted" style="margin:8px 0 0"><small>Each correct answer moves an item up a box and pushes its next review further away (1, 2, 4, 8, 16, 32 days). A wrong answer sends it back to box 1.</small></p></div>' +
      '<div class="card"><h3>Study time · last 14 days</h3>' + studyBars(days) + '<p class="muted">' + U.fmtDur(week) + ' this week · ' + App.streak() + '-day streak</p><h3 class="mt">Activity · last 16 weeks</h3>' + heat() + '</div></div>' +
      '<div class="card mt"><div class="row between"><h3 style="margin:0">All attempts</h3><select class="input" id="flt" style="width:auto"><option value="">All skills</option>' + SK.map(([k, n]) => '<option value="' + k + '"' + (filter === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
      (att.length ? '<div class="table-wrap mt"><table class="t"><thead><tr><th>Date</th><th>Skill</th><th>Task</th><th>Score</th><th>Band</th></tr></thead><tbody>' + att.map(a => '<tr><td>' + U.fmtDate(a.ts) + '</td><td>' + U.cap(a.skill) + '</td><td>' + U.esc(a.title || '') + '</td><td>' + (a.raw != null ? a.raw + '/' + a.total : a.crit ? Object.entries(a.crit).map(([k, b]) => k.toUpperCase() + ' ' + U.bandStr(b)).join(' · ') : '') + '</td><td><b>' + U.bandStr(a.band) + '</b></td></tr>').join('') + '</tbody></table></div>' : '<p class="muted mt">No attempts yet.</p>') + '</div></div>';
    U.$('#flt', v).onchange = e => { filter = e.target.value; App.views.progress(v); };
  };
})(window.App);

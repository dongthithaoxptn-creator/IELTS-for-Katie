/* Writing practice: Task 1 visuals, Task 2 essays, live stats, strict AI marking, history */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;
  const COLORS = ['#2F6FD0', '#14A3A3', '#8DB4EA', '#E0A100'];
  const CRIT = { 1: { task: 'Task Achievement' }, 2: { task: 'Task Response' } };
  const CRIT_NAMES = t => ({ task: CRIT[t].task, cc: 'Coherence & Cohesion', lr: 'Lexical Resource', gra: 'Grammatical Range & Accuracy' });
  let tab = 1;

  /* ---------- charts ---------- */
  function niceMax(m) { const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p * 2) / 2 * p; }
  function chartSVG(c) {
    if (c.type === 'table') return '<div class="table-wrap"><table class="t"><caption style="text-align:left;font-weight:700;padding-bottom:8px">' + U.esc(c.title) + '</caption><thead><tr>' + c.cols.map(h => '<th>' + U.esc(h) + '</th>').join('') + '</tr></thead><tbody>' + c.rows.map(r => '<tr>' + r.map((x, i) => '<td' + (i ? ' style="font-variant-numeric:tabular-nums"' : '') + '>' + U.esc(x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    if (c.type === 'process') return '<b>' + U.esc(c.title) + '</b><div class="process mt">' + c.steps.map((s, i) => '<div class="step"><b>' + (i + 1) + '</b> ' + U.esc(s) + '</div>' + (i < c.steps.length - 1 ? '<span class="arrow">→</span>' : '')).join('') + '</div>';
    const W = 680, H = 330, L = 46, R = 130, T = 34, B = 40, pw = W - L - R, ph = H - T - B;
    const all = c.series.flatMap(s => s.values), max = niceMax(Math.max.apply(null, all));
    const y = val => T + ph - val / max * ph;
    let g = '<text x="' + L + '" y="18" font-weight="700" fill="currentColor" style="color:var(--ink)" font-size="14">' + U.esc(c.title) + '</text>';
    for (let k = 0; k <= 5; k++) { const val = max / 5 * k, yy = y(val); g += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + yy + '" y2="' + yy + '" stroke="currentColor" stroke-opacity=".15"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="12" fill="currentColor">' + (+val.toFixed(1)) + '</text>'; }
    if (c.type === 'line') {
      const xs = c.x.map((_, i) => L + (c.x.length === 1 ? pw / 2 : i / (c.x.length - 1) * pw));
      c.x.forEach((lab, i) => { g += '<text x="' + xs[i] + '" y="' + (T + ph + 22) + '" text-anchor="middle" font-size="12" fill="currentColor">' + U.esc(lab) + '</text>'; });
      c.series.forEach((s, si) => {
        g += '<polyline fill="none" stroke="' + COLORS[si] + '" stroke-width="2.5" points="' + s.values.map((val, i) => xs[i] + ',' + y(val)).join(' ') + '"/>';
        s.values.forEach((val, i) => { g += '<circle cx="' + xs[i] + '" cy="' + y(val) + '" r="3.5" fill="' + COLORS[si] + '"><title>' + U.esc(s.name + ' ' + c.x[i] + ': ' + val + (c.unit === '%' ? '%' : ' ' + c.unit)) + '</title></circle>'; });
      });
    } else {
      const gw = pw / c.cats.length, bw = Math.min(26, gw * 0.8 / c.series.length);
      c.cats.forEach((cat, ci) => {
        const x0 = L + ci * gw + (gw - bw * c.series.length) / 2;
        c.series.forEach((s, si) => { const val = s.values[ci]; g += '<rect x="' + (x0 + si * bw) + '" y="' + y(val) + '" width="' + (bw - 2) + '" height="' + (T + ph - y(val)) + '" rx="2" fill="' + COLORS[si] + '"><title>' + U.esc(s.name + ', ' + cat + ': ' + val + ' ' + c.unit) + '</title></rect>'; });
        g += '<text x="' + (L + ci * gw + gw / 2) + '" y="' + (T + ph + 22) + '" text-anchor="middle" font-size="12" fill="currentColor">' + U.esc(cat) + '</text>';
      });
    }
    c.series.forEach((s, si) => { const ly = T + 10 + si * 22; g += '<rect x="' + (L + pw + 16) + '" y="' + (ly - 9) + '" width="12" height="12" rx="2" fill="' + COLORS[si] + '"/><text x="' + (L + pw + 34) + '" y="' + (ly + 2) + '" font-size="12.5" fill="currentColor" style="color:var(--ink)">' + U.esc(s.name) + '</text>'; });
    g += '<text x="12" y="' + (T + ph / 2) + '" font-size="11" fill="currentColor" transform="rotate(-90 12 ' + (T + ph / 2) + ')" text-anchor="middle">' + U.esc(c.unit) + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + U.esc(c.title) + '" style="color:var(--muted);font-family:var(--sans)">' + g + '</svg>';
  }
  function dataText(c) {
    if (!c) return '';
    if (c.type === 'table') return c.title + '\n' + c.cols.join(' | ') + '\n' + c.rows.map(r => r.join(' | ')).join('\n');
    if (c.type === 'process') return c.title + ' — stages: ' + c.steps.map((s, i) => (i + 1) + ') ' + s).join('; ');
    const labels = c.x || c.cats;
    return c.title + ' (unit: ' + c.unit + ')\nCategories: ' + labels.join(', ') + '\n' + c.series.map(s => s.name + ': ' + s.values.join(', ')).join('\n');
  }

  /* ---------- local analysis (no AI needed) ---------- */
  const LINKERS = ['however', 'moreover', 'furthermore', 'in addition', 'additionally', 'therefore', 'consequently', 'as a result', 'thus', 'hence', 'nevertheless', 'nonetheless', 'although', 'whereas', 'while', 'on the other hand', 'in contrast', 'by contrast', 'similarly', 'likewise', 'for example', 'for instance', 'such as', 'in conclusion', 'to conclude', 'overall', 'firstly', 'secondly', 'finally', 'meanwhile', 'despite', 'in spite of', 'because', 'since', 'due to', 'owing to', 'in particular', 'notably', 'subsequently', 'accordingly'];
  const STOP = new Set('the a an and or but of to in on at for with by from is are was were be been being it its this that these those as which who whom whose than then there their they them he she his her we our you your i my me not no do does did have has had can could will would should may might must also more most very so such into about over under between after before during while if when where how what why all any some many much other others one two three'.split(' '));
  function analyse(text, task) {
    const words = text.toLowerCase().match(/[a-z][a-z'’\-]*/g) || [];
    const wc = U.words(text), min = task === 1 ? 150 : 250;
    const paras = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const sents = (text.match(/[^.!?]+[.!?]+/g) || []).length || (text.trim() ? 1 : 0);
    const low = ' ' + text.toLowerCase().replace(/\s+/g, ' ') + ' ';
    const linkUsed = LINKERS.filter(l => low.includes(' ' + l + ' ') || low.includes(' ' + l + ','));
    const freq = {}; words.forEach(w => { if (!STOP.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1; });
    const rep = Object.entries(freq).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const contractions = (text.match(/\b\w+['’](t|s|re|ve|ll|d|m)\b/gi) || []).filter(x => !/['’]s$/i.test(x));
    const unique = new Set(words).size;
    const warn = [];
    if (wc < min) warn.push('Under length: ' + wc + '/' + min + ' words. Under-length scripts lose marks in ' + (task === 1 ? 'Task Achievement' : 'Task Response') + '.');
    if (paras < (task === 1 ? 3 : 4)) warn.push('Only ' + paras + ' paragraph' + (paras === 1 ? '' : 's') + '. Use ' + (task === 1 ? 'an introduction, an overview and 1–2 detail paragraphs' : 'an introduction, 2–3 body paragraphs and a conclusion') + ' (leave a blank line between paragraphs).');
    if (task === 1 && !/\b(overall|in general|it is clear|it is evident|generally)\b/i.test(text)) warn.push('No clear overview found. Without an overview, Task Achievement is usually capped at Band 5.');
    if (contractions.length) warn.push('Contractions (' + contractions.slice(0, 3).join(', ') + ') are informal for academic writing.');
    if (/\b(i think|in my opinion)\b/gi.test(text) && (text.match(/\b(i think|in my opinion)\b/gi) || []).length > 2) warn.push('“I think / In my opinion” is repeated — vary how you give your view.');
    rep.forEach(([w, n]) => { if (n >= 5) warn.push('“' + w + '” appears ' + n + ' times — paraphrase some of them.'); });
    return { wc, min, paras, sents, avg: sents ? Math.round(wc / sents) : 0, linkUsed, rep, variety: words.length ? Math.round(unique / words.length * 100) : 0, warn };
  }
  function statsHTML(a) {
    return '<div class="grid g4"><div class="stat"><small>Words</small><b class="wc" style="color:' + (a.wc >= a.min ? 'var(--ok)' : 'var(--bad)') + '">' + a.wc + '</b><small>minimum ' + a.min + '</small></div><div class="stat"><small>Paragraphs</small><b>' + a.paras + '</b><small>' + a.sents + ' sentences</small></div><div class="stat"><small>Avg sentence</small><b>' + a.avg + '</b><small>words</small></div><div class="stat"><small>Linking devices</small><b>' + a.linkUsed.length + '</b><small>different ones</small></div></div>' +
      (a.warn.length ? '<div class="note mt"><b>Self-check</b><ul style="margin:6px 0 0;padding-left:18px">' + a.warn.map(w => '<li>' + U.esc(w) + '</li>').join('') + '</ul></div>' : '') +
      (a.linkUsed.length ? '<p class="mt" style="margin-bottom:0"><small>Linkers used: ' + a.linkUsed.map(U.esc).join(', ') + '</small></p>' : '');
  }

  /* ---------- feedback ---------- */
  App.feedbackHTML = function (r, kind, names) {
    const keys = Object.keys(names);
    const crit = keys.map(k => { const c = r.criteria[k]; return '<div class="crit"><div class="row between"><b>' + names[k] + '</b><span class="band-pill">' + U.bandStr(c.band) + '</span></div><p style="margin:10px 0 6px">' + U.esc(c.summary) + '</p>' +
      (c.evidence && c.evidence.length ? '<details><summary class="muted" style="cursor:pointer">Evidence (' + c.evidence.length + ')</summary><ul>' + c.evidence.map(e => '<li style="font-family:var(--serif)">' + U.esc(e) + '</li>').join('') + '</ul></details>' : '') +
      (c.limiting_features && c.limiting_features.length ? '<div class="mt"><small><b>Holding you back:</b></small><ul style="margin:4px 0;padding-left:18px">' + c.limiting_features.map(e => '<li><small>' + U.esc(e) + '</small></li>').join('') + '</ul></div>' : '') +
      '<div class="answer-note"><b>To reach the next band:</b> ' + U.esc(c.to_reach_next_band) + '</div></div>'; }).join('');
    const better = r.rewrite ? '<div class="card mt"><h3>Your weakest paragraph, rewritten at Band 8+</h3><div class="grid g2"><div><small>Original</small><p style="font-family:var(--serif)">' + U.esc(r.rewrite.original_paragraph) + '</p></div><div><small>Improved</small><p style="font-family:var(--serif)">' + D.wrap(r.rewrite.improved_paragraph) + '</p></div></div><p class="muted">' + U.esc(r.rewrite.why) + '</p></div>'
      : r.better_answer ? '<div class="card mt"><h3>Band 8 model answer</h3><p><b>' + U.esc(r.better_answer.question) + '</b></p><p style="font-family:var(--serif)">' + D.wrap(r.better_answer.model_answer) + '</p></div>' : '';
    return '<div class="card card-hero mt"><div class="row between"><div><div class="eyebrow" style="color:#8DB4EA">' + U.esc(kind) + ' · examiner-style marking</div><p style="margin:6px 0 0;max-width:640px">' + U.esc(r.examiner_summary) + '</p></div><div style="text-align:center"><small>Overall</small><div class="band-big">' + U.bandStr(r.overall) + '</div>' + (r.withPron != null ? '<small>FC · LR · GRA<br>' + U.bandStr(r.withPron) + ' incl. indicative pronunciation</small>' : '') + '</div></div></div>' +
      '<div class="grid g2 mt">' + crit + '</div>' +
      '<div class="grid g2 mt"><div class="card"><h3 style="color:var(--ok)">Strengths</h3><ul>' + r.strengths.map(s => '<li>' + U.esc(s) + '</li>').join('') + '</ul></div><div class="card"><h3 style="color:var(--bad)">Weaknesses</h3><ul>' + r.weaknesses.map(s => '<li>' + U.esc(s) + '</li>').join('') + '</ul></div></div>' +
      (r.errors.length ? '<div class="card mt"><h3>Errors & corrections (' + r.errors.length + ')</h3>' + r.errors.map(e => '<div class="err"><span class="chip bad">' + U.esc(e.type) + '</span> <del>' + U.esc(e.quote) + '</del> → <ins>' + U.esc(e.correction) + '</ins><div class="muted" style="font-size:.9rem;margin-top:4px">' + U.esc(e.explanation) + '</div></div>').join('') + '</div>' : '') +
      (r.vocabulary_upgrades.length ? '<div class="card mt"><h3>Vocabulary upgrades</h3><div class="table-wrap"><table class="t"><thead><tr><th>You wrote</th><th>Better</th><th>Why</th></tr></thead><tbody>' + r.vocabulary_upgrades.map(x => '<tr><td>' + U.esc(x.original) + '</td><td><b>' + U.esc(x.better) + '</b></td><td><small>' + U.esc(x.note) + '</small></td></tr>').join('') + '</tbody></table></div></div>' : '') +
      better +
      '<div class="card mt"><h3>Next steps</h3><ol>' + r.next_steps.map(s => '<li>' + U.esc(s) + '</li>').join('') + '</ol><p class="muted" style="margin:0"><small>AI marking follows the official public band descriptors and is strict by design, but it is still an estimate — read it as accurate to about ±0.5 band, the same margin trained examiners work within. Marked by' + U.esc(r.model || 'Claude') + '.</small></p></div>';
  };

  /* ---------- screens ---------- */
  function list(v) {
    const hist = S.s.writing;
    const rows = tab === 1 ? App.data.writing1.map(w => item(w.id, w.title, w.kind, 1)) : tab === 2 ? App.data.writing2.map(w => item(w.id, w.prompt.split('\n')[0].slice(0, 110) + (w.prompt.length > 110 ? '…' : ''), w.kind + ' · ' + w.topic, 2)) : null;
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">IELTS Builder · Writing</div><h1>Writing</h1><p>Write under timed conditions, then get strict, criterion-by-criterion marking based on the official IELTS band descriptors.</p></div><a class="btn ghost" href="#/writing/custom?task=' + (tab === 1 ? 1 : 2) + '">' + I('plus') + ' Use my own question</a></div>' +
      (!App.ai.enabled() ? '<div class="note mb">AI marking needs a Claude API key — add it in <a href="#/settings">Settings</a>. Without it you still get word count, structure checks and a copyable marking prompt.</div>' : '') +
      '<div class="tabs"><button data-t="1" class="' + (tab === 1 ? 'on' : '') + '">Task 1</button><button data-t="2" class="' + (tab === 2 ? 'on' : '') + '">Task 2</button><button data-t="3" class="' + (tab === 3 ? 'on' : '') + '">My essays (' + hist.length + ')</button></div>' +
      (rows ? rows.join('') : history()) + '</div>';
    v.querySelector('.tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { tab = +b.dataset.t; list(v); } };
    function item(id, title, sub, t) {
      const done = hist.filter(h => h.ref === id); const last = done[done.length - 1];
      return '<a class="list-item" href="#/writing/' + id + '"><span class="icon-btn" style="width:46px;height:46px">' + I('write') + '</span><div class="grow"><h3 style="font-size:1rem">' + U.esc(title) + '</h3><small>Task ' + t + ' · ' + U.esc(sub) + '</small></div>' + (last && last.result ? '<div style="text-align:right"><span class="band-pill">' + U.bandStr(last.result.overall) + '</span><br><small>' + done.length + ' attempt' + (done.length > 1 ? 's' : '') + '</small></div>' : '<span class="chip outline">' + (t === 1 ? '20 min' : '40 min') + '</span>') + '</a>';
    }
  }
  function history() {
    const H = S.s.writing;
    if (!H.length) return '<div class="empty">Your marked essays will appear here.</div>';
    return H.map((h, i) => [h, i]).reverse().map(([h, i]) => '<a class="list-item" href="#/writing/h/' + i + '"><div class="grow"><h3 style="font-size:1rem">Task ' + h.task + ' · ' + U.esc(h.title) + '</h3><small>' + U.fmtDate(h.ts) + ' · ' + h.words + ' words · ' + U.fmtClock(h.secs || 0) + '</small></div><span class="band-pill ' + (h.result ? '' : 'none') + '">' + (h.result ? U.bandStr(h.result.overall) : 'draft') + '</span></a>').join('');
  }
  function viewHistory(v, idx) {
    const h = S.s.writing[idx]; if (!h) { list(v); return; }
    v.innerHTML = '<div class="wrap"><a class="btn ghost sm mb" href="#/writing">' + I('back') + ' Writing</a><div class="card"><div class="eyebrow">Task ' + h.task + ' · ' + U.fmtDate(h.ts) + '</div><p style="white-space:pre-wrap">' + D.wrap(h.prompt) + '</p></div><div class="card"><h3>Your answer (' + h.words + ' words)</h3><div style="font-family:var(--serif);white-space:pre-wrap;line-height:1.7">' + U.esc(h.essay) + '</div></div>' +
      (h.result ? App.feedbackHTML(h.result, 'Writing Task ' + h.task, CRIT_NAMES(h.task)) : '') +
      '<div class="row mt"><a class="btn" href="#/writing/' + (h.ref || 'custom') + '">Write it again</a><button class="btn ghost danger" id="del" style="color:var(--bad)">Delete</button></div></div>';
    U.$('#del', v).onclick = async () => { if (await U.confirm('Delete this essay and its feedback?', 'Delete')) { S.s.writing.splice(idx, 1); S.save(); App.go('#/writing'); } };
  }
  function editor(v, id, params) {
    let w = App.data.writing1.find(x => x.id === id), task = 1;
    if (!w) { w = App.data.writing2.find(x => x.id === id); task = 2; }
    const custom = id === 'custom';
    if (custom) { task = +(params.task || 2); w = { id: 'custom', title: 'My own question', prompt: '' }; }
    if (!w) { list(v); return; }
    const key = 'ielts-draft-' + id + (custom ? task : '');
    let draft = ''; try { draft = localStorage.getItem(key) || ''; } catch (e) { /* ignore */ }
    let image = null;
    v.innerHTML = '<div class="wrap" style="max-width:1300px"><div class="row between mb"><a class="btn ghost sm" href="#/writing">' + I('back') + ' Writing</a><div class="row"><span class="timer" id="tm"></span><span class="chip">Task ' + task + '</span></div></div>' +
      '<div class="split"><div class="pane"><div class="card"><div class="eyebrow">Writing Task ' + task + (w.kind ? ' · ' + U.esc(w.kind) : '') + '</div>' +
      (custom ? '<label class="f" for="cp">Paste the question</label><textarea class="input" id="cp" rows="6" placeholder="Paste a Task ' + task + ' question, e.g. from your Cambridge IELTS books">' + '</textarea>' + (task === 1 ? '<label class="f mt" for="img">Chart / diagram image (optional — the marker will look at it)</label><input type="file" id="img" accept="image/*" class="input"><div id="imgp" class="mt"></div><label class="f mt" for="cd">…or type the key data (optional)</label><textarea class="input" id="cd" rows="3"></textarea>' : '')
        : '<p style="white-space:pre-wrap;font-family:var(--serif);font-size:1.05rem">' + D.wrap(w.prompt) + '</p>' + (w.chart ? '<div class="chart-box">' + chartSVG(w.chart) + '</div><p class="muted" style="margin:8px 0 0"><small>Figures are invented for practice.</small></p>' : '')) +
      '<p class="muted mt" style="margin-bottom:0">Write at least <b>' + (task === 1 ? 150 : 250) + ' words</b>. Suggested time: ' + (task === 1 ? 20 : 40) + ' minutes.</p></div></div>' +
      '<div class="pane"><textarea class="editor" id="ed" spellcheck="false" autocorrect="off" autocapitalize="sentences" placeholder="Start writing here… Leave a blank line between paragraphs.">' + U.esc(draft) + '</textarea>' +
      '<div class="row between mt"><span><b class="wc" id="wc">0</b> words</span><div class="row"><button class="btn ghost" id="cpy">Copy marking prompt</button><button class="btn" id="mark">' + I('spark') + ' Submit for marking</button></div></div>' +
      '<p class="muted" style="font-size:.85rem">Spell-check is off, as in the real exam. Drafts save automatically on this device.</p></div></div>' +
      '<div id="stats" class="card mt" hidden></div><div id="fb"></div></div>';
    const ed = U.$('#ed', v), wc = U.$('#wc', v);
    const t = App.Q.timer(U.$('#tm', v), (task === 1 ? 20 : 40) * 60); App.onLeave(t.stop);
    const upd = () => { const a = analyse(ed.value, task); wc.textContent = a.wc; wc.style.color = a.wc >= a.min ? 'var(--ok)' : ''; try { localStorage.setItem(key, ed.value); } catch (e) { /* ignore */ } return a; };
    ed.oninput = upd; upd();
    const imgIn = U.$('#img', v);
    if (imgIn) imgIn.onchange = () => {
      const f = imgIn.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { const im = new Image(); im.onload = () => { const sc = Math.min(1, 1600 / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = im.width * sc; cv.height = im.height * sc; cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); const url = cv.toDataURL('image/jpeg', 0.88); image = { type: 'image/jpeg', data: url.split(',')[1] }; U.$('#imgp', v).innerHTML = '<img src="' + url + '" alt="Uploaded chart" style="max-width:100%;border-radius:12px;border:1px solid var(--line)">'; }; im.src = rd.result; };
      rd.readAsDataURL(f);
    };
    const promptText = () => custom ? U.$('#cp', v).value.trim() : w.prompt;
    const dText = () => custom ? ((U.$('#cd', v) || {}).value || '').trim() : dataText(w.chart);
    U.$('#cpy', v).onclick = async () => {
      const txt = App.ai.manualPrompt(task, promptText(), dText(), ed.value);
      try { await navigator.clipboard.writeText(txt); U.toast('Copied — paste it into a Claude chat'); } catch (e) { U.modal('<h3>Marking prompt</h3><textarea class="input" rows="12">' + U.esc(txt) + '</textarea><div class="row mt" style="justify-content:flex-end"><button class="btn" data-close>Close</button></div>'); }
    };
    U.$('#mark', v).onclick = async () => {
      const a = upd();
      U.$('#stats', v).innerHTML = '<h3>Quick analysis</h3>' + statsHTML(a); U.$('#stats', v).hidden = false;
      if (custom && !promptText()) { U.toast('Paste the question first'); return; }
      if (a.wc < 20) { U.toast('Write a bit more before submitting'); return; }
      const rec = { ts: Date.now(), task, ref: w.id, title: custom ? promptText().slice(0, 70) : w.title || w.prompt.slice(0, 70), prompt: promptText(), essay: ed.value, words: a.wc, secs: Math.round(t.elapsed()) };
      if (!App.ai.enabled()) {
        U.$('#fb', v).innerHTML = '<div class="card mt"><h3>Want a band score?</h3><p>Add your Claude API key in <a href="#/settings">Settings</a> for strict examiner-style marking, or press <b>Copy marking prompt</b> and paste it into a Claude chat.</p></div>';
        S.s.writing.push(rec); S.save(); return;
      }
      const btn = U.$('#mark', v); btn.disabled = true; btn.textContent = 'Marking… (about 1 minute)';
      U.$('#fb', v).innerHTML = '<div class="card mt empty"><p>The examiner is reading your ' + (task === 1 ? 'report' : 'essay') + ' against each band descriptor…</p></div>';
      try {
        const r = await App.ai.markWriting({ task, prompt: rec.prompt, dataText: dText(), essay: ed.value, image });
        rec.result = r; S.s.writing.push(rec); S.save();
        S.attempt({ skill: 'writing', task, ref: w.id, title: 'Task ' + task + ' · ' + rec.title, band: r.overall, crit: { task: r.criteria.task.band, cc: r.criteria.cc.band, lr: r.criteria.lr.band, gra: r.criteria.gra.band } });
        t.stop();
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
        U.$('#fb', v).innerHTML = App.feedbackHTML(r, 'Writing Task ' + task, CRIT_NAMES(task));
        U.$('#fb', v).scrollIntoView({ behavior: 'smooth' });
        App.refreshNav();
      } catch (e) {
        U.$('#fb', v).innerHTML = '<div class="card mt"><h3>Marking failed</h3><p>' + U.esc(e.message) + '</p><p class="muted">Your draft is still saved. You can try again or use “Copy marking prompt”.</p></div>';
      }
      btn.disabled = false; btn.innerHTML = I('spark') + ' Submit for marking';
    };
  }
  App.views.writing = (v, parts, params) => parts[0] === 'h' ? viewHistory(v, +parts[1]) : parts[0] ? editor(v, parts[0], params) : list(v);
  App.writingTools = { chartSVG, analyse };
})(window.App);

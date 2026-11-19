/* Vocabulary: word families (tree), phrasal verbs, collocations, saved words, learning sessions */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;
  const KIND = { f: 'Word families', p: 'Phrasal verbs', c: 'Collocations', s: 'My saved words' };
  const POS = { v: 'verb', n: 'noun', 'n/v': 'noun / verb', adj: 'adjective', adv: 'adverb' };
  const ui = { tab: 'f', q: '', lv: '', st: '' };

  function status(id) {
    const v = S.vs(id);
    if (!v.box) return '<span class="chip outline">New</span>';
    if (v.box >= 5) return '<span class="chip ok">Mastered</span>';
    if ((v.due || 0) <= Date.now()) return '<span class="chip warn">Due</span>';
    return '<span class="chip">Learning · ' + v.box + '/6</span>';
  }
  function say(w) { return '<button class="icon-btn" data-say="' + U.esc(w) + '" aria-label="Pronounce ' + U.esc(w) + '">' + I('sound') + '</button>'; }
  function bindSay(root) { if (root._say) return; root._say = true; root.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.stopPropagation(); App.tts.speak(b.dataset.say); } }); }

  /* ---------- list ---------- */
  function list(v) {
    const UN = App.units;
    const kinds = ['f', 'p', 'c'];
    const prog = kinds.map(k => { const all = UN.of(k), l = all.filter(u => S.isLearned(u.id)).length; return '<div class="card stat" style="padding:16px"><small>' + KIND[k] + '</small><b>' + l + '<span style="font-size:1rem;color:var(--muted)"> / ' + all.length + '</span></b><div class="bar mt"><i style="width:' + U.pct(l, all.length) + '%"></i></div></div>'; }).join('');
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">Vocabulary builder</div><h1>Your word bank</h1><p>' + UN.wordsLearned() + ' of ' + UN.wordsTotal() + ' words learned · ' + UN.due().length + ' due for review</p></div>' +
      '<div class="row"><a class="btn ghost" href="#/quiz">' + I('spark') + ' Test me</a><a class="btn" href="#/vocab/learn/' + (ui.tab === 's' ? 'f' : ui.tab) + '">' + I('plus') + ' Learn 5 new</a></div></div>' +
      '<div class="grid g3 mb">' + prog + '</div>' +
      '<div class="tabs" role="tablist">' + Object.keys(KIND).map(k => '<button data-tab="' + k + '" class="' + (ui.tab === k ? 'on' : '') + '">' + KIND[k] + '</button>').join('') + '</div>' +
      (ui.tab !== 's' ? '<div class="row mb"><input class="input" id="vq" placeholder="Search English or Vietnamese…" value="' + U.esc(ui.q) + '" style="flex:2;min-width:180px"><select class="input" id="vlv" style="flex:1;min-width:110px"><option value="">All levels</option>' + ['B1', 'B2', 'C1', 'C2'].map(l => '<option' + (ui.lv === l ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><select class="input" id="vst" style="flex:1;min-width:130px"><option value="">Any status</option><option value="new"' + (ui.st === 'new' ? ' selected' : '') + '>New</option><option value="learned"' + (ui.st === 'learned' ? ' selected' : '') + '>Learned</option><option value="due"' + (ui.st === 'due' ? ' selected' : '') + '>Due</option></select></div>' : '') +
      '<div id="vlist"></div></div>';
    const draw = () => {
      const box = U.$('#vlist', v);
      if (ui.tab === 's') { box.innerHTML = saved(); return; }
      const q = U.norm(ui.q);
      const items = UN.of(ui.tab).filter(u => {
        if (ui.lv && u.lv !== ui.lv) return false;
        const vs = S.vs(u.id);
        if (ui.st === 'new' && vs.box) return false;
        if (ui.st === 'learned' && !vs.box) return false;
        if (ui.st === 'due' && !(vs.box && (vs.due || 0) <= Date.now())) return false;
        if (!q) return true;
        const hay = u.kind === 'f' ? u.f.r + ' ' + u.f.m.map(m => m[0] + ' ' + m[3]).join(' ') : u.kind === 'p' ? u.p.p + ' ' + u.p.vi : u.c.c + ' ' + u.c.vi;
        return U.norm(hay).includes(q);
      });
      if (!items.length) { box.innerHTML = '<div class="empty">Nothing matches these filters.</div>'; return; }
      if (ui.tab === 'f') {
        box.innerHTML = '<div class="grid gauto">' + items.map(u => '<a class="card fam-card" href="#/vocab/item/' + encodeURIComponent(u.id) + '"><div class="row between"><span class="root">' + U.esc(u.f.r) + '</span>' + status(u.id) + '</div><p class="muted" style="margin:6px 0 10px">' + u.f.m.map(m => U.esc(m[0])).join(' · ') + '</p><div class="row"><span class="chip">' + u.lv + '</span><span class="chip outline">' + U.esc(u.topic) + '</span>' + (u.f.ai ? '<span class="chip warn">AI-added</span>' : '') + '</div></a>').join('') + '</div>';
      } else {
        box.innerHTML = items.map(u => { const x = u.p || u.c; const head = u.p ? x.p : x.c; return '<a class="list-item" href="#/vocab/item/' + encodeURIComponent(u.id) + '"><div class="grow"><h3>' + U.esc(head) + '</h3><div class="vi">' + U.esc(x.vi) + '</div><small>' + U.esc(x.ex) + '</small></div><div style="text-align:right" class="stack"><span class="chip">' + u.lv + '</span><div>' + status(u.id) + '</div></div></a>'; }).join('');
      }
    };
    v.querySelector('.tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { ui.tab = b.dataset.tab; list(v); } };
    const q = U.$('#vq', v); if (q) q.oninput = () => { ui.q = q.value; draw(); };
    const lv = U.$('#vlv', v); if (lv) lv.onchange = () => { ui.lv = lv.value; draw(); };
    const st = U.$('#vst', v); if (st) st.onchange = () => { ui.st = st.value; draw(); };
    draw();
    if (!v._del) { v._del = true; v.addEventListener('click', e => {
      const del = e.target.closest('[data-del]'); if (!del) return;
      S.s.saved.splice(+del.dataset.del, 1); S.save(); U.$('#vlist', v).innerHTML = saved();
    }); }
    bindSay(v);
  }
  function saved() {
    const L = S.s.saved;
    if (!L.length) return '<div class="empty">Tap any word in a Reading passage, Listening transcript or question, then press <b>Save</b>. Your saved words appear here.</div>';
    return L.slice().reverse().map((w, ri) => { const i = L.length - 1 - ri; return '<div class="list-item"><div class="grow"><h3>' + U.esc(w.w) + ' <span class="ipa">' + (w.ipa ? '/' + U.esc(w.ipa) + '/' : '') + '</span></h3>' + (w.vi ? '<div class="vi">' + U.esc(w.vi) + '</div>' : '') + (w.def ? '<div>' + U.esc(w.def) + '</div>' : '') + (w.ctx ? '<small>“' + U.esc(w.ctx) + '”</small>' : '') + '</div><div class="row">' + say(w.w) + '<button class="icon-btn" data-del="' + i + '" aria-label="Remove">' + I('x') + '</button></div></div>'; }).join('');
  }

  /* ---------- detail ---------- */
  App.vocabCard = function (u) {
    if (u.kind === 'f') {
      const f = u.f, groups = {};
      f.m.forEach(m => { (groups[m[1]] = groups[m[1]] || []).push(m); });
      const order = ['v', 'n/v', 'n', 'adj', 'adv'].filter(k => groups[k]).concat(Object.keys(groups).filter(k => !['v', 'n/v', 'n', 'adj', 'adv'].includes(k)));
      return '<div class="tree"><div class="tree-root"><small>ROOT · ' + U.esc(f.lv) + ' · ' + U.esc(f.t || '') + '</small><div class="w">' + U.esc(f.r) + '</div><small>' + U.esc(f.ety || '') + '</small></div>' +
        '<div class="branches">' + order.map(k => '<div class="branch"><div class="pos-label">' + U.esc(POS[k] || k) + '</div>' + groups[k].map(m => '<div class="node"><div class="row between"><span class="w">' + U.esc(m[0]) + '</span>' + say(m[0]) + '</div><div class="ipa">/' + U.esc(m[2]) + '/</div><div class="vi">' + U.esc(m[3]) + '</div><div class="ex">' + D.wrap(m[4]) + '</div></div>').join('') + '</div>').join('') + '</div></div>' +
        (f.n ? '<div class="note mt"><b>Notes · Ghi chú:</b> ' + U.esc(f.n) + '</div>' : '');
    }
    const x = u.p || u.c, head = u.p ? x.p : x.c;
    return '<div class="flash"><div class="row between"><div><div class="eyebrow">' + (u.p ? 'Phrasal verb' : 'Collocation · ' + U.esc(x.ty || '')) + ' · ' + U.esc(u.lv) + '</div><div style="font-family:var(--serif);font-size:2rem;font-weight:700">' + U.esc(head) + '</div></div>' + say(head) + '</div>' +
      '<p class="vi" style="font-size:1.2rem;margin-top:8px">' + U.esc(x.vi) + '</p>' + (x.d ? '<p>' + U.esc(x.d) + '</p>' : '') + '<p style="font-family:var(--serif);font-size:1.1rem">' + D.wrap(x.ex) + '</p></div>';
  };
  function detail(v, id) {
    const u = App.units.byId[id];
    if (!u) { v.innerHTML = '<div class="empty">Item not found. <a href="#/vocab">Back to vocabulary</a></div>'; return; }
    const sib = App.units.of(u.kind), i = sib.indexOf(u);
    const prev = sib[i - 1], next = sib[i + 1];
    const vs = S.vs(id);
    v.innerHTML = '<div class="wrap"><div class="row between mb"><a class="btn ghost sm" href="#/vocab">' + I('back') + ' ' + KIND[u.kind] + '</a><div class="row">' + status(id) + (vs.box ? '<small>' + vs.ok + ' right · ' + vs.bad + ' wrong</small>' : '') + '</div></div>' +
      '<div class="card">' + App.vocabCard(u) + '</div>' +
      '<div class="row mt between"><div class="row">' + (prev ? '<a class="btn ghost" href="#/vocab/item/' + encodeURIComponent(prev.id) + '">' + I('back') + ' Previous</a>' : '') + (next ? '<a class="btn ghost" href="#/vocab/item/' + encodeURIComponent(next.id) + '">Next ' + I('arrow') + '</a>' : '') + '</div>' +
      '<div class="row">' + (vs.box ? '<button class="btn ghost" id="unl">Reset</button><button class="btn soft" id="tst">' + I('spark') + ' Test this</button>' : '<button class="btn" id="lrn">' + I('check') + ' Mark as learned</button>') + '</div></div></div>';
    const lrn = U.$('#lrn', v); if (lrn) lrn.onclick = () => { S.learn(id); U.toast('Added to your learned words'); App.refreshNav(); detail(v, id); };
    const unl = U.$('#unl', v); if (unl) unl.onclick = () => { S.unlearn(id); detail(v, id); };
    const tst = U.$('#tst', v); if (tst) tst.onclick = () => App.quiz.start(v, [id], { title: 'Quick check', min: 3 });
    bindSay(v);
  }

  /* ---------- learning session ---------- */
  function learn(v, kind) {
    const pool = App.units.of(kind).filter(u => !S.isLearned(u.id));
    if (!pool.length) { v.innerHTML = '<div class="wrap"><div class="card empty"><h2>All ' + KIND[kind].toLowerCase() + ' learned 🎉</h2><p>Add more in Settings → Grow your word bank, or review with the daily test.</p><a class="btn" href="#/quiz">Daily test</a></div></div>'; return; }
    const batch = pool.slice(0, 5);
    let i = 0;
    const step = () => {
      const u = batch[i];
      v.innerHTML = '<div class="wrap"><div class="row between mb"><a class="btn ghost sm" href="#/vocab">' + I('back') + ' Vocabulary</a><div class="row"><span class="chip">' + KIND[kind] + '</span><b>' + (i + 1) + ' / ' + batch.length + '</b></div></div>' +
        '<div class="dots mb">' + batch.map((_, j) => '<i class="' + (j < i ? 'ok' : j === i ? 'cur' : '') + '"></i>').join('') + '</div>' +
        '<div class="card">' + App.vocabCard(u) + '</div>' +
        '<div class="row mt" style="justify-content:flex-end"><button class="btn ghost" id="skip">Skip</button><button class="btn lg" id="got">' + I('check') + ' Got it — next</button></div></div>';
      bindSay(v);
      U.$('#got', v).onclick = () => { S.learn(u.id); next(); };
      U.$('#skip', v).onclick = () => { batch.splice(i, 1); i--; next(); };
    };
    const next = () => {
      i++;
      if (i < batch.length) { step(); return; }
      App.refreshNav();
      const ids = batch.filter(u => S.isLearned(u.id)).map(u => u.id);
      if (!ids.length) { App.go('#/vocab'); return; }
      v.innerHTML = '<div class="wrap"><div class="card empty"><h2>Nice — ' + ids.length + ' new item' + (ids.length > 1 ? 's' : '') + ' learned</h2><p>A quick check now makes them stick much better.</p><div class="row" style="justify-content:center"><a class="btn ghost" href="#/vocab">Later</a><button class="btn lg" id="chk">' + I('spark') + ' Quick check</button></div></div></div>';
      U.$('#chk', v).onclick = () => App.quiz.start(v, ids, { title: 'Quick check', min: Math.max(5, ids.length * 2) });
    };
    step();
  }

  App.views.vocab = function (v, parts) {
    if (parts[0] === 'item') return detail(v, parts[1]);
    if (parts[0] === 'learn') return learn(v, parts[1] || 'f');
    list(v);
  };
})(window.App);

/* Vocabulary: word families (tree), phrasal verbs, collocations, saved words, learning sessions */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;
  const KIND = { b: 'From my books', f: 'Word families', p: 'Phrasal verbs', c: 'Collocations', s: 'My saved words' };
  const POS = { v: 'verb', n: 'noun', 'n/v': 'noun / verb', adj: 'adjective', adv: 'adverb' };
  const ui = { tab: 'b', q: '', lv: '', st: '' };
  const unitItems = (sid, n) => App.units.list.filter(u => u.refs && u.refs.some(r => r.set === sid && r.n === n));
  const N = App.notes;
  const headOf = u => u.kind === 'f' ? u.f.r : u.p ? u.p.p : u.c.c;
  const noteMeta = u => ({ kind: 'vocab', title: headOf(u), href: '#/vocab/item/' + encodeURIComponent(u.id) });
  App.vocabNoteKey = id => 'v:' + id;

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
    const prog = kinds.map(k => { const all = UN.of(k), l = all.filter(u => S.isLearned(u.id)).length; return '<div class="card stat tint" data-c="' + ({ f: 'lav', p: 'aqua', c: 'mint' })[k] + '" style="padding:16px"><small>' + KIND[k] + '</small><b>' + l + '<span style="font-size:1rem;color:var(--muted)"> / ' + all.length + '</span></b><div class="bar mt"><i style="width:' + U.pct(l, all.length) + '%"></i></div></div>'; }).join('');
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">Vocabulary builder</div><h1>Your word bank</h1><p>' + UN.wordsLearned() + ' of ' + UN.wordsTotal() + ' words learned · ' + UN.due().length + ' due for review</p></div>' +
      '<div class="row"><a class="btn ghost" href="#/quiz">' + I('spark') + ' Test me</a><a class="btn" href="#/vocab/learn/' + (ui.tab === 's' || ui.tab === 'b' ? 'f' : ui.tab) + '">' + I('plus') + ' Learn 5 new</a></div></div>' +
      '<div class="grid g3 mb">' + prog + '</div>' +
      '<div class="tabs" role="tablist">' + Object.keys(KIND).map(k => '<button data-tab="' + k + '" class="' + (ui.tab === k ? 'on' : '') + '">' + KIND[k] + '</button>').join('') + '</div>' +
      (ui.tab !== 's' && ui.tab !== 'b' ? '<div class="row mb"><input class="input" id="vq" placeholder="Search English or Vietnamese…" value="' + U.esc(ui.q) + '" style="flex:2;min-width:180px"><select class="input" id="vlv" style="flex:1;min-width:110px"><option value="">All levels</option>' + ['B1', 'B2', 'C1', 'C2'].map(l => '<option' + (ui.lv === l ? ' selected' : '') + '>' + l + '</option>').join('') + '</select><select class="input" id="vst" style="flex:1;min-width:130px"><option value="">Any status</option><option value="new"' + (ui.st === 'new' ? ' selected' : '') + '>New</option><option value="learned"' + (ui.st === 'learned' ? ' selected' : '') + '>Learned</option><option value="due"' + (ui.st === 'due' ? ' selected' : '') + '>Due</option></select></div>' : '') +
      '<div id="vlist"></div></div>';
    const draw = () => {
      const box = U.$('#vlist', v);
      if (ui.tab === 's') { box.innerHTML = saved(); return; }
      if (ui.tab === 'b') { box.innerHTML = booksHTML(); return; }
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
        box.innerHTML = '<div class="grid gauto">' + items.map(u => '<a class="card fam-card" href="#/vocab/item/' + encodeURIComponent(u.id) + '"><div class="row between"><span class="root">' + U.esc(u.f.r) + N.mark('v:' + u.id) + '</span>' + status(u.id) + '</div><p class="muted" style="margin:6px 0 10px">' + u.f.m.map(m => U.esc(m[0])).join(' · ') + '</p><div class="row"><span class="chip">' + u.lv + '</span><span class="chip outline">' + U.esc(u.topic) + '</span>' + (u.f.ai ? '<span class="chip warn">AI-added</span>' : '') + '</div></a>').join('') + '</div>';
      } else {
        box.innerHTML = items.map(u => { const x = u.p || u.c; const head = u.p ? x.p : x.c; return '<a class="list-item" href="#/vocab/item/' + encodeURIComponent(u.id) + '"><div class="grow"><h3>' + U.esc(head) + N.mark('v:' + u.id) + '</h3><div class="vi">' + U.esc(x.vi) + '</div><small>' + U.esc(x.ex) + '</small></div><div style="text-align:right" class="stack"><span class="chip">' + u.lv + '</span><div>' + status(u.id) + '</div></div></a>'; }).join('');
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
      '<div class="card">' + App.vocabCard(u) + N.box('v:' + id, noteMeta(u), { rows: 3 }) + '</div>' +
      '<div class="row mt between"><div class="row">' + (prev ? '<a class="btn ghost" href="#/vocab/item/' + encodeURIComponent(prev.id) + '">' + I('back') + ' Previous</a>' : '') + (next ? '<a class="btn ghost" href="#/vocab/item/' + encodeURIComponent(next.id) + '">Next ' + I('arrow') + '</a>' : '') + '</div>' +
      '<div class="row">' + (vs.box ? '<button class="btn ghost" id="unl">Reset</button><button class="btn soft" id="tst">' + I('spark') + ' Test this</button>' : '<button class="btn" id="lrn">' + I('check') + ' Mark as learned</button>') + '</div></div></div>';
    const lrn = U.$('#lrn', v); if (lrn) lrn.onclick = () => { S.learn(id); U.toast('Added to your learned words'); App.refreshNav(); detail(v, id); };
    const unl = U.$('#unl', v); if (unl) unl.onclick = () => { S.unlearn(id); detail(v, id); };
    const tst = U.$('#tst', v); if (tst) tst.onclick = () => App.quiz.start(v, [id], { title: 'Quick check', min: 3 });
    bindSay(v);
  }

  /* ---------- learning session ---------- */
  function learn(v, kind, unitPool, label, back) {
    const pool = (unitPool || App.units.of(kind)).filter(u => !S.isLearned(u.id));
    label = label || KIND[kind]; back = back || '#/vocab';
    if (!pool.length) { v.innerHTML = '<div class="wrap"><div class="card empty"><h2>All ' + U.esc(label) + ' learned 🎉</h2><p>Review them with the daily test, or pick another unit.</p><div class="row" style="justify-content:center"><a class="btn ghost" href="' + back + '">Back</a><a class="btn" href="#/quiz">Daily test</a></div></div></div>'; return; }
    const batch = pool.slice(0, 5);
    let i = 0;
    const step = () => {
      const u = batch[i];
      v.innerHTML = '<div class="wrap"><div class="row between mb"><a class="btn ghost sm" href="' + back + '">' + I('back') + ' Back</a><div class="row"><span class="chip">' + U.esc(label) + '</span><b>' + (i + 1) + ' / ' + batch.length + '</b></div></div>' +
        '<div class="dots mb">' + batch.map((_, j) => '<i class="' + (j < i ? 'ok' : j === i ? 'cur' : '') + '"></i>').join('') + '</div>' +
        '<div class="card">' + App.vocabCard(u) + N.box('v:' + u.id, noteMeta(u), { ph: 'Add a note to help you remember this: your own example, a similar word, a Vietnamese tip…' }) + '</div>' +
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

  /* ---------- your books ---------- */
  function booksHTML() {
    const sets = App.data.bookSets;
    if (!sets.length) return '<div class="empty">Vocabulary from your books (English Collocations in Use, English Phrasal Verbs in Use…) isn’t on this device yet.<br>Import the <b>vocab.zip</b> pack in <a href="#/settings">Settings → Cambridge books on this device</a>.</div>';
    const BOOKC = ['lav', 'aqua', 'mint', 'pink', 'peach'];
    return sets.map((s, si) => {
      const all = App.units.list.filter(u => u.refs && u.refs.some(r => r.set === s.id)), lrn = all.filter(u => S.isLearned(u.id)).length;
      return '<div class="card mb tint" data-c="' + BOOKC[si % BOOKC.length] + '"><div class="row between"><div><h2 style="margin:0">' + U.esc(s.title) + '</h2><small>' + s.units.length + ' units · ' + lrn + ' of ' + all.length + ' learned</small></div><span class="chip">' + (s.kind === 'c' ? 'Collocations' : 'Phrasal verbs') + '</span></div>' +
        '<div class="grid g2 mt" style="gap:10px">' + s.units.map(un => { const it = unitItems(s.id, un.n), l = it.filter(u => S.isLearned(u.id)).length;
          return '<a class="list-item" style="margin:0" href="#/vocab/unit/' + s.id + '/' + un.n + '"><div class="grow"><b>Unit ' + un.n + ' · ' + U.esc(un.t) + '</b>' + N.mark('u:' + s.id + ':' + un.n) + '<div class="bar" style="height:6px;margin-top:8px"><i style="width:' + U.pct(l, it.length) + '%"></i></div></div><small>' + l + '/' + it.length + '</small></a>'; }).join('') + '</div></div>';
    }).join('');
  }
  function unitPage(v, sid, n) {
    const set = App.data.bookSets.find(s => s.id === sid), un = set && set.units.find(x => x.n === n);
    if (!un) { ui.tab = 'b'; list(v); return; }
    const items = unitItems(sid, n), learned = items.filter(u => S.isLearned(u.id));
    v.innerHTML = '<div class="wrap"><a class="btn ghost sm mb" href="#/vocab?tab=b">' + I('back') + ' From my books</a>' +
      '<div class="page-head"><div><div class="eyebrow">' + U.esc(set.title) + ' · Unit ' + n + '</div><h1>' + U.esc(un.t) + '</h1><p>' + learned.length + ' of ' + items.length + ' learned</p></div>' +
      '<div class="row"><button class="btn ghost" id="ut">' + I('spark') + ' Test this unit</button><a class="btn" href="#/vocab/learn/u/' + sid + '/' + n + '">' + I('plus') + ' Learn 5 new</a></div></div>' +
      '<div class="bar mb"><i style="width:' + U.pct(learned.length, items.length) + '%"></i></div>' +
      '<div class="card mb">' + N.box('u:' + sid + ':' + n, { kind: 'unit', title: set.short + ' · Unit ' + n + ' · ' + un.t, href: '#/vocab/unit/' + sid + '/' + n }, { label: 'My notes for this unit', ph: 'Notes for this unit: patterns you noticed, words that confuse you, things to revise…' }) + '</div>' +
      items.map(u => { const x = u.p || u.c, head = u.p ? x.p : x.c, nt = N.get('v:' + u.id); return '<a class="list-item" href="#/vocab/item/' + encodeURIComponent(u.id) + '"><div class="grow"><h3>' + U.esc(head) + N.mark('v:' + u.id) + '</h3><div class="vi">' + U.esc(x.vi) + '</div><small>' + U.esc(x.ex) + '</small>' + (nt ? '<div class="nt clip mini">' + U.esc(nt) + '</div>' : '') + '</div><div>' + status(u.id) + '</div></a>'; }).join('') + '</div>';
    U.$('#ut', v).onclick = () => { const pool = (learned.length >= 5 ? learned : items).map(u => u.id); App.quiz.start(v, pool, { title: 'Unit ' + n + ' · ' + un.t, min: Math.min(15, Math.max(10, pool.length)) }); };
  }

  App.views.vocab = function (v, parts, params) {
    if (params && params.tab && KIND[params.tab]) ui.tab = params.tab;
    if (parts[0] === 'unit') return unitPage(v, parts[1], +parts[2]);
    if (parts[0] === 'learn' && parts[1] === 'u') { const set = App.data.bookSets.find(s => s.id === parts[2]); const n = +parts[3]; return learn(v, set ? set.kind : 'c', unitItems(parts[2], n), 'Unit ' + n + (set ? ' · ' + set.short : ''), '#/vocab/unit/' + parts[2] + '/' + n); }
    if (parts[0] === 'item') return detail(v, parts[1]);
    if (parts[0] === 'learn') return learn(v, parts[1] || 'f');
    list(v);
  };
})(window.App);

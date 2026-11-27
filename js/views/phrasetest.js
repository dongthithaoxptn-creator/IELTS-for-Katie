/* Phrase test — practise learned phrasal verbs and collocations the way they are really tested:
   the missing particle (look ___ → after), the missing partner word (___ a decision → make), matching
   several phrases to their meanings at once, phrases in context, and typing the missing part. */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;
  const PARTICLES = new Set('up down out off on in into over away back through after for with about around round across along by to apart ahead forward under at from together behind past aside'.split(' '));
  const DET = new Set(['a', 'an', 'the', 'your', 'my', 'his', 'her', 'its', 'our', 'their', 'someone’s', "someone's", 'some', 'no']);
  const ui = { kinds: 'pc', book: '', n: 15 };

  const headOf = u => u.p ? u.p.p : u.c.c;
  const viOf = u => (u.p || u.c).vi;
  const all = () => App.units.list.filter(u => u.kind === 'p' || u.kind === 'c');
  let BANK = null; // every phrase in lower case, to avoid "wrong" options that are really correct
  const bank = () => BANK || (BANK = new Set(all().map(u => headOf(u).toLowerCase())));
  const toks = s => s.split(/\s+/);

  /* ---------- how to split a phrase ---------- */
  function splitPV(p) { // "put up with" -> { verb: 'put', part: 'up with', rest: '' }
    const t = toks(p); let k = 1;
    while (k < t.length && PARTICLES.has(t[k].toLowerCase())) k++;
    if (k === 1) return null;
    return { verb: t[0], part: t.slice(1, k).join(' '), rest: t.slice(k).join(' ') };
  }
  const ADJ_LIST = new Set('big small heavy strong high low deep hard soft good bad great wide broad long short close fierce keen firm sharp dull dense harsh bright dark rich poor vast slim fat quick swift brisk prompt rare rough smooth tough tender warm cold hot dirty clean clear fair false free full open quiet raw safe sound stiff tight vague wild young old new true sheer utter total mere prime key main major minor vital grave dire acute chronic mild steep slight huge tiny entire whole sole single double joint mutual rapid gradual sudden steady constant brief thick thin dry wet fresh plain light loose stark bitter sweet sour faint dim bleak calm busy cheap dear deaf blind lame mute naked neat nice pale proud pure ripe rude sane sick slow spare strict tame tidy vain weak wise lush lavish blunt bland frank grand noble subtle remote severe sincere sole solid stable supreme tense'.split(' '));
  const ADJ_END = /(ed|ing|ful|ous|ive|al|ic|ical|able|ible|ent|ant|less|ary|ory|ile|ate|ior|est|y|ish)$/i;
  const PREP = /^(in|on|at|with|from|of|by|for|to|under|within|beyond|into|out|off|over|up|down|and|or|as)$/i;
  const CURATED = new Set('make take have do give get pay keep hold catch bring put set run raise reach draw strike meet bear cause lose play pose break carry face call create provide launch win gain earn achieve spend lead suffer sustain lodge stage coin heal forge spark tell speak talk say tackle address solve ask avoid commit cross enjoy express fight fill follow gather hit hurt issue join lay leave lift offer pass pick pull push reduce refuse reject seek sell send serve settle shake share shed shoot sign spread stand stop study support suggest throw treat try visit waste watch wear write banish devote quell implement undergo overcome encounter hinder minimise boost foster impose exert wield go come grow become turn feel fall unveil enlist declare'.split(' '));
  let VERBS = null;
  function verbs() { // verbs seen in your bank: first word of every phrasal verb, and of collocations like "make a …"
    if (VERBS) return VERBS;
    VERBS = new Set('make take have do give get pay keep hold catch bring put set run raise reach draw strike meet bear cause lose play pose break carry face call change create provide launch win gain earn achieve spend miss lead show suffer sustain lodge stage coin heal forge spark tell speak talk say tackle address solve answer ask avoid build buy claim commit cross cut deal drop enjoy express fight fill find follow form gather hit hurt issue join kill lay leave lift light lift mark offer open pass pick pull push reduce refuse reject remain rise save seek sell send serve settle shake share shed shoot sign sing sit solve spread stand start stop study support suggest take tear throw touch treat try turn use visit wait walk waste watch wear win work write banish devote quell adhere crack implement undergo overcome encounter hinder minimise maximise boost foster tackle impose exert exercise wield'.split(' '));
    all().forEach(u => { const t = toks(headOf(u)), l = t[0].toLowerCase(); if (PREP.test(l) || DET.has(l)) return; if (u.p) VERBS.add(l); else if (t.length > 2 && DET.has(t[1].toLowerCase())) VERBS.add(l); });
    return VERBS;
  }
  const isAdv = w => /ly$/i.test(w) && !/^(family|only|early|daily|weekly|monthly|yearly|holy|ugly|silly|lovely|friendly|lonely|likely|elderly|costly|deadly|lively|orderly|timely|curly|jolly|chilly|hilly|oily|woolly)$/i.test(w);
  const NOUNISH = /^(energy|country|money|history|policy|society|economy|family|city|party|body|duty|story|study|army|reality|quality|safety|variety|activity|ability|community|majority|minority|opportunity|authority|capacity|identity|industry|memory|theory|strategy|technology|security|property|celebrity|charity|century|company|delivery|discovery|emergency|enquiry|entry|injury|journey|library|luxury|mystery|penalty|poverty|recovery|salary|survey|territory|therapy|trophy|victory|anxiety|apology|beauty|boundary|category|ceremony|colony|county|deputy|diary|dignity|enemy|entity|facility|gallery|harmony|hobby|inquiry|jury|legacy|liberty|loyalty|melody|ministry|novelty|pharmacy|philosophy|priority|privacy|psychology|remedy|rivalry|royalty|scrutiny|sympathy|tragedy|treaty|unity|utility|vacancy|warranty|animal|hospital|festival|arrival|approval|proposal|signal|material|capital|crystal|metal|official|individual|potential|rival|ritual|survival|terminal|tutorial|criminal|chemical|mechanic|music|topic|logic|traffic|panic|clinic|graphic|critic|fabric|statistic|patient|student|client|agent|parent|talent|event|content|accident|incident|element|moment|comment|payment|argument|document|apartment|department|government|management|environment|movement|investment|treatment|development|experiment|instrument|equipment|achievement|assessment|statement|settlement|agreement|improvement|employment|entertainment|tenant|servant|assistant|consultant|participant|accountant|restaurant|elephant|merchant|giant|plant|grant|immigrant|applicant|ant|knowledge|climate|senate|candidate|estate|debate|update|rate|state|date|plate|weight|height|light|night|fight|sight|right|flight|interest|forest|chest|guest|test|rest|nest|protest|contest|request|harvest|conquest|interview|reader|leader|teacher|writer|member|number|order|water|paper|letter|matter|power|tower|computer|customer|summer|winter|answer|danger|finger|border|weather|feather|mother|father|brother|sister|other|corner|partner|career|officer|manager|player|worker|speaker|driver|owner)$/i;
  const isAdj = w => { const l = w.toLowerCase(); if (ADJ_LIST.has(l)) return true; if (l.length <= 3 || verbs().has(l) || NOUNISH.test(l)) return false; return ADJ_END.test(l); };
  function splitColl(c) { // blank the word a learner most needs to know, only when its kind (verb / adjective / adverb) is clear
    const t = toks(c); if (t.length < 2) return null;
    const w0 = t[0], l0 = w0.toLowerCase();
    if (!PREP.test(w0) && !DET.has(l0) && (DET.has(t[1].toLowerCase()) ? !isAdj(w0) : CURATED.has(l0)) && !PREP.test(t[1])) return { i: 0, slot: 'verb' };
    if (isAdv(w0) && !PREP.test(t[1])) return { i: 0, slot: 'adv' };
    if (DET.has(l0) && t.length >= 3 && (isAdj(t[1]) || isAdv(t[1]))) return { i: 1, slot: isAdv(t[1]) ? 'adv' : 'adj' };
    if (!DET.has(l0) && !PREP.test(w0) && isAdj(w0) && !PREP.test(t[1])) return { i: 0, slot: 'adj' };
    return null;
  }
  let SLOTS = null;
  function slotWords() { // words that fill each kind of slot somewhere in your bank
    if (SLOTS) return SLOTS;
    SLOTS = { verb: new Set(), adj: new Set(), adv: new Set(), part: {} };
    all().forEach(u => {
      if (u.p) { const s = splitPV(u.p.p); if (s) { const n = toks(s.part).length; (SLOTS.part[n] = SLOTS.part[n] || new Set()).add(s.part.toLowerCase()); } return; }
      const sp = splitColl(u.c.c); if (sp) SLOTS[sp.slot].add(toks(u.c.c)[sp.i].toLowerCase());
    });
    return SLOTS;
  }
  const LIGHT = ['make', 'take', 'do', 'have', 'give', 'get', 'pay', 'keep', 'hold', 'catch', 'bring', 'put', 'set', 'run', 'raise', 'come', 'go'];
  function options(answer, pool, build, n = 3, prefer) {
    const out = [], seen = new Set([answer.toLowerCase()]);
    const ok = w => { const lw = w.toLowerCase(); if (seen.has(lw)) return false; if (bank().has(build(w).toLowerCase())) return false; if ((lw === 'round' && answer === 'around') || (lw === 'around' && answer === 'round')) return false; return true; };
    U.shuffle(prefer || []).concat(U.shuffle([...pool])).forEach(w => { if (out.length < n && ok(w)) { out.push(w); seen.add(w.toLowerCase()); } });
    return out;
  }

  /* ---------- questions ---------- */
  function partQ(u) { // missing particle(s) of a phrasal verb
    const s = splitPV(u.p.p); if (!s) return null;
    const n = toks(s.part).length, pool = slotWords().part[n] || new Set();
    const opts = options(s.part, pool, w => s.verb + ' ' + w + (s.rest ? ' ' + s.rest : ''));
    if (opts.length < 3) return null;
    return { t: 'part', u, answer: s.part, opts: U.shuffle([s.part].concat(opts)),
      prompt: 'Which particle completes the phrasal verb?<div class="pt-phrase">' + U.esc(s.verb) + ' <span class="pt-gap">' + '___ '.repeat(n).trim() + '</span>' + (s.rest ? ' ' + U.esc(s.rest) : '') + '</div><div class="vi">“' + U.esc(viOf(u)) + '”</div>' + (u.p.d ? '<small class="muted">' + U.esc(u.p.d) + '</small>' : '') };
  }
  function partnerQ(u) { // missing partner word of a collocation
    const sp = splitColl(u.c.c); if (!sp) return null;
    const t = toks(u.c.c), ans = t[sp.i], pool = slotWords()[sp.slot];
    const build = w => t.map((x, i) => i === sp.i ? w : x).join(' ');
    const opts = options(ans, pool, build, 3, sp.slot === 'verb' && LIGHT.includes(ans.toLowerCase()) ? LIGHT : null);
    if (opts.length < 3) return null;
    return { t: 'partner', u, answer: ans, opts: U.shuffle([ans].concat(opts)),
      prompt: 'Which word goes with the rest of the collocation?<div class="pt-phrase">' + t.map((x, i) => i === sp.i ? '<span class="pt-gap">_____</span>' : U.esc(x)).join(' ') + '</div><div class="vi">“' + U.esc(viOf(u)) + '”</div>' };
  }
  function contextRe(u) { // the phrase inside its example sentence, allowing a changed verb form (looked after, made a decision)
    const h = headOf(u), t = toks(h).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const first = t[0].length > 2 ? t[0].replace(/e$/, '') + '\\w*' : t[0];
    return new RegExp('\\b' + [first].concat(t.slice(1).map(w => /^(your|someone’s|someone's|his|her|my|their|our)$/i.test(w) ? '\\w+(?:’s|\'s)?' : w)).join('\\s+') + '\\b', 'i');
  }
  function contextQ(u) { // choose the phrase that fits the sentence
    const x = u.p || u.c, re = contextRe(u); if (!re.test(x.ex)) return null;
    const others = U.shuffle(all().filter(o => o.kind === u.kind && o.id !== u.id)).slice(0, 3).map(headOf);
    return { t: 'context', u, answer: headOf(u), opts: U.shuffle([headOf(u)].concat(others)),
      prompt: 'Which ' + (u.p ? 'phrasal verb' : 'collocation') + ' completes the sentence?<div class="pt-sentence">' + U.esc(x.ex.replace(re, '_____')) + '</div><small class="muted">The verb may change form in the sentence (e.g. look → looked).</small>' };
  }
  function typeQ(u) { // type the missing part
    if (u.p) { const s = splitPV(u.p.p); if (!s) return null;
      return { t: 'type', u, answer: s.part, prompt: 'Type the missing particle' + (toks(s.part).length > 1 ? 's' : '') + ':<div class="pt-phrase">' + U.esc(s.verb) + ' <span class="pt-gap">' + '___ '.repeat(toks(s.part).length).trim() + '</span>' + (s.rest ? ' ' + U.esc(s.rest) : '') + '</div><div class="vi">“' + U.esc(viOf(u)) + '”</div>' }; }
    const sp = splitColl(u.c.c); if (!sp) return null;
    const t = toks(u.c.c), ans = t[sp.i];
    return { t: 'type', u, answer: ans, prompt: 'Type the missing word:<div class="pt-phrase">' + t.map((x, i) => i === sp.i ? '<span class="pt-gap">' + U.esc(ans[0]) + '____</span>' : U.esc(x)).join(' ') + '</div><div class="vi">“' + U.esc(viOf(u)) + '”</div>' };
  }
  function meaningQ(u) { // English phrase for a Vietnamese meaning
    const others = U.shuffle(all().filter(o => o.kind === u.kind && o.id !== u.id && viOf(o) !== viOf(u))).slice(0, 3).map(headOf);
    return { t: 'meaning', u, answer: headOf(u), opts: U.shuffle([headOf(u)].concat(others)), prompt: 'Which ' + (u.p ? 'phrasal verb' : 'collocation') + ' means <span class="vi">“' + U.esc(viOf(u)) + '”</span>?' };
  }
  function makeQ(u) {
    if (u.kind === 'f') return App.quiz.makeQ(u);
    const order = U.shuffle(u.p ? [partQ, partQ, contextQ, typeQ, meaningQ] : [partnerQ, partnerQ, contextQ, typeQ, meaningQ]);
    for (const f of order) { const q = f(u); if (q) return q; }
    return meaningQ(u);
  }
  function build(units) { // every 8 phrases, 4 of them become one matching question
    const qs = []; let i = 0;
    while (i < units.length) {
      const four = units.slice(i, i + 4);
      if (four.length === 4 && qs.length % 6 === 2 && four.every(u => u.kind !== 'f') && new Set(four.map(u => u.id)).size === 4) { qs.push({ t: 'match', us: four }); i += 4; }
      else { qs.push(makeQ(units[i])); i++; }
    }
    return qs;
  }
  function pick(pool, n) { // due first, then the weakest, then the rest
    const now = Date.now(), due = U.shuffle(pool.filter(u => (S.vs(u.id).due || 0) <= now));
    const rest = U.shuffle(pool.filter(u => (S.vs(u.id).due || 0) > now)).sort((a, b) => S.vs(a.id).box - S.vs(b.id).box);
    return U.shuffle(due.concat(rest).slice(0, n));
  }

  /* ---------- running a test ---------- */
  function run(v, units, opt) {
    const qs = build(units), res = []; let i = 0;
    const title = opt.title || 'Phrase test', back = opt.back || '#/quiz/phrases', quit = opt.quit || 'Quit';
    const head = () => '<div class="row between mb"><div><div class="eyebrow">' + U.esc(title) + '</div><b>Question ' + (i + 1) + ' of ' + qs.length + '</b></div><a class="btn ghost sm" href="' + back + '">' + quit + '</a></div><div class="dots mb">' + qs.map((_, j) => '<i class="' + (j < i ? (res[j] ? 'ok' : 'bad') : j === i ? 'cur' : '') + '"></i>').join('') + '</div>';
    const explain = (u, it) => {
      if (it) return '<div class="row mt" style="gap:8px"><b>' + U.esc(it.en) + '</b>' + (it.ipa ? '<span class="ipa">/' + U.esc(it.ipa) + '/</span>' : '') + '<span class="vi">' + U.esc(it.vi) + '</span><button class="icon-btn" data-say="' + U.esc(it.en) + '" aria-label="Pronounce">' + I('sound') + '</button></div><div style="font-family:var(--serif);margin-top:6px">' + D.wrap(it.ex) + '</div>' + App.notes.show(App.vocabNoteKey(u.id));
      const x = u.p || u.c; return '<div class="row mt" style="gap:8px"><b>' + U.esc(headOf(u)) + '</b><span class="vi">' + U.esc(x.vi) + '</span><button class="icon-btn" data-say="' + U.esc(headOf(u)) + '" aria-label="Pronounce">' + I('sound') + '</button></div>' + (x.d ? '<div class="muted">' + U.esc(x.d) + '</div>' : '') + '<div style="font-family:var(--serif);margin-top:6px">' + D.wrap(x.ex) + '</div>' + App.notes.show(App.vocabNoteKey(u.id)); };
    const next = () => { i++; i < qs.length ? show() : finish(); };
    const nextBtn = () => '<div class="row mt" style="justify-content:flex-end"><button class="btn lg" id="nx">' + (i + 1 < qs.length ? 'Next ' + I('arrow') : 'See results') + '</button></div>';
    const show = () => {
      const q = qs[i];
      if (q.t === 'match') return showMatch(q);
      v.innerHTML = '<div class="wrap"><div class="q-card">' + head() + '<div class="card"><span class="chip outline">' + (q.u.kind === 'f' ? 'Word family · ' + U.esc(q.u.f.r) : q.u.p ? 'Phrasal verb' : 'Collocation') + '</span><div class="q-prompt">' + q.prompt + '</div>' +
        (q.opts ? '<div class="opts">' + q.opts.map((o, k) => '<button class="opt" data-k="' + k + '"><b style="color:var(--muted);margin-right:8px">' + 'ABCD'[k] + '</b>' + U.esc(o) + '</button>').join('') + '</div>'
          : '<form id="tf" class="row"><input class="input" id="ta" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;font-size:1.1rem" placeholder="Type here"><button class="btn">Check</button></form>') +
        '<div id="fb"></div></div></div></div>';
      const done = (ok, el) => {
        res[i] = ok; S.review(q.u.id, ok);
        if (q.opts) U.$$('.opt', v).forEach((b, k) => { b.disabled = true; if (q.opts[k] === q.answer) b.classList.add('right'); else if (b === el) b.classList.add('wrong'); });
        U.$('#fb', v).innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✓ Correct!' : '✗ Not quite — the answer is “' + U.esc(q.answer) + '”') + '</b>' + explain(q.u, q.it) + '</div>' + nextBtn();
        const nx = U.$('#nx', v); nx.focus(); nx.onclick = next;
      };
      if (q.opts) U.$$('.opt', v).forEach(b => b.onclick = () => done(q.opts[+b.dataset.k] === q.answer, b));
      else { const inp = U.$('#ta', v); setTimeout(() => inp.focus(), 50); U.$('#tf', v).onsubmit = e => { e.preventDefault(); if (!inp.value.trim()) return; inp.disabled = true; done(U.norm(inp.value) === U.norm(q.answer), null); }; }
    };
    const showMatch = q => { // tap a phrase, then its meaning
      const left = U.shuffle(q.us.slice()), right = U.shuffle(q.us.slice());
      const got = {}; let sel = null;
      v.innerHTML = '<div class="wrap"><div class="q-card">' + head() + '<div class="card"><span class="chip outline">Match 4 phrases</span><div class="q-prompt">Match each phrase with its meaning.<br><small class="muted">Tap a phrase, then tap its Vietnamese meaning.</small></div>' +
        '<div class="pt-match"><div>' + left.map(u => '<button class="opt pt-l" data-id="' + U.esc(u.id) + '">' + U.esc(headOf(u)) + '</button>').join('') + '</div><div>' + right.map(u => '<button class="opt pt-r" data-id="' + U.esc(u.id) + '"><span class="vi">' + U.esc(viOf(u)) + '</span></button>').join('') + '</div></div>' +
        '<div class="row mt" style="justify-content:flex-end"><button class="btn" id="mchk" disabled>Check</button></div><div id="fb"></div></div></div></div>';
      const draw = () => {
        U.$$('.pt-l', v).forEach(b => { b.classList.toggle('pt-sel', b.dataset.id === sel); b.classList.toggle('pt-done', !!got[b.dataset.id]); });
        U.$$('.pt-r', v).forEach(b => b.classList.toggle('pt-done', Object.values(got).includes(b.dataset.id)));
        U.$('#mchk', v).disabled = Object.keys(got).length < q.us.length;
      };
      U.$$('.pt-l', v).forEach(b => b.onclick = () => { sel = b.dataset.id; if (got[sel]) delete got[sel]; draw(); });
      U.$$('.pt-r', v).forEach(b => b.onclick = () => { if (!sel) return; Object.keys(got).forEach(k => { if (got[k] === b.dataset.id) delete got[k]; }); got[sel] = b.dataset.id; sel = null; draw(); });
      U.$('#mchk', v).onclick = () => {
        let right = 0;
        q.us.forEach(u => { const ok = got[u.id] === u.id; S.review(u.id, ok); if (ok) right++; });
        res[i] = right === q.us.length;
        U.$$('.pt-l', v).forEach(b => { b.disabled = true; b.classList.remove('pt-sel'); b.classList.add(got[b.dataset.id] === b.dataset.id ? 'right' : 'wrong'); });
        U.$$('.pt-r', v).forEach(b => { b.disabled = true; });
        U.$('#mchk', v).hidden = true;
        U.$('#fb', v).innerHTML = '<div class="feedback ' + (res[i] ? 'ok' : 'bad') + '"><b>' + (res[i] ? '✓ All 4 correct!' : right + ' of 4 correct') + '</b>' + q.us.map(u => '<div class="mt"><b>' + U.esc(headOf(u)) + '</b> — <span class="vi">' + U.esc(viOf(u)) + '</span></div>').join('') + '</div>' + nextBtn();
        const nx = U.$('#nx', v); nx.focus(); nx.onclick = next;
      };
    };
    const finish = () => {
      App.refreshNav();
      const tested = [], missed = [];
      const rowOf = (u, it) => it ? { u, en: it.en, vi: it.vi, ex: it.ex, ipa: it.ipa } : { u, en: headOf(u), vi: viOf(u), ex: (u.p || u.c).ex };
      qs.forEach((q, j) => { const rows = q.t === 'match' ? q.us.map(u => rowOf(u)) : [rowOf(q.u, q.it)]; rows.forEach(r => tested.push(r)); if (!res[j]) rows.forEach(r => missed.push(r)); });
      const ok = res.filter(Boolean).length;
      v.innerHTML = '<div class="wrap"><div class="q-card"><div class="card card-hero" style="text-align:center"><div class="eyebrow">' + U.esc(title) + ' complete</div><div class="band-big">' + ok + '/' + qs.length + '</div><p class="muted">' + tested.length + ' items tested. ' + (ok === qs.length ? 'Perfect — these are sticking.' : 'Missed items come back tomorrow in your reviews.') + '</p></div>' +
        (missed.length ? '<div class="card"><h3>Review these</h3>' + missed.map(r => '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>' + U.esc(r.en) + '</b>' + (r.ipa ? ' <span class="ipa">/' + U.esc(r.ipa) + '/</span>' : '') + ' — <span class="vi">' + U.esc(r.vi) + '</span><br><small>' + U.esc(r.ex) + '</small> <a class="btn sm ghost" href="#/vocab/item/' + encodeURIComponent(r.u.id) + '">' + I('note') + ' Open</a></div>').join('') + '</div>' : '') +
        '<div class="row mt" style="justify-content:center"><a class="btn ghost" href="' + back + '">Back</a><button class="btn" id="again">' + I('spark') + ' Another test</button></div></div></div>';
      U.$('#again', v).onclick = () => opt.again ? opt.again() : run(v, units, opt);
    };
    if (!v._ptsay) { v._ptsay = true; v.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) App.tts.speak(b.dataset.say); }); }
    show();
  }

  /* ---------- choosing what to test ---------- */
  function poolFor(kinds, book) {
    return all().filter(u => kinds.includes(u.kind) && S.isLearned(u.id) && (!book || (u.refs && u.refs.some(r => r.set === book))));
  }
  function setup(v) {
    BANK = null; SLOTS = null; VERBS = null;
    const books = (App.data.bookSets || []);
    const pool = poolFor(ui.kinds, ui.book);
    const chip = (key, val, label) => '<button class="' + (ui[key] === val ? 'on' : '') + '" data-k="' + key + '" data-v="' + U.esc(val) + '">' + U.esc(label) + '</button>';
    v.innerHTML = '<div class="wrap" style="max-width:820px"><div class="page-head"><div><div class="eyebrow">Phrase test</div><h1>Test your phrasal verbs & collocations</h1><p>Missing particles, partner words, matching and sentences — the way phrases are really tested. Only phrases you have learned are used.</p></div></div>' +
      '<div class="card"><h3>What to test</h3><div class="tabs">' + chip('kinds', 'pc', 'Both') + chip('kinds', 'p', 'Phrasal verbs') + chip('kinds', 'c', 'Collocations') + '</div>' +
      '<h3>From</h3><div class="tabs">' + chip('book', '', 'Everything I learned') + books.map(b => chip('book', b.id, b.short || b.title)).join('') + '</div>' +
      '<h3>How many phrases</h3><div class="tabs">' + [10, 15, 20, 30].map(n => '<button class="' + (ui.n === n ? 'on' : '') + '" data-k="n" data-v="' + n + '">' + n + '</button>').join('') + '</div>' +
      '<p class="muted">' + pool.length + ' learned phrase' + (pool.length === 1 ? '' : 's') + ' match your choice.</p>' +
      (pool.length >= 4 ? '<button class="btn lg" id="go">' + I('spark') + ' Start the test</button>' : '<div class="note">Learn at least 4 phrases first: open a unit in <a href="#/vocab?tab=b">your books</a> and tap <b>Learn 5 new</b>.</div>') + '</div></div>';
    U.$$('[data-k]', v).forEach(b => b.onclick = () => { const k = b.dataset.k; ui[k] = k === 'n' ? +b.dataset.v : b.dataset.v; setup(v); });
    const go = U.$('#go', v);
    if (go) go.onclick = () => { const start = () => run(v, pick(poolFor(ui.kinds, ui.book), ui.n), { title: 'Phrase test', back: '#/quiz/phrases', again: start }); start(); };
  }

  App.phraseTest = {
    setup,
    run,
    // test a given list (e.g. one book unit); uses not-yet-learned phrases too if fewer than 5 are learned
    unit(v, ids, title, back) { BANK = null; SLOTS = null; VERBS = null; const units = ids.map(id => App.units.byId[id]).filter(u => u && (u.p || u.c)); const start = () => run(v, U.shuffle(units).slice(0, 20), { title, back, again: start }); start(); }
  };
})(window.App);

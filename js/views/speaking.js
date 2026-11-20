/* Speaking practice: Part 1 / Part 2 cue card + Part 3 / full mock, speech-to-text, examiner feedback */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon, D = App.dict;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const NAMES = { fc: 'Fluency & Coherence', lr: 'Lexical Resource', gra: 'Grammatical Range & Accuracy', pron: 'Pronunciation (indicative)' };

  function list(v) {
    const B = App.data.speaking;
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">IELTS Builder · Speaking</div><h1>Speaking</h1><p>Questions from your “' + U.esc(B.source) + '” list. The examiner reads each question aloud; answer out loud and the app writes down what you say.</p></div><a class="btn lg" href="#/speaking/mock">' + I('speak') + ' Full mock test</a></div>' +
      (!SR ? '<div class="note mb">Speech-to-text isn’t available in this browser. Use Safari or Chrome to answer by voice, or type your answers instead.</div>' : '') +
      '<h2>Part 1 · Introduction & interview</h2><div class="grid gauto">' + B.part1.map((t, i) => '<a class="card fam-card" href="#/speaking/p1/' + i + '"><b>' + U.esc(t.topic) + '</b><br><small>' + t.qs.length + ' questions</small></a>').join('') + '</div>' +
      '<h2 class="mt2">Part 2 · Long turn + Part 3 · Discussion</h2>' + B.part2.map(c => '<a class="list-item" href="#/speaking/p2/' + c.id + '"><span class="icon-btn" style="width:46px;height:46px">' + I('speak') + '</span><div class="grow"><h3>' + U.esc(c.title) + '</h3><small>Part 3: ' + U.esc(c.p3) + '</small></div><span class="chip outline">1 + 2 min</span></a>').join('') +
      (S.s.speaking.length ? '<h2 class="mt2">History</h2>' + S.s.speaking.map((h, i) => [h, i]).reverse().slice(0, 10).map(([h, i]) => '<a class="list-item" href="#/speaking/h/' + i + '"><div class="grow"><h3 style="font-size:1rem">' + U.esc(h.title) + '</h3><small>' + U.fmtDate(h.ts) + '</small></div><span class="band-pill ' + (h.result ? '' : 'none') + '">' + (h.result ? U.bandStr(h.result.overall) : '–') + '</span></a>').join('') : '') + '</div>';
  }

  function buildSteps(mode, id) {
    const B = App.data.speaking, steps = [];
    const p1 = topic => topic.qs.slice(0, 5).forEach(q => steps.push({ part: 1, q, target: 25, label: 'Part 1 · ' + topic.topic }));
    const p2 = card => { steps.push({ part: 2, card, q: card.cue, target: 120, prep: 60, label: 'Part 2 · Cue card' }); (B.part3[card.p3] || []).slice(0, 4).forEach(q => steps.push({ part: 3, q, target: 45, label: 'Part 3 · ' + card.p3 })); };
    let title;
    if (mode === 'p1') { const t = B.part1[+id] || B.part1[0]; p1(t); title = 'Part 1 · ' + t.topic; }
    else if (mode === 'p2') { const c = B.part2.find(x => x.id === id) || B.part2[0]; p2(c); title = 'Part 2 & 3 · ' + c.title; }
    else { const t = U.rand(B.part1), c = U.rand(B.part2); p1(t); p2(c); title = 'Full mock · ' + t.topic + ' / ' + c.title; }
    return { steps, title };
  }

  function session(v, mode, id) {
    const { steps, title } = buildSteps(mode, id);
    const answers = steps.map(() => ({ a: '', secs: 0 }));
    App.notes.attach('sp:' + mode + (mode === 'mock' ? '' : ':' + id), { kind: 'speaking', title: 'Speaking · ' + (mode === 'mock' ? 'Full mock tests' : title), href: '#/speaking/' + mode + (mode === 'mock' ? '' : '/' + id) });
    let i = -1, rec = null, recording = false, recStart = 0, base = '', finalTxt = '', tick = null;
    const stopRec = () => { recording = false; if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } } clearInterval(tick); if (recStart) { answers[i].secs += (Date.now() - recStart) / 1000; recStart = 0; } };
    App.onLeave(() => { stopRec(); App.busy = false; });

    const intro = () => {
      v.innerHTML = '<div class="wrap" style="max-width:820px"><a class="btn ghost sm mb" href="#/speaking">' + I('back') + ' Speaking</a><div class="card"><div class="eyebrow">' + U.esc(title) + '</div><h1>Ready?</h1><p>' + steps.length + ' questions. The examiner reads each question aloud. Press the microphone, answer naturally, then press it again to stop. You can correct the transcript before moving on.</p><ul class="muted"><li>Part 1: answer in 2–3 sentences (about 20–30 seconds).</li><li>Part 2: 1 minute to prepare, then speak for up to 2 minutes.</li><li>Part 3: give longer, more abstract answers with reasons and examples.</li></ul>' +
        (!SR ? '<p class="note">Voice input isn’t supported in this browser, so type your answers instead.</p>' : '<p class="muted"><small>Your browser asks for microphone permission the first time. Speech recognition is done by your browser.</small></p>') +
        '<button class="btn lg" id="go">' + I('play') + ' Start</button></div></div>';
      U.$('#go', v).onclick = () => { i = 0; show(); };
    };
    const show = () => {
      const st = steps[i];
      v.innerHTML = '<div class="wrap" style="max-width:820px"><div class="row between mb"><a class="btn ghost sm" href="#/speaking">' + I('x') + ' End</a><b>' + (i + 1) + ' / ' + steps.length + '</b></div><div class="dots mb">' + steps.map((_, j) => '<i class="' + (j < i ? 'ok' : j === i ? 'cur' : '') + '"></i>').join('') + '</div>' +
        '<div class="card"><div class="row between"><span class="chip">' + U.esc(st.label) + '</span><button class="btn sm soft" id="hear">' + I('sound') + ' Hear question</button></div>' +
        (st.card ? '<div class="cue mt"><b>' + D.wrap(st.card.cue) + '</b><div class="mt">You should say:</div><ul>' + st.card.points.map(p => '<li>' + D.wrap(p) + '</li>').join('') + '</ul></div><textarea class="input mt" id="notes" rows="3" placeholder="Notes (1 minute preparation)…"></textarea>' : '<p class="q-prompt">' + D.wrap(st.q) + '</p>') +
        '<div class="row mt" style="gap:18px"><button class="mic" id="mic" aria-label="Start answering">' + I('speak') + '</button><div><div class="timer" id="tm">0:00</div><small class="muted" id="hint">' + (st.prep ? 'Preparation: 1 minute' : 'Aim for about ' + st.target + ' seconds') + '</small></div></div>' +
        '<textarea class="input mt" id="ans" rows="' + (st.part === 2 ? 8 : 4) + '" placeholder="' + (SR ? 'Your answer appears here as you speak (you can edit it)…' : 'Type your answer…') + '">' + U.esc(answers[i].a) + '</textarea>' +
        '<div class="row mt" style="justify-content:flex-end"><button class="btn lg" id="next">' + (i + 1 < steps.length ? 'Next question ' + I('arrow') : 'Finish') + '</button></div></div></div>';
      const ta = U.$('#ans', v), tm = U.$('#tm', v), mic = U.$('#mic', v), hint = U.$('#hint', v);
      const speakQ = () => App.tts.speak(st.card ? st.card.cue + '. You should say: ' + st.card.points.join(', ') + '. You have one minute to prepare.' : st.q);
      U.$('#hear', v).onclick = speakQ; speakQ();
      let prepH = null;
      if (st.prep) {
        let left = st.prep;
        tm.textContent = U.fmtClock(left);
        prepH = setInterval(() => { left--; tm.textContent = U.fmtClock(left); if (left <= 0) { clearInterval(prepH); prepH = null; hint.textContent = 'Start speaking now — up to 2 minutes'; App.tts.speak('Please start speaking now.'); } }, 1000);
        App.onLeave(() => clearInterval(prepH));
      }
      const startRec = () => {
        if (prepH) { clearInterval(prepH); prepH = null; }
        App.tts.stop();
        recording = true; recStart = Date.now(); App.busy = true;
        mic.classList.add('rec'); mic.setAttribute('aria-label', 'Stop');
        hint.textContent = 'Recording… press again to stop';
        const t0 = answers[i].secs;
        tick = setInterval(() => { const s = t0 + (Date.now() - recStart) / 1000; tm.textContent = U.fmtClock(s); tm.classList.toggle('low', st.part === 2 && s > 110); if (st.part === 2 && s >= 120) { toggle(); U.toast('Two minutes — thank you.'); } }, 500);
        if (!SR) return;
        base = ta.value ? ta.value.trim() + ' ' : ''; finalTxt = '';
        rec = new SR(); rec.lang = 'en-GB'; rec.continuous = true; rec.interimResults = true;
        rec.onresult = e => { let inter = ''; for (let k = e.resultIndex; k < e.results.length; k++) { const r = e.results[k]; if (r.isFinal) finalTxt += r[0].transcript.trim() + ' '; else inter += r[0].transcript; } ta.value = base + finalTxt + inter; };
        rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { U.toast('Microphone permission was blocked — type your answer instead'); toggle(); } };
        rec.onend = () => { if (recording) { try { rec.start(); } catch (err) { /* already started */ } } };
        try { rec.start(); } catch (e) { U.toast('Could not start the microphone'); }
      };
      const toggle = () => {
        if (!recording) { startRec(); return; }
        stopRec(); App.busy = false;
        mic.classList.remove('rec'); mic.setAttribute('aria-label', 'Start answering'); hint.textContent = 'Stopped. Press the mic to add more, or go to the next question.';
      };
      mic.onclick = toggle;
      U.$('#next', v).onclick = () => {
        if (recording) toggle();
        answers[i].a = ta.value.trim();
        if (st.card) answers[i].notes = (U.$('#notes', v) || {}).value || '';
        if (!answers[i].a) answers[i].skipped = true;
        i++; i < steps.length ? show() : finish();
      };
    };
    const transcriptText = () => steps.map((st, j) => 'Q (' + st.label + '): ' + st.q + '\nA [' + Math.round(answers[j].secs) + 's spoken, ' + U.words(answers[j].a) + ' words]: ' + (answers[j].a || '(no answer)')).join('\n\n');
    const finish = () => {
      const totalW = answers.reduce((n, a) => n + U.words(a.a), 0), totalS = answers.reduce((n, a) => n + a.secs, 0);
      const wpm = totalS > 5 ? Math.round(totalW / (totalS / 60)) : null;
      const stats = 'total speaking time ' + Math.round(totalS) + ' s; ' + totalW + ' words; ' + (wpm ? wpm + ' words per minute' : 'rate unknown (typed answers)') + '; input method: ' + (SR ? 'browser speech recognition' : 'typed');
      const rec = { ts: Date.now(), title, mode, stats, steps: steps.map((s, j) => ({ label: s.label, q: s.q, a: answers[j].a, secs: Math.round(answers[j].secs) })), words: totalW, secs: Math.round(totalS), wpm };
      v.innerHTML = '<div class="wrap" style="max-width:900px"><a class="btn ghost sm mb" href="#/speaking">' + I('back') + ' Speaking</a><div class="card"><div class="eyebrow">' + U.esc(title) + '</div><h1>Well done</h1><div class="grid g3"><div class="stat"><small>Words spoken</small><b>' + totalW + '</b></div><div class="stat"><small>Speaking time</small><b>' + U.fmtClock(totalS) + '</b></div><div class="stat"><small>Speech rate</small><b>' + (wpm || '–') + '</b><small>words / minute (natural ≈ 120–160)</small></div></div>' +
        '<div class="row mt"><button class="btn lg" id="cc">Copy for Claude chat</button><button class="btn lg ghost" id="mk">' + I('spark') + ' Mark in the app (API key)</button></div><div id="fb"></div></div>' +
        '<div class="card mt"><h3>Your transcript</h3>' + rec.steps.map(s => '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><small>' + U.esc(s.label) + '</small><div><b>' + U.esc(s.q) + '</b></div><div style="font-family:var(--serif)">' + (s.a ? D.wrap(s.a) : '<i class="muted">no answer</i>') + '</div><small>' + s.secs + 's</small></div>').join('') + '</div></div>';
      S.s.speaking.push(rec); S.save();
      const idx = S.s.speaking.length - 1;
      U.$('#cc', v).onclick = async () => {
        await App.copyText(App.ai.manualSpeakingPrompt(title, transcriptText(), stats));
        if (!U.$('#bpaste', v)) chatBand(U.$('#fb', v), idx, () => { U.$('#cc', v).remove(); U.$('#mk', v).remove(); });
      };
      U.$('#mk', v).onclick = async () => {
        if (!App.ai.enabled()) { U.$('#fb', v).innerHTML = '<p class="note mt">Marking inside the app needs a Claude API key (Settings). With your Claude plan, use <b>Copy for Claude chat</b> instead — it’s free with Pro.</p>'; return; }
        const b = U.$('#mk', v); b.disabled = true; b.textContent = 'The examiner is listening back…';
        try {
          const r = await App.ai.markSpeaking({ parts: title, transcriptText: transcriptText(), stats });
          S.s.speaking[idx].result = r; S.save();
          S.attempt({ skill: 'speaking', ref: mode, title, band: r.overall, crit: { fc: r.criteria.fc.band, lr: r.criteria.lr.band, gra: r.criteria.gra.band, pron: r.criteria.pron.band } });
          U.$('#fb', v).innerHTML = App.feedbackHTML(r, 'Speaking', NAMES);
          b.remove(); App.refreshNav();
        } catch (e) { U.$('#fb', v).innerHTML = '<p class="note mt">' + U.esc(e.message) + '</p>'; b.disabled = false; b.innerHTML = I('spark') + ' Try again'; }
      };
    };
    intro();
  }
  /* band entry after marking in a Claude chat / Project */
  function chatBand(box, idx, done) {
    App.bandEntry(box, { kind: 'speaking', intro: 'Paste the copied text into your <b>IELTS Examiner</b> Project in the Claude app (or any Claude chat). When Claude replies, paste its last line here.', onSave: r => {
      const h = S.s.speaking[idx]; h.result = r; S.save();
      const c = {}; Object.keys(r.criteria).forEach(k => { c[k] = r.criteria[k].band; });
      S.attempt({ skill: 'speaking', ref: h.mode || 'chat', title: h.title, band: r.overall, crit: c, source: 'chat' });
      box.innerHTML = App.manualResultHTML(r, 'speaking'); App.refreshNav(); if (done) done();
    } });
  }
  const transcriptOf = h => h.steps.map(s => 'Q (' + s.label + '): ' + s.q + '\nA [' + s.secs + 's spoken, ' + U.words(s.a || '') + ' words]: ' + (s.a || '(no answer)')).join('\n\n');
  function viewHistory(v, idx) {
    const h = S.s.speaking[idx]; if (!h) { list(v); return; }
    const res = h.result ? (h.result.manual ? App.manualResultHTML(h.result, 'speaking') : App.feedbackHTML(h.result, 'Speaking', NAMES)) : '<div class="row mt"><button class="btn" id="cc">Copy for Claude chat</button></div><div id="fb"></div>';
    v.innerHTML = '<div class="wrap" style="max-width:900px"><a class="btn ghost sm mb" href="#/speaking">' + I('back') + ' Speaking</a><div class="card"><div class="eyebrow">' + U.fmtDate(h.ts) + '</div><h2>' + U.esc(h.title) + '</h2>' + h.steps.map(s => '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>' + U.esc(s.q) + '</b><div style="font-family:var(--serif)">' + D.wrap(s.a || '—') + '</div></div>').join('') + '</div>' + res + '</div>';
    if (!h.result) {
      U.$('#cc', v).onclick = async () => {
        await App.copyText(App.ai.manualSpeakingPrompt(h.title, transcriptOf(h), h.stats || ('total speaking time ' + h.secs + ' s; ' + h.words + ' words' + (h.wpm ? '; ' + h.wpm + ' words per minute' : ''))));
        if (!U.$('#bpaste', v)) chatBand(U.$('#fb', v), idx, () => viewHistory(v, idx));
      };
    }
  }
  App.views.speaking = (v, parts) => {
    if (!parts[0]) return list(v);
    if (parts[0] === 'h') return viewHistory(v, +parts[1]);
    session(v, parts[0], parts[1]);
  };
})(window.App);

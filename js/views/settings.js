/* Settings: goals, AI marking key, voice, data backup/sync between devices, growing the word bank */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  App.views.settings = function (v) {
    const st = S.s.settings;
    const voices = App.tts.gb();
    const bands = []; for (let b = 5; b <= 9; b += 0.5) bands.push(b);
    v.innerHTML = '<div class="wrap" style="max-width:860px"><div class="page-head"><div><div class="eyebrow">Settings</div><h1>Settings</h1></div></div>' +
      '<div class="card tint" data-c="peri"><h2>Your goal</h2><div class="grid g3"><div class="field"><label class="f" for="nm">Your name</label><input class="input" id="nm" value="' + U.esc(st.name || '') + '" placeholder="Optional"></div>' +
      '<div class="field"><label class="f" for="tg">Target band</label><select class="input" id="tg">' + bands.map(b => '<option value="' + b + '"' + (+st.target === b ? ' selected' : '') + '>' + b.toFixed(1) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f" for="ed">Exam date</label><input class="input" type="date" id="ed" value="' + U.esc(st.examDate || '') + '"></div></div>' +
      '<div class="grid g3 mt"><div class="field"><label class="f" for="th">Theme</label><select class="input" id="th">' + [['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark navy']].map(o => '<option value="' + o[0] + '"' + (st.theme === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f" for="qz">Daily test size</label><select class="input" id="qz">' + [10, 15, 20, 30].map(n => '<option' + (+st.quizSize === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f" for="vc">British voice</label><div class="row" style="flex-wrap:nowrap"><select class="input" id="vc"><option value="">Automatic</option>' + voices.map(x => '<option' + (st.voice === x.name ? ' selected' : '') + ' value="' + U.esc(x.name) + '">' + U.esc(x.name + ' (' + x.lang + ')') + '</option>').join('') + '</select><button class="icon-btn" id="vt" aria-label="Test voice">' + I('sound') + '</button></div></div></div></div>' +

      '<div class="card tint" data-c="lilac"><h2>AI marking (Writing & Speaking)</h2><p class="muted">Strict examiner-style marking uses the Claude API. Create a key at <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">platform.claude.com</a> (pay-as-you-go; one essay costs a few cents). The key is stored only in this browser on this device and is sent only to api.anthropic.com.</p>' +
      '<div class="grid g2"><div class="field"><label class="f" for="ak">API key</label><input class="input" id="ak" type="password" autocomplete="off" value="' + U.esc(st.apiKey) + '" placeholder="sk-ant-…"></div>' +
      '<div class="field"><label class="f" for="md">Marking model</label><select class="input" id="md">' + [['claude-opus-5-5', 'Claude Opus 5.5 — most accurate (recommended)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 — faster, cheaper'], ['claude-haiku-5-5', 'Claude Haiku 5.5 — cheapest, less precise']].map(o => '<option value="' + o[0] + '"' + (st.model === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
      '<div class="row mt"><button class="btn" id="sv">Save</button><button class="btn ghost" id="tk">Test key</button><span id="tkr" class="muted"></span></div></div>' +

      '<div class="card tint" data-c="pink"><h2>Marking with your Claude plan (no API key)</h2><p class="muted">Use your Claude Pro plan instead of an API key. Set this up once:</p><ol><li>In the Claude app or claude.ai, create a <b>Project</b> called <b>IELTS Examiner</b>.</li><li>Press the button below and paste the text into the Project’s <b>instructions</b>.</li><li>After writing or speaking practice, press <b>Copy marking prompt</b> / <b>Copy for Claude chat</b>, paste it into a new chat in that Project, then paste Claude’s <span class="kbd">BANDS:</span> line back into the app.</li></ol>' +
      '<button class="btn" id="pji">Copy Project instructions</button></div>' +

      '<div class="card tint" data-c="mint"><h2>Grow your word bank</h2><p class="muted">Add new word families, phrasal verbs or collocations on any IELTS topic (needs the API key). New items are marked “AI-added” — check them against your Oxford or Collins books.</p>' +
      '<div class="grid g3"><div class="field"><label class="f" for="gk">Type</label><select class="input" id="gk"><option value="families">Word families</option><option value="phrasal">Phrasal verbs</option><option value="colloc">Collocations</option></select></div><div class="field"><label class="f" for="gt">Topic</label><input class="input" id="gt" placeholder="e.g. Health, Crime, Space" value="Environment"></div><div class="field"><label class="f" for="gn">How many</label><select class="input" id="gn"><option>5</option><option selected>10</option><option>15</option></select></div></div>' +
      '<div class="row mt"><button class="btn" id="gen">' + I('spark') + ' Generate</button><label class="btn ghost" style="cursor:pointer">Import JSON<input type="file" id="ij" accept=".json,application/json" hidden></label></div><div id="gout"></div></div>' +

      '<div class="card tint" data-c="aqua"><h2>Cambridge books on this device</h2><p class="muted">The listening recordings and book pages are kept on each device, never online. Import each book’s pack (<b>cam16.zip</b> … <b>cam20.zip</b>) once per device. On iPad, do this inside the app you added to your Home Screen, because Safari tabs and the Home Screen app keep separate storage.</p>' +
      '<div id="bookst"></div><div class="row mt"><label class="btn" style="cursor:pointer">' + I('plus') + ' Import book packs (.zip)<input type="file" id="pk" accept=".zip,application/zip" multiple hidden></label><span id="pkp" class="muted"></span></div></div>' +

      '<div class="card tint" data-c="sky"><h2>Your data & using several devices</h2><p class="muted">Progress is saved on each device separately. To continue on your iPad what you started on your MacBook, export a backup here and import it there (AirDrop or save it to your Drive folder).</p>' +
      '<div class="row"><button class="btn" id="ex">Export backup</button><label class="btn ghost" style="cursor:pointer">Import backup<input type="file" id="im" accept=".json,application/json" hidden></label><button class="btn ghost" id="rs" style="color:var(--bad)">Reset everything</button></div></div>' +

      '<div class="card tint" data-c="peach"><h2>Install as an app</h2><ul><li><b>iPad / iPhone (Safari):</b> Share → <i>Add to Home Screen</i>.</li><li><b>Mac (Safari):</b> File → <i>Add to Dock</i>. <b>Chrome:</b> the install icon in the address bar.</li></ul><p class="muted" style="margin:0">After adding it to your Home Screen, open it from there and import your book packs above. Progress and books are stored separately in each browser and on each device.</p></div></div>';

    const set = (k, val) => { st[k] = val; S.save(); };
    U.$('#pji', v).onclick = () => App.copyText(App.ai.projectInstructions());

    const vocabSummary = () => {
      const n = App.data.bookSets.length, words = App.units.list.filter(u => u.refs).length;
      return n + (n === 1 ? ' book' : ' books') + ' · ' + words.toLocaleString('en') + ' words';
    };
    const drawBooks = async () => {
      const packs = await App.media.packs(), box = U.$('#bookst', v); if (!box) return;
      const rows = await Promise.all(App.data.books.map(async b => {
        const pk = packs.find(p => p.id === b.id), ok = pk || await App.media.available(b);
        return '<div class="list-item"><div class="grow"><b>' + U.esc(b.title) + '</b><br><small>' + (pk ? 'Imported ' + U.fmtDate(pk.ts) + ' · ' + Math.round(pk.bytes / 1048576) + ' MB' : ok ? 'Available from the app folder' : 'Not on this device') + '</small></div>' +
          (pk ? '<button class="btn sm ghost" data-rm="' + b.id + '">Remove</button>' : ok ? '<span class="chip ok">Ready</span>' : '<span class="chip warn">Import ' + b.id + '.zip</span>') + '</div>';
      }));
      const vp = packs.find(p => p.id === 'vocab'), vs = App.data.bookSets.length;
      rows.push('<div class="list-item"><div class="grow"><b>Vocabulary from your books</b><br><small>' + (vp ? 'Imported ' + U.fmtDate(vp.ts) + (vp.version ? ' · version ' + vp.version : '') + ' · ' + vocabSummary() : vs ? 'Available from the app folder · ' + vocabSummary() : 'Not on this device') + (App.media.vocabError ? ' · <b style="color:var(--bad,#c0392b)">could not be read: ' + U.esc(App.media.vocabError) + '</b>' : '') + '</small></div>' +
        (vp ? '<button class="btn sm ghost" data-rm="vocab">Remove</button>' : vs ? '<span class="chip ok">Ready</span>' : '<span class="chip warn">Import vocab.zip</span>') + '</div>');
      const u = await App.media.usage();
      box.innerHTML = rows.join('') + (u ? '<p class="muted mt" style="margin-bottom:0"><small>Storage used by this app: ' + Math.round((u.usage || 0) / 1048576) + ' MB' + (u.quota ? ' of about ' + Math.round(u.quota / 1073741824) + ' GB available' : '') + '</small></p>' : '');
      U.$$('[data-rm]', box).forEach(bt => bt.onclick = async () => { if (await U.confirm('Remove ' + bt.dataset.rm + ' from this device? You can import it again later.', 'Remove')) { await App.media.remove(bt.dataset.rm); drawBooks(); } });
    };
    drawBooks();
    U.$('#pk', v).onchange = async e => {
      const files = [...e.target.files], pr = U.$('#pkp', v);
      for (const f of files) {
        try {
          const info = await App.media.importZip(f, (i, n) => { pr.textContent = f.name + ': ' + Math.round(i / n * 100) + '%'; });
          if (info.id === 'vocab') {
            const ok = await App.media.loadVocab(); App.units.build();
            pr.textContent = ok ? '✓ ' + info.title + ' loaded: ' + vocabSummary() : '✗ ' + info.title + ' was saved but could not be read' + (App.media.vocabError ? ' (' + App.media.vocabError + ')' : '');
          } else pr.textContent = '✓ ' + info.title + ' imported';
        }
        catch (err) { pr.textContent = '✗ ' + f.name + ': ' + err.message; break; }
      }
      e.target.value = ''; drawBooks();
    };
    U.$('#nm', v).onchange = e => set('name', e.target.value.trim());
    U.$('#tg', v).onchange = e => { set('target', +e.target.value); App.refreshNav(); };
    U.$('#ed', v).onchange = e => set('examDate', e.target.value);
    U.$('#th', v).onchange = e => { set('theme', e.target.value); App.applyTheme(); };
    U.$('#qz', v).onchange = e => set('quizSize', +e.target.value);
    U.$('#vc', v).onchange = e => set('voice', e.target.value);
    U.$('#vt', v).onclick = () => App.tts.speak('Good morning. Could you tell me your full name, please?');
    U.$('#sv', v).onclick = () => { set('apiKey', U.$('#ak', v).value.trim()); set('model', U.$('#md', v).value); U.toast('Saved'); };
    U.$('#tk', v).onclick = async () => {
      set('apiKey', U.$('#ak', v).value.trim()); set('model', U.$('#md', v).value);
      const r = U.$('#tkr', v); r.textContent = 'Testing…';
      try { const t = await App.ai.translate('sustainable', 'Governments must invest in sustainable transport.'); r.textContent = '✓ Works — “sustainable” = ' + t; }
      catch (e) { r.textContent = '✗ ' + e.message; }
    };
    U.$('#ex', v).onclick = async () => { const o = JSON.parse(S.exportJSON()); try { o.ink = await App.ink.exportAll(); } catch (e) { /* no handwriting */ } U.download('ielts-studio-backup-' + U.dayKey() + '.json', JSON.stringify(o)); };
    U.$('#im', v).onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(async t => {
        if (!(await U.confirm('Replace the progress on this device with the backup “' + f.name + '”?', 'Import'))) return;
        try { const o = JSON.parse(t); const ink = o.ink; delete o.ink; S.importJSON(JSON.stringify(o)); if (ink) await App.ink.importAll(ink); App.units.build(); App.applyTheme(); U.toast('Backup imported'); App.go('#/home'); } catch (err) { U.toast(err.message); }
      });
    };
    U.$('#rs', v).onclick = async () => { if (await U.confirm('Delete ALL progress, essays and settings on this device? Export a backup first if unsure.', 'Delete everything')) { S.reset(); try { await App.ink.clearAll(); } catch (e) { /* ignore */ } App.units.build(); App.applyTheme(); App.go('#/home'); } };

    const addItems = (kind, items) => {
      const ex = S.s.extra[kind]; let n = 0;
      items.forEach(x => { const key = kind === 'families' ? x.r : kind === 'phrasal' ? x.p : x.c; if (!key) return; const id = (kind === 'families' ? 'f:' : kind === 'phrasal' ? 'p:' : 'c:') + key; if (App.units.byId[id]) return; ex.push(x); n++; });
      S.save(); App.units.build(); return n;
    };
    U.$('#gen', v).onclick = async () => {
      const kind = U.$('#gk', v).value, topic = U.$('#gt', v).value.trim() || 'General', n = +U.$('#gn', v).value, out = U.$('#gout', v), btn = U.$('#gen', v);
      if (!App.ai.enabled()) { out.innerHTML = '<p class="note mt">Add your API key above first.</p>'; return; }
      btn.disabled = true; out.innerHTML = '<p class="muted mt">Generating ' + n + ' items about “' + U.esc(topic) + '”…</p>';
      try {
        const items = await App.ai.generateVocab(kind, topic, n);
        out.innerHTML = '<div class="mt">' + items.map(x => '<div class="list-item"><div class="grow"><b>' + U.esc(x.r || x.p || x.c) + '</b> ' + (x.m ? '<small>' + x.m.map(m => U.esc(m[0] + ' /' + m[2] + '/')).join(' · ') + '</small>' : '<span class="vi">' + U.esc(x.vi) + '</span>') + '</div></div>').join('') + '<button class="btn mt" id="addg">' + I('plus') + ' Add ' + items.length + ' to my bank</button></div>';
        U.$('#addg', v).onclick = () => { const k = addItems(kind, items); U.toast(k + ' new items added'); out.innerHTML = '<p class="muted mt">' + k + ' items added. Find them in Vocabulary.</p>'; };
      } catch (e) { out.innerHTML = '<p class="note mt">' + U.esc(e.message) + '</p>'; }
      btn.disabled = false;
    };
    U.$('#ij', v).onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        try {
          const j = JSON.parse(t); let n = 0;
          if (Array.isArray(j.families)) n += addItems('families', j.families.filter(x => x.r && Array.isArray(x.m)));
          if (Array.isArray(j.phrasal)) n += addItems('phrasal', j.phrasal.filter(x => x.p && x.vi));
          if (Array.isArray(j.colloc)) n += addItems('colloc', j.colloc.filter(x => x.c && x.vi));
          U.toast(n + ' items imported');
        } catch (err) { U.toast('That file is not valid JSON'); }
      });
    };
  };
})(window.App);

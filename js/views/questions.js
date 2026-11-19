/* Shared IELTS question renderer + marker (Reading & Listening) */
(function (App) {
  'use strict';
  const U = App.util, D = App.dict;
  const L = 'ABCDEFGH';
  App.Q = {
    flat(groups) { const out = []; groups.forEach((g, gi) => g.items.forEach((it, ii) => out.push({ g, gi, it, ii, n: out.length + 1 }))); return out; },
    render(groups) {
      let n = 0;
      return groups.map((g, gi) => {
        let head = '<div class="instr">' + D.wrap(g.instr || '') + '</div>';
        if (g.type === 'match' && g.opts.some(o => o[1].length > 14)) head += '<div class="card flat mb" style="padding:12px 14px"><b>List of options</b><br>' + g.opts.map(o => '<div><b>' + U.esc(o[0]) + '</b>&nbsp; ' + D.wrap(o[1]) + '</div>').join('') + '</div>';
        const items = g.items.map(it => {
          n++;
          let body = '';
          if (g.type === 'tfng') {
            body = '<div>' + D.wrap(it.q) + '</div><div class="radio-row">' + ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => '<label><input type="radio" name="q' + n + '" value="' + v + '"> ' + v + '</label>').join('') + '</div>';
          } else if (g.type === 'mcq') {
            body = '<div>' + D.wrap(it.q) + '</div><div class="radio-row" style="flex-direction:column;align-items:stretch">' + it.o.map((o, i) => '<label><input type="radio" name="q' + n + '" value="' + i + '"> <b>' + L[i] + '</b>&nbsp;' + D.wrap(o) + '</label>').join('') + '</div>';
          } else if (g.type === 'gap') {
            const parts = it.q.split('____');
            body = '<div style="line-height:2.2">' + D.wrap(parts[0]) + '<input class="input" name="q' + n + '" autocomplete="off" autocapitalize="off" spellcheck="false" style="display:inline-block;width:min(200px,60%);min-height:36px;padding:4px 10px;margin:0 4px" aria-label="Answer ' + n + '">' + D.wrap(parts[1] || '') + '</div>';
          } else if (g.type === 'match') {
            body = '<div>' + D.wrap(it.q) + '</div><select class="input" name="q' + n + '" style="margin-top:6px"><option value="">Choose…</option>' + g.opts.map(o => '<option value="' + U.esc(o[0]) + '">' + U.esc(o[0] + (o[1] !== 'Paragraph ' + o[0] ? ' — ' + o[1] : '')) + '</option>').join('') + '</select>';
          }
          return '<div class="qitem" data-n="' + n + '"><div class="qnum">' + n + '</div><div class="qbody">' + body + '</div></div>';
        }).join('');
        return '<div class="qgroup">' + head + items + '</div>';
      }).join('');
    },
    collect(root, groups) {
      const flat = App.Q.flat(groups);
      return flat.map(f => {
        const el = root.querySelector('[name="q' + f.n + '"]:checked') || root.querySelector('input[type=text][name="q' + f.n + '"],input:not([type])[name="q' + f.n + '"],select[name="q' + f.n + '"]');
        return el ? el.value : '';
      });
    },
    mark(groups, answers) {
      const flat = App.Q.flat(groups);
      const results = flat.map((f, i) => {
        const u = (answers[i] || '').trim(), it = f.it, t = f.g.type;
        let ok = false, correct = '';
        if (t === 'tfng') { ok = u === it.a; correct = it.a; }
        else if (t === 'mcq') { ok = u !== '' && +u === it.a; correct = L[it.a] + ' — ' + it.o[it.a]; }
        else if (t === 'match') { ok = u === it.a; const o = f.g.opts.find(x => x[0] === it.a); correct = it.a + (o && o[1] !== 'Paragraph ' + it.a ? ' — ' + o[1] : ''); }
        else if (t === 'gap') {
          const nu = U.norm(u), ns = nu.replace(/[\s.:]/g, '');
          ok = !!nu && it.a.some(a => { const na = U.norm(a); return na === nu || na.replace(/[\s.:]/g, '') === ns; });
          correct = it.a[0];
        }
        return { n: f.n, ok, user: t === 'mcq' && u !== '' ? L[+u] : u, correct, why: it.why || '' };
      });
      return { results, raw: results.filter(r => r.ok).length, total: results.length };
    },
    show(root, res) {
      res.results.forEach(r => {
        const el = root.querySelector('.qitem[data-n="' + r.n + '"]'); if (!el) return;
        el.classList.add(r.ok ? 'right' : 'wrong');
        el.querySelectorAll('input,select').forEach(i => i.disabled = true);
        const note = document.createElement('div'); note.className = 'answer-note';
        note.innerHTML = (r.ok ? '<b style="color:var(--ok)">✓ Correct</b>' : '<b style="color:var(--bad)">✗</b> Your answer: <b>' + U.esc(r.user || '—') + '</b> · Correct: <b>' + U.esc(r.correct) + '</b>') + (r.why ? '<div class="muted" style="margin-top:4px">' + D.wrap(r.why) + '</div>' : '');
        el.querySelector('.qbody').appendChild(note);
      });
    },
    timer(el, seconds, onTick) {
      const start = Date.now();
      const h = setInterval(() => {
        if (!document.body.contains(el)) { clearInterval(h); return; }
        const left = seconds - (Date.now() - start) / 1000;
        el.textContent = left >= 0 ? U.fmtClock(left) + ' left' : '+' + U.fmtClock(-left) + ' over';
        el.classList.toggle('low', left < 120);
        if (onTick) onTick(left);
      }, 1000);
      el.textContent = U.fmtClock(seconds) + ' left';
      return { stop: () => clearInterval(h), elapsed: () => (Date.now() - start) / 1000 };
    }
  };
})(window.App);

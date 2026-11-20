/* Handwritten notes — write or draw with Apple Pencil (or a finger / mouse) on note pages.
   Strokes are kept as vectors in this device's storage (IndexedDB) under "ink/<note key>". */
(function (App) {
  'use strict';
  const U = App.util, I = App.icon;
  const W = 1000, H = 1400;                         // page size in page units (portrait, like A4)
  const INKS = ['#1E3A5F', '#2A82C6', '#D9434B', '#1E9E6A', '#8A5CD8'];
  const HL = ['#FFE14D', '#7FE3C9', '#FFB3D1'];
  const SIZES = [3, 6, 11];
  const thumbCache = {};                            // key -> { ts, urls }

  /* ---------- storage ---------- */
  const path = key => 'ink/' + key;
  async function load(key) { const d = await App.media.get(path(key)); return d && Array.isArray(d.pages) ? d.pages : []; }
  async function save(key, pages, meta) {
    pages = pages.filter(p => p.s.length);
    if (pages.length) await App.media.put(path(key), { pages, ts: Date.now() }); else await App.media.del(path(key));
    delete thumbCache[key];
    App.notes.setInk(key, pages.length, meta);
    return pages.length;
  }

  /* ---------- drawing ---------- */
  function background(ctx, bg, sc) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W * sc, H * sc);
    ctx.lineWidth = Math.max(1, 1.2 * sc);
    if (bg === 'lined') {
      ctx.strokeStyle = '#D5E6F4';
      for (let y = 120; y < H; y += 56) { ctx.beginPath(); ctx.moveTo(0, y * sc); ctx.lineTo(W * sc, y * sc); ctx.stroke(); }
      ctx.strokeStyle = '#F4C6CF'; ctx.beginPath(); ctx.moveTo(90 * sc, 0); ctx.lineTo(90 * sc, H * sc); ctx.stroke();
    } else if (bg === 'grid') {
      ctx.strokeStyle = '#E3EDF7';
      for (let x = 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x * sc, 0); ctx.lineTo(x * sc, H * sc); ctx.stroke(); }
      for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y * sc); ctx.lineTo(W * sc, y * sc); ctx.stroke(); }
    }
  }
  const width = (s, pr) => s.h ? s.w : s.w * (0.35 + 0.9 * (pr / 100));
  function drawStroke(ctx, s, sc, from) {
    const p = s.p, n = p.length / 3; if (!n) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = s.c; ctx.fillStyle = s.c;
    if (s.h) { ctx.globalAlpha = 0.38; ctx.globalCompositeOperation = 'multiply'; }
    if (n === 1) { ctx.beginPath(); ctx.arc(p[0] * sc, p[1] * sc, width(s, p[2]) * sc / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
    if (s.h) { // highlighter: one smooth path with a constant width
      ctx.lineWidth = s.w * sc; ctx.beginPath(); ctx.moveTo(p[0] * sc, p[1] * sc);
      for (let i = 1; i < n; i++) ctx.lineTo(p[i * 3] * sc, p[i * 3 + 1] * sc);
      ctx.stroke(); ctx.restore(); return;
    }
    // pen: short curved segments whose width follows the pencil pressure
    for (let i = Math.max(1, from || 1); i < n; i++) {
      const x0 = p[(i - 1) * 3], y0 = p[(i - 1) * 3 + 1], x1 = p[i * 3], y1 = p[i * 3 + 1];
      const xm0 = i > 1 ? (p[(i - 2) * 3] + x0) / 2 : x0, ym0 = i > 1 ? (p[(i - 2) * 3 + 1] + y0) / 2 : y0;
      const xm1 = (x0 + x1) / 2, ym1 = (y0 + y1) / 2;
      ctx.lineWidth = width(s, (p[(i - 1) * 3 + 2] + p[i * 3 + 2]) / 2) * sc;
      ctx.beginPath(); ctx.moveTo(xm0 * sc, ym0 * sc); ctx.quadraticCurveTo(x0 * sc, y0 * sc, xm1 * sc, ym1 * sc);
      if (i === n - 1) ctx.lineTo(x1 * sc, y1 * sc);
      ctx.stroke();
    }
    ctx.restore();
  }
  function renderPage(page, px) { // -> data URL thumbnail
    const c = document.createElement('canvas'), sc = px / W; c.width = px; c.height = Math.round(H * sc);
    const ctx = c.getContext('2d'); background(ctx, page.bg, sc);
    // highlighters first so the ink stays on top
    page.s.filter(s => s.h).forEach(s => drawStroke(ctx, s, sc)); page.s.filter(s => !s.h).forEach(s => drawStroke(ctx, s, sc));
    return c.toDataURL('image/png');
  }

  /* ---------- thumbnails under a note (filled in automatically when they appear) ---------- */
  async function fill(box) {
    box.dataset.filled = '1';
    const key = box.dataset.ink, rec = (App.notes.raw(key) || {});
    if (!rec.ink) { box.innerHTML = ''; return; }
    let t = thumbCache[key];
    if (!t || t.ts !== rec.ts) { const pages = await load(key); t = thumbCache[key] = { ts: rec.ts, urls: pages.map(p => renderPage(p, 260)) }; }
    box.innerHTML = t.urls.map((u, i) => '<button type="button" class="ink-thumb" data-ink-open="' + U.esc(key) + '" data-page="' + i + '" aria-label="Open handwritten page ' + (i + 1) + '"><img src="' + u + '" alt=""><small>Page ' + (i + 1) + '</small></button>').join('');
  }
  App.ink = {
    thumbs: key => '<div class="ink-thumbs" data-ink="' + U.esc(key) + '"></div>',
    refresh(key) { U.$$('.ink-thumbs').forEach(b => { if (b.dataset.ink === key) fill(b); }); },
    load, save, renderPage, exportAll, importAll, clearAll, open
  };
  new MutationObserver(() => U.$$('.ink-thumbs:not([data-filled])').forEach(fill)).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ink-open]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(b.dataset.inkOpen, b.dataset.page === '' || b.dataset.page == null ? null : +b.dataset.page);
  }, true);

  /* ---------- backup ---------- */
  async function exportAll() { const out = {}; for (const k of await App.media.keys('ink/')) out[k.slice(4)] = await App.media.get(k); return out; }
  async function importAll(o) { await clearAll(); for (const k of Object.keys(o || {})) if (o[k] && o[k].pages) await App.media.put(path(k), o[k]); Object.keys(thumbCache).forEach(k => delete thumbCache[k]); }
  async function clearAll() { for (const k of await App.media.keys('ink/')) await App.media.del(k); }

  /* ---------- the pad ---------- */
  async function open(key, startPage) {
    const meta = App.notes.metaOf(key);
    const pages = (await load(key)).map(p => ({ bg: p.bg || 'lined', s: p.s.slice() }));
    let cur = startPage == null ? (pages.length ? 0 : -1) : Math.min(startPage, pages.length - 1);
    if (cur < 0) { pages.push({ bg: 'lined', s: [] }); cur = pages.length - 1; }
    const tool = { mode: 'pen', color: INKS[0], hl: HL[0], size: 1 };
    const hist = {}; // page index -> { u: [], r: [] }
    let penSeen = false, drawing = null, dirty = false, saveT = null;

    const el = document.createElement('div'); el.id = 'inkpad'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Handwritten notes');
    el.innerHTML = '<div class="ink-bar">' +
      '<button class="btn sm" data-a="done">' + I('check') + ' Done</button>' +
      '<div class="ink-title"><small>Handwritten notes</small><b>' + U.esc(meta.title || '') + '</b></div>' +
      '<div class="ink-tools">' +
        '<div class="ink-group">' + INKS.map((c, i) => '<button class="sw' + (i ? '' : ' on') + '" data-color="' + c + '" style="--c:' + c + '" aria-label="Pen colour"></button>').join('') + '</div>' +
        '<div class="ink-group">' + SIZES.map((s, i) => '<button class="sz' + (i === 1 ? ' on' : '') + '" data-size="' + i + '" aria-label="Pen size"><i style="width:' + (4 + s) + 'px;height:' + (4 + s) + 'px"></i></button>').join('') + '</div>' +
        '<div class="ink-group"><button class="tl on" data-mode="pen" aria-label="Pen">' + I('write') + '</button>' +
          '<button class="tl" data-mode="hl" aria-label="Highlighter"><span class="hl-ic"></span></button>' +
          HL.map((c, i) => '<button class="sw hl' + (i ? '' : ' on') + '" data-hl="' + c + '" style="--c:' + c + '" aria-label="Highlighter colour"></button>').join('') +
          '<button class="tl" data-mode="erase" aria-label="Eraser"><span class="er-ic"></span></button></div>' +
        '<div class="ink-group"><button class="tl" data-a="undo" aria-label="Undo">↶</button><button class="tl" data-a="redo" aria-label="Redo">↷</button></div>' +
        '<div class="ink-group"><select data-a="bg" aria-label="Paper"><option value="lined">Lined</option><option value="grid">Grid</option><option value="plain">Plain</option></select></div>' +
      '</div>' +
      '<div class="ink-pages"><button class="tl" data-a="prev" aria-label="Previous page">‹</button><b data-pg></b><button class="tl" data-a="next" aria-label="Next page">›</button><button class="tl" data-a="add" aria-label="New page">' + I('plus') + '</button><button class="tl" data-a="del" aria-label="Delete page">' + I('x') + '</button></div>' +
      '</div><div class="ink-scroll"><div class="ink-page"><canvas class="ink-bg"></canvas><canvas class="ink-fg"></canvas></div><p class="ink-hint">Write with Apple Pencil. With the Pencil, your fingers scroll the page; without one, a finger or mouse writes.</p></div>';
    document.body.appendChild(el); document.documentElement.classList.add('ink-open');
    const bgC = el.querySelector('.ink-bg'), fgC = el.querySelector('.ink-fg'), pageEl = el.querySelector('.ink-page');
    const bg = bgC.getContext('2d'), fg = fgC.getContext('2d');
    let sc = 1, dpr = 1;

    const H_ = () => hist[cur] || (hist[cur] = { u: [], r: [] });
    const layout = () => {
      const avail = Math.min(el.querySelector('.ink-scroll').clientWidth - 24, 900);
      dpr = Math.min(window.devicePixelRatio || 1, 2.5); sc = avail / W;
      pageEl.style.width = avail + 'px'; pageEl.style.height = Math.round(H * sc) + 'px';
      [bgC, fgC].forEach(c => { c.width = Math.round(avail * dpr); c.height = Math.round(H * sc * dpr); c.style.width = avail + 'px'; c.style.height = Math.round(H * sc) + 'px'; });
      redraw(true);
    };
    const redraw = withBg => {
      const p = pages[cur], k = sc * dpr;
      if (withBg) background(bg, p.bg, k);
      fg.clearRect(0, 0, fgC.width, fgC.height);
      p.s.filter(s => s.h).forEach(s => drawStroke(fg, s, k)); p.s.filter(s => !s.h).forEach(s => drawStroke(fg, s, k));
      el.querySelector('[data-pg]').textContent = 'Page ' + (cur + 1) + ' of ' + pages.length;
      el.querySelector('[data-a=bg]').value = p.bg;
      el.querySelector('[data-a=undo]').disabled = !H_().u.length; el.querySelector('[data-a=redo]').disabled = !H_().r.length;
      el.querySelector('[data-a=prev]').disabled = cur === 0; el.querySelector('[data-a=next]').disabled = cur === pages.length - 1;
    };
    const snapshot = () => { H_().u.push(pages[cur].s.slice()); H_().r = []; if (H_().u.length > 80) H_().u.shift(); };
    const changed = () => { dirty = true; clearTimeout(saveT); saveT = setTimeout(persist, 1200); redraw(false); };
    const persist = async () => { clearTimeout(saveT); if (!dirty) return; dirty = false; await save(key, pages.map(p => ({ bg: p.bg, s: p.s })), meta); };

    const pt = e => { const r = fgC.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * W * 10) / 10, Math.round((e.clientY - r.top) / r.height * H * 10) / 10, Math.round((e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5) * 100)]; };
    const eraseAt = ([x, y]) => {
      const s = pages[cur].s, R = 18, keep = s.filter(st => { for (let i = 0; i < st.p.length; i += 3) { const dx = st.p[i] - x, dy = st.p[i + 1] - y; if (dx * dx + dy * dy < (R + st.w) * (R + st.w)) return false; } return true; });
      if (keep.length !== s.length) { pages[cur].s = keep; changed(); }
    };
    fgC.style.touchAction = 'none';
    fgC.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen') { penSeen = true; fgC.style.touchAction = 'pan-y'; }
      else if (e.pointerType === 'touch' && penSeen) return; // fingers scroll once you use the Pencil
      e.preventDefault(); try { fgC.setPointerCapture(e.pointerId); } catch (err) { /* keep drawing without capture */ }
      if (tool.mode === 'erase') { snapshot(); drawing = { erase: true, id: e.pointerId }; eraseAt(pt(e)); return; }
      const s = tool.mode === 'hl' ? { c: tool.hl, w: 34, h: 1, p: [] } : { c: tool.color, w: SIZES[tool.size], p: [] };
      s.p.push(...pt(e)); drawing = { s, id: e.pointerId };
      drawStroke(fg, s, sc * dpr);
    });
    fgC.addEventListener('pointermove', e => {
      if (!drawing || e.pointerId !== drawing.id) return; e.preventDefault();
      const co = e.getCoalescedEvents && e.getCoalescedEvents(), evs = co && co.length ? co : [e];
      if (drawing.erase) { evs.forEach(ev => eraseAt(pt(ev))); return; }
      const s = drawing.s, before = s.p.length / 3;
      evs.forEach(ev => { const q = pt(ev), n = s.p.length; if (n && Math.abs(s.p[n - 3] - q[0]) + Math.abs(s.p[n - 2] - q[1]) < 0.8) return; s.p.push(...q); });
      if (s.h) redraw(false), drawStroke(fg, s, sc * dpr); else drawStroke(fg, s, sc * dpr, Math.max(1, before - 1));
    });
    const end = e => {
      if (!drawing || e.pointerId !== drawing.id) return;
      if (!drawing.erase) { snapshot(); pages[cur].s.push(drawing.s); changed(); }
      drawing = null;
    };
    fgC.addEventListener('pointerup', end); fgC.addEventListener('pointercancel', end);

    const close = async () => {
      await persist();
      el.remove(); document.documentElement.classList.remove('ink-open');
      window.removeEventListener('resize', layout); App.offInk = null;
      App.ink.refresh(key);
    };
    App.offInk = close; // closing the screen (e.g. route change) saves first
    el.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.color) { tool.color = b.dataset.color; tool.mode = 'pen'; }
      else if (b.dataset.hl) { tool.hl = b.dataset.hl; tool.mode = 'hl'; }
      else if (b.dataset.size) { tool.size = +b.dataset.size; if (tool.mode === 'erase') tool.mode = 'pen'; }
      else if (b.dataset.mode) tool.mode = b.dataset.mode;
      const a = b.dataset.a;
      if (a === 'done') return close();
      if (a === 'undo' && H_().u.length) { H_().r.push(pages[cur].s); pages[cur].s = H_().u.pop(); changed(); }
      if (a === 'redo' && H_().r.length) { H_().u.push(pages[cur].s); pages[cur].s = H_().r.pop(); changed(); }
      if (a === 'prev' && cur > 0) { cur--; redraw(true); }
      if (a === 'next' && cur < pages.length - 1) { cur++; redraw(true); }
      if (a === 'add') { pages.push({ bg: pages[cur].bg, s: [] }); cur = pages.length - 1; redraw(true); el.querySelector('.ink-scroll').scrollTop = 0; }
      if (a === 'del') {
        if (pages[cur].s.length && !(await U.confirm('Delete this handwritten page?', 'Delete'))) return;
        pages.splice(cur, 1); delete hist[cur]; if (!pages.length) pages.push({ bg: 'lined', s: [] }); cur = Math.min(cur, pages.length - 1); dirty = true; persist(); redraw(true);
      }
      // highlight the chosen tool / colour / size
      el.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x.dataset.mode === tool.mode));
      el.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('on', x.dataset.color === tool.color && tool.mode === 'pen'));
      el.querySelectorAll('[data-hl]').forEach(x => x.classList.toggle('on', x.dataset.hl === tool.hl && tool.mode === 'hl'));
      el.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('on', +x.dataset.size === tool.size));
    });
    el.querySelector('[data-a=bg]').onchange = e => { pages[cur].bg = e.target.value; dirty = true; clearTimeout(saveT); saveT = setTimeout(persist, 600); redraw(true); };
    window.addEventListener('resize', layout);
    layout();
  }
  window.addEventListener('pagehide', () => { if (App.offInk) App.offInk(); });
})(window.App);

/* Router, navigation, theme, start-up */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  App.cleanups = [];
  App.onLeave = fn => App.cleanups.push(fn);

  const SIDE = [
    ['home', 'Home', 'home'], ['vocab', 'Vocabulary', 'vocab'], ['quiz', 'Daily test', 'spark'],
    ['§', 'IELTS Builder'], ['ielts', 'Overview', 'grid'], ['reading', 'Reading', 'read'], ['listening', 'Listening', 'listen'], ['writing', 'Writing', 'write'], ['speaking', 'Speaking', 'speak'],
    ['§', 'You'], ['notes', 'My notes', 'note'], ['progress', 'Progress', 'chart'], ['settings', 'Settings', 'gear']
  ];
  const TABS = [['home', 'Home', 'home'], ['vocab', 'Vocab', 'vocab'], ['ielts', 'IELTS', 'grid'], ['notes', 'Notes', 'note'], ['progress', 'Progress', 'chart'], ['settings', 'Settings', 'gear']];
  const IELTS_SUB = ['ielts', 'reading', 'listening', 'writing', 'speaking'];

  function renderNav(route) {
    const est = App.bands.estimate();
    U.$('#side').innerHTML = '<a class="brand" href="#/home"><img class="brand-mark" src="icons/katie-192.png" alt=""><span><b>Katie’s IELTS</b><small>Vocabulary · 4 skills</small></span></a>' +
      SIDE.map(s => s[0] === '§' ? '<div class="nav-sec">' + s[1] + '</div>' : '<a class="nav-a' + (route === s[0] ? ' on' : '') + '" href="#/' + s[0] + '">' + I(s[2]) + '<span>' + s[1] + '</span>' + (s[0] === 'notes' && App.notes.count() ? '<small class="nav-count">' + App.notes.count() + '</small>' : '') + '</a>').join('') +
      '<div class="side-foot"><span>Estimated overall</span><b>' + U.bandStr(est.overall) + '</b>' + (est.overall != null && !est.complete ? '<small>from ' + ['listening', 'reading', 'writing', 'speaking'].filter(k => est[k] != null).length + ' of 4 skills</small>' : est.overall == null ? '<small>Do a test to get a band</small>' : '') + '<div style="margin-top:8px">' + I('fire') + ' ' + App.streak() + '-day streak</div></div>';
    U.$('#tabbar').innerHTML = TABS.map(t => '<a href="#/' + t[0] + '" class="' + (route === t[0] || (t[0] === 'ielts' && IELTS_SUB.includes(route)) || (t[0] === 'vocab' && route === 'quiz') ? 'on' : '') + '">' + I(t[2]) + '<span>' + t[1] + '</span></a>').join('');
    U.$$('#side svg').forEach(s => { s.style.width = '20px'; s.style.height = '20px'; s.style.verticalAlign = '-4px'; });
  }

  function route() {
    App.cleanups.splice(0).forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
    if (App.offInk) App.offInk();
    App.tts.stop(); App.dict.setGloss({}); App.notes.detach();
    const raw = (location.hash || '#/home').slice(2);
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const name = parts[0] || 'home';
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    const old = U.$('#view'), view = old.cloneNode(false); old.replaceWith(view); // drop listeners from the previous screen
    renderNav(name);
    const fn = App.views[name] || App.views.home;
    view.innerHTML = '';
    try { fn(view, parts.slice(1), params); }
    catch (e) { console.error(e); view.innerHTML = '<div class="card"><h2>Something went wrong</h2><p class="muted">' + U.esc(e.message) + '</p><a class="btn" href="#/home">Go home</a></div>'; }
    window.scrollTo(0, 0);
  }
  App.go = h => { if (location.hash === h) route(); else location.hash = h; };
  App.refreshNav = () => renderNav((location.hash.slice(2).split(/[/?]/)[0]) || 'home');

  App.applyTheme = function () {
    const t = S.s.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0B1726' : '#EAF5FC';
  };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', App.applyTheme);

  /* IELTS hub */
  App.views.ielts = function (v) {
    const est = App.bands.estimate();
    const card = (k, title, icon, desc, extra) => '<a class="card fam-card" href="#/' + k + '"><div class="row between"><span class="icon-btn" style="width:44px;height:44px">' + I(icon) + '</span><span class="band-pill ' + (est[k] == null ? 'none' : '') + '">' + U.bandStr(est[k]) + '</span></div><h2 class="mt" style="margin-bottom:4px">' + title + '</h2><p class="muted" style="margin:0">' + desc + '</p><small>' + (est.counts[k] || 0) + ' attempts' + (extra || '') + '</small></a>';
    v.innerHTML = '<div class="wrap"><div class="page-head"><div><div class="eyebrow">IELTS Builder</div><h1>Four skills, real exam tasks</h1><p>Tap any word in a passage, question or transcript to see its meaning.</p></div></div>' +
      '<div class="grid g2">' +
      card('reading', 'Reading', 'read', 'Academic passages with True/False/Not Given, matching headings, sentence completion and multiple choice.', ' · ' + App.data.reading.length + ' passages') +
      card('listening', 'Listening', 'listen', 'The real Cambridge IELTS recordings from your Drive. Exam mode plays each recording once, as in the test.', ' · ' + App.data.books.reduce((n, b) => n + b.tests.length, 0) + ' full tests') +
      card('writing', 'Writing', 'write', 'Task 1 charts and Task 2 essays, marked strictly against the official band descriptors.', ' · ' + (App.data.writing1.length + App.data.writing2.length) + ' prompts') +
      card('speaking', 'Speaking', 'speak', 'Part 1, 2 and 3 questions from the May–Dec 2026 bank, with cue-card timers, speech-to-text and examiner feedback.', '') +
      '</div></div>';
  };

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', async () => {
    try { await App.media.loadVocab(); } catch (e) { /* no book vocabulary on this device */ }
    App.units.build();
    App.applyTheme();
    // Daily test on every app launch (once per session) when there are learned words
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
    let shown = false; try { shown = sessionStorage.getItem('ielts-quiz-shown') === '1'; } catch (e) { /* private mode */ }
    if (!shown && App.units.learned().length > 0 && (!location.hash || location.hash === '#/' || location.hash === '#/home')) {
      try { sessionStorage.setItem('ielts-quiz-shown', '1'); } catch (e) { /* ignore */ }
      history.replaceState(null, '', '#/quiz?auto=1');
    }
    route();
  });
})(window.App);

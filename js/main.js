/* Router, navigation, theme, start-up */
(function (App) {
  'use strict';
  const U = App.util, S = App.store, I = App.icon;
  App.cleanups = [];
  App.onLeave = fn => App.cleanups.push(fn);

  const SIDE = [
    ['home', 'Home', 'home'], ['vocab', 'Vocabulary', 'vocab'], ['quiz', 'Daily test', 'spark'],
    ['§', 'You'], ['notes', 'My notes', 'note'], ['progress', 'Progress', 'chart'], ['settings', 'Settings', 'gear']
  ];
  const TABS = [['home', 'Home', 'home'], ['vocab', 'Vocab', 'vocab'], ['quiz', 'Test', 'spark'], ['notes', 'Notes', 'note'], ['progress', 'Progress', 'chart'], ['settings', 'Settings', 'gear']];
  /* each part of the app has its own pastel colour (see css: [data-c=...]) */
  const SEC = App.SEC = { home: 'sky', vocab: 'lav', quiz: 'pink', notes: 'butter', progress: 'peri', settings: 'slate' };

  function renderNav(route) {
    const UN = App.units, wl = UN.wordsLearned(), due = UN.due().length;
    U.$('#side').innerHTML = '<a class="brand" href="#/home"><img class="brand-mark" src="icons/katie-192.png" alt=""><span><b>Katie’s IELTS</b><small>Words · phrases · collocations</small></span></a>' +
      SIDE.map(s => s[0] === '§' ? '<div class="nav-sec">' + s[1] + '</div>' : '<a class="nav-a' + (route === s[0] ? ' on' : '') + '" data-c="' + SEC[s[0]] + '" href="#/' + s[0] + '"><span class="nic">' + I(s[2]) + '</span><span>' + s[1] + '</span>' + (s[0] === 'notes' && App.notes.count() ? '<small class="nav-count">' + App.notes.count() + '</small>' : '') + '</a>').join('') +
      '<div class="side-foot"><span>Words learned</span><b>' + wl + '</b><small>' + (due ? due + ' due for review' : 'Up to date with reviews') + '</small><div style="margin-top:8px">' + I('fire') + ' ' + App.streak() + '-day streak</div></div>';
    U.$('#tabbar').innerHTML = TABS.map(t => '<a href="#/' + t[0] + '" data-c="' + SEC[t[0]] + '" class="' + (route === t[0] || false ? 'on' : '') + '">' + I(t[2]) + '<span>' + t[1] + '</span></a>').join('');
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
    document.documentElement.dataset.c = SEC[name] || 'sky';
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

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', async () => {
    try { await App.media.loadVocab(); } catch (e) { /* no book vocabulary on this device */ }
    App.units.build();
    if (App.sync) App.sync.run('open');
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

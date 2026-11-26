'use strict';
const E = Engine,
  $ = (id) => document.getElementById(id),
  native = typeof Device !== 'undefined';
const esc = (s) =>
  String(s === undefined ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const paths = {
  home: 'M3 10l9-7 9 7v10H15v-6H9v6H3z',
  book: 'M3 4.5c3.5-.5 6 0 9 2.3 3-2.3 5.5-2.8 9-2.3v14c-3.3-.5-6 0-9 2-3-2-5.7-2.5-9-2zM12 7v13',
  test: 'M8 5H5v16h14V5h-3M9 3h6v4H9zM8 13l2 2 5-5',
  chart: 'M3 3v18h18M7 16v-4m5 4V7m5 9v-6',
  grid: 'M3 4h7v7H3zM14 4h7v7h-7zM3 15h7v6H3zM14 15h7v6h-7z',
  settings: 'M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6',
  bolt: 'M13 2 4 14h7l-1 8 10-13h-8z',
  repeat: 'M3 11a9 9 0 1 1 2 7M3 4v7h7',
  layers: 'm12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2',
  calendar: 'M3 6h18v15H3zM7 3v6m10-6v6M3 11h18',
  note: 'M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5',
  flag: 'M5 21V4m0 1c5-5 8 4 15-1v10c-7 5-10-4-15 1',
  back: 'M15 4l-8 8 8 8',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  sound: 'M3 9h4l5-4v14l-5-4H3zM16 9c2 2 2 4 0 6m2-9c4 3 4 9 0 12',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1',
  search: 'M15.8 15.8 21 21M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  cards: 'M7 8h14v12H7zM3 15V4h14',
  menu: 'M4 6h16M4 12h16M4 18h16',
  arrow: 'M3 12h17m-6-6 6 6-6 6',
  check: 'M4 13l5 5L20 6',
  target: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  folder: 'M3 6h7l2 2h9v12H3z',
};
const icon = (n) =>
  '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + paths[n] + '"/></svg>';
const logo =
  '<svg class="mark" viewBox="0 0 108 108" aria-hidden="true"><path fill="#b3e9c9" d="M10 23l30 6 14 8 14-8 30-6v50l-30 7-14 9-14-9-30-7z"/><path fill="#17675c" d="M48 44v31l-9-6-20-4V36l19 4zM59 56l7-7 7 6 13-17 7 5-20 25z"/></svg>';
const btn = (a, t, c = '', more = '') =>
  '<button type="button" data-action="' + esc(a) + '" class="' + c + '" ' + more + '>' + t + '</button>';
const ib = (a, i, t, c = '') =>
  btn(a, icon(i), 'iconbtn ' + c, 'aria-label="' + esc(t) + '" title="' + esc(t) + '"');
const item = (a, i, title, sub = '') =>
  btn(
    a,
    '<span class="badgeicon">' +
      icon(i) +
      '</span><span class="grow"><b>' +
      esc(title) +
      '</b>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') +
      '</span><span class="chev" aria-hidden="true">›</span>',
    'listbtn',
  );
const tile = (a, i, title, sub, amber = false) =>
  btn(
    a,
    '<span class="badgeicon ' +
      (amber ? 'amber' : '') +
      '">' +
      icon(i) +
      '</span><span><b>' +
      esc(title) +
      '</b><small>' +
      esc(sub) +
      '</small></span>',
    'tile',
  );
const section = (s, side = '') =>
  '<h2 class="section">' + esc(s) + (side ? ' <span>' + esc(side) + '</span>' : '') + '</h2>';
const title = (k, s, d = '') =>
  '<div class="titleblock"><div class="kicker">' +
  esc(k) +
  '</div><h1>' +
  esc(s) +
  '</h1>' +
  (d ? '<p>' + esc(d) + '</p>' : '') +
  '</div>';
const metrics = (arr) =>
  '<div class="metrics">' +
  arr
    .map(
      ([v, label]) => '<div class="metric"><b>' + esc(v) + '</b><small>' + esc(label) + '</small></div>',
    )
    .join('') +
  '</div>';
const empty = (s) => '<div class="empty">' + esc(s) + '</div>';
const progress = (v, max = 100) =>
  '<div class="progress" role="progressbar" aria-label="Прогресс" aria-valuenow="' +
  Math.round((100 * v) / (max || 1)) +
  '" aria-valuemin="0" aria-valuemax="100"><i style="width:' +
  Math.max(0, Math.min(100, (100 * v) / (max || 1))) +
  '%"></i></div>';
const ring = (pc) =>
  '<div class="ring"><svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" stroke="#497569"/><circle cx="50" cy="50" r="44" pathLength="100" stroke="#b8f0ce" stroke-dasharray="' +
  pc +
  ' 100" stroke-linecap="round"/></svg><strong>' +
  pc +
  '%</strong></div>';
const options = (array, selected) =>
  array
    .map(
      ([v, t]) =>
        '<option value="' +
        esc(v) +
        '" ' +
        (String(v) === String(selected) ? 'selected' : '') +
        '>' +
        esc(t) +
        '</option>',
    )
    .join('');
const field = (id, label, html) =>
  '<label class="field" for="' + id + '">' + esc(label) + '</label>' + html;
const sel = (id, label, arr, value) =>
  field(id, label, '<select id="' + id + '">' + options(arr, value) + '</select>');
const input = (id, label, type, value, attrs = '') =>
  field(
    id,
    label,
    '<input id="' + id + '" type="' + type + '" value="' + esc(value) + '" ' + attrs + '>',
  );
const toggle = (id, label, v) =>
  '<label class="switch"><input type="checkbox" id="' +
  id +
  '" ' +
  (v ? 'checked' : '') +
  '>' +
  esc(label) +
  '</label>';
const fmtDate = (t) =>
  new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDay = (t) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const duration = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s >= 3600
    ? Math.floor(s / 3600) + ' ч ' + (Math.floor(s / 60) % 60) + ' мин'
    : s >= 60
      ? Math.floor(s / 60) + ' мин ' + (s % 60) + ' с'
      : s + ' с';
};
const clock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return (
    (Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : '') +
    ('0' + (Math.floor(s / 60) % 60)).slice(-2) +
    ':' +
    ('0' + (s % 60)).slice(-2)
  );
};
let builtin,
  S,
  B,
  P,
  M,
  topicNames,
  route = 'home',
  trail = [],
  catalogFilter = 'all',
  query = '',
  diffFilter = 'all',
  topicFilter = '',
  lvFilter = 'all',
  shown = 30,
  setupType = 'exam',
  chosen = [],
  scopeIds = null,
  cardRevealed = false,
  resultIndex = 0,
  fullReview = false,
  reviewCount = 30;
let documentPending = null,
  toastTimer = 0,
  timeStarted = 0,
  clockStarted = 0,
  clockKey = '',
  frozen = false,
  modalKind = '',
  modalFocus = null,
  lockedSave = false,
  recovery = '';
const profiles = () => {
  B = E.getBank(S, builtin, S.active);
  P = S.profiles[B.id];
  M = E.catalog(B);
  topicNames = Array.from(new Set(B.questions.map((q) => q.topic)));
};
const active = () => (route === 'exam' ? P.exam : route === 'study' ? P.study : null);
const useBank = (x) => E.getBank(S, builtin, B.id, x.revision);
function showToast(msg) {
  $('toast').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').textContent = ''), 3200);
}
function save(override = false) {
  if (lockedSave && !override) return false;
  try {
    const raw = JSON.stringify(S);
    if (native) {
      if (!Device.saveState(raw)) throw Error();
    } else localStorage.setItem('exampro.v1', raw);
    if (!lockedSave) $('notice').textContent = '';
    return true;
  } catch (e) {
    $('notice').textContent =
      'Сохранение не удалось. Освободите место и сохраните резервную копию в настройках.';
    return false;
  }
}
function checkpoint() {
  if (native) return Device.checkpoint();
  try {
    const v = localStorage.getItem('exampro.v1');
    if (v) localStorage.setItem('exampro.before', v);
    return true;
  } catch (e) {
    return false;
  }
}
function applyTheme() {
  const p = S.prefs,
    dark =
      p.theme === 'dark' ||
      (p.theme === 'system' &&
        (native ? Device.systemDark() : window.matchMedia('(prefers-color-scheme:dark)').matches));
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.fontSize = p.text + '%';
}
window.systemChanged = () => {
  if (S) applyTheme();
};
function stopClock() {
  const x = active();
  if (x && timeStarted) {
    const t = x.deadline ? Math.min(Date.now(), x.deadline) : Date.now();
    P.timeStudyMs = (P.timeStudyMs || 0) + Math.max(0, t - timeStarted);
  }
  timeStarted = 0;
  if (x && clockStarted && x.ids[x.at] === clockKey) {
    const end = x.deadline ? Math.min(Date.now(), x.deadline) : Date.now();
    x.times[clockKey] = (x.times[clockKey] || 0) + Math.max(0, end - clockStarted);
  }
  clockStarted = 0;
  clockKey = '';
}
function startClock() {
  const x = active();
  if (!x || frozen || document.hidden) return;
  if (!timeStarted) timeStarted = Date.now();
  if (clockStarted) return;
  const k = x.ids[x.at];
  if (route === 'study' && (Object.prototype.hasOwnProperty.call(x.answers, k) || x.ratings[k])) return;
  clockKey = k;
  clockStarted = Date.now();
}
window.sessionFocus = (b) => {
  if (!S) return;
  if (!b) {
    stopClock();
    frozen = true;
    save();
  } else {
    frozen = false;
    expire();
    startClock();
  }
};
document.addEventListener('visibilitychange', () => window.sessionFocus(!document.hidden));
window.addEventListener('pagehide', () => window.sessionFocus(false));
function expire() {
  if (!P || !P.exam || !P.exam.deadline || Date.now() < P.exam.deadline) return false;
  stopClock();
  E.finish(P, P.exam, useBank(P.exam));
  resultIndex = 0;
  fullReview = false;
  closeModal();
  trail = [];
  route = 'result';
  save();
  render();
  showToast('Время истекло. Результат сохранён.');
  return true;
}
function tick() {
  if (!P || expire()) return;
  const x = P.exam;
  if (x && $('timer'))
    $('timer').textContent = x.deadline
      ? clock(x.deadline - Date.now())
      : duration(Date.now() - x.started);
}
function modal(kind, heading, body, actions) {
  modalFocus = document.activeElement;
  modalKind = kind;
  $('modal').innerHTML =
    '<div class="overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><h2 id="dialogTitle">' +
    esc(heading) +
    '</h2>' +
    body +
    '<div class="actions">' +
    actions +
    '</div></section></div>';
  $('main').setAttribute('aria-hidden', 'true');
  $('nav').setAttribute('aria-hidden', 'true');
  $('bar').setAttribute('aria-hidden', 'true');
  const el = $('modal').querySelector('textarea,input,button');
  if (el) el.focus();
}
function closeModal() {
  if (!$('modal')) return;
  modalKind = '';
  $('modal').innerHTML = '';
  for (const n of ['main', 'nav', 'bar']) $(n).removeAttribute('aria-hidden');
  if (modalFocus && document.contains(modalFocus)) modalFocus.focus();
  modalFocus = null;
}
function nav(r, back = false) {
  stopClock();
  save();
  if (native) Device.silence();
  closeModal();
  if (!back && r !== route) {
    trail.push(route);
    if (trail.length > 20) trail.shift();
  }
  route = r;
  cardRevealed = false;
  render();
  window.scrollTo(0, 0);
  $('main').focus();
  startClock();
}
window.appBack = () => {
  if (modalKind) {
    closeModal();
    return true;
  }
  if (route === 'home') return false;
  if (route === 'exam' && P.exam) {
    nav('home', true);
    trail = [];
    showToast('Экзамен сохранён. Включённый таймер продолжает отсчёт.');
    return true;
  }
  if (route === 'result' || route === 'study') {
    nav('home', true);
    trail = [];
    return true;
  }
  nav(trail.pop() || 'home', true);
  return true;
};
function render() {
  if (!S) return;
  applyTheme();
  const tabs = [
    ['home', 'home', 'Главная'],
    ['catalog', 'book', 'Вопросы'],
    ['stats', 'chart', 'Прогресс'],
    ['more', 'menu', 'Меню'],
  ];
  const tab =
    route === 'catalog' || route === 'topics'
      ? 'catalog'
      : ['history', 'result', 'stats'].includes(route)
        ? 'stats'
        : ['more', 'settings', 'banks', 'help', 'plan', 'decks', 'errors'].includes(route)
          ? 'more'
          : 'home';
  $('bar').innerHTML =
    (route === 'home'
      ? '<div class="brand">' + logo + '<span>Экзамен</span><b class="pro">ПРО</b></div>'
      : '<div class="head-actions">' + ib('back', 'back', 'Назад') + '<b>Экзамен ПРО</b></div>') +
    ib('settings', 'settings', 'Настройки', 'ghost');
  $('nav').innerHTML = tabs
    .map(([a, i, t]) =>
      btn(
        a,
        icon(i) + '<span>' + t + '</span>',
        tab === a ? 'active' : '',
        tab === a ? 'aria-current="page"' : '',
      ),
    )
    .join('');
  const views = {
    home,
    more,
    catalog: catalogView,
    topics: topicsView,
    setup: setupView,
    study: questionView,
    exam: questionView,
    errors: errorsView,
    decks: decksView,
    stats: statsView,
    history: historyView,
    result: resultView,
    plan: planView,
    banks: banksView,
    settings: settingsView,
    help: helpView,
  };
  $('main').innerHTML = (views[route] || home)();
  if (route === 'catalog') fillCatalog();
  if (route === 'setup') updateAvailable();
  tick();
}
function home() {
  const p = E.plan(B, P),
    learned = B.questions.filter((q) => E.stat(P, q.id).level >= 2 && !E.stat(P, q.id).active).length,
    seen = B.questions.filter((q) => P.stats[q.id] && P.stats[q.id].last).length,
    pc = Math.round((100 * learned) / (B.questions.filter((q) => q.keys.length).length || 1));
  const x = P.exam,
    wrong = B.questions.filter((q) => E.stat(P, q.id).active).length;
  return (
    title('Моя подготовка', B.title) +
    '<section class="hero"><div><span class="meta">' +
    (x ? 'Незавершённый экзамен' : 'Освоение материала') +
    '</span><h2>' +
    (x ? 'Продолжить экзамен' : 'Подготовка на сегодня') +
    '</h2><p>' +
    (x
      ? 'Отвечено ' +
        Object.keys(x.answers).filter((k) => x.answers[k].length).length +
        ' из ' +
        x.ids.length +
        ' вопросов.'
      : 'Освоено ' +
        learned +
        ' из ' +
        B.questions.filter((q) => q.keys.length).length +
        ' оцениваемых вопросов.') +
    '</p>' +
    btn(
      x ? 'resumeexam' : 'continue',
      x
        ? 'Открыть билет ' + icon('arrow')
        : (P.study ? 'Продолжить' : 'Начать обучение') + ' ' + icon('arrow'),
      'lightbtn',
    ) +
    '</div>' +
    ring(
      x
        ? Math.round(
            (100 * Object.keys(x.answers).filter((k) => x.answers[k].length).length) / x.ids.length,
          )
        : pc,
    ) +
    '</section>' +
    section('Мой прогресс') +
    metrics([
      [seen, 'Изучено'],
      [wrong, 'Активные ошибки'],
      [p.due, 'К повторению'],
    ]) +
    section('Режимы подготовки') +
    '<div class="modegrid">' +
    tile('smart', 'bolt', 'Умная подготовка', 'Вопросы на сегодня') +
    tile('setupexam', 'test', 'Экзамен', 'Билет с результатом', true) +
    tile('errors', 'repeat', 'Работа над ошибками', 'Повторить трудное') +
    tile('decks', 'cards', 'Карточки', 'Вспомнить ответ') +
    '</div>' +
    section('Ближайшая цель') +
    '<div class="card"><div class="between"><b>План на сегодня</b><span>' +
    p.done +
    ' / ' +
    p.target +
    '</span></div>' +
    progress(p.done, p.target) +
    btn('plan', 'Открыть план', 'ghost') +
    '</div>'
  );
}
function more() {
  return (
    title('Приложение', 'Меню') +
    '<div class="list">' +
    [
      ['continue', 'book', 'Продолжить обучение'],
      ['smart', 'bolt', 'Умная подготовка'],
      ['topics', 'layers', 'Подготовка по темам'],
      ['setuptrain', 'test', 'Тренировочный тест'],
      ['setupexam', 'test', 'Экзамен'],
      ['errors', 'repeat', 'Работа над ошибками'],
      ['listhard', 'flag', 'Сложные вопросы'],
      ['decks', 'cards', 'Карточки'],
      ['liststars', 'star', 'Избранное'],
      ['listbookmarks', 'bookmark', 'Закладки'],
      ['listnotes', 'note', 'Личные заметки'],
      ['listrecent', 'clock', 'История просмотра'],
      ['history', 'clock', 'История экзаменов'],
      ['plan', 'calendar', 'План подготовки'],
      ['banks', 'folder', 'Экзаменационные базы'],
      ['settings', 'settings', 'Настройки и резервная копия'],
      ['help', 'help', 'Справка о приложении'],
    ]
      .map((row) => item(...row))
      .join('') +
    '</div>'
  );
}
const filters = {
  all: 'Все вопросы',
  stars: 'Избранное',
  hard: 'Сложные вопросы',
  notes: 'Личные заметки',
  bookmarks: 'Закладки',
  recent: 'История просмотра',
  errors: 'Активные ошибки',
  ever: 'Все прежние ошибки',
  often: 'Повторяющиеся ошибки',
  due: 'Пора повторить',
  last: 'Ошибки последнего экзамена',
  reference: 'Только для разбора',
};
function selectedCatalog() {
  const last = P.history[0];
  let qs = catalogFilter === 'recent' ? P.recent.map((k) => M[k]).filter(Boolean) : B.questions;
  const tokens = query.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim(),
    num = tokens.match(/^№?\s*(\d+)$/);
  let lastMap = {};
  if (last && catalogFilter === 'last') lastMap = E.catalog(useBank(last));
  return qs.filter((q) => {
    const k = q.id,
      s = E.stat(P, k);
    if (
      (topicFilter && topicFilter !== q.topic) ||
      (lvFilter !== 'all' && E.status(s) !== +lvFilter) ||
      (diffFilter === 'hard' && !P.hard.includes(k)) ||
      (diffFilter === 'often' && s.bad + s.skip < 2)
    )
      return false;
    if (
      (['stars', 'hard', 'bookmarks'].includes(catalogFilter) && !P[catalogFilter].includes(k)) ||
      (catalogFilter === 'notes' && !P.notes[k]) ||
      (catalogFilter === 'errors' && !s.active) ||
      (catalogFilter === 'ever' && !s.bad && !s.skip) ||
      (catalogFilter === 'often' && s.bad + s.skip < 2) ||
      (catalogFilter === 'due' && !(s.last && (s.active || s.due <= Date.now()) && q.keys.length)) ||
      (catalogFilter === 'reference' && q.keys.length)
    )
      return false;
    if (
      catalogFilter === 'last' &&
      (!last || !last.ids.includes(k) || E.equal(last.answers[k] || [], lastMap[k].keys))
    )
      return false;
    if (!tokens) return true;
    if (num) return q.no === +num[1];
    const text = (q.text + ' ' + q.options.map((o) => o.text).join(' ') + ' ' + (P.notes[k] || ''))
      .toLocaleLowerCase('ru')
      .replace(/ё/g, 'е');
    return tokens.split(/\s+/).every((t) => text.includes(t));
  });
}
function catalogView() {
  return (
    title(B.title, filters[catalogFilter]) +
    '<div class="card">' +
    input(
      'query',
      'Поиск по номеру, тексту и ответам',
      'search',
      query,
      'placeholder="Номер вопроса или ключевые слова"',
    ) +
    '<details><summary>Фильтры</summary>' +
    sel('catfilter', 'Подборка', Object.entries(filters), catalogFilter) +
    sel('filtertopic', 'Тема', [['', 'Все темы']].concat(topicNames.map((t) => [t, t])), topicFilter) +
    sel(
      'difficulty',
      'Сложность',
      [
        ['all', 'Любая'],
        ['hard', 'Отмеченные как сложные'],
        ['often', 'Две ошибки и более'],
      ],
      diffFilter,
    ) +
    sel(
      'mastery',
      'Освоение',
      [['all', 'Любой уровень']].concat(E.statuses.map((s, i) => [i, s])),
      lvFilter,
    ) +
    '</details></div><div id="matches"></div>'
  );
}
function fillCatalog() {
  const list = selectedCatalog();
  $('matches').innerHTML =
    '<div class="between section"><h2>Вопросы</h2><span class="meta">Найдено ' +
    list.length +
    '</span></div>' +
    (list.length
      ? '<div class="actions">' +
        btn('studyfiltered', 'Изучить подборку', 'soft') +
        '</div><div class="list" style="margin-top:12px">' +
        list
          .slice(0, shown)
          .map((q) =>
            btn(
              'openq:' + q.id,
              '<span class="grow"><small>№ ' +
                q.no +
                ' · ' +
                esc(q.topic) +
                '</small><b>' +
                esc(q.text) +
                '</b>' +
                (catalogFilter === 'notes'
                  ? '<small class="note">' + esc(P.notes[q.id]) + '</small>'
                  : '') +
                '</span><span class="chev">›</span>',
              'listbtn',
            ),
          )
          .join('') +
        '</div>' +
        (shown < list.length ? btn('morelist', 'Показать ещё', 'soft') : '')
      : empty('Подходящих вопросов пока нет.'));
}
function topicsView() {
  const m = E.weakMap(B, P);
  return (
    title(B.title, 'Подготовка по темам', 'Разделы составлены для обучения по содержанию вопросов.') +
    '<div class="card">' +
    topicChecks() +
    '<div class="actions">' +
    btn('topicslearn', 'Изучить', 'primary') +
    btn('topicstrain', 'Тренировка') +
    btn('topicsexam', 'Экзамен') +
    btn('topicscards', 'Карточки') +
    '</div></div>' +
    section('Освоение тем') +
    '<div class="card">' +
    topicNames
      .map(
        (t) =>
          '<div class="barrow"><b>' +
          esc(t) +
          '</b><small>' +
          m[t].learned +
          ' / ' +
          m[t].total +
          '</small>' +
          progress(m[t].learned, m[t].total) +
          '</div>',
      )
      .join('') +
    '</div>'
  );
}
function topicChecks() {
  return (
    '<div class="between"><b>Выбор тем</b>' +
    btn('alltopics', chosen.length ? 'Сбросить выбор' : 'Выбрать все', 'ghost') +
    '</div><small>При пустом выборе используются все темы.</small>' +
    topicNames
      .map(
        (t, i) =>
          '<label class="switch"><input type="checkbox" data-topic="' +
          i +
          '" ' +
          (chosen.includes(t) ? 'checked' : '') +
          '>' +
          esc(t) +
          '</label>',
      )
      .join('')
  );
}
const topicQs = () =>
  B.questions.filter(
    (q) => (!chosen.length || chosen.includes(q.topic)) && (!scopeIds || scopeIds.includes(q.id)),
  );
function setupView() {
  const exam = setupType === 'exam';
  return (
    title(
      B.title,
      exam ? 'Настройка экзамена' : 'Тренировочный тест',
      exam
        ? 'Результат и разбор появятся после завершения. Параметры тренировочные.'
        : 'Ответ и пояснение открываются после каждой попытки.',
    ) +
    '<div class="card"><span class="tag" id="avail"></span>' +
    sel(
      'size',
      'Количество вопросов',
      [
        [10, '10'],
        [20, '20'],
        [30, '30'],
        [50, '50'],
        [100, '100'],
        ['all', 'Все с ключом для оценки'],
        ['own', 'Своё количество'],
      ],
      10,
    ) +
    '<div id="ownwrap" hidden>' +
    input('customsize', 'Своё количество', 'number', 10, 'min="1" step="1"') +
    '</div><details><summary>Тематические разделы</summary>' +
    topicChecks() +
    '</details>' +
    toggle('verifiedOnly', 'Только вопросы с датированной индивидуальной сверкой', false) +
    toggle('mix', 'Перемешивать варианты ответов', true) +
    (exam
      ? toggle('timerOn', 'Ограничить время', false) +
        '<div id="minwrap" hidden>' +
        input('minutes', 'Время, минут', 'number', 20, 'min="1" max="1440" step="1"') +
        '</div>' +
        input('pass', 'Проходной балл, %', 'number', 80, 'min="1" max="100" step="1"') +
        toggle('forward', 'Запретить возврат к предыдущим вопросам', false)
      : '') +
    '<p class="meta">Варианты сохраняют исходные номера. Учитываются ключи базы, включая отдельно отмеченные архивные билеты.</p><div class="actions">' +
    btn('starttest', exam ? 'Начать экзамен' : 'Начать тренировку', 'primary') +
    '</div></div>'
  );
}
function availableQuestions() {
  return topicQs().filter(
    (q) => q.keys.length && (!($('verifiedOnly') && $('verifiedOnly').checked) || q.reviewed),
  );
}
function updateAvailable() {
  if ($('avail'))
    $('avail').textContent = 'Доступно вопросов с ключом для оценки • ' + availableQuestions().length;
}
function errorsView() {
  const ever = B.questions.filter((q) => {
    const s = E.stat(P, q.id);
    return s.bad + s.skip;
  }).length;
  return (
    title(B.title, 'Работа над ошибками') +
    metrics([
      [B.questions.filter((q) => E.stat(P, q.id).active).length, 'Активные'],
      [ever, 'За всё время'],
      [P.hard.length, 'Сложные'],
    ]) +
    section('Подборки') +
    '<div class="list">' +
    [
      ['errors', 'Активные ошибки'],
      ['last', 'Ошибки последнего экзамена'],
      ['often', 'Повторяющиеся ошибки'],
      ['ever', 'Все прежние ошибки'],
      ['hard', 'Отмеченные сложными'],
    ]
      .map(([k, t]) => item('list' + k, 'repeat', t))
      .join('') +
    '</div><div class="actions">' +
    btn('errorpractice', 'Повторить активные ошибки', 'primary') +
    btn('errorexam', 'Тест по ошибкам') +
    '</div><p class="meta">Вопрос выйдет из активных ошибок после двух успешных повторений по расписанию. История попыток сохраняется.</p>'
  );
}

function sourceInfo(q, full = true) {
  const srcKeys = q.sourceKeys.map((id) => q.options.find((o) => o.id === id)).filter(Boolean);
  const key = srcKeys.length
    ? 'Вариант ' + srcKeys.map((o) => q.options.indexOf(o) + 1).join(', ')
    : 'В исходном документе ключ отсутствует.';
  return (
    (q.caveat ? '<p class="hint">' + esc(q.caveat) + '</p>' : '') +
    (q.explanation ? '<h3>Пояснение</h3><p>' + esc(q.explanation) + '</p>' : '') +
    (q.reference
      ? '<p><b>Нормативный ориентир</b><br>' +
        esc(q.reference) +
        (q.reviewed ? ' · проверено ' + fmtDate(q.reviewed + 'T12:00:00') : '') +
        '</p>'
      : '') +
    (q.status ? '<p class="meta">' + esc(q.status) + '</p>' : '') +
    (q.url || q.extra
      ? '<div class="actions">' +
        (q.url ? btn('src:' + q.id, 'Открыть источник', 'ghost') : '') +
        (q.extra && q.extra !== q.url ? btn('extra:' + q.id, 'Источник уточнения', 'ghost') : '') +
        '</div>'
      : '') +
    (full
      ? '<details><summary>Исходная запись' +
        (q.page ? ' · стр. ' + q.page : '') +
        '</summary><p><b>Ключ документа</b><br>' +
        esc(key) +
        '</p>' +
        (q.sourceNote ? '<p>' + esc(q.sourceNote) + '</p>' : '') +
        '</details>'
      : '')
  );
}
function personal(q) {
  const id = q.id,
    stats = E.stat(P, id),
    events = P.events.filter((e) => e.id === id);
  return (
    '<details><summary>Мои отметки и история</summary><div class="actions">' +
    btn(
      'markstar:' + id,
      icon('star') + ' ' + (P.stars.includes(id) ? 'В избранном' : 'В избранное'),
      P.stars.includes(id) ? 'on' : '',
    ) +
    btn('markhard:' + id, icon('flag') + ' Сложный', P.hard.includes(id) ? 'on' : '') +
    btn('markbookmark:' + id, icon('bookmark') + ' Закладка', P.bookmarks.includes(id) ? 'on' : '') +
    btn('note:' + id, icon('note') + ' Заметка') +
    btn('copy:' + id, 'Копировать') +
    btn('speak:' + id, icon('sound') + ' Озвучить') +
    btn('silence', 'Остановить чтение') +
    '</div>' +
    (P.notes[id] ? '<p class="note">' + esc(P.notes[id]) + '</p>' : '') +
    '<p class="meta">' +
    esc(E.statuses[E.status(stats)]) +
    ' · верно ' +
    stats.ok +
    ' · ошибок ' +
    stats.bad +
    ' · пропусков ' +
    stats.skip +
    '</p>' +
    (events.length
      ? '<details><summary>Попытки · ' +
        events.length +
        '</summary>' +
        events
          .slice()
          .reverse()
          .map(
            (e) =>
              '<p class="meta">' +
              fmtDate(e.t) +
              ' · ' +
              { ok: 'Верно', bad: 'Ошибка', skip: 'Пропущено', read: 'Разбор' }[e.r] +
              ' · ' +
              duration(e.ms) +
              '</p>',
          )
          .join('') +
        '</details>'
      : '') +
    '</details>'
  );
}
function questionView() {
  const x = active();
  if (!x) return empty('Сессия завершена.');
  const b = useBank(x),
    bankMap = E.catalog(b),
    q = bankMap[x.ids[x.at]],
    k = q.id,
    exam = route === 'exam',
    cards = x.mode === 'cards',
    locked = !exam && (Object.prototype.hasOwnProperty.call(x.answers, k) || !!x.ratings[k]),
    ref = !q.keys.length;
  const multi = q.keys.length > 1,
    selected = (exam ? x.answers[k] : locked ? x.answers[k] : x.draft[k]) || [],
    rated = !!x.ratings[k],
    solutions = q.options.filter((o) => q.keys.includes(o.id));
  let inner = '';
  if (cards) {
    inner =
      '<div class="card flash"><b>' +
      (cardRevealed || rated
        ? ref
          ? 'Справочный вопрос'
          : 'Ответ'
        : 'Вспомните ответ самостоятельно') +
      '</b>' +
      (cardRevealed || rated
        ? solutions.map((o) => '<p>' + esc(o.text) + '</p>').join('') + sourceInfo(q)
        : '<div class="actions">' + btn('reveal', 'Показать ответ', 'primary') + '</div>') +
      '</div>';
    if (cardRevealed && !rated)
      inner +=
        '<div class="actions">' +
        (ref
          ? btn('grade:read', 'Прочитано', 'primary')
          : [
              ['again', 'Не знаю'],
              ['hard', 'Сложно'],
              ['good', 'Хорошо'],
              ['easy', 'Легко'],
            ]
              .map(([v, t]) => btn('grade:' + v, t, v === 'good' ? 'primary' : ''))
              .join('')) +
        '</div>';
    if (rated) inner += '<p class="tag">Карточка пройдена</p>';
  } else {
    if (ref) inner += '<p class="hint">Только для разбора. У вопроса нет ключа для оценки.</p>';
    if (multi) inner += '<p class="meta">Выберите все подходящие варианты.</p>';
    inner +=
      '<div class="list">' +
      x.order[k]
        .map((id) => {
          const o = q.options.find((v) => v.id === id),
            hit = selected.includes(id),
            good = q.keys.includes(id) && locked && !ref,
            bad = hit && !q.keys.includes(id) && locked && !ref;
          return btn(
            'answer:' + id,
            '<span class="num">' +
              (q.options.indexOf(o) + 1) +
              '</span><span class="grow">' +
              esc(o.text) +
              (good || bad
                ? '<span class="verify">' +
                  (good ? '✓ Правильный вариант' : '× Ошибочный выбор') +
                  '</span>'
                : '') +
              '</span>',
            'opt ' + (good ? 'right' : bad ? 'wrong' : hit ? 'selected' : ''),
            'aria-pressed="' + hit + '" ' + (locked || ref ? 'disabled' : ''),
          );
        })
        .join('') +
      '</div>';
    if (!exam && !locked && multi)
      inner +=
        '<div class="actions">' +
        btn('checkmulti', 'Проверить выбор', 'primary', selected.length ? '' : 'disabled') +
        '</div>';
    if (!exam && ref && !locked)
      inner += '<div class="actions">' + btn('read', 'Открыть разбор', 'primary') + '</div>';
    if (locked)
      inner +=
        '<div class="feedback" role="status"><p class="' +
        (ref ? 'hint' : E.equal(selected, q.keys) ? 'right' : 'wrong') +
        '"><b>' +
        (ref ? 'Разбор без оценки' : E.equal(selected, q.keys) ? 'Ответ верный' : 'Ответ неверный') +
        '</b></p>' +
        sourceInfo(q) +
        '</div>';
  }
  const finishBtn = btn(
    'finish',
    exam ? 'Завершить экзамен' : 'Завершить подборку',
    x.at === x.ids.length - 1 ? 'primary' : 'ghost',
  );
  const navBtns =
    (!x.forward ? btn('prev', 'Назад', '', x.at === 0 ? 'disabled' : '') : '') +
    (x.at < x.ids.length - 1
      ? btn('next', (!exam && !locked ? 'Пропустить' : 'Далее') + ' ' + icon('arrow'), 'primary')
      : '') +
    finishBtn;
  const answeredCount = Object.keys(x.answers).filter((i) => x.answers[i].length).length;
  const currentAnswers = Object.keys(x.answers).filter((i) => bankMap[i].keys.length);
  const right = exam ? 0 : currentAnswers.filter((i) => E.equal(x.answers[i], bankMap[i].keys)).length;
  const jump =
    exam && x.forward
      ? ''
      : '<details class="noprint"><summary>Перейти к вопросу</summary>' +
        sel(
          'jump',
          'Позиция в подборке',
          x.ids.map((id, i) => [
            i,
            i +
              1 +
              ' · № ' +
              bankMap[id].no +
              (x.marked.includes(id) ? ' · отложен' : '') +
              (x.answers[id] && x.answers[id].length ? ' · есть ответ' : ''),
          ]),
          x.at,
        ) +
        '</details>';
  return (
    title(
      exam
        ? 'Экзамен'
        : cards
          ? 'Карточки'
          : x.mode === 'smart'
            ? 'Умная подготовка'
            : x.mode === 'train'
              ? 'Тренировочный тест'
              : 'Обучение',
      x.label || b.title,
    ) +
    '<section class="question"><div class="between"><b>' +
    (x.at + 1) +
    ' из ' +
    x.ids.length +
    '</b>' +
    (exam
      ? '<span class="tag" id="timer">' + clock(x.deadline - Date.now()) + '</span>'
      : '<small>№ ' + q.no + '</small>') +
    '</div>' +
    progress(x.at + 1, x.ids.length) +
    '<div class="between"><small>' +
    (exam ? '№ ' + q.no + ' · ' : '') +
    esc(q.topic) +
    '</small>' +
    (exam
      ? ''
      : ib(
          'markstar:' + k,
          'star',
          P.stars.includes(k) ? 'Убрать из избранного' : 'Добавить в избранное',
          P.stars.includes(k) ? 'on' : '',
        )) +
    '</div><h2 class="qprompt">' +
    esc(q.text) +
    '</h2>' +
    inner +
    (!exam
      ? personal(q)
      : !x.forward
        ? '<div class="actions">' +
          btn(
            'flag',
            icon('flag') + ' ' + (x.marked.includes(k) ? 'Отложен' : 'Отложить вопрос'),
            x.marked.includes(k) ? 'on' : '',
          ) +
          '</div>'
        : '') +
    '<div class="actions">' +
    navBtns +
    '</div>' +
    jump +
    '<p class="meta">' +
    (exam
      ? 'Отвечено ' + answeredCount + ' из ' + x.ids.length
      : cards
        ? 'Пройдено карточек ' + Object.keys(x.ratings).length
        : 'Верно ' + right + ' · Ошибок ' + (currentAnswers.length - right)) +
    '</p></section>'
  );
}
function decksView() {
  return (
    title(
      B.title,
      'Карточки',
      'Сначала вспомните ответ, затем откройте его и оцените, насколько легко он дался.',
    ) +
    '<div class="list">' +
    item('cardsall', 'cards', 'Все карточки', B.questions.length + ' вопросов') +
    item('cardsdue', 'repeat', 'Пора повторить') +
    item('cardshard', 'flag', 'Только сложные') +
    item('cardsstars', 'star', 'Из избранного') +
    item('topics', 'layers', 'Выбрать темы') +
    '</div>' +
    section('Мои подборки') +
    (P.decks.length
      ? '<div class="list">' +
        P.decks.map((d, i) => item('deck:' + i, 'cards', d.name, d.ids.length + ' вопросов')).join('') +
        '</div>'
      : empty('Соберите вопросы по теме, номеру или собственным отметкам.')) +
    '<div class="actions">' +
    btn('newdeck', 'Создать подборку', 'primary') +
    '</div>'
  );
}
function summaryData() {
  const all = B.questions,
    graded = all.filter((q) => q.keys.length),
    states = all.map((q) => E.stat(P, q.id)),
    seen = states.filter((s) => s.last).length;
  const mastered = graded.filter((q) => {
    const s = E.stat(P, q.id);
    return s.level >= 2 && !s.active;
  }).length;
  const events = P.events,
    ok = events.filter((e) => e.r === 'ok').length,
    bad = events.filter((e) => e.r === 'bad').length,
    skip = events.filter((e) => e.r === 'skip').length;
  const tested = ok + bad + skip,
    history = P.history.map((x) => E.totals(x, useBank(x))),
    recent = history.slice(0, 3);
  const coverage = graded.length ? (100 * mastered) / graded.length : 0,
    accuracy = tested ? (100 * ok) / tested : 0,
    exam = recent.length ? recent.reduce((v, x) => v + x.pct, 0) / recent.length : 0;
  const days = {};
  for (const e of events) {
    const d = E.day(e.t);
    days[d] = (days[d] || 0) + 1;
  }
  let streak = 0,
    offset = days[E.day(Date.now())] ? 0 : -1;
  while (days[E.day(E.addDays(Date.now(), offset - streak))]) streak++;
  const spent = events.reduce((v, e) => v + e.ms, 0),
    timed = events.filter((e) => e.r !== 'skip' && e.ms > 0);
  return {
    seen,
    mastered,
    ok,
    bad,
    skip,
    studyMs: Math.max(P.timeStudyMs || 0, spent),
    accuracy: Math.round(accuracy),
    readiness: Math.round(0.5 * coverage + 0.3 * exam + 0.2 * accuracy),
    best: history.length ? Math.max(...history.map((x) => x.pct)) : null,
    last: history.length ? history[0].pct : null,
    streak,
    days,
    spent,
    avg: timed.length ? timed.reduce((a, e) => a + e.ms, 0) / timed.length : 0,
    history,
    graded: graded.length,
  };
}
function dayChart(s) {
  const d = Array.from({ length: 7 }, (_, i) => E.addDays(Date.now(), i - 6)),
    max = Math.max(1, ...d.map((t) => s.days[E.day(t)] || 0));
  return (
    '<div class="daybars">' +
    d
      .map((t) => {
        const v = s.days[E.day(t)] || 0;
        return (
          '<div class="daybar"><b>' +
          v +
          '</b><i style="height:' +
          Math.max(2, (68 * v) / max) +
          'px"></i><small>' +
          new Date(t).getDate() +
          '.' +
          ('0' + (new Date(t).getMonth() + 1)).slice(-2) +
          '</small></div>'
        );
      })
      .join('') +
    '</div>'
  );
}
function statsView() {
  const s = summaryData(),
    p = E.plan(B, P),
    tem = E.weakMap(B, P),
    weak = topicNames
      .filter((t) => tem[t].ok + tem[t].bad + tem[t].skip)
      .sort((a, b) => {
        const k = (t) => tem[t].ok / (tem[t].ok + tem[t].bad + tem[t].skip);
        return k(a) - k(b);
      });
  return (
    title(B.title, 'Мой прогресс') +
    '<div class="hero"><div><span class="meta">Оценка подготовки</span><h2>Готовность к экзамену</h2><p>По освоению тем, ответам и последним экзаменам.</p></div>' +
    ring(s.readiness) +
    '</div>' +
    section('Материал') +
    metrics([
      [B.questions.length, 'Всего вопросов'],
      [s.seen, 'Изучено'],
      [s.mastered, 'Освоено'],
      [p.due, 'К повторению'],
      [B.questions.length - s.seen, 'Не изучено'],
      [Math.round((100 * s.seen) / B.questions.length) + '%', 'Пройдено материала'],
    ]) +
    section('Результаты') +
    metrics([
      [s.ok, 'Верных ответов'],
      [s.bad, 'Ошибочных'],
      [s.skip, 'Пропусков в экзамене'],
      [s.accuracy + '%', 'Успешность'],
      [s.best === null ? '—' : s.best + '%', 'Лучший экзамен'],
      [s.last === null ? '—' : s.last + '%', 'Последний'],
      [P.history.length, 'Экзаменов'],
      [duration(s.avg), 'Среднее на ответ'],
      [duration(Math.max(P.timeStudyMs || 0, s.spent)), 'Время занятий'],
    ]) +
    section('Занятия за неделю') +
    '<div class="card">' +
    dayChart(s) +
    '<p class="meta">Ответы и разборы по дням · серия ' +
    s.streak +
    ' дн.</p></div>' +
    section('Динамика экзаменов') +
    (s.history.length
      ? '<div class="card">' +
        s.history
          .slice(0, 10)
          .map(
            (h, i) =>
              '<div class="barrow"><b>' +
              shortDay(P.history[i].ended) +
              '</b><small>' +
              h.pct +
              '%</small>' +
              progress(h.pct) +
              '</div>',
          )
          .join('') +
        '</div>'
      : empty('Здесь появятся результаты первых экзаменов.')) +
    section('Темы для повторения') +
    (weak.length
      ? '<div class="card">' +
        weak
          .slice(0, 3)
          .map(
            (t) =>
              '<p><b>' +
              esc(t) +
              '</b> · ' +
              Math.round((100 * tem[t].ok) / (tem[t].ok + tem[t].bad + tem[t].skip)) +
              '% верно</p>',
          )
          .join('') +
        '</div>'
      : empty('Для рекомендации нужны ответы.')) +
    '<div class="actions">' +
    btn('topics', 'Все темы') +
    btn('history', 'История экзаменов') +
    btn('exportstats', 'Экспорт статистики') +
    '</div><details><summary>Как рассчитывается готовность</summary><p>50% оценки даёт доля освоенных оцениваемых вопросов, 30% — средний процент последних трёх экзаменов, 20% — доля верных ответов среди оценённых попыток с учётом пропусков. При отсутствии экзаменов их вклад равен нулю. Это ориентир для подготовки.</p></details>'
  );
}
function historyView() {
  return (
    title(B.title, 'История экзаменов') +
    (P.history.length
      ? '<div class="list">' +
        P.history
          .map((x, i) => {
            const r = E.totals(x, useBank(x));
            return item(
              'result:' + i,
              'test',
              r.pct + '% · ' + (r.passed ? 'Сдан' : 'Не сдан'),
              fmtDate(x.ended) +
                ' · ' +
                r.right +
                ' из ' +
                r.total +
                ' · ' +
                duration(x.ended - x.started),
            );
          })
          .join('') +
        '</div>'
      : empty('Завершите экзамен, чтобы увидеть результат и разбор.'))
  );
}
const texts = (q, ids) =>
  ids.length ? ids.map((k) => q.options.find((o) => o.id === k).text).join(' / ') : 'Пропущен';
function resultView() {
  const x = P.history[resultIndex];
  if (!x) return empty('Запись не найдена.');
  const b = useBank(x),
    m = E.catalog(b),
    r = E.totals(x, b);
  const isWrong = (k) => !E.equal(x.answers[k] || [], m[k].keys),
    list = x.ids.filter((k) => fullReview || isWrong(k));
  const review = (k, print = false) => {
    const q = m[k],
      a = x.answers[k] || [];
    return (
      '<article class="card"><small>№ ' +
      q.no +
      ' · ' +
      esc(q.topic) +
      '</small><h3>' +
      esc(q.text) +
      '</h3><p><b>Ваш ответ</b><br>' +
      esc(texts(q, a)) +
      '</p><p><b>По ключу для оценки</b><br>' +
      esc(texts(q, q.keys)) +
      '</p>' +
      (print ? '' : sourceInfo(q, false)) +
      '</article>'
    );
  };
  return (
    title(
      'Результат экзамена',
      r.passed ? 'Экзамен сдан' : 'Экзамен не сдан',
      fmtDate(x.ended) + ' · ' + b.title + ' · редакция ' + b.revision,
    ) +
    '<div class="hero"><div><span class="meta">Итог</span><h2>' +
    r.right +
    ' из ' +
    r.total +
    ' верно</h2><p>Проходной балл ' +
    x.pass +
    '% · ' +
    duration(x.ended - x.started) +
    '</p></div>' +
    ring(r.pct) +
    '</div>' +
    section('Ответы') +
    metrics([
      [r.right, 'Верно'],
      [r.wrong, 'Ошибки'],
      [r.skip, 'Пропущено'],
    ]) +
    '<div class="actions noprint">' +
    btn('retest', 'Повторить экзамен', 'primary') +
    (r.wrong + r.skip ? btn('retrywrong', 'Тест по ошибкам') : '') +
    btn('shareresult', 'Поделиться') +
    btn('print', 'Сохранить PDF') +
    btn('exportresult', 'Экспорт JSON') +
    '</div><section class="noprint">' +
    section('Разбор вопросов') +
    '<div class="actions">' +
    btn('reviewbad', 'Ошибки и пропуски', !fullReview ? 'on' : '') +
    btn('reviewall', 'Все вопросы', fullReview ? 'on' : '') +
    '</div><div style="margin-top:12px">' +
    (list.length
      ? list
          .slice(0, reviewCount)
          .map((k) => review(k))
          .join('')
      : empty('Все ответы верные.')) +
    '</div>' +
    (list.length > reviewCount ? btn('morereview', 'Показать ещё') : '') +
    '</section><div id="printdata" class="print-only"></div>'
  );
}
function planView() {
  const p = E.plan(B, P);
  let reminder = [0, 19, 0];
  if (native) reminder = Device.reminder().split(',').map(Number);
  return (
    title(B.title, 'План подготовки') +
    '<div class="card"><div class="between"><h2>Цель на сегодня</h2><b>' +
    p.done +
    ' / ' +
    p.target +
    '</b></div>' +
    progress(p.done, p.target) +
    '<p>Новых и требующих закрепления вопросов — ' +
    p.remaining +
    '. Готово к повторению — ' +
    p.due +
    '.</p>' +
    (p.days
      ? '<p>Дней для занятий с учётом сегодняшнего — ' +
        p.days +
        '. Расчётный темп — ' +
        p.needed +
        ' в день.</p>'
      : '') +
    (p.days && p.needed > p.capacity
      ? '<p class="hint">При выбранном времени расчётная нагрузка выше дневной ёмкости (' +
        p.capacity +
        '). Можно увеличить время или перенести дату.</p>'
      : '') +
    '<div class="actions">' +
    btn('smart', 'Начать занятие', 'primary') +
    '</div></div><div class="card">' +
    input('examDate', 'Дата экзамена', 'date', P.plan.date) +
    input('studyMinutes', 'Минут в день', 'number', P.plan.minutes, 'min="1" max="480"') +
    '<div class="actions">' +
    btn('saveplan', 'Сохранить план', 'soft') +
    '</div><p class="meta">После пропуска занятия план пересчитывается по оставшимся дням. Объём учитывает ошибки, сложные вопросы и среднее время ответа.</p></div>' +
    (native
      ? '<div class="card"><h2>Ежедневное напоминание</h2>' +
        toggle('reminderOn', 'Напоминать о подготовке', !!reminder[0]) +
        input(
          'reminderTime',
          'Время по часовому поясу телефона',
          'time',
          ('0' + reminder[1]).slice(-2) + ':' + ('0' + reminder[2]).slice(-2),
        ) +
        '<div class="actions">' +
        btn('savereminder', 'Сохранить напоминание', 'soft') +
        '</div><p class="meta">Android может отложить доставку в режиме энергосбережения.</p></div>'
      : '')
  );
}
function banksView() {
  const ids = Array.from(new Set([builtin].concat(S.custom).map((b) => b.id)));
  return (
    title('Материалы', 'Экзаменационные базы') +
    '<div class="list">' +
    ids
      .map((id) => {
        const b = E.getBank(S, builtin, id);
        return item(
          'switch:' + id,
          'folder',
          b.title,
          (id === B.id ? 'Выбрана · ' : '') + b.questions.length + ' вопросов · редакция ' + b.revision,
        );
      })
      .join('') +
    '</div>' +
    section('Активная база') +
    '<div class="card"><h2>' +
    esc(B.title) +
    '</h2><p>' +
    esc(B.source) +
    '</p><p>Вопросов ' +
    B.questions.length +
    ' · с исходным ключом ' +
    B.questions.filter((q) => q.sourceKeys.length).length +
    ' · для оценки ' +
    B.questions.filter((q) => q.keys.length).length +
    '.</p><div class="actions">' +
    btn('importbank', 'Импорт базы JSON', 'primary') +
    btn('exportbank', 'Экспорт активной базы') +
    btn('audit', 'Замечания к базе') +
    '</div></div>'
  );
}
function settingsView() {
  return (
    title('Приложение', 'Настройки') +
    '<div class="card"><h2>Оформление и обучение</h2>' +
    sel(
      'theme',
      'Тема',
      [
        ['system', 'Как на устройстве'],
        ['light', 'Светлая'],
        ['dark', 'Тёмная'],
      ],
      S.prefs.theme,
    ) +
    sel(
      'font',
      'Размер текста приложения',
      [85, 100, 115, 130, 150].map((n) => [n, n + '%']),
      S.prefs.text,
    ) +
    sel(
      'rate',
      'Скорость чтения',
      [0.75, 1, 1.25, 1.5].map((n) => [n, n + '×']),
      S.prefs.rate,
    ) +
    toggle('shuffle', 'Перемешивать варианты в обучении', S.prefs.shuffle) +
    toggle('random', 'Случайный порядок новой учебной подборки', S.prefs.random) +
    '</div>' +
    '<div class="card"><h2>Данные на устройстве</h2><p>Копия содержит все дисциплины, заметки, историю, настройки и незавершённые билеты. Сохраните её перед обновлением или сменой телефона.</p><div class="actions">' +
    btn('backup', 'Сохранить копию', 'primary') +
    btn('restore', 'Восстановить из файла') +
    btn('rollback', 'Копия перед заменой') +
    '</div></div><div class="card"><h2>Сброс статистики</h2><p>Очистит попытки, историю и текущие занятия по дисциплине «' +
    esc(B.title) +
    '». Личные заметки, избранное, план и подборки сохранятся.</p><div class="actions">' +
    btn('reset', 'Сбросить статистику', 'danger') +
    '</div></div>'
  );
}
function helpView() {
  return (
    title('Справка', 'Экзамен ПРО', 'Версия 1.0.0 · автономная подготовка') +
    '<div class="card"><h2>С чего начать</h2><p>В обучении выбирайте вариант и читайте разбор. В экзамене ответы можно менять до завершения, если разрешён возврат. Время ограниченного экзамена идёт и после закрытия приложения.</p><p>Для номеров внутри формулировок используйте цифру, напечатанную у варианта. Ссылки на источники открывает внешний браузер.</p></div><div class="card"><h2>Как работает повторение</h2><p>После ошибки вопрос возвращается через 10 минут. Верные ответы в разные назначенные дни увеличивают интервал до 1, 3, 7, 16, 35 и 70 дней. Для уровня «Освоен» нужны две успешные ступени, для «Уверенно освоен» — четыре. Повторный ответ раньше срока не повышает ступень.</p><p>Оценка карточки «Сложно» сокращает интервал, «Легко» увеличивает его. Умное занятие учитывает ошибки, последние экзамены, дату повторения, тему, отметки и время ответа.</p></div><div class="card"><h2>Автономность</h2><p>Вопросы, пояснения и результаты находятся на телефоне. Для чтения вслух нужен установленный русский голос, работающий без сети. Напоминания включаются в плане подготовки.</p></div>' +
    btn('banks', 'Открыть сведения о базе', 'soft')
  );
}

function newStudy(ids, mode, label, mix = S.prefs.shuffle, random = false) {
  if (!ids.length) {
    showToast('В этой подборке пока нет вопросов.');
    return;
  }
  stopClock();
  if (P.study && P.study.mode === 'learn' && mode !== 'learn') P.savedStudy = P.study;
  P.study = E.session(B, random ? E.shuffle(ids) : ids, mode, { mix, label });
  E.view(P, P.study.ids[0]);
  save();
  nav('study');
}
function currentQ() {
  const x = active();
  return x ? E.catalog(useBank(x))[x.ids[x.at]] : null;
}
function gotoQuestion(pos) {
  const x = active();
  if (!x || !Number.isInteger(pos) || pos < 0 || pos >= x.ids.length || (x.forward && pos < x.at))
    return;
  stopClock();
  if (native) Device.silence();
  x.at = pos;
  cardRevealed = false;
  if (route === 'study') E.view(P, x.ids[pos]);
  save();
  render();
  window.scrollTo(0, 0);
  $('main').focus();
  startClock();
}
function answer(choice) {
  const x = active(),
    q = currentQ();
  if (!x || !q || !q.keys.length || !q.options.some((o) => o.id === choice)) return;
  const k = q.id,
    exam = route === 'exam',
    multi = q.keys.length > 1;
  if (!exam && Object.prototype.hasOwnProperty.call(x.answers, k)) return;
  const map = exam ? x.answers : x.draft,
    prev = map[k] || [];
  const next = multi
    ? prev.includes(choice)
      ? prev.filter((i) => i !== choice)
      : prev.concat(choice)
    : [choice];
  if (exam || multi) {
    if (next.length) map[k] = next;
    else delete map[k];
    save();
    render();
    return;
  }
  lockAnswer(next);
}
function lockAnswer(ids) {
  const x = P.study,
    k = x.ids[x.at],
    q = currentQ();
  if (Object.prototype.hasOwnProperty.call(x.answers, k)) return;
  stopClock();
  x.answers[k] = ids;
  delete x.draft[k];
  E.record(P, k, !q.keys.length ? 'read' : E.equal(ids, q.keys) ? 'ok' : 'bad', x.times[k] || 0, x.mode);
  save();
  render();
  const f = document.querySelector('.feedback');
  if (f) f.scrollIntoView({ block: 'nearest' });
  startClock();
}
function startConfigured() {
  const qs = availableQuestions(),
    exam = setupType === 'exam';
  let size =
    $('size').value === 'all'
      ? qs.length
      : $('size').value === 'own'
        ? Number($('customsize').value)
        : Math.min(qs.length, Number($('size').value));
  const minutes = exam && $('timerOn').checked ? Number($('minutes').value) : 0,
    pass = exam ? Number($('pass').value) : 80;
  if (!qs.length) {
    showToast('В выбранных темах нет вопросов с таким ключом. Измените фильтр.');
    return;
  }
  if (!Number.isInteger(size) || size < 1 || size > qs.length) {
    showToast('Выберите от 1 до ' + qs.length + ' вопросов.');
    return;
  }
  if (exam && $('timerOn').checked && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) {
    showToast('Укажите целое время от 1 до 1440 минут.');
    return;
  }
  if (!Number.isInteger(pass) || pass < 1 || pass > 100) {
    showToast('Проходной балл должен быть от 1 до 100%.');
    return;
  }
  const ids = E.shuffle(qs.map((q) => q.id)).slice(0, size),
    mix = $('mix').checked;
  if (!exam) {
    newStudy(ids, 'train', 'Тренировочный тест', mix);
    return;
  }
  P.exam = E.session(B, ids, 'exam', { mix, minutes, pass, forward: $('forward').checked });
  save();
  nav('exam');
}
function examIds(ids, x, label, revision) {
  const b = revision ? E.getBank(S, builtin, B.id, revision) : B;
  P.exam = E.session(b, E.shuffle(ids), 'exam', {
    mix: true,
    minutes: x ? x.minutes : 0,
    pass: x ? x.pass : 80,
    forward: x ? x.forward : false,
    label: label || '',
  });
  save();
  nav('exam');
}
function endExam() {
  const x = P.exam;
  if (!x) return;
  stopClock();
  E.finish(P, x, useBank(x));
  resultIndex = 0;
  reviewCount = 30;
  fullReview = false;
  save();
  nav('result');
  trail = [];
}
function exportFile(name, data) {
  const raw = JSON.stringify(data);
  if (native) {
    Device.exportFile(name, raw);
    return;
  }
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function openFile(type) {
  if (native) {
    Device.openDocument(type);
    return;
  }
  const f = document.createElement('input');
  f.type = 'file';
  f.accept = '.json,application/json';
  f.onchange = () => {
    const file = f.files[0];
    if (!file) return;
    if (file.size > 24 * 1024 * 1024) {
      showToast('Файл превышает 24 МиБ.');
      return;
    }
    const r = new FileReader();
    r.onload = () => window.receiveDocument(type, r.result);
    r.onerror = () => showToast('Ошибка чтения');
    r.readAsText(file);
  };
  f.click();
}
window.receiveDocument = (type, raw) => {
  try {
    if (typeof raw !== 'string' || raw.length > 24 * 1024 * 1024) throw Error('Файл слишком велик.');
    const obj = JSON.parse(raw);
    let detail;
    if (type === 'bank') {
      const repeat = E.checkBank(obj),
        old = E.getBank(S, builtin, obj.id);
      if (old && obj.revision <= old.revision)
        throw Error('База с этой редакцией уже существует или установлена более новая редакция.');
      detail =
        esc(obj.title) +
        ' · вопросов ' +
        obj.questions.length +
        ' · повторяющихся формулировок ' +
        repeat +
        ' · редакция ' +
        obj.revision +
        '. ' +
        (old ? 'Сохранятся прежние экзамены и заметки.' : 'Будет добавлена отдельная дисциплина.');
    } else {
      if (type !== 'backup' || !obj || obj.format !== 'exampro.backup' || obj.schema !== 1)
        throw Error('Ожидается резервная копия exampro.backup формата 1.');
      E.checkState(obj.state, builtin);
      detail =
        'Будут восстановлены профили дисциплин (' +
        Object.keys(obj.state.profiles).length +
        '), настройки и история. Сохраним текущее состояние перед заменой.';
    }
    documentPending = { type, obj };
    modal(
      'import',
      'Подтвердите ' + (type === 'bank' ? 'импорт базы' : 'восстановление'),
      '<p>' + detail + '</p>',
      btn('cancel', 'Отмена') + btn('applyimport', 'Продолжить', 'primary'),
    );
  } catch (e) {
    documentPending = null;
    modal(
      'error',
      'Файл не принят',
      '<p>' + esc(e.message) + '</p>',
      btn('cancel', 'Закрыть', 'primary'),
    );
  }
};
function commitState(next, protect = true) {
  if (protect && !checkpoint()) throw Error('Не удалось сохранить состояние перед заменой.');
  const old = S,
    wasLocked = lockedSave;
  S = next;
  lockedSave = false;
  if (!save(true)) {
    S = old;
    lockedSave = wasLocked;
    throw Error('Недостаточно места для записи. Текущее состояние сохранено.');
  }
  profiles();
  $('notice').textContent = '';
  closeModal();
  trail = [];
  nav('home', true);
  expire();
}
function applyImport() {
  if (!documentPending) return;
  const { type, obj } = documentPending;
  try {
    if (type === 'bank') {
      const copy = JSON.parse(JSON.stringify(S));
      E.installBank(copy, builtin, obj);
      commitState(copy);
    } else {
      commitState(obj.state, !lockedSave);
      if (
        native &&
        typeof obj.reminder === 'string' &&
        /^[01],(?:[01]?\d|2[0-3]),(?:[0-5]?\d)$/.test(obj.reminder)
      ) {
        const parts = obj.reminder.split(',').map(Number);
        Device.remind(!!parts[0], parts[1], parts[2]);
      }
    }
    documentPending = null;
    showToast('Данные сохранены.');
  } catch (e) {
    modal('error', 'Изменения не применены', '<p>' + esc(e.message) + '</p>', btn('cancel', 'Закрыть'));
  }
}
function copyText(s) {
  if (native) Device.copy(s);
  else if (navigator.clipboard)
    navigator.clipboard.writeText(s).then(
      () => showToast('Скопировано'),
      () => showToast('Копирование недоступно.'),
    );
}
function setList(filter) {
  catalogFilter = filter;
  topicFilter = '';
  diffFilter = 'all';
  lvFilter = 'all';
  shown = 30;
  query = '';
  nav('catalog');
}
function setSetup(type, keep = false) {
  if (!keep) {
    chosen = [];
    scopeIds = null;
  }
  setupType = type;
  nav('setup');
}
function selectedSource(k) {
  if (route === 'result' && P.history[resultIndex]) return E.catalog(useBank(P.history[resultIndex]))[k];
  if (active()) return E.catalog(useBank(active()))[k];
  return M[k];
}
function greetAudit() {
  const flagged = B.questions.filter(
      (q) => q.caveat || q.keys.length === 0 || q.sourceKeys.length === 0,
    ),
    groups = new Map();
  for (const q of flagged) {
    const t = q.caveat || q.status || 'Требуется проверка';
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(q.no);
  }
  const compress = (ids) => {
    const out = [];
    let start = null,
      last = null;
    for (const n of ids.concat([null])) {
      if (start !== null && n !== last + 1) {
        out.push(start === last ? String(start) : start + '–' + last);
        start = null;
      }
      if (n !== null && start === null) start = n;
      last = n;
    }
    return out.join(', ');
  };
  modal(
    'audit',
    'Замечания к базе',
    '<p>' +
      esc(B.source) +
      '</p><p class="meta">Пояснения и замечания хранятся отдельно от исходных ответов.</p>' +
      Array.from(groups)
        .map(
          ([t, ids]) =>
            '<details><summary>№ ' + compress(ids) + '</summary><p>' + esc(t) + '</p></details>',
        )
        .join(''),
    btn('cancel', 'Закрыть', 'primary'),
  );
}
function act(a) {
  if (!S) return;
  const cut = a.indexOf(':'),
    action = cut < 0 ? a : a.slice(0, cut),
    v = cut < 0 ? '' : a.slice(cut + 1);
  if (action !== 'cancel' && expire()) return;
  const permitted = [
    'home',
    'back',
    'settings',
    'resumeexam',
    'answer',
    'prev',
    'next',
    'finish',
    'confirmfinish',
    'cancel',
    'flag',
    'backup',
    'saveplan',
    'savereminder',
    'theme',
    'print',
  ];
  if (P.exam && !permitted.includes(action)) {
    showToast('Сначала завершите текущий экзамен.');
    return;
  }
  if (action === 'back') return window.appBack();
  if (action === 'cancel') {
    documentPending = null;
    closeModal();
    return;
  }
  if (action === 'home') {
    trail = [];
    nav('home', true);
    return;
  }
  if (
    [
      'more',
      'topics',
      'errors',
      'decks',
      'stats',
      'history',
      'plan',
      'banks',
      'settings',
      'help',
    ].includes(action)
  ) {
    if (action === 'topics') {
      chosen = [];
      scopeIds = null;
    }
    nav(action);
    return;
  }
  if (action === 'catalog') {
    setList('all');
    return;
  }
  if (action.startsWith('list') && filters[action.slice(4)]) {
    setList(action.slice(4));
    return;
  }
  if (action === 'morelist') {
    shown += 40;
    fillCatalog();
    return;
  }
  if (action === 'openq') {
    newStudy([v], 'train', 'Вопрос № ' + M[v].no);
    return;
  }
  if (action === 'studyfiltered') {
    newStudy(
      selectedCatalog().map((q) => q.id),
      'train',
      filters[catalogFilter],
      S.prefs.shuffle,
      S.prefs.random,
    );
    return;
  }
  if (action === 'continue') {
    if (!P.study && P.savedStudy) {
      P.study = P.savedStudy;
      delete P.savedStudy;
    }
    if (P.study) nav('study');
    else
      newStudy(
        B.questions.map((q) => q.id),
        'learn',
        'Последовательное обучение',
        S.prefs.shuffle,
        S.prefs.random,
      );
    return;
  }
  if (action === 'smart') {
    const p = E.plan(B, P);
    newStudy(
      E.smart(B, P, Math.max(1, p.target - Math.min(p.done, p.target - 1))),
      'smart',
      'Умная подготовка',
      true,
    );
    return;
  }
  if (action === 'resumeexam') {
    nav('exam');
    return;
  }
  if (action === 'setupexam' || action === 'setuptrain') {
    setSetup(action === 'setupexam' ? 'exam' : 'train');
    return;
  }
  if (action === 'alltopics') {
    chosen = chosen.length ? [] : topicNames.slice();
    document
      .querySelectorAll('[data-topic]')
      .forEach((c) => (c.checked = chosen.includes(topicNames[+c.dataset.topic])));
    const b = document.querySelector('[data-action="alltopics"]');
    if (b) b.textContent = chosen.length ? 'Сбросить выбор' : 'Выбрать все';
    updateAvailable();
    return;
  }
  if (['topicslearn', 'topicstrain', 'topicsexam', 'topicscards'].includes(action)) {
    scopeIds = null;
    if (action === 'topicstrain' || action === 'topicsexam')
      setSetup(action === 'topicsexam' ? 'exam' : 'train', true);
    else
      newStudy(
        topicQs().map((q) => q.id),
        action === 'topicscards' ? 'cards' : 'train',
        chosen.length === 1 ? chosen[0] : 'Выбранные темы',
        S.prefs.shuffle,
        S.prefs.random,
      );
    return;
  }
  if (action === 'starttest') {
    startConfigured();
    return;
  }
  if (action === 'prev' || action === 'next') {
    gotoQuestion(active().at + (action === 'next' ? 1 : -1));
    return;
  }
  if (action === 'answer') {
    answer(v);
    return;
  }
  if (action === 'read') {
    lockAnswer([]);
    return;
  }
  if (action === 'checkmulti') {
    const x = P.study;
    lockAnswer(x.draft[x.ids[x.at]] || []);
    return;
  }
  if (action === 'reveal') {
    cardRevealed = true;
    render();
    return;
  }
  if (action === 'grade') {
    const x = P.study,
      k = x.ids[x.at];
    if (!cardRevealed || x.ratings[k]) return;
    stopClock();
    x.ratings[k] = v;
    E.record(
      P,
      k,
      v === 'read' ? 'read' : v === 'again' ? 'bad' : 'ok',
      x.times[k] || 0,
      'cards',
      Date.now(),
      v,
    );
    save();
    if (x.at < x.ids.length - 1) gotoQuestion(x.at + 1);
    else {
      render();
      startClock();
      showToast('Последняя карточка пройдена.');
    }
    return;
  }
  if (action === 'flag') {
    const x = P.exam,
      k = x.ids[x.at];
    x.marked = x.marked.includes(k) ? x.marked.filter((i) => i !== k) : x.marked.concat(k);
    save();
    render();
    return;
  }
  if (action === 'finish') {
    const x = active();
    if (!x) return;
    const ex = route === 'exam',
      done = ex
        ? Object.keys(x.answers).filter((k) => x.answers[k].length).length
        : x.mode === 'cards'
          ? Object.keys(x.ratings).length
          : Object.keys(x.answers).length;
    modal(
      'finish',
      ex ? 'Завершить экзамен?' : 'Завершить подборку?',
      '<p>Пройдено ' +
        done +
        ' из ' +
        x.ids.length +
        '. ' +
        (ex
          ? 'Оставшиеся без ответа вопросы дадут 0 баллов.'
          : 'Результаты пройденных вопросов уже сохранены.') +
        '</p>',
      btn('cancel', 'Продолжить занятие') + btn('confirmfinish', 'Завершить', 'primary'),
    );
    return;
  }
  if (action === 'confirmfinish') {
    if (route === 'exam') endExam();
    else {
      stopClock();
      P.study = P.savedStudy || null;
      delete P.savedStudy;
      save();
      nav('home');
    }
    return;
  }
  if (action.startsWith('mark')) {
    const field = { markstar: 'stars', markhard: 'hard', markbookmark: 'bookmarks' }[action];
    if (!field) return;
    const wasOpen = document.querySelector('.question details[open]') !== null;
    P[field] = P[field].includes(v) ? P[field].filter((k) => k !== v) : P[field].concat(v);
    save();
    render();
    if (wasOpen) {
      const el = Array.from(document.querySelectorAll('.question summary')).find(
        (el) => el.textContent === 'Мои отметки и история',
      );
      if (el) el.parentElement.open = true;
    }
    showToast('Отметка сохранена');
    return;
  }
  if (action === 'note') {
    modal(
      'note',
      'Заметка к № ' + M[v].no,
      field(
        'noteText',
        'Текст заметки',
        '<textarea id="noteText" maxlength="8000">' + esc(P.notes[v] || '') + '</textarea>',
      ),
      btn('cancel', 'Отмена') + btn('savenote:' + v, 'Сохранить', 'primary'),
    );
    return;
  }
  if (action === 'savenote') {
    const t = $('noteText').value.trim();
    if (t) P.notes[v] = t;
    else delete P.notes[v];
    save();
    closeModal();
    showToast('Заметка сохранена');
    render();
    return;
  }
  if (action === 'copy' || action === 'speak') {
    const q = selectedSource(v),
      text =
        'Вопрос ' +
        q.no +
        '. ' +
        q.text +
        '\n' +
        q.options.map((o, i) => i + 1 + '. ' + o.text).join('\n');
    if (action === 'copy') copyText(text);
    else if (native) Device.speak(text, S.prefs.rate);
    else showToast('Озвучивание доступно в Android-приложении.');
    return;
  }
  if (action === 'silence') {
    if (native) Device.silence();
    return;
  }
  if (action === 'src' || action === 'extra') {
    const url = selectedSource(v)[action === 'src' ? 'url' : 'extra'];
    if (url) {
      if (native) Device.source(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  if (action === 'errorpractice' || action === 'errorexam') {
    const ids = B.questions.filter((q) => E.stat(P, q.id).active && q.keys.length).map((q) => q.id);
    if (action === 'errorpractice') newStudy(ids, 'errors', 'Активные ошибки', true);
    else if (ids.length) examIds(ids, null, 'Тест по ошибкам');
    else showToast('Активных ошибок пока нет.');
    return;
  }
  if (['cardsall', 'cardshard', 'cardsstars', 'cardsdue', 'deck'].includes(action)) {
    let ids =
      action === 'deck'
        ? P.decks[+v].ids.filter((k) => M[k])
        : B.questions
            .filter(
              (q) =>
                action === 'cardsall' ||
                (action === 'cardshard' && P.hard.includes(q.id)) ||
                (action === 'cardsstars' && P.stars.includes(q.id)) ||
                (action === 'cardsdue' && E.status(E.stat(P, q.id)) === 2),
            )
            .map((q) => q.id);
    newStudy(ids, 'cards', action === 'deck' ? P.decks[+v].name : 'Карточки', false, S.prefs.random);
    return;
  }
  if (action === 'newdeck') {
    modal(
      'newdeck',
      'Новая подборка',
      input('deckName', 'Название', 'text', '', 'maxlength="120"') +
        input('deckNums', 'Номера через запятую или диапазон', 'text', '', 'placeholder="1, 3, 5–12"') +
        sel(
          'deckTopic',
          'Или все вопросы темы',
          [['', 'Не добавлять тему']].concat(topicNames.map((t) => [t, t])),
          '',
        ),
      btn('cancel', 'Отмена') + btn('savedeck', 'Создать', 'primary'),
    );
    return;
  }
  if (action === 'savedeck') {
    const name = $('deckName').value.trim(),
      nums = $('deckNums').value.trim(),
      t = $('deckTopic').value;
    const ids = new Set(B.questions.filter((q) => q.topic === t).map((q) => q.id));
    if (nums) {
      for (const part of nums.split(',')) {
        const m = part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
        if (!m) {
          showToast('Проверьте список номеров.');
          return;
        }
        const lo = +m[1],
          hi = m[2] ? +m[2] : lo,
          match = B.questions.filter((q) => q.no >= lo && q.no <= hi);
        if (hi < lo || match.length !== hi - lo + 1) {
          showToast('В диапазоне есть отсутствующие номера.');
          return;
        }
        for (const q of match) ids.add(q.id);
      }
    }
    if (!name || !ids.size || P.decks.length >= 200) {
      showToast('Введите название и выберите вопросы. Лимит — 200 подборок.');
      return;
    }
    P.decks.push({ name, ids: Array.from(ids) });
    save();
    closeModal();
    render();
    return;
  }
  if (action === 'result') {
    resultIndex = +v;
    fullReview = false;
    reviewCount = 30;
    nav('result');
    return;
  }
  if (action === 'reviewall' || action === 'reviewbad' || action === 'morereview') {
    if (action === 'morereview') reviewCount += 50;
    else {
      fullReview = action === 'reviewall';
      reviewCount = 30;
    }
    render();
    return;
  }
  if (action === 'retest' || action === 'retrywrong') {
    const x = P.history[resultIndex],
      b = useBank(x),
      m = E.catalog(b);
    const ids =
      action === 'retest' ? x.ids : x.ids.filter((k) => !E.equal(x.answers[k] || [], m[k].keys));
    if (ids.length)
      examIds(ids, x, action === 'retest' ? 'Повтор экзамена' : 'Тест по ошибкам', x.revision);
    return;
  }
  if (['print', 'shareresult', 'exportresult'].includes(action)) {
    const x = P.history[resultIndex];
    if (!x) return;
    const b = useBank(x),
      m = E.catalog(b),
      r = E.totals(x, b);
    const rows = x.ids.map((id) => {
      const q = m[id];
      return {
        number: q.no,
        text: q.text,
        options: q.options,
        response: x.answers[id] || [],
        keys: q.keys,
        chosenText: texts(q, x.answers[id] || []),
        expectedText: texts(q, q.keys),
      };
    });
    if (action === 'exportresult')
      exportFile('exam-result.json', {
        format: 'exampro.result',
        schema: 1,
        discipline: b.title,
        revision: b.revision,
        finished: x.ended,
        elapsedMs: x.ended - x.started,
        threshold: x.pass,
        result: r,
        questions: rows,
      });
    else if (action === 'print') {
      $('printdata').innerHTML =
        '<h2>Полный разбор</h2>' +
        rows
          .map(
            (q) =>
              '<article class="card"><h3>№ ' +
              q.number +
              ' · ' +
              esc(q.text) +
              '</h3><p>Ваш ответ — ' +
              esc(q.chosenText) +
              '</p><p>По ключу — ' +
              esc(q.expectedText) +
              '</p></article>',
          )
          .join('');
      if (native) Device.printReport();
      else window.print();
    } else {
      const s =
        b.title +
        ' · ' +
        fmtDate(x.ended) +
        '\nРезультат ' +
        r.pct +
        '% (' +
        r.right +
        '/' +
        r.total +
        '). Ошибок ' +
        r.wrong +
        ', пропущено ' +
        r.skip +
        '. Проходной балл ' +
        x.pass +
        '%.';
      if (native) Device.share(s);
      else copyText(s);
    }
    return;
  }
  if (action === 'exportstats') {
    exportFile('exam-statistics.json', {
      format: 'exampro.stats',
      schema: 1,
      discipline: B.title,
      revision: B.revision,
      summary: summaryData(),
      topics: E.weakMap(B, P),
      questions: P.stats,
      events: P.events,
    });
    return;
  }
  if (action === 'saveplan') {
    const date = $('examDate').value,
      min = +$('studyMinutes').value;
    if ((date && !E.validDate(date)) || !Number.isInteger(min) || min < 1 || min > 480) {
      showToast('Укажите корректную дату и от 1 до 480 минут.');
      return;
    }
    P.plan = { date, minutes: min };
    save();
    render();
    showToast('План пересчитан');
    return;
  }
  if (action === 'savereminder') {
    const t = $('reminderTime').value;
    if (!/^\d\d:\d\d$/.test(t)) {
      showToast('Укажите время');
      return;
    }
    Device.remind($('reminderOn').checked, +t.slice(0, 2), +t.slice(3));
    return;
  }
  if (action === 'switch') {
    if (!P.exam) {
      S.active = v;
      profiles();
      save();
      chosen = [];
      scopeIds = null;
      nav('home');
    }
    return;
  }
  if (action === 'audit') {
    greetAudit();
    return;
  }
  if (action === 'exportbank') {
    exportFile('bank-' + B.id + '-r' + B.revision + '.json', B);
    return;
  }
  if (action === 'importbank' || action === 'restore') {
    openFile(action === 'restore' ? 'backup' : 'bank');
    return;
  }
  if (action === 'backup') {
    stopClock();
    exportFile('exampro-backup-' + E.day(Date.now()) + '.json', {
      format: 'exampro.backup',
      schema: 1,
      created: Date.now(),
      reminder: native ? Device.reminder() : null,
      state: S,
    });
    startClock();
    return;
  }
  if (action === 'rollback') {
    const raw = native ? Device.restorePoint() : localStorage.getItem('exampro.before');
    if (!raw) {
      showToast('Сохранённой точки восстановления пока нет.');
      return;
    }
    try {
      window.receiveDocument(
        'backup',
        JSON.stringify({ format: 'exampro.backup', schema: 1, state: JSON.parse(raw) }),
      );
    } catch (e) {
      showToast('Копия повреждена.');
    }
    return;
  }
  if (action === 'applyimport') {
    applyImport();
    return;
  }
  if (action === 'reset') {
    modal(
      'reset',
      'Очистить статистику?',
      '<p>Будет удалена история попыток и экзаменов по дисциплине «' +
        esc(B.title) +
        '». Сохраним точку восстановления перед сбросом.</p>',
      btn('cancel', 'Отмена') + btn('doreset', 'Очистить', 'danger'),
    );
    return;
  }
  if (action === 'doreset') {
    const next = JSON.parse(JSON.stringify(S)),
      old = next.profiles[B.id];
    next.profiles[B.id] = Object.assign(E.newProfile(), {
      notes: old.notes,
      stars: old.stars,
      hard: old.hard,
      bookmarks: old.bookmarks,
      plan: old.plan,
      decks: old.decks,
    });
    commitState(next);
    showToast('Статистика очищена');
  }
}
window.reminderChanged = () => {
  if (route === 'plan') render();
  showToast('Настройки напоминания сохранены');
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled || (modalKind && !el.closest('#modal'))) return;
  try {
    act(el.dataset.action);
  } catch (err) {
    showToast(err.message || 'Не удалось выполнить действие.');
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.topic !== undefined) {
    chosen = Array.from(document.querySelectorAll('[data-topic]:checked')).map(
      (x) => topicNames[+x.dataset.topic],
    );
    updateAvailable();
    return;
  }
  switch (el.id) {
    case 'theme':
    case 'font':
    case 'rate':
    case 'shuffle':
    case 'random':
      S.prefs[{ font: 'text' }[el.id] || el.id] = ['shuffle', 'random'].includes(el.id)
        ? el.checked
        : ['font', 'rate'].includes(el.id)
          ? +el.value
          : el.value;
      applyTheme();
      save();
      break;
    case 'difficulty':
      diffFilter = el.value;
      shown = 30;
      fillCatalog();
      break;
    case 'mastery':
      lvFilter = el.value;
      shown = 30;
      fillCatalog();
      break;
    case 'catfilter':
      catalogFilter = el.value;
      shown = 30;
      render();
      break;
    case 'filtertopic':
      topicFilter = el.value;
      shown = 30;
      fillCatalog();
      break;
    case 'verifiedOnly':
      updateAvailable();
      break;
    case 'size':
      $('ownwrap').hidden = el.value !== 'own';
      break;
    case 'timerOn':
      $('minwrap').hidden = !el.checked;
      break;
    case 'jump':
      gotoQuestion(+el.value);
      break;
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'query') {
    query = e.target.value;
    shown = 30;
    fillCatalog();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalKind) {
    e.preventDefault();
    closeModal();
  }
  if (e.key === 'Tab' && modalKind) {
    const a = Array.from($('modal').querySelectorAll('button,input,textarea,select,summary'));
    if (!a.length) return;
    if (e.shiftKey && a[0] === document.activeElement) {
      a[a.length - 1].focus();
      e.preventDefault();
    } else if (!e.shiftKey && a[a.length - 1] === document.activeElement) {
      a[0].focus();
      e.preventDefault();
    }
  }
});
async function boot() {
  try {
    const res = await fetch('builtin.json');
    if (!res.ok) throw Error('Встроенная база недоступна.');
    builtin = await res.json();
    E.checkBank(builtin);
    S = E.initial(builtin);
    let raw = '';
    try {
      raw = native ? Device.loadState() : localStorage.getItem('exampro.v1');
      if (raw) S = E.checkState(JSON.parse(raw), builtin);
    } catch (e) {
      lockedSave = true;
      recovery =
        'Сохранение повреждено или его версия новее. Исходные данные защищены от записи. Откройте настройки и восстановите резервную копию.';
    }
    profiles();
    $('notice').textContent = recovery;
    render();
    if (native) Device.ready();
    expire();
    setInterval(tick, 650);
    setInterval(() => {
      if (active() && timeStarted) {
        stopClock();
        save();
        startClock();
      }
    }, 10000);
    const mq = window.matchMedia('(prefers-color-scheme:dark)');
    if (mq.addListener) mq.addListener(window.systemChanged);
  } catch (e) {
    $('main').innerHTML =
      '<div class="card"><h1>Не удалось открыть приложение</h1><p>' + esc(e.message) + '</p></div>';
  }
}
boot();

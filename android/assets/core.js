'use strict';
const Engine = (() => {
  const DAY = 86400000;
  const statuses = ['Не изучен', 'Изучается', 'Требует повторения', 'Освоен', 'Уверенно освоен'];
  const plain = (x) => !!x && Object.getPrototypeOf(x) === Object.prototype;
  const own = (x, k) => Object.prototype.hasOwnProperty.call(x, k);
  const integer = (x, a, b) => Number.isSafeInteger(x) && x >= a && x <= b;
  const str = (s, limit) => typeof s === 'string' && s.length <= limit;
  const id = (s) => str(s, 64) && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(s) && !(s in Object.prototype);
  const unique = (a) => new Set(a).size === a.length;
  const list = (a, n) => Array.isArray(a) && a.length <= n;
  const guard = (ok, msg) => {
    if (!ok) throw new Error(msg);
  };
  function checkBank(b) {
    guard(
      plain(b) && b.format === 'exampro.bank' && b.schema === 1,
      'Ожидается база exampro.bank формата 1.',
    );
    guard(
      id(b.id) &&
        integer(b.revision, 1, 1000000) &&
        str(b.title, 180) &&
        b.title.trim() &&
        str(b.source, 1000),
      'Проверьте идентификатор, название, версию и источник базы.',
    );
    guard(
      list(b.questions, 3000) && b.questions.length > 0,
      'База должна содержать от 1 до 3000 вопросов.',
    );
    const ids = new Set(),
      nums = new Set(),
      texts = new Set();
    let repeats = 0;
    for (const q of b.questions) {
      guard(
        plain(q) && id(q.id) && integer(q.no, 1, 1000000) && !ids.has(q.id) && !nums.has(q.no),
        'Номера и идентификаторы вопросов должны быть уникальны.',
      );
      ids.add(q.id);
      nums.add(q.no);
      guard(
        str(q.text, 20000) && q.text.trim() && str(q.topic, 180) && q.topic.trim(),
        'Пустой или слишком длинный текст в № ' + q.no + '.',
      );
      const same = q.text.trim().toLowerCase().replace(/\s+/g, ' ');
      if (texts.has(same)) repeats++;
      texts.add(same);
      guard(
        list(q.options, 16) &&
          q.options.length >= 2 &&
          q.options.every((o) => plain(o) && id(o.id) && str(o.text, 14000) && o.text.trim()) &&
          unique(q.options.map((o) => o.id)),
        'Проверьте варианты № ' + q.no + '.',
      );
      const validKey = (k) =>
        list(k, 16) && unique(k) && k.every((v) => q.options.some((o) => o.id === v));
      guard(
        validKey(q.keys) && validKey(q.sourceKeys),
        'Ключ ссылается на отсутствующий вариант в № ' + q.no + '.',
      );
      for (const name of [
        'explanation',
        'sourceNote',
        'reference',
        'status',
        'caveat',
        'url',
        'extra',
        'reviewed',
      ]) {
        guard(q[name] === undefined || str(q[name], 10000), 'Неверное пояснение в № ' + q.no + '.');
      }
      for (const name of ['url', 'extra'])
        if (q[name])
          guard(
            /^https:\/\/[^\s]+$/i.test(q[name]) && q[name].length <= 1600,
            'Источник должен использовать HTTPS.',
          );
      guard(q.page === undefined || integer(q.page, 1, 100000), 'Некорректный номер страницы.');
      guard(!q.reviewed || validDate(q.reviewed), 'Некорректная дата сверки.');
    }
    return repeats;
  }
  function validDate(d) {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const x = new Date(d + 'T12:00:00');
    return !isNaN(+x) && day(x) === d;
  }
  const pad = (n) => ('0' + n).slice(-2);
  function day(t) {
    const d = new Date(t);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function addDays(t, days) {
    const d = new Date(t);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return +d;
  }
  function newProfile() {
    return {
      timeStudyMs: 0,
      stats: {},
      notes: {},
      stars: [],
      hard: [],
      bookmarks: [],
      recent: [],
      history: [],
      study: null,
      exam: null,
      events: [],
      decks: [],
      plan: { date: '', minutes: 15 },
    };
  }
  function initial(builtin) {
    return {
      schema: 1,
      active: builtin.id,
      custom: [],
      profiles: { [builtin.id]: newProfile() },
      prefs: { theme: 'system', text: 100, rate: 1, shuffle: false, random: false },
    };
  }
  function banks(s, builtin) {
    return [builtin].concat(s.custom);
  }
  function getBank(s, builtin, key, rev) {
    const versions = banks(s, builtin).filter((b) => b.id === key && (!rev || b.revision === rev));
    return versions.reduce((a, b) => (!a || b.revision > a.revision ? b : a), null);
  }
  function catalog(b) {
    return Object.fromEntries
      ? Object.fromEntries(b.questions.map((q) => [q.id, q]))
      : b.questions.reduce((m, q) => ((m[q.id] = q), m), {});
  }
  function shuffle(list, rng = Math.random) {
    const x = list.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  }
  function optionOrder(q, random) {
    if (!random) return q.options.map((o) => o.id);
    const out = [];
    let segment = [];
    for (const o of q.options) {
      if (
        /вышеперечислен|вышеуказан|вышеизложен|вышеназван|указанн.{0,12}выше|перечисленн.{0,10}выше|предыдущ.{0,14}(ответ|вариант)|ответ.{0,12}(выше|ниже)/i.test(
          o.text,
        )
      ) {
        out.push(...shuffle(segment), o.id);
        segment = [];
      } else segment.push(o.id);
    }
    return out.concat(shuffle(segment));
  }
  function session(b, ids, mode, opts = {}, now = Date.now()) {
    const m = catalog(b),
      order = {},
      answers = {},
      draft = {},
      times = {};
    ids = ids.filter((q) => m[q] && (mode !== 'exam' || m[q].keys.length));
    guard(ids.length && unique(ids), 'Для этой подборки нет подходящих вопросов.');
    for (const k of ids) order[k] = optionOrder(m[k], Boolean(opts.mix));
    const minutes = opts.minutes || 0;
    return {
      revision: b.revision,
      mode,
      ids: ids.slice(),
      order,
      answers,
      draft,
      times,
      at: 0,
      started: now,
      deadline: minutes ? now + minutes * 60000 : 0,
      minutes,
      pass: opts.pass === undefined ? 80 : opts.pass,
      forward: !!opts.forward,
      marked: [],
      ended: 0,
      label: opts.label || '',
      ratings: {},
    };
  }
  const equal = (a, b) => a.length === b.length && b.every((x) => a.indexOf(x) !== -1);
  const blankStat = () => ({
    ok: 0,
    bad: 0,
    skip: 0,
    views: 0,
    level: 0,
    due: 0,
    last: 0,
    credit: '',
    recover: 0,
    active: false,
    ms: 0,
  });
  const stat = (p, k) => p.stats[k] || blankStat();
  function view(p, k) {
    const s = p.stats[k] || (p.stats[k] = blankStat());
    s.views++;
    p.recent = [k].concat(p.recent.filter((i) => i !== k)).slice(0, 300);
  }
  function record(p, k, result, ms, mode, now = Date.now(), grade = '') {
    const s = p.stats[k] || (p.stats[k] = blankStat());
    ms = Math.max(0, Math.min(Math.round(ms) || 0, 86400000));
    p.events.push({ id: k, t: now, r: result, ms, mode, grade });
    s.ms += ms;
    s.last = now;
    if (result === 'read') return;
    if (result === 'skip' || result === 'bad') {
      s[result]++;
      s.level = 0;
      s.recover = 0;
      s.active = true;
      s.credit = '';
      s.due = now + 600000;
      return;
    }
    s.ok++;
    const today = day(now);
    if (s.credit !== today && (s.level === 0 || now >= s.due)) {
      s.level = Math.min(6, s.level + 1);
      s.credit = today;
      if (s.active && ++s.recover >= 2) s.active = false;
      const gaps = [0, 1, 3, 7, 16, 35, 70];
      s.due = addDays(
        now,
        Math.max(1, Math.round(gaps[s.level] * (grade === 'easy' ? 1.4 : grade === 'hard' ? 0.6 : 1))),
      );
    }
    if (grade === 'hard') s.due = Math.min(s.due, addDays(now, 1));
  }
  function status(s, now = Date.now()) {
    if (!s.ok && !s.bad && !s.skip) return 0;
    if (s.active || s.due <= now) return 2;
    return s.level >= 4 ? 4 : s.level >= 2 ? 3 : 1;
  }
  function totals(x, b) {
    let right = 0,
      wrong = 0,
      skip = 0;
    const m = catalog(b);
    for (const k of x.ids) {
      const a = x.answers[k];
      if (!a || !a.length) skip++;
      else if (equal(a, m[k].keys)) right++;
      else wrong++;
    }
    const total = x.ids.length;
    return {
      right,
      wrong,
      skip,
      total,
      pct: Math.floor((1000 * right) / total) / 10,
      passed: 100 * right >= x.pass * total,
    };
  }
  function finish(p, x, b, now = Date.now()) {
    if (x.ended) return x;
    x.ended = Math.max(x.started, Math.min(now, x.deadline || now));
    const m = catalog(b);
    for (const k of x.ids) {
      const a = x.answers[k] || [];
      record(
        p,
        k,
        !a.length ? 'skip' : equal(a, m[k].keys) ? 'ok' : 'bad',
        x.times[k] || 0,
        'exam',
        x.ended,
      );
    }
    p.history.unshift(x);
    p.exam = null;
    return x;
  }
  function weakMap(b, p) {
    const sums = Object.create(null);
    for (const q of b.questions) {
      const s = stat(p, q.id),
        key = q.topic;
      const v = sums[key] || (sums[key] = { ok: 0, bad: 0, skip: 0, total: 0, learned: 0 });
      v.ok += s.ok;
      v.bad += s.bad;
      v.skip += s.skip;
      v.total++;
      if (s.level >= 2 && !s.active) v.learned++;
    }
    return sums;
  }
  function smart(b, p, n, now = Date.now()) {
    const topics = weakMap(b, p),
      recent = p.history.slice(0, 3),
      miss = {};
    for (const x of recent)
      for (const k of x.ids) {
        const event = p.events.find((e) => e.id === k && e.mode === 'exam' && e.t === x.ended);
        if (event && event.r !== 'ok') miss[k] = (miss[k] || 0) + 1;
      }
    return b.questions
      .filter((q) => q.keys.length)
      .map((q) => {
        const s = stat(p, q.id),
          t = topics[q.topic],
          all = s.ok + s.bad + s.skip,
          seenBefore = all > 0;
        const score =
          (s.active ? 12 : 0) +
          (seenBefore ? (s.due <= now ? 7 + Math.min(6, (now - s.due) / DAY) : -12) : 5) +
          (6 * (s.bad + s.skip)) / Math.max(1, all) +
          (3 * (t.bad + t.skip)) / Math.max(1, t.ok + t.bad + t.skip) +
          Math.min(3, s.ms / Math.max(1, all) / 45000) +
          (p.hard.includes(q.id) ? 5 : 0) +
          (miss[q.id] || 0) * 2 -
          s.level +
          Math.random();
        return { id: q.id, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((x) => x.id);
  }
  function plan(b, p, now = Date.now()) {
    const qs = b.questions.filter((q) => q.keys.length),
      dayKey = day(now),
      done = new Set(
        p.events.filter((e) => day(e.t) === dayKey && e.r !== 'read' && e.r !== 'skip').map((e) => e.id),
      ).size;
    const days = p.plan.date
      ? Math.max(
          1,
          Math.round(
            (Date.parse(p.plan.date + 'T12:00:00Z') - Date.parse(dayKey + 'T12:00:00Z')) / DAY,
          ) + 1,
        )
      : 0;
    const remaining = qs.filter((q) => stat(p, q.id).level < 2 || stat(p, q.id).active).length;
    const due = qs.filter((q) => {
      const s = stat(p, q.id);
      return s.ok + s.bad + s.skip > 0 && (s.active || s.due <= now);
    }).length;
    const hard = qs.filter((q) => p.hard.includes(q.id) && stat(p, q.id).level < 2).length;
    const workload = remaining + Math.ceil((due + hard) / 2);
    const times = p.events.filter((e) => e.ms > 0 && e.r !== 'skip').slice(-100);
    const avg = times.length
      ? Math.min(180000, Math.max(20000, times.reduce((z, e) => z + e.ms, 0) / times.length))
      : 60000;
    const capacity = Math.max(1, Math.floor((p.plan.minutes * 60000) / avg));
    const needed = days ? Math.ceil(workload / days) : capacity;
    const target = Math.min(qs.length, Math.max(1, Math.min(capacity, needed || due || 1)));
    return { days, remaining, due, hard, target, needed, capacity, done };
  }
  function signature(q) {
    return JSON.stringify([q.text, q.options.map((o) => [o.id, o.text]), q.keys.slice().sort()]);
  }
  function installBank(s, builtin, b) {
    const repeat = checkBank(b),
      old = getBank(s, builtin, b.id);
    guard(!old || b.revision > old.revision, 'Эта версия уже установлена или старше установленной.');
    guard(s.custom.length < 100, 'Сохранено предельное количество редакций баз.');
    if (old) {
      const p = s.profiles[b.id];
      guard(!p.exam, 'Сначала завершите экзамен по обновляемой базе.');
      const map = catalog(old);
      for (const q of b.questions) {
        const v = p.stats[q.id];
        if (v && map[q.id] && signature(map[q.id]) !== signature(q)) {
          v.level = 0;
          v.credit = '';
          v.recover = 0;
          v.due = 1;
          v.active = true;
        }
      }
      p.study = null;
    } else s.profiles[b.id] = newProfile();
    s.custom.push(b);
    s.active = b.id;
    return repeat;
  }
  function checkState(s, builtin) {
    guard(
      plain(s) &&
        s.schema === 1 &&
        id(s.active) &&
        list(s.custom, 100) &&
        plain(s.profiles) &&
        plain(s.prefs),
      'Формат сохранения не поддерживается.',
    );
    const all = [builtin].concat(s.custom),
      known = {};
    for (const b of all) {
      checkBank(b);
      const token = b.id + '@' + b.revision;
      guard(!known[token], 'Повтор редакции базы.');
      known[token] = b;
    }
    const courses = new Set(all.map((b) => b.id));
    guard(
      courses.has(s.active) && Object.keys(s.profiles).length === courses.size,
      'Неверный список дисциплин.',
    );
    const pref = s.prefs;
    guard(
      ['light', 'dark', 'system'].includes(pref.theme) &&
        [85, 100, 115, 130, 150].includes(pref.text) &&
        [0.75, 1, 1.25, 1.5].includes(pref.rate) &&
        typeof pref.shuffle === 'boolean' &&
        typeof pref.random === 'boolean',
      'Неверные настройки.',
    );
    for (const course of courses) {
      const p = s.profiles[course],
        revisions = all.filter((b) => b.id === course),
        universe = new Set();
      for (const b of revisions) for (const q of b.questions) universe.add(q.id);
      const knownId = (k) => id(k) && universe.has(k),
        idsOk = (a) => list(a, universe.size) && unique(a) && a.every(knownId);
      guard(
        plain(p) &&
          plain(p.stats) &&
          plain(p.notes) &&
          plain(p.plan) &&
          idsOk(p.stars) &&
          idsOk(p.hard) &&
          idsOk(p.bookmarks) &&
          idsOk(p.recent),
        'Повреждён профиль дисциплины.',
      );
      guard(
        p.timeStudyMs === undefined || integer(p.timeStudyMs, 0, Number.MAX_SAFE_INTEGER),
        'Неверное суммарное время.',
      );
      guard(
        (p.plan.date === '' || validDate(p.plan.date)) && integer(p.plan.minutes, 1, 480),
        'Проверьте план.',
      );
      for (const k of Object.keys(p.notes))
        guard(knownId(k) && str(p.notes[k], 8000), 'Повреждена заметка.');
      for (const k of Object.keys(p.stats)) {
        const v = p.stats[k];
        guard(
          knownId(k) &&
            plain(v) &&
            ['ok', 'bad', 'skip', 'views', 'due', 'last', 'ms', 'recover'].every((n) =>
              integer(v[n], 0, Number.MAX_SAFE_INTEGER),
            ) &&
            integer(v.level, 0, 6) &&
            typeof v.active === 'boolean' &&
            (v.credit === '' || validDate(v.credit)),
          'Повреждена статистика.',
        );
      }
      guard(
        Array.isArray(p.events) &&
          p.events.every(
            (e) =>
              plain(e) &&
              knownId(e.id) &&
              ['ok', 'bad', 'skip', 'read'].includes(e.r) &&
              integer(e.t, 0, 8640000000000000) &&
              integer(e.ms, 0, 86400000) &&
              ['learn', 'smart', 'train', 'exam', 'cards', 'errors'].includes(e.mode) &&
              str(e.grade, 12),
          ),
        'Повреждён журнал ответов.',
      );
      guard(
        list(p.decks, 200) &&
          p.decks.every((d) => plain(d) && str(d.name, 120) && d.name.trim() && idsOk(d.ids)),
        'Повреждена подборка карточек.',
      );
      guard(Array.isArray(p.history), 'Повреждена история.');
      const validateSession = (x, finished, exam) => {
        const b = known[course + '@' + x.revision];
        guard(
          b &&
            plain(x) &&
            ['learn', 'smart', 'train', 'exam', 'cards', 'errors'].includes(x.mode) &&
            exam === (x.mode === 'exam'),
          'Редакция билета или тип сессии не найдены.',
        );
        const qs = catalog(b);
        guard(
          list(x.ids, b.questions.length) &&
            x.ids.length > 0 &&
            unique(x.ids) &&
            x.ids.every((k) => id(k) && own(qs, k) && (!exam || qs[k].keys.length)) &&
            integer(x.at, 0, x.ids.length - 1),
          'Неверный список вопросов сессии.',
        );
        guard(
          ['order', 'answers', 'draft', 'times', 'ratings'].every(
            (z) => plain(x[z]) && Object.keys(x[z]).every((k) => x.ids.includes(k)),
          ),
          'Повреждено состояние сессии.',
        );
        guard(
          integer(x.started, 1, 8640000000000000) &&
            integer(x.ended, 0, 8640000000000000) &&
            !!x.ended === finished &&
            (!finished || x.ended >= x.started) &&
            integer(x.minutes, 0, 1440) &&
            integer(x.deadline, 0, 8640000000000000) &&
            x.deadline === (x.minutes ? x.started + x.minutes * 60000 : 0) &&
            integer(x.pass, 1, 100) &&
            typeof x.forward === 'boolean' &&
            str(x.label, 250) &&
            list(x.marked, x.ids.length) &&
            unique(x.marked) &&
            x.marked.every((k) => x.ids.includes(k)),
          'Неверные параметры сессии.',
        );
        for (const k of x.ids) {
          const listIds = qs[k].options.map((o) => o.id),
            ord = x.order[k];
          guard(Array.isArray(ord) && unique(ord) && equal(ord, listIds), 'Нарушен порядок вариантов.');
          for (const map of [x.answers, x.draft])
            if (own(map, k))
              guard(
                list(map[k], 16) && unique(map[k]) && map[k].every((v) => ord.includes(v)),
                'Неизвестный вариант в ответе.',
              );
          if (own(x.times, k))
            guard(integer(x.times[k], 0, Number.MAX_SAFE_INTEGER), 'Неверное время ответа.');
          if (own(x.ratings, k))
            guard(
              ['again', 'hard', 'good', 'easy', 'read'].includes(x.ratings[k]),
              'Неверная оценка карточки.',
            );
        }
      };
      if (p.savedStudy) validateSession(p.savedStudy, false, false);
      if (p.study !== null) validateSession(p.study, false, false);
      if (p.exam !== null) validateSession(p.exam, false, true);
      for (const x of p.history) validateSession(x, true, true);
    }
    return s;
  }
  return {
    DAY,
    statuses,
    checkBank,
    initial,
    newProfile,
    getBank,
    catalog,
    day,
    addDays,
    validDate,
    shuffle,
    optionOrder,
    session,
    equal,
    stat,
    view,
    record,
    status,
    totals,
    finish,
    weakMap,
    smart,
    plan,
    signature,
    installBank,
    checkState,
    guard,
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;

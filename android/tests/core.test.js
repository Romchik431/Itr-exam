'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path');
const E = require('../assets/core.js');
const fixture = {
  format: 'exampro.bank',
  schema: 1,
  id: 'qa',
  revision: 1,
  title: 'Проверка алгоритмов',
  source: 'Синтетические задачи на счёт',
  questions: [
    {
      id: 'one',
      no: 1,
      topic: 'Счёт',
      text: 'Сколько будет два плюс два?',
      options: [
        { id: 'three', text: '3' },
        { id: 'four', text: '4' },
        { id: 'five', text: '5' },
      ],
      keys: ['four'],
      sourceKeys: ['four'],
    },
    {
      id: 'two',
      no: 2,
      topic: 'Счёт',
      text: 'Выберите чётные числа.',
      options: [
        { id: 'a', text: '2' },
        { id: 'b', text: '3' },
        { id: 'c', text: '4' },
      ],
      keys: ['c', 'a'],
      sourceKeys: ['a', 'c'],
    },
    {
      id: 'three',
      no: 3,
      topic: 'Справка',
      text: 'Справочная карточка без ключа.',
      options: [
        { id: 'a', text: 'А' },
        { id: 'b', text: 'Б' },
      ],
      keys: [],
      sourceKeys: [],
    },
  ],
};
if (process.argv.includes('--fixture')) {
  process.stdout.write(JSON.stringify(fixture));
  process.exit();
}
const clone = (x) => JSON.parse(JSON.stringify(x));
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS', name);
}
const t = Date.parse('2026-03-08T12:00:00Z');
test('validated bank and initial data', () => {
  assert.equal(E.checkBank(fixture), 0);
  assert(E.checkState(E.initial(fixture), fixture));
});
test('shuffle is a permutation and preserves all keys', () => {
  const q = fixture.questions[1],
    orders = new Set();
  for (let i = 0; i < 200; i++) {
    const order = E.optionOrder(q, true);
    orders.add(order.join());
    assert.deepEqual([...order].sort(), ['a', 'b', 'c']);
    assert(
      E.equal(
        q.keys,
        order.filter((i) => i !== 'b'),
      ),
    );
  }
  assert(orders.size > 1);
});
test('positional all-above answer remains at the correct boundary', () => {
  const q = clone(fixture.questions[1]);
  q.options[2].text = 'Все вышеперечисленное';
  for (let i = 0; i < 40; i++) assert.equal(E.optionOrder(q, true)[2], 'c');
});
test('multiselect, wrong/skip and rational pass threshold', () => {
  const s = E.session(fixture, ['one', 'two', 'three'], 'exam', { pass: 51, minutes: 1 }, t);
  assert.deepEqual(s.ids, ['one', 'two']);
  s.answers.one = ['four'];
  assert.deepEqual(E.totals(s, fixture), {
    right: 1,
    wrong: 0,
    skip: 1,
    total: 2,
    pct: 50,
    passed: false,
  });
  s.answers.two = ['a'];
  assert.equal(E.totals(s, fixture).wrong, 1);
  s.answers.two = ['a', 'c'];
  assert.equal(E.totals(s, fixture).pct, 100);
});
test('deadline, resume, finish and idempotence', () => {
  const state = E.initial(fixture),
    p = state.profiles.qa;
  p.exam = E.session(fixture, ['one', 'two'], 'exam', { pass: 30, minutes: 1, forward: true }, t);
  p.exam.answers.one = ['four'];
  p.exam.marked = ['two'];
  const copy = E.checkState(clone(state), fixture),
    x = copy.profiles.qa.exam;
  assert.equal(x.deadline, t + 60000);
  E.finish(copy.profiles.qa, x, fixture, t + 3600000);
  E.finish(copy.profiles.qa, x, fixture, t + 4000000);
  assert.equal(x.ended, t + 60000);
  assert.equal(copy.profiles.qa.history.length, 1);
  assert.equal(copy.profiles.qa.events.length, 2);
  assert.equal(copy.profiles.qa.stats.two.skip, 1);
  assert(E.checkState(copy, fixture));
});
test('active errors require two dated successful reviews', () => {
  const p = E.newProfile();
  E.record(p, 'one', 'bad', 1500, 'train', t);
  const q = p.stats.one;
  assert(q.active);
  E.record(p, 'one', 'ok', 1500, 'learn', t + 1000);
  assert(q.active && q.level === 1);
  E.record(p, 'one', 'ok', 1500, 'learn', t + 5000);
  assert.equal(q.level, 1);
  E.record(p, 'one', 'ok', 1800, 'learn', q.due + 100);
  assert(!q.active && q.level === 2);
  assert.equal(E.status(q, q.last), 3);
  E.record(p, 'one', 'ok', 1800, 'cards', q.due + 100, 'good');
  E.record(p, 'one', 'ok', 1800, 'cards', q.due + 100, 'easy');
  assert.equal(E.status(q, q.last), 4);
});
test('adaptive order, daily target and missed days', () => {
  const p = E.newProfile();
  E.record(p, 'one', 'bad', 140000, 'exam', t);
  assert.equal(E.smart(fixture, p, 1, t)[0], 'one');
  p.plan = { date: '2026-03-16', minutes: 1 };
  const a = E.plan(fixture, p, t),
    b = E.plan(fixture, p, t + 4 * E.DAY);
  assert(b.days < a.days && a.done === 1 && b.done === 0 && b.target >= 1);
});
test('course update, independent data and previous exam review', () => {
  const s = E.initial(fixture),
    p = s.profiles.qa;
  const x = E.session(fixture, ['one'], 'exam', {}, t);
  x.answers.one = ['four'];
  E.finish(p, x, fixture, t + 100);
  p.notes.one = 'моя заметка';
  const rev = clone(fixture);
  rev.revision = 2;
  rev.questions[0].keys = ['five'];
  E.installBank(s, fixture, rev);
  assert.equal(p.notes.one, 'моя заметка');
  assert.equal(p.stats.one.level, 0);
  assert.equal(E.totals(p.history[0], E.getBank(s, fixture, 'qa', 1)).pct, 100);
  const other = clone(fixture);
  other.id = 'other';
  E.installBank(s, fixture, other);
  assert.equal(s.active, 'other');
  assert.deepEqual(s.profiles.other.notes, {});
  assert(E.checkState(clone(s), fixture));
  assert.throws(() => E.installBank(s, fixture, rev));
});
test('invalid input and namespace safety', () => {
  for (const modify of [
    (b) => (b.questions[0].keys = ['absent']),
    (b) => (b.questions[0].id = '__proto__'),
    (b) => (b.questions[0].url = 'javascript:alert(1)'),
    (b) => (b.questions[1].no = 1),
  ]) {
    const b = clone(fixture);
    modify(b);
    assert.throws(() => E.checkBank(b));
  }
  const b = clone(fixture);
  b.questions[0].topic = '__proto__';
  assert.equal(E.weakMap(b, E.newProfile())['__proto__'].total, 1);
  const s = E.initial(fixture);
  s.profiles.qa.exam = E.session(fixture, ['one'], 'exam', {}, t);
  s.profiles.qa.exam.order.one = ['z'];
  assert.throws(() => E.checkState(s, fixture));
});
const filename = process.env.EXAM_TEST_BANK || path.resolve(__dirname, '../assets/builtin.json');
if (fs.existsSync(filename)) {
  const b = JSON.parse(fs.readFileSync(filename));
  test('all supplied questions, answers and options across repeated exam permutations', () => {
    E.checkBank(b);
    assert(E.checkState(E.initial(b), b));
    for (let i = 0; i < 20; i++) {
      const x = E.session(b, E.shuffle(b.questions.map((q) => q.id)), 'exam', { mix: true });
      for (const id of x.ids) {
        const q = b.questions.find((z) => z.id === id);
        assert.deepEqual([...x.order[id]].sort(), q.options.map((o) => o.id).sort());
        x.answers[id] = q.keys.slice();
      }
      assert.equal(E.totals(x, b).pct, 100);
    }
  });
}
console.log(count + ' test groups passed.');

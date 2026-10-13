import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../dist/conversation.mjs';
import { createSession, getPlan, completeTask } from '../dist/engine.mjs';

test('cook quantities preserve whole tokens instead of truncating malformed or ambiguous numbers', () => {
  for (const input of [
    'We have 1.2 cooks', 'We have .2 cooks', 'We have -2 cooks',
    'We have - 2 cooks', 'We have +2 cooks', 'We have 2e0 cooks',
    'We have 1/2 cooks', 'We have ½2 cooks', 'We have 1 or 2 cooks',
    'We have one or two cooks', 'We have one-two cooks',
    'We have between one and two cooks', 'We have 1 to 2 cooks',
    'We have 1–2 cooks', 'We have negative two cooks', 'We have 2,000 cooks',
  ]) assert.equal(interpret(input).kind, 'clarify', input);
});

test('oven delays do not use a fraction denominator or one endpoint of a range', () => {
  for (const input of [
    'The oven is busy for 1/2 minutes', 'The oven is busy for ½2 minutes',
    'The oven is busy for 1 to 2 minutes', 'The oven is busy for 1 or 2 minutes',
    'The oven is busy for 1–2 minutes', 'The oven is busy for - 2 minutes',
    'The oven is busy for +2 minutes', 'The oven is busy for .2 minutes',
  ]) assert.equal(interpret(input).kind, 'clarify', input);
  for (const minutes of [1, 20, 180]) {
    assert.deepEqual(interpret(`The oven is busy for ${minutes} minutes`),
      { kind: 'change', change: { type: 'oven-delay', minutes } });
  }
});

test('diner counts and unsupported relative dates never silently become clock times', () => {
  for (const input of [
    'Plan dinner for 2', 'Dinner for 4', 'Dinner for 12 people',
    'Eat at 7 pm tomorrow', 'Dinner at 7 pm next day',
    'Dinner in 20 minutes', 'Ready after 2 hours',
  ]) assert.equal(interpret(input).kind, 'clarify', input);
  for (const input of ['Plan dinner for 7 pm', 'Can we eat at 7?',
    'Serve by 19:00', 'Dinner at 7 p.m.', 'Set the target to 19:00']) {
    assert.deepEqual(interpret(input), { kind: 'change', change: { type: 'target', value: 1140 } }, input);
  }
});

test('supported cook phrases remain usable, including a dinner mention without a serving-time request', () => {
  for (const input of ['Two cooks', '2 cooks', 'Another cook', 'A second cook',
    'Cooks: 2', '2 cooks for dinner', 'We have two cooks tonight']) {
    assert.deepEqual(interpret(input), { kind: 'change', change: { type: 'cooks', value: 2 } }, input);
  }
  for (const input of ['One cook', '1 cook', 'Only me', 'I am alone']) {
    assert.deepEqual(interpret(input), { kind: 'change', change: { type: 'cooks', value: 1 } }, input);
  }
  for (const input of ['2 cooks and dinner at 7 pm', 'Two cooks and dinner at 7 pm'])
    assert.equal(interpret(input).kind, 'clarify', input);
});

test('the next completion event retains its original interval while the UI can derive remaining time', () => {
  const session = completeTask(createSession(), 'carrots-prep');
  const next = getPlan(session).nextTask;
  assert.equal(session.now, 1086);
  assert.equal(next.id, 'oven-preheat');
  assert.equal(next.inProgress, true);
  assert.equal(next.start, 1080);
  assert.equal(next.end, 1088);
  assert.equal(next.duration, 8, 'total duration must continue to match the audited interval');
  assert.equal(next.end - session.now, 2, 'remaining time is derived from the current demo clock');
  const advanced = completeTask(session, next.id);
  assert.equal(advanced.now, 1088, 'finish-next advances to the event end, not now plus total duration');
  const recorded = advanced.completed.find(item => item.id === next.id);
  assert.equal(recorded.start, 1080);
  assert.equal(recorded.end, 1088);
});

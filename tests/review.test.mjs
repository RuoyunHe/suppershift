import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getPlan, completeTask, proposeChange, commitProposal, undoChange } from '../dist/engine.mjs';
import { interpret, parseTime } from '../dist/conversation.mjs';

test('questions and negative progress reports never advance the demo clock', () => {
  for (const phrase of ['I am not done', "I haven't finished", 'Is the rice done?', 'Do not finish the next step', 'Please do not undo that change'])
    assert.equal(interpret(phrase).kind, 'clarify', phrase);
  for (const phrase of ['done', 'I am finished', 'Finish next demo step'])
    assert.equal(interpret(phrase).kind, 'complete', phrase);
});

test('signed and fractional delays cannot become an unrelated positive duration', () => {
  for (const phrase of ['The oven is busy for -5 minutes', 'The oven is busy for 2.5 minutes', 'The oven is busy for 1e2 minutes', 'The oven is busy for 5 minutes or 10 minutes'])
    assert.equal(interpret(phrase).kind, 'clarify', phrase);
  assert.equal(interpret('The oven is busy for 180 minutes').change.minutes, 180);
});

test('invalid times are not truncated and ambiguous time requests ask for clarification', () => {
  for (const text of ['7:5 pm', '7:555 pm', '7.5 pm', '-7 pm', '6 pm or 7 pm', '19:30:00'])
    assert.equal(parseTime(text), null, text);
  assert.equal(parseTime('Can we eat at 6:20 p.m.?'), 1100);
  assert.equal(parseTime('I want to eat at 19:00.'), 1140);
  assert.equal(interpret('Can we eat at 7:5 pm?').kind, 'clarify');
});

test('bounded parser does not guess counts, negate menu requests, or silently drop a second change', () => {
  for (const phrase of ['We have 12 cooks', 'We have 21 cooks', 'Please do not use salad', 'Use salad and roast carrots', 'Two cooks and dinner at 7 pm', '2 cooks and dinner at 7 pm', 'The oven is busy for 20 minutes and dinner at 7 pm', 'If the oven is busy use salad'])
    assert.equal(interpret(phrase).kind, 'clarify', phrase);
  assert.deepEqual(interpret('another cook'), { kind: 'change', change: { type: 'cooks', value: 2 } });
  assert.equal(interpret('Use the salad instead').change.variant, 'salad');
  assert.equal(interpret('I want salad').change.variant, 'salad');
  assert.equal(interpret('I want to eat at 19:00.').change.value, 1140);
});

test('invalid persisted numerical estimates fail closed instead of manufacturing early finishes', () => {
  for (const value of [-40, NaN, Infinity, 0.5, '20', null])
    assert.throws(() => getPlan(createSession({ delays: { 'carrots-roast': value } })), /Task delay/);
  assert.throws(() => getPlan(createSession({ delays: { 'carrots-roast': Number.MAX_SAFE_INTEGER } })), /Task duration/);
  assert.throws(() => getPlan(createSession({ now: Number.MAX_SAFE_INTEGER })), /Scheduled end/);
});

test('advancing a resource-conflicted plan cannot turn unscheduled steps into completed work', () => {
  let session = completeTask(createSession(), 'carrots-prep');
  session = commitProposal(session, proposeChange(session, { type: 'oven-delay', minutes: 20 }));
  const before = JSON.stringify(session);
  assert.equal(getPlan(session).metrics.scheduled, false);
  assert.throws(() => completeTask(session, session.inProgress[0].id), /Repair the resource conflict/);
  assert.equal(JSON.stringify(session), before);
  const repaired = undoChange(session);
  assert.equal(getPlan(repaired).metrics.scheduled, true);
  assert.deepEqual(repaired.completed, session.completed);
});

test('corrupted progress records reject impossible intervals and dependency history', () => {
  const session = completeTask(createSession(), 'carrots-prep');
  const future = structuredClone(session);
  future.completed[0].end += 5;
  assert.throws(() => createSession(future), /intervals/);
  const duplicate = structuredClone(session);
  duplicate.completed.push(duplicate.completed[0]);
  assert.throws(() => createSession(duplicate), /duplicate/);
  let dependency = completeTask(createSession(), 'rice-boil');
  dependency.completed = dependency.completed.filter((task) => task.id !== 'rice-rinse');
  assert.throws(() => getPlan(dependency), /dependency/);
});

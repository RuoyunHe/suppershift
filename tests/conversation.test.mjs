import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret, parseTime } from '../dist/conversation.mjs';
test('dinner times distinguish twelve, 24-hour time, and invalid minutes', () => {
  assert.equal(parseTime('12 pm'), 720); assert.equal(parseTime('12 am'), 0);
  assert.equal(parseTime('19:30'), 1170); assert.equal(parseTime('6:20 pm'), 1100);
  assert.equal(parseTime('7:99 pm'), null); assert.equal(parseTime('25:00'), null);
});
test('an unspecified or absurd interruption never silently mutates the plan', () => {
  assert.equal(interpret('the oven is busy').kind, 'clarify');
  assert.equal(interpret('the oven is busy for 999 minutes').kind, 'clarify');
  assert.deepEqual(interpret('The oven is busy for 20 minutes'), {kind:'change',change:{type:'oven-delay',minutes:20}});
});
test('context, undo, and unsupported requests stay distinct from mutation', () => {
  assert.equal(interpret('Where was I?').kind, 'context');
  assert.equal(interpret('undo that change').kind, 'undo');
  assert.equal(interpret('order groceries using my card').kind, 'clarify');
  assert.equal(interpret('confirm').kind, 'confirm');
});

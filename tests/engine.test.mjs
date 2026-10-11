import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getPlan, proposeChange, commitProposal, completeTask, undoChange, formatTime } from '../dist/engine.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freeze(child);
  return value;
}
function verifySchedule(session, plan) {
  assert.equal(plan.metrics.scheduled, true, plan.reason);
  const byId = new Map(plan.tasks.map((item) => [item.id, item]));
  assert.equal(byId.size, plan.tasks.length, 'task ids are unique');
  for (const item of plan.tasks) {
    assert.ok(Number.isFinite(item.start) && Number.isFinite(item.end));
    assert.equal(item.end - item.start, item.duration, item.id);
    for (const dependency of item.deps) {
      assert.ok(byId.has(dependency), `missing ${dependency}`);
      assert.ok(byId.get(dependency).end <= item.start, `dependency overlap: ${dependency} → ${item.id}`);
    }
    if (!item.completed && !item.inProgress) assert.ok(item.start >= session.now);
  }
  const records = [...plan.tasks, ...session.blocks.map((block) => ({
    start: block.start, end: block.end, resources: { [block.resource]: block.units ?? 1 },
  }))];
  for (const [resource, capacity] of Object.entries({ cook: session.cooks, burner: session.burners, oven: 1 })) {
    const points = [...new Set(records.flatMap((item) => [item.start, item.end]))];
    for (const at of points) {
      // Historical work can precede a later capacity change.
      if (at < session.now) continue;
      const used = records.reduce((sum, item) => sum +
        (item.start <= at && at < item.end ? item.resources[resource] ?? 0 : 0), 0);
      assert.ok(used <= capacity, `${resource} overbooked at ${at}: ${used}/${capacity}`);
    }
  }
  assert.equal(plan.finish, Math.max(session.now, ...plan.tasks.map((item) => item.end)));
  assert.equal(plan.lateness, Math.max(0, plan.finish - session.target));
  assert.equal(plan.feasible, plan.lateness === 0);
  assert.ok(plan.metrics.searchNodes <= plan.metrics.nodeBudget);
  assert.equal(plan.metrics.optimalityCertified, false, 'never imply an unproved global optimum');
}

test('default dinner has a compliant schedule and authored practical instructions', () => {
  const session = createSession();
  const plan = getPlan(session);
  verifySchedule(session, plan);
  assert.equal(plan.feasible, true);
  assert.ok(plan.tasks.every((item) => item.instructions.length > 20));
  assert.ok(plan.metrics.serialBaselineFinish >= plan.finish);
  assert.equal(plan.nextTask.id, [...plan.tasks].sort((a, b) => a.end - b.end)[0].id);
});

test('an oven interruption misses the target; an authored salad replacement repairs it', () => {
  let session = createSession();
  session = commitProposal(session, proposeChange(session, { type: 'oven-delay', minutes: 20 }));
  const delayed = getPlan(session);
  verifySchedule(session, delayed);
  assert.ok(delayed.lateness > 0);
  const proposal = proposeChange(session, { type: 'swap-side', variant: 'salad' });
  assert.equal(session.variant, 'roast', 'proposal cannot commit itself');
  assert.ok(proposal.changes.some((line) => line.includes('Side')));
  session = commitProposal(session, proposal);
  const repaired = getPlan(session);
  verifySchedule(session, repaired);
  assert.equal(repaired.feasible, true);
  assert.ok(repaired.finish < delayed.finish);
  assert.ok(repaired.tasks.every((item) => !(item.resources.oven > 0)));
});

test('generated capacities, menu variants, and oven calendars obey every constraint', () => {
  let cases = 0;
  for (const variant of ['roast', 'salad']) for (const cooks of [1, 2, 3]) for (const burners of [1, 2]) for (const wait of [0, 17, 41]) {
    const session = createSession({ variant, cooks, burners, target: 1300,
      blocks: wait ? [{ resource: 'oven', start: 1080, end: 1080 + wait, units: 1 }] : [] });
    verifySchedule(session, getPlan(session));
    cases++;
  }
  assert.equal(cases, 36);
});

test('zero cook or burner capacity is reported as unschedulable, not a fake timestamp', () => {
  for (const overrides of [{ cooks: 0 }, { burners: 0 }]) {
    const plan = getPlan(createSession(overrides));
    assert.equal(plan.feasible, false);
    assert.equal(plan.finish, null);
    assert.equal(plan.nextTask, null);
    assert.equal(plan.metrics.scheduled, false);
    assert.match(plan.reason, /only 0 available/);
  }
});

test('impossible target remains a real resource-compliant but late schedule', () => {
  const session = createSession({ target: 1081 });
  const plan = getPlan(session);
  verifySchedule(session, plan);
  assert.equal(plan.feasible, false);
  assert.ok(plan.lateness > 0);
  assert.equal(plan.metrics.scheduled, true);
});

test('task delays propagate through dependency timing', () => {
  const original = createSession();
  const baseline = getPlan(original);
  const session = commitProposal(original, proposeChange(original, { type: 'delay', taskId: 'carrots-roast', minutes: 13 }));
  const plan = getPlan(session);
  verifySchedule(session, plan);
  assert.equal(plan.tasks.find((item) => item.id === 'carrots-roast').duration, 43);
  assert.ok(plan.finish >= baseline.finish + 13);
});

test('proposals and all state operations are immutable and reject stale confirmations', () => {
  const session = freeze(createSession());
  const old = clone(session);
  const proposal = proposeChange(session, { type: 'target', value: 1200 });
  const next = commitProposal(session, proposal);
  assert.deepEqual(session, old);
  assert.equal(next.target, 1200);
  assert.equal(next.revision, 1);
  assert.throws(() => commitProposal(next, proposal), /stale/);
  assert.throws(() => commitProposal(createSession({ cooks: 2 }), proposal), /stale/);
  const changedProposal = clone(proposal);
  changedProposal.change.value = 1201;
  assert.throws(() => commitProposal(session, changedProposal), /changed after review/);
});

test('atomic setup changes create one reviewable proposal and one reversible commit', () => {
  const session = createSession();
  const proposal = proposeChange(session, { type: 'setup', target: 1150, cooks: 2, variant: 'salad' });
  const next = commitProposal(session, proposal);
  assert.equal(next.target, 1150);
  assert.equal(next.cooks, 2);
  assert.equal(next.variant, 'salad');
  assert.equal(next.history.length, 1);
  const undone = undoChange(next);
  assert.equal(undone.target, session.target);
  assert.equal(undone.cooks, session.cooks);
  assert.equal(undone.variant, session.variant);
  assert.equal(undone.revision, 2, 'undo does not reuse a revision');
});

test('timeline advancement preserves completed and active intervals through replanning', () => {
  const original = createSession();
  const baseline = getPlan(original);
  let session = completeTask(original, 'carrots-prep');
  assert.equal(session.now, baseline.tasks.find((item) => item.id === 'carrots-prep').end);
  assert.ok(session.inProgress.length > 0, 'parallel passive work is preserved');
  const history = clone(session.completed);
  const active = clone(session.inProgress);
  session = commitProposal(session, proposeChange(session, { type: 'swap-side', variant: 'salad' }));
  const plan = getPlan(session);
  verifySchedule(session, plan);
  for (const previous of [...history, ...active]) {
    const current = plan.tasks.find((item) => item.id === previous.id);
    assert.ok(current, 'completed work remains visible even after a menu substitution');
    assert.equal(current.start, previous.start);
    assert.equal(current.end, previous.end);
    assert.equal(current.duration, previous.duration);
  }
  const restored = undoChange(session);
  assert.deepEqual(restored.completed, history);
  assert.deepEqual(restored.inProgress, active);
});

test('undo cannot erase progress made after the latest plan change', () => {
  let session = createSession();
  session = commitProposal(session, proposeChange(session, { type: 'target', value: 1200 }));
  session = completeTask(session, getPlan(session).nextTask.id);
  assert.throws(() => undoChange(session), /progress occurred/);
  assert.throws(() => proposeChange(session, { type: 'delay', taskId: session.completed[0].id, minutes: 2 }), /frozen/);
});

test('progress through the whole timeline terminates with every task complete', () => {
  let session = createSession();
  for (let step = 0; step < 30; step++) {
    const plan = getPlan(session);
    verifySchedule(session, plan);
    if (!plan.nextTask) break;
    session = completeTask(session, plan.nextTask.id);
  }
  const final = getPlan(session);
  assert.equal(final.nextTask, null);
  assert.ok(final.tasks.every((item) => item.completed));
  assert.equal(session.inProgress.length, 0);
});

test('overlapping oven reports merge and a block at a resource boundary is half-open', () => {
  let session = createSession({ blocks: [{ resource: 'oven', start: 1070, end: 1090, units: 1 }] });
  session = commitProposal(session, proposeChange(session, { type: 'oven-delay', minutes: 20 }));
  assert.equal(session.blocks.length, 1);
  assert.equal(session.blocks[0].end, 1100);
  const plan = getPlan(session);
  verifySchedule(session, plan);
  assert.equal(plan.tasks.filter((item) => item.resources.oven).reduce((start, item) => Math.min(start, item.start), Infinity), 1100);
});

test('constraint changes never silently retime a task already in progress', () => {
  let session = completeTask(createSession(), 'carrots-prep');
  const running = clone(session.inProgress);
  session = commitProposal(session, proposeChange(session, { type: 'oven-delay', minutes: 20 }));
  const plan = getPlan(session);
  assert.equal(plan.metrics.scheduled, false);
  assert.match(plan.reason, /already in progress/);
  assert.deepEqual(session.inProgress, running);
});

test('bad input is rejected and time output handles midnight and unschedulable states', () => {
  assert.throws(() => createSession({ now: -1 }));
  assert.throws(() => createSession({ variant: 'mystery' }));
  assert.throws(() => createSession({ cooks: 1.5 }));
  assert.throws(() => proposeChange(createSession(), { type: 'oven-delay', minutes: 0 }));
  assert.throws(() => proposeChange(createSession(), { type: 'delay', taskId: 'missing', minutes: 2 }));
  assert.equal(formatTime(1140), '19:00');
  assert.equal(formatTime(1450), '00:10 (+1d)');
  assert.equal(formatTime(null), 'Not schedulable');
});

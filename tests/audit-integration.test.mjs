import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getPlan, proposeChange, commitProposal, completeTask } from '../dist/engine.mjs';
import { auditPlan } from '../dist/audit.mjs';

const change = (session, value) => commitProposal(session, proposeChange(session, value));
function passes(session) {
  const report = auditPlan(session, getPlan(session));
  assert.equal(report.ok, true, JSON.stringify(report.violations));
  return report;
}

test('independent audit accepts the baseline solver output', () => {
  const report = passes(createSession());
  assert.equal(report.summary.taskCount, 14);
  assert.equal(report.summary.resourcesChecked, 3);
});

test('audit accepts an oven-delayed schedule even when it misses the deadline', () => {
  const session = change(createSession(), { type: 'oven-delay', minutes: 20 });
  const plan = getPlan(session);
  assert.equal(plan.feasible, false);
  assert.equal(plan.metrics.scheduled, true);
  assert.equal(auditPlan(session, plan).ok, true);
});

test('audit accepts the salad repair and maps default block units', () => {
  let session = createSession({ blocks: [{ resource: 'oven', start: 1080, end: 1100 }] });
  session = change(session, { type: 'swap-side', variant: 'salad' });
  assert.equal(passes(session).summary.blockCount, 1);
});

test('audit preserves completed snapshots after progress and menu substitution', () => {
  let session = completeTask(createSession(), 'carrots-prep');
  assert.ok(session.completed.length > 0);
  assert.ok(session.inProgress.length > 0);
  session = change(session, { type: 'swap-side', variant: 'salad' });
  assert.equal(passes(session).summary.completedCount, session.completed.length);
});

test('independent audit rejects deliberately overbooked solver output', () => {
  const session = createSession();
  const plan = structuredClone(getPlan(session));
  const a = plan.tasks.find(item => item.id === 'rice-rinse');
  const b = plan.tasks.find(item => item.id === 'skillet-prep');
  b.start = a.start;
  b.end = b.start + b.duration;
  const report = auditPlan(session, plan);
  assert.equal(report.ok, false);
  assert.ok(report.violations.some(item => item.code === 'RESOURCE_OVERLOAD' && item.taskIds.includes(a.id) && item.taskIds.includes(b.id)));
});

test('independent audit rejects a changed completed record and missing dependency', () => {
  const session = completeTask(createSession(), 'rice-rinse');
  const plan = structuredClone(getPlan(session));
  const completed = plan.tasks.find(item => item.id === session.completed[0].id);
  completed.completed = false;
  plan.tasks.find(item => !item.completed).deps.push('invented-task');
  const report = auditPlan(session, plan);
  assert.equal(report.ok, false);
  assert.ok(report.violations.some(item => item.code === 'COMPLETED_TASK_CHANGED'));
  assert.ok(report.violations.some(item => item.code === 'UNKNOWN_DEPENDENCY'));
});

test('unschedulable output produces one explicit diagnostic instead of auditing null intervals', () => {
  const session = createSession({ cooks: 0 });
  const report = auditPlan(session, getPlan(session));
  assert.equal(report.ok, false);
  assert.deepEqual(report.violations.map(item => item.code), ['UNSCHEDULED_PLAN']);
  assert.equal(report.summary.start, null);
});

test('adapter rejects malformed solver output and does not mutate either input', () => {
  const session = createSession();
  const plan = getPlan(session);
  const before = JSON.stringify({ session, plan });
  auditPlan(session, plan);
  assert.equal(JSON.stringify({ session, plan }), before);
  assert.equal(auditPlan(session, { tasks: null }).ok, false);
  assert.equal(auditPlan(null, null).ok, false);
});

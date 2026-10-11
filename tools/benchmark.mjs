/** Measured local evidence, not user-study or real cooking claims. */
import { performance } from 'node:perf_hooks';
import { createSession, getPlan, proposeChange, commitProposal } from '../dist/engine.mjs';

const base = createSession();
const blocked = commitProposal(base, proposeChange(base, { type: 'oven-delay', minutes: 20 }));
const repaired = commitProposal(blocked, proposeChange(blocked, { type: 'swap-side', variant: 'salad' }));
const fixtures = [
  ['baseline-roast', base],
  ['oven-delayed', blocked],
  ['salad-repair', repaired],
  ['one-burner', createSession({ burners: 1 })],
  ['two-cooks', createSession({ cooks: 2 })],
  ['impossible-target', createSession({ target: 1081 })],
];
for (const [, session] of fixtures) getPlan(session);
const results = fixtures.map(([name, session]) => {
  const timings = [];
  let plan;
  for (let i = 0; i < 30; i++) {
    const start = performance.now();
    plan = getPlan(session);
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  return { name, samples: timings.length, medianMs: +timings[14].toFixed(3),
    p95Ms: +timings[Math.ceil(timings.length * .95) - 1].toFixed(3),
    finish: plan.finish, lateness: plan.lateness, feasible: plan.feasible,
    searchNodes: plan.metrics.searchNodes, searchLimited: plan.metrics.searchLimited,
    serialBaselineFinish: plan.metrics.serialBaselineFinish,
    parallelMinutesSaved: plan.metrics.parallelMinutesSaved };
});
console.log(JSON.stringify({ measuredAt: new Date().toISOString(), node: process.version,
  platform: process.platform, architecture: process.arch,
  note: 'Synthetic authored dinner fixtures; timing is local machine performance. Fully sequential reference is not a human-performance baseline. No global optimality or real-world time-saving claim.',
  results }, null, 2));

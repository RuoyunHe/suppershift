/** SupperShift's dependency/resource planner. No network, model, or framework required.
 * Times are integer minutes on a demo-day clock. All mutations return new state.
 * Durations are authored estimates, not food-temperature or food-safety advice.
 */
const SEARCH_BUDGET = 1800;
const RESOURCES = ['cook', 'burner', 'oven'];
const copy = (value) => JSON.parse(JSON.stringify(value));
const task = (id, title, duration, resources, deps, instructions) =>
  ({ id, title, duration, resources, deps, instructions });

const COMMON = [
  task('rice-rinse', 'Rinse the rice', 3, { cook: 1 }, [], 'Measure and rinse the rice; add it to the saucepan with the water specified on its package.'),
  task('rice-boil', 'Bring rice to a simmer', 5, { burner: 1 }, ['rice-rinse'], 'Heat the prepared rice and water on one burner. This stage occupies a burner; check the pan as needed.'),
  task('rice-simmer', 'Simmer the rice', 18, { burner: 1 }, ['rice-boil'], 'Cover and simmer according to the rice package. The schedule uses an estimated 18-minute passive stage.'),
  task('rice-fluff', 'Fluff the rice', 2, { cook: 1 }, ['rice-simmer'], 'Check the rice is ready, then fluff it. Report extra time if needed.'),
  task('skillet-prep', 'Prepare lemon chickpea skillet', 5, { cook: 1 }, [], 'Drain canned chickpeas; chop onion and rinse spinach. Set aside lemon, olive oil, and seasonings.'),
  task('skillet-saute', 'Soften the onion', 6, { cook: 1, burner: 1 }, ['skillet-prep'], 'Gently soften the chopped onion in olive oil in a skillet; this stage needs your attention.'),
  task('skillet-simmer', 'Simmer the chickpeas', 12, { burner: 1 }, ['skillet-saute'], 'Add canned chickpeas and a splash of water. Simmer gently while completing another preparation step.'),
  task('skillet-finish', 'Finish with spinach and lemon', 2, { cook: 1 }, ['skillet-simmer'], 'Stir in the spinach and lemon; check the dish before serving.'),
];
const ROAST = [
  task('carrots-prep', 'Prepare roast carrots', 6, { cook: 1 }, [], 'Wash and cut the carrots evenly, then toss with olive oil and seasonings on a tray.'),
  task('oven-preheat', 'Preheat the oven', 8, { oven: 1 }, [], 'Set the oven for the carrot recipe. This is an estimated warm-up stage; oven controls remain yours.'),
  task('carrots-load', 'Put carrots in the oven', 2, { cook: 1, oven: 1 }, ['carrots-prep', 'oven-preheat'], 'Place the prepared carrot tray in the oven using appropriate oven protection.'),
  task('carrots-roast', 'Roast the carrots', 30, { oven: 1 }, ['carrots-load'], 'Roast until the carrots are ready; the planner estimates 30 minutes. Check and report extra time if needed.'),
  task('carrots-finish', 'Finish the roast carrots', 2, { cook: 1 }, ['carrots-roast'], 'Remove the tray carefully and check the carrots are ready to serve.'),
];
const SALAD = [
  task('salad-prep', 'Prepare cucumber tomato salad', 6, { cook: 1 }, [], 'Wash and chop cucumber and tomatoes. Keep the vegetables separate from the dressing until serving.'),
  task('salad-toss', 'Dress the fresh salad', 2, { cook: 1 }, ['salad-prep'], 'Toss the vegetables with lemon and olive oil just before serving.'),
];

function requireMinute(value, name, { zero = true } = {}) {
  if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1))
    throw new Error(`${name} must be a ${zero ? 'non-negative' : 'positive'} whole number of minutes.`);
  return value;
}
function requireCount(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 20)
    throw new Error(`${name} must be a whole number from 0 to 20.`);
  return value;
}
function validate(session) {
  requireMinute(session.revision, 'Revision');
  requireMinute(session.now, 'Current time');
  requireMinute(session.target, 'Serving time');
  requireCount(session.cooks, 'Cooks');
  requireCount(session.burners, 'Burners');
  if (!['roast', 'salad'].includes(session.variant)) throw new Error('Choose roast or salad.');
  for (const field of ['blocks', 'completed', 'inProgress', 'history', 'events']) {
    if (!Array.isArray(session[field])) throw new Error(`${field} must be a list.`);
  }
  if (!session.delays || typeof session.delays !== 'object' || Array.isArray(session.delays))
    throw new Error('Task delays must be a map of whole-minute estimates.');
  const knownIds = new Set([...COMMON, ...ROAST, ...SALAD].map((item) => item.id).concat('serve'));
  for (const [id, delay] of Object.entries(session.delays)) {
    if (!knownIds.has(id)) throw new Error('That delayed task is not part of this dinner.');
    requireMinute(delay, 'Task delay');
  }
  const recordedIds = new Set();
  for (const [kind, records] of [['completed', session.completed], ['inProgress', session.inProgress]]) {
    for (const record of records) {
      if (!record || !knownIds.has(record.id) || recordedIds.has(record.id))
        throw new Error('Cooking progress contains an unknown or duplicate task.');
      recordedIds.add(record.id);
      requireMinute(record.start, 'Recorded start');
      requireMinute(record.end, 'Recorded end');
      requireMinute(record.duration, 'Recorded duration', { zero: false });
      if (record.end - record.start !== record.duration)
        throw new Error('Recorded cooking intervals must match their durations.');
      if (kind === 'completed' ? record.end > session.now : !(record.start < session.now && record.end > session.now))
        throw new Error('Recorded progress does not match the demo clock.');
      if (!record.resources || typeof record.resources !== 'object' || Array.isArray(record.resources))
        throw new Error('Recorded resources must be a resource map.');
      for (const [resource, units] of Object.entries(record.resources)) {
        if (!RESOURCES.includes(resource)) throw new Error('Unknown recorded resource.');
        requireCount(units, 'Recorded resource demand');
      }
      if (!Array.isArray(record.deps) || record.deps.some((id) => !knownIds.has(id)))
        throw new Error('Recorded task dependencies are invalid.');
      if (typeof record.title !== 'string' || typeof record.instructions !== 'string')
        throw new Error('Recorded task descriptions are invalid.');
    }
  }
  for (const block of session.blocks) {
    if (!RESOURCES.includes(block.resource)) throw new Error('Unknown blocked resource.');
    requireMinute(block.start, 'Block start');
    requireMinute(block.end, 'Block end');
    if (block.end <= block.start) throw new Error('A resource block must have positive length.');
    if (!Number.isSafeInteger(block.units ?? 1) || (block.units ?? 1) <= 0)
      throw new Error('A block must reserve a positive whole number of units.');
  }
}

export function createSession(overrides = {}) {
  const session = {
    revision: 0, now: 1080, target: 1140, cooks: 1, burners: 2, variant: 'roast',
    blocks: [], completed: [], inProgress: [], delays: {}, history: [], events: [],
    ...copy(overrides),
  };
  validate(session);
  return session;
}

function definitions(session) {
  const side = session.variant === 'roast' ? ROAST : SALAD;
  const finalSide = session.variant === 'roast' ? 'carrots-finish' : 'salad-toss';
  const result = [...COMMON, ...side, task('serve', 'Bring dinner to the table', 2,
    { cook: 1 }, ['rice-fluff', 'skillet-finish', finalSide],
    'Bring the rice, lemon chickpea skillet, and side dish to the table.')].map(copy);
  for (const item of result) item.duration = requireMinute(item.duration + (session.delays[item.id] ?? 0), 'Task duration', { zero: false });
  // Completed/started work is a real historical record, even if a later menu omits it.
  const frozen = [...session.completed, ...session.inProgress];
  for (const record of frozen) {
    const index = result.findIndex((item) => item.id === record.id);
    if (index < 0) result.push(copy(record));
    else result[index] = copy(record);
  }
  return result;
}

function reservationsFrom(session, fixed) {
  return [
    ...session.blocks.map((block) => ({
      id: block.id ?? 'resource-block', start: block.start, end: block.end,
      resources: { [block.resource]: block.units ?? 1 }, block: true,
    })),
    ...fixed,
  ];
}

function fits(item, start, reservations, capacities) {
  const end = start + item.duration;
  for (const resource of RESOURCES) {
    const demand = item.resources[resource] ?? 0;
    if (!demand) continue;
    if (demand > capacities[resource]) return false;
    const overlaps = reservations.filter((record) =>
      record.end > start && record.start < end && (record.resources[resource] ?? 0) > 0);
    const checkpoints = new Set([start, ...overlaps.map((record) => Math.max(start, record.start))]);
    for (const at of checkpoints) {
      const used = overlaps.reduce((sum, record) => sum +
        (record.start <= at && record.end > at ? record.resources[resource] ?? 0 : 0), 0);
      if (used + demand > capacities[resource]) return false;
    }
  }
  return true;
}

function earliest(item, release, reservations, capacities) {
  const candidates = [...new Set([release,
    ...reservations.filter((record) => record.end >= release).map((record) => record.end)])]
    .sort((a, b) => a - b);
  for (const start of candidates) if (fits(item, start, reservations, capacities)) return start;
  return null;
}

function resourceConflict(records, capacities, now) {
  for (const resource of RESOURCES) {
    const relevant = records.filter((record) => record.end > now && (record.resources[resource] ?? 0) > 0);
    const points = [...new Set([now, ...relevant.map((record) => Math.max(now, record.start))])];
    for (const at of points) {
      const active = relevant.filter((record) => record.start <= at && record.end > at);
      const used = active.reduce((sum, record) => sum + (record.resources[resource] ?? 0), 0);
      // A block alone may intentionally make a resource entirely unavailable.
      if (used > capacities[resource] && active.some((record) => !record.block)) return resource;
    }
  }
  return null;
}

function noSchedule(session, items, reason) {
  const completedIds = new Set(session.completed.map((item) => item.id));
  const runningIds = new Set(session.inProgress.map((item) => item.id));
  return {
    tasks: items.map((item) => ({ ...item, start: item.start ?? null, end: item.end ?? null,
      completed: completedIds.has(item.id), inProgress: runningIds.has(item.id) })),
    finish: null, lateness: null, feasible: false, reason, nextTask: null, variant: session.variant,
    metrics: { solver: 'bounded serial-schedule search', searchNodes: 0, nodeBudget: SEARCH_BUDGET,
      searchComplete: false, searchLimited: false, bounded: true, optimalityCertified: false, scheduled: false, taskCount: items.length,
      activeMinutes: items.reduce((sum, item) => sum + ((item.resources.cook ?? 0) ? item.duration : 0), 0),
      slack: null },
  };
}

export function getPlan(input) {
  const session = createSession(input);
  const items = definitions(session);
  const capacities = { cook: session.cooks, burner: session.burners, oven: 1 };
  const completedIds = new Set(session.completed.map((item) => item.id));
  const runningIds = new Set(session.inProgress.map((item) => item.id));
  const fixed = items.filter((item) => completedIds.has(item.id) || runningIds.has(item.id));
  const pending = items.filter((item) => !completedIds.has(item.id) && !runningIds.has(item.id));
  const fixedById = new Map(fixed.map((item) => [item.id, item]));
  for (const item of fixed) for (const dependency of item.deps) {
    if (!fixedById.has(dependency) || fixedById.get(dependency).end > item.start)
      throw new Error('Recorded cooking progress violates a task dependency.');
  }
  for (const item of pending) for (const resource of RESOURCES) {
    if ((item.resources[resource] ?? 0) > capacities[resource])
      return noSchedule(session, items, `${item.title} needs ${item.resources[resource]} ${resource}; only ${capacities[resource]} available.`);
  }
  const fixedReservations = reservationsFrom(session, fixed);
  const conflict = resourceConflict(fixedReservations, capacities, session.now);
  if (conflict) return noSchedule(session, items, `The new ${conflict} constraint conflicts with a task already in progress. Undo or revise the constraint before advancing the demo.`);
  const byId = new Map(items.map((item) => [item.id, item]));
  const tails = new Map();
  function tail(id, visiting = new Set()) {
    if (tails.has(id)) return tails.get(id);
    if (visiting.has(id)) throw new Error('The task graph contains a cycle.');
    const next = new Set([...visiting, id]);
    const children = pending.filter((item) => item.deps.includes(id));
    const value = byId.get(id).duration + Math.max(0, ...children.map((item) => tail(item.id, next)));
    tails.set(id, value);
    return value;
  }
  for (const item of items) tail(item.id);
  const initial = new Map(fixed.map((item) => [item.id, item]));
  const compareReady = (a, b) => tail(b.id) - tail(a.id) || a.id.localeCompare(b.id);
  function readyFor(remaining, placed) {
    return remaining.filter((item) => item.deps.every((id) => placed.has(id))).sort(compareReady);
  }
  function place(item, placed, reservations) {
    const release = Math.max(session.now, ...item.deps.map((id) => placed.get(id).end));
    const start = earliest(item, release, reservations, capacities);
    if (start === null) throw new Error('No resource interval could be scheduled.');
    return { ...item, start, end: requireMinute(start + item.duration, 'Scheduled end') };
  }
  let best = null;
  let bestFinish = Infinity;
  // Seed a useful upper bound before bounded search. Different priorities avoid
  // making quality depend entirely on whichever branch happens to be first.
  for (const strategy of ['critical', 'shortest', 'active']) {
    const placed = new Map(initial);
    const reservations = [...fixedReservations];
    let remaining = [...pending];
    while (remaining.length) {
      const ready = readyFor(remaining, placed);
      if (!ready.length) return noSchedule(session, items, 'The task graph has a missing dependency or a cycle.');
      if (strategy === 'shortest') ready.sort((a, b) => a.duration - b.duration || compareReady(a, b));
      if (strategy === 'active') ready.sort((a, b) => (b.resources.cook ?? 0) - (a.resources.cook ?? 0) || compareReady(a, b));
      const selected = ready[0];
      const scheduled = place(selected, placed, reservations);
      placed.set(selected.id, scheduled);
      reservations.push(scheduled);
      remaining = remaining.filter((item) => item.id !== selected.id);
    }
    const finish = Math.max(session.now, ...[...placed.values()].map((item) => item.end));
    if (finish < bestFinish) { bestFinish = finish; best = placed; }
  }
  let nodes = 0;
  let limitReached = false;
  function precedenceLowerBound(remaining, placed) {
    const ends = new Map([...placed].map(([id, item]) => [id, item.end]));
    let unchecked = [...remaining];
    while (unchecked.length) {
      const ready = unchecked.filter((item) => item.deps.every((id) => ends.has(id)));
      if (!ready.length) return Infinity;
      for (const item of ready) {
        ends.set(item.id, Math.max(session.now, ...item.deps.map((id) => ends.get(id))) + item.duration);
      }
      const ids = new Set(ready.map((item) => item.id));
      unchecked = unchecked.filter((item) => !ids.has(item.id));
    }
    return Math.max(session.now, ...ends.values());
  }
  function visit(remaining, placed, reservations) {
    if (nodes >= SEARCH_BUDGET) { limitReached = true; return; }
    nodes++;
    if (precedenceLowerBound(remaining, placed) >= bestFinish) return;
    if (!remaining.length) {
      bestFinish = Math.max(session.now, ...[...placed.values()].map((item) => item.end));
      best = new Map(placed);
      return;
    }
    for (const item of readyFor(remaining, placed)) {
      const scheduled = place(item, placed, reservations);
      if (scheduled.end >= bestFinish) continue;
      const nextPlaced = new Map(placed);
      nextPlaced.set(item.id, scheduled);
      visit(remaining.filter((candidate) => candidate.id !== item.id), nextPlaced, [...reservations, scheduled]);
      if (limitReached) break;
    }
  }
  visit(pending, initial, fixedReservations);
  const tasks = [...best.values()].map((item) => ({ ...item,
    completed: completedIds.has(item.id), inProgress: runningIds.has(item.id) }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
  const lateness = Math.max(0, bestFinish - session.target);
  const nextTask = tasks.filter((item) => !item.completed).sort((a, b) => a.end - b.end || a.start - b.start)[0] ?? null;
  // Deliberately simple reference: perform every remaining stage one at a time.
  // This is not a claim about how skilled cooks normally work.
  let serialFinish = Math.max(session.now, ...fixed.map((item) => item.end));
  const serialPlaced = new Map(initial);
  let serialRemaining = [...pending];
  while (serialRemaining.length) {
    const item = serialRemaining.find((candidate) => candidate.deps.every((id) => serialPlaced.has(id)));
    if (!item) break;
    const release = Math.max(serialFinish, ...item.deps.map((id) => serialPlaced.get(id).end));
    const start = earliest(item, release, fixedReservations, capacities);
    const record = { ...item, start, end: start + item.duration };
    serialPlaced.set(item.id, record);
    serialFinish = record.end;
    serialRemaining = serialRemaining.filter((candidate) => candidate.id !== item.id);
  }
  return {
    tasks, finish: bestFinish, lateness, feasible: lateness === 0,
    reason: lateness ? `Dinner is estimated ${lateness} minutes after your target. The schedule respects the available resources; change the side or serving time to repair the deadline.` : 'All task dependencies and resource limits fit the serving target.',
    nextTask, variant: session.variant,
    metrics: { solver: 'bounded serial-schedule search', searchNodes: nodes, nodeBudget: SEARCH_BUDGET,
      searchComplete: !limitReached, searchLimited: limitReached, bounded: true, optimalityCertified: false, scheduled: true,
      taskCount: tasks.length, activeMinutes: tasks.reduce((sum, item) => sum + (item.resources.cook ?? 0) * item.duration, 0),
      ovenMinutes: tasks.reduce((sum, item) => sum + (item.resources.oven ?? 0) * item.duration, 0),
      slack: session.target - bestFinish, estimatedDurations: true,
      serialBaselineFinish: serialFinish, parallelMinutesSaved: serialFinish - bestFinish,
      serialBaselineLabel: 'All remaining stages performed one at a time; not a human-performance benchmark' },
  };
}

function applyChange(session, rawChange) {
  const next = copy(session);
  const change = copy(rawChange);
  switch (change.type) {
    case 'setup':
      if (change.target !== undefined) next.target = requireMinute(change.target, 'Serving time');
      if (change.cooks !== undefined) next.cooks = requireCount(change.cooks, 'Cooks');
      if (change.variant !== undefined) {
        if (!['salad', 'roast'].includes(change.variant)) throw new Error('Choose roast or salad.');
        if (next.completed.some((item) => item.id === 'serve')) throw new Error('Dinner has already been served. Start a new session to change its menu.');
        next.variant = change.variant;
      }
      break;
    case 'oven-delay': {
      requireMinute(change.minutes, 'Oven delay', { zero: false });
      const end = next.now + change.minutes;
      // Merge overlapping oven-unavailable intervals so repeated reports do not
      // accidentally count the same physical oven twice.
      let start = next.now;
      let finish = end;
      next.blocks = next.blocks.filter((block) => {
        if (block.resource !== 'oven' || block.start > finish || block.end < start) return true;
        start = Math.min(start, block.start); finish = Math.max(finish, block.end); return false;
      });
      next.blocks.push({ id: `oven-block-${next.revision + 1}`, resource: 'oven', start, end: finish, units: 1 });
      break;
    }
    case 'swap-side':
      if (!['salad', 'roast'].includes(change.variant)) throw new Error('Choose roast or salad.');
      if (next.completed.some((item) => item.id === 'serve')) throw new Error('Dinner has already been served. Start a new session to change its menu.');
      next.variant = change.variant;
      break;
    case 'target': next.target = requireMinute(change.value, 'Serving time'); break;
    case 'cooks': next.cooks = requireCount(change.value, 'Cooks'); break;
    case 'delay': {
      requireMinute(change.minutes, 'Task delay', { zero: false });
      const item = definitions(next).find((candidate) => candidate.id === change.taskId);
      if (!item) throw new Error('That task is not in the current plan.');
      if ([...next.completed, ...next.inProgress].some((record) => record.id === change.taskId))
        throw new Error('A completed or in-progress interval is frozen. This demo can extend only a task that has not started.');
      next.delays[change.taskId] = (next.delays[change.taskId] ?? 0) + change.minutes;
      break;
    }
    default: throw new Error('Unknown plan change.');
  }
  validate(next);
  return next;
}

function fingerprint(session) {
  const value = JSON.stringify({ revision: session.revision, now: session.now, target: session.target,
    cooks: session.cooks, burners: session.burners, variant: session.variant, blocks: session.blocks,
    completed: session.completed, inProgress: session.inProgress, delays: session.delays });
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}
function stateSnapshot(session) {
  const { history, events, ...state } = copy(session);
  return state;
}

export function proposeChange(input, change) {
  const session = createSession(input);
  const next = applyChange(session, change);
  const before = getPlan(session);
  const after = getPlan(next);
  const summaries = {
    setup: `Apply dinner setup: ${formatTime(next.target)}, ${next.cooks} ${next.cooks === 1 ? 'cook' : 'cooks'}, ${next.variant === 'salad' ? 'fresh salad' : 'roast carrots'}`,
    'oven-delay': `Reserve the oven for ${change.minutes} more minutes`,
    'swap-side': `Switch the side to ${change.variant === 'salad' ? 'fresh cucumber tomato salad' : 'roast carrots'}`,
    target: `Move the serving target to ${formatTime(change.value)}`,
    cooks: `Plan with ${change.value} ${change.value === 1 ? 'cook' : 'cooks'}`,
    delay: `Allow ${change.minutes} extra minutes for ${change.taskId}`,
  };
  const changes = [];
  if (before.finish !== after.finish)
    changes.push(`Estimated finish: ${formatTime(before.finish)} → ${formatTime(after.finish)}.`);
  if (before.variant !== after.variant) changes.push(`Side: ${before.variant} → ${after.variant}.`);
  const beforeById = new Map(before.tasks.map((item) => [item.id, item]));
  const moved = after.tasks.filter((item) => beforeById.has(item.id) && beforeById.get(item.id).start !== item.start && !item.completed).length;
  if (moved) changes.push(`${moved} upcoming ${moved === 1 ? 'step moves' : 'steps move'} in the timeline.`);
  if (session.completed.length) changes.push(`${session.completed.length} completed ${session.completed.length === 1 ? 'step stays' : 'steps stay'} unchanged.`);
  if (!after.feasible) changes.push(after.reason);
  if (!changes.length) changes.push('The current task timings do not need to move.');
  const baseFingerprint = fingerprint(session);
  return { id: `proposal-${session.revision}-${baseFingerprint}-${fingerprint(next)}`,
    baseRevision: session.revision, baseFingerprint, change: copy(change), before, after,
    summary: `${summaries[change.type]}.`, changes };
}

export function commitProposal(input, proposal) {
  const session = createSession(input);
  if (!proposal || proposal.baseRevision !== session.revision || proposal.baseFingerprint !== fingerprint(session))
    throw new Error('This proposal is stale. Review a fresh proposal before confirming.');
  const next = applyChange(session, proposal.change);
  const expected = `proposal-${session.revision}-${fingerprint(session)}-${fingerprint(next)}`;
  if (proposal.id !== expected) throw new Error('This proposal changed after review. Create a fresh proposal.');
  next.revision = session.revision + 1;
  next.history.push({ type: 'change', change: copy(proposal.change), previous: stateSnapshot(session) });
  next.events.push({ type: 'change', at: session.now, revision: next.revision,
    summary: proposal.summary, change: copy(proposal.change) });
  return next;
}

/** Advance the DEMO TIMELINE through a selected task's scheduled end.
 * Every task ending by that instant becomes completed; overlapping tasks become
 * inProgress and keep their exact original intervals. This is an explicit
 * simulation action, never a claim that a device sensed real cooking progress.
 */
export function completeTask(input, id) {
  const session = createSession(input);
  const plan = getPlan(session);
  const selected = plan.tasks.find((item) => item.id === id);
  if (!selected) throw new Error('That task is not in the current plan.');
  if (selected.completed) return session;
  if (!plan.metrics.scheduled) throw new Error('Repair the resource conflict before advancing the demo.');
  if (!Number.isFinite(selected.end)) throw new Error('Repair the resource conflict before advancing the demo.');
  const next = copy(session);
  next.now = selected.end;
  next.completed = plan.tasks.filter((item) => item.completed || item.end <= next.now).map((item) => ({ ...copy(item), completed: true, inProgress: false }));
  next.inProgress = plan.tasks.filter((item) => item.start < next.now && item.end > next.now).map((item) => ({ ...copy(item), completed: false, inProgress: true }));
  next.revision++;
  next.history.push({ type: 'progress', taskId: id, at: next.now });
  next.events.push({ type: 'progress', at: next.now, revision: next.revision, taskId: id,
    summary: `Demo clock advanced to ${formatTime(next.now)}; ${next.completed.length - session.completed.length} scheduled steps marked complete.` });
  return next;
}

export function undoChange(input) {
  const session = createSession(input);
  const latest = session.history.at(-1);
  if (!latest) throw new Error('There is no plan change to undo.');
  if (latest.type !== 'change')
    throw new Error('Cooking progress occurred after the last plan change. Undo is blocked so completed work cannot be erased. Make a new proposal instead.');
  const restored = { ...copy(latest.previous), revision: session.revision + 1,
    history: copy(session.history.slice(0, -1)), events: copy(session.events) };
  restored.events.push({ type: 'undo', at: restored.now, revision: restored.revision,
    summary: 'Undid the latest plan change; all earlier cooking progress remains recorded.' });
  return restored;
}

export function formatTime(minutes) {
  if (!Number.isFinite(minutes)) return 'Not schedulable';
  const total = Math.round(minutes);
  const day = Math.floor(total / 1440);
  const hour = Math.floor((total % 1440) / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}${day ? ` (+${day}d)` : ''}`;
}

import { auditSchedule } from './vendor/plan-audit.mjs';

/** Domain adapter for https://github.com/RuoyunHe/plan-audit (MIT).
 * A deadline miss is not a schedule invariant failure. Check metrics.scheduled.
 * This independently checks solver output; it does not generate or repair a plan.
 */
export function auditPlan(session, plan) {
  if (plan?.metrics?.scheduled === false) {
    return {
      ok: false,
      violations: [{ code: 'UNSCHEDULED_PLAN', taskIds: [],
        message: plan.reason || 'The solver could not produce a complete schedule.' }],
      summary: { taskCount: Array.isArray(plan.tasks) ? plan.tasks.length : 0,
        completedCount: Array.isArray(session?.completed) ? session.completed.length : 0,
        blockCount: Array.isArray(session?.blocks) ? session.blocks.length : 0,
        start: null, end: null, span: 0, resourcesChecked: 0, violationCount: 1 },
    };
  }
  return auditSchedule({
    tasks: plan?.tasks,
    capacities: { cook: session?.cooks, burner: session?.burners, oven: 1 },
    blocks: Array.isArray(session?.blocks)
      ? session.blocks.map(block => block && ({ ...block, units: block.units ?? 1 }))
      : session?.blocks,
    previousCompleted: session?.completed,
  });
}

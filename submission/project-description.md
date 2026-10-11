# SupperShift

**Tagline:** Dinner plans that survive real life.

**Primary track:** Alexa+ — simulated experience. **Intended mini challenge:** Open Source, through the independently reusable [Plan Audit component](https://github.com/RuoyunHe/plan-audit), now published in a verified public repository. The formal Devpost competition submission has not yet been completed.

## Inspiration

A recipe tells you what to cook. It rarely tells you what to do when one person is preparing several dishes, the shared oven is occupied, and the plan changes halfway through the evening. SupperShift explores a focused conversational experience for that moment: explain the tradeoff, preserve progress, and help someone take the next useful action.

## What it does

SupperShift plans a lemon chickpea supper with rice and a choice of roast carrots or fresh salad. It schedules hands-on preparation and passive cooking against actual resource constraints: available cooks, two burners, one oven, task dependencies, and the serving target.

In the default example, dinner can finish at 18:44. Reporting that the oven is busy for 20 minutes moves the estimate to 19:04—four minutes past the target. The assistant admits the problem. Switching to the authored salad alternative gives a new 18:32 estimate, with a before-and-after preview before anything changes.

“Where was I?” returns completed work, ongoing tasks, and the next useful step. Changes have an audit trail and can be undone, provided undo would not erase subsequent progress. The state survives a page reload on the same browser. A timeline complements the conversation, and the plan can be downloaded as text.

## How it works

The application is plain HTML, CSS, and JavaScript ES modules. It has no third-party package dependencies or required paid services. A browser-local domain engine models each meal as a dependency graph with active and passive stages. A bounded scheduling search finds resource-compliant candidate plans and exposes whether its 1,800-node limit was reached; it does not claim a globally optimal solution.

The conversational layer is deliberately deterministic. Supported phrases become structured changes, and an ambiguous request receives a clarification rather than a guessed action. Confirmations include a state fingerprint and revision check so an old proposal cannot overwrite new progress. Optional browser speech can feed this same adapter, while typing and example buttons provide the reproducible interaction path.

An additional open-source contribution, [Plan Audit](https://github.com/RuoyunHe/plan-audit), independently checks the structured schedule against time, dependency, capacity, reservation, and completed-work invariants. The MIT-licensed module is framework- and domain-agnostic, has no runtime dependencies, and includes a CLI, original example, and its own tests. SupperShift vendors it with its license and maps kitchen state through a small adapter; it can also check schedules outside this application.

## What was challenging

Replanning becomes misleading if it silently moves work that already happened. SupperShift therefore preserves completed and ongoing intervals, even when a later menu no longer needs an earlier preparation step. It also distinguishes a valid schedule that misses the serving target from a plan that cannot be scheduled at all.

The demo clock required equal care. Advancing a step also records other steps that would have finished by that instant and preserves overlapping passive work. It is explicitly a simulation action, not a claim that an appliance or camera observed progress.

## What was validated

All 32 application tests passed: 14 engine tests, 10 conversation and review tests, and 8 independent-audit integration tests. They include 36 generated combinations of resources, menus, and oven calendars, plus deliberately damaged solver output. They check dependencies, resource limits, late and impossible plans, immutability, progress preservation, stale confirmations, and undo protection. Plan Audit's separate reusable package has 12 passing tests.

On one Windows x64 development machine using Node.js 20.18.0, 30-run fixtures measured p95 planning times of 1.109 ms for the default meal, 62.976 ms for the oven delay, and 49.807 ms for the salad repair. These are synthetic local benchmarks, not real cooking measurements or a user study. The benchmark script is included.

## What is simulated

This is an independent Alexa+ experience simulation, not a deployed Alexa+ add-on. It has no real Alexa connection, MCP endpoint, sensors, appliance controls, or runtime LLM. The app's supported conversational examples are rules-based. Optional browser speech recognition and playback have not yet been tested live; the browser provider may require an online service. Authored meal durations are estimates and make no food-safety or dietary guarantees.

The independent audit uses current capacity for the full timeline. A crew reduction below historical concurrent use can therefore be rejected; dynamic capacity history is not modeled. This fail-closed behavior preserves an explicit limitation instead of silently approving a plan the checker cannot establish.

The project was created during the hackathon window with substantial AI assistance from Codex, including implementation, tests, copy, and demonstration content. The included source and validation make that assistance inspectable.

## What comes next

The next useful evidence would come from observing people follow and interrupt the plan in real kitchens, then refining task durations and clarification behavior. A larger library of independently checked meal graphs and a genuine Alexa+ integration would follow. Neither those studies nor that integration are claimed in this submission.

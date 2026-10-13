# SupperShift

**Tagline:** Dinner plans that survive real life.

**Primary track:** Alexa+ — simulated experience. **Mini challenge:** Open Source, through the independently reusable [Plan Audit component](https://github.com/RuoyunHe/plan-audit). **Status:** Formally submitted on 11 October 2026; Devpost displayed “Project submitted!” for the [public project](https://devpost.com/software/suppershift-dinner-plans-that-survive-real-life). Required fields, including Additional info and the public video, are complete. Organizer eligibility approval and awards are not claimed.

**Local revision, 13 October 2026:** the improvements and checks below describe the latest local source. Deployment and online verification of this revision are pending. The published 11 October video remains valid for the earlier release; this revised description has not yet been confirmed as synchronized to Devpost.

## Inspiration

A recipe tells you what to cook. It rarely tells you what to do when one person is preparing several dishes, the shared oven is occupied, and the plan changes halfway through the evening. SupperShift explores a focused conversational experience for that moment: explain the tradeoff, preserve progress, and help someone take the next useful action.

## What it does

SupperShift plans a lemon chickpea supper with rice and a choice of roast carrots or fresh salad. It schedules hands-on preparation and passive cooking against actual resource constraints: available cooks, two burners, one oven, task dependencies, and the serving target.

In the default example, dinner can finish at 18:44. Reporting that the oven is busy for 20 minutes moves the estimate to 19:04—four minutes past the target. The assistant admits the problem and automatically compares two audited recovery choices: keep the roast and move dinner later, or switch to the authored salad alternative to finish at 18:32. Both produce a preview; the user must confirm before either change takes effect.

“Where was I?” returns completed work, ongoing tasks with their remaining time, and the next useful step. Focus on cooking brings that next step forward. Changes have an audit trail and can be undone, provided undo would not erase subsequent progress. The state and a verified unconfirmed preview survive reload on the same browser without silently applying the preview. A timeline complements the conversation, and the plan can be downloaded as text.

## How it works

The application is plain HTML, CSS, and JavaScript ES modules. It has no third-party package dependencies or required paid services. A browser-local domain engine models each meal as a dependency graph with active and passive stages. A bounded scheduling search finds resource-compliant candidate plans and exposes whether its 1,800-node limit was reached; it does not claim a globally optimal solution.

The conversational layer is deliberately deterministic. Supported phrases become structured changes, and an ambiguous request receives a clarification rather than a guessed action. Confirmations include a state fingerprint and revision check so an old proposal cannot overwrite new progress. Restoring a pending preview recomputes its estimates and verifies its identity against the saved revision and fingerprint; an unverifiable preview is discarded. Recovery options are independently audited before being offered. Optional browser speech can feed this same adapter, while typing and example buttons provide the reproducible interaction path.

If another tab updates the saved kitchen, the current tab pauses changes and asks the user to refresh the saved state. Local browser checks confirmed that a stale oven proposal could not overwrite another tab's progress. This local guard does not claim transactional multi-tab or multi-device synchronization.

An additional open-source contribution, [Plan Audit](https://github.com/RuoyunHe/plan-audit), independently checks the structured schedule against time, dependency, capacity, reservation, and completed-work invariants. The MIT-licensed module is framework- and domain-agnostic and has no runtime dependencies. Its latest local examples include shared laboratory equipment: a valid plan passes, while a plan demanding three simultaneous centrifuges with capacity two returns `RESOURCE_OVERLOAD` and CLI exit code 1. The source README provides complete-repository test instructions. SupperShift vendors the checker with its license and maps kitchen state through a small adapter.

## What was challenging

Replanning becomes misleading if it silently moves work that already happened. SupperShift therefore preserves completed and ongoing intervals, even when a later menu no longer needs an earlier preparation step. It also distinguishes a valid schedule that misses the serving target from a plan that cannot be scheduled at all.

The demo clock required equal care. Advancing a step also records other steps that would have finished by that instant and preserves overlapping passive work. It is explicitly a simulation action, not a claim that an appliance or camera observed progress.

## What was validated

All 43 application tests and 13 standalone Plan Audit tests passed on 13 October 2026. They include 36 generated combinations of resources, menus, and oven calendars, deliberately damaged solver output, recovery options, pending-preview identity restoration, and numeric boundaries. They check dependencies, resource limits, late and impossible plans, immutability, progress preservation, stale confirmations, and undo protection.

Local Chrome checks exercised both recovery choices, the salad finish at 18:32, and an unconfirmed preview surviving reload without applying itself. Reload also preserved progress at 18:06 and showed two minutes of oven preheating remaining. A simulated 375px viewport had document scroll width 375px and 44px-high recovery buttons. These are browser checks, not physical-phone testing. The revised source has not yet been deployed or verified online.

On 11 October, one Windows x64 development machine using Node.js 20.18.0 measured p95 planning times of 1.109 ms for the default meal, 62.976 ms for the oven delay, and 49.807 ms for the salad repair across 30-run fixtures. These are earlier-release synthetic local benchmarks, not new-version timings, real cooking measurements, or a user study. The benchmark script is included. The [published 156.88-second video](https://youtu.be/LDKdcPvShlE) also shows that earlier release and remains available with English narration and subtitles.

## What is simulated

This is an independent Alexa+ experience simulation, not a deployed Alexa+ add-on. It has no real Alexa connection, MCP endpoint, sensors, appliance controls, or runtime LLM. The app's supported conversational examples are rules-based. Optional browser speech recognition and playback have not yet been tested live; the browser provider may require an online service. Authored meal durations are estimates and make no food-safety or dietary guarantees.

The independent audit uses current capacity for the full timeline. A crew reduction below historical concurrent use can therefore be rejected; dynamic capacity history is not modeled. This fail-closed behavior preserves an explicit limitation instead of silently approving a plan the checker cannot establish.

The project was created during the hackathon window with substantial AI assistance from Codex, including implementation, tests, copy, and demonstration content. The included source and validation make that assistance inspectable.

## What comes next

The next useful evidence would come from observing people follow and interrupt the plan in real kitchens, then refining task durations and clarification behavior. A larger library of independently checked meal graphs and a genuine Alexa+ integration would follow. Neither those studies nor that integration are claimed in this submission.

# SupperShift

**Dinner plans that survive real life.**

SupperShift is an independent Alexa+ experience simulation with a working kitchen scheduler. Tell it that the oven is busy, review a revised finish time, and swap roast carrots for fresh salad to repair the deadline. It keeps completed work, explains the next step, and makes changes reversible when doing so would not erase progress.

This project uses the hackathon's [Alexa+ web-simulation option](https://amazonappdev2026.devpost.com/rules). It does **not** connect to Alexa+, an MCP server, appliances, sensors, or a cloud model. Its conversational adapter recognizes a bounded set of phrases; it is not an LLM. Development—including code, tests, documentation, and demo content—was AI-assisted with Codex.

## Run locally

Use Node.js 20 or later; the recorded checks used Node.js 20.18.0. There are no package dependencies, installation step, API keys, build step, or required cloud services.

```sh
npm start
```

Open **http://127.0.0.1:8788**. The included server binds to your computer only. Alternatively, serve the `dist/` directory with a static HTTP server. Do not open `index.html` directly as a `file:` URL: browser ES modules need an HTTP origin. The files in `dist/` are the editable application source, not generated or minified output.

```sh
npm test
npm run benchmark
```

## Try the complete recovery flow

1. Choose **Reset demo**. At the demo time of 18:00, one cook and two burners can finish the roast dinner at 18:44 for a 19:00 target.
2. Choose **The oven is busy**. This example means 20 minutes. The proposal predicts 19:04; the existing plan remains unchanged until you choose **Use this plan**.
3. Choose **Use the salad instead**, review the 18:32 finish, and choose **Use this plan**.
4. Choose **Undo that change** to restore the previous menu. Reapply the salad before continuing.
5. Choose **Finish next step · demo**, then **Where was I?** Progress and context are retained. A subsequent undo is refused if it would erase cooking progress.
6. Choose **Can we eat at 6:20?** The proposal admits the target is too early. Choose **Keep current plan**.

Changing the target time, cook count, or side in the setup controls and choosing **Plan dinner** also produces a proposal. **Save plan** downloads a text copy. **What changed** opens the audit history.

## What actually runs

| Source | Responsibility |
| --- | --- |
| `dist/engine.mjs` | Authored task graphs, scheduling, proposed changes, versioned confirmation, progress and undo |
| `dist/conversation.mjs` | Deterministic intent recognition and clarification |
| `dist/audit.mjs`, `dist/vendor/plan-audit.mjs` | Domain adapter and independent schedule invariant checker; vendored MIT source from Plan Audit |
| `dist/app.mjs` | DOM interface, local persistence, optional browser speech, text export |
| `dist/index.html`, `dist/styles.css` | Accessible controls, visual timeline, original inline illustration and presentation |
| `tests/` | Engine invariants and conversation cases |
| `tools/serve.mjs`, `tools/benchmark.mjs` | Static local server and repeatable performance fixtures |

The meal contains lemon chickpeas, rice, and either roast carrots or cucumber tomato salad. Tasks separate hands-on work from passive appliance use. Dependencies, available cooks, burners, oven intervals, and completed work constrain the schedule. A deterministic serial-schedule search explores up to 1,800 nodes after generating initial candidate plans. It reports when that limit is reached and **does not certify global optimality**.

State changes follow `proposeChange` → `commitProposal`. A revision and state fingerprint reject stale confirmations. The demo-progress action advances the clock through a chosen task's scheduled end, marks all steps ending by that instant complete, and freezes overlapping work as in progress. Time does not advance in the background. A newly unavailable oven that conflicts with an already running oven task is rejected by the UI; the prototype does not invent a way to interrupt cooking.

## Verified evidence and limits

All 32 application tests passed on 11 October 2026: 14 engine tests, 10 conversation and review tests, and 8 independent-audit integration tests. The engine fixtures include 36 generated combinations of menu, resource capacity, and oven availability. Checks cover dependency order, resource capacity, impossible deadlines, frozen progress, stale proposals, immutability, and undo. The independent checker accepts baseline, delayed, salad, and progress-preserving plans and rejects deliberately overbooked or corrupted solver output. Run the whole suite for the current total.

Local benchmark: Windows x64, Node.js 20.18.0, 30 samples per fixture, measured 11 October 2026 at 03:15 UTC. These are **this machine's synthetic fixture results**, not a user study or measured real-kitchen savings.

| Fixture | Estimated meal finish | Median planning time | p95 planning time |
| --- | --- | --- | --- |
| Default roast dinner | 18:44 | 0.678 ms | 1.109 ms |
| Oven unavailable for 20 minutes | 19:04 | 38.567 ms | 62.976 ms |
| Salad replacement after the oven delay | 18:32 | 32.328 ms | 49.807 ms |

The benchmark also reports a fully sequential reference that performs all remaining stages one at a time. It is an intentionally simple comparison, not a model of a skilled cook. Durations and food instructions are authored demonstration estimates, not food-safety, nutrition, or allergy guidance.

Keyboard and example-button interaction are the primary reproducible path. Optional speech recognition and synthesis are implemented through browser APIs but **have not yet been verified with a live microphone or spoken playback**. Support varies, and the browser provider may send audio to an online service. No Alexa voice or device integration is claimed.

The audit adapter applies the session's current resource capacities to the entire supplied timeline, including completed work. Capacity history is simplified: reducing the crew below an earlier concurrent usage can therefore be rejected even when future work would fit. This is a deliberate fail-closed limitation, not proof that the historical schedule was invalid. Keep the recorded capacity or start a new demo session for that case. A late but resource-compliant schedule passes the invariant audit; an unschedulable result returns an explicit `UNSCHEDULED_PLAN` diagnostic. The audit is not a food-safety or optimality certification.

## Intended Open Source mini-challenge contribution

[Plan Audit](https://github.com/RuoyunHe/plan-audit) is an additional, independently reusable MIT-licensed component created for this project. It is a framework- and domain-agnostic JavaScript module that checks task intervals, dependencies, aggregate resource capacity, external reservations, and preservation of completed tasks without generating a schedule or calling any external service. Its standalone package includes a file-based CLI, an original dinner example, documentation, and 12 passing tests.

SupperShift vendors its original module at `dist/vendor/plan-audit.mjs` with the license alongside it and uses `dist/audit.mjs` to map kitchen state into the generic contract. Integration tests exercise the real planner output and deliberately damaged plans. The component is published in the [public Plan Audit repository](https://github.com/RuoyunHe/plan-audit), with source, tests, documentation, example, and MIT license verified at [commit 4073945](https://github.com/RuoyunHe/plan-audit/commit/4073945b6a682163a0a8e9791c7ca0d302b5dabe). It is the intended Open Source mini-challenge contribution; the formal Devpost competition submission has not yet been completed. This additional contribution is separate from the main Alexa+ simulation.

## Data and cost

The planner and text interaction run locally. The browser stores the demo state and the latest 40 conversation messages in local storage under `suppershift-v1`; **Reset demo** replaces them with a fresh session. There is no application analytics, account system, or remote planning endpoint. Optional speech has the browser-provider behavior described above. The prototype requires no project-specific paid API or cloud runtime.

## Submission materials

Prepared English copy, product feedback, a timed recording script, and remaining release checks are in `submission/`. A public repository URL, recorded video URL, and final Devpost submission must still be verified before delivery; local preparation does not establish submission completion.

License: [MIT](LICENSE). Copyright 2026 Ruoyun He.

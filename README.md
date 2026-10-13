# SupperShift

**Dinner plans that survive real life.**

[Try the live demo](https://ruoyunhe.github.io/suppershift/) · [Watch the demo video](https://youtu.be/LDKdcPvShlE) · [Browse the source](https://github.com/RuoyunHe/suppershift) · [View the submitted project](https://devpost.com/software/suppershift-dinner-plans-that-survive-real-life)

SupperShift is an independent Alexa+ experience simulation with a working kitchen scheduler. Tell it that the oven is busy, review a revised finish time, and swap roast carrots for fresh salad to repair the deadline. It keeps completed work, explains the next step, and makes changes reversible when doing so would not erase progress.

**13 October update:** the local version now compares recovery choices, restores verified pending previews after reload, and shows remaining time for work already in progress. These changes have passed local tests and Chrome checks; they have not yet been deployed to the public demo. The linked video remains the valid 11 October demonstration.

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
3. In the local 13 October version, compare the automatically calculated recovery cards: keep the roast and move dinner later, or keep the serving target and switch to salad. Choose **Review salad option** to preview the 18:32 finish; choosing a card does not apply it.
4. Reload while the preview is open. The pending proposal is recomputed and its identity checked, then restored for review without being applied. Choose **Use this plan** to confirm it.
5. Choose **Undo that change** to restore the previous menu. Reapply the salad before continuing.
6. Choose **Finish next step · demo**, then **Where was I?** Completed work and ongoing intervals are retained; a running step shows its remaining time rather than instructions to start again. **Focus on cooking** brings the next step forward. Undo is refused if it would erase cooking progress.
7. Choose **Can we eat at 6:20?** The proposal admits the target is too early. Choose **Keep current plan**.

Changing the target time, cook count, or side in the setup controls and choosing **Plan dinner** also produces a proposal. **Save plan** downloads a text copy. **What changed** opens the audit history.

## What actually runs

| Source | Responsibility |
| --- | --- |
| `dist/engine.mjs` | Authored task graphs, scheduling, proposed changes, versioned confirmation, progress and undo |
| `dist/conversation.mjs` | Deterministic intent recognition and clarification |
| `dist/experience.mjs` | Audited recovery choices, verified pending-preview restoration, and remaining-time language |
| `dist/audit.mjs`, `dist/vendor/plan-audit.mjs` | Domain adapter and independent schedule invariant checker; vendored MIT source from Plan Audit |
| `dist/app.mjs` | DOM interface, local persistence, optional browser speech, text export |
| `dist/index.html`, `dist/styles.css` | Accessible controls, visual timeline, original inline illustration and presentation |
| `tests/` | Engine invariants and conversation cases |
| `tools/serve.mjs`, `tools/benchmark.mjs` | Static local server and repeatable performance fixtures |

The meal contains lemon chickpeas, rice, and either roast carrots or cucumber tomato salad. Tasks separate hands-on work from passive appliance use. Dependencies, available cooks, burners, oven intervals, and completed work constrain the schedule. A deterministic serial-schedule search explores up to 1,800 nodes after generating initial candidate plans. It reports when that limit is reached and **does not certify global optimality**.

State changes follow `proposeChange` → `commitProposal`. A revision and state fingerprint reject stale confirmations. Recovery candidates are computed and independently audited before being offered, then wait for review and confirmation. Reload restores the requested change and review identity, recomputes the proposal, and rejects it if that identity no longer matches; serialized estimates are not trusted. The demo-progress action advances the clock through a chosen task's scheduled end, marks all steps ending by that instant complete, and freezes overlapping work as in progress. Time does not advance in the background. A newly unavailable oven that conflicts with an already running oven task is rejected by the UI; the prototype does not invent a way to interrupt cooking.

If another tab changes the saved kitchen, this tab pauses updates and asks the user to **Refresh saved kitchen** before continuing. A local Chrome check confirmed that an old oven proposal could not overwrite another tab's 18:06 progress; refreshing restored the running oven step with two minutes remaining and cleared the pending proposal. This is a local conflict guard, not transactional multi-tab or multi-device synchronization.

## Verified evidence and limits

All **43 application tests and 13 standalone Plan Audit tests passed on 13 October 2026**. The engine fixtures include 36 generated combinations of menu, resource capacity, and oven availability. Checks cover dependency order, resource capacity, impossible deadlines, frozen progress, stale proposals, immutability, undo, recovery candidates, reload identity checks, and numeric boundaries. The independent checker accepts valid plans and rejects deliberately corrupted output. The laboratory CLI fixture proves that an overbooked plan returns `RESOURCE_OVERLOAD` and exit code 1.

On 13 October, actual local Chrome checks verified both recovery choices and the salad finish at 18:32; an unconfirmed preview survived reload without applying itself. Progress survived reload at 18:06 with oven preheating showing two minutes remaining. In a simulated 375px viewport, document scroll width was 375px and recovery buttons were 44px high. This is browser viewport and geometry verification, not testing on a physical phone.

The existing [live GitHub Pages deployment](https://ruoyunhe.github.io/suppershift/) was verified on 11 October with the independent audit module and an 18:32 salad repair. Source commit `bd17888` and deployment commit `a2f863a` identify that earlier verified release. The 13 October local improvements await deployment and online verification.

The [11 October public demo video](https://youtu.be/LDKdcPvShlE) remains available: 156.88 seconds at 720p, assembled from nine real UI screenshots with English synthetic narration and 41 imported English subtitle entries. YouTube confirmed publication, and playback was verified on its published page. It demonstrates the earlier release, not the new recovery cards, reload improvements, or optional live microphone/speech-playback functions.

Local benchmark: Windows x64, Node.js 20.18.0, 30 samples per fixture, measured 11 October 2026 at 03:15 UTC. These are **this machine's synthetic fixture results**, not a user study or measured real-kitchen savings.

| Fixture | Estimated meal finish | Median planning time | p95 planning time |
| --- | --- | --- | --- |
| Default roast dinner | 18:44 | 0.678 ms | 1.109 ms |
| Oven unavailable for 20 minutes | 19:04 | 38.567 ms | 62.976 ms |
| Salad replacement after the oven delay | 18:32 | 32.328 ms | 49.807 ms |

The benchmark also reports a fully sequential reference that performs all remaining stages one at a time. It is an intentionally simple comparison, not a model of a skilled cook. Durations and food instructions are authored demonstration estimates, not food-safety, nutrition, or allergy guidance.

Keyboard and example-button interaction are the primary reproducible path. Optional speech recognition and synthesis are implemented through browser APIs but **have not yet been verified with a live microphone or spoken playback**. Support varies, and the browser provider may send audio to an online service. No Alexa voice or device integration is claimed.

The audit adapter applies the session's current resource capacities to the entire supplied timeline, including completed work. Capacity history is simplified: reducing the crew below an earlier concurrent usage can therefore be rejected even when future work would fit. This is a deliberate fail-closed limitation, not proof that the historical schedule was invalid. Keep the recorded capacity or start a new demo session for that case. A late but resource-compliant schedule passes the invariant audit; an unschedulable result returns an explicit `UNSCHEDULED_PLAN` diagnostic. The audit is not a food-safety or optimality certification.

## Open Source mini-challenge contribution

[Plan Audit](https://github.com/RuoyunHe/plan-audit) is an additional, independently reusable MIT-licensed component created for this project. It is a framework- and domain-agnostic JavaScript module that checks task intervals, dependencies, aggregate resource capacity, external reservations, and preservation of completed tasks without generating a schedule or calling any external service. The local 13 October package has 13 passing tests, a file-based CLI, the dinner example, and paired valid/overloaded shared-laboratory examples. The laboratory cases differ only in one centrifuge task's timing: moving it earlier needs three machines where only two exist, producing an explicit exit-code-1 rejection. The README explains how to reproduce from the complete repository rather than accepting a zero-test run from a runtime-only package.

SupperShift vendors its original module at `dist/vendor/plan-audit.mjs` with the license alongside it and uses `dist/audit.mjs` to map kitchen state into the generic contract. Integration tests exercise the real planner output and deliberately damaged plans. The component is published in the [public Plan Audit repository](https://github.com/RuoyunHe/plan-audit), with source, tests, documentation, example, and MIT license verified at [commit 4073945](https://github.com/RuoyunHe/plan-audit/commit/4073945b6a682163a0a8e9791c7ca0d302b5dabe). It was submitted as the additional Open Source mini-challenge contribution on 11 October 2026, alongside the main Alexa+ simulation. Submission does not establish organizer eligibility approval or an award.

## Data and cost

The planner and text interaction run locally. The browser stores the demo state, latest 40 conversation messages, and pending review identity in local storage under `suppershift-v1`; **Reset demo** replaces them with a fresh session. Pending plans are recomputed and checked on restoration. There is no application analytics, account system, or remote planning endpoint. Optional speech has the browser-provider behavior described above. The prototype requires no project-specific paid API or cloud runtime.

## Submission materials

English copy, product feedback, a timed recording script, and the submission record are in `submission/`. The public source, live demo, and public video are verified. All required fields, including Additional info, were completed, and Devpost confirmed “Project submitted!” on 11 October 2026 for Alexa+ and the Open Source mini challenge. The [public project](https://devpost.com/software/suppershift-dinner-plans-that-survive-real-life) has project ID 1230270; the confirmation screenshot is saved at `evidence/submitted.jpg`. Organizer eligibility review and awards remain unconfirmed.

License: [MIT](LICENSE). Copyright 2026 Ruoyun He.

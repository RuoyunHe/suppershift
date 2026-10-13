# Product feedback

Prepared 11 October 2026; updated with local validation on 13 October 2026. This report distinguishes tools actually used from documentation researched. The project follows the simulated-experience route; it does not claim an Alexa SDK deployment or a failed live integration. The 13 October improvements await deployment and online verification.

## Tools used

| Tool or surface | Use and observed experience | Improvements and future use |
| --- | --- | --- |
| Codex AI coding assistance | Assisted with concept development, source implementation, tests, and submission materials. Parallel work on independent modules made the small prototype practical. Generated work still needed explicit API contracts and invariant checks. | Use again for a similar prototype, with tests, transparent AI disclosure, and review of factual claims. No OpenAI API is called by the application. |
| JavaScript, HTML, CSS, browser local storage | Built the static application without a backend. The local 13 October version recomputes and identity-checks pending previews on reload, retains ongoing-task remaining time, and pauses when another tab changes the saved kitchen. Actual Chrome checks confirmed these behaviors. | Useful for a small, inspectable simulator. A conflict guard and explicit refresh help preserve progress; local storage is not transactional multi-tab or household synchronization. |
| Node.js built-in HTTP server, test runner, and performance clock | Served the source locally without package installation. Full suites passed on 13 October: 43 SupperShift tests and 13 Plan Audit tests. The separately recorded planning benchmark remains dated 11 October. | Use again for reproducibility. Keep fresh test evidence distinct from older performance measurements; the included server is not production hosting. |
| GitHub repositories and GitHub Pages | Published SupperShift and Plan Audit. The 11 October online version's oven interruption → salad repair produced 18:32 with the audit passing. New recovery comparison, reload handling, and Focus behavior are locally verified but await deployment. | Preserve public access through judging and verify the changed version online after release. Simulated 375px local viewport checks passed; no physical-phone test is claimed. |
| YouTube publishing and English subtitle import | Published the [156.88-second 720p demo](https://youtu.be/LDKdcPvShlE) on 11 October using nine real UI screenshots, English synthetic narration, and 41 imported English subtitle entries. Publication and playback were verified; it remains valid for the earlier release. | Keep captions alongside narration. The video does not demonstrate the new local recovery/reload features or establish that the app's live speech APIs work. |
| Plan Audit, an additional MIT-licensed component authored for this project | Independently checks SupperShift solver output. All 13 standalone tests passed on 13 October. New valid/overloaded laboratory fixtures prove reuse beyond cooking and CLI rejection with `RESOURCE_OVERLOAD` and exit code 1; complete-repository test instructions prevent a runtime-only package's zero-test run being mistaken for verification. | Reuse for other agent-generated schedules. Aggregate checks catch three simultaneous tasks on a two-unit resource. Current-capacity auditing of historical work remains deliberately conservative; explicit time-varying capacity would be a useful extension. |
| Browser speech recognition and synthesis APIs | Optional recognition and spoken-reply adapters were implemented. Live microphone recognition and spoken playback remain unverified. | Compatibility and privacy behavior need browser-specific testing. Keep keyboard controls and clear permission-triggered activation. No speech reliability claim is made. |
| Amazon Alexa+ design and onboarding documentation | Informed the voice-first task flow and the choice to deliver a transparent simulator. Documentation was read; the Alexa CLI, SDK, and service were not executed. | Would investigate genuine integration once access and hosting requirements fit the project. The two documentation observations below are the current feedback. |

No AWS services, Kiro Crew, Alexa SDK, or paid model API were used in this project's runtime. AWS Builder is not entered. Plan Audit is the additional Open Source contribution, published in the [public repository](https://github.com/RuoyunHe/plan-audit); its new laboratory examples are part of the local 13 October revision. SupperShift source commit `bd17888` and Pages commit `a2f863a` identify the earlier verified release, whose demo and video remain available. All required fields were completed, and [SupperShift](https://devpost.com/software/suppershift-dinner-plans-that-survive-real-life) was submitted for Alexa+ and Open Source on 11 October 2026; the “Project submitted!” screenshot is `evidence/submitted.jpg`. That submission does not establish organizer eligibility approval or an award, nor deployment of the 13 October revision.

## Onboarding experience

The browser prototype starts from the repository with `npm start`, without package installation, credentials, or cloud provisioning. The meaningful first run is a working schedule and an interruption that changes its computed finish time. This describes onboarding to our simulator, not onboarding to the Amazon service.

The local 13 October flow now offers audited later-dinner and salad candidates after a confirmed interruption; a candidate must still be reviewed and explicitly applied. Chrome validation produced salad at 18:32, restored an unconfirmed preview after reload without applying it, and restored progress at 18:06 with oven preheating two minutes from completion. Focus on cooking moves the next step forward. At a simulated 375px viewport, scroll width was 375px and recovery buttons were 44px high; this is geometry verification, not a physical-device result.

Amazon's design material made the intended interaction context clear: a short conversational response alongside an understandable visual plan suited this kitchen scenario. [Alexa+ MCP Add-on Design Guide](https://www.developer.amazon.com/docs/alexaplus/add-ons/mcp-addon-design-guide.html)

## Observed friction 1: protocol version differs between documentation examples

**Task attempted:** Determine the current protocol contract before choosing an implementation route.

**Steps taken:** Read the technical requirements in the quickstart, then the lifecycle initialization request and response examples.

**Expected:** A consistent version or an explicit explanation of negotiation between versions.

**Observed:** The quickstart references MCP 2025-11-25 and Streamable HTTP; the lifecycle examples declare `protocolVersion` as `2025-03-26`. This is a documentation discrepancy we observed, not evidence of a server or handshake failure. [Quickstart](https://www.developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html), [Client and App Lifecycle](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-client-lifecycle.html)

**Severity:** Minor documentation ambiguity during implementation planning.

**Workaround:** Do not copy an older example as proof of current compatibility. This prototype selected the simulation route and makes no MCP compatibility claim.

**Suggestion:** Align the samples with the declared supported version, or annotate the older version and explain the applicable negotiation behavior.

## Observed friction 2: the route from an international prototype to a live add-on needs clearer signposting

**Task attempted:** Determine whether a Singapore-based entrant could move directly from a zero-cost local prototype into the real Alexa+ toolkit.

**Steps taken:** Read the toolkit overview and quickstart prerequisites.

**Expected:** An early, compact explanation of region availability and what local testing requires.

**Observed:** The overview states that the toolkit is available in the United States. The quickstart separately requires a remotely reachable server and an OAuth 2.1/PKCE flow. These are documented access and architecture requirements, not a failed sign-in, a denied application, or proof that hosting must be paid. We did not attempt account onboarding. [Toolkit overview](https://www.developer.amazon.com/ja/docs/alexaplus/add-ons/mcp-toolkit-overview.html), [Quickstart](https://www.developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html)

**Severity:** Important planning constraint for this entrant and prototype.

**Workaround:** Use the permitted web simulator path, retain no backend dependency, and label the boundary explicitly.

**Suggestion:** Put region availability, the difference between local simulation and live onboarding, and a documented no-charge development example together near the start of the hackathon onboarding page.

## Feature request

**Important:** A small official simulator starter with documented context persistence, action preview/confirmation, deterministic fixtures, and clear migration notes to a real add-on. That would help entrants test a meaningful customer flow while understanding exactly which production capabilities they have not exercised.

# Product feedback

Prepared 11 October 2026. This report distinguishes tools actually used from documentation researched. The project follows the simulated-experience route; it does not claim an Alexa SDK deployment or a failed live integration.

## Tools used

| Tool or surface | Use and observed experience | Improvements and future use |
| --- | --- | --- |
| Codex AI coding assistance | Assisted with concept development, source implementation, tests, and submission materials. Parallel work on independent modules made the small prototype practical. Generated work still needed explicit API contracts and invariant checks. | Use again for a similar prototype, with tests, transparent AI disclosure, and review of factual claims. No OpenAI API is called by the application. |
| JavaScript, HTML, CSS, browser local storage | Implemented the entire static application and retained demo state without accounts or a backend. The plain-module approach kept setup to a local static server. | Useful again for a small, inspectable simulator. Local storage is single-browser persistence, not household synchronization. |
| Node.js built-in HTTP server, test runner, and performance clock | Served the source locally, ran the engine checks, and measured planning fixtures without installing packages. | Use again for the development and reproducibility path. The included local server is not a production hosting system. |
| Browser speech recognition and synthesis APIs | Optional recognition and spoken-reply adapters were implemented. Live microphone recognition and spoken playback remain unverified. | Compatibility and privacy behavior need browser-specific testing. Keep keyboard controls and clear permission-triggered activation. No speech reliability claim is made. |
| Amazon Alexa+ design and onboarding documentation | Informed the voice-first task flow and the choice to deliver a transparent simulator. Documentation was read; the Alexa CLI, SDK, and service were not executed. | Would investigate genuine integration once access and hosting requirements fit the project. The two documentation observations below are the current feedback. |

No AWS services, Kiro Crew, Alexa SDK, or paid model API were used in this project's runtime. Neither AWS Builder nor the additional Open Source mini challenge is currently entered.

## Onboarding experience

The browser prototype starts from the repository with `npm start`, without package installation, credentials, or cloud provisioning. The meaningful first run is a working schedule and an interruption that changes its computed finish time. This describes onboarding to our simulator, not onboarding to the Amazon service.

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

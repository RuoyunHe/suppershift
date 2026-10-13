# Submission record

Checked against the [official rules](https://amazonappdev2026.devpost.com/rules) on **11 October 2026**. Final submission was confirmed on **11 October 2026** by Devpost's “Project submitted!” message; this record was synchronized on **13 October 2026**. Submission does not establish organizer eligibility approval or an award.

**Revision scope:** the 13 October improvements have been tested locally. The public 11 October demo and video remain valid; deployment and online verification of the new revision, and synchronization of revised Devpost copy, are still pending.

**Deadline:** 23 October 2026, 12:00 PDT = **24 October 2026, 03:00 Singapore/China time**. The judging period ends 20 November 2026, 12:00 PST. [Official schedule](https://amazonappdev2026.devpost.com/rules)

| Requirement | Current evidence or remaining work |
| --- | --- |
| Alexa+ simulated-experience route | Source implements the simulator; clearly disclosed in app and copy. No runtime SDK hook is claimed. |
| New or significantly updated work during the event | New project created 11 October 2026. Preserve the repository history. |
| Working demonstration | Local Chrome checks on 13 October verified both recovery choices, salad at 18:32, unconfirmed-preview reload without applying, and progress reload at 18:06 with two minutes of oven preheating remaining. A simulated 375px viewport had scroll width 375px and 44px recovery buttons. This is not a physical-phone test; the new revision awaits online deployment. |
| GitHub source, assets, setup instructions, open-source license or authorized private access | The earlier [SupperShift public release](https://github.com/RuoyunHe/suppershift) and Pages deployment were verified at source `bd17888` and deployment `a2f863a`. The separate [Plan Audit repository](https://github.com/RuoyunHe/plan-audit) is public. The 13 October changes, including laboratory fixtures, require publishing and online verification. |
| English description and documentation | Required English fields and Additional info were completed for project 1230270 on 11 October. Revised 13 October descriptions are prepared locally; their Devpost synchronization has not yet been confirmed. |
| Public YouTube/Vimeo video under three minutes | The valid [11 October YouTube video](https://youtu.be/LDKdcPvShlE) is 156.88 seconds at 720p, with nine real UI screenshots, English synthetic narration, and 41 subtitle entries. Publication, playback, and the Devpost video field were verified. It shows the earlier release, not the new local recovery/reload features. |
| Product feedback | Prepared with observed documentation friction only. No live integration failures fabricated. |
| Track and mini-challenge selection | Submitted on 11 October 2026: Alexa+ simulated experience and the additional Open Source mini challenge through Plan Audit. AWS Builder is not entered. Organizer eligibility approval is not claimed. |
| Free judge access through judging | Public SupperShift source, GitHub Pages, Plan Audit source, and published video playback are verified. All submitted links must remain accessible through judging. |
| Rights and permissions | Original authored demo assets, real screenshots of the project UI, English synthetic narration, and MIT source are included. |
| Registration and project | The current Devpost account is registered for the hackathon. Project ID: 1230270; [public project page](https://devpost.com/software/suppershift-dinner-plans-that-survive-real-life). |
| Final submission | Submitted on 11 October 2026. Devpost displayed “Project submitted!” after the required fields were completed. Confirmation screenshot: `evidence/submitted.jpg`. No organizer eligibility decision or award is claimed. |

The requirements above are summarized from the [official submission and testing provisions](https://amazonappdev2026.devpost.com/rules).

## Project-specific final checks

- [x] All 43 SupperShift application tests passed on 13 October; coverage includes 36 generated resource/calendar scenarios, recovery candidates, reload identity checks, audit integration, and numeric boundaries.
- [x] All 13 standalone Plan Audit tests passed on 13 October, including valid/overloaded shared-laboratory examples and the CLI exit-code-1 rejection path.
- [x] Default interruption and salad-repair fixture produces 18:44 → 19:04 → 18:32.
- [x] Benchmarks distinguish local synthetic planning performance from human outcomes.
- [x] Simulator, deterministic phrase adapter, bounded search, and AI-assisted development are disclosed.
- [x] Recipe timing is described as authored demonstration data.
- [x] Optional browser speech is marked unverified; browser-provider networking is disclosed.
- [x] Local Chrome verified automatic later-dinner/salad comparison, explicit review/confirmation, and Focus moving the next step forward.
- [x] Local Chrome verified an unconfirmed preview surviving reload without applying, and progress surviving at 18:06 with two minutes of oven preheating remaining.
- [x] Local two-tab check blocked a stale oven proposal after another tab advanced to 18:06; Refresh saved kitchen restored that progress and removed the pending proposal. This is a conflict guard, not transactional synchronization.
- [x] The 11 October public source and Pages audit-module deployment were verified at `bd17888` / `a2f863a`; the separate Plan Audit repository was published and verified.
- [x] The 11 October live oven-interruption → salad-repair flow produced 18:32 and a passed audit.
- [x] Final 156.88-second 720p video published at [YouTube](https://youtu.be/LDKdcPvShlE), with nine real UI screenshots, English synthetic narration, and 41 imported English subtitle entries; published-page playback verified.
- [x] Local simulated narrow-screen geometry verified on 13 October: viewport 375px, document scroll width 375px, recovery buttons 44px high. No physical-phone test is claimed.
- [ ] Publish the 13 October source and Plan Audit examples, deploy the revised demo, and verify the new behavior online.
- [ ] Synchronize revised description and evidence with Devpost, preserving the already confirmed submission status.
- [ ] Re-run relevant checks if source changes after the recorded passing test run.
- [x] Additional info and final required fields completed; video URL, Alexa+ and Open Source selections, public project URL, and Devpost's “Project submitted!” status confirmed on 11 October 2026.

The submitted Open Source mini-challenge entry is supported by the distinct Plan Audit component, its separate public repository, standalone tests, and actual SupperShift integration. It is not based solely on licensing the primary-track app. Devpost's submission confirmation does not imply that the organizer has confirmed eligibility or selected the project for an award.

# Submission readiness

Checked against the [official rules](https://amazonappdev2026.devpost.com/rules) on **11 October 2026**. This is a preparation checklist, not confirmation that Devpost accepted a final entry.

**Deadline:** 23 October 2026, 12:00 PDT = **24 October 2026, 03:00 Singapore/China time**. The judging period ends 20 November 2026, 12:00 PST. [Official schedule](https://amazonappdev2026.devpost.com/rules)

| Requirement | Current evidence or remaining work |
| --- | --- |
| Alexa+ simulated-experience route | Source implements the simulator; clearly disclosed in app and copy. No runtime SDK hook is claimed. |
| New or significantly updated work during the event | New project created 11 October 2026. Preserve the repository history. |
| Working demonstration | Full desktop workflow verified in an actual browser; SupperShift's GitHub Pages deployment is verified. Final narrow-screen review remains outstanding. |
| GitHub source, assets, setup instructions, open-source license or authorized private access | [SupperShift public repository](https://github.com/RuoyunHe/suppershift) and GitHub Pages deployment verified. The separate [Plan Audit public repository](https://github.com/RuoyunHe/plan-audit) is published with source, tests, documentation, example, and MIT license. |
| English description and documentation | Drafts prepared; Devpost draft 1230270 is being filled. Review the exact final fields before submission. |
| Public YouTube/Vimeo video under three minutes | A 156.59-second video was generated at `evidence/SupperShift-demo.mp4` using nine real UI screenshots and English synthetic narration. It has not been uploaded. Confirmation that the YouTube account JennyHe belongs to the user is pending; upload, public playback, and the submitted URL remain outstanding. |
| Product feedback | Prepared with observed documentation friction only. No live integration failures fabricated. |
| Track and mini-challenge selection | Intended selections: Alexa+ simulated experience and the additional Open Source mini challenge through Plan Audit. Final Devpost submission has not occurred. AWS Builder is not entered. |
| Free judge access through judging | Public SupperShift source, GitHub Pages, and Plan Audit source are verified. Public video access is pending; all submitted links must remain accessible through judging. |
| Rights and permissions | Original authored demo assets, real screenshots of the project UI, English synthetic narration, and MIT source are included. |
| Registration and draft | The current Devpost account is registered for the hackathon. Project draft ID: 1230270; details are being entered. Registration and a saved draft do not establish a final project submission. |
| Final submission | Not submitted. Complete the required fields, video link, and intended track selections, then verify Devpost's final submitted status. |

The requirements above are summarized from the [official submission and testing provisions](https://amazonappdev2026.devpost.com/rules).

## Project-specific final checks

- [x] All 32 SupperShift application tests passed, including 14 engine tests, 10 conversation/review tests, and 8 independent-audit integration tests; engine coverage includes 36 generated resource/calendar scenarios.
- [x] All 12 standalone Plan Audit tests passed.
- [x] Default interruption and salad-repair fixture produces 18:44 → 19:04 → 18:32.
- [x] Benchmarks distinguish local synthetic planning performance from human outcomes.
- [x] Simulator, deterministic phrase adapter, bounded search, and AI-assisted development are disclosed.
- [x] Recipe timing is described as authored demonstration data.
- [x] Optional browser speech is marked unverified; browser-provider networking is disclosed.
- [x] Full desktop interaction workflow verified in an actual browser.
- [x] SupperShift public repository and GitHub Pages deployment verified; separate Plan Audit repository published and verified.
- [x] Nine real UI screenshots assembled into a 156.59-second demo video with English synthetic narration at `evidence/SupperShift-demo.mp4`.
- [ ] Verify the final narrow-screen layout.
- [ ] Re-run relevant checks if source changes after the recorded passing test run.
- [ ] Confirm the YouTube account JennyHe belongs to the user, then upload the video and verify public playback and its final URL.
- [ ] Verify final Devpost project URL, required fields, track selection, and submission status.

The intended Open Source mini-challenge entry is supported by the distinct Plan Audit component, its separate public repository, standalone tests, and actual SupperShift integration. It is not based solely on licensing the primary-track app. Publication and preparation do not imply that Devpost has accepted a final entry or that the organizer has confirmed eligibility.

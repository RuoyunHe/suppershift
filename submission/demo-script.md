# SupperShift demonstration script

Target duration: **2 minutes 40 seconds**, hard cap **2 minutes 45 seconds**. Record the real running browser app. Use an English narrator and captions; no music or third-party footage is needed. A narrated line is not evidence of microphone recognition.

## Recording setup

- Start the included local server and open `http://127.0.0.1:8788`.
- Choose **Reset demo**. Keep one cook, a 19:00 target, and roast vegetables. Verify **Ready to serve: 18:44**.
- Leave optional spoken replies off. Live speech recognition has not been tested; use the visible example buttons and typing for this recording.
- Frame the plan summary, conversation, and the top of the timeline together. Hide unrelated browser tabs and personal account information.
- Show a small persistent caption: **“Alexa+ experience simulation · real local planner · demo clock.”**
- The oven interruption must precede **Finish next step · demo**. The app deliberately refuses to rewrite an oven interval already in progress.

## Exact sequence and narration

| Time | Real UI action | English narration |
| --- | --- | --- |
| 0:00–0:16 | Start on the working app. Click **The oven is busy** under “Try saying.” Show the 18:44 → 19:04 proposal. | “This dinner was on time. Then the shared oven became unavailable for twenty minutes. SupperShift recalculates the actual schedule: dinner is now four minutes late. It shows the consequence before changing anything.” |
| 0:16–0:32 | Click **Use this plan**. Let **19:04** and the late indicator become visible. Click **Use the salad instead**. | “This is a simulated Alexa+ experience with a working kitchen planner. It schedules the cook, burners, oven, and dependencies. Let's keep the dinner target by changing the side.” |
| 0:32–0:50 | Show the salad proposal, then click **Use this plan**. Point to **18:32** and the changed timeline. | “The authored salad alternative needs no oven. The estimate becomes eighteen thirty-two. I can see the changed steps, then choose whether to apply them. The assistant never silently replaces my plan.” |
| 0:50–1:06 | Click **Undo that change**. Show **19:04**. Click **Use the salad instead**, then **Use this plan**, restoring **18:32**. | “That choice is reversible. Undo restores the previous menu and its honest late finish. I'll choose the salad again.” |
| 1:06–1:28 | Click **Finish next step · demo**. Show the changed demo clock and completed rice preparation. Click **Where was I?**. | “Now I advance the explicit demo clock. This records steps that would have finished and preserves any overlapping work. ‘Where was I?’ returns my progress and the next useful step, without repeating the whole recipe.” |
| 1:28–1:43 | Click **Undo that change**. Show the message explaining why undo is blocked after progress. Optionally open **What changed**. | “Undo cannot erase cooking that has already happened. The engine refuses that reversal and keeps the history. A new proposal can change the future without rewriting the past.” |
| 1:43–2:02 | Click **Can we eat at 6:20?**. Show the late preview, then click **Keep current plan**. | “And an impossible target stays impossible. SupperShift shows the missed deadline instead of inventing a successful plan. I'll keep our current target.” |
| 2:02–2:20 | Open **How this simulation works**. Keep its disclosure legible. | “The conversational adapter uses a bounded set of phrases, not an LLM. Planning and state stay in this browser. There are no real Alexa connections, appliance sensors, or automatic cooking controls. Optional browser speech remains a separate, unverified capability.” |
| 2:20–2:40 | Show a concise overlay alongside the real app: “14 engine tests; 36 resource/calendar cases; local oven-delay p95 62.976 ms; bounded search.” End on the working repaired plan. | “Fourteen engine tests include thirty-six resource and calendar scenarios. The measured oven-delay fixture planned in under sixty-three milliseconds at the ninety-fifth percentile on this development machine. That is a synthetic benchmark, not a cooking study. SupperShift: dinner plans that survive real life.” |

## Fidelity checks before export

- The finished video must show live computation and real clicks, not a slide-only reenactment.
- Use the default fixture if retaining the specific 18:44, 19:04, and 18:32 results.
- Do not substitute recorded speech for untested microphone behavior or imply a genuine Alexa voice.
- Keep “simulated,” “estimated,” and “bounded search” disclosures visible or spoken.
- Do not claim optimality, proven human time savings, real-world user validation, or appliance integration.
- Export under 2:45 and verify that captions remain readable. The public video upload and URL still need to be completed.

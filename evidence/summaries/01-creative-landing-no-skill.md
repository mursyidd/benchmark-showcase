# Benchmark Summary — Prompt 1 Creative Landing / No Skill

## Preflight configuration

| Lane | Actual agent | Actual reasoning | Frontend skill | Service tier | Output directory status |
|---|---|---|---|---|---|
| Luna | Luna | xhigh | None | default/omitted | Empty |
| Terra | Terra | xhigh | None | default/omitted | Empty |
| Sol | Sol | high | None | default/omitted | Empty |

## Official timing

| Lane | Requested agent | Actual agent | Requested reasoning | Actual reasoning | Frontend skill | Service tier | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| Luna | Luna | not exposed | xhigh | not exposed | not exposed | not exposed | 2026-07-13T15:17:22+08:00 | 2026-07-13T15:37:15+08:00 | 1193 | 00:19:53 | Completed |
| Terra | Terra | not exposed | xhigh | not exposed | not exposed | not exposed | 2026-07-13T15:17:22+08:00 | 2026-07-13T15:33:38+08:00 | 976 | 00:16:16 | Completed |
| Sol | Sol | not exposed | high | not exposed | not exposed | not exposed | 2026-07-13T15:17:22+08:00 | 2026-07-13T15:26:22+08:00 | 540 | 00:09:00 | Completed |

- First dispatch time: 2026-07-13T15:17:22+08:00
- Last completion time: 2026-07-13T15:37:15+08:00
- Overall batch duration: 1193 seconds (00:19:53)
- Concurrent dispatch confirmation: Yes. All three dispatch requests were issued in one parallel dispatch operation.
- Invalid or incomplete lanes: None.
- Metadata fields not exposed by the platform: actual agent variant, actual reasoning level, service tier, and loaded frontend-specific skills after dispatch. Spawn results exposed agent IDs and nicknames only.
- Timing limitations: Official durations use orchestrator-observed dispatch and final-result return timestamps. Agent self-recorded timing is supplementary. Completion timestamps were captured when each wait operation returned the final result.
- Service-tier request value used for every lane: omitted (default/normal tier requested).
- Confirmation that no priority service tier was requested: Confirmed.

## Dispatch metadata exposed

| Lane | Agent ID | Nickname |
|---|---|---|
| Luna | agent-01 | run-worker-a |
| Terra | agent-02 | run-worker-b |
| Sol | agent-03 | run-worker-c |

The requested model overrides were gpt-5.6-luna (xhigh), gpt-5.6-terra (xhigh), and gpt-5.6-sol (high). The dispatch API accepted all three requests. No frontend-specific skill was passed or loaded by the orchestrator.

## Lane completion summaries

- Luna: Created index.html, styles.css, script.js, and RUN.md. Reported JavaScript syntax, required file/title, offline dependency, responsive CSS, reduced-motion, and interaction wiring checks passed. Desktop/tablet renders were visually inspected; mobile overflow was corrected. Live browser automation was limited by a shared Edge session lock and intermittent headless repaint artifacts.
- Terra: Created index.html, styles.css, script.js, and RUN.md. Reported local load, 1440px/768px/390px responsive layouts, no horizontal overflow, keyboard focus, mobile navigation, agent inspection, handoff simulation, billing toggle, workflow disclosures, reduced motion, and no external asset requests verified. Activity and pricing remain static simulations without a backend.
- Sol: Created index.html, styles.css, script.js, and RUN.md. Reported JavaScript syntax, accessibility contracts, responsive rules, reduced motion, local-only assets, ID integrity, title, and file containment checks passed. Local file:// browser navigation was blocked, preventing rendered viewport and mouse testing; documented in RUN.md.

## Output directories

- <LOCAL_SAMPLE_ROOT>/luna-xhigh/no-skill/01-creative-landing
- <LOCAL_SAMPLE_ROOT>/terra-xhigh/no-skill/01-creative-landing
- <LOCAL_SAMPLE_ROOT>/sol-high/no-skill/01-creative-landing

## Final orchestrator report

- All three requested lanes were dispatched exactly once, concurrently, from empty output directories.
- The orchestrator did not write, edit, repair, review, normalize, or improve any implementation output.
- No queueing, interruption, retry, cancellation, or tool failure affected a dispatched lane. The preflight shell check required one elevated retry after a sandbox process-permission failure; this occurred before dispatch and did not affect the benchmark lanes.
- Batch validity for comparison: Valid, with the post-dispatch metadata limitations recorded above. No wrong configuration or priority service was exposed, and no isolation violation was reported.

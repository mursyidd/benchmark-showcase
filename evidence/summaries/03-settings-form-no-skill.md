# Benchmark Results — 03 Settings Form — No Skill

| Agent | Reasoning | Skill | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---:|---|---|
| Luna | xhigh | None | 2026-07-13T14:00:51.064+08:00 | 2026-07-13T14:15:14.602+08:00 | 863.538 | 00:14:23 | Valid — completed |
| Terra | xhigh | None | 2026-07-13T14:00:51.065+08:00 | 2026-07-13T14:15:14.666+08:00 | 863.601 | 00:14:23 | Valid — completed |
| Sol | high | None | 2026-07-13T14:00:51.065+08:00 | 2026-07-13T14:15:14.670+08:00 | 863.605 | 00:14:23 | Valid — completed |

## Batch timing

- First dispatch time: 2026-07-13T14:00:51.064+08:00
- Last completion time: 2026-07-13T14:15:14.670+08:00
- Overall batch duration: 863.606 seconds (00:14:23)
- All three agents ran concurrently: Yes. They were dispatched in one parallel dispatch round.

## Verification and limitations

- Luna reported verification passed for validation, accessibility associations, dirty/reset behavior, unsaved warning, save success/failure, saving state, keyboard order, notification toggles, focus visibility, responsive widths, no overflow, reduced motion, clean console, no external dependencies, and file isolation. Save behavior is simulated locally and does not persist to a backend.
- Terra reported static acceptance review passed, with native accessible controls, validation, dirty/cancel behavior, notification toggles, saving/success/failure states, responsive layouts, focus states, reduced motion, and no external assets. Local browser automation was blocked before loading the file, so runtime viewport and keyboard screenshots could not run.
- Sol reported syntax and structural checks passed, including ARIA/label references, unique IDs, focus order, responsive rules, state transitions, dependency isolation, and file isolation. The in-app browser blocked local `file://` navigation, so rendered browser automation could not run. Sol also reported no additional review lane was available; no extra agent was dispatched because the benchmark requires exactly three agents.
- Invalid or incomplete runs: None. Each agent returned the assigned identity, reasoning level, active frontend skill as None, output directory, implementation completion, and verification result. No retries, interruptions, wrong assignments, frontend-specific skill invocations, cross-sample inspection, or out-of-directory writes were reported.
- Timing limitation: the orchestrator captured dispatch immediately before each spawn and completion immediately after each concurrent wait returned. The wait results surfaced together, so the three observed completion timestamps are clustered within 68 ms; these are the official orchestrator-observed benchmark timings.

## Agent outputs

- Luna: `<LOCAL_SAMPLE_ROOT>/luna-xhigh/no-skill/03-settings-form/index.html`, `styles.css`, `script.js`, `RUN.md`
- Terra: `<LOCAL_SAMPLE_ROOT>/terra-xhigh/no-skill/03-settings-form/index.html`, `styles.css`, `script.js`, `RUN.md`
- Sol: `<LOCAL_SAMPLE_ROOT>/sol-high/no-skill/03-settings-form/index.html`, `styles.css`, `script.js`, `RUN.md`, `DESIGN.md`, `PLAN.md`

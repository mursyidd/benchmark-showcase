# Benchmark Results — Operational Dashboard / No Skill

| Agent | Reasoning | Skill | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---:|---|---|
| Luna | xhigh | None | 2026-07-13T12:46:02.306+08:00 | 2026-07-13T12:57:28.857+08:00 | 686.551 | 00:11:26.551 | Completed — valid |
| Terra | xhigh | None | 2026-07-13T12:46:02.307+08:00 | 2026-07-13T13:02:36.979+08:00 | 994.672 | 00:16:34.672 | Completed — valid |
| Sol | high | None | 2026-07-13T12:46:02.308+08:00 | 2026-07-13T13:02:37.005+08:00 | 994.697 | 00:16:34.697 | Completed — valid |

## Batch timing

- First dispatch time: 2026-07-13T12:46:02.306+08:00
- Last completion time: 2026-07-13T13:02:37.005+08:00
- Overall batch duration: 994.699 seconds (00:16:34.699)
- All three agents ran concurrently: Yes. Dispatches were issued in one parallel batch.

## Verification and limitations

- Luna: Static checks passed; output contained the required implementation files. Live browser navigation was blocked by the environment and documented by the agent.
- Terra: JavaScript syntax passed; 20/20 static acceptance checks passed; output contained exactly the four requested files. Live browser testing was blocked because local `file://` pages are unavailable in the environment.
- Sol: 17/17 static checks passed, along with JavaScript syntax, file-isolation, accessibility-hook, responsive-safeguard, and dependency scans. Live browser testing was blocked because the available browser rejects local `file://` navigation.
- Invalid or incomplete runs: None observed. All agents used the requested identity, reasoning level, no-skill condition, and assigned output directory, and returned final results.
- Timing limitations or interruptions: No dispatch interruption, timeout, or cancellation occurred. The official durations are orchestrator-observed from dispatch through final wait return. Browser-based visual verification was environment-limited for all three agents.

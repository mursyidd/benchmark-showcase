# Browser Acceptance

Status: **PASS** for the showcase implementation on locked Chromium `149.0.7827.55` with Playwright `1.61.1`.

This is evidence-archive interface acceptance, not acceptance of any generated interface or product behavior and not a reconstruction of the original model-execution browser environment. It confirms that the archive presents preserved evidence and its limitations accurately; it does not establish rankings, causal conclusions, or superiority.

## Automated matrix

- 26 Playwright browser tests passed.
- Viewports: 1440×900, 1024×768, 768×1024, 390×844, and 360×800.
- Covered initial render, zero initial iframes, all ten section links, all three cases, every valid filter value, the case-02/original-evidence empty state, and all 18 run deep links.
- Covered all six exact prompts, the exact tested skill, escaped sanitized-source viewing, screenshot provenance groups, copy success/failure announcements, Escape, focus containment/restoration, and mobile navigation.
- Covered embedded and standalone preview shells, exact sandbox tokens, invalid/duplicate run IDs, desktop/mobile viewport controls, reload, iframe unloading, and absence of direct raw-run navigation.
- Confirmed no showcase-level horizontal overflow, broken showcase images/evidence links, console errors, or page errors in the tested states.

## Accessibility checks

Axe `4.12.1` reported no automated violations on the initial report, exact-text dialog, screenshot dialog, embedded preview dialog shell, and standalone preview shell. Explicit checks also covered heading structure, labelled timing meters, live regions, text condition labels, keyboard focus containment/restoration, touch-operable mobile navigation, and reduced-motion behavior.

Automated Axe success is not WCAG certification. The untrusted benchmark implementation inside each sandboxed iframe was excluded from showcase-chrome Axe analysis.

## Showcase acceptance captures

Every item below is labelled **Showcase acceptance capture** and is stored separately from benchmark screenshots.

| Capture | Viewport |
|---|---:|
| [Desktop report](showcase-acceptance/desktop-report.png) | 1440×900 |
| [Mobile report](showcase-acceptance/mobile-report.png) | 390×844 |
| [Selected-case comparison](showcase-acceptance/selected-case-comparison.png) | 1440×900 |
| [Exact-prompt view](showcase-acceptance/exact-prompt-view.png) | 1440×900 |
| [Tested-skill view](showcase-acceptance/tested-skill-view.png) | 1440×900 |
| [Sandboxed preview](showcase-acceptance/sandboxed-preview.png) | 1440×900 |
| [Mobile run explorer](showcase-acceptance/mobile-run-explorer.png) | 390×844 |

Capture metadata: [capture-metadata.json](showcase-acceptance/capture-metadata.json).

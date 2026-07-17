# Frontend Benchmark Evidence Archive — Final Implementation Report

## Outcome

This archive documents an 18-run frontend generation exercise across three task types, three model configurations, and two prompting conditions. It is provided as a transparent showcase of the work performed, not as a controlled study, model ranking, or claim that one approach is superior. It is non-evaluative: it does not identify a winner or support causal conclusions.

The static evidence archive is technically complete and browser-accepted. All six detected findings have matching `human-review-verified-for-archive` decisions. This confirms their existence, description, intentional preservation, and suitability for archival publication; it does not approve interface quality, implementation correctness, or product behavior. No repository, commit, push, Pages activation, or deployment was performed.

## Published structure and intake

- 18 finalized sanitized runs appear exactly once in the dataset and run explorer.
- Six exact canonical prompts are accessible as escaped plain text.
- One exact benchmarked `SKILL.md` is accessible as escaped plain text.
- The showcase copy map contains 107 canonical copied artifacts, including 89 sanitized run artifacts: 74 source/run-note files and 15 original screenshot artifacts.
- Every implementation copied into the showcase matches its corresponding finalized sanitized publication artifact, excluding no files and applying no showcase-time source modification.

## Screenshot facts

These are four separate facts:

1. **15 original screenshot artifacts.**
2. **1 run with original screenshot evidence.**
3. **36 standardized publication-time derived captures.**
4. **18 runs with standardized derived-capture coverage.**

There are zero capture failures and zero null standardized-capture paths. Original screenshots remain labelled `Original benchmark screenshot`; standardized images remain labelled `Publication-time derived capture`.

Derived captures used Chromium `149.0.7827.55`, Playwright `1.61.1`, device scale factor 1, light colour scheme, reduced motion, viewport-only PNG output, and the fixed readiness policy `domcontentloaded-load-fonts-two-raf-500ms-v1`. No run was interacted with before its initial-state captures, and copied implementation hashes remained unchanged.

## Integrity boundaries

- **Sanitization-stage integrity assurance:** governed by `evidence/audit/sanitization-report.md`. The showcase does not independently prove equality with unsanitized originals.
- **Showcase-copy integrity verification:** checks manifest-derived inventory equality across the manifest, filesystem, dataset, and copy map, then recomputes checksums and byte counts.
- **Derived screenshot generation:** rendered finalized sanitized copies without source modification; it is separate from original benchmark execution evidence.

## Interface and security

- Deterministic static-page generation is owned only by `templates/index.template.html`, `templates/preview.template.html`, and `scripts/build-static-page.mjs` through `npm run build:html`.
- Final deterministic `index.html` SHA-256: `3dc029608d64409ff9f81185bdb73ab445e64f7c7370fa8408f8a6cb38817ec4`.
- Development dependencies are pinned exactly to `@playwright/test@1.61.1` and `@axe-core/playwright@4.12.1` in package and lock files.
- Prompt, skill, and sanitized source viewers populate `<code>` elements through `textContent`; benchmark text is never executed.
- Embedded and standalone live previews resolve only validated run IDs and use the exact iframe sandbox `allow-scripts allow-forms allow-modals`, without `allow-same-origin` or top-navigation.
- Showcase controls never intentionally navigate directly to raw implementation HTML.

## Verification results

- Unit, integrity, provenance, security, social-image, and adversarial validator tests: **43 passed**.
- Technical validator: **PASS**, `errors=0`, `warnings=1`.
- Preserved-source warning: copied benchmark implementations retain documented broken fragment references; the showcase does not repair them.
- Browser and interaction tests: **26 passed** on locked Chromium.
- Automated Axe checks: no violations in tested showcase chrome/dialog/shell states. This is not WCAG certification; raw iframe implementation content was excluded.
- Privacy validation: no credible secret/credential pattern or private absolute path detected in publishable textual artifacts.
- Showcase acceptance captures: **7**, listed in [browser-acceptance.md](browser-acceptance.md).
- Standalone package verification: **43 passed** from a temporary isolated package root with no sibling `publication` directory; the temporary copy was removed after the run.
- Protected evidence preservation: **144 files unchanged**, aggregate path-and-content hash `sha256:64d67c606be99ba42ba10e2cc21fd7e2a6c89c6e6d26c96e51c4555c656190d2`.

## Findings and archival review

Six findings were mechanically redetected from the finalized generated outputs and assigned semantic IDs and evidence fingerprints. Their severity is unassigned, their classification is `editorially-normalized`, and their review status is `human-review-verified-for-archive`. The generated [findings review ledger](findings-review.md) records the matching decisions.

Archival verification means that a human confirmed each defect exists, the written finding accurately describes it, the defect remains intentionally unchanged, and the finding is suitable for the public evidence archive. Unknown, duplicate, malformed, stale, mismatched, rejected, or missing decisions block publication. There is no approval-status alias or fallback.

## Limitations and actions not performed

Publication-time captures show how finalized sanitized implementations rendered in the showcase capture environment and may differ from original browser, font, timing, or operating-system conditions. Timing records are preserved as execution evidence, not as controlled performance measurements; individual durations retain their run-specific manifest caveats.

This archive is not a controlled scientific experiment, model ranking, or basis for causal or superiority claims. The task selection is illustrative, reasoning levels are unmatched, and outputs are nondeterministic.

No model was rerun. No implementation was regenerated, repaired, restyled, or manipulated. No benchmark result was changed. No source defect was hidden or cropped away. No repository was created, and no commit, push, Pages activation, or deployment occurred.

With separate deployment authorization, follow the manual GitHub Pages `main`/root instructions in the project README, rerun `npm run build:html`, `npm test`, `npm run validate`, and `npm run test:e2e`, and require the default validator to exit zero.

# Frontend Benchmark Showcase

This archive documents an 18-run frontend generation exercise across three task types, three model configurations, and two prompting conditions. It is provided as a transparent showcase of the work performed, not as a controlled study, model ranking, or claim that one approach is superior. It is non-evaluative: it does not identify a winner or support causal conclusions.

The static, progressively enhanced GitHub Pages archive preserves the finalized sanitized frontend benchmark publication. The publication manifest is the source of truth; the archive does not rerun a model, regenerate an implementation, repair an output, or alter recorded evidence.

## Local workflow

```text
npm install
npx playwright install chromium
npm run build:data
npm run build:findings
npm run build:html
npm run build:social
npm run serve
npm run capture
npm run validate
npm run test:e2e
```

The packaged archive is self-contained: builds, validation, and tests use only files inside this directory.

## Optional upstream intake

Maintainers may replace the packaged evidence from a separately validated publication tree by passing its location explicitly:

```text
npm run intake -- --publication-root <path-to-publication>
```

Intake has no default or sibling-directory fallback. It verifies the supplied manifest and sanitization audit before replacing `inputs/`, `runs/`, and copied publication evidence. Ordinary archive builds and tests do not run intake or require an external publication directory.

`templates/index.template.html`, `templates/preview.template.html`, the JavaScript modules, and JSON datasets are editable sources. `index.html` and `preview.html` are deterministic generated outputs owned only by `scripts/build-static-page.mjs` and `npm run build:html`.

Canonical prompt and skill contents are stored once under `inputs/` and loaded as escaped plain text. Metadata JSON contains paths and checksums, not duplicated full contents. Runnable outputs are copied only from manifest-resolved sanitized publication paths.

## Evidence boundaries

- Sanitization-stage integrity assurance is governed by `evidence/audit/sanitization-report.md`.
- Showcase-copy integrity verification establishes: “Showcase copies match the finalized sanitized publication artifacts from which they were copied.”
- Derived screenshot generation renders standardized publication-time captures from those canonical sanitized copies without source modification.

The dataset distinguishes 15 original screenshot artifacts, 1 run with original screenshot evidence, 36 standardized publication-time derived captures, and 18 runs with standardized derived-capture coverage. Six preserved defects have matching human verification for archival inclusion; this verifies the evidence descriptions, not the generated interfaces or product behavior.

## GitHub Pages

After separate repository and deployment authorization, publish the repository root from the `main` branch using GitHub Pages. Paths are relative so the report works under a repository subpath. This project does not create a repository, commit, push, enable Pages, or deploy automatically.

# Evidence Archive Corrections Design

## Objective

Reframe the Frontend Benchmark Showcase as a transparent 18-run evidence archive, make its packaged verification independent of an undeclared sibling directory, bind archival review decisions to semantic evidence fingerprints, and remove transient package output without changing preserved benchmark evidence.

The archive documents three task types, three model configurations, and two prompting conditions. It showcases prompts, generated outputs, screenshots, timing records, source previews, provenance, and known defects. It is not a controlled scientific experiment, model ranking, or claim that a skill or model configuration is superior.

## Preservation boundary

The implementation must not edit, regenerate, repair, normalize, or beautify canonical prompts, the tested skill, run source files, original screenshots, recorded timings, raw execution evidence, or preserved defects. Publication copy, metadata, tests, validators, review decisions, generated ledgers, generated datasets, generated pages, social imagery, and archive-interface reports may change through their existing reproducible processes.

## Finding identity and mechanical detection

The missing-fragment detector emits at most one aggregated finding per run. Its detector ID is `missing-fragment-target`, and canonical finding IDs use:

```text
finding-{detectorId}-{runId}
```

Generation fails if detected findings contain duplicate semantic IDs. Evidence counts, target names, ordering, and descriptive wording never determine identity.

The one-time documented migration is:

```json
{
  "finding-001": "finding-missing-fragment-target-case-02-new-skill-luna-xhigh",
  "finding-002": "finding-missing-fragment-target-case-02-new-skill-sol-high",
  "finding-003": "finding-missing-fragment-target-case-02-no-skill-luna-xhigh",
  "finding-004": "finding-missing-fragment-target-case-02-no-skill-sol-high",
  "finding-005": "finding-missing-fragment-target-case-02-no-skill-terra-xhigh",
  "finding-006": "finding-missing-fragment-target-case-03-new-skill-sol-high"
}
```

This map is documentation only. Runtime generation and validation must neither read it nor retain ordinal aliases.

## Evidence fingerprint and decision source

Mechanical detection, human decisions, and generated presentation remain separate layers.

`evidence/findings-review-decisions.json` is the sole human-authored decision source. `data/findings.json` and `evidence/findings-review.md` are generated outputs.

Each detected finding receives a fingerprint in the form `sha256:<64 lowercase hexadecimal characters>`. The digest is computed from canonical JSON containing:

- fingerprint schema version;
- detector ID;
- run ID;
- repository-relative artifact path normalized to `/` separators;
- defect category;
- sorted unique missing targets;
- occurrence count.

The fingerprint excludes presentation wording, generated and review timestamps, absolute paths, table position, and file ordering.

Decision records contain a canonical finding ID, detector ID, exact evidence fingerprint, archival status, ISO 8601 review timestamp, and optional reviewer and rationale. Decision-source statuses are limited to `human-review-verified-for-archive` and `human-review-rejected`; `human-review-required` is generated only when a detected finding has no decision. Duplicate decisions, unknown finding IDs, detector mismatches, malformed fingerprints, invalid timestamps, invalid statuses, and stale fingerprints fail generation and validation. Stale decisions remain in the decision file until a human changes or removes them, and failures identify them explicitly.

An exact finding ID, detector ID, and fingerprint match applies the decision. A detected finding without a decision remains `human-review-required`. Decisions never create findings, and regeneration never modifies the decision source.

Generated review statuses are limited to:

- `human-review-required`;
- `human-review-verified-for-archive`;
- `human-review-rejected`.

`human-review-approved` is removed from schemas, validators, tests, generators, documentation, and UI behavior without aliases, fallback mapping, or silent translation.

`human-review-verified-for-archive` means a human confirmed that the finding exists in the finalized output, accurately describes the defect, remains intentionally unchanged, and is suitable for the public evidence archive. It does not approve the generated interface, implementation, or product behavior.

## Standalone package verification

Publication validation accepts explicit manifest, artifact-root, and sanitization-audit locations. Packaged tests derive the project root from their module location and validate `evidence/benchmark-manifest.json`, packaged artifacts under the project root, and `evidence/audit/sanitization-report.md`.

The optional upstream intake command requires an explicit publication-root argument. It has no implicit `../publication` fallback and is documented as a maintainer import workflow rather than a prerequisite for packaged builds or tests. Missing, invalid, escaped, or incomplete roots fail clearly.

Tests cover local packaged validation, explicit intake-root handling, path traversal rejection, malformed matrices, audit failure, checksum mismatch, semantic-ID collision, fingerprint determinism, stale decisions, unknown decisions, duplicate decisions, invalid statuses, and the absence of `human-review-approved` fallback behavior.

## Archive-facing language

The homepage and README begin with a prominent scope statement explaining the 18-run archive and its non-evaluative purpose. Publication-facing sources and generated outputs replace controlled-study and ranking implications with archive language. In particular:

- “Comparison laboratory” becomes “Evidence archive.”
- “Results matrix” becomes “Archived run matrix.”
- “Three controlled briefs” becomes “Three task briefs.”
- “Experimental inputs” becomes “Archived generation inputs.”
- “Explore results” becomes “Explore the archive.”
- timing is described as preserved records rather than a primary performance comparison.

Metadata, social-preview text, methodology, limitations, reports, ledgers, validator output, and UI labels state that the archive supports no winner, ranking, causal inference, product acceptance, or superiority claim. The word “benchmark” may remain as project identity or preserved historical terminology.

The wording audit applies to publication-authored sources and their generated outputs. It does not rewrite copied upstream evidence, canonical inputs, or generated run content.

## Review presentation

Publication UI labels are “Human review required,” “Verified for archive,” and “Human review rejected.” The review explanation states that verification covers archival evidence and its description, not interface quality or product acceptance.

Missing, rejected, unknown, or stale decisions block archival publication. When all detected findings have exact verified decisions, the ledger and validator report archival findings review as complete and state that defects remain intentionally unchanged.

## Cleanup

Remove only reproducible transient output, including `node_modules/`, `test-results/`, Playwright reports, blob reports, coverage, caches, traces, and logs not identified as archive evidence. Add narrow `.gitignore` rules for those locations and common package-manager logs.

Retain package manifests and lockfiles, tests, source code, prompts, tested skill, generated run evidence, original and standardized screenshots, archive-interface acceptance captures, timings, manifests, checksums, provenance, sanitization reports, reviewed findings, documentation, generated datasets, generated HTML, reports, and social imagery.

## Verification and acceptance criteria

Implementation is complete only when:

1. All six findings are redetected from preserved outputs with the expected semantic IDs, targets, counts, source sections, and unchanged copy-map hashes.
2. Valid decisions match exact detector IDs and evidence fingerprints; missing or changed evidence becomes unresolved.
3. Generated JSON, Markdown, HTML, reports, tests, and UI use only canonical semantic IDs and documented statuses.
4. The packaged unit suite passes in isolation without a sibling `publication` directory.
5. Unit, structural, integrity, checksum, security, adversarial, broken-link, fragment, and Playwright suites pass.
6. The default validator exits zero after valid archival verification decisions are present.
7. Repository searches find no undocumented external publication-root assumption, no `human-review-approved` fallback, and no publication-facing winner, controlled-study, causal, ranking, or superiority claim.
8. Generated pages, social imagery, and archive-interface acceptance artifacts are regenerated through existing scripts when their sources change.
9. Transient output is removed after verification and covered by `.gitignore` without hiding archive evidence.
10. Original benchmark evidence remains byte-for-byte unchanged.

## Delivery constraints

The root agent is the sole writer and final verifier. Every implementation task receives a fresh, narrow, read-only review lane after root implementation. No subagent edits tracked files or performs final acceptance. Task changes are staged individually for user review when Git is available; no commit, tag, or push is performed without explicit authorization.

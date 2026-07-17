# Coding-Agent Frontend Benchmark — Sanitized Publication

This publication contains 18 finalized frontend benchmark runs arranged as 3 cases × 2 conditions × 3 model configurations.

- Luna and Terra used xHigh reasoning.
- Sol used High reasoning.
- The conditions are `new-skill` and `no-skill`.
- `raw/` contains **sanitized, content-preserving copies of the original run artifacts**, not untouched originals.
- Superseded directories ending in `-old` are excluded from the finalized dataset.
- No implementation defect, failed output, status, score, or recorded timing was repaired or rewritten.
- Artifact inclusion does not imply evaluator approval or a higher score.
- Where noted, timings represent observer-visible completion and may not equal the exact instant a worker finished.

[Open the GitHub Pages report](index.html) · [Inspect the manifest](benchmark-manifest.json) · [Review sanitization decisions](audit/sanitization-report.md) · [Review exclusions](audit/excluded-artifacts.md)

## Benchmark Inputs

The publication contains the **exact benchmark prompts** used for all six finalized case-condition variants. Each case has a New Skill prompt and a No Skill prompt; these are authoritative benchmark inputs, not sample prompts.

The prompt files were not rewritten or improved for publication. Changes were limited to documented privacy sanitization of sensitive local paths.

- [Case 01 — New Skill](inputs/prompts/case-01/new-skill.md)
- [Case 01 — No Skill](inputs/prompts/case-01/no-skill.md)
- [Case 02 — New Skill](inputs/prompts/case-02/new-skill.md)
- [Case 02 — No Skill](inputs/prompts/case-02/no-skill.md)
- [Case 03 — New Skill](inputs/prompts/case-03/new-skill.md)
- [Case 03 — No Skill](inputs/prompts/case-03/no-skill.md)

The benchmarked skill remains a separate input. New Skill runs use their exact New Skill case prompt plus `inputs/skill/SKILL.md` loaded separately. No Skill runs use their exact No Skill case prompt without loading that skill. The publication does not claim the skill was the only difference between conditions.

Superseded prompt versions associated with excluded runs are not part of the finalized dataset.

## Benchmarked Skill

The [`frontend-art-direction` benchmarked skill](inputs/skill/SKILL.md) is the exact file confirmed by the user as used in the finalized New Skill runs. Its verification status is `verified`.

The two conditions use separate authoritative benchmark inputs:

- **New Skill:** the exact New Skill case prompt plus the authoritative `SKILL.md` loaded separately.
- **No Skill:** the exact No Skill case prompt with the authoritative `SKILL.md` not loaded.

The skill instructions were not merged into the shared prompt. This publication does not claim the skill was the only environmental difference. The file was not improved, rewritten, reformatted, or updated for publication; no privacy substitutions were required. Its checksum and sanitization status are recorded in `benchmark-manifest.json`.

## Run matrix

| Case | Condition | Luna xHigh | Sol High | Terra xHigh | Summary |
|---|---|---|---|---|---|
| 01 Creative landing page | new-skill | [Luna](runs/case-01/new-skill/luna-xhigh/README.md) | [Sol](runs/case-01/new-skill/sol-high/README.md) | [Terra](runs/case-01/new-skill/terra-xhigh/README.md) | [Summary](summaries/01-creative-landing-new-skill.md) |
| 01 Creative landing page | no-skill | [Luna](runs/case-01/no-skill/luna-xhigh/README.md) | [Sol](runs/case-01/no-skill/sol-high/README.md) | [Terra](runs/case-01/no-skill/terra-xhigh/README.md) | [Summary](summaries/01-creative-landing-no-skill.md) |
| 02 Operational dashboard | new-skill | [Luna](runs/case-02/new-skill/luna-xhigh/README.md) | [Sol](runs/case-02/new-skill/sol-high/README.md) | [Terra](runs/case-02/new-skill/terra-xhigh/README.md) | [Summary](summaries/02-operational-dashboard-new-skill.md) |
| 02 Operational dashboard | no-skill | [Luna](runs/case-02/no-skill/luna-xhigh/README.md) | [Sol](runs/case-02/no-skill/sol-high/README.md) | [Terra](runs/case-02/no-skill/terra-xhigh/README.md) | [Summary](summaries/02-operational-dashboard-no-skill.md) |
| 03 Settings form | new-skill | [Luna](runs/case-03/new-skill/luna-xhigh/README.md) | [Sol](runs/case-03/new-skill/sol-high/README.md) | [Terra](runs/case-03/new-skill/terra-xhigh/README.md) | [Summary](summaries/03-settings-form-new-skill.md) |
| 03 Settings form | no-skill | [Luna](runs/case-03/no-skill/luna-xhigh/README.md) | [Sol](runs/case-03/no-skill/sol-high/README.md) | [Terra](runs/case-03/no-skill/terra-xhigh/README.md) | [Summary](summaries/03-settings-form-no-skill.md) |

## Evidence notes

Sol's case 01 new-skill directory contains 15 screenshot files even though its source summary says fourteen. Both facts are preserved without correction.

Those screenshot files retain their source `.png` names but contain JPEG/JFIF data. Their bytes were preserved because the files contain no EXIF, comment, or editing-history metadata.

The current Sol case 03 no-skill run includes `DESIGN.md` and `PLAN.md`. They are retained as model-produced auxiliary output with prompt authorization recorded as unknown. They are not counted as additional runs and receive no cleanup-pass score judgment.

## Reproducibility and audit

The source-to-public mapping is in [`audit/source-public-map.json`](audit/source-public-map.json). Run [`audit/verify-publication.ps1`](audit/verify-publication.ps1) locally with the source archive to repeat the structural, privacy, link, content-equivalence, screenshot, and source-preservation checks.

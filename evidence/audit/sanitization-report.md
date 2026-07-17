# Benchmark Publication Sanitization Report

## Source inventory recorded before publication copying

The extracted source archive contained 108 files before `publication/` was created. A source-relative SHA-256 baseline was recorded at `<PRIVATE_SOURCE_BASELINE_PATH>` outside the publication tree before this report was written.

### Benchmark summaries

1. `benchmark-results/01-creative-landing-new-skill.md`
2. `benchmark-results/01-creative-landing-no-skill.md`
3. `benchmark-results/02-operational-dashboard-new-skill.md`
4. `benchmark-results/02-operational-dashboard-no-skill.md`
5. `benchmark-results/03-settings-form-new-skill.md`
6. `benchmark-results/03-settings-form-no-skill.md`

### Current runs

The archive contains exactly 18 current run directories:

| Case | Condition | Luna xHigh | Sol High | Terra xHigh |
|---|---|---|---|---|
| 01 creative landing | new skill | `luna-xhigh/new-skill/01-creative-landing` | `sol-high/new-skill/01-creative-landing` | `terra-xhigh/new-skill/01-creative-landing` |
| 01 creative landing | no skill | `luna-xhigh/no-skill/01-creative-landing` | `sol-high/no-skill/01-creative-landing` | `terra-xhigh/no-skill/01-creative-landing` |
| 02 operational dashboard | new skill | `luna-xhigh/new-skill/02-operational-dashboard` | `sol-high/new-skill/02-operational-dashboard` | `terra-xhigh/new-skill/02-operational-dashboard` |
| 02 operational dashboard | no skill | `luna-xhigh/no-skill/02-operational-dashboard` | `sol-high/no-skill/02-operational-dashboard` | `terra-xhigh/no-skill/02-operational-dashboard` |
| 03 settings form | new skill | `luna-xhigh/new-skill/03-settings-form` | `sol-high/new-skill/03-settings-form` | `terra-xhigh/new-skill/03-settings-form` |
| 03 settings form | no skill | `luna-xhigh/no-skill/03-settings-form` | `sol-high/no-skill/03-settings-form` | `terra-xhigh/no-skill/03-settings-form` |

Every current run contains `index.html`, `styles.css`, `script.js`, and `RUN.md`. Their contents were checked before classification for the expected case, condition, model name, and reasoning level.

### Superseded artifacts

Three Prompt 1 directories end in `-old` and contain 13 files in total:

- `luna-xhigh/new-skill/01-creative-landing -old` — 4 files.
- `sol-high/new-skill/01-creative-landing -old` — 4 files.
- `terra-xhigh/new-skill/01-creative-landing -old` — 5 files, including one nested planning document.

These artifacts are excluded from the finalized dataset and are itemized in `excluded-artifacts.md`. They remain unchanged in the source archive.

### Auxiliary artifacts

Two auxiliary files occur in a current run:

| Source path | Classification | Prompt authorization |
|---|---|---|
| `sol-high/no-skill/03-settings-form/DESIGN.md` | model-produced auxiliary output | unknown |
| `sol-high/no-skill/03-settings-form/PLAN.md` | model-produced auxiliary output | unknown |

They are evidence attached to one run, not additional runs, and receive no score or publication-pass judgment.

One additional planning document occurs only inside Terra's superseded Prompt 1 directory and is classified as a superseded artifact.

### Screenshots and verification evidence

Fifteen screenshot files occur in `sol-high/new-skill/01-creative-landing`. The run summary says fourteen screenshots, but the archive contains fifteen; the publication preserves and discloses this discrepancy.

The files use `.png` names but contain JPEG/JFIF data. A marker-only audit found ordinary JFIF data with no EXIF, comment, Photoshop/editing-history, or other privacy-bearing metadata segments. They will therefore be copied byte-for-byte without renaming or recompression.

### Initial privacy and reference findings

- 46 publishable absolute-path occurrences were found; all point beneath the local sample root.
- Three opaque agent UUIDs and three incidental worker nicknames occur in one Prompt 1 summary.
- Non-reserved email-like values occur in demo forms and contact links. They require stable role-based aliases to avoid publishing potentially private values while preserving behavior.
- Existing Markdown files contain no Markdown links.
- Broad case-insensitive Unix-path matching produced false positives from `Left/Right/Home/End` keyboard instructions; these are ordinary benchmark prose and must remain unchanged.
- Credential-word matches such as “token” occur in benign product copy; matched words alone are not evidence of a secret.
- No Git repository is present, so original-source preservation is verified using the pre-write SHA-256 baseline rather than `git diff`.

## Planned placeholder and alias mappings

Removed private values are not reproduced in this public report.

| Category | Public replacement |
|---|---|
| Local sample-root path | `<LOCAL_SAMPLE_ROOT>` plus retained relative suffix |
| Opaque agent identifiers | `agent-01`, `agent-02`, `agent-03` |
| Incidental worker nicknames | `run-worker-a`, `run-worker-b`, `run-worker-c` |
| Contact email | `contact@example.invalid` |
| Ordinary demo email | `demo@example.invalid` |
| Deliberate failure-trigger email | `fail@example.invalid` |

## Benchmarked skill

- Classification: User-provided authoritative benchmark input used only by the New Skill condition.
- Published path: [`inputs/skill/SKILL.md`](../inputs/skill/SKILL.md)
- Runtime-version verification: verified
- Privacy sanitization applied: no
- Meaning-changing edits: none
- Content modified beyond sanitization: no
- Published checksum algorithm: SHA-256
- Published checksum: `d5b6e60238d56ff59adc9bead7ecd77477c135e5c43e083d1d4200f814213b08`
- Associated condition: new-skill only

The attached file was treated as authoritative and copied byte-for-byte. Its published checksum matches the private pre-copy checksum. It was not improved, rewritten, reformatted, or updated, and no duplicate was published under run or raw artifacts. The authoritative skill was not loaded by or associated with the No Skill condition.

<!-- BEGIN GENERATED PROMPT INPUTS -->
## Authoritative prompt inputs

Expected canonical prompts: **6**. Supplied authoritative prompts: **6**. Verification status: **verified** for every prompt.

All six prompts required privacy sanitization limited to local Windows paths, replaced with `<LOCAL_SAMPLE_ROOT>` plus the retained relative suffix. No meaning-changing edits were made, and `contentModifiedBeyondSanitization` is `false` for every prompt.

| Prompt | Published path | Verification | Privacy sanitization | Meaning-changing edits | Published SHA-256 | Finalized run IDs |
|---|---|---|---|---|---|---|
| `case-01-new-skill` | [`inputs/prompts/case-01/new-skill.md`](../inputs/prompts/case-01/new-skill.md) | verified | local-path substitution | none | `6bc3be329f9f8ed7a86d18a0bc32c437e34d6fb2ccb201fda9cc8d362750bef2` | `case-01-new-skill-luna-xhigh`<br>`case-01-new-skill-sol-high`<br>`case-01-new-skill-terra-xhigh` |
| `case-01-no-skill` | [`inputs/prompts/case-01/no-skill.md`](../inputs/prompts/case-01/no-skill.md) | verified | local-path substitution | none | `1f5d56e062f601d28760ea874c21050532fb0592bec551af29b9329089564a08` | `case-01-no-skill-luna-xhigh`<br>`case-01-no-skill-sol-high`<br>`case-01-no-skill-terra-xhigh` |
| `case-02-new-skill` | [`inputs/prompts/case-02/new-skill.md`](../inputs/prompts/case-02/new-skill.md) | verified | local-path substitution | none | `a5a6691a54cc80105248bbc5cf6125487582c505300620d8e47905d1c9098dcd` | `case-02-new-skill-luna-xhigh`<br>`case-02-new-skill-sol-high`<br>`case-02-new-skill-terra-xhigh` |
| `case-02-no-skill` | [`inputs/prompts/case-02/no-skill.md`](../inputs/prompts/case-02/no-skill.md) | verified | local-path substitution | none | `45c2003ebb00fb86c60a0c96eb8181965bccb752316d1e068726f55b70288c38` | `case-02-no-skill-luna-xhigh`<br>`case-02-no-skill-sol-high`<br>`case-02-no-skill-terra-xhigh` |
| `case-03-new-skill` | [`inputs/prompts/case-03/new-skill.md`](../inputs/prompts/case-03/new-skill.md) | verified | local-path substitution | none | `bdb3146710332b0a55a8b784cd443f9004aeb174480f4ea716653b75985688d1` | `case-03-new-skill-luna-xhigh`<br>`case-03-new-skill-sol-high`<br>`case-03-new-skill-terra-xhigh` |
| `case-03-no-skill` | [`inputs/prompts/case-03/no-skill.md`](../inputs/prompts/case-03/no-skill.md) | verified | local-path substitution | none | `b41589546b00f76aacd48cfbdac2a85368b5d67e4fa5b10500c2dbc4c99ad4f0` | `case-03-no-skill-luna-xhigh`<br>`case-03-no-skill-sol-high`<br>`case-03-no-skill-terra-xhigh` |

New Skill prompt entries reference `inputs/skill/SKILL.md`, which was loaded separately. No Skill prompt entries have a null skill reference and the benchmarked skill was not loaded.

Superseded Prompt 1 versions associated with the three excluded `-old` run directories were excluded and are not canonical benchmark inputs. No obsolete prompt text was substituted for the finalized Case 1 prompts.

### Prompt-input completion status

- All six authoritative prompts were supplied and published at the paths listed above.
- Every prompt required privacy sanitization for local Windows paths.
- No prompt changed beyond the documented privacy substitutions.
- Every finalized run maps to exactly one exact prompt.
- Superseded prompt versions were excluded.
- New Skill prompts reference the canonical `inputs/skill/SKILL.md` loaded separately.
- No Skill prompts have a null skill reference and exclude the benchmarked skill.
- All published prompt SHA-256 values are recorded in the manifest and validated against the published files.
<!-- END GENERATED PROMPT INPUTS -->

## Final publication inventory

The completed publication tree contains 133 files after excluding runtime cache files:

- 6 sanitized benchmark summaries.
- 89 canonical raw artifacts across exactly 18 run directories:
  - 72 standard run files (`index.html`, `styles.css`, `script.js`, and `RUN.md`).
  - 2 model-produced auxiliary artifacts.
  - 15 byte-identical screenshot files.
- 18 generated run provenance and navigation pages.
- 1 machine-readable 18-run manifest.
- 1 repository README.
- 1 GitHub Pages report and 1 local stylesheet.
- 1 screenshot gallery page and 1 gallery README.
- 7 audit and reproducibility files: this report, the exclusion report, source-public map, builder, report generator, Python verifier, and PowerShell verifier entrypoint.
- 1 canonical user-provided authoritative benchmark input at `inputs/skill/SKILL.md`.
- 6 canonical user-provided authoritative benchmark prompts under `inputs/prompts/`, one for each case-condition variant.

Included current runs: **18**.  
Excluded superseded run directories: **3**.  
Excluded superseded files: **13**.

## Sanitization changes performed

All transformations were deterministic and limited to approved privacy replacements:

| Category | Occurrences | Files affected | Result |
|---|---:|---:|---|
| Local sample-root paths | 70 | 46 | Replaced with `<LOCAL_SAMPLE_ROOT>` and retained relative suffixes, including 24 occurrences across the six authoritative prompts. |
| Opaque agent identifiers | 3 | 1 | Replaced with `agent-01` through `agent-03`. |
| Incidental worker nicknames | 3 | 1 | Replaced with `run-worker-a` through `run-worker-c`. |
| Non-reserved ordinary demo emails | 8 | included in 9 total email-sanitized files | Replaced with `demo@example.invalid`. |
| Non-reserved contact emails | 6 | included in 9 total email-sanitized files | Replaced with `contact@example.invalid`. |

The documented failure-trigger email was already a reserved example-domain value, so no replacement was necessary and its behavior remains unchanged. Existing privacy-safe reserved example addresses were preserved.

No line endings or encodings were normalized: all 80 source text artifacts were UTF-8 without BOM and used LF endings, and their sanitized copies preserve that representation except for the recorded string substitutions. The prompt copies likewise preserve the extracted authoritative prompt encoding, line endings, and trailing-newline state except for documented local-path substitutions.

## Files excluded for privacy

No current run artifact required wholesale exclusion for privacy. All detected private values could be replaced without removing evidence. The only excluded files are the 13 superseded artifacts documented in `excluded-artifacts.md`.

## Reference and integrity decisions

- Generated Markdown and report links remain within `publication/`.
- Canonical implementation resource links remain relative inside each raw run directory.
- A read-only report audit found broken fragment anchors in several raw case 02 and case 03 implementations. These are original model-output defects and were deliberately preserved rather than repaired.
- The 15 screenshot files are linked from the manifest, their run page, and the screenshot gallery.
- No `-old` artifact is mapped, copied, or linked by the public manifest or benchmark navigation.
- The source discrepancy between fourteen screenshots in summary prose and fifteen files on disk remains disclosed without correction.
- Screenshot extensions and JPEG/JFIF contents remain unchanged.

## Verification commands

The following deterministic operations were used. Commands accept explicit roots so they can be repeated without embedding a private local path:

```powershell
# Pre-write source baseline, excluding publication/
Get-FileHash -Algorithm SHA256 <each-source-file>

# Deterministic evidence copy and sanitization
python publication/audit/build_publication.py --source-root . --publication-root publication `
  --skill-source <AUTHORITATIVE_SKILL_FILE> `
  --skill-baseline <PRIVATE_SKILL_BASELINE_PATH> `
  --prompt-source <AUTHORITATIVE_PROMPT_BUNDLE>

# Manifest and static report generation
python publication/audit/generate_report.py --publication-root publication

# Complete verification
powershell -ExecutionPolicy Bypass -File publication/audit/verify-publication.ps1 `
  -PublicationRoot publication `
  -SourceRoot . `
  -BaselinePath <PRIVATE_SOURCE_BASELINE_PATH> `
  -SkillSource <AUTHORITATIVE_SKILL_FILE> `
  -SkillBaselinePath <PRIVATE_SKILL_BASELINE_PATH> `
  -PromptSource <AUTHORITATIVE_PROMPT_BUNDLE>

# Required recursive search classes were also covered by the verifier
rg -n --hidden --glob '!publication/raw/**/styles.css' '-old|C:\\Users\\|C:/Users/|/Users/|/home/|agent id|session id|thread id|authorization|bearer|api_key|api-key|token|cookie' publication
```

The broad term search is context-classified. Benign uses such as product-copy “token,” loopback-only test addresses, and keyboard `Home/End` instructions are retained.

## Verification results

The completed root verification returned:

```text
RESULT=PASS errors=0 warnings=1
```

Passed checks:

- Manifest: 18 unique runs, complete 3 × 2 × 3 matrix, correct reasoning levels, and resolving paths.
- Timing: all official individual durations, batch durations, and caveats match the six sanitized summaries.
- Traceability: all 95 mappings resolve; 80 sanitized text copies match the approved deterministic transformations; 15 screenshots are byte-identical.
- Links: 370 publication Markdown and generated-report HTML links resolve inside `publication/`.
- Privacy: 118 publication text files passed; two loopback-only IP references were reviewed as benign local-test evidence.
- Benchmarked skill: one canonical copy exists, its manifest metadata and condition association are exact, its bytes match the authoritative source and private baseline, and no privacy substitution was required.
- Authoritative prompts: six canonical copies exist; their deterministic privacy-only transformations, published checksums, condition/skill semantics, and mappings to all 18 finalized runs passed.
- Exclusions: no publication filesystem or manifest path contains `-old`; all 15 screenshots are referenced.
- Original preservation: all 108 source files match the pre-write relative path, byte length, and SHA-256 baseline.
- Documentation: required inventories, exclusions, commands, and integrity confirmations are present.

The single warning records 19 broken fragment references in raw model-generated HTML. These are preserved source-output defects, not publication navigation defects, and were not repaired.

### Root browser acceptance

The generated GitHub Pages report was served from a temporary loopback-only static server and inspected in the in-app browser:

- At a 1440 × 1000 viewport, the page rendered all 18 run cards and 3 case sections with document width contained to the browser's content viewport.
- At a 390 × 844 viewport, the page rendered all 18 cards with no horizontal overflow after a publication-only headline sizing correction.
- The screenshot-gallery link navigated successfully; all 15 figures and images loaded, including the JPEG/JFIF files retaining `.png` names.
- The final report produced zero browser warning or error logs.
- The benchmark-input section rendered with its verified condition semantics, all 18 run cards remained present, and its canonical skill link resolved to the byte-verified published file.
- After the exact prompts were added, the report was rechecked at a 1265-pixel content viewport and a mobile 375-pixel content viewport. All 18 run cards and 18 prompt links rendered with no horizontal overflow and no browser warning or error logs.

The responsive correction changed only `publication/assets/report.css` and its publication generator. No benchmark implementation or raw evidence was changed.

## Unresolved ambiguity and preserved evidence

- Prompt authorization for the current `DESIGN.md` and `PLAN.md` cannot be proven from available evidence and remains `unknown`.
- The screenshot-count and file-container inconsistencies described above remain unresolved source facts, not publication errors.
- Original broken fragment anchors remain present as model-output evidence.
- No privacy ambiguity remains unresolved.

## Integrity confirmations

- There were **no implementation repairs**. No HTML, CSS, JavaScript, model prose, status, failure, limitation, or timing value was corrected.
- Sanitized text copies are compared against a deterministic transformation of their original source files; screenshots are compared byte-for-byte.
- The **original source tree** is compared against the 108-file pre-write path, length, and SHA-256 baseline.
- The extracted source evidence was not edited, moved, deleted, committed, pushed, deployed, or published.
- The authoritative attached `SKILL.md` remains unchanged, has verification status `verified`, and is associated only with the New Skill condition.
- All six authoritative prompt inputs were supplied, privacy-sanitized only for local paths, and published without meaning-changing edits; all 18 run mappings and published prompt checksums passed validation.

# Account Settings Form Implementation Plan

> **For agentic workers:** Implement this single bounded task inline; the root agent is the sole writer and final verifier.

**Goal:** Create a polished standalone account settings form with complete validation, draft-state, save-state, accessibility, and responsive behavior.

**Architecture:** Semantic HTML defines the application shell and form. CSS handles restrained business-product presentation and responsive layout. A dependency-free JavaScript controller derives dirty state from snapshots, owns validation and save transitions, and updates accessible status regions.

**Tech Stack:** HTML5, CSS3, browser JavaScript; no external dependencies.

## Global Constraints

- Write only inside `<LOCAL_SAMPLE_ROOT>/sol-high/no-skill/03-settings-form`.
- Active frontend skill: None; do not invoke a frontend or visual-design skill.
- Run by opening `index.html`; make no network requests.
- Keep controls native, semantic, keyboard accessible, responsive, and restrained.

### Task 1: Complete account settings form

**Files:**

- Create: `index.html`
- Create: `styles.css`
- Create: `script.js`
- Create: `RUN.md`

**Interfaces:**

- HTML exposes `#settings-form`, named form controls, per-field error nodes, `#form-status`, `#dirty-warning`, and Save/Cancel actions.
- JavaScript reads and restores a serializable snapshot, validates controls, and renders idle, saving, success, and failure states.
- CSS styles semantic state hooks such as `[aria-invalid="true"]`, `[aria-busy="true"]`, `.status--success`, and `.status--error`.

- [ ] Create the complete semantic document and logically ordered controls.
- [ ] Add compact desktop and stacked mobile layouts, visible focus, invalid, disabled, status, and reduced-motion rules.
- [ ] Implement snapshot-derived dirty detection, validation, cancel confirmation, before-unload warning, and simulated saves.
- [ ] Document exact success/failure triggers and verification metadata in `RUN.md`.
- [ ] Verify syntax, references, accessible associations, state transitions, overflow protections, network independence, and output isolation.


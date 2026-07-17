# Account Settings Form Design

## Intent

Build a compact, maintenance-style account settings screen for an established business product. The form is the visual focus; the shell remains quiet and conventional.

## Chosen approach

Use semantic HTML and native inputs with one small JavaScript state controller. The controller keeps a committed baseline snapshot separate from the current draft, derives dirty state from those snapshots, validates adjacent to fields, and treats save as an explicit asynchronous state.

Alternative approaches considered:

- Browser-native validation only: simpler, but error wording, associations, and first-error focus are less consistent.
- Independent booleans for dirty/saving/success/failure: initially easy, but prone to contradictory states.
- Snapshot-derived state (chosen): slightly more code, but reset and successful-save behavior remain correct after repeated edits.

## State and behavior

- Initial state is clean and idle.
- Any tracked field change recomputes dirty state against the last successful snapshot.
- Save validates all required fields and email syntax. Invalid submission focuses the first invalid field.
- A valid save enters a disabled, busy state for a short simulated delay.
- Any valid email except `save-failure@example.com` succeeds, updates the baseline, clears dirty state, and shows success feedback.
- `save-failure@example.com` fails, preserves the draft and dirty state, and shows failure feedback.
- Cancel with changes asks for confirmation; confirmed discard restores the last successful snapshot and clears messages.
- Attempted page exit while dirty uses the browser's unsaved-changes prompt.

## Accessibility and responsive layout

The document uses landmarks, headings, explicit labels, descriptions, adjacent error elements, `aria-invalid`, `aria-describedby`, `aria-live`, and `aria-busy`. Native controls provide predictable keyboard behavior. Focus rings are high-contrast and state messages include icons and text, so color is never the only signal. Desktop uses a narrow sidebar beside the form; mobile stacks the navigation above it without horizontal scrolling. Motion is limited to a functional saving indicator and is removed when reduced motion is requested.

## Thought experiments

- Edit then restore the original value: snapshot comparison must return to clean without a save.
- Save, edit again, then cancel: reset must return to the newly saved values, not the page-load values.
- Submit two invalid fields: all messages appear, but focus moves only to the first invalid control.
- Fail a save: inputs must re-enable, the user's draft must remain, and retry must be possible.
- Change data during save: controls are disabled, preventing baseline/draft races.
- Toggle a checkbox with the keyboard: native checkbox semantics and the visual switch state remain synchronized.


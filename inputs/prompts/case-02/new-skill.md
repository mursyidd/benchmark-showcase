Act as the benchmark orchestrator only. Do not implement the frontend yourself.

This is an approved benchmark task. Do not ask clarification questions or alter
the task specification.

Dispatch exactly three fresh implementation agents in parallel.

Each implementation agent is authorized to write only inside its assigned output
directory. The orchestrator must not edit, normalize, combine, or improve their
implementations.

Process skills required by the environment may run, but they must not change the
approved requirements. Do not invoke any additional frontend, UI, visual-design,
or art-direction skill beyond `frontend-art-direction`.

# Agent assignments

## Agent 1 — Luna

- Agent: Luna
- Reasoning level: xhigh
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, or art-direction skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/luna-xhigh/new-skill/02-operational-dashboard

## Agent 2 — Terra

- Agent: Terra
- Reasoning level: xhigh
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, or art-direction skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/terra-xhigh/new-skill/02-operational-dashboard

## Agent 3 — Sol

- Agent: Sol
- Reasoning level: high
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, or art-direction skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/sol-high/new-skill/02-operational-dashboard

# Timing requirements

The orchestrator must record timing independently for each agent.

For each agent:

1. Record `dispatch_time` immediately before dispatching the agent.
2. Record `completion_time` when the agent returns its final completion result.
3. Calculate:
   - elapsed seconds
   - elapsed time formatted as HH:MM:SS
4. Use ISO 8601 timestamps including the local UTC offset.
5. Do not estimate or round the timestamps.

The official benchmark duration is:

completion_time - dispatch_time

Because the agents run concurrently, record each agent separately. Also record the
overall batch duration from the first dispatch until the last agent completes.

After all agents finish, create this summary file:

<LOCAL_SAMPLE_ROOT>/benchmark-results/02-operational-dashboard-new-skill.md

The orchestrator is authorized to create only this benchmark summary file outside
the implementation directories. It must not modify any implementation output.

The summary must contain:

| Agent | Reasoning | Skill | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---:|---|---|
| Luna | xhigh | frontend-art-direction | ... | ... | ... | ... | ... |
| Terra | xhigh | frontend-art-direction | ... | ... | ... | ... | ... |
| Sol | high | frontend-art-direction | ... | ... | ... | ... | ... |

Also record:

- First dispatch time
- Last completion time
- Overall batch duration
- Whether all three agents ran concurrently
- Invalid or incomplete runs
- Timing limitations or interruptions

# Isolation requirements

Each agent must:

- Work independently.
- Receive the complete task specification below.
- Confirm its agent name, reasoning level, active skill, and output directory.
- Write every generated file only inside its assigned directory.
- Not inspect, read, copy, or modify another sample directory.
- Not review or influence another agent.
- Create the implementation from scratch.
- Complete its own verification.

The orchestrator must:

- Dispatch all three agents in parallel.
- Not implement the task itself.
- Not edit any agent implementation.
- Not pass one agent's output to another.
- Wait for all three agents to finish.
- Report each agent's completion status, timing, verification, and limitations.

Mark an individual run invalid if:

- The wrong agent or reasoning level was used.
- `frontend-art-direction` was not invoked.
- Another frontend-specific design skill was invoked.
- Files were written outside the assigned directory.
- Another sample was inspected or reused.
- Timing information was not recorded.

# Task — Operational Dashboard

Create a production-oriented operations dashboard for a logistics company that
monitors parcel-processing facilities.

This interface is used repeatedly throughout the workday. Prioritize readability,
rapid scanning, predictable interaction, operational clarity, and useful
information density over decorative experimentation.

Use realistic logistics data and terminology. Do not use lorem ipsum.

The dashboard must contain:

- Fixed application header
- Collapsible sidebar navigation
- Facility selector
- Date-range selector
- Four operational summary metrics
- Parcel-volume trend visualization
- Facility-status table
- Delayed-shipment alert panel
- Recent operational events
- Loading state
- Empty state
- Error state
- Populated state
- Responsive desktop, tablet, and mobile layouts

# Required interactions

Implement working controls for:

- Collapsing and expanding the sidebar
- Selecting a facility
- Selecting a date range
- Switching among populated, loading, empty, and error states
- Navigating interactive controls using the keyboard

# Design constraints

- Use a restrained operational visual language.
- Do not turn the dashboard into a marketing landing page.
- Do not use oversized hero typography.
- Do not add testimonials, pricing sections, promotional calls to action, or
  marketing copy.
- Do not add decorative illustrations.
- Do not add animated backgrounds.
- Do not add custom cursors.
- Do not add cinematic page transitions.
- Keep the information architecture conventional and immediately understandable.
- Maintain compact but readable spacing.
- Maintain accessible contrast.
- Provide clearly visible keyboard focus.
- Keep component states visually consistent.
- Limit animation to functional state changes.
- Respect `prefers-reduced-motion`.

The `frontend-art-direction` skill must adapt to these operational constraints
rather than forcing a marketing-oriented or excessively artistic result.

# Implementation constraints

- Build a complete standalone implementation using HTML, CSS, and JavaScript.
- Do not use frameworks.
- Do not use package managers.
- Do not use build tools.
- Do not use external component libraries.
- Do not use chart libraries.
- Do not use animation libraries.
- Do not fetch images, fonts, scripts, stylesheets, or assets from the internet.
- Render the chart using inline SVG, Canvas, or CSS.
- The application must run by opening `index.html`.
- Use semantic HTML.
- Use appropriate form labels and ARIA attributes where necessary.
- Avoid placeholder or unfinished content.
- Do not visibly display the agent name, reasoning level, skill name, or benchmark
  condition inside the dashboard.

# Required files

Create at minimum:

- index.html
- styles.css
- script.js
- RUN.md

Additional local files may be created only when necessary and only inside the
assigned output directory.

# RUN.md requirements

Each agent must record:

- Agent name
- Reasoning level
- Skill mode: new-skill
- Active frontend skill: frontend-art-direction
- Exact output directory
- Files created
- External dependencies: None
- Verification performed
- Verification results
- Known limitations
- Self-recorded work start time
- Self-recorded work completion time
- Self-recorded elapsed duration

The self-recorded timing is supplementary. The orchestrator-observed timing is the
official benchmark duration.

Set the browser document title to:

Parcel Operations Dashboard — [Agent] [Reasoning] — New Skill

Add an HTML comment near the top of `index.html` containing:

- Agent
- Reasoning level
- Skill condition
- Output directory

Do not show this benchmark identity visibly in the dashboard.

# Verification

Before finishing, each agent must:

- Test populated, loading, empty, and error states.
- Test sidebar collapse and expansion.
- Test facility selection.
- Test date-range selection.
- Test interactive controls using mouse and keyboard.
- Inspect the dashboard at desktop, tablet, and mobile widths.
- Check chart overflow.
- Check table overflow.
- Check horizontal page overflow.
- Check keyboard focus visibility.
- Check labels and accessible names.
- Check reduced-motion behaviour.
- Confirm that no network-dependent assets are required.
- Confirm that every generated file remains inside its assigned directory.

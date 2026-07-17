Act as the benchmark orchestrator only. Do not implement the frontend yourself.

This is an approved benchmark task. Do not ask clarification questions or alter
the task specification.

Dispatch exactly three fresh implementation agents in parallel.

Each implementation agent is authorized to write only inside its assigned output
directory. The orchestrator must not edit, normalize, combine, or improve their
implementations.

Process skills required by the environment may run, but they must not change the
approved requirements.

Do not invoke `frontend-art-direction`.

Do not invoke any frontend, UI, visual-design, art-direction, web-design, or
frontend-aesthetics skill. Use normal built-in reasoning and implementation
capabilities.

# Agent assignments

## Agent 1 — Luna

- Agent: Luna
- Reasoning level: xhigh
- Active frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/luna-xhigh/no-skill/03-settings-form

## Agent 2 — Terra

- Agent: Terra
- Reasoning level: xhigh
- Active frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/terra-xhigh/no-skill/03-settings-form

## Agent 3 — Sol

- Agent: Sol
- Reasoning level: high
- Active frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/sol-high/no-skill/03-settings-form

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

Because the agents run concurrently, record each agent separately.

Also record the overall batch duration from the first dispatch until the final
agent completes.

After all agents finish, create this summary file:

<LOCAL_SAMPLE_ROOT>/benchmark-results/03-settings-form-no-skill.md

The orchestrator is authorized to create only this benchmark summary file outside
the implementation directories. It must not modify any implementation output.

The summary must contain:

| Agent | Reasoning | Skill | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---:|---|---|
| Luna | xhigh | None | ... | ... | ... | ... | ... |
| Terra | xhigh | None | ... | ... | ... | ... | ... |
| Sol | high | None | ... | ... | ... | ... | ... |

Also record:

- First dispatch time
- Last completion time
- Overall batch duration
- Whether all three agents ran concurrently
- Invalid or incomplete runs
- Timing limitations, interruptions, retries, or tool failures

# Isolation requirements

Each agent must:

- Work independently.
- Receive the complete task specification below.
- Confirm its agent name, reasoning level, active frontend skill as `None`, and
  output directory.
- Write every generated file only inside its assigned directory.
- Not inspect, read, copy, or modify another sample directory.
- Not inspect Prompt 1 or Prompt 2 implementations.
- Not review or influence another agent.
- Create the implementation from scratch.
- Complete its own verification.

The orchestrator must:

- Dispatch all three agents in parallel.
- Not implement the task itself.
- Not invoke a frontend-specific skill.
- Not edit any agent implementation.
- Not pass one agent's output to another.
- Wait for all three agents to finish.
- Report each agent's completion status, timing, verification, and limitations.

Mark an individual run invalid if:

- The wrong agent or reasoning level was used.
- Any frontend-specific skill was invoked.
- Files were written outside the assigned directory.
- Another sample was inspected or reused.
- Timing information was not recorded.

# Task — Account Settings Form

Create the account-settings area of an established business web application.

This is a constrained maintenance-style interface, not a landing page, visual
showcase, or full application redesign.

The result should look complete, polished, reliable, and consistent with a mature
business product.

The interface must contain:

- Minimal application header
- Narrow settings navigation
- Account settings page heading and concise supporting text
- Profile-information form
- Email field
- Display-name field
- Time-zone selector
- Language selector
- Notification preferences
- Save action
- Cancel action
- Unsaved-changes warning
- Validation errors
- Saving state
- Success state
- Failure state
- Responsive desktop and mobile layouts

Use realistic finished labels, descriptions, option values, messages, and account
data. Do not use lorem ipsum or generic placeholder sections.

# Required interactions

Implement working behaviour for:

- Required-field validation
- Email-format validation
- Dirty-state detection
- Unsaved-changes warning
- Cancel and reset behaviour
- Simulated successful save
- Simulated failed save
- Saving state
- Success feedback
- Failure feedback
- Notification preference toggles
- Keyboard navigation through the complete form

Provide a clear, documented way to trigger both simulated save success and
simulated save failure during evaluation.

# Scope and design constraints

- Keep the surrounding application shell neutral and minimal.
- Keep the account-settings form as the clear focus.
- Use familiar business-application interaction patterns.
- Preserve conventional form-control behaviour.
- Use clear labels rather than relying only on placeholder text.
- Keep label placement predictable.
- Keep tab order logical.
- Keep validation messages adjacent to the relevant fields.
- Make focused, invalid, disabled, saving, successful, and failed states visibly
  distinct.
- Maintain accessible contrast and visible keyboard focus.
- Use compact but comfortable spacing.
- Use restrained motion only for functional feedback.
- Respect `prefers-reduced-motion`.

Do not add:

- Dashboard metrics
- Charts
- Analytics widgets
- Marketing content
- Testimonials
- Pricing
- Promotional calls to action
- Decorative illustrations
- Animated backgrounds
- Gradient-mesh backgrounds
- Custom cursors
- Cinematic transitions
- Experimental navigation
- Unfamiliar form controls
- Unrelated settings sections
- Excessive visual effects

# Implementation constraints

- Build a complete standalone implementation using HTML, CSS, and JavaScript.
- Do not use frameworks.
- Do not use package managers.
- Do not use build tools.
- Do not use external component libraries.
- Do not use animation libraries.
- Do not fetch images, fonts, scripts, stylesheets, or assets from the internet.
- The application must run by opening `index.html`.
- Use semantic HTML.
- Use native form controls where appropriate.
- Use appropriate labels, descriptions, status regions, and ARIA attributes.
- Do not rely on color alone to communicate state.
- Avoid placeholder or unfinished content.
- Do not visibly display the agent name, reasoning level, skill name, or benchmark
  condition inside the interface.

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
- Skill mode: no-skill
- Active frontend skill: None
- Exact output directory
- Files created
- External dependencies: None
- Verification performed
- Verification results
- Method for triggering save success
- Method for triggering save failure
- Known limitations
- Self-recorded work start time
- Self-recorded work completion time
- Self-recorded elapsed duration

The self-recorded timing is supplementary. The orchestrator-observed timing is the
official benchmark duration.

Set the browser document title to:

Account Settings — [Agent] [Reasoning] — No Skill

Add an HTML comment near the top of `index.html` containing:

- Agent
- Reasoning level
- Skill condition
- Output directory

Do not show this benchmark identity visibly in the interface.

# Verification

Before finishing, each agent must:

- Test keyboard navigation through the complete interface.
- Test logical tab order.
- Test required-field validation.
- Test invalid-email validation.
- Test validation-message association.
- Test dirty-state detection.
- Test the unsaved-changes warning.
- Test cancel and reset behaviour.
- Test saving state.
- Test successful save.
- Test failed save.
- Test notification preference controls.
- Check focus visibility.
- Check status announcements.
- Check that state is not communicated through color alone.
- Inspect desktop and mobile widths.
- Check horizontal overflow.
- Check reduced-motion behaviour.
- Confirm that no network-dependent assets are required.
- Confirm that every generated file remains inside its assigned directory.
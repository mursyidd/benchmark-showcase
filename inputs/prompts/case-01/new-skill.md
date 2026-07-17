Act as the benchmark orchestrator only. Do not implement the frontend yourself.

This is an approved benchmark task. Do not ask clarification questions, redesign
the benchmark, or alter the task specification.

Dispatch exactly three fresh implementation agents in parallel.

Each implementation agent is authorized to write only inside its assigned output
directory. This benchmark-specific authorization overrides any general rule that
makes implementation subagents read-only, but only within the explicitly assigned
directories.

The orchestrator must not edit, normalize, combine, repair, or improve any agent's
implementation.

Process skills required by the environment may run, but they must not change the
approved requirements or introduce a design-approval gate.

Do not invoke any additional frontend, UI, visual-design, art-direction,
web-design, or frontend-aesthetics skill beyond `frontend-art-direction`.

# Agent assignments

## Agent 1 — Luna

- Agent: Luna
- Reasoning level: xhigh
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, art-direction,
  web-design, or frontend-aesthetics skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/luna-xhigh/new-skill/01-creative-landing

## Agent 2 — Terra

- Agent: Terra
- Reasoning level: xhigh
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, art-direction,
  web-design, or frontend-aesthetics skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/terra-xhigh/new-skill/01-creative-landing

## Agent 3 — Sol

- Agent: Sol
- Reasoning level: high
- Explicitly invoke and use `frontend-art-direction`.
- Do not invoke any other frontend, UI, visual-design, art-direction,
  web-design, or frontend-aesthetics skill.
- Output directory:

<LOCAL_SAMPLE_ROOT>/sol-high/new-skill/01-creative-landing

If the platform cannot honor an assigned agent or reasoning level, do not
substitute another configuration. Mark that individual run invalid.

# Pre-dispatch validation

Before dispatching an agent, verify that its assigned output directory is empty.

If an assigned directory already contains files:

- Do not overwrite or delete them.
- Do not reuse them.
- Do not dispatch that implementation agent.
- Mark that individual run invalid with reason: non-empty output directory.

Create the output directory when it does not exist.

# Timing requirements

The orchestrator must record timing independently for each agent.

For each agent:

1. Record `dispatch_time` immediately before dispatching that agent.
2. Record `completion_time` immediately when the agent returns its final result.
3. Calculate:
   - elapsed seconds
   - elapsed duration formatted as HH:MM:SS
4. Use ISO 8601 timestamps including the local UTC offset.
5. Do not estimate or manually round timestamps.

The official individual benchmark duration is:

completion_time - dispatch_time

This duration may include queueing and tool-execution time.

Because the agents run concurrently, record each agent separately.

Also record the overall batch duration:

last completion time - first dispatch time

After all valid agents finish, create or overwrite only this summary file:

<LOCAL_SAMPLE_ROOT>/benchmark-results/01-creative-landing-new-skill.md

The orchestrator is authorized to create that benchmark summary file outside the
implementation directories. It must not modify implementation output.

The summary must contain this table:

| Agent | Reasoning | Skill | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---:|---|---|
| Luna | xhigh | frontend-art-direction | ... | ... | ... | ... | ... |
| Terra | xhigh | frontend-art-direction | ... | ... | ... | ... | ... |
| Sol | high | frontend-art-direction | ... | ... | ... | ... | ... |

Also record:

- First dispatch time
- Last completion time
- Overall batch elapsed seconds
- Overall batch elapsed HH:MM:SS
- Whether all valid agents were dispatched concurrently
- Invalid, incomplete, cancelled, or failed runs
- Queueing, interruptions, retries, tool failures, or timing limitations
- Whether any output directory was non-empty before dispatch

# Isolation requirements

Each agent must:

- Work independently.
- Receive the complete task specification below.
- Confirm its agent name, reasoning level, active skill, and output directory.
- Write every generated source file, asset, note, screenshot, and verification
  artifact only inside its assigned directory.
- Not inspect, read, copy, compare, or modify another sample directory.
- Not inspect the previous Prompt 1 implementation.
- Not inspect Prompt 2 or Prompt 3 implementations.
- Not receive another agent's output or findings.
- Create its implementation from scratch.
- Complete its own verification.
- Return a final completion report to the orchestrator.

The orchestrator must:

- Dispatch all valid agents in parallel.
- Not implement any part of the frontend.
- Not pass output or design decisions between agents.
- Not review one implementation while another agent is still working.
- Not repair or complete a failed implementation.
- Wait for every dispatched agent to return or fail.
- Report each agent's timing, status, verification, and limitations.

Mark an individual run invalid if:

- The wrong agent was used.
- The wrong reasoning level was used.
- `frontend-art-direction` was not explicitly invoked.
- Another frontend-specific design skill was invoked.
- Files were written outside the assigned directory.
- Another sample was inspected or reused.
- The output directory was not empty before dispatch.
- Timing information was not recorded.
- The orchestrator edited the implementation.

# Task — Creative Landing Page

Create a responsive landing page for a desktop developer tool that manages and
coordinates multiple AI coding agents.

The product allows developers to dispatch coding agents, observe concurrent work,
review agent activity, coordinate implementation lanes, and combine completed
results.

You have broad visual freedom.

The result should feel:

- Technically sophisticated
- Distinctive
- Intentional
- Cohesive
- Memorable
- Production-ready

Use realistic finished product copy. Do not use lorem ipsum, generic placeholders,
or unfinished sections.

# Required content

The page must contain:

- Application or product navigation
- Hero section
- Primary and secondary calls to action
- Visual agent-orchestration demonstration
- Feature overview
- Workflow or process section
- Pricing preview
- Final call-to-action section
- Footer
- Responsive desktop, tablet, and mobile layouts

# Agent-orchestration demonstration

Create a meaningful visual representation of multiple coding agents working
concurrently.

It should communicate concepts such as:

- Multiple active implementation lanes
- Agent identity or specialization
- Task status
- Progress
- Dependencies or coordination
- Completed output returning to an orchestrator

It must be understandable without requiring a real backend.

The demonstration may use:

- HTML and CSS
- Inline SVG
- Canvas
- JavaScript-driven state changes
- Locally created visual assets

Do not fetch external assets.

# Required interactions

Include at least two meaningful interactions appropriate to the design.

Examples include:

- Interactive orchestration states
- Agent-status controls
- Expandable workflow details
- Pricing toggle
- Navigation menu
- Demonstration playback or state switching

Interactions must:

- Work using mouse input
- Work using keyboard input
- Have visible focus states
- Use accessible names
- Respect reduced-motion preferences

# Creative freedom

The agent may determine:

- Visual direction
- Typography using locally available or CSS-defined font stacks
- Color palette
- Composition
- Spacing system
- Motion language
- Illustration approach
- Shape language
- Light or dark theme
- Content presentation

The design should not default automatically to a generic SaaS card grid, purple
gradient, or interchangeable AI-product landing page.

The result should still remain usable, coherent, accessible, and appropriate for a
professional developer product.

# Implementation constraints

- Build a complete standalone implementation using HTML, CSS, and JavaScript.
- Do not use frameworks.
- Do not use package managers.
- Do not use build tools.
- Do not use external component libraries.
- Do not use animation libraries.
- Do not fetch images, fonts, scripts, stylesheets, or assets from the internet.
- Use inline SVG, Canvas, CSS, or locally created assets when needed.
- The application must run by opening `index.html`.
- Use semantic HTML.
- Use appropriate labels and ARIA attributes where necessary.
- Ensure interactive controls are keyboard accessible.
- Respect `prefers-reduced-motion`.
- Avoid placeholder or unfinished content.
- Do not visibly display the agent name, reasoning level, skill name, benchmark
  condition, output directory, or timing data inside the landing page.

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
- Design direction selected
- Interactions implemented
- Verification performed
- Verification results
- Known limitations
- Self-recorded work start time
- Self-recorded work completion time
- Self-recorded elapsed seconds
- Self-recorded elapsed HH:MM:SS

The self-recorded timing is supplementary.

The orchestrator-observed dispatch-to-completion duration is the official
benchmark duration.

Set the browser document title to:

AI Agent Desktop Tool — [Agent] [Reasoning] — New Skill

Add an HTML comment near the top of `index.html` containing:

- Agent
- Reasoning level
- Skill condition
- Output directory

Do not render this benchmark identity visibly.

# Verification

Before finishing, each agent must:

- Open and inspect the page.
- Inspect desktop width.
- Inspect tablet width.
- Inspect mobile width.
- Test every interactive control with mouse input.
- Test every interactive control with keyboard input.
- Check logical tab order.
- Check visible keyboard focus.
- Check accessible names.
- Check navigation behaviour.
- Check horizontal page overflow.
- Check clipped or overlapping content.
- Check reduced-motion behaviour.
- Confirm that no network-dependent assets are required.
- Confirm that the page runs by opening `index.html`.
- Confirm that every generated file remains inside its assigned directory.
- Record the verification results in RUN.md.

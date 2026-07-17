Act only as the benchmark orchestrator. Do not implement, edit, repair, review,
normalize, or improve the frontend implementations yourself.

This is the final no-skill control run for Benchmark Prompt 1.

The benchmark specification is already approved. Do not ask clarification
questions. Do not run requirements discovery, design approval, or brainstorming
that changes or delays the approved task.

Process skills required by the environment may run only when unavoidable. They
must not modify the benchmark specification or introduce frontend-design guidance.

# Orchestrator configuration

The top-level orchestrator is Luna with high reasoning.

The orchestrator must dispatch exactly three fresh implementation agents in
parallel:

| Lane | Actual agent variant | Reasoning level |
|---|---|---|
| Luna | Luna | xhigh |
| Terra | Terra | xhigh |
| Sol | Sol | high |

These are mandatory dispatch parameters, not descriptive labels to place inside
the agents' prompts.

Do not substitute:

- A generic agent renamed as Luna, Terra, or Sol
- Auto-selected agents
- Default reasoning
- Medium reasoning
- Fast reasoning
- Different agent variants
- Different reasoning levels

If the dispatch mechanism cannot explicitly select the required agent variant and
reasoning level, stop before dispatching or creating implementation files.

# Mandatory service-tier restriction

Reasoning level and service tier are separate settings.

Use the normal/default service tier for all three implementation agents.

Prefer omitting the service-tier argument entirely.

Do not set or pass:

- `service_tier: "priority"`
- Priority processing
- Fast execution
- Accelerated execution
- Low-latency execution
- Any other speed or service-tier override

Do not infer a priority service tier from `high` or `xhigh` reasoning.

Required configuration:

| Lane | Agent | Reasoning | Service tier |
|---|---|---|---|
| Luna | Luna | xhigh | default or omitted |
| Terra | Terra | xhigh | default or omitted |
| Sol | Sol | high | default or omitted |

If the dispatch API requires an explicit service-tier value, use its normal
standard/default value. Never use priority.

# No-skill condition

This is the no-frontend-skill control batch.

The orchestrator and all three implementation agents must not invoke or load:

- `frontend-art-direction`
- Any frontend-design skill
- Any UI-design skill
- Any visual-design skill
- Any art-direction skill
- Any web-design skill
- Any frontend-aesthetics skill
- Any frontend-generation skill

The implementation agents must use only their normal built-in reasoning and
implementation capabilities for the frontend task.

Unrelated process or browser-verification capabilities do not count as frontend
design skills, provided they do not contribute visual-design instructions.

# Output assignments

## Luna lane

- Agent variant: Luna
- Reasoning: xhigh
- Frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/luna-xhigh/no-skill/01-creative-landing

## Terra lane

- Agent variant: Terra
- Reasoning: xhigh
- Frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/terra-xhigh/no-skill/01-creative-landing

## Sol lane

- Agent variant: Sol
- Reasoning: high
- Frontend-specific skill: None
- Output directory:

<LOCAL_SAMPLE_ROOT>/sol-high/no-skill/01-creative-landing

# Pre-dispatch validation

Before dispatching:

1. Verify the exact agent variant and reasoning level available for every lane.
2. Verify that the service tier will be default or omitted.
3. Verify that no frontend-specific skill will be loaded.
4. Verify that every assigned output directory is empty.

If an output directory does not exist, create it.

If an output directory contains any file or subdirectory:

- Do not delete its contents.
- Do not overwrite its contents.
- Do not reuse its contents.
- Do not dispatch that lane.
- Mark the batch invalid because the benchmark requires clean output directories.
- Stop without dispatching the remaining agents.

Before dispatching, print this exact preflight table populated with verified
values:

| Lane | Actual agent | Actual reasoning | Frontend skill | Service tier | Output directory status |
|---|---|---|---|---|---|
| Luna | Luna | xhigh | None | default/omitted | Empty |
| Terra | Terra | xhigh | None | default/omitted | Empty |
| Sol | Sol | high | None | default/omitted | Empty |

Do not continue when any value differs or cannot be verified.

# Dispatch requirements

Dispatch all three implementation agents in parallel.

Immediately before each dispatch:

- Record that lane's dispatch timestamp.
- Use an ISO 8601 timestamp with the local UTC offset.

The dispatch operation itself must apply:

- The required actual agent variant
- The required reasoning level
- No frontend-specific skill
- Default or omitted service tier
- The lane's exact output directory
- The complete task specification in this prompt

Do not merely tell a generic subagent that it is Luna, Terra, or Sol.

Do not add `service_tier: "priority"` or any equivalent option.

Immediately after dispatch, inspect all metadata exposed by the orchestration
system.

Where the platform exposes the information, verify:

- Actual agent variant
- Actual reasoning level
- Service tier
- Loaded frontend-specific skills

Agent self-reporting inside its response or RUN.md is supplementary and is not
sufficient proof of the dispatch configuration.

If any lane shows the wrong agent, wrong reasoning level, priority service tier,
Fast execution, or a frontend-specific skill:

1. Cancel the entire batch.
2. Do not substitute another configuration.
3. Do not allow the orchestrator to implement the task.
4. Do not produce an official timing result.
5. Report the requested and actual dispatch metadata.
6. Mark the batch invalid.

If a metadata field is not exposed by the platform, record it as `not exposed`.
Do not fabricate verification. The service-tier field must still be omitted from
the dispatch request unless the API requires an explicit standard/default value.

# Isolation requirements

Each implementation agent is the sole writer inside its assigned output
directory.

Each agent must:

- Work independently from the other agents.
- Receive the complete task specification.
- Create its implementation from scratch.
- Write every source file, local asset, note, screenshot, and verification
  artifact only inside its assigned directory.
- Not inspect, read, compare, copy, or modify another sample directory.
- Not inspect previous Prompt 1 outputs.
- Not inspect Prompt 2 or Prompt 3 outputs.
- Not receive another agent's design decisions, files, or findings.
- Complete its own implementation and verification.
- Return its own final completion result to the orchestrator.

The orchestrator must:

- Remain orchestration-only.
- Not write any implementation files.
- Not edit or repair any agent output.
- Not pass one agent's output to another.
- Not perform a design review that influences unfinished agents.
- Wait for every dispatched agent to complete or fail.
- Preserve the three outputs exactly as produced.

# Official timing requirements

The orchestrator-observed timing is the official benchmark timing.

For each lane:

1. Record `dispatch_time` immediately before the dispatch request.
2. Record `completion_time` immediately when the agent returns its final result.
3. Calculate exact elapsed seconds.
4. Format the same duration as HH:MM:SS.
5. Use ISO 8601 timestamps with the local UTC offset.
6. Do not estimate timestamps.
7. Do not manually round elapsed seconds.

Official lane duration:

completion_time - dispatch_time

This duration may include queueing, tool execution, verification, and response
return time.

Also record:

- First dispatch time
- Last completion time
- Overall batch elapsed seconds
- Overall batch elapsed HH:MM:SS
- Whether all three agents were dispatched concurrently
- Queueing, interruption, retry, cancellation, or tool-failure information

Create or overwrite only this benchmark summary file:

<LOCAL_SAMPLE_ROOT>/benchmark-results/01-creative-landing-no-skill.md

The orchestrator is authorized to write that summary file. It is not authorized
to modify implementation output.

Use this table:

| Lane | Requested agent | Actual agent | Requested reasoning | Actual reasoning | Frontend skill | Service tier | Dispatch time | Completion time | Elapsed seconds | Elapsed HH:MM:SS | Status |
|---|---|---|---|---|---|---|---|---|---:|---|---|
| Luna | Luna | ... | xhigh | ... | None | ... | ... | ... | ... | ... | ... |
| Terra | Terra | ... | xhigh | ... | None | ... | ... | ... | ... | ... | ... |
| Sol | Sol | ... | high | ... | None | ... | ... | ... | ... | ... | ... |

Below the table, record:

- First dispatch time
- Last completion time
- Overall batch duration
- Concurrent dispatch confirmation
- Invalid or incomplete lanes
- Metadata fields not exposed by the platform
- Timing limitations
- Service-tier request value used for every lane
- Confirmation that no priority service tier was requested

# Invalid-run conditions

Mark the entire batch invalid when:

- Any output directory was not empty before dispatch.
- The wrong agent variant was dispatched.
- The wrong reasoning level was dispatched.
- A frontend-specific skill was loaded.
- Priority or Fast service was requested or used.
- An agent inspected or reused another sample.
- Files were written outside the assigned implementation directory.
- The orchestrator edited an implementation.
- Timing information was omitted or fabricated.

A failed implementation may be recorded as failed without invalidating the other
lanes only when its dispatch configuration and isolation remained correct.

# Task — Creative Landing Page

Create a responsive landing page for a desktop developer tool that manages and
coordinates multiple AI coding agents.

The product allows developers to:

- Dispatch coding agents
- Observe concurrent implementation work
- Review agent activity
- Coordinate independent implementation lanes
- Track dependencies
- Combine completed results

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

# Required page content

The page must contain:

- Product navigation
- Hero section
- Primary call to action
- Secondary call to action
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

The demonstration must be understandable without a real backend.

It may use:

- HTML and CSS
- Inline SVG
- Canvas
- JavaScript-driven states
- Locally created visual assets

Do not fetch external assets.

# Required interactions

Include at least two meaningful interactions appropriate to the design.

Possible interactions include:

- Orchestration-state controls
- Agent-status controls
- Demonstration playback
- Expandable workflow details
- Pricing toggle
- Responsive navigation menu
- Interface-state switching

Every interaction must:

- Work with mouse input
- Work with keyboard input
- Have a visible focus state
- Have an accessible name
- Respect reduced-motion preferences

# Creative freedom

Each agent may independently determine:

- Visual direction
- Typography using local or CSS-defined font stacks
- Color palette
- Composition
- Spacing system
- Motion language
- Illustration approach
- Shape language
- Light or dark theme
- Content presentation

Do not automatically default to:

- A generic SaaS card grid
- A purple gradient on white
- An interchangeable AI-product landing page
- Unnecessary glassmorphism
- Generic filler copy

The result must remain usable, coherent, accessible, and suitable for a
professional developer product.

# Implementation constraints

Build a complete standalone implementation using:

- HTML
- CSS
- JavaScript

Do not use:

- Frameworks
- Package managers
- Build tools
- External component libraries
- Animation libraries
- External chart libraries
- Remote images
- Remote fonts
- Remote scripts
- Remote stylesheets
- Any network-dependent asset

Use inline SVG, Canvas, CSS, or locally created assets where needed.

The application must run by opening:

index.html

Use semantic HTML.

Use appropriate labels and ARIA attributes where necessary.

Ensure all interactive controls are keyboard accessible.

Respect `prefers-reduced-motion`.

Avoid placeholder or unfinished content.

Do not visibly display:

- Agent name
- Reasoning level
- Skill condition
- Output directory
- Timing data
- Benchmark labels

# Required files

Create at minimum:

- index.html
- styles.css
- script.js
- RUN.md

Additional files may be created only when necessary and only inside the assigned
output directory.

# RUN.md requirements

Each agent must record:

- Agent name
- Reasoning level
- Skill mode: no-skill
- Active frontend-specific skill: None
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

Self-recorded timing is supplementary.

The orchestrator-observed dispatch-to-completion duration is the official
benchmark timing.

Set the browser document title to:

AI Agent Desktop Tool — [Agent] [Reasoning] — No Skill

Add an HTML comment near the top of `index.html` containing:

- Agent
- Reasoning level
- Skill condition
- Output directory

Do not render that benchmark identity visibly in the page.

# Verification requirements

Before finishing, each implementation agent must:

- Open and inspect the page.
- Inspect desktop width.
- Inspect tablet width.
- Inspect mobile width.
- Test every interactive control using mouse input.
- Test every interactive control using keyboard input.
- Check logical tab order.
- Check visible keyboard focus.
- Check accessible names.
- Check navigation behaviour.
- Check horizontal page overflow.
- Check clipped or overlapping content.
- Check reduced-motion behaviour.
- Confirm that no network-dependent assets are required.
- Confirm that the page runs by opening `index.html`.
- Confirm that every generated file remains inside the assigned directory.
- Record the verification results in RUN.md.

# Final orchestrator report

After all dispatched agents complete or fail, report:

- Preflight configuration
- Actual exposed dispatch metadata
- Service-tier request used
- Each lane's completion status
- Each lane's official elapsed duration
- Overall batch duration
- Output directories
- Verification summaries
- Known limitations
- Whether the batch is valid for comparison

Do not evaluate which design is best. Preserve blind comparison for later review.

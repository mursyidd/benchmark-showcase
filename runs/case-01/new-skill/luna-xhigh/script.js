(() => {
  "use strict";

  const demo = document.querySelector(".orchestration-shell");
  const demoTabs = [...document.querySelectorAll(".demo-tab")];
  const panel = document.querySelector("#demo-panel");
  const states = {
    dispatch: {
      status: "3 lanes active",
      count: "03 / 03",
      briefTitle: "Make checkout resilient<br />under network loss.",
      briefCopy: "Split the investigation into independent lanes. Keep the API contract as the source of truth.",
      lanes: {
        atlas: { state: "ACTIVE", stateClass: "state-active", task: "tracing retry boundaries", progress: 64, clock: "00:06:12" },
        mira: { state: "QUEUED", stateClass: "state-queued", task: "waiting on Atlas / contract", progress: 32, clock: "00:02:51" },
        quill: { state: "READY", stateClass: "state-ready", task: "building the offline matrix", progress: 48, clock: "00:04:07" }
      },
      output: { label: "waiting for lanes", title: "Nothing merged<br />yet.", copy: "Completed work returns here with its context intact." },
      log: ["Atlas mapped 4 retry paths", "Mira is holding for a contract", "Quill opened 12 test cases"]
    },
    flight: {
      status: "2 lanes moving",
      count: "02 / 03",
      briefTitle: "Make checkout resilient<br />under network loss.",
      briefCopy: "The contract is taking shape. Specialists are now probing the failure edges in parallel.",
      lanes: {
        atlas: { state: "DONE", stateClass: "state-ready", task: "contract stabilized", progress: 100, clock: "00:09:38" },
        mira: { state: "ACTIVE", stateClass: "state-active", task: "simulating packet loss", progress: 71, clock: "00:05:04" },
        quill: { state: "ACTIVE", stateClass: "state-ready", task: "writing offline assertions", progress: 76, clock: "00:06:22" }
      },
      output: { label: "1 lane returned", title: "Contract is<br />holding.", copy: "Atlas left a decision trail for the next lane to pick up." },
      log: ["Atlas returned a contract delta", "Mira reproduced 3 edge cases", "Quill linked 18 assertions"]
    },
    assemble: {
      status: "3 lanes complete",
      count: "03 / 03",
      briefTitle: "Make checkout resilient<br />under network loss.",
      briefCopy: "The pieces are back. Compare their deltas, keep the strongest decisions, and send one result home.",
      lanes: {
        atlas: { state: "DONE", stateClass: "state-ready", task: "contract stabilized", progress: 100, clock: "00:09:38" },
        mira: { state: "DONE", stateClass: "state-ready", task: "offline retry patch", progress: 100, clock: "00:08:19" },
        quill: { state: "DONE", stateClass: "state-ready", task: "coverage at 18 / 18", progress: 100, clock: "00:07:42" }
      },
      output: { label: "merge candidate", title: "3 lanes<br />returned.", copy: "Context, diffs, and decisions are ready for one review." },
      log: ["Atlas returned a contract delta", "Mira returned the retry patch", "Quill returned a green test matrix"]
    }
  };

  const setText = (selector, value, html = false) => {
    const element = document.querySelector(selector);
    if (!element) return;
    if (html) element.innerHTML = value;
    else element.textContent = value;
  };

  const invokeOnKeyboard = (element, action) => {
    element?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      action();
    });
  };

  const updateDemo = (nextState) => {
    if (!demo || !states[nextState]) return;
    const state = states[nextState];
    demo.dataset.demoState = nextState;
    setText("#board-status", state.status);
    setText("#lane-count", state.count);
    setText("#brief-title", state.briefTitle, true);
    setText("#brief-copy", state.briefCopy);
    setText("#output-label", state.output.label);
    setText("#output-title", state.output.title, true);
    setText("#output-copy", state.output.copy);
    setText("#log-one", state.log[0]);
    setText("#log-two", state.log[1]);
    setText("#log-three", state.log[2]);
    setText("#log-time", nextState === "dispatch" ? "18:41:09" : nextState === "flight" ? "18:44:16" : "18:49:02");

    Object.entries(state.lanes).forEach(([agent, lane]) => {
      const laneRoot = document.querySelector(`[data-agent="${agent}"]`);
      if (!laneRoot) return;
      const status = laneRoot.querySelector(".task-state");
      status.className = `task-state ${lane.stateClass}`;
      status.textContent = lane.state;
      setText(`#${agent}-task`, lane.task);
      setText(`#${agent}-percent`, `${lane.progress}%`);
      setText(`#${agent}-clock`, lane.clock);
      const bar = document.querySelector(`#${agent}-progress`);
      if (bar) bar.style.width = `${lane.progress}%`;
    });

    panel?.setAttribute("aria-labelledby", `tab-${nextState}`);
    demoTabs.forEach((tab) => {
      const active = tab.dataset.demoTarget === nextState;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  };

  demoTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => updateDemo(tab.dataset.demoTarget));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + demoTabs.length) % demoTabs.length;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % demoTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = demoTabs.length - 1;
      demoTabs[nextIndex].focus();
      updateDemo(demoTabs[nextIndex].dataset.demoTarget);
    });
  });

  const inspectButton = document.querySelector("#inspect-output");
  const toggleInspection = () => {
    const outputCard = document.querySelector("#output-card");
    const inspected = outputCard?.classList.toggle("output-ready");
    setText("#output-label", inspected ? "channel inspected" : states[demo?.dataset.demoState || "dispatch"].output.label);
    if (inspectButton) inspectButton.innerHTML = inspected ? "Reset the channel <span aria-hidden=\"true\">↺</span>" : "Inspect the channel <span aria-hidden=\"true\">↗</span>";
  };
  inspectButton?.addEventListener("click", toggleInspection);
  invokeOnKeyboard(inspectButton, toggleInspection);

  document.querySelectorAll(".workflow-step").forEach((step) => {
    const toggleWorkflowStep = () => {
      const willOpen = step.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll(".workflow-step").forEach((otherStep) => {
        const detail = document.getElementById(otherStep.getAttribute("aria-controls"));
        const isCurrent = otherStep === step;
        const open = isCurrent && willOpen;
        otherStep.setAttribute("aria-expanded", String(open));
        otherStep.classList.toggle("is-open", open);
        const symbol = otherStep.querySelector(".step-symbol");
        if (symbol) symbol.textContent = open ? "−" : "+";
        if (detail) detail.hidden = !open;
      });
    };
    step.addEventListener("click", toggleWorkflowStep);
    invokeOnKeyboard(step, toggleWorkflowStep);
  });

  document.querySelectorAll(".billing-button").forEach((button) => {
    const selectBilling = () => {
      const billing = button.dataset.billing;
      document.querySelectorAll(".billing-button").forEach((other) => {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll(".price-value").forEach((price) => {
        const value = price.dataset[billing];
        if (value !== undefined) price.textContent = `$${value}`;
      });
      const studioUnit = document.querySelector(".price-card-featured .price-amount > span:last-child");
      if (studioUnit) studioUnit.textContent = billing === "annual" ? "/ seat / mo, billed annually" : "/ seat / month";
    };
    button.addEventListener("click", selectBilling);
    invokeOnKeyboard(button, selectBilling);
  });

  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-nav");
  const closeMobileNav = () => {
    if (!menuButton || !mobileNav) return;
    mobileNav.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
  };
  const toggleMobileMenu = () => {
    const willOpen = mobileNav?.hidden;
    if (mobileNav) mobileNav.hidden = !willOpen;
    menuButton.setAttribute("aria-expanded", String(Boolean(willOpen)));
    menuButton.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
    if (willOpen) mobileNav?.querySelector("a")?.focus();
  };
  menuButton?.addEventListener("click", toggleMobileMenu);
  invokeOnKeyboard(menuButton, toggleMobileMenu);
  mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileNav));

  updateDemo("dispatch");
})();

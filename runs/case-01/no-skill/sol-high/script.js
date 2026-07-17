(function () {
  "use strict";

  const states = {
    dispatch: {
      tab: "tab-dispatch",
      node: "DISPATCH",
      orchestrator: "Scoping brief · 3 tasks ready",
      title: "Awaiting outputs",
      detail: "Completed work returns here for review",
      checks: "0 / 3",
      agents: [
        { status: "READY", tone: "ready", progress: 8, active: false },
        { status: "READY", tone: "ready", progress: 5, active: false },
        { status: "BLOCKED", tone: "wait", progress: 0, active: false }
      ]
    },
    build: {
      tab: "tab-build",
      node: "COORDINATE",
      orchestrator: "Monitoring 2 active lanes · 1 dependency",
      title: "Work in flight",
      detail: "QA unlocks when UI and API contracts land",
      checks: "0 / 3",
      agents: [
        { status: "BUILDING", tone: "run", progress: 68, active: true },
        { status: "TESTING", tone: "run", progress: 81, active: true },
        { status: "WAITING", tone: "wait", progress: 14, active: false }
      ]
    },
    return: {
      tab: "tab-return",
      node: "REVIEW",
      orchestrator: "Final suite passed · outputs reconciled",
      title: "3 outputs ready to combine",
      detail: "13 files changed · 42 checks passed · 0 conflicts",
      checks: "3 / 3",
      agents: [
        { status: "DONE", tone: "done", progress: 100, active: false, complete: true },
        { status: "DONE", tone: "done", progress: 100, active: false, complete: true },
        { status: "DONE", tone: "done", progress: 100, active: false, complete: true }
      ]
    }
  };

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const lanes = Array.from(document.querySelectorAll(".lane"));
  const laneView = document.getElementById("lane-view");
  const runButton = document.getElementById("run-demo");
  const liveStatus = document.getElementById("run-status");
  let runTimers = [];

  function setState(name, announce) {
    const state = states[name];
    if (!state) return;

    tabs.forEach(function (tab) {
      const selected = tab.dataset.state === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    laneView.setAttribute("aria-labelledby", state.tab);
    document.getElementById("node-state").textContent = state.node;
    document.getElementById("orchestrator-status").textContent = state.orchestrator;
    document.getElementById("return-title").textContent = state.title;
    document.getElementById("return-detail").textContent = state.detail;
    document.getElementById("return-checks").textContent = state.checks;
    document.querySelector(".return-rail").classList.toggle("has-output", name === "return");

    lanes.forEach(function (lane, index) {
      const agent = state.agents[index];
      const status = lane.querySelector(".status");
      status.textContent = agent.status;
      status.className = "status status-" + agent.tone;
      lane.querySelector(".progress-track span").style.setProperty("--progress", agent.progress + "%");
      lane.querySelector(".progress-value").textContent = agent.progress + "%";
      lane.classList.toggle("is-active", Boolean(agent.active));
      lane.classList.toggle("is-complete", Boolean(agent.complete));
    });

    if (announce) liveStatus.textContent = "Orchestration demo: " + name + " state. " + state.orchestrator + ".";
  }

  function stopSequence() {
    runTimers.forEach(window.clearTimeout);
    runTimers = [];
    runButton.classList.remove("is-playing");
    runButton.querySelector(".run-label").textContent = "Run sequence";
  }

  function runSequence() {
    stopSequence();
    runButton.classList.add("is-playing");
    runButton.querySelector(".run-label").textContent = "Running";
    setState("dispatch", true);
    runTimers.push(window.setTimeout(function () { setState("build", true); }, 1100));
    runTimers.push(window.setTimeout(function () {
      setState("return", true);
      stopSequence();
      runButton.querySelector(".run-label").textContent = "Replay sequence";
      liveStatus.textContent = "Sequence complete. Three verified outputs are ready to combine.";
    }, 2600));
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      stopSequence();
      setState(tab.dataset.state, true);
    });
    tab.addEventListener("keydown", function (event) {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      tabs[next].focus();
      tabs[next].click();
    });
  });
  runButton.addEventListener("click", runSequence);

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("site-nav");
  menuButton.addEventListener("click", function () {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    navigation.classList.toggle("is-open", !open);
  });
  navigation.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });

  const billingButtons = Array.from(document.querySelectorAll(".billing-option"));
  const priceValues = Array.from(document.querySelectorAll(".price strong[data-monthly]"));
  billingButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const period = button.dataset.period;
      billingButtons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      priceValues.forEach(function (price) {
        price.textContent = price.dataset[period];
      });
      document.getElementById("billing-note").textContent = period === "annual"
        ? "Billed annually. Prices shown as monthly equivalent."
        : "Billed monthly. Cancel any time.";
    });
  });

  document.getElementById("signup-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email");
    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }
    document.getElementById("form-status").textContent = "You’re on the list — we’ll send beta details to " + email.value + ".";
    this.reset();
  });

  setState("dispatch", false);
})();

(function () {
  "use strict";

  const operationStates = {
    dispatch: {
      label: "DISPATCHING",
      mergeTitle: "Awaiting outputs",
      mergeDetail: "Rook's interface lane is ready.",
      count: "1 / 3",
      caption: "The orchestrator gives each agent its own lane, dependency context, and clean return path—without turning your desktop into a pile of terminals.",
      orch: "3 lanes / 1 shared brief"
    },
    review: {
      label: "IN REVIEW",
      mergeTitle: "Evidence arriving",
      mergeDetail: "Fern returned the contract; Moss is verifying it.",
      count: "2 / 3",
      caption: "Review mode makes the handoff visible: returned files, decisions, and test evidence arrive together, in the order they affect your merge.",
      orch: "1 dependency cleared / 2 returns"
    },
    merge: {
      label: "READY TO MERGE",
      mergeTitle: "Coherent change set",
      mergeDetail: "3 lanes returned · checks passed.",
      count: "3 / 3",
      caption: "The operation closes with one coherent change set. You retain the reasoning trail and the final call, even when the implementation was parallel.",
      orch: "3 lanes resolved / no conflicts"
    }
  };

  const agentDetails = {
    fern: { name: "Fern / integration", detail: "Rebuilding the retry contract before tests unblock.", path: "worktree / queue-resilience" },
    moss: { name: "Moss / test strategy", detail: "Holding a matrix of race conditions until the queue contract stabilizes.", path: "depends on / retry-contract.ts" },
    rook: { name: "Rook / interface", detail: "Returned queue health signals with zero conflicts for review.", path: "returned / 4 files, 0 conflicts" }
  };

  const board = document.querySelector(".mission-board");
  const operationState = document.getElementById("operation-state");
  const mergeTitle = document.getElementById("merge-title");
  const mergeDetail = document.getElementById("merge-detail");
  const mergeCount = document.getElementById("merge-count");
  const boardCaption = document.getElementById("board-caption");
  const orchDetail = document.getElementById("orch-detail");
  const stateControls = document.querySelectorAll("[data-demo-state]");

  function activateState(state) {
    const config = operationStates[state];
    if (!config) return;
    board.dataset.state = state;
    operationState.textContent = config.label;
    mergeTitle.textContent = config.mergeTitle;
    mergeDetail.textContent = config.mergeDetail;
    mergeCount.textContent = config.count;
    boardCaption.textContent = config.caption;
    orchDetail.textContent = config.orch;
    stateControls.forEach((control) => {
      const isActive = control.dataset.demoState === state;
      control.classList.toggle("is-active", isActive);
      if (control.classList.contains("state-control")) control.setAttribute("aria-pressed", String(isActive));
    });
  }

  stateControls.forEach((control) => control.addEventListener("click", () => activateState(control.dataset.demoState)));

  const agents = document.querySelectorAll(".agent-card");
  const inspector = document.getElementById("agent-inspector-content");
  agents.forEach((agent) => {
    agent.addEventListener("click", () => {
      const detail = agentDetails[agent.dataset.agent];
      agents.forEach((item) => {
        const selected = item === agent;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      inspector.innerHTML = `<strong>${detail.name}</strong><span>${detail.detail}</span><code>${detail.path}</code>`;
    });
  });

  const billingButtons = document.querySelectorAll("[data-billing]");
  const prices = { monthly: { operator: "24", command: "48", period: "/ month", commandPeriod: "/ seat / month" }, yearly: { operator: "19", command: "38", period: "/ month, billed yearly", commandPeriod: "/ seat / month, billed yearly" } };
  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const billing = button.dataset.billing;
      billingButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector('[data-price="operator"]').textContent = prices[billing].operator;
      document.querySelector('[data-price="command"]').textContent = prices[billing].command;
      document.querySelectorAll("[data-period]")[0].textContent = prices[billing].period;
      document.querySelectorAll("[data-period]")[1].textContent = prices[billing].commandPeriod;
    });
  });

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    nav.classList.toggle("is-open", !open);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    }
  }));
})();

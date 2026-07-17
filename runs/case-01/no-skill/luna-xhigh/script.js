(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const toast = document.querySelector(".toast");
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
      navLinks.classList.toggle("is-open", !isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        navLinks.classList.remove("is-open");
      });
    });
  }

  const demo = document.querySelector(".demo-window");
  const phaseButtons = [...document.querySelectorAll("[data-phase-button]")];
  const runState = document.querySelector("[data-run-state]");
  const phaseCopy = document.querySelector("[data-phase-copy]");
  const orchestratorCopy = document.querySelector("[data-orchestrator-copy]");
  const outputCopy = document.querySelector("[data-output-copy]");
  const eventCopy = document.querySelector("[data-event-copy]");
  const playButton = document.querySelector("[data-play]");
  const laneCards = [...document.querySelectorAll(".lane-card")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const filterSummary = document.querySelector("[data-filter-summary]");
  let playbackTimer;
  let playbackIndex = 0;
  let currentPhase = "observe";

  const phases = {
    dispatch: {
      copy: "Brief parsed into 4 independent work packets.",
      state: "4 lanes queued",
      orchestrator: "routing signals · preparing 4 lanes",
      output: "No output yet · agents are taking their lanes",
      event: "brief.yml split into 4 lanes · 12:47:01"
    },
    observe: {
      copy: "Agents are reading the brief and staking their lanes.",
      state: "4 lanes in motion",
      orchestrator: "routing signals · watching 4 lanes",
      output: "Atlas signed the contract · ready for synthesis",
      event: "atlas emitted contract.json · 12:47:55"
    },
    synthesize: {
      copy: "The cleanest paths are lining up for review.",
      state: "1 output ready",
      orchestrator: "reviewing evidence · resolving 2 dependencies",
      output: "1 completed output · review and merge when ready",
      event: "synthesis packet created · 12:48:09"
    }
  };

  const setPhase = (phase, fromPlayback = false) => {
    if (!phases[phase] || !demo) return;
    currentPhase = phase;
    demo.dataset.phase = phase;
    phaseButtons.forEach((button) => {
      const active = button.dataset.phaseButton === phase;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      if (active && !fromPlayback) button.focus({ preventScroll: true });
    });
    phaseCopy.textContent = phases[phase].copy;
    runState.textContent = phases[phase].state;
    orchestratorCopy.textContent = phases[phase].orchestrator;
    outputCopy.textContent = phases[phase].output;
    eventCopy.textContent = phases[phase].event;
    const progressByPhase = {
      dispatch: { atlas: "12%", nova: "8%", kite: "0%", ember: "0%" },
      observe: { atlas: "100%", nova: "78%", kite: "42%", ember: "12%" },
      synthesize: { atlas: "100%", nova: "100%", kite: "88%", ember: "72%" }
    };
    laneCards.forEach((card) => {
      const progress = progressByPhase[phase][card.dataset.lane];
      const progressBar = card.querySelector(".lane-progress span");
      const meta = card.querySelector(".lane-meta span:first-child");
      progressBar.style.setProperty("--progress", progress);
      meta.textContent = progress;
    });
  };

  phaseButtons.forEach((button) => button.addEventListener("click", () => {
    window.clearInterval(playbackTimer);
    playButton.setAttribute("aria-pressed", "false");
    playButton.innerHTML = "<span aria-hidden=\"true\">▶</span> Play run";
    setPhase(button.dataset.phaseButton);
  }));

  const setFilter = (filter) => {
    let visible = 0;
    laneCards.forEach((card) => {
      const show = filter === "all" || card.dataset.status === filter;
      card.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    filterSummary.textContent = `Showing ${filter === "all" ? "all" : filter} ${visible === 1 ? "lane" : "lanes"} · dependencies resolved in view`;
  };

  filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));

  if (playButton) {
    playButton.addEventListener("click", () => {
      const isPlaying = playButton.getAttribute("aria-pressed") === "true";
      window.clearInterval(playbackTimer);
      if (isPlaying) {
        playButton.setAttribute("aria-pressed", "false");
        playButton.innerHTML = "<span aria-hidden=\"true\">▶</span> Play run";
        return;
      }
      playButton.setAttribute("aria-pressed", "true");
      playButton.innerHTML = "<span aria-hidden=\"true\">■</span> Pause run";
      playbackIndex = 0;
      if (reducedMotion.matches) {
        setPhase("synthesize", true);
        playButton.setAttribute("aria-pressed", "false");
        playButton.innerHTML = "<span aria-hidden=\"true\">▶</span> Play run";
        return;
      }
      setPhase("dispatch", true);
      playbackTimer = window.setInterval(() => {
        playbackIndex += 1;
        setPhase(["observe", "synthesize"][playbackIndex - 1] || "synthesize", true);
        if (playbackIndex >= 2) {
          window.clearInterval(playbackTimer);
          playButton.setAttribute("aria-pressed", "false");
          playButton.innerHTML = "<span aria-hidden=\"true\">↻</span> Replay run";
        }
      }, 1150);
    });
  }

  document.querySelectorAll(".step-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const detail = document.getElementById(button.getAttribute("aria-controls"));
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.firstChild.textContent = expanded ? "Expand step " : "Collapse step ";
      detail.hidden = expanded;
    });
  });

  const billingButtons = [...document.querySelectorAll("[data-billing]")];
  const priceAmounts = [...document.querySelectorAll("[data-monthly]")];
  const priceNotes = [...document.querySelectorAll("[data-price-note]")];
  const billingNote = document.querySelector("[data-billing-note]");
  billingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const billing = button.dataset.billing;
      billingButtons.forEach((item) => {
        const active = item.dataset.billing === billing;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      priceAmounts.forEach((amount) => {
        amount.textContent = `$${amount.dataset[billing]}`;
      });
      priceNotes.forEach((note) => {
        note.textContent = billing === "annual" ? "billed annually · save 20%" : "cancel any time";
      });
      billingNote.textContent = billing === "annual" ? "Annual billing saves 20%. Agents never count as seats." : "Simple monthly billing. No seat math for your agents.";
    });
  });

  document.querySelectorAll("[data-toast]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.toast));
  });

  // Avoid retaining a stale open mobile menu after a responsive resize.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 700 && menuToggle && navLinks) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      navLinks.classList.remove("is-open");
    }
  });

  root.dataset.jsReady = "true";
})();

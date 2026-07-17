(() => {
  "use strict";

  const state = {
    facility: "network",
    dateRange: "today",
    displayState: "populated"
  };

  const facilities = {
    network: {
      label: "All facilities",
      metrics: { processed: "84,260", processedUnit: "parcels", processedDetail: "+6.4% vs plan", processedTrend: "up", onTime: "96.8", onTimeDetail: "+1.2 pts vs last shift", backlog: "1,284", backlogDetail: "−18.6% since 12:00", backlogTrend: "up", capacity: "78", capacityDetail: "of 100% available" },
      chart: [54, 58, 62, 68, 76, 81, 79, 86],
      plan: [57, 61, 64, 68, 72, 76, 80, 82],
      statuses: [
        ["Memphis South", "MSP-04", "Operational", "teal", "34,820", 82, "Normal intake"],
        ["Dallas North", "DAL-02", "Watch", "amber", "22,460", 91, "Dock 3 queue"],
        ["Newark East", "EWR-07", "Operational", "teal", "18,740", 74, "Normal intake"],
        ["Reno West", "RNO-01", "Degraded", "red", "8,240", 96, "Sort belt 2"],
      ]
    },
    memphis: {
      label: "Memphis South",
      metrics: { processed: "34,820", processedUnit: "parcels", processedDetail: "+4.1% vs plan", processedTrend: "up", onTime: "97.4", onTimeDetail: "+0.8 pts vs last shift", backlog: "416", backlogDetail: "−12.2% since 12:00", backlogTrend: "up", capacity: "82", capacityDetail: "of 100% available" },
      chart: [40, 44, 47, 54, 61, 64, 68, 72],
      plan: [42, 45, 49, 52, 57, 61, 65, 70],
      statuses: [["Memphis South", "MSP-04", "Operational", "teal", "34,820", 82, "Normal intake"]]
    },
    dallas: {
      label: "Dallas North",
      metrics: { processed: "22,460", processedUnit: "parcels", processedDetail: "−2.1% vs plan", processedTrend: "warn", onTime: "94.2", onTimeDetail: "−0.9 pts vs last shift", backlog: "538", backlogDetail: "+7.4% since 12:00", backlogTrend: "warn", capacity: "91", capacityDetail: "near operating limit" },
      chart: [38, 42, 48, 45, 55, 58, 52, 63],
      plan: [41, 44, 47, 51, 54, 58, 61, 65],
      statuses: [["Dallas North", "DAL-02", "Watch", "amber", "22,460", 91, "Dock 3 queue"]]
    },
    newark: {
      label: "Newark East",
      metrics: { processed: "18,740", processedUnit: "parcels", processedDetail: "+8.9% vs plan", processedTrend: "up", onTime: "98.1", onTimeDetail: "+1.7 pts vs last shift", backlog: "205", backlogDetail: "−24.3% since 12:00", backlogTrend: "up", capacity: "74", capacityDetail: "of 100% available" },
      chart: [30, 36, 39, 42, 49, 53, 57, 61],
      plan: [31, 34, 38, 41, 45, 49, 53, 57],
      statuses: [["Newark East", "EWR-07", "Operational", "teal", "18,740", 74, "Normal intake"]]
    },
    reno: {
      label: "Reno West",
      metrics: { processed: "8,240", processedUnit: "parcels", processedDetail: "−9.5% vs plan", processedTrend: "warn", onTime: "91.6", onTimeDetail: "−3.4 pts vs last shift", backlog: "125", backlogDetail: "+16.1% since 12:00", backlogTrend: "warn", capacity: "96", capacityDetail: "critical utilization" },
      chart: [18, 21, 25, 22, 29, 31, 28, 33],
      plan: [20, 23, 26, 28, 30, 33, 35, 37],
      statuses: [["Reno West", "RNO-01", "Degraded", "red", "8,240", 96, "Sort belt 2"]]
    }
  };

  const alerts = [
    ["PKG-7041-883", "Reno West · Sort belt 2", "48 min"],
    ["PKG-7041-271", "Dallas North · Dock 3", "37 min"],
    ["PKG-7040-906", "Memphis South · Line 4", "24 min"],
  ];

  const events = [
    ["Reno West marked degraded", "Sort belt 2 throughput below threshold", "16:34", "amber"],
    ["Trailer 8842 checked in", "Memphis South · Door 18", "16:25", "blue"],
    ["Backlog threshold cleared", "Newark East · Priority lane", "16:19", "teal"],
    ["Scanner firmware rollout complete", "Dallas North · 18 devices", "16:03", "teal"],
  ];

  const metricsRegion = document.getElementById("metrics-region");
  const chartRegion = document.getElementById("chart-region");
  const alertsRegion = document.getElementById("alerts-region");
  const tableRegion = document.getElementById("facility-table-region");
  const eventsRegion = document.getElementById("events-region");
  const stateDescription = document.getElementById("state-description");
  const liveRegion = document.getElementById("live-region");
  const chartTotal = document.getElementById("chart-total");
  const chartCaption = document.getElementById("chart-caption");
  const alertCount = document.getElementById("alert-count");
  const facilityUpdated = document.getElementById("facility-updated");

  const iconPaths = {
    processed: '<path d="M5 7h14M5 12h14M5 17h8"/><path d="m16 15 2 2 3-4"/>',
    onTime: '<path d="M12 5v7l4 2"/><circle cx="12" cy="12" r="8"/>',
    backlog: '<path d="M5 6h14v12H5z"/><path d="M8 10h8M8 14h5"/>',
    capacity: '<path d="M5 19V9l7-4 7 4v10"/><path d="M8 19v-5h8v5"/>'
  };

  const metricDefinitions = [
    { key: "processed", label: "Processed volume", icon: "processed", unitKey: "processedUnit" },
    { key: "onTime", label: "On-time departure", icon: "onTime", suffix: "%", detailKey: "onTimeDetail", trendKey: "onTime" },
    { key: "backlog", label: "Open backlog", icon: "backlog", unit: "parcels", detailKey: "backlogDetail", trendKey: "backlog" },
    { key: "capacity", label: "Network capacity", icon: "capacity", suffix: "%", detailKey: "capacityDetail" }
  ];

  const dateLabels = {
    today: "today",
    yesterday: "yesterday",
    "seven-days": "the last 7 days"
  };

  function getDataset() {
    return facilities[state.facility] || facilities.network;
  }

  function renderMetricCards() {
    const data = getDataset().metrics;
    metricsRegion.innerHTML = metricDefinitions.map((metric) => {
      const value = data[metric.key];
      const detail = data[metric.detailKey] || data[`${metric.key}Detail`] || "Stable against operating plan";
      const trendClass = data[`${metric.key}Trend`] === "warn" || data[metric.trendKey] === "warn" ? "trend-warn" : "trend-up";
      return `<article class="metric-card">
        <div class="metric-top"><span class="metric-label">${metric.label}</span><span class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${iconPaths[metric.icon]}</svg></span></div>
        <div class="metric-value-row"><strong class="metric-value">${value}</strong><span class="metric-unit">${metric.suffix || metric.unit || data[metric.unitKey] || ""}</span></div>
        <p class="metric-detail"><span class="metric-trend ${trendClass}">${detail}</span></p>
      </article>`;
    }).join("");
  }

  function renderChart() {
    const dataset = getDataset();
    const values = dataset.chart;
    const plans = dataset.plan;
    const width = 720;
    const height = 225;
    const left = 42;
    const right = 13;
    const top = 15;
    const bottom = 34;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const max = 100;
    const xFor = (index) => left + (index * plotWidth) / (values.length - 1);
    const yFor = (value) => top + plotHeight - (value / max) * plotHeight;
    const points = values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
    const planPoints = plans.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
    const areaPoints = `${left},${top + plotHeight} ${points} ${xFor(values.length - 1)},${top + plotHeight}`;
    const xLabels = ["00", "04", "08", "12", "16", "20", "24"];
    const xPositions = xLabels.map((_, index) => left + (index * plotWidth) / (xLabels.length - 1));
    const gridlines = [25, 50, 75].map((value) => `<line class="chart-gridline" x1="${left}" x2="${width - right}" y1="${yFor(value)}" y2="${yFor(value)}" />`).join("");
    const yLabels = [100, 75, 50, 25].map((value) => `<text class="chart-axis-label" x="${left - 10}" y="${yFor(value) + 4}" text-anchor="end">${value}</text>`).join("");
    const xAxis = xLabels.map((label, index) => `<text class="chart-axis-label" x="${xPositions[index]}" y="${height - 10}" text-anchor="middle">${label}</text>`).join("");
    const circles = values.map((value, index) => `<circle class="chart-point" cx="${xFor(index)}" cy="${yFor(value)}" r="4" tabindex="0" role="img" aria-label="${xLabels[Math.min(index, xLabels.length - 1)]}:00, ${value} percent of hourly target"><title>${xLabels[Math.min(index, xLabels.length - 1)]}:00 — ${value} percent</title></circle>`).join("");
    chartRegion.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Hourly parcel processing volume for ${getDataset().label}">
      <g aria-hidden="true">${gridlines}${yLabels}${xAxis}</g>
      <polyline class="chart-plan" points="${planPoints}" aria-hidden="true"></polyline>
      <polygon class="chart-area" points="${areaPoints}" aria-hidden="true"></polygon>
      <polyline class="chart-line" points="${points}" aria-hidden="true"></polyline>
      <g>${circles}</g>
    </svg>`;
    chartRegion.appendChild(chartCaption);
    chartTotal.textContent = dataset.metrics.processed;
    chartCaption.textContent = `Hourly processed parcels compared with the operating plan for ${dataset.label}, ${dateLabels[state.dateRange]}. Focus a point for detail.`;
  }

  function renderAlerts() {
    alertsRegion.innerHTML = alerts.map(([tracking, location, duration]) => `<div class="alert-item"><div class="alert-main"><strong>${tracking}</strong><span>${location}</span></div><span class="alert-duration">${duration}</span></div>`).join("");
    alertCount.textContent = "07 open";
  }

  function renderFacilityTable() {
    const rows = getDataset().statuses;
    const body = rows.map(([name, code, status, tone, volume, utilization, note]) => {
      const meterClass = utilization >= 94 ? "meter-fill--critical" : utilization >= 88 ? "meter-fill--warn" : "";
      return `<tr><td><div class="facility-name"><span class="status-dot status-dot--${tone}" aria-hidden="true"></span><span>${name}</span></div><span class="sr-only">Facility code ${code}</span></td><td><span class="status-label"><span class="status-dot status-dot--${tone}" aria-hidden="true"></span>${status}</span></td><td>${volume}</td><td><div class="utilization-meter"><span class="meter-track"><span class="meter-fill ${meterClass}" style="width:${utilization}%"></span></span><span class="meter-value">${utilization}%</span></div></td><td>${note}</td></tr>`;
    }).join("");
    tableRegion.innerHTML = `<table class="facility-table"><caption class="sr-only">Facility health and utilization for ${getDataset().label}</caption><thead><tr><th scope="col">Facility</th><th scope="col">Status</th><th scope="col">Processed</th><th scope="col">Utilization</th><th scope="col">Signal</th></tr></thead><tbody>${body}</tbody></table>`;
    facilityUpdated.textContent = state.facility === "network" ? "Updated 2 min ago" : "Filtered just now";
  }

  function renderEvents() {
    eventsRegion.innerHTML = events.map(([title, detail, time, tone]) => `<li class="event-item"><span class="event-marker event-marker--${tone}" aria-hidden="true"></span><div class="event-item-main"><strong>${title}</strong><span>${detail}</span></div><div class="event-meta"><time>${time}</time><span>CT</span></div></li>`).join("");
  }

  function stateIcon(type) {
    if (type === "error") return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4 3.5 19h17L12 4Z"/><path d="M12 9v4M12 16h.01"/></svg>';
    if (type === "empty") return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 7h14v12H5z"/><path d="M8 7V5h8v2M9 12h6"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v7l4 2"/><circle cx="12" cy="12" r="8"/></svg>';
  }

  function stateCard(type, title, description) {
    if (type === "loading") return `<div class="state-card"><div class="skeleton-stack" role="status" aria-label="Loading dashboard data"><div class="skeleton-line"></div><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--tiny"></div></div></div>`;
    return `<div class="state-card state-card--${type}"><div><div class="state-card-icon">${stateIcon(type)}</div><h3>${title}</h3><p>${description}</p></div></div>`;
  }

  function renderState() {
    const type = state.displayState;
    document.querySelectorAll(".state-button").forEach((button) => {
      const active = button.dataset.state === type;
      button.classList.toggle("state-button--active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (type === "populated") {
      stateDescription.textContent = `Showing current data for ${getDataset().label.toLowerCase()} · ${dateLabels[state.dateRange]}`;
      renderMetricCards();
      renderChart();
      renderAlerts();
      renderFacilityTable();
      renderEvents();
      return;
    }

    const copy = {
      loading: ["Loading dashboard data", "Refreshing parcel, facility, and exception signals."],
      empty: ["No operational data", `There are no records for ${getDataset().label} in this time window.`],
      error: ["Data feed unavailable", "The network feed did not respond. Try live data again when the connection is restored."]
    }[type];
    stateDescription.textContent = `${type[0].toUpperCase()}${type.slice(1)} state preview`;
    metricsRegion.innerHTML = `<div class="state-card ${type === "loading" ? "" : `state-card--${type}`}"><div>${type === "loading" ? '<div class="skeleton-stack" role="status" aria-label="Loading dashboard data"><div class="skeleton-line"></div><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--tiny"></div></div>' : `<div class="state-card-icon">${stateIcon(type)}</div><h3>${copy[0]}</h3><p>${copy[1]}</p>`}</div></div>`;
    chartRegion.innerHTML = stateCard(type, copy[0], copy[1]);
    chartRegion.appendChild(chartCaption);
    alertsRegion.innerHTML = stateCard(type, copy[0], copy[1]);
    tableRegion.innerHTML = stateCard(type, copy[0], copy[1]);
    eventsRegion.innerHTML = `<li class="event-state">${stateCard(type, copy[0], copy[1])}</li>`;
    chartTotal.textContent = "—";
    chartCaption.textContent = type === "loading" ? "Waiting for the latest hourly series." : copy[1];
    alertCount.textContent = "—";
    facilityUpdated.textContent = type === "loading" ? "Refreshing…" : "No update";
  }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => { liveRegion.textContent = message; }, 20);
  }

  function setupSidebar() {
    const toggle = document.getElementById("sidebar-toggle");
    const viewportQuery = window.matchMedia("(max-width: 680px)");
    const syncSidebarMode = () => {
      if (viewportQuery.matches) {
        document.body.classList.remove("sidebar-collapsed");
        document.body.classList.remove("sidebar-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
      } else {
        document.body.classList.remove("sidebar-open");
        const expanded = !document.body.classList.contains("sidebar-collapsed");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
      }
    };
    syncSidebarMode();
    if (typeof viewportQuery.addEventListener === "function") viewportQuery.addEventListener("change", syncSidebarMode);
    toggle.addEventListener("click", () => {
      const mobile = viewportQuery.matches;
      if (mobile) {
        document.body.classList.toggle("sidebar-open");
        const open = document.body.classList.contains("sidebar-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        announce(open ? "Navigation opened" : "Navigation closed");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
        const expanded = !document.body.classList.contains("sidebar-collapsed");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
        announce(expanded ? "Navigation expanded" : "Navigation collapsed");
      }
    });

    document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
      if (viewportQuery.matches) {
        document.body.classList.remove("sidebar-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
      }
    }));
  }

  function setupControls() {
    document.getElementById("facility-select").addEventListener("change", (event) => {
      state.facility = event.target.value;
      if (state.displayState === "populated") renderState();
      announce(`Facility filter changed to ${getDataset().label}`);
    });

    document.getElementById("date-select").addEventListener("change", (event) => {
      state.dateRange = event.target.value;
      const rangeLabel = event.target.options[event.target.selectedIndex].text;
      if (state.displayState === "populated") renderState();
      announce(`Date window changed to ${rangeLabel}`);
    });

    document.querySelectorAll(".state-button").forEach((button) => button.addEventListener("click", () => {
      state.displayState = button.dataset.state;
      renderState();
      announce(`${button.textContent} display state selected`);
    }));

    document.getElementById("view-all-delays").addEventListener("click", () => announce("All delay cases are outside this standalone dashboard view."));
    document.querySelector(".avatar-button").addEventListener("click", () => announce("Profile menu is not connected in this standalone dashboard."));
    document.querySelector(".panel-action").addEventListener("click", () => announce("Event log is represented by the recent operational events panel."));
  }

  setupSidebar();
  setupControls();
  renderState();
})();

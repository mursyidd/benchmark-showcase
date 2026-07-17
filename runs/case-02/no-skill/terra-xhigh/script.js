(() => {
  "use strict";

  const DATA = {
    network: {
      label: "All facilities",
      metrics: { processed: "248,612", dispatch: "96.4%", dwell: "42 min", delayed: "18", chartTotal: "248.6k", alertCount: "18" },
      actual: [18, 25, 23, 31, 29, 37, 43, 40, 48, 44, 52, 59],
      plan: [19, 23, 26, 28, 31, 34, 38, 42, 45, 49, 53, 57],
      labels: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
      alerts: [
        { severity: "critical", id: "NLX-894-321", route: "KUL Central → Kota Bharu", detail: "Linehaul trailer awaiting departure scan", delay: "42 min late" },
        { severity: "warning", id: "NLX-771-508", route: "JHB Gateway → Singapore West", detail: "Customs pre-clearance review", delay: "28 min late" },
        { severity: "warning", id: "NLX-607-214", route: "PEN Sort Center → Ipoh", detail: "Sortation exception in outbound lane 4", delay: "21 min late" }
      ],
      facilities: [
        { name: "Kuala Lumpur Central Hub", code: "KUL-01", status: "Normal", state: "normal", processed: "96,842", onTime: "97.1%", dwell: "38 min", exceptions: "4" },
        { name: "Johor Bahru Gateway", code: "JHB-02", status: "Watch", state: "watch", processed: "61,295", onTime: "94.6%", dwell: "51 min", exceptions: "7" },
        { name: "Penang Sort Center", code: "PEN-03", status: "Normal", state: "normal", processed: "48,706", onTime: "96.8%", dwell: "39 min", exceptions: "2" },
        { name: "Kuching Crossdock", code: "KCH-04", status: "Exception", state: "issue", processed: "41,769", onTime: "93.4%", dwell: "59 min", exceptions: "5" }
      ],
      events: [
        { type: "success", time: "09:38", title: "KUL-01 wave 7 released", detail: "18,420 parcels cleared to outbound sortation." },
        { type: "warning", time: "09:31", title: "JHB-02 departure risk raised", detail: "SIN West linehaul may miss the 10:00 handoff window." },
        { type: "info", time: "09:24", title: "PEN-03 sorter lane 4 restored", detail: "Exception queue returned below operating threshold." },
        { type: "info", time: "09:14", title: "KCH-04 inbound manifest received", detail: "Flight MH2585 inducted 2,190 parcels for crossdock." }
      ]
    },
    kul: {
      label: "Kuala Lumpur Central Hub",
      metrics: { processed: "96,842", dispatch: "97.1%", dwell: "38 min", delayed: "4", chartTotal: "96.8k", alertCount: "4" },
      actual: [8, 11, 10, 13, 12, 15, 17, 16, 19, 17, 20, 23],
      plan: [8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22],
      labels: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
    },
    jhb: {
      label: "Johor Bahru Gateway",
      metrics: { processed: "61,295", dispatch: "94.6%", dwell: "51 min", delayed: "7", chartTotal: "61.3k", alertCount: "7" },
      actual: [5, 7, 7, 8, 7, 10, 11, 10, 12, 11, 13, 14],
      plan: [5, 7, 8, 8, 9, 9, 10, 11, 11, 12, 13, 14],
      labels: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
    },
    pen: {
      label: "Penang Sort Center",
      metrics: { processed: "48,706", dispatch: "96.8%", dwell: "39 min", delayed: "2", chartTotal: "48.7k", alertCount: "2" },
      actual: [4, 5, 5, 7, 6, 8, 8, 8, 10, 9, 10, 12],
      plan: [4, 5, 6, 6, 7, 7, 8, 9, 9, 10, 10, 11],
      labels: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
    },
    kch: {
      label: "Kuching Crossdock",
      metrics: { processed: "41,769", dispatch: "93.4%", dwell: "59 min", delayed: "5", chartTotal: "41.8k", alertCount: "5" },
      actual: [3, 4, 4, 5, 5, 6, 7, 6, 7, 7, 9, 10],
      plan: [3, 4, 4, 5, 6, 6, 7, 7, 8, 8, 9, 10],
      labels: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
    }
  };

  const RANGE_MODIFIERS = {
    today: { suffix: "", volume: 1 },
    "7d": { suffix: " · 7-day view", volume: 6.65 },
    "30d": { suffix: " · 30-day view", volume: 28.4 }
  };

  const app = {
    state: "populated",
    facility: "network",
    range: "today",
    sidebarCollapsed: false,
    mobileNavOpen: false
  };

  const content = document.querySelector("#dashboard-content");
  const announcer = document.querySelector("#state-announcement");
  const facilitySelect = document.querySelector("#facility-select");
  const rangeSelect = document.querySelector("#range-select");
  const stateButtons = [...document.querySelectorAll(".state-button")];
  const sidebarToggle = document.querySelector("#sidebar-toggle");
  const mobileMenuButton = document.querySelector("#mobile-menu-button");
  const navBackdrop = document.querySelector("#nav-backdrop");

  function cloneTemplate(id) {
    return document.querySelector(id).content.cloneNode(true);
  }

  function formatVolume(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}m`;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    return String(value);
  }

  function scaleMetric(metric, multiplier) {
    const raw = Number(metric.replace(/,/g, ""));
    return Number.isFinite(raw) ? Math.round(raw * multiplier).toLocaleString("en-US") : metric;
  }

  function seriesForRange(data, range) {
    if (range === "today") {
      return {
        actual: data.actual,
        plan: data.plan,
        labels: data.labels,
        note: "Cut-off: 09:30 MYT · Includes inducted and departed parcels."
      };
    }

    if (range === "7d") {
      const dates = ["Mon 7", "Tue 8", "Wed 9", "Thu 10", "Fri 11", "Sat 12", "Sun 13"];
      return {
        actual: data.actual.slice(-7).map((value, index) => Math.round(value * 5 + index * 3)),
        plan: data.plan.slice(-7).map((value, index) => Math.round(value * 5 + index * 2)),
        labels: dates,
        note: "Daily processed volume · 7–13 Jul · Includes inducted and departed parcels."
      };
    }

    return {
      actual: data.actual.slice(2).map((value, index) => Math.round(value * 12 + (index % 3) * 8)),
      plan: data.plan.slice(2).map((value, index) => Math.round(value * 12 + (index % 2) * 7)),
      labels: ["14 Jun", "17 Jun", "20 Jun", "23 Jun", "26 Jun", "29 Jun", "2 Jul", "5 Jul", "8 Jul", "13 Jul"],
      note: "Five-day processed volume · 14 Jun–13 Jul · Includes inducted and departed parcels."
    };
  }

  function displayedData() {
    const selected = DATA[app.facility];
    const network = DATA.network;
    const modifier = RANGE_MODIFIERS[app.range];
    const metrics = { ...selected.metrics };

    if (app.range !== "today") {
      metrics.processed = scaleMetric(selected.metrics.processed, modifier.volume);
      metrics.chartTotal = formatVolume(Number(selected.metrics.chartTotal.replace("k", "")) * modifier.volume * 1000);
      metrics.delayed = String(Math.max(1, Math.round(Number(selected.metrics.delayed) * (app.range === "7d" ? 1.85 : 5.15))));
      metrics.alertCount = metrics.delayed;
    }

    const series = seriesForRange(selected, app.range);
    return {
      ...selected,
      ...series,
      metrics,
      alerts: selected.alerts || network.alerts,
      facilities: app.facility === "network" ? network.facilities : network.facilities.filter((facility) => facility.code.toLowerCase().startsWith(app.facility)),
      events: selected.events || network.events,
      rangeSuffix: modifier.suffix
    };
  }

  function createChart(data) {
    const width = 760;
    const height = 250;
    const pad = { top: 14, right: 22, bottom: 35, left: 42 };
    const max = Math.ceil(Math.max(...data.actual, ...data.plan) / 10) * 10;
    const x = (index) => pad.left + (index * (width - pad.left - pad.right)) / (data.actual.length - 1);
    const y = (value) => pad.top + ((max - value) * (height - pad.top - pad.bottom)) / max;
    const points = (series) => series.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
    const yTicks = [0, .25, .5, .75, 1].map((ratio) => Math.round(max * ratio)).reverse();
    const grid = yTicks.map((tick) => `<g><line x1="${pad.left}" y1="${y(tick)}" x2="${width - pad.right}" y2="${y(tick)}" stroke="#dce4ec" stroke-width="1"/><text x="${pad.left - 9}" y="${y(tick) + 4}" text-anchor="end" fill="#748297" font-size="10" font-family="system-ui, sans-serif">${tick}k</text></g>`).join("");
    const xLabels = data.labels.map((label, index) => {
      if (index % 2 !== 0 && index !== data.labels.length - 1) return "";
      return `<text x="${x(index)}" y="${height - 11}" text-anchor="middle" fill="#748297" font-size="10" font-family="system-ui, sans-serif">${label}</text>`;
    }).join("");
    const actualPoints = points(data.actual);
    const area = `${pad.left},${height - pad.bottom} ${actualPoints} ${x(data.actual.length - 1)},${height - pad.bottom}`;
    const latest = data.actual.length - 1;

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-svg-title chart-svg-desc" preserveAspectRatio="xMidYMid meet"><title id="chart-svg-title">Parcel volume over the selected operating window</title><desc id="chart-svg-desc">Processed parcels rise from ${data.actual[0]} thousand to ${data.actual[latest]} thousand, compared with the planned volume line.</desc><defs><linearGradient id="volume-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#3c82c7" stop-opacity=".22"/><stop offset="100%" stop-color="#3c82c7" stop-opacity=".015"/></linearGradient></defs>${grid}<polygon points="${area}" fill="url(#volume-fill)"/><polyline points="${points(data.plan)}" fill="none" stroke="#8a98aa" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${actualPoints}" fill="none" stroke="#1f65b0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(latest)}" cy="${y(data.actual[latest])}" r="4.5" fill="#fff" stroke="#1f65b0" stroke-width="3"/>${xLabels}</svg>`;
  }

  function populateContent() {
    const data = displayedData();
    content.replaceChildren(cloneTemplate("#populated-template"));

    content.querySelectorAll("[data-metric]").forEach((element) => {
      element.textContent = data.metrics[element.dataset.metric];
    });
    content.querySelector("[data-chart-total]").textContent = data.metrics.chartTotal;
    content.querySelector("[data-alert-count]").textContent = data.metrics.alertCount;
    content.querySelector("#parcel-chart").innerHTML = createChart(data);
    content.querySelector("[data-chart-note]").textContent = data.note;

    content.querySelector("#alert-list").innerHTML = data.alerts.map((alert) => `
      <li class="alert-item alert-item--${alert.severity}">
        <span class="alert-rail" aria-hidden="true"></span>
        <div><h3>${alert.id} <span aria-hidden="true">·</span> ${alert.route}</h3><p>${alert.detail}</p></div>
        <span class="delay-pill">${alert.delay}</span>
      </li>`).join("");

    content.querySelector("#facility-table-body").innerHTML = data.facilities.map((facility) => `
      <tr>
        <td><span class="facility-name">${facility.name}</span><span class="facility-code">${facility.code}</span></td>
        <td><span class="status-badge status-badge--${facility.state}">${facility.status}</span></td>
        <td>${facility.processed}</td><td>${facility.onTime}</td><td>${facility.dwell}</td>
        <td class="${Number(facility.exceptions) > 3 ? "exception-count" : ""}">${facility.exceptions}</td>
      </tr>`).join("");

    content.querySelector("#event-list").innerHTML = data.events.map((event) => `
      <li class="event-item"><span class="event-dot event-dot--${event.type}" aria-hidden="true"></span><div class="event-body"><div class="event-title"><span>${event.title}</span><time>${event.time}</time></div><p class="event-detail">${event.detail}</p></div></li>`).join("");

    content.querySelector("#refresh-button").addEventListener("click", () => {
      setState("loading", "Refreshing live operational data.");
      window.setTimeout(() => setState("populated", "Live operational data refreshed."), 850);
    });
  }

  function renderState() {
    if (app.state === "populated") {
      populateContent();
      return;
    }

    const templateId = `#${app.state}-template`;
    content.replaceChildren(cloneTemplate(templateId));
    if (app.state === "error") {
      content.querySelector("#retry-button").addEventListener("click", () => {
        setState("loading", "Retrying operational data refresh.");
        window.setTimeout(() => setState("populated", "Operational data restored."), 850);
      });
    }
  }

  function setState(nextState, announcement) {
    app.state = nextState;
    stateButtons.forEach((button) => {
      const selected = button.dataset.state === nextState;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    renderState();
    announcer.textContent = announcement || `${nextState[0].toUpperCase()}${nextState.slice(1)} state selected.`;
  }

  function updateForFilter() {
    if (app.state === "populated") renderState();
    const selectedFacility = facilitySelect.options[facilitySelect.selectedIndex].text;
    const selectedRange = rangeSelect.options[rangeSelect.selectedIndex].text;
    announcer.textContent = `Showing ${selectedFacility}, ${selectedRange}.`;
  }

  function setSidebarCollapsed(collapsed) {
    app.sidebarCollapsed = collapsed;
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.title = collapsed ? "Expand navigation" : "Collapse navigation";
    sidebarToggle.querySelector(".sidebar-label").textContent = collapsed ? "Expand" : "Collapse";
    announcer.textContent = `Navigation ${collapsed ? "collapsed" : "expanded"}.`;
  }

  function setMobileNav(open) {
    app.mobileNavOpen = open;
    document.body.classList.toggle("mobile-nav-open", open);
    mobileMenuButton.setAttribute("aria-expanded", String(open));
    if (open) {
      document.querySelector("#sidebar a, #sidebar button").focus();
    } else {
      mobileMenuButton.focus();
    }
  }

  stateButtons.forEach((button, index) => {
    button.addEventListener("click", () => setState(button.dataset.state));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowLeft") next = (index - 1 + stateButtons.length) % stateButtons.length;
      if (event.key === "ArrowRight") next = (index + 1) % stateButtons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = stateButtons.length - 1;
      stateButtons[next].focus();
      setState(stateButtons[next].dataset.state);
    });
  });

  facilitySelect.addEventListener("change", () => { app.facility = facilitySelect.value; updateForFilter(); });
  rangeSelect.addEventListener("change", () => { app.range = rangeSelect.value; updateForFilter(); });
  sidebarToggle.addEventListener("click", () => setSidebarCollapsed(!app.sidebarCollapsed));
  mobileMenuButton.addEventListener("click", () => setMobileNav(!app.mobileNavOpen));
  navBackdrop.addEventListener("click", () => setMobileNav(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && app.mobileNavOpen) setMobileNav(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && app.mobileNavOpen) {
      document.body.classList.remove("mobile-nav-open");
      app.mobileNavOpen = false;
      mobileMenuButton.setAttribute("aria-expanded", "false");
    }
  });

  renderState();
})();

(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const facilities = [
    { code: "CHI", name: "Chicago Gateway", status: "Normal", statusClass: "normal", processed: 284620, plan: 96, onTime: 98.1, backlog: 1240 },
    { code: "DAL", name: "Dallas Central Hub", status: "Watch", statusClass: "watch", processed: 246180, plan: 91, onTime: 94.7, backlog: 3180 },
    { code: "EWR", name: "Newark Air Gateway", status: "Disruption", statusClass: "disruption", processed: 198440, plan: 84, onTime: 89.6, backlog: 4920 },
    { code: "RNO", name: "Reno Regional Sort", status: "Normal", statusClass: "normal", processed: 176930, plan: 102, onTime: 97.8, backlog: 840 },
    { code: "ATL", name: "Atlanta South Hub", status: "Normal", statusClass: "normal", processed: 214760, plan: 98, onTime: 97.2, backlog: 1160 }
  ];

  const datasets = {
    network: {
      metrics: ["1,284,630", "96.4%", "184", "42 min"],
      chart: [162400, 174800, 181200, 176900, 195600, 207300, 186430]
    },
    chicago: {
      metrics: ["284,620", "98.1%", "21", "35 min"],
      chart: [36800, 39100, 40200, 38800, 42900, 45100, 41720]
    },
    dallas: {
      metrics: ["246,180", "94.7%", "48", "46 min"],
      chart: [32900, 34500, 35100, 33600, 37400, 39200, 33480]
    },
    newark: {
      metrics: ["198,440", "89.6%", "76", "58 min"],
      chart: [28100, 30200, 28900, 26700, 31200, 29300, 24040]
    },
    reno: {
      metrics: ["176,930", "97.8%", "14", "31 min"],
      chart: [22400, 23800, 24900, 24200, 27100, 28600, 25930]
    }
  };

  const rangeFactors = { today: 0.145, "7d": 1, "30d": 4.18, shift: 0.062 };
  const rangeLabels = { today: "Hourly volume today", "7d": "Daily volume over the last 7 days", "30d": "Daily volume over the last 30 days", shift: "Hourly volume in the current shift" };
  const dayLabels = ["Jul 7", "Jul 8", "Jul 9", "Jul 10", "Jul 11", "Jul 12", "Jul 13"];
  const hourLabels = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00"];

  const body = document.body;
  const navToggle = $("#nav-toggle");
  const sidebar = $("#sidebar");
  const scrim = $("#sidebar-scrim");
  const facilitySelect = $("#facility-select");
  const rangeSelect = $("#range-select");
  const dashboardRegion = $("#dashboard-region");
  const announcement = $("#announcement");
  const chart = $("#volume-chart");
  const chartWrap = $("#chart-wrap");
  const tooltip = $("#chart-tooltip");
  let activeState = "populated";
  let stateTimer;
  let toastTimer;

  function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function updateNavButton() {
    const open = isMobile() ? body.classList.contains("nav-open") : !body.classList.contains("nav-collapsed");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", isMobile() ? (open ? "Close navigation" : "Open navigation") : (open ? "Collapse navigation" : "Expand navigation"));
  }

  function toggleNavigation() {
    if (isMobile()) {
      body.classList.toggle("nav-open");
    } else {
      body.classList.toggle("nav-collapsed");
    }
    updateNavButton();
  }

  function closeMobileNav() {
    if (!body.classList.contains("nav-open")) return;
    body.classList.remove("nav-open");
    updateNavButton();
    navToggle.focus();
  }

  function showToast(message) {
    const toast = $("#toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function setState(state, shouldAnnounce = true) {
    window.clearTimeout(stateTimer);
    activeState = state;
    const ids = ["populated", "loading", "empty", "error"];
    ids.forEach((name) => {
      $("#" + name + "-state").hidden = name !== state;
    });
    dashboardRegion.setAttribute("aria-busy", String(state === "loading"));
    $$("[data-state]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.state === state)));
    if (shouldAnnounce) {
      const labels = { populated: "Live operations data displayed.", loading: "Operations data is loading.", empty: "No operations data found.", error: "Operations data is unavailable." };
      announcement.textContent = labels[state];
    }
    if (state === "populated") requestAnimationFrame(renderDashboard);
  }

  function formatCompact(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace(".0", "") + "M";
    if (value >= 1000) return Math.round(value / 1000) + "k";
    return String(value);
  }

  function scaledSeries() {
    const dataset = datasets[facilitySelect.value];
    const range = rangeSelect.value;
    const factor = rangeFactors[range];
    if (range === "7d") return dataset.chart.slice();
    if (range === "today" || range === "shift") {
      const patterns = range === "today" ? [.09, .11, .13, .16, .18, .19, .14] : [.08, .12, .17, .2, .18, .15, .1];
      const total = dataset.chart.reduce((sum, number) => sum + number, 0) * factor;
      return patterns.map((portion) => Math.round(total * portion));
    }
    return dataset.chart.map((value, index) => Math.round(value * (3.85 + index * .1)));
  }

  function renderChart() {
    const values = scaledSeries();
    const labels = (rangeSelect.value === "today" || rangeSelect.value === "shift") ? hourLabels : dayLabels;
    const width = Math.max(520, Math.round(chartWrap.clientWidth - 24));
    const height = 250;
    const margin = { top: 16, right: 12, bottom: 35, left: 52 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const maxValue = Math.ceil(Math.max(...values) * 1.18 / 10000) * 10000;
    const x = (index) => margin.left + (plotW * index / (values.length - 1));
    const y = (value) => margin.top + plotH - (value / maxValue * plotH);
    const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const area = `${margin.left},${margin.top + plotH} ${points} ${x(values.length - 1)},${margin.top + plotH}`;
    const grid = [0, .25, .5, .75, 1].map((ratio) => {
      const yy = margin.top + plotH * ratio;
      const value = Math.round(maxValue * (1 - ratio));
      return `<line x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" stroke="#e3e8ed" stroke-width="1"/><text x="${margin.left - 9}" y="${yy + 4}" text-anchor="end" fill="#718092" font-size="10">${formatCompact(value)}</text>`;
    }).join("");
    const xLabels = labels.map((label, index) => `<text x="${x(index)}" y="${height - 10}" text-anchor="middle" fill="#718092" font-size="10">${label}</text>`).join("");
    const dots = values.map((value, index) => `<circle class="chart-point" tabindex="0" role="button" aria-label="${labels[index]}: ${value.toLocaleString()} parcels" data-index="${index}" cx="${x(index)}" cy="${y(value)}" r="4" fill="#fff" stroke="#1c64b5" stroke-width="2"/>`).join("");
    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.innerHTML = `<title id="chart-title">Processed parcel volume trend</title><desc id="chart-desc">${rangeLabels[rangeSelect.value]} for ${facilitySelect.options[facilitySelect.selectedIndex].text}. Each data point is keyboard focusable.</desc><defs><linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b91d3" stop-opacity=".24"/><stop offset="1" stop-color="#4b91d3" stop-opacity=".02"/></linearGradient></defs>${grid}<polygon points="${area}" fill="url(#area-fill)"/><polyline points="${points}" fill="none" stroke="#1c64b5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xLabels}`;
    chart.dataset.values = JSON.stringify(values);
    chart.dataset.labels = JSON.stringify(labels);
  }

  function showChartTooltip(point) {
    const values = JSON.parse(chart.dataset.values || "[]");
    const labels = JSON.parse(chart.dataset.labels || "[]");
    const index = Number(point.dataset.index);
    const chartRect = chart.getBoundingClientRect();
    const wrapRect = chartWrap.getBoundingClientRect();
    tooltip.innerHTML = `<strong>${values[index].toLocaleString()} parcels</strong>${labels[index]}`;
    tooltip.hidden = false;
    tooltip.style.left = `${point.cx.baseVal.value / chart.viewBox.baseVal.width * chartRect.width + chartRect.left - wrapRect.left}px`;
    tooltip.style.top = `${point.cy.baseVal.value / chart.viewBox.baseVal.height * chartRect.height + chartRect.top - wrapRect.top}px`;
  }

  function renderTable() {
    const selected = facilitySelect.value;
    const names = { chicago: "CHI", dallas: "DAL", newark: "EWR", reno: "RNO" };
    const rows = selected === "network" ? facilities : facilities.filter((facility) => facility.code === names[selected]);
    $("#facility-table-body").innerHTML = rows.map((facility) => `
      <tr>
        <td><span class="facility-name"><span class="facility-code">${facility.code}</span>${facility.name}</span></td>
        <td><span class="table-status ${facility.statusClass}">${facility.status}</span></td>
        <td class="number">${facility.processed.toLocaleString()}</td>
        <td class="progress-cell"><span class="progress-row"><span class="progress-track" aria-hidden="true"><span class="progress-fill" style="width:${Math.min(facility.plan, 100)}%"></span></span><span class="number">${facility.plan}%</span></span></td>
        <td class="number">${facility.onTime.toFixed(1)}%</td>
        <td class="number">${facility.backlog.toLocaleString()}</td>
      </tr>`).join("");
  }

  function renderDashboard() {
    const dataset = datasets[facilitySelect.value];
    const factor = rangeFactors[rangeSelect.value];
    const processed = Math.round(Number(dataset.metrics[0].replaceAll(",", "")) * factor);
    $("#metric-processed").textContent = processed.toLocaleString();
    $("#metric-ontime").textContent = dataset.metrics[1];
    $("#metric-delayed").textContent = Math.max(1, Math.round(Number(dataset.metrics[2]) * Math.min(factor, 1.9))).toLocaleString();
    $("#metric-time").textContent = dataset.metrics[3];
    const facilityLabel = facilitySelect.options[facilitySelect.selectedIndex].text;
    $("#chart-subtitle").textContent = `${rangeLabels[rangeSelect.value]} · ${facilityLabel}`;
    renderTable();
    renderChart();
  }

  function filterChanged() {
    renderDashboard();
    const facility = facilitySelect.options[facilitySelect.selectedIndex].text;
    const range = rangeSelect.options[rangeSelect.selectedIndex].text;
    announcement.textContent = `Dashboard updated for ${facility}, ${range}.`;
  }

  navToggle.addEventListener("click", toggleNavigation);
  scrim.addEventListener("click", closeMobileNav);
  sidebar.addEventListener("click", (event) => {
    if (isMobile() && event.target.closest("a")) closeMobileNav();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nav-open")) closeMobileNav();
  });
  window.addEventListener("resize", () => {
    if (!isMobile()) body.classList.remove("nav-open");
    updateNavButton();
    if (activeState === "populated") renderChart();
  });
  facilitySelect.addEventListener("change", filterChanged);
  rangeSelect.addEventListener("change", filterChanged);
  $$("[data-state]").forEach((button) => button.addEventListener("click", () => setState(button.dataset.state)));
  $("#reset-filters").addEventListener("click", () => {
    facilitySelect.value = "network";
    rangeSelect.value = "7d";
    setState("populated");
    facilitySelect.focus();
  });
  $("#retry-button").addEventListener("click", () => {
    setState("loading");
    stateTimer = window.setTimeout(() => setState("populated"), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700);
  });
  $("#refresh-button").addEventListener("click", () => {
    setState("loading");
    stateTimer = window.setTimeout(() => {
      setState("populated");
      showToast("Operations data refreshed successfully");
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
  });
  $("#export-button").addEventListener("click", () => showToast("Report prepared for export"));
  chart.addEventListener("pointerover", (event) => { if (event.target.matches(".chart-point")) showChartTooltip(event.target); });
  chart.addEventListener("pointerout", (event) => { if (event.target.matches(".chart-point")) tooltip.hidden = true; });
  chart.addEventListener("focusin", (event) => { if (event.target.matches(".chart-point")) showChartTooltip(event.target); });
  chart.addEventListener("focusout", () => { tooltip.hidden = true; });

  updateNavButton();
  setState("populated", false);
})();

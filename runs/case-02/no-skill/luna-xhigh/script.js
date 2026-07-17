(() => {
  "use strict";

  const facilities = {
    network: { label: "Network view", processed: 184260, departure: 96.8, delayed: 1482, utilization: 82.4, processedChange: "+8.4%", departureChange: "+1.2 pts", delayedChange: "+14.6%", utilizationChange: "−0.8 pts", chart: [42, 49, 55, 68, 64, 72, 81, 79, 88, 94, 102, 111, 106], plan: [45, 51, 58, 62, 69, 75, 82, 87, 91, 98, 103, 108, 114] },
    memphis: { label: "Memphis Hub", processed: 64280, departure: 98.2, delayed: 286, utilization: 88.1, processedChange: "+11.7%", departureChange: "+0.6 pts", delayedChange: "−6.2%", utilizationChange: "+2.1 pts", chart: [17, 19, 24, 28, 27, 32, 37, 36, 41, 43, 47, 50, 48], plan: [18, 21, 24, 27, 30, 33, 37, 40, 42, 45, 47, 50, 52] },
    chicago: { label: "Chicago Sort Center", processed: 51840, departure: 95.4, delayed: 514, utilization: 79.3, processedChange: "+4.8%", departureChange: "−0.4 pts", delayedChange: "+19.1%", utilizationChange: "−2.7 pts", chart: [13, 17, 16, 21, 24, 22, 29, 32, 30, 37, 41, 38, 44], plan: [15, 18, 21, 24, 26, 28, 31, 34, 36, 38, 40, 42, 45] },
    newark: { label: "Newark Gateway", processed: 38920, departure: 97.1, delayed: 338, utilization: 76.7, processedChange: "+9.2%", departureChange: "+1.8 pts", delayedChange: "+4.3%", utilizationChange: "+0.5 pts", chart: [9, 12, 15, 17, 17, 20, 24, 23, 27, 29, 31, 34, 35], plan: [10, 13, 15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
    dallas: { label: "Dallas West", processed: 29220, departure: 94.9, delayed: 344, utilization: 72.8, processedChange: "+6.3%", departureChange: "+0.2 pts", delayedChange: "+21.8%", utilizationChange: "−1.3 pts", chart: [8, 11, 13, 15, 13, 18, 20, 19, 23, 25, 27, 27, 29], plan: [9, 12, 14, 16, 17, 19, 21, 22, 24, 26, 28, 30, 31] }
  };

  const facilityRows = [
    { key: "memphis", name: "Memphis Hub", code: "MEM-01", status: "Operating", tone: "good", processed: "64,280", utilization: "88.1%", dispatch: "10:15 CT" },
    { key: "chicago", name: "Chicago Sort Center", code: "CHI-04", status: "At risk", tone: "warning", processed: "51,840", utilization: "79.3%", dispatch: "10:30 CT" },
    { key: "newark", name: "Newark Gateway", code: "EWR-02", status: "Operating", tone: "good", processed: "38,920", utilization: "76.7%", dispatch: "10:45 ET" },
    { key: "dallas", name: "Dallas West", code: "DFW-07", status: "Restricted", tone: "danger", processed: "29,220", utilization: "72.8%", dispatch: "11:00 CT" }
  ];

  const alertSets = {
    network: [
      ["Chicago · Dock 04", "Cross-dock scan backlog", "14 min", "high"],
      ["Dallas West · Lane 7", "Trailer departure exception", "22 min", "medium"],
      ["Memphis · Sorter B", "Induction rate below plan", "31 min", "medium"],
      ["Newark · Inbound", "Weather hold on 18 parcels", "42 min", "low"]
    ],
    memphis: [["Sorter B", "Induction rate below plan", "31 min", "medium"], ["Outbound 14", "3 parcels missing scan", "48 min", "low"]],
    chicago: [["Dock 04", "Cross-dock scan backlog", "14 min", "high"], ["Line 2", "Label read rate below target", "26 min", "medium"], ["Outbound 08", "Trailer seal not confirmed", "39 min", "high"]],
    newark: [["Inbound", "Weather hold on 18 parcels", "42 min", "low"], ["Dock 02", "Late linehaul arrival", "55 min", "medium"]],
    dallas: [["Lane 7", "Trailer departure exception", "22 min", "medium"], ["Dock 01", "Scanner offline", "1 hr", "high"], ["Outbound 05", "Missed dispatch cutoff", "1 hr", "high"]]
  };

  const eventSets = {
    network: [["09:41", "Chicago Sort Center", "Dock 04 moved to manual scan", "warning"], ["09:37", "Memphis Hub", "Sorter B returned to normal rate", "good"], ["09:29", "Network", "Daily dispatch plan recalculated", "blue"], ["09:18", "Newark Gateway", "Linehaul 228 departed on time", "good"]],
    memphis: [["09:37", "Sorter B", "Returned to normal rate", "good"], ["09:22", "Outbound 14", "Seal verification completed", "blue"], ["09:10", "Staffing", "Shift handoff acknowledged", "good"]],
    chicago: [["09:41", "Dock 04", "Moved to manual scan", "warning"], ["09:24", "Line 2", "Read-rate check initiated", "warning"], ["09:02", "Inbound", "Linehaul 772 received", "blue"]],
    newark: [["09:18", "Linehaul 228", "Departed on time", "good"], ["09:07", "Inbound", "Weather hold applied", "warning"], ["08:52", "Dock 02", "Unloading started", "blue"]],
    dallas: [["09:20", "Lane 7", "Departure exception created", "warning"], ["09:03", "Dock 01", "Scanner disconnected", "warning"], ["08:46", "Outbound 05", "Dispatch cutoff missed", "warning"]]
  };

  const $ = (id) => document.getElementById(id);
  const appShell = $("appShell");
  const sidebarToggle = $("sidebarToggle");
  const sidebarBackdrop = $("sidebarBackdrop");
  const facilitySelect = $("facilitySelect");
  const dateRangeSelect = $("dateRangeSelect");
  const viewStateSelect = $("viewStateSelect");
  const dashboardContent = $("dashboardContent");
  const statePanel = $("statePanel");
  let currentState = "populated";
  let toastTimer;

  function formatNumber(value) { return new Intl.NumberFormat("en-US").format(value); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function updateSidebar(expanded) {
    appShell.classList.toggle("sidebar-collapsed", !expanded);
    sidebarToggle.setAttribute("aria-expanded", String(expanded));
    sidebarToggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
    if (window.innerWidth <= 760) sidebarBackdrop.setAttribute("aria-hidden", String(expanded));
  }

  function renderMetrics() {
    const data = facilities[facilitySelect.value];
    const dateFactor = { today: 1, shift: .56, "7d": 6.2, "30d": 25.6 }[dateRangeSelect.value] || 1;
    const processed = Math.round(data.processed * (dateRangeSelect.value === "today" || dateRangeSelect.value === "shift" ? dateFactor : dateFactor / (dateRangeSelect.value === "30d" ? 5.5 : 1)));
    const delayed = Math.round(data.delayed * (dateRangeSelect.value === "today" ? 1 : dateRangeSelect.value === "shift" ? .62 : dateRangeSelect.value === "7d" ? 4.5 : 18));
    $("metricProcessed").textContent = formatNumber(processed);
    $("metricDeparture").innerHTML = `${data.departure.toFixed(1)}<span class="metric-unit">%</span>`;
    $("metricDelayed").textContent = formatNumber(delayed);
    $("metricUtilization").innerHTML = `${data.utilization.toFixed(1)}<span class="metric-unit">%</span>`;
    $("metricProcessedChange").textContent = data.processedChange;
    $("metricDepartureChange").textContent = data.departureChange;
    $("metricDelayedChange").textContent = data.delayedChange;
    $("metricUtilizationChange").textContent = data.utilizationChange;
    $("processedBar").style.width = `${Math.min(96, Math.max(18, data.processed / 2500))}%`;
    $("departureBar").style.width = `${data.departure}%`;
    $("delayedBar").style.width = `${Math.min(90, Math.max(20, data.delayed / 12))}%`;
    $("utilizationBar").style.width = `${data.utilization}%`;
    $("chartTotal").textContent = formatNumber(processed);
    $("chartPeriod").textContent = dateRangeSelect.value === "today" ? "Today · hourly" : dateRangeSelect.options[dateRangeSelect.selectedIndex].textContent;
    $("pageTitle").textContent = data.label === "Network view" ? "Network performance" : `${data.label} performance`;
  }

  function points(values, width, height, left, top, bottom, max) {
    const usableHeight = height - top - bottom;
    const usableWidth = width - left - 12;
    return values.map((value, index) => {
      const x = left + usableWidth * (index / (values.length - 1));
      const y = top + usableHeight - (value / max) * usableHeight;
      return [x, y];
    });
  }

  function renderChart() {
    const data = facilities[facilitySelect.value];
    const svg = $("volumeChart");
    const width = 760; const height = 280; const left = 32; const top = 15; const bottom = 28;
    const max = Math.ceil(Math.max(...data.chart, ...data.plan) / 20) * 20;
    const actual = points(data.chart, width, height, left, top, bottom, max);
    const plan = points(data.plan, width, height, left, top, bottom, max);
    const linePath = actual.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
    const planPath = plan.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L${actual[actual.length - 1][0].toFixed(1)} ${height - bottom} L${actual[0][0].toFixed(1)} ${height - bottom} Z`;
    const grid = [0, .25, .5, .75, 1].map((ratio) => {
      const y = top + (height - top - bottom) * ratio;
      const value = Math.round(max * (1 - ratio));
      return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - 12}" y2="${y}"></line><text class="chart-axis-label" x="0" y="${y + 3}">${value}k</text>`;
    }).join("");
    const circles = actual.map((point, index) => `<circle class="chart-point${index === actual.length - 1 ? " chart-point--last" : ""}" cx="${point[0].toFixed(1)}" cy="${point[1].toFixed(1)}" r="${index === actual.length - 1 ? 4 : 2.5}"></circle>`).join("");
    svg.innerHTML = `<defs><linearGradient id="volumeArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2b84bb" stop-opacity=".19"></stop><stop offset="100%" stop-color="#2b84bb" stop-opacity=".01"></stop></linearGradient></defs>${grid}<path class="chart-area" d="${areaPath}"></path><path class="chart-plan" d="${planPath}"></path><path class="chart-line" d="${linePath}"></path>${circles}`;
    $("chartWrap").setAttribute("aria-label", `Line chart for ${data.label}: processed parcels compared with plan for the selected date range.`);
  }

  function renderFacilityTable() {
    const selected = facilitySelect.value;
    $("facilityTableBody").innerHTML = facilityRows.map((row) => `<tr${row.key === selected ? ' class="is-focused"' : ""}><td><span class="facility-name"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small></span></td><td><span class="status-label status-label--${row.tone}"><span class="status-dot status-dot--${row.tone}" aria-hidden="true"></span>${escapeHtml(row.status)}</span></td><td>${row.processed}</td><td>${row.utilization}</td><td>${row.dispatch}</td></tr>`).join("");
    $("facilityTableNote").textContent = selected === "network" ? "Showing 4 facilities" : `Showing network · ${facilities[selected].label} focused`;
  }

  function renderAlerts() {
    const selected = facilitySelect.value;
    const alerts = alertSets[selected];
    $("alertCount").textContent = `${alerts.length + (selected === "network" ? 3 : 0)} active`;
    $("alertList").innerHTML = alerts.map(([location, detail, age, severity]) => `<div class="alert-item"><span class="alert-severity alert-severity--${severity}" aria-hidden="true"></span><span class="alert-copy"><strong>${escapeHtml(location)}</strong><span>${escapeHtml(detail)}</span></span><span class="alert-age">${escapeHtml(age)}</span></div>`).join("");
  }

  function renderEvents() {
    const events = eventSets[facilitySelect.value];
    $("eventList").innerHTML = events.map(([time, location, detail, tone]) => `<li class="event-item"><span class="event-time">${escapeHtml(time)}</span><span class="event-marker event-marker--${tone}" aria-hidden="true"></span><span class="event-copy"><strong>${escapeHtml(location)}</strong><span>${escapeHtml(detail)}</span></span></li>`).join("");
  }

  function stateMarkup(state) {
    if (state === "loading") return `<div class="state-content"><span class="state-symbol" aria-hidden="true">…</span><h2>Loading operational data</h2><p>Connecting to the facility telemetry stream. Your filters will be retained.</p><div class="loading-bar" aria-hidden="true"></div></div>`;
    if (state === "empty") return `<div class="state-content"><span class="state-symbol state-symbol--empty" aria-hidden="true">—</span><h2>No data for this view</h2><p>No parcel activity has been recorded for the selected facility and date range. Try a wider date range.</p><button class="state-action" type="button" data-action="reset-range">Use today</button></div>`;
    return `<div class="state-content"><span class="state-symbol state-symbol--error" aria-hidden="true">!</span><h2>Couldn’t load operational data</h2><p>The telemetry service did not respond. Check the connection and retry the request.</p><button class="state-action" type="button" data-action="retry">Retry data request</button></div>`;
  }

  function setState(state) {
    currentState = state;
    const isPopulated = state === "populated";
    dashboardContent.hidden = !isPopulated;
    statePanel.hidden = isPopulated;
    if (!isPopulated) {
      statePanel.innerHTML = stateMarkup(state);
      statePanel.setAttribute("aria-label", `${state} dashboard state`);
    } else {
      statePanel.innerHTML = "";
    }
    viewStateSelect.value = state;
    if (state === "populated") renderAll();
  }

  function renderAll() {
    renderMetrics(); renderChart(); renderFacilityTable(); renderAlerts(); renderEvents();
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    $("lastUpdated").textContent = `Updated ${time} local time`;
    $("footerSync").textContent = time;
  }

  sidebarToggle.addEventListener("click", () => updateSidebar(appShell.classList.contains("sidebar-collapsed")));
  sidebarBackdrop.addEventListener("click", () => updateSidebar(false));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && window.innerWidth <= 760 && !appShell.classList.contains("sidebar-collapsed")) updateSidebar(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) sidebarBackdrop.setAttribute("aria-hidden", "true"); });

  facilitySelect.addEventListener("change", () => { if (currentState === "populated") renderAll(); showToast(`Showing ${facilities[facilitySelect.value].label}`); });
  dateRangeSelect.addEventListener("change", () => { if (currentState === "populated") renderAll(); showToast(`Date range: ${dateRangeSelect.options[dateRangeSelect.selectedIndex].textContent}`); });
  viewStateSelect.addEventListener("change", () => setState(viewStateSelect.value));
  statePanel.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "retry") { setState("loading"); setTimeout(() => setState("populated"), 850); }
    if (action === "reset-range") { dateRangeSelect.value = "today"; setState("populated"); showToast("Showing the current day"); }
  });
  document.querySelectorAll("[data-nav]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); document.querySelectorAll("[data-nav]").forEach((item) => item.classList.remove("is-active")); link.classList.add("is-active"); link.setAttribute("aria-current", "page"); document.querySelectorAll("[data-nav]").forEach((item) => { if (item !== link) item.removeAttribute("aria-current"); }); showToast(`${link.dataset.nav} view is available in the operational workspace`); if (window.innerWidth <= 760) updateSidebar(false); }));
  ["viewAllAlerts", "viewFacilities", "viewAllEvents", "refreshFacilities"].forEach((id) => $(id).addEventListener("click", () => showToast(id === "refreshFacilities" ? "Facility status refreshed" : "This operational view is ready for the next workflow step")));

  updateSidebar(window.innerWidth > 760);
  renderAll();
})();

(function () {
  "use strict";

  const facilityProfiles = {
    network: { label: "All facilities", factor: 1, volume: "1.84M", ontime: "96.4%", delayed: "2,184", capacity: "78.6%", sites: "12 sites", threshold: "3 near threshold" },
    dfw: { label: "Dallas–Fort Worth", factor: .192, volume: "353K", ontime: "97.8%", delayed: "286", capacity: "82.4%", sites: "DFW-01", threshold: "within threshold" },
    mem: { label: "Memphis Gateway", factor: .168, volume: "309K", ontime: "91.8%", delayed: "694", capacity: "94.7%", sites: "MEM-02", threshold: "capacity watch" },
    ont: { label: "Ontario West", factor: .151, volume: "278K", ontime: "95.9%", delayed: "318", capacity: "86.1%", sites: "ONT-04", threshold: "within threshold" },
    abe: { label: "Lehigh Valley", factor: .126, volume: "232K", ontime: "98.2%", delayed: "121", capacity: "73.8%", sites: "ABE-03", threshold: "within threshold" }
  };

  const rangeProfiles = {
    "24h": { label: "Last 24 hours", volumeFactor: .145, volumeLabel: "267K", points: [24, 31, 38, 35, 47, 61, 58, 69, 76, 72, 83, 79], forecast: [26, 29, 36, 40, 45, 54, 60, 65, 70, 75, 78, 82], labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"] },
    "7d": { label: "Last 7 days", volumeFactor: 1, volumeLabel: "1.84M", points: [214, 237, 229, 271, 292, 301, 299], forecast: [220, 229, 241, 258, 276, 291, 297], labels: ["Mon 07", "Tue 08", "Wed 09", "Thu 10", "Fri 11", "Sat 12", "Sun 13"] },
    "30d": { label: "Last 30 days", volumeFactor: 4.19, volumeLabel: "7.72M", points: [204, 218, 211, 226, 237, 228, 245, 252, 248, 264, 258, 271, 279, 268, 286], forecast: [210, 214, 219, 224, 230, 235, 241, 247, 252, 258, 264, 270, 275, 281, 287], labels: ["14 Jun", "19 Jun", "24 Jun", "29 Jun", "04 Jul", "09 Jul", "13 Jul"] }
  };

  const facilities = [
    { name: "Dallas–Fort Worth", code: "DFW-01 · South Central", status: "Nominal", statusClass: "nominal", processed: "353,420", ontime: "97.8%", utilization: 82, backlog: "1,126", backlogClass: "" },
    { name: "Memphis Gateway", code: "MEM-02 · Central Hub", status: "Disrupted", statusClass: "disrupted", processed: "309,180", ontime: "91.8%", utilization: 95, backlog: "8,640", backlogClass: "backlog-high" },
    { name: "Ontario West", code: "ONT-04 · Pacific", status: "Watch", statusClass: "watch", processed: "278,035", ontime: "95.9%", utilization: 86, backlog: "3,218", backlogClass: "backlog-med" },
    { name: "Lehigh Valley", code: "ABE-03 · Northeast", status: "Nominal", statusClass: "nominal", processed: "232,610", ontime: "98.2%", utilization: 74, backlog: "842", backlogClass: "" },
    { name: "Atlanta Sort Center", code: "ATL-05 · Southeast", status: "Nominal", statusClass: "nominal", processed: "221,890", ontime: "96.7%", utilization: 79, backlog: "1,406", backlogClass: "" }
  ];

  const alerts = [
    { critical: true, title: "MEM-02 outbound missort backlog", detail: "694 parcels · Linehaul M-447 held at door 31", age: "11 min" },
    { critical: true, title: "I-40 weather hold affecting MEM", detail: "1,126 parcels across 3 westbound routes", age: "24 min" },
    { critical: true, title: "ONT-04 sorter lane 7 unavailable", detail: "318 parcels diverted · Maintenance onsite", age: "38 min" },
    { critical: false, title: "ATL-05 trailer arrival variance", detail: "Route ATL–CLT running 42 minutes behind", age: "51 min" }
  ];

  const events = [
    { icon: "✓", title: "DFW-01 cleared inbound surge", detail: "Dock queue returned below 12 trailers · 4 min ago" },
    { icon: "↗", title: "MEM-02 escalated to regional control", detail: "Weather contingency protocol activated · 11 min ago" },
    { icon: "W", title: "ONT-04 work order accepted", detail: "Technician assigned to sorter lane 7 · 19 min ago" },
    { icon: "L", title: "ABE-03 labor plan adjusted", detail: "+6 associates moved to smalls induction · 33 min ago" },
    { icon: "✓", title: "ATL-05 manifest audit complete", detail: "All 14 outbound loads reconciled · 46 min ago" }
  ];

  const body = document.body;
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarScrim = document.getElementById("sidebar-scrim");
  const facilitySelect = document.getElementById("facility-select");
  const rangeSelect = document.getElementById("range-select");
  const announcer = document.getElementById("state-announcer");
  const stateSections = {
    populated: document.getElementById("dashboard-populated"),
    loading: document.getElementById("dashboard-loading"),
    empty: document.getElementById("dashboard-empty"),
    error: document.getElementById("dashboard-error")
  };

  function isMobile() { return window.matchMedia("(max-width: 820px)").matches; }

  function setSidebar(open) {
    if (isMobile()) {
      body.classList.toggle("sidebar-open", open);
      body.classList.remove("sidebar-collapsed");
      sidebarScrim.hidden = !open;
    } else {
      body.classList.toggle("sidebar-collapsed", !open);
      body.classList.remove("sidebar-open");
      sidebarScrim.hidden = true;
    }
    sidebarToggle.setAttribute("aria-expanded", String(open));
    sidebarToggle.querySelector(".sr-only").textContent = open ? "Collapse navigation" : "Expand navigation";
  }

  sidebarToggle.addEventListener("click", function () {
    const currentlyOpen = isMobile() ? body.classList.contains("sidebar-open") : !body.classList.contains("sidebar-collapsed");
    setSidebar(!currentlyOpen);
  });
  sidebarScrim.addEventListener("click", function () { setSidebar(false); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isMobile() && body.classList.contains("sidebar-open")) {
      setSidebar(false);
      sidebarToggle.focus();
    }
  });
  window.addEventListener("resize", function () {
    sidebarScrim.hidden = !(isMobile() && body.classList.contains("sidebar-open"));
  });

  function renderFacilities(selected) {
    const visible = selected === "network" ? facilities : facilities.filter(function (item) { return item.code.toLowerCase().startsWith(selected); });
    document.getElementById("facility-table-body").innerHTML = visible.map(function (item) {
      const utilClass = item.utilization >= 92 ? "danger" : item.utilization >= 85 ? "warning" : "";
      return `<tr><td>${item.name}<span class="facility-code">${item.code}</span></td><td><span class="status-chip ${item.statusClass}">${item.status}</span></td><td>${item.processed}</td><td>${item.ontime}</td><td class="utilization-cell"><span class="utilization-track"><span class="utilization-fill ${utilClass}" style="width:${item.utilization}%"></span></span>${item.utilization}%</td><td class="${item.backlogClass}">${item.backlog}</td></tr>`;
    }).join("");
    document.getElementById("facility-count").textContent = selected === "network" ? "Showing 5 of 12 facilities" : `Showing ${visible.length} selected facility`;
  }

  function renderAlerts(selected) {
    let visible = alerts;
    if (selected !== "network") {
      visible = alerts.filter(function (item) { return item.title.toLowerCase().includes(selected); });
      if (!visible.length) visible = [{ critical: false, title: "No critical facility exceptions", detail: "Network monitoring remains active", age: "Now" }];
    }
    document.getElementById("alert-list").innerHTML = visible.map(function (item) {
      return `<li class="alert-item"><span class="severity-dot ${item.critical ? "critical" : ""}" aria-hidden="true"></span><div class="alert-copy"><strong>${item.title}</strong><span>${item.detail}</span></div><time class="alert-age">${item.age}</time></li>`;
    }).join("");
  }

  function renderEvents(selected) {
    const profile = facilityProfiles[selected];
    const list = selected === "network" ? events : [{ icon: "•", title: `${profile.label} view selected`, detail: "Dashboard filters updated · Just now" }].concat(events.filter(function (item) { return item.title.toLowerCase().includes(selected); }));
    document.getElementById("event-list").innerHTML = list.slice(0, 5).map(function (item) {
      return `<li class="event-item"><span class="event-icon" aria-hidden="true">${item.icon}</span><div class="event-copy"><strong>${item.title}</strong><span>${item.detail}</span></div></li>`;
    }).join("");
  }

  function formatCompact(value) {
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}M`;
    return `${Math.round(value)}K`;
  }

  function renderChart(facility, range) {
    const svg = document.getElementById("volume-chart");
    const profile = facilityProfiles[facility];
    const rangeData = rangeProfiles[range];
    const actual = rangeData.points.map(function (v) { return v * profile.factor; });
    const forecast = rangeData.forecast.map(function (v) { return v * profile.factor; });
    const max = Math.max.apply(null, actual.concat(forecast)) * 1.12;
    const width = 760, height = 260, left = 52, right = 14, top = 18, bottom = 32;
    const plotW = width - left - right, plotH = height - top - bottom;
    const x = function (i) { return left + (i * plotW / (actual.length - 1)); };
    const y = function (v) { return top + plotH - (v / max * plotH); };
    const line = function (values) { return values.map(function (v, i) { return `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`; }).join(" "); };
    const actualPath = line(actual);
    const areaPath = `${actualPath} L${x(actual.length - 1).toFixed(1)},${top + plotH} L${left},${top + plotH} Z`;
    let grid = "";
    for (let i = 0; i < 5; i += 1) {
      const gy = top + (plotH * i / 4);
      const value = max * (1 - i / 4);
      grid += `<line class="grid-line" x1="${left}" y1="${gy}" x2="${width - right}" y2="${gy}"></line><text class="axis-label" x="${left - 9}" y="${gy + 3}" text-anchor="end">${Math.round(value)}K</text>`;
    }
    const labels = rangeData.labels.map(function (label, i) {
      const lx = left + (i * plotW / (rangeData.labels.length - 1));
      return `<text class="axis-label" x="${lx}" y="${height - 8}" text-anchor="middle">${label}</text>`;
    }).join("");
    const points = actual.map(function (v, i) { return `<circle class="data-point" cx="${x(i)}" cy="${y(v)}" r="3"></circle>`; }).join("");
    svg.innerHTML = `<title id="chart-title">Parcel volume trend</title><desc id="chart-desc">${profile.label} processed parcel volume compared with forecast for ${rangeData.label.toLowerCase()}.</desc><defs><linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#155bd7" stop-opacity=".18"></stop><stop offset="1" stop-color="#155bd7" stop-opacity=".015"></stop></linearGradient></defs>${grid}${labels}<path class="area-fill" d="${areaPath}"></path><path class="forecast-line" d="${line(forecast)}"></path><path class="actual-line" d="${actualPath}"></path>${points}`;
    const totalBase = 1842600 * rangeData.volumeFactor * profile.factor;
    document.getElementById("chart-total").textContent = Math.round(totalBase).toLocaleString("en-US");
    document.getElementById("chart-subtitle").textContent = `Processed vs forecast · ${rangeData.label}`;
  }

  function updateDashboard() {
    const facility = facilitySelect.value;
    const range = rangeSelect.value;
    const profile = facilityProfiles[facility];
    const rangeProfile = rangeProfiles[range];
    const baseVolume = 1842600 * rangeProfile.volumeFactor * profile.factor;
    document.getElementById("metric-volume").textContent = facility === "network" && range === "7d" ? "1.84M" : formatCompact(baseVolume / 1000);
    document.getElementById("metric-ontime").textContent = profile.ontime;
    document.getElementById("metric-delayed").textContent = Math.max(1, Math.round(2184 * rangeProfile.volumeFactor * profile.factor)).toLocaleString("en-US");
    document.getElementById("metric-capacity").textContent = profile.capacity;
    document.getElementById("capacity-delta").textContent = profile.sites;
    document.getElementById("capacity-delta").nextElementSibling.textContent = profile.threshold;
    renderChart(facility, range);
    renderFacilities(facility);
    renderAlerts(facility);
    renderEvents(facility);
    announcer.textContent = `Dashboard updated for ${profile.label}, ${rangeProfile.label}.`;
  }

  function setViewState(state) {
    Object.keys(stateSections).forEach(function (key) { stateSections[key].hidden = key !== state; });
    announcer.textContent = state === "populated" ? "Live operational data displayed." : `${state.charAt(0).toUpperCase() + state.slice(1)} dashboard state displayed.`;
  }

  document.querySelectorAll('input[name="view-state"]').forEach(function (radio) {
    radio.addEventListener("change", function () { if (radio.checked) setViewState(radio.value); });
  });
  facilitySelect.addEventListener("change", updateDashboard);
  rangeSelect.addEventListener("change", updateDashboard);
  document.getElementById("reset-filters").addEventListener("click", function () {
    facilitySelect.value = "network";
    rangeSelect.value = "7d";
    document.getElementById("state-populated").checked = true;
    updateDashboard();
    setViewState("populated");
    facilitySelect.focus();
  });
  document.getElementById("retry-button").addEventListener("click", function () {
    document.getElementById("state-loading").checked = true;
    setViewState("loading");
    window.setTimeout(function () {
      document.getElementById("state-populated").checked = true;
      setViewState("populated");
      document.getElementById("state-populated").focus();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 700);
  });

  setSidebar(!isMobile());
  updateDashboard();
}());

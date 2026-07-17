(() => {
  'use strict';

  const state = {
    view: 'populated',
    facility: 'network',
    range: 'today'
  };

  const facilities = {
    network: { label: 'All facilities', base: 184260, completion: 93.4, dispatch: 96.1, risk: 1842, peak: 21640, peakHour: '07:00', values: [2380, 4280, 7020, 11520, 15640, 18970, 20780, 21640, 20510, 17580, 13940] },
    kl: { label: 'Kuala Lumpur Sort Centre', base: 72480, completion: 96.8, dispatch: 97.2, risk: 364, peak: 8520, peakHour: '07:00', values: [960, 1700, 2780, 4510, 6180, 7480, 8160, 8520, 7860, 6700, 5500] },
    johor: { label: 'Johor Gateway Hub', base: 51320, completion: 89.1, dispatch: 93.8, risk: 715, peak: 6030, peakHour: '07:00', values: [710, 1220, 2060, 3310, 4380, 5240, 5800, 6030, 5810, 5140, 4260] },
    penang: { label: 'Penang Regional Depot', base: 28940, completion: 94.5, dispatch: 96.7, risk: 209, peak: 3380, peakHour: '07:00', values: [410, 720, 1130, 1740, 2360, 2830, 3210, 3380, 3070, 2510, 2010] }
  };

  const rangeMultipliers = { today: 1, '7d': 6.68, '30d': 28.2 };
  const rangeLabels = { today: 'Current day', '7d': 'Last 7 days', '30d': 'Last 30 days' };

  const dashboard = document.getElementById('dashboardView');
  const facilitySelect = document.getElementById('facilitySelect');
  const dateRangeSelect = document.getElementById('dateRangeSelect');
  const stateButtons = Array.from(document.querySelectorAll('.state-button'));
  const viewNotice = document.getElementById('viewNotice');
  const scopeCopy = document.getElementById('scopeCopy');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const populatedMarkup = dashboard.innerHTML;
  const templates = {
    loading: document.getElementById('loadingTemplate'),
    empty: document.getElementById('emptyTemplate'),
    error: document.getElementById('errorTemplate')
  };

  const formatNumber = (value) => new Intl.NumberFormat('en-MY').format(Math.round(value));

  function getData() {
    const source = facilities[state.facility];
    const multiplier = rangeMultipliers[state.range];
    return {
      ...source,
      inducted: Math.round(source.base * multiplier),
      capacity: Math.round(source.base * 1.172 * multiplier)
    };
  }

  function updateScope() {
    const data = getData();
    scopeCopy.textContent = `${data.label} · ${rangeLabels[state.range]}`;
  }

  function plotChart(data) {
    const maxY = Math.max(...data.values) > 10000 ? 24000 : Math.ceil(Math.max(...data.values) / 1000) * 1000;
    const left = 48;
    const right = 760;
    const top = 30;
    const bottom = 242;
    const scaleX = (right - left) / (data.values.length - 1);
    const scaleY = (bottom - top) / maxY;
    const points = data.values.map((value, index) => ({ x: left + index * scaleX, y: bottom - value * scaleY }));
    const pointString = points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const peakIndex = data.values.indexOf(Math.max(...data.values));
    const peak = points[peakIndex];
    const line = document.getElementById('chartLine');
    const area = document.getElementById('chartArea');
    const dot = document.getElementById('peakDot');
    const callout = document.getElementById('peakCallout');
    if (!line || !area || !dot || !callout) return;

    line.setAttribute('points', pointString);
    area.setAttribute('d', `M ${left},${bottom} L ${pointString.replace(/ /g, ' L ')} L ${right},${bottom} Z`);
    dot.setAttribute('cx', peak.x.toFixed(1));
    dot.setAttribute('cy', peak.y.toFixed(1));
    const calloutX = Math.min(676, Math.max(54, peak.x - 36));
    const calloutY = Math.max(4, peak.y - 39);
    callout.setAttribute('transform', `translate(${calloutX.toFixed(1)} ${calloutY.toFixed(1)})`);
  }

  function populateDashboard() {
    const data = getData();
    document.querySelectorAll('[data-metric="inducted"]').forEach((node) => { node.textContent = formatNumber(data.inducted); });
    document.querySelectorAll('[data-metric="completion"]').forEach((node) => { node.textContent = `${data.completion.toFixed(1)}%`; });
    document.querySelectorAll('[data-metric="dispatch"]').forEach((node) => { node.textContent = `${data.dispatch.toFixed(1)}%`; });
    document.querySelectorAll('[data-metric="risk"]').forEach((node) => { node.textContent = formatNumber(data.risk * rangeMultipliers[state.range]); });
    document.getElementById('chartSummary').textContent = `Peak: ${formatNumber(data.peak)} parcels at ${data.peakHour} · Target capacity: ${formatNumber(Math.ceil(data.peak * 1.11))}/hr`;
    document.querySelector('.chart-footer span:last-child strong').textContent = formatNumber(data.capacity);
    document.getElementById('chart-desc').textContent = `A line chart showing inducted parcel volume from midnight to 10 AM for ${data.label}. Peak volume is ${formatNumber(data.peak)} parcels at ${data.peakHour}.`;
    plotChart(data);
  }

  function setDashboardMarkup(view) {
    if (view === 'populated') {
      dashboard.innerHTML = populatedMarkup;
      populateDashboard();
      document.getElementById('reviewAlerts').addEventListener('click', () => document.getElementById('facility-status').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }));
      return;
    }
    dashboard.replaceChildren(templates[view].content.cloneNode(true));
    if (view === 'empty') document.getElementById('resetFilters').addEventListener('click', resetFilters);
    if (view === 'error') document.getElementById('retryLoad').addEventListener('click', () => setView('loading'));
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setView(nextView) {
    state.view = nextView;
    dashboard.dataset.state = nextView;
    setDashboardMarkup(nextView);
    stateButtons.forEach((button) => {
      const selected = button.dataset.state === nextView;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const notices = {
      populated: 'Live operational data is displayed.',
      loading: 'Updating operational data.',
      empty: 'No records match the active filters.',
      error: 'Operational data connection needs attention.'
    };
    viewNotice.textContent = notices[nextView];
  }

  function resetFilters() {
    facilitySelect.value = 'network';
    dateRangeSelect.value = 'today';
    state.facility = 'network';
    state.range = 'today';
    updateScope();
    setView('populated');
    facilitySelect.focus();
  }

  function toggleSidebar() {
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    if (isMobile) {
      const open = sidebar.classList.toggle('mobile-open');
      mobileNavToggle.setAttribute('aria-expanded', String(open));
      mobileNavToggle.querySelector('span:last-child').textContent = open ? 'Close' : 'Menu';
      return;
    }
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
    sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
    sidebarToggle.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
  }

  sidebarToggle.addEventListener('click', toggleSidebar);
  mobileNavToggle.addEventListener('click', toggleSidebar);
  facilitySelect.addEventListener('change', (event) => { state.facility = event.target.value; updateScope(); if (state.view === 'populated') populateDashboard(); });
  dateRangeSelect.addEventListener('change', (event) => { state.range = event.target.value; updateScope(); if (state.view === 'populated') populateDashboard(); });
  stateButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.state)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.querySelector('span:last-child').textContent = 'Menu';
      mobileNavToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 760px)').matches && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.querySelector('span:last-child').textContent = 'Menu';
    }
  });

  updateScope();
  populateDashboard();
})();

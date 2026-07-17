(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  const runButton = document.querySelector('#run-simulation');
  const laneButtons = [...document.querySelectorAll('.agent-lane')];
  const billingButtons = [...document.querySelectorAll('.billing-choice')];
  const priceValues = [...document.querySelectorAll('[data-monthly]')];
  const toast = document.querySelector('#toast');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const agents = {
    aria: {
      name: 'ARIA', status: 'BUILDING', statusClass: 'status-live', copy: 'Rehydrating a signed-out cart without changing the payment boundary.',
      files: ['cart/restore.ts', 'session/return.ts'], dependency: 'Depends on: auth/session contract', event: 'last trace 18s ago'
    },
    moss: {
      name: 'MOSS', status: 'VERIFYING', statusClass: 'status-watch', copy: 'Testing every retry key against the ledger before the failure lab can begin.',
      files: ['retry/ledger.ts', 'payment/key.ts'], dependency: 'Unblocks: Vector failure tests', event: 'test suite running'
    },
    vector: {
      name: 'VECTOR', status: 'WAITING', statusClass: 'status-queued', copy: 'Holding its failure lab until the idempotency contract returns a verified shape.',
      files: ['recovery.spec.ts', 'fixtures/stale.ts'], dependency: 'Depends on: Moss contract map', event: 'dependency acknowledged'
    }
  };

  const simulationStates = [
    {
      aria: { status: 'BUILDING', cls: 'status-live', progress: 72 },
      moss: { status: 'VERIFYING', cls: 'status-watch', progress: 88 },
      vector: { status: 'WAITING', cls: 'status-queued', progress: 34 },
      returnText: 'waiting for verified output', toast: 'Relay mapped the dependency: Vector is waiting on Moss.'
    },
    {
      aria: { status: 'VERIFYING', cls: 'status-watch', progress: 91 },
      moss: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      vector: { status: 'BUILDING', cls: 'status-live', progress: 61 },
      returnText: 'Moss returned contract evidence', toast: 'Moss returned a verified contract map. Vector has started its failure lab.'
    },
    {
      aria: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      moss: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      vector: { status: 'VERIFYING', cls: 'status-watch', progress: 89 },
      returnText: '2 reviewed outputs ready', toast: 'Two lanes are reviewable. Relay is keeping the final test lane in view.'
    },
    {
      aria: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      moss: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      vector: { status: 'RETURNED', cls: 'status-live', progress: 100 },
      returnText: 'mission ready for integration', toast: 'All lanes returned evidence. The orchestrator can now prepare an ordered integration.'
    }
  ];

  let simulationIndex = 0;
  let toastTimer;

  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3600);
  };

  const selectLane = (id) => {
    const agent = agents[id];
    laneButtons.forEach((button) => {
      const selected = button.dataset.agent === id;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#inspect-agent').textContent = agent.name;
    const status = document.querySelector('#inspect-status');
    status.textContent = agent.status;
    status.className = `status ${agent.statusClass}`;
    document.querySelector('#inspect-copy').textContent = agent.copy;
    document.querySelector('#file-chips').innerHTML = agent.files.map((file) => `<code>${file}</code>`).join('');
    document.querySelector('#inspect-dependency').textContent = agent.dependency;
    document.querySelector('#inspect-event').textContent = agent.event;
  };

  const setLaneStatus = (id, state) => {
    const button = document.querySelector(`[data-agent="${id}"]`);
    const status = button.querySelector('.status');
    const progress = button.querySelector('.agent-progress');
    const bar = button.querySelector('.track i');
    status.textContent = state.status;
    status.className = `status ${state.cls}`;
    progress.textContent = `${state.progress}%`;
    bar.style.setProperty('--p', `${state.progress}%`);
    if (button.classList.contains('selected')) {
      agents[id].status = state.status;
      agents[id].statusClass = state.cls;
      document.querySelector('#inspect-status').textContent = state.status;
      document.querySelector('#inspect-status').className = `status ${state.cls}`;
    }
  };

  const advanceSimulation = () => {
    simulationIndex = (simulationIndex + 1) % simulationStates.length;
    const state = simulationStates[simulationIndex];
    Object.keys(agents).forEach((id) => setLaneStatus(id, state[id]));
    document.querySelector('#return-message').textContent = state.returnText;
    runButton.innerHTML = simulationIndex === simulationStates.length - 1 ? 'Restart mission <span aria-hidden="true">↻</span>' : 'Run next handoff <span aria-hidden="true">▶</span>';
    showToast(state.toast);
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    siteNav.classList.toggle('open', !open);
  });

  siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));

  laneButtons.forEach((button) => button.addEventListener('click', () => selectLane(button.dataset.agent)));
  runButton.addEventListener('click', advanceSimulation);

  billingButtons.forEach((button) => button.addEventListener('click', () => {
    const billing = button.dataset.billing;
    billingButtons.forEach((choice) => {
      const active = choice === button;
      choice.classList.toggle('active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    priceValues.forEach((price) => { price.textContent = price.dataset[billing]; });
    showToast(billing === 'annual' ? 'Annual billing selected. Your team saves 20% per seat.' : 'Monthly billing selected.');
  }));

  document.querySelectorAll('a.button').forEach((button) => button.addEventListener('click', (event) => {
    if (button.getAttribute('href') === '#top') return;
    if (button.getAttribute('href') === '#console') showToast('Control room opened. Select an agent lane or run a handoff.');
  }));

  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) showToast('Reduced-motion preference detected. Relay will keep updates instantaneous.');
  });
})();

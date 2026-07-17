(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');
  const navLinks = navigation.querySelectorAll('a');

  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });

  const runStates = {
    dispatch: {
      tab: 'tab-dispatch',
      note: 'Scoping worktree boundaries and dispatching lanes',
      branches: '04',
      files: '12',
      clock: '08:42',
      output: ['Awaiting completed lanes', '0 checks passed · merge gate closed', 'PENDING'],
      lanes: [
        ['QUEUED', 0, 'No dependencies', 'queued'],
        ['BLOCKED', 0, 'Waits for architecture map', 'blocked'],
        ['QUEUED', 0, 'No dependencies', 'queued'],
        ['BLOCKED', 0, 'Waits for UI + data', 'blocked']
      ]
    },
    build: {
      tab: 'tab-build',
      note: 'Monitoring two active lanes and routing one completed handoff',
      branches: '04',
      files: '27',
      clock: '24:16',
      output: ['Architecture map returned', '14 checks passed · 3 lanes remain', '1 / 4 HOME'],
      lanes: [
        ['COMPLETE', 100, 'Returned contract to UI lane', 'complete'],
        ['WORKING', 68, 'Architecture map received', 'active'],
        ['WORKING', 82, 'No dependencies', 'active'],
        ['BLOCKED', 12, 'Waits for UI + data', 'blocked']
      ]
    },
    merge: {
      tab: 'tab-merge',
      note: 'Reviewing return packets and sequencing integration',
      branches: '04',
      files: '31',
      clock: '41:03',
      output: ['Four return packets ready', '38 checks passed · conflict scan clean', 'MERGE READY'],
      lanes: [
        ['COMPLETE', 100, 'Boundary contract accepted', 'complete'],
        ['COMPLETE', 100, 'Session shell checks passed', 'complete'],
        ['COMPLETE', 100, 'Storage audit accepted', 'complete'],
        ['COMPLETE', 100, 'Regression matrix passed', 'complete']
      ]
    }
  };

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const lanes = [...document.querySelectorAll('.agent-lane')];
  const playButton = document.querySelector('[data-play]');
  const runBoard = document.querySelector('#run-board');
  let sequenceTimers = [];

  function clearSequence() {
    sequenceTimers.forEach(window.clearTimeout);
    sequenceTimers = [];
    playButton.removeAttribute('aria-pressed');
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Play sequence';
  }

  function updateRun(stateName, focusTab = false) {
    const state = runStates[stateName];
    if (!state) return;

    tabs.forEach((tab) => {
      const selected = tab.dataset.state === stateName;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });

    runBoard.setAttribute('aria-labelledby', state.tab);
    document.querySelector('#orchestrator-note').textContent = state.note;
    document.querySelector('#branch-count').textContent = state.branches;
    document.querySelector('#file-count').textContent = state.files;
    document.querySelector('#run-clock').textContent = state.clock;
    document.querySelector('#output-title').textContent = state.output[0];
    document.querySelector('#output-detail').textContent = state.output[1];
    document.querySelector('#merge-state').textContent = state.output[2];
    document.querySelector('#output-card').classList.toggle('is-ready', stateName === 'merge');

    lanes.forEach((lane, index) => {
      const [status, progress, dependency, visualState] = state.lanes[index];
      lane.classList.toggle('is-active', visualState === 'active');
      lane.classList.toggle('is-complete', visualState === 'complete');
      lane.classList.toggle('is-blocked', visualState === 'blocked');
      lane.querySelector('.status-tag').textContent = status;
      lane.querySelector('.dependency').textContent = dependency;
      const progressBar = lane.querySelector('.progress');
      progressBar.setAttribute('aria-label', `${progress} percent complete`);
      progressBar.querySelector('i').style.setProperty('--progress', `${progress}%`);
      lane.querySelector('.lane-status b').textContent = `${progress}%`;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      clearSequence();
      updateRun(tab.dataset.state);
    });

    tab.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex !== index) {
        event.preventDefault();
        clearSequence();
        updateRun(tabs[nextIndex].dataset.state, true);
      }
    });
  });

  playButton.addEventListener('click', () => {
    clearSequence();
    playButton.setAttribute('aria-pressed', 'true');
    playButton.innerHTML = '<span aria-hidden="true">■</span> Running';

    if (reducedMotion.matches) {
      updateRun('merge');
      playButton.innerHTML = '<span aria-hidden="true">↺</span> Replay sequence';
      playButton.setAttribute('aria-pressed', 'false');
      return;
    }

    updateRun('dispatch');
    sequenceTimers.push(window.setTimeout(() => updateRun('build'), 850));
    sequenceTimers.push(window.setTimeout(() => {
      updateRun('merge');
      playButton.innerHTML = '<span aria-hidden="true">↺</span> Replay sequence';
      playButton.setAttribute('aria-pressed', 'false');
      sequenceTimers = [];
    }, 1850));
  });

  const workflowButtons = [...document.querySelectorAll('.workflow-step button')];

  workflowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      const willOpen = button.getAttribute('aria-expanded') !== 'true';

      workflowButtons.forEach((otherButton) => {
        const otherPanel = document.getElementById(otherButton.getAttribute('aria-controls'));
        otherButton.setAttribute('aria-expanded', 'false');
        otherButton.querySelector('i').textContent = '+';
        otherButton.closest('.workflow-step').classList.remove('is-open');
        otherPanel.hidden = true;
      });

      if (willOpen) {
        button.setAttribute('aria-expanded', 'true');
        button.querySelector('i').textContent = '−';
        button.closest('.workflow-step').classList.add('is-open');
        target.hidden = false;
      }
    });
  });

  const billingButtons = [...document.querySelectorAll('[data-billing]')];
  const pricing = {
    monthly: { value: '32', period: '/ month', note: 'Billed monthly. Cancel any time.' },
    annual: { value: '26', period: '/ month', note: 'Billed as $307 annually. Save 20%.' }
  };

  billingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const plan = pricing[button.dataset.billing];
      billingButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      document.querySelector('#price-value').textContent = plan.value;
      document.querySelector('#price-period').textContent = plan.period;
      document.querySelector('#billing-note').textContent = plan.note;
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760 && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
})();

const openers = new WeakMap();

export function setupDialog(dialog) {
  dialog.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const opener = openers.get(dialog);
    if (opener?.isConnected) opener.focus();
    openers.delete(dialog);
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])')]
      .filter((item) => !item.hidden && item.getAttribute('aria-hidden') !== 'true');
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function openDialog(dialog, opener) {
  if (dialog.open) dialog.close();
  openers.set(dialog, opener);
  dialog.showModal();
}

function element(tag, text, attrs = {}) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  for (const [name, value] of Object.entries(attrs)) item.setAttribute(name, value);
  return item;
}

export function derivedCaptureStatus(capture) {
  if (capture?.path) return { kind: 'captured', text: capture.label };
  if (capture?.failureReason) return { kind: 'failure', text: `Capture unavailable · ${capture.failureReason}` };
  return { kind: 'missing', text: 'Capture record missing' };
}

export function createImageViewer(data) {
  const dialog = document.getElementById('image-dialog');
  const title = document.getElementById('image-dialog-title');
  const kicker = document.getElementById('image-dialog-kicker');
  const body = document.getElementById('image-dialog-body');
  setupDialog(dialog);
  let runIndex = 0;
  let opener = null;

  function showCapture(run, capture, image, caption) {
    image.src = capture.path;
    image.alt = `${run.caseName}, ${run.modelLabel}, ${run.conditionLabel} — ${capture.label}`;
    const viewport = capture.captureViewport;
    caption.textContent = viewport ? `${capture.label} · ${viewport.width} × ${viewport.height}` : `${capture.label} · dimensions loading`;
    if (!viewport) image.addEventListener('load', () => { caption.textContent = `${capture.label} · ${image.naturalWidth} × ${image.naturalHeight}`; }, { once: true });
  }

  function renderRun() {
    const run = data.runs[runIndex];
    title.textContent = `${run.modelLabel} · ${run.conditionLabel}`;
    kicker.textContent = `${run.caseName} · ${run.id}`;
    const navigation = element('div', null, { class: 'viewer-navigation' });
    const previous = element('button', 'Previous run', { type: 'button' });
    const next = element('button', 'Next run', { type: 'button' });
    previous.addEventListener('click', () => { runIndex = (runIndex - 1 + data.runs.length) % data.runs.length; renderRun(); });
    next.addEventListener('click', () => { runIndex = (runIndex + 1) % data.runs.length; renderRun(); });
    navigation.append(previous, element('code', run.id), next);

    const groups = element('div', null, { class: 'image-groups' });
    const derived = element('div', null, { role: 'group', 'aria-label': 'Publication-time derived captures' });
    derived.append(element('strong', 'Publication-time derived captures'));
    const original = element('div', null, { role: 'group', 'aria-label': 'Original benchmark screenshots' });
    original.append(element('strong', 'Original benchmark screenshots'));
    const figure = element('figure');
    const image = element('img', null, { loading: 'eager' });
    const caption = element('figcaption');
    figure.append(image, caption);
    for (const variant of ['desktop', 'mobile']) {
      const capture = run.derivedCaptures[variant];
      const status = derivedCaptureStatus(capture);
      if (status.kind === 'captured') {
        const button = element('button', variant === 'desktop' ? 'Desktop 1440 × 900' : 'Mobile 390 × 844', { type: 'button' });
        button.addEventListener('click', () => showCapture(run, capture, image, caption));
        derived.append(button);
      } else derived.append(element('span', `${variant === 'desktop' ? 'Desktop' : 'Mobile'}: ${status.text}`));
    }
    if (run.originalScreenshots.length) {
      run.originalScreenshots.forEach((capture, index) => {
        const button = element('button', `Original ${index + 1}`, { type: 'button' });
        button.addEventListener('click', () => showCapture(run, capture, image, caption));
        original.append(button);
      });
    } else {
      original.append(element('span', 'No original benchmark screenshot evidence for this run.'));
    }
    groups.append(derived, original);
    const initial = run.derivedCaptures.desktop?.path ? run.derivedCaptures.desktop : run.derivedCaptures.mobile;
    if (initial?.path) {
      body.replaceChildren(navigation, groups, figure);
      showCapture(run, initial, image, caption);
    } else body.replaceChildren(navigation, groups, element('p', 'No standardized derived capture can be displayed for this run.', { class: 'empty-state' }));
  }

  return {
    open(runId, trigger) {
      const index = data.runs.findIndex((run) => run.id === runId);
      if (index < 0) return;
      runIndex = index;
      opener = trigger;
      renderRun();
      openDialog(dialog, opener);
    }
  };
}

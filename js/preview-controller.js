import { getRun } from './data-store.js';
import { openDialog, setupDialog } from './dialogs.js';

export const PREVIEW_SANDBOX = 'allow-scripts allow-forms allow-modals';
export const PREVIEW_VIEWPORTS = Object.freeze({
  desktop: { width: 1440, height: 900, label: 'Desktop 1440px' },
  mobile: { width: 390, height: 844, label: 'Mobile 390px' }
});

function element(tag, text, attrs = {}) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  for (const [name, value] of Object.entries(attrs)) item.setAttribute(name, value);
  return item;
}

export function buildSandboxedFrame(data, runId, viewportName = 'desktop') {
  const run = getRun(data, runId);
  const viewport = PREVIEW_VIEWPORTS[viewportName];
  if (!viewport) throw new Error('Unknown preview viewport');
  const frame = document.createElement('iframe');
  frame.src = run.previewPath;
  frame.setAttribute('sandbox', PREVIEW_SANDBOX);
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('title', `${run.caseName} — ${run.modelLabel} — ${run.conditionLabel} isolated preview`);
  frame.setAttribute('width', String(viewport.width));
  frame.setAttribute('height', String(viewport.height));
  return frame;
}

export function unloadPreview(container, restoreFocusTo = null) {
  const frame = container.querySelector('iframe');
  if (frame) {
    frame.src = 'about:blank';
    frame.remove();
  }
  if (restoreFocusTo?.isConnected) restoreFocusTo.focus();
}

export function mountPreview({ data, runId, container, controls, status, title = null, includeIsolatedLink = false, restoreFocusTo = null }) {
  const run = getRun(data, runId);
  let viewportName = 'desktop';
  let disposed = false;

  function renderFrame() {
    if (disposed) return;
    unloadPreview(container);
    container.tabIndex = 0;
    container.setAttribute('aria-label', `${run.id} scrollable isolated preview viewport`);
    container.append(buildSandboxedFrame(data, run.id, viewportName));
  }

  const identity = element('div', null, { class: 'preview-identity' });
  identity.append(
    element('strong', `${run.caseName} · ${run.modelLabel} · ${run.conditionLabel}`),
    element('code', run.id),
    element('span', 'Finalized sanitized implementation · sandbox: allow-scripts allow-forms allow-modals')
  );
  const actions = element('div', null, { class: 'preview-actions' });
  for (const [name, viewport] of Object.entries(PREVIEW_VIEWPORTS)) {
    const button = element('button', viewport.label, { type: 'button', 'aria-pressed': String(name === viewportName) });
    button.addEventListener('click', () => {
      viewportName = name;
      actions.querySelectorAll('[aria-pressed]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderFrame();
    });
    actions.append(button);
  }
  const reload = element('button', 'Reload preview', { type: 'button' });
  reload.addEventListener('click', renderFrame);
  actions.append(reload);
  if (includeIsolatedLink) actions.append(element('a', 'Open isolated preview page', { href: `preview.html#run=${encodeURIComponent(run.id)}` }));
  controls.hidden = false;
  controls.replaceChildren(identity, actions);
  status.textContent = `Previewing ${run.id}. The implementation is loaded only inside a sandboxed iframe.`;
  if (title) title.textContent = `${run.modelLabel} · ${run.conditionLabel}`;
  renderFrame();
  return {
    run,
    reload: renderFrame,
    unload() {
      disposed = true;
      unloadPreview(container, restoreFocusTo);
      container.removeAttribute('tabindex');
      container.removeAttribute('aria-label');
      controls.replaceChildren();
      controls.hidden = true;
    }
  };
}

export function createEmbeddedPreview(data) {
  const dialog = document.getElementById('preview-dialog');
  const container = document.getElementById('embedded-preview-container');
  const controls = document.getElementById('embedded-preview-controls');
  const title = document.getElementById('embedded-preview-title');
  const status = element('p', '', { class: 'sr-status', role: 'status' });
  controls.before(status);
  setupDialog(dialog);
  let session = null;
  dialog.addEventListener('close', () => {
    session?.unload();
    session = null;
  });
  return {
    open(runId, opener) {
      session?.unload();
      session = mountPreview({ data, runId, container, controls, status, title, includeIsolatedLink: true, restoreFocusTo: opener });
      openDialog(dialog, opener);
    },
    close() {
      if (dialog.open) dialog.close();
      else {
        session?.unload();
        session = null;
      }
    }
  };
}

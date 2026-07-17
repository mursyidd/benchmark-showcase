import { loadBenchmark, getRun } from './data-store.js';
import { mountPreview } from './preview-controller.js';
import { readHash } from './router.js';

const data = await loadBenchmark();
const title = document.getElementById('preview-title');
const status = document.getElementById('preview-status');
const controls = document.getElementById('preview-controls');
const container = document.getElementById('preview-container');
const schema = { $sections: new Set(), run: new Set(data.runs.map((run) => run.id)) };
let session = null;

function rejectRun() {
  session?.unload();
  session = null;
  controls.replaceChildren();
  controls.hidden = true;
  container.replaceChildren();
title.textContent = 'Isolated evidence preview';
  status.textContent = 'Unknown or invalid run ID';
}

function route() {
  const parsed = readHash(schema);
  if (parsed.invalid || !parsed.values.run) {
    rejectRun();
    return;
  }
  try {
    getRun(data, parsed.values.run);
    session?.unload();
    session = mountPreview({ data, runId: parsed.values.run, container, controls, status, title });
document.title = `${session.run.modelLabel} · Isolated evidence preview`;
  } catch {
    rejectRun();
  }
}

route();
window.addEventListener('hashchange', route);

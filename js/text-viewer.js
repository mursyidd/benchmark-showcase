import { openDialog, setupDialog } from './dialogs.js';

export async function loadExactText(url, codeElement) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load canonical text: ${response.status}`);
  const contents = await response.text();
  codeElement.textContent = contents;
  return contents;
}

function element(tag, text, attrs = {}) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  for (const [name, value] of Object.entries(attrs)) item.setAttribute(name, value);
  return item;
}

async function copyExactText(contents, status) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(contents);
    copied = true;
  } catch {
    try {
      const input = element('textarea');
      input.value = contents;
      input.setAttribute('aria-hidden', 'true');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.append(input);
      input.select();
      copied = document.execCommand('copy') === true;
      input.remove();
    } catch { copied = false; }
  }
  status.textContent = copied ? 'Copied exact text.' : 'Copy failed. Select the text and copy it manually.';
}

export function createTextViewer(data) {
  const dialog = document.getElementById('text-dialog');
  const title = document.getElementById('text-dialog-title');
  const kicker = document.getElementById('text-dialog-kicker');
  const meta = document.getElementById('text-dialog-meta');
  const code = document.getElementById('text-dialog-code');
  setupDialog(dialog);

  async function show({ label, context, path, checksum = null, allowRawLink = false }, opener) {
    title.textContent = label;
    kicker.textContent = context;
    code.textContent = 'Loading exact text…';
    const status = element('span', '', { id: 'copy-status', role: 'status', 'aria-live': 'polite' });
    const copy = element('button', 'Copy exact text', { type: 'button' });
    const items = [checksum ? element('code', `SHA-256 ${checksum}`) : null];
    if (allowRawLink) items.push(element('a', 'Open canonical plain-text file', { href: path }));
    items.push(copy, status);
    meta.replaceChildren(...items.filter(Boolean));
    openDialog(dialog, opener);
    try {
      const contents = await loadExactText(path, code);
      copy.addEventListener('click', () => copyExactText(contents, status));
    } catch (error) {
      code.textContent = error.message;
      copy.disabled = true;
    }
  }

  return {
    openPrompt(promptId, opener) {
      const prompt = data.prompts.find((item) => item.id === promptId);
      if (!prompt) return;
      return show({ label: prompt.label, context: `${prompt.conditionId} · ${prompt.usedByRuns.length} runs`, path: prompt.path, checksum: prompt.checksum, allowRawLink: true }, opener);
    },
    openSkill(opener) {
      return show({ label: data.skill.name, context: 'Exact tested SKILL.md · New Skill condition', path: data.skill.path, checksum: data.skill.checksum, allowRawLink: true }, opener);
    },
    openSource(specifier, opener) {
      const separator = specifier.lastIndexOf(':');
      if (separator < 1) return;
      const runId = specifier.slice(0, separator);
      const filename = specifier.slice(separator + 1);
      const run = data.runs.find((item) => item.id === runId);
      const source = run?.sourceFiles.find((item) => item.name === filename);
      if (!source) return;
      return show({ label: filename, context: `${run.id} · escaped sanitized source`, path: source.path, checksum: source.checksum, allowRawLink: false }, opener);
    }
  };
}

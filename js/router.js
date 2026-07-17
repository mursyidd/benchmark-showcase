export function readHash(schema, hash = globalThis.location?.hash || '') {
  const raw = hash.replace(/^#/, '');
  if (!raw) return { values: {}, section: null, invalid: false };
  if (!raw.includes('=')) return schema.$sections?.has(raw)
    ? { values: {}, section: raw, invalid: false }
    : { values: {}, section: null, invalid: true };
  const params = new URLSearchParams(raw);
  const values = {};
  for (const [key, value] of params) {
    if (key.startsWith('$') || !schema[key] || Object.hasOwn(values, key) || !schema[key].has(value)) {
      return { values: {}, section: null, invalid: true };
    }
    values[key] = value;
  }
  if (['run', 'prompt', 'source'].some((key) => values[key]) && Object.keys(values).length !== 1) return { values: {}, section: null, invalid: true };
  return { values, section: null, invalid: false };
}

export function writeHash(values, schema) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (!value || !schema[key]?.has(value)) continue;
    params.set(key, value);
  }
  const next = params.toString();
  history.replaceState(null, '', `${location.pathname}${location.search}${next ? `#${next}` : '#run-explorer'}`);
}

export function rejectInvalidHash() {
  history.replaceState(null, '', `${location.pathname}${location.search}#run-explorer`);
}

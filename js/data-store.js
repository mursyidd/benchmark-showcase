let dataPromise;

export async function loadBenchmark() {
  dataPromise ||= fetch(new URL('../data/benchmark.json', import.meta.url))
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load benchmark data: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (data?.runs?.length !== 18 || data?.prompts?.length !== 6) throw new Error('Benchmark data shape is invalid');
      if (new Set(data.runs.map((run) => run.id)).size !== 18 || new Set(data.prompts.map((prompt) => prompt.id)).size !== 6) throw new Error('Benchmark IDs must be unique');
      if (data.runs.some((run) => !run.id || !run.previewPath || !Array.isArray(run.sourceFiles))) throw new Error('Benchmark run records are incomplete');
      if (data.prompts.some((prompt) => !prompt.id || !prompt.path || !prompt.checksum)) throw new Error('Benchmark prompt records are incomplete');
      return data;
    });
  return dataPromise;
}

export function getRun(data, runId) {
  if (!/^case-0[1-3]-(new-skill|no-skill)-(luna-xhigh|sol-high|terra-xhigh)$/.test(runId || '')) {
    throw new Error('Unknown or malformed run ID');
  }
  const run = data.runs.find((candidate) => candidate.id === runId);
  if (!run) throw new Error('Unknown or malformed run ID');
  return run;
}
